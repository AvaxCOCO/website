// api/auth/x/user.js
// Fetches user data from X API using client-provided token,
// updates DB, associates user with session, and handles referral tracking.

const fetch = require('node-fetch');
const db = require('../../db'); // Use the database module
const sessionMiddleware = require('../../_middleware/session'); // Import session middleware
require('dotenv').config(); // Ensure env vars are loaded

// Referral point values (centralize if used elsewhere)
const REFERRAL_POINTS = {
    visit: 5,
    email: 10,
    x_connect: 15,
    wallet_connect: 20
};

// Helper function to track referral (can be moved to utils)
async function trackReferral(eventType, referrerCode, visitorIdentifier) {
    console.log(`Attempting to track referral: ${eventType}, Code: ${referrerCode}, Visitor: ${visitorIdentifier}`);
    if (!referrerCode || !visitorIdentifier) {
        console.log('Skipping referral track: Missing referrer code or visitor identifier.');
        return false;
    }

    try {
        const referrer = await db.getUserByReferralCode(referrerCode);
        if (!referrer) {
            console.log(`Referrer not found for code: ${referrerCode}`);
            return false;
        }

        const points = REFERRAL_POINTS[eventType] || 0;
        if (points === 0) {
             console.log(`No points defined for event type: ${eventType}`);
             return false;
        }

        // Log the event - this handles duplicate prevention
        // Use the NEWLY created/found internal DB user ID as the visitorIdentifier for x_connect
        const logged = await db.logReferralEvent(referrer.id, visitorIdentifier.toString(), eventType, points);

        if (logged) {
            await db.updateUserReferralPoints(referrer.id, points);
            console.log(`Referral event ${eventType} logged successfully for referrer ${referrer.id}, visitor ${visitorIdentifier}. Awarded ${points} points.`);
            return true;
        } else {
            console.log(`Referral event ${eventType} for referrer ${referrer.id}, visitor ${visitorIdentifier} already logged or failed.`);
            return false;
        }
    } catch (error) {
        console.error(`Error tracking referral event ${eventType}:`, error);
        return false;
    }
}


module.exports = async (req, res) => {
     // Apply session middleware manually at the start
    sessionMiddleware(req, res, async (err) => {
        if (err) {
            console.error("Session middleware failed in /auth/x/user:", err);
            return res.status(500).json({ error: 'Session initialization error.' });
        }

        // Set CORS headers
        res.setHeader('Access-Control-Allow-Credentials', true);
        const allowedOrigins = [ 'http://localhost:3000', 'https://avaxcoco.vercel.app', 'https://www.avaxcoco.com', 'https://avaxcoco.com' ];
        const origin = req.headers.origin;
        if (allowedOrigins.includes(origin)) {
            res.setHeader('Access-Control-Allow-Origin', origin);
        }
        res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS'); // Only GET needed here
        res.setHeader(
            'Access-Control-Allow-Headers',
            'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization' // Allow Authorization
        );

        // Handle OPTIONS request
        if (req.method === 'OPTIONS') {
            return res.status(200).end();
        }

        // Only allow GET requests
        if (req.method !== 'GET') {
            return res.status(405).json({ error: 'Method not allowed' });
        }

        try {
            // --- 1. Extract Token ---
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return res.status(401).json({ error: 'No token provided or invalid format' });
            }
            const token = authHeader.split(' ')[1];

            // --- 2. Fetch User Profile from X API ---
            console.log('Fetching user data from X API...');
            const userApiUrl = 'https://api.twitter.com/2/users/me?user.fields=profile_image_url,username,name';
            let xApiResponse;
            try {
                xApiResponse = await fetch(userApiUrl, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
            } catch (fetchError) {
                console.error('Error fetching from X API:', fetchError);
                return res.status(500).json({ error: 'Failed to contact X API' });
            }

            const xResponseText = await xApiResponse.text();
            let xUserData;
            try {
                xUserData = JSON.parse(xResponseText);
            } catch (e) {
                 console.error('Failed to parse X API response:', xResponseText);
                 return res.status(500).json({ error: 'Failed to parse user data response from X', details: xResponseText });
            }

            if (!xApiResponse.ok) {
                console.error('X API User data fetch error:', xUserData);
                 // If token is invalid (e.g., 401 Unauthorized), clear session?
                 if (xApiResponse.status === 401 && req.session) {
                     console.log('X API returned 401, destroying session...');
                     req.session.destroy(destroyErr => { if(destroyErr) console.error("Error destroying session on X API 401:", destroyErr); });
                 }
                return res.status(xApiResponse.status).json({ error: 'Failed to fetch user data from X', details: xUserData });
            }

            if (!xUserData || !xUserData.data) {
                 console.error('Invalid user data format from X API:', xUserData);
                 return res.status(500).json({ error: 'Received invalid data format from X API' });
            }
            console.log(`Fetched X data for user: @${xUserData.data.username}`);

            // --- 3. Prepare User Data for Database ---
            const xUserProfile = {
                id: xUserData.data.id,
                handle: xUserData.data.username, // Store without '@'
                name: xUserData.data.name,
                profileImage: xUserData.data.profile_image_url
            };

            // --- 4. Interact with Database & Session ---
            let userRecord = null;
            let activities = [];
            let internalUserId = null;
            let referralTracked = false;

            try {
                // Create or update user, get internal ID
                const userResult = await db.createOrUpdateUser(xUserProfile); // Returns { id, referral_code }
                internalUserId = userResult.id;

                if (internalUserId) {
                    console.log(`DB User ID: ${internalUserId} for X user @${xUserProfile.handle}`);
                    // --- Associate with session ---
                    req.session.userId = internalUserId; // Store internal DB ID in session
                    console.log(`User ${internalUserId} associated with session ${req.sessionID}`);

                    // --- Check for and process referral ---
                    const referrerCode = req.session.referrer_code;
                    if (referrerCode) {
                         console.log(`Found referrer code ${referrerCode} in session for user ${internalUserId}`);
                        // Use internalUserId as the unique visitor identifier for 'x_connect'
                         referralTracked = await trackReferral('x_connect', referrerCode, internalUserId.toString());
                        // Clear the referrer code from session after processing attempt
                        delete req.session.referrer_code;
                        console.log(`Cleared referrer code from session ${req.sessionID}`);
                    } else {
                         console.log(`No referrer code found in session ${req.sessionID} for user ${internalUserId}`);
                    }

                    // Get full user data from database (including points, rank, level, referral info)
                    userRecord = await db.getUserProfile(internalUserId);

                    // Get recent activities (optional, maybe fetch on profile page instead?)
                    // activities = await db.getUserActivities(internalUserId);

                } else {
                    console.error('Failed to get internalUserId from createOrUpdateUser for X ID:', xUserProfile.id);
                    // Handle case where DB operation failed critically
                     throw new Error('Database operation failed to return user ID.');
                }

            } catch (dbError) {
                console.error('Database error processing user:', dbError);
                // If DB fails, we might still have X data but can't associate session or track referral
                // Return an error to the client
                 return res.status(500).json({ error: 'Database error processing user information.' });
            }

             // Final session save to ensure all changes (userId, cleared referrer_code) are persisted
             req.session.save(saveErr => {
                 if (saveErr) {
                     console.error("Session save error at end of /user endpoint:", saveErr);
                     // Proceed to send response anyway, but log the error
                 }

                 // --- 5. Combine Data and Respond ---
                 // Ensure userRecord exists before accessing its properties
                 const combinedUserData = {
                     id: xUserProfile.id, // X ID
                     userId: internalUserId, // Internal DB ID
                     handle: '@' + xUserProfile.handle, // Add '@' back for display consistency
                     name: xUserProfile.name,
                     profileImage: xUserProfile.profileImage,
                     points: userRecord?.engagement_points ?? 0, // Engagement points
                     rank: userRecord?.rank ?? null,
                     level: userRecord?.level ?? 'Beginner',
                     referral_code: userRecord?.referral_code ?? null, // User's own referral code
                     referral_points: userRecord?.referral_points ?? 0, // Points earned from referrals
                     verified_at: userRecord?.verified_at ?? null, // Verification status
                     activities: activities, // Keep empty for now, fetch on profile page if needed
                     referralTrackedThisSession: referralTracked // Indicate if referral was processed in this request
                 };

                 console.log(`Returning combined user data for @${xUserProfile.handle}`);
                 res.status(200).json(combinedUserData);
            });

        } catch (error) {
            console.error('Unexpected error in /api/auth/x/user:', error);
             // Attempt to destroy session on unexpected error
             if (req.session) {
                 req.session.destroy(destroyErr => { if (destroyErr) console.error("Error destroying session on unexpected error:", destroyErr); });
             }
            res.status(500).json({ error: 'An unexpected server error occurred' });
        }
    }); // End sessionMiddleware wrapper
};