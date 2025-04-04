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
  const host = req.headers.host || '';
  
  if (host.includes('localhost') || host.includes('127.0.0.1')) {
    return process.env.REDIRECT_URI_LOCAL;
  } else if (host.includes('avaxcoco.vercel.app')) {
    return process.env.REDIRECT_URI_VERCEL;
  } else if (host.includes('www.avaxcoco.com')) {
    return process.env.REDIRECT_URI_PROD_WWW;
  } else {
    return process.env.REDIRECT_URI_PROD;
  }
}

module.exports = {
  generateRandomString,
  generateCodeChallenge,
  getRedirectUri
};