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

    if (req.method === 'POST') {
        return storeUserProfile(req, res);
    } else if (req.method === 'GET') {
        return getUserProfile(req, res);
    } else if (req.method === 'PUT') {
        return updateUserProfile(req, res);
    } else {
        return res.status(405).json({ error: 'Method not allowed' });
    }
}

async function storeUserProfile(req, res) {
    const client = await pool.connect();
    
    try {
        const { user, session_token } = req.body;
        
        if (!user || !user.id || !user.username) {
            return res.status(400).json({ error: 'Invalid user data' });
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

        // Create index for faster lookups
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

        res.status(200).json({
            success: true,
            user: result.rows[0]
        });

    } catch (error) {
        console.error('Error storing user profile:', error);
        res.status(500).json({ error: 'Failed to store user profile' });
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
