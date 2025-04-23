// Utility functions for X authentication

const crypto = require('crypto');

// Generate random string for state and code verifier
function generateRandomString(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

// Create code challenge from verifier
async function generateCodeChallenge(verifier) {
  const hash = crypto.createHash('sha256').update(verifier).digest();
  return hash.toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// Get the appropriate redirect URI based on the environment
function getRedirectUri(req) {
  // Determine the appropriate redirect URI based on the request host
  const host = req.headers.host || '';
  
  // Local development
  if (host.includes('localhost') || host.includes('127.0.0.1')) {
    console.log(`Using local redirect URI for host: ${host}`);
    return 'http://localhost:3000/api/auth/x/callback';
  }
  
  // Vercel preview deployment
  if (host.includes('vercel.app')) {
    console.log(`Using Vercel redirect URI for host: ${host}`);
    return 'https://avaxcoco.vercel.app/api/auth/x/callback';
  }
  
  // Production non-www
  if (host === 'avaxcoco.com') {
    console.log(`Using production redirect URI for host: ${host}`);
    return 'https://avaxcoco.com/api/auth/x/callback';
  }
  
  // Production www (default)
  console.log(`Using www production redirect URI for host: ${host}`);
  return 'https://www.avaxcoco.com/api/auth/x/callback';
}

module.exports = {
  generateRandomString,
  generateCodeChallenge,
  getRedirectUri
};
