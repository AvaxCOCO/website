// X Authentication Login Endpoint
const { generateRandomString, generateCodeChallenge, getRedirectUri } = require('../utils');

// Store PKCE code verifiers temporarily (in production, use a database or Redis)
// Note: This is a global variable that persists between function invocations
// on the same server instance, but not across multiple instances
let codeVerifiers = new Map();

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
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
    // Generate state and code verifier
    const state = generateRandomString();
    const codeVerifier = generateRandomString(64);
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    
    // Store the code verifier for later use
    codeVerifiers.set(state, codeVerifier);
    
    // Clean up old entries to prevent memory leaks
    const now = Date.now();
    for (const [key, value] of codeVerifiers.entries()) {
      if (value.timestamp && now - value.timestamp > 10 * 60 * 1000) { // 10 minutes
        codeVerifiers.delete(key);
      }
    }
    
    // Build the authorization URL
    const redirectUri = getRedirectUri(req);
    const authUrl = new URL('https://twitter.com/i/oauth2/authorize');
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('client_id', process.env.X_CLIENT_ID);
    authUrl.searchParams.append('redirect_uri', redirectUri);
    authUrl.searchParams.append('scope', 'tweet.read users.read offline.access');
    authUrl.searchParams.append('state', state);
    authUrl.searchParams.append('code_challenge', codeChallenge);
    authUrl.searchParams.append('code_challenge_method', 'S256');
    
    // Return the authorization URL, state, and code verifier to the client
    res.json({ 
      authUrl: authUrl.toString(), 
      state,
      codeVerifier // Send the code verifier to the client
    });
  } catch (error) {
    console.error('Error initiating auth:', error);
    res.status(500).json({ error: 'Failed to initiate authentication' });
  }
};