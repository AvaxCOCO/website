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
    const localUri = process.env.REDIRECT_URI_LOCAL;
    if (!localUri) {
      console.error("REDIRECT_URI_LOCAL environment variable is not set for localhost!");
      return process.env.REDIRECT_URI_PROD_WWW; // Fallback to production
    }
    console.log(`Using local redirect URI: ${localUri}`);
    return localUri;
  }
  
  // Vercel preview deployment
  if (host.includes('vercel.app')) {
    const vercelUri = process.env.REDIRECT_URI_VERCEL;
    if (!vercelUri) {
      console.error("REDIRECT_URI_VERCEL environment variable is not set for vercel.app!");
      return process.env.REDIRECT_URI_PROD_WWW; // Fallback to production
    }
    console.log(`Using Vercel redirect URI: ${vercelUri}`);
    return vercelUri;
  }
  
  // Production non-www
  if (host === 'avaxcoco.com') {
    const prodUri = process.env.REDIRECT_URI_PROD;
    if (!prodUri) {
      console.error("REDIRECT_URI_PROD environment variable is not set for non-www production!");
      return process.env.REDIRECT_URI_PROD_WWW; // Fallback to www
    }
    console.log(`Using production redirect URI: ${prodUri}`);
    return prodUri;
  }
  
  // Production www (default)
  const prodWwwUri = process.env.REDIRECT_URI_PROD_WWW;
  if (!prodWwwUri) {
    console.error("CRITICAL ERROR: REDIRECT_URI_PROD_WWW environment variable is not set!");
    // Return a default to prevent undefined errors
    return 'https://www.avaxcoco.com/callback.html';
  }
  console.log(`Using www production redirect URI: ${prodWwwUri}`);
  return prodWwwUri;
}

module.exports = {
  generateRandomString,
  generateCodeChallenge,
  getRedirectUri
};
