/**
 * $COCO - The Pink Ostrich of AVAX
 * API endpoint for referral tracking without authentication
 */

const db = require('./db'); // Correct path relative to api/referral.js
const sessionMiddleware = require('./_middleware/session'); // Correct path
require('dotenv').config();

// Referral point values
const REFERRAL_POINTS = {
    visit: 5,
    email: 10,
    x_connect: 15, // Note: x_connect points are awarded in /api/auth/x/user.js
    wallet_connect: 20
};

// Helper function to track referral (can be moved to utils)
async function trackReferral(eventType, referrerCode, visitorIdentifier, email = null) {
    console.log(`Attempting to track referral: ${eventType}, Code: ${referrerCode}, Visitor: ${visitorIdentifier}, Email: ${email}`);
    if (!referrerCode || !visitorIdentifier) {
        console.log('Skipping referral track: Missing referrer code or visitor identifier.');
        return { success: false, message: 'Missing data' };
    }
    if (eventType === 'email' && !email) {
        console.log('Skipping email referral track: Missing email.');
        return { success: false, message: 'Missing email' };
    }

    try {
        const referrer = await db.getUserByReferralCode(referrerCode);
        if (!referrer) {
            console.log(`Referrer not found for code: ${referrerCode}`);
            return { success: false, message: 'Invalid referral code' };
        }

        const points = REFERRAL_POINTS[eventType] || 0;
        // Allow email tracking even if points are 0 but don't award points
        if (points === 0 && eventType !== 'email') {
             console.log(`No points defined for event type: ${eventType}`);
             return { success: false, message: 'Invalid event type' };
        }

        // Use email as visitor identifier for email events to prevent multiple submissions for the same email under the same referrer
        const effectiveVisitorId = eventType === 'email' ? email : visitorIdentifier;

        // Log the event - handles duplicate prevention based on (referrer_user_id, visitor_identifier, event_type)
        const logged = await db.logReferralEvent(referrer.id, effectiveVisitorId, eventType, points);

        if (logged) {
            // Award points only if the event was newly logged and points > 0
            if (points > 0) {
                await db.updateUserReferralPoints(referrer.id, points);
            }
            // Store email if event type is email (even if duplicate event, ensure email is stored if not already)
            if (eventType === 'email') {
                await db.storeReferralEmail(referrer.id, email); // storeReferralEmail also handles duplicates
            }
            console.log(`Referral event ${eventType} logged successfully for referrer ${referrer.id}, visitor ${effectiveVisitorId}. Awarded ${points} points.`);
            return { success: true, message: 'Event tracked successfully' };
        } else {
            console.log(`Referral event ${eventType} for referrer ${referrer.id}, visitor ${effectiveVisitorId} already logged or failed.`);
            // Check if it was an email duplicate specifically
            if (eventType === 'email') {
                 // Even if duplicate event, try storing email in case that failed before
                 await db.storeReferralEmail(referrer.id, email);
                 return { success: false, duplicate: true, message: 'Email already submitted for this referrer.' };
            }
            return { success: false, duplicate: true, message: 'Event already tracked for this visitor.' };
        }
    } catch (error) {
        console.error(`Error tracking referral event ${eventType}:`, error);
        return { success: false, message: 'Server error during tracking' };
    }
}

module.exports = async (req, res) => {
    // Apply session middleware manually at the start
    sessionMiddleware(req, res, async (sessionErr) => {
        if (sessionErr) {
            console.error("Session middleware failed in /api/referral:", sessionErr);
            return res.status(500).json({ error: 'Session initialization error.' });
        }

        // Set CORS headers
        res.setHeader('Access-Control-Allow-Credentials', true);
        const allowedOrigins = ['http://localhost:3000', 'https://avaxcoco.vercel.app', 'https://www.avaxcoco.com', 'https://avaxcoco.com'];
        const origin = req.headers.origin;
        if (allowedOrigins.includes(origin)) {
            res.setHeader('Access-Control-Allow-Origin', origin);
        }
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader(
            'Access-Control-Allow-Headers',
            'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
        );

        // Handle OPTIONS request
        if (req.method === 'OPTIONS') {
            return res.status(200).end();
        }

        // --- Handle GET /api/referral?code=... --- (Referrer Info)
        if (req.method === 'GET' && req.query.code) {
            try {
                const referralCode = req.query.code;
                console.log(`Fetching referrer info for code: ${referralCode}`);
                const referrer = await db.getUserByReferralCode(referralCode);

                if (referrer) {
                    console.log(`Referrer found: @${referrer.handle}`);
                    res.status(200).json({ referrerHandle: referrer.handle });
                } else {
                    console.log(`Referrer not found for code: ${referralCode}`);
                    res.status(404).json({ error: 'Referral code not found.' });
                }
            } catch (error) {
                console.error('Error fetching referrer info:', error);
                res.status(500).json({ error: 'Failed to fetch referrer information.' });
            }
        }
        // --- Handle POST /api/referral --- (Referral Tracking)
        else if (req.method === 'POST') {
            try {
                const { referrerCode, eventType, email, walletAddress } = req.body;
                console.log('Received referral track request:', req.body);

                if (!referrerCode || !eventType) {
                    return res.status(400).json({ error: 'Missing required parameters (referrerCode, eventType).' });
                }

                let visitorIdentifier;
                let result;

                switch (eventType) {
                    case 'visit':
                        // Use session ID as identifier for visits to prevent easy gaming by client ID alone
                        visitorIdentifier = req.sessionID;
                        if (!visitorIdentifier) {
                            console.error('Session not available for visit tracking.');
                            // Cannot track visit without a session ID
                            return res.status(400).json({ error: 'Session not available for visit tracking.' });
                        }
                        result = await trackReferral(eventType, referrerCode, visitorIdentifier);
                        break;
                    case 'email':
                        if (!email || typeof email !== 'string' || !email.includes('@')) { // Basic email validation
                             console.error('Missing or invalid email parameter for email event.');
                             return res.status(400).json({ error: 'Missing or invalid email parameter for email event.' });
                        }
                        // Visitor identifier for email is the email itself (lowercase for consistency)
                        visitorIdentifier = email.toLowerCase();
                        result = await trackReferral(eventType, referrerCode, visitorIdentifier, visitorIdentifier); // Pass email as both ID and email param
                        break;
                    case 'wallet_connect':
                         if (!walletAddress) {
                             console.error('Missing walletAddress parameter for wallet_connect event.');
                             return res.status(400).json({ error: 'Missing walletAddress parameter for wallet_connect event.' });
                         }
                         // Use wallet address (lowercase for consistency) as visitor identifier
                         visitorIdentifier = walletAddress.toLowerCase();
                         result = await trackReferral(eventType, referrerCode, visitorIdentifier);
                        break;
                     case 'x_connect':
                         // This is handled server-side in /api/auth/x/user.js
                         console.warn('Client attempted to track x_connect via /api/referral. This should be handled server-side.');
                         return res.status(400).json({ error: 'x_connect event type should not be called directly via this endpoint.' });
                    default:
                        console.warn(`Invalid eventType received: ${eventType}`);
                        return res.status(400).json({ error: 'Invalid eventType.' });
                }

                 // Respond based on the result from trackReferral helper
                 if (result.success) {
                     res.status(200).json({ message: result.message || 'Event tracked.' });
                 } else {
                     // Send specific status codes for different failures
                     if (result.duplicate) {
                         res.status(409).json({ error: result.message || 'Event already tracked.', duplicate: true });
                     } else if (result.message === 'Invalid referral code') {
                          res.status(404).json({ error: result.message });
                     } else {
                          // Default to 400 for other validation/server errors during tracking
                          res.status(400).json({ error: result.message || 'Failed to track event.' });
                     }
                 }

            } catch (error) {
                console.error('Error processing referral track POST request:', error);
                res.status(500).json({ error: 'Server error during referral tracking.' });
            }
        }
        // --- Handle other methods ---
        else {
            res.setHeader('Allow', ['GET', 'POST', 'OPTIONS']);
            res.status(405).json({ error: `Method ${req.method} Not Allowed on /api/referral` });
        }
    }); // End sessionMiddleware wrapper
};
