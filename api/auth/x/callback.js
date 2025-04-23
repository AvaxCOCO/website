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

        // Handle both GET (from X redirect) and POST (from client script) requests
        if (req.method !== 'POST' && req.method !== 'GET') {
            console.log(`Callback received unsupported method: ${req.method}`);
            return res.status(405).json({ error: 'Method not allowed. Only GET and POST are supported.' });
        }

        // For GET requests (coming directly from X OAuth redirect)
        if (req.method === 'GET') {
            console.log('Received GET request from X OAuth redirect');
            
            // Extract code and state from query parameters
            const code = req.query.code;
            const state = req.query.state;
            
            if (!code || !state) {
                console.error('Missing code or state in query parameters');
                return res.status(400).send(`
                    <html>
                    <head>
                        <title>Authentication Error</title>
                        <style>
                            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background-color: #0a0225; color: white; }
                            .error-container { max-width: 600px; margin: 0 auto; }
                            .error-title { color: #FF1493; }
                            .error-message { margin: 20px 0; }
                            .back-button { display: inline-block; background-color: #FF1493; color: white; padding: 10px 20px; 
                                          text-decoration: none; border-radius: 5px; margin-top: 20px; }
                        </style>
                    </head>
                    <body>
                        <div class="error-container">
                            <h1 class="error-title">Authentication Error</h1>
                            <p class="error-message">Missing required parameters from X authentication.</p>
                            <a href="/" class="back-button">Back to Home</a>
                        </div>
                    </body>
                    </html>
                `);
            }
            
            // Redirect to callback.html with the code and state as query parameters
            const redirectUrl = `/callback.html?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`;
            console.log(`Redirecting to: ${redirectUrl}`);
            return res.redirect(302, redirectUrl);
        }

        try {
            // Get code, state, codeVerifier from the POST body sent by callback.html script
            const { code, state, codeVerifier } = req.body;

            if (!code || !state || !codeVerifier) {
                console.error('Missing code, state, or codeVerifier in POST body:', req.body);
                return res.status(400).json({ error: 'Missing required parameters (code, state, codeVerifier).' });
            }

            // Skip state verification in the server for POST requests
            // The client-side code in callback.html will verify the state against localStorage
            console.log(`Received state: ${state?.substring(0,5)}... from client POST request`);
            console.log(`Skipping server-side state verification for POST request - client has already verified`);

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
