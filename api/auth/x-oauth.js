export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method === 'GET') {
        // Step 1: Initiate OAuth flow
        return initiateOAuth(req, res);
    } else if (req.method === 'POST') {
        // Step 2: Handle OAuth callback
        return handleOAuthCallback(req, res);
    } else {
        return res.status(405).json({ error: 'Method not allowed' });
    }
}

async function initiateOAuth(req, res) {
    try {
        const clientId = process.env.X_CLIENT_ID;
        const clientSecret = process.env.X_CLIENT_SECRET;
        
        if (!clientId || !clientSecret) {
            return res.status(503).json({ 
                error: 'X OAuth not configured',
                message: 'Client credentials not available'
            });
        }

        // Generate state parameter for security
        const state = generateRandomString(32);
        
        // Store state in session/database for verification
        // For now, we'll return it to be stored client-side
        
        const redirectUri = `${req.headers.origin || 'https://avaxcoco.com'}/leaderboard.html`;
        const scope = 'tweet.read users.read';
        
        const authUrl = `https://twitter.com/i/oauth2/authorize?` +
            `response_type=code&` +
            `client_id=${clientId}&` +
            `redirect_uri=${encodeURIComponent(redirectUri)}&` +
            `scope=${encodeURIComponent(scope)}&` +
            `state=${state}&` +
            `code_challenge=challenge&` +
            `code_challenge_method=plain`;

        res.status(200).json({
            auth_url: authUrl,
            state: state
        });

    } catch (error) {
        console.error('Error initiating OAuth:', error);
        res.status(500).json({ error: 'Failed to initiate OAuth' });
    }
}

async function handleOAuthCallback(req, res) {
    try {
        const { code, state } = req.body;
        
        if (!code) {
            return res.status(400).json({ error: 'Authorization code required' });
        }

        const clientId = process.env.X_CLIENT_ID;
        const clientSecret = process.env.X_CLIENT_SECRET;
        
        if (!clientId || !clientSecret) {
            return res.status(503).json({ 
                error: 'X OAuth not configured'
            });
        }

        // Exchange code for access token
        const tokenResponse = await fetch('https://api.twitter.com/2/oauth2/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`
            },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: `${req.headers.origin || 'https://avaxcoco.com'}/leaderboard.html`,
                code_verifier: 'challenge'
            })
        });

        if (!tokenResponse.ok) {
            const errorData = await tokenResponse.text();
            console.error('Token exchange failed:', errorData);
            return res.status(400).json({ error: 'Failed to exchange code for token' });
        }

        const tokenData = await tokenResponse.json();
        const accessToken = tokenData.access_token;

        // Get user information
        const userResponse = await fetch('https://api.twitter.com/2/users/me?user.fields=name,username,profile_image_url,verified,public_metrics', {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        if (!userResponse.ok) {
            return res.status(400).json({ error: 'Failed to fetch user data' });
        }

        const userData = await userResponse.json();
        const user = userData.data;

        // Store user session/profile data
        const userProfile = {
            id: user.id,
            username: user.username,
            name: user.name,
            profile_image_url: user.profile_image_url,
            verified: user.verified || false,
            followers_count: user.public_metrics?.followers_count || 0,
            authenticated: true,
            auth_time: new Date().toISOString()
        };

        // Generate session token
        const sessionToken = generateRandomString(64);
        
        // In a real implementation, store this in a database
        // For now, we'll return it to be stored client-side
        
        res.status(200).json({
            success: true,
            user: userProfile,
            session_token: sessionToken,
            access_token: accessToken // Don't expose this in production
        });

    } catch (error) {
        console.error('Error handling OAuth callback:', error);
        res.status(500).json({ error: 'Failed to complete authentication' });
    }
}

function generateRandomString(length) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}
