import { Pool } from 'pg';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const client = await pool.connect();
    
    try {
        console.log('🚀 Initializing $COCO Leaderboard Database...');
        
        // Create players table
        await client.query(`
            CREATE TABLE IF NOT EXISTS players (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                twitter_handle VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        
        // Create games table
        await client.query(`
            CREATE TABLE IF NOT EXISTS games (
                id SERIAL PRIMARY KEY,
                name VARCHAR(50) UNIQUE NOT NULL,
                display_name VARCHAR(100) NOT NULL,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        
        // Create scores table
        await client.query(`
            CREATE TABLE IF NOT EXISTS scores (
                id SERIAL PRIMARY KEY,
                player_id INTEGER REFERENCES players(id) ON DELETE CASCADE,
                game_id INTEGER REFERENCES games(id) ON DELETE CASCADE,
                score INTEGER NOT NULL,
                level_reached INTEGER DEFAULT 1,
                play_time_seconds INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        
        // Create indexes for better performance
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_scores_game_score ON scores(game_id, score DESC);
        `);
        
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_scores_player_game ON scores(player_id, game_id);
        `);
        
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_players_twitter ON players(twitter_handle);
        `);
        
        // Insert default games
        const gameResult = await client.query(`
            INSERT INTO games (name, display_name, description) 
            VALUES 
                ('coco-run', 'COCO Run', 'Help COCO run and jump through platforms!'),
                ('flappy-coco', 'Flappy COCO', 'Navigate COCO through obstacles in this flappy bird style game!')
            ON CONFLICT (name) DO NOTHING
            RETURNING *;
        `);
        
        // Create reset system tables
        await client.query(`
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
                reset_week INTEGER
            );
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS leaderboard_resets (
                id SERIAL PRIMARY KEY,
                reset_time TIMESTAMP NOT NULL,
                scores_archived INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        await client.query(`
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
            );
        `);

        // Create indexes for reset tables
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_archive_game ON leaderboard_archive(game);
        `);
        
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_archive_reset_week ON leaderboard_archive(reset_week);
        `);
        
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_archive_twitter ON leaderboard_archive(twitter_handle);
        `);
        
        // Check existing games
        const existingGames = await client.query('SELECT * FROM games ORDER BY name');
        
        console.log('✅ Database initialized successfully!');
        
        res.status(200).json({
            message: 'Database and reset system initialized successfully',
            tables_created: ['players', 'games', 'scores', 'leaderboard_archive', 'leaderboard_resets', 'leaderboard_seasons'],
            games: existingGames.rows,
            new_games_added: gameResult.rows.length
        });
        
    } catch (error) {
        console.error('❌ Database initialization failed:', error);
        res.status(500).json({ 
            error: 'Database initialization failed',
            details: error.message 
        });
    } finally {
        client.release();
    }
}
