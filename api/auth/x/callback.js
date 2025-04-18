// api/auth/x/callback.js
// Exchanges the authorization code (received via client POST) for access/refresh tokens from X

const fetch = require('node-fetch');
const { getRedirectUri } = require('./utils'); // Correct path relative to this file
const sessionMiddleware = require('../../_middleware/session'); // Import session middleware
require('dotenv').config();

module.exports = async (req, res) => {
    // Apply session middleware manually at the start
    sessionMiddleware(req, res, async (err) => {
        if (err) {
            console.error("Session middleware failed in /auth/x/callback:", err);
            return res.status(500).json({ error: 'Session initialization error.' });
        }

        // Set CORS headers (adjust origin for production)
        res.setHeader('Access-Control-Allow-Credentials', true);
        // Allow requests from your frontend domain(s)
        const allowedOrigins = [
            'http://localhost:3000', // Vercel CLI default
            'https://avaxcoco.vercel.app',
            'https://www.avaxcoco.com',
            'https://avaxcoco.com'
         ];
        const origin = req.headers.origin;
        if (allowedOrigins.includes(origin)) {
            res.setHeader('Access-Control-Allow-Origin', origin);
        }
        res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS'); // Only POST is expected from client
        res.setHeader(
            'Access-Control-Allow-Headers',
            'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
        );

        // Handle OPTIONS request
        if (req.method === 'OPTIONS') {
            return res.status(200).end();
        }

        // Only allow POST requests from the client (callback.html script)
        if (req.method !== 'POST') {
            console.log(`Callback received non-POST method: ${req.method}`);
            return res.status(405).json({ error: 'Method not allowed. Client must POST code/state/verifier.' });
        }

        try {
            // Get code, state, codeVerifier from the POST body sent by callback.html script
            const { code, state, codeVerifier } = req.body;

            if (!code || !state || !codeVerifier) {
                console.error('Missing code, state, or codeVerifier in POST body:', req.body);
                return res.status(400).json({ error: 'Missing required parameters (code, state, codeVerifier).' });
            }

            // --- State Verification ---
            const sessionState = req.session.xAuthState;
            console.log(`Received state: ${state?.substring(0,5)}..., Session state: ${sessionState?.substring(0,5)}...`);

            if (!sessionState || state !== sessionState) {
                // Log more specific reason for mismatch
                if (!sessionState) {
                    console.error('State mismatch error in callback: Session state was undefined (failed to load session?).');
                } else {
                    console.error('State mismatch error in callback: Received state does not match session state.');
                }
                // Destroy potentially compromised session
                if (req.session) {
                    req.session.destroy(destroyErr => {
                        if (destroyErr) console.error("Error destroying session on state mismatch:", destroyErr);
                    });
                }
                return res.status(403).json({ error: 'Invalid state parameter. Possible CSRF attack.' });
            }
            // Clear the state from session after successful verification
            delete req.session.xAuthState;
            console.log(`State verified and cleared from session ${req.sessionID}`);

            // --- Exchange code for token ---
            const redirectUri = getRedirectUri(req); // Ensure this matches exactly what X expects
            const tokenUrl = 'https://api.twitter.com/2/oauth2/token';

            const params = new URLSearchParams();
            params.append('grant_type', 'authorization_code');
            params.append('code', code);
            params.append('redirect_uri', redirectUri);
            params.append('code_verifier', codeVerifier); // Use the verifier sent by the client

            // Basic Auth header for X API
            const auth = Buffer.from(`${process.env.X_CLIENT_ID}:${process.env.X_CLIENT_SECRET}`).toString('base64');

            console.log('Exchanging code for token via POST to X API...');
            const response = await fetch(tokenUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': `Basic ${auth}`
                },
                body: params
            });

            const responseText = await response.text();
            let data;

            try {
                data = JSON.parse(responseText);
            } catch (e) {
                console.error('Failed to parse token response from X:', responseText);
                return res.status(500).json({
                    error: 'Failed to parse token response from X',
                    details: responseText
                });
            }

            if (!response.ok) {
                console.error('Token exchange error from X:', data);
                return res.status(response.status).json({
                    error: 'Failed to exchange code for token',
                    details: data
                });
            }

            console.log('Token exchange successful.');
            // Session should be saved automatically by session middleware if modified (state was deleted)
            // If referrer_code was handled here (it's not, it's in /user), ensure save.

            // Return the tokens to the client (callback.html script will store them)
            res.json({
                access_token: data.access_token,
                refresh_token: data.refresh_token, // May not always be present
                expires_in: data.expires_in
            });

        } catch (error) {
            console.error('Error in X callback processing:', error);
            // Attempt to destroy session on error?
            if (req.session) {
                req.session.destroy(destroyErr => { if (destroyErr) console.error("Error destroying session on callback error:", destroyErr); });
            }
            res.status(500).json({ error: 'Failed to process authentication callback' });
        }
    }); // End sessionMiddleware wrapper
};