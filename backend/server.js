const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const Joi = require('joi');
require('dotenv').config();

const { pool } = require('./scripts/init-db');

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
    message: {
        error: 'Too many requests from this IP, please try again later.'
    }
});
app.use('/api/', limiter);

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'https://avaxcoco.com',
    'https://www.avaxcoco.com'
];

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        // Check if origin starts with file:// for local file access
        if (origin.startsWith('file://')) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Validation schemas
const playerSchema = Joi.object({
    username: Joi.string().alphanum().min(3).max(30).required(),
    twitter_handle: Joi.string().alphanum().min(1).max(50).optional()
});

const scoreSchema = Joi.object({
    game: Joi.string().valid('coco-run', 'flappy-coco').required(),
    score: Joi.number().integer().min(0).max(999999999).required(),
    level_reached: Joi.number().integer().min(1).max(100).optional(),
    play_time_seconds: Joi.number().integer().min(0).max(7200).optional(),
    player_name: Joi.string().min(1).max(50).required(),
    twitter_handle: Joi.string().alphanum().min(1).max(50).optional()
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        service: '$COCO Leaderboard API'
    });
});

// Get leaderboard for a specific game
app.get('/api/leaderboard/:game', async (req, res) => {
    try {
        const { game } = req.params;
        const limit = Math.min(parseInt(req.query.limit) || 10, 100);
        
        if (!['coco-run', 'flappy-coco'].includes(game)) {
            return res.status(400).json({ error: 'Invalid game name' });
        }
        
        const query = `
            SELECT 
                s.score,
                s.level_reached,
                s.created_at,
                p.username,
                p.twitter_handle,
                ROW_NUMBER() OVER (ORDER BY s.score DESC) as rank
            FROM scores s
            JOIN players p ON s.player_id = p.id
            JOIN games g ON s.game_id = g.id
            WHERE g.name = $1
            ORDER BY s.score DESC
            LIMIT $2
        `;
        
        const result = await pool.query(query, [game, limit]);
        
        res.json({
            game,
            leaderboard: result.rows,
            total_entries: result.rows.length
        });
        
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get player's personal best scores
app.get('/api/player/:username/best', async (req, res) => {
    try {
        const { username } = req.params;
        
        const query = `
            SELECT 
                g.name as game,
                g.display_name,
                MAX(s.score) as best_score,
                MAX(s.level_reached) as best_level,
                COUNT(s.id) as total_plays
            FROM scores s
            JOIN players p ON s.player_id = p.id
            JOIN games g ON s.game_id = g.id
            WHERE p.username = $1
            GROUP BY g.id, g.name, g.display_name
            ORDER BY g.name
        `;
        
        const result = await pool.query(query, [username]);
        
        res.json({
            username,
            personal_bests: result.rows
        });
        
    } catch (error) {
        console.error('Error fetching personal bests:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Submit a new score
app.post('/api/score', async (req, res) => {
    try {
        // Validate request body
        const { error, value } = scoreSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }
        
        const { game, score, level_reached, play_time_seconds, player_name, twitter_handle } = value;
        
        const client = await pool.connect();
        
        try {
            await client.query('BEGIN');
            
            // Get or create player
            let playerResult = await client.query(
                'SELECT id FROM players WHERE username = $1',
                [player_name]
            );
            
            let playerId;
            if (playerResult.rows.length === 0) {
                // Create new player
                const insertPlayerResult = await client.query(
                    'INSERT INTO players (username, twitter_handle) VALUES ($1, $2) RETURNING id',
                    [player_name, twitter_handle || null]
                );
                playerId = insertPlayerResult.rows[0].id;
            } else {
                playerId = playerResult.rows[0].id;
                
                // Update Twitter handle if provided
                if (twitter_handle) {
                    await client.query(
                        'UPDATE players SET twitter_handle = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
                        [twitter_handle, playerId]
                    );
                }
            }
            
            // Get game ID
            const gameResult = await client.query(
                'SELECT id FROM games WHERE name = $1',
                [game]
            );
            
            if (gameResult.rows.length === 0) {
                throw new Error('Game not found');
            }
            
            const gameId = gameResult.rows[0].id;
            
            // Insert score
            const scoreResult = await client.query(
                `INSERT INTO scores (player_id, game_id, score, level_reached, play_time_seconds) 
                 VALUES ($1, $2, $3, $4, $5) RETURNING id, created_at`,
                [playerId, gameId, score, level_reached || 1, play_time_seconds || 0]
            );
            
            await client.query('COMMIT');
            
            // Get player's rank for this score
            const rankResult = await client.query(
                `SELECT COUNT(*) + 1 as rank 
                 FROM scores s 
                 JOIN games g ON s.game_id = g.id 
                 WHERE g.name = $1 AND s.score > $2`,
                [game, score]
            );
            
            res.status(201).json({
                success: true,
                score_id: scoreResult.rows[0].id,
                rank: parseInt(rankResult.rows[0].rank),
                message: 'Score submitted successfully!'
            });
            
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
        
    } catch (error) {
        console.error('Error submitting score:', error);
        res.status(500).json({ error: 'Failed to submit score' });
    }
});

// Get leaderboard statistics
app.get('/api/stats', async (req, res) => {
    try {
        const statsQuery = `
            SELECT 
                COUNT(DISTINCT p.id) as total_players,
                COUNT(s.id) as total_games_played,
                MAX(s.score) as highest_score,
                AVG(s.score)::INTEGER as average_score
            FROM scores s
            JOIN players p ON s.player_id = p.id
        `;
        
        const gameStatsQuery = `
            SELECT 
                g.name,
                g.display_name,
                COUNT(s.id) as plays,
                MAX(s.score) as high_score,
                AVG(s.score)::INTEGER as avg_score
            FROM games g
            LEFT JOIN scores s ON g.id = s.game_id
            GROUP BY g.id, g.name, g.display_name
            ORDER BY g.name
        `;
        
        const [statsResult, gameStatsResult] = await Promise.all([
            pool.query(statsQuery),
            pool.query(gameStatsQuery)
        ]);
        
        res.json({
            overall: statsResult.rows[0],
            by_game: gameStatsResult.rows
        });
        
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Unhandled error:', error);
    res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 $COCO Leaderboard API running on port ${PORT}`);
    console.log(`🎮 Environment: ${process.env.NODE_ENV}`);
    console.log(`📊 Database: Connected to Neon PostgreSQL`);
    console.log(`🔗 CORS enabled for: ${allowedOrigins.join(', ')}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    pool.end(() => {
        console.log('Database pool closed');
        process.exit(0);
    });
});
