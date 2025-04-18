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
  // Always return the www production redirect URI as requested
  // This will cause auth initiated from other hosts (localhost, non-www, vercel.app) to fail.
  const prodWwwUri = process.env.REDIRECT_URI_PROD_WWW;
  if (!prodWwwUri) {
    console.error("CRITICAL ERROR: REDIRECT_URI_PROD_WWW environment variable is not set!");
    // Return a default or throw an error, as auth cannot proceed without it.
    // Returning undefined might lead to cryptic errors later.
    // For now, log and return undefined, but this MUST be set in Vercel.
    return undefined;
  }
  return prodWwwUri;
}

module.exports = {
  generateRandomString,
  generateCodeChallenge,
  getRedirectUri
};