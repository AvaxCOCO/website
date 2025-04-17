// api/auth/x/utils.js
function getRedirectUri(req) {
    const host = req.headers.host;
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    return `${protocol}://${host}/api/auth/x/callback`;
}

module.exports = { getRedirectUri };