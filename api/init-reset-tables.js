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

        // Create leaderboard_archive table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS leaderboard_archive (
                id SERIAL PRIMARY KEY,
                game VARCHAR(50) NOT NULL,
                username VARCHAR(100),
                score INTEGER NOT NULL,
                level_reached INTEGER DEFAULT 1,
                play_time_seconds INTEGER DEFAULT 0,
                player_name VARCHAR(100),
                twitter_handle VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                archived_at TIMESTAMP NOT NULL,
                reset_week INTEGER,
                INDEX idx_archive_game (game),
                INDEX idx_archive_reset_week (reset_week),
                INDEX idx_archive_twitter (twitter_handle)
            )
        `);

        // Create leaderboard_resets table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS leaderboard_resets (
                id SERIAL PRIMARY KEY,
                reset_time TIMESTAMP NOT NULL,
                scores_archived INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create leaderboard_seasons table for tracking seasons
        await pool.query(`
            CREATE TABLE IF NOT EXISTS leaderboard_seasons (
                id SERIAL PRIMARY KEY,
                season_number INTEGER UNIQUE NOT NULL,
                start_date TIMESTAMP NOT NULL,
                end_date TIMESTAMP,
                total_players INTEGER DEFAULT 0,
                total_games INTEGER DEFAULT 0,
                coco_run_winner VARCHAR(100),
                coco_run_high_score INTEGER,
                flappy_coco_winner VARCHAR(100),
                flappy_coco_high_score INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await pool.end();

        console.log('Reset tables initialized successfully');
        
        res.status(200).json({ 
            success: true, 
            message: 'Reset tables initialized successfully',
            tables_created: [
                'leaderboard_archive',
                'leaderboard_resets', 
                'leaderboard_seasons'
            ]
        });

    } catch (error) {
        console.error('Error initializing reset tables:', error);
        res.status(500).json({ 
            error: 'Failed to initialize reset tables',
            details: error.message 
        });
    }
}
