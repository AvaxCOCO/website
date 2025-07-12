const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function initializeDatabase() {
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
        await client.query(`
            INSERT INTO games (name, display_name, description) 
            VALUES 
                ('coco-run', 'COCO Run', 'Help COCO run and jump through platforms!'),
                ('flappy-coco', 'Flappy COCO', 'Navigate COCO through obstacles in this flappy bird style game!')
            ON CONFLICT (name) DO NOTHING;
        `);
        
        console.log('✅ Database initialized successfully!');
        console.log('📊 Tables created:');
        console.log('   - players (user accounts with Twitter integration)');
        console.log('   - games (COCO Run, Flappy COCO)');
        console.log('   - scores (leaderboard entries)');
        console.log('🎮 Ready for $COCO arcade action!');
        
    } catch (error) {
        console.error('❌ Database initialization failed:', error);
        throw error;
    } finally {
        client.release();
    }
}

// Run initialization if called directly
if (require.main === module) {
    initializeDatabase()
        .then(() => {
            console.log('🎉 Database setup complete!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Setup failed:', error);
            process.exit(1);
        });
}

module.exports = { initializeDatabase, pool };
