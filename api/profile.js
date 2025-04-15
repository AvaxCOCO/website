// api/profile.js
// Endpoints for user profile data and QR code generation. Requires authentication (session).

const qrcode = require('qrcode');
const db = require('./db'); // Correct path relative to api/profile.js
const sessionMiddleware = require('./_middleware/session'); // Correct path
require('dotenv').config();

// Simple auth check middleware (can be moved to a separate file like api/middleware/auth.js)
function ensureAuthenticated(req, res, next) {
    if (!req.session || !req.session.userId) {
        console.log('Authentication check failed: No session or userId found.');
        return res.status(401).json({ error: 'Authentication required.' });
    }
    console.log(`Authentication check passed for userId: ${req.session.userId}`);
    next(); // User is authenticated, proceed
}

module.exports = async (req, res) => {
    // Apply session middleware first
    sessionMiddleware(req, res, async (sessionErr) => {
        if (sessionErr) {
            console.error("Session middleware failed in /api/profile:", sessionErr);
            return res.status(500).json({ error: 'Session initialization error.' });
        }

        // Apply authentication check AFTER session is loaded
        ensureAuthenticated(req, res, async () => {

            const userId = req.session.userId;

            // --- Handle GET /api/profile ---
            // Fetches the logged-in user's profile data
            if (req.method === 'GET') {
                try {
                    console.log(`Fetching profile for user ID: ${userId}`);
                    let userProfile = await db.getUserProfile(userId);

                    if (!userProfile) {
                        console.log(`User profile not found in DB for ID: ${userId}`);
                        // If user session exists but DB record doesn't, something is wrong.
                        // Maybe clear session and force re-auth? For now, return 404.
                        req.session.destroy(); // Clear potentially invalid session
                        return res.status(404).json({ error: 'User profile not found. Please reconnect X.' });
                    }

                    // Ensure user has a referral code (generate if missing)
                    if (!userProfile.referral_code) {
                        console.log(`User ${userId} has no referral code, generating...`);
                        try {
                            userProfile.referral_code = await db.ensureReferralCode(userId);
                            console.log(`Generated referral code for user ${userId}: ${userProfile.referral_code}`);
                        } catch (codeGenError) {
                             console.error(`Error generating referral code for user ${userId}:`, codeGenError);
                             // Proceed without code if generation fails, but log it
                        }
                    }

                    // Add full referral link for convenience
                    if (userProfile.referral_code) {
                        const host = req.headers.host || process.env.VERCEL_URL || 'localhost:3000';
                        const protocol = host.includes('localhost') ? 'http' : 'https';
                        const baseUrl = `${protocol}://${host}`;
                        userProfile.referralLink = `${baseUrl}/referral-landing.html?code=${userProfile.referral_code}`;
                    } else {
                         userProfile.referralLink = null; // Indicate no link available
                    }

                    console.log(`Returning profile data for user ${userId}`);
                    res.status(200).json(userProfile);

                } catch (error) {
                    console.error(`Error fetching user profile for ID ${userId}:`, error);
                    res.status(500).json({ error: 'Failed to fetch profile data.' });
                }
            }
            // --- Handle POST /api/profile --- (Assuming QR generation is POST to /api/profile)
            // If you prefer /api/profile/generate-qr, create that file instead.
            else if (req.method === 'POST') {
                 try {
                     console.log(`Generating QR code request for user ID: ${userId}`);
                     const referralCode = await db.ensureReferralCode(userId); // Ensure code exists

                     if (!referralCode) {
                         throw new Error('Could not obtain referral code for QR generation.');
                     }

                     const host = req.headers.host || process.env.VERCEL_URL || 'localhost:3000';
                     const protocol = host.includes('localhost') ? 'http' : 'https';
                     const baseUrl = `${protocol}://${host}`;
                     const referralLink = `${baseUrl}/referral-landing.html?code=${referralCode}`;

                     console.log(`Generating QR code for link: ${referralLink}`);
                     // Generate QR code as Data URL
                     const qrCodeDataUrl = await qrcode.toDataURL(referralLink, {
                         errorCorrectionLevel: 'H', // High error correction
                         margin: 1, // Minimal margin
                         width: 256 // Specify width
                        });

                     console.log(`QR code generated successfully for user ${userId}`);
                     res.status(200).json({
                         referralLink: referralLink,
                         qrCodeDataUrl: qrCodeDataUrl
                     });

                 } catch (error) {
                     console.error(`Error generating QR code for user ${userId}:`, error);
                     res.status(500).json({ error: 'Failed to generate QR code.' });
                 }
            }
            // --- Handle other methods ---
            else {
                res.setHeader('Allow', ['GET', 'POST']);
                res.status(405).json({ error: `Method ${req.method} Not Allowed on /api/profile` });
            }
        }); // End ensureAuthenticated wrapper
    }); // End sessionMiddleware wrapper
};