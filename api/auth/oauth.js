import { Pool } from 'pg';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { action } = req.query;

    if (action === 'x-oauth') {
        return handleXOAuth(req, res);
    } else if (action === 'profile') {
        return handleProfile(req, res);
    } else {
        return res.status(400).json({ error: 'Invalid action specified' });
    }
}

// X OAuth Authentication Functions
async function handleXOAuth(req, res) {
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
                message: 'Client credentials not available',
                fallback_available: true,
                setup_guide: 'See X_OAUTH_SETUP_GUIDE.md for configuration instructions'
            });
        }

        // Generate state parameter for security
        const state = generateRandomString(32);
        
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
        
        // Store user profile in database
        await storeUserProfile({ user: userProfile, session_token: sessionToken });
        
        res.status(200).json({
            success: true,
            user: userProfile,
            session_token: sessionToken
        });

    } catch (error) {
        console.error('Error handling OAuth callback:', error);
        res.status(500).json({ error: 'Failed to complete authentication' });
    }
}

// Profile Management Functions
async function handleProfile(req, res) {
    if (req.method === 'POST') {
        return storeUserProfile(req.body);
    } else if (req.method === 'GET') {
        return getUserProfile(req, res);
    } else if (req.method === 'PUT') {
        return updateUserProfile(req, res);
    } else {
        return res.status(405).json({ error: 'Method not allowed' });
    }
}

async function storeUserProfile(data) {
    const client = await pool.connect();
    
    try {
        const { user, session_token } = data;
        
        if (!user || !user.id || !user.username) {
            return { error: 'Invalid user data' };
        }

        // Create authenticated_users table if it doesn't exist
        await client.query(`
            CREATE TABLE IF NOT EXISTS authenticated_users (
                id SERIAL PRIMARY KEY,
                x_user_id VARCHAR(50) UNIQUE NOT NULL,
                username VARCHAR(50) NOT NULL,
                display_name VARCHAR(100),
                profile_image_url TEXT,
                verified BOOLEAN DEFAULT FALSE,
                followers_count INTEGER DEFAULT 0,
                session_token VARCHAR(128),
                last_login TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Create indexes for faster lookups
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_auth_users_x_id ON authenticated_users(x_user_id);
        `);
        
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_auth_users_username ON authenticated_users(username);
        `);

        // Insert or update user profile
        const result = await client.query(`
            INSERT INTO authenticated_users (
                x_user_id, username, display_name, profile_image_url, 
                verified, followers_count, session_token, last_login, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            ON CONFLICT (x_user_id) 
            DO UPDATE SET 
                username = EXCLUDED.username,
                display_name = EXCLUDED.display_name,
                profile_image_url = EXCLUDED.profile_image_url,
                verified = EXCLUDED.verified,
                followers_count = EXCLUDED.followers_count,
                session_token = EXCLUDED.session_token,
                last_login = CURRENT_TIMESTAMP,
                updated_at = CURRENT_TIMESTAMP
            RETURNING *;
        `, [
            user.id,
            user.username,
            user.name,
            user.profile_image_url,
            user.verified || false,
            user.followers_count || 0,
            session_token
        ]);

        return {
            success: true,
            user: result.rows[0]
        };

    } catch (error) {
        console.error('Error storing user profile:', error);
        return { error: 'Failed to store user profile' };
    } finally {
        client.release();
    }
}

async function getUserProfile(req, res) {
    const client = await pool.connect();
    
    try {
        const { username, session_token } = req.query;
        
        if (!username && !session_token) {
            return res.status(400).json({ error: 'Username or session token required' });
        }

        let query, params;
        
        if (session_token) {
            query = 'SELECT * FROM authenticated_users WHERE session_token = $1';
            params = [session_token];
        } else {
            query = 'SELECT * FROM authenticated_users WHERE username = $1';
            params = [username];
        }

        const result = await client.query(query, params);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = result.rows[0];
        
        // Don't return session token in public queries
        if (!session_token) {
            delete user.session_token;
        }

        res.status(200).json({
            success: true,
            user: user
        });

    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ error: 'Failed to fetch user profile' });
    } finally {
        client.release();
    }
}

async function updateUserProfile(req, res) {
    const client = await pool.connect();
    
    try {
        const { session_token } = req.headers.authorization?.replace('Bearer ', '') || req.body.session_token;
        const updates = req.body;
        
        if (!session_token) {
            return res.status(401).json({ error: 'Session token required' });
        }

        // Verify session token and get user
        const userResult = await client.query(
            'SELECT * FROM authenticated_users WHERE session_token = $1',
            [session_token]
        );

        if (userResult.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid session token' });
        }

        // Build update query dynamically
        const allowedFields = ['display_name', 'profile_image_url', 'verified', 'followers_count'];
        const updateFields = [];
        const updateValues = [];
        let paramIndex = 1;

        for (const field of allowedFields) {
            if (updates[field] !== undefined) {
                updateFields.push(`${field} = $${paramIndex}`);
                updateValues.push(updates[field]);
                paramIndex++;
            }
        }

        if (updateFields.length === 0) {
            return res.status(400).json({ error: 'No valid fields to update' });
        }

        updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
        updateValues.push(session_token);

        const updateQuery = `
            UPDATE authenticated_users 
            SET ${updateFields.join(', ')}
            WHERE session_token = $${paramIndex}
            RETURNING *;
        `;

        const result = await client.query(updateQuery, updateValues);

        res.status(200).json({
            success: true,
            user: result.rows[0]
        });

    } catch (error) {
        console.error('Error updating user profile:', error);
        res.status(500).json({ error: 'Failed to update user profile' });
    } finally {
        client.release();
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
