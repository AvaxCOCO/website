export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { Pool } = require('pg');
        
        // Create connection pool
        const pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
        });

        // Get current timestamp for archival
        const resetTime = new Date().toISOString();
        
        // Archive current leaderboard data before reset
        await pool.query(`
            INSERT INTO leaderboard_archive (
                game, username, score, level_reached, play_time_seconds, 
                player_name, twitter_handle, created_at, archived_at, reset_week
            )
            SELECT 
                game, username, score, level_reached, play_time_seconds,
                player_name, twitter_handle, created_at, $1 as archived_at,
                EXTRACT(WEEK FROM $1) as reset_week
            FROM leaderboard
        `, [resetTime]);

        // Clear current leaderboard
        await pool.query('DELETE FROM leaderboard');

        // Log the reset event
        await pool.query(`
            INSERT INTO leaderboard_resets (reset_time, scores_archived)
            SELECT $1, COUNT(*) FROM leaderboard_archive WHERE archived_at = $1
        `, [resetTime]);

        await pool.end();

        console.log(`Leaderboard reset completed at ${resetTime}`);
        
        res.status(200).json({ 
            success: true, 
            message: 'Leaderboard reset successfully',
            reset_time: resetTime
        });

    } catch (error) {
        console.error('Error resetting leaderboard:', error);
        res.status(500).json({ 
            error: 'Failed to reset leaderboard',
            details: error.message 
        });
    }
}
