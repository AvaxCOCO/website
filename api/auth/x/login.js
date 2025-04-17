// api/auth/x/login.js
// Handles the initiation of the X OAuth 2.0 PKCE flow and stores referrer code in session

const { generateRandomString, generateCodeChallenge, getRedirectUri } = require('../utils'); // Correct path
const sessionMiddleware = require('../../_middleware/session'); // Import session middleware
require('dotenv').config(); // Ensure env vars are loaded

module.exports = async (req, res) => {
    // Apply session middleware manually at the start of the handler
    sessionMiddleware(req, res, async (err) => {
        if (err) {
            console.error("Session middleware failed in /auth/x/login:", err);
            return res.status(500).send('Session initialization error.');
        }

        // Proceed with login logic only after session middleware is done
        try {
            const state = generateRandomString(16);
            const codeVerifier = generateRandomString(64); // PKCE verifier

            // Store state and code verifier in the session
            req.session.xAuthState = state;
            req.session.xCodeVerifier = codeVerifier;
            console.log(`Stored state (${state.substring(0,5)}...) and verifier (${codeVerifier.substring(0,5)}...) in session ${req.sessionID}`);

            // Capture referrer code from query parameters if present
            const referrerCode = req.query.referrer_code;
            if (referrerCode) {
                // Store it in the session to link the referral after successful login
                req.session.referrer_code = referrerCode;
                console.log(`Referrer code ${referrerCode} stored in session ${req.sessionID}.`);
            } else {
                // Ensure any previous referrer code is cleared if none provided now
                delete req.session.referrer_code;
                 console.log(`No referrer code in query, ensuring it's cleared from session ${req.sessionID}.`);
            }

             // Save the session explicitly before redirecting
            req.session.save(async (saveErr) => {
                if (saveErr) {
                    console.error("Session save error before redirect:", saveErr);
                    return res.status(500).send('Session save error');
                }
                console.log(`Session ${req.sessionID} saved successfully before redirect.`);

                // Generate PKCE challenge
                const codeChallenge = await generateCodeChallenge(codeVerifier);
                const redirectUri = getRedirectUri(req); // Use existing util

                // Construct X Authorization URL
                const authUrl = new URL('https://twitter.com/i/oauth2/authorize');
                authUrl.searchParams.append('response_type', 'code');
                authUrl.searchParams.append('client_id', process.env.X_CLIENT_ID); // Use environment variable
                authUrl.searchParams.append('redirect_uri', redirectUri);
                authUrl.searchParams.append('scope', 'tweet.read users.read offline.access'); // Request necessary scopes
                authUrl.searchParams.append('state', state);
                authUrl.searchParams.append('code_challenge', codeChallenge);
                authUrl.searchParams.append('code_challenge_method', 'S256');

                console.log('Redirecting user to X authorization URL:', authUrl.toString());
                // Return the authorization URL, state, and codeVerifier
                res.json({
                    authUrl: authUrl.toString(),
                    state: state,
                    codeVerifier: codeVerifier
                });
            });

        } catch (error) {
            console.error('Error starting X auth:', error);
            // Avoid redirecting if an error occurred before saving session/generating URL
            if (!res.headersSent) {
                 res.status(500).send('Failed to start authentication process.');
            }
        }
    }); // End sessionMiddleware wrapper
};