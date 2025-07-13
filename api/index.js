const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const Joi = require('joi');
const { Pool } = require('pg');

// Initialize Express app
const app = express();

// Database connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Middleware
app.use(helmet());
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'https://avaxcoco.com', 'https://www.avaxcoco.com'],
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    message: { error: 'Too many requests, please try again later.' }
});
app.use(limiter);

// Validation schemas
const scoreSchema = Joi.object({
    game: Joi.string().valid('coco-run', 'flappy-coco').required(),
    score: Joi.number().integer().min(0).max(1000000).required(),
    level_reached: Joi.number().integer().min(1).max(100).default(1),
    play_time_seconds: Joi.number().integer().min(0).max(3600).default(0),
    player_name: Joi.string().min(1).max(50).required(),
    twitter_handle: Joi.string().min(1).max(15).optional().allow(null)
});

// Routes

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Get leaderboard for a specific game
app.get('/leaderboard/:game', async (req, res) => {
    try {
        const { game } = req.params;
        const limit = Math.min(parseInt(req.query.limit) || 10, 100);

        if (!['coco-run', 'flappy-coco'].includes(game)) {
            return res.status(400).json({ error: 'Invalid game specified' });
        }

        const query = `
            SELECT 
                id,
                game,
                score,
                level_reached,
                play_time_seconds,
                player_name as username,
                twitter_handle,
                created_at,
                ROW_NUMBER() OVER (ORDER BY score DESC, created_at ASC) as rank
            FROM scores 
            WHERE game = $1 
            ORDER BY score DESC, created_at ASC 
            LIMIT $2
        `;

        const result = await pool.query(query, [game, limit]);
        
        res.json({
            game,
            leaderboard: result.rows,
            total_entries: result.rows.length,
            generated_at: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Submit a new score
app.post('/score', async (req, res) => {
    try {
        const { error, value } = scoreSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }

        const { game, score, level_reached, play_time_seconds, player_name, twitter_handle } = value;

        const query = `
            INSERT INTO scores (game, score, level_reached, play_time_seconds, player_name, twitter_handle)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id, created_at
        `;

        const result = await pool.query(query, [
            game, score, level_reached, play_time_seconds, player_name, twitter_handle
        ]);

        const newScore = result.rows[0];

        // Get the rank of the new score
        const rankQuery = `
            SELECT COUNT(*) + 1 as rank
            FROM scores 
            WHERE game = $1 AND (score > $2 OR (score = $2 AND created_at < $3))
        `;

        const rankResult = await pool.query(rankQuery, [game, score, newScore.created_at]);
        const rank = parseInt(rankResult.rows[0].rank);

        res.status(201).json({
            message: 'Score submitted successfully',
            score: {
                id: newScore.id,
                game,
                score,
                rank,
                player_name,
                twitter_handle,
                created_at: newScore.created_at
            }
        });

    } catch (error) {
        console.error('Error submitting score:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get player's personal best scores
app.get('/player/:identifier/best', async (req, res) => {
    try {
        const { identifier } = req.params;

        const query = `
            SELECT 
                game,
                MAX(score) as best_score,
                COUNT(*) as games_played,
                AVG(score) as average_score
            FROM scores 
            WHERE player_name = $1 OR twitter_handle = $1
            GROUP BY game
            ORDER BY game
        `;

        const result = await pool.query(query, [identifier]);

        res.json({
            player: identifier,
            personal_bests: result.rows,
            generated_at: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error fetching player stats:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get overall statistics
app.get('/stats', async (req, res) => {
    try {
        const queries = [
            'SELECT COUNT(DISTINCT COALESCE(twitter_handle, player_name)) as total_players FROM scores',
            'SELECT COUNT(*) as total_games_played FROM scores',
            'SELECT game, COUNT(*) as count, MAX(score) as high_score, AVG(score) as average_score FROM scores GROUP BY game'
        ];

        const [playersResult, gamesResult, gameStatsResult] = await Promise.all([
            pool.query(queries[0]),
            pool.query(queries[1]),
            pool.query(queries[2])
        ]);

        const gameStats = {};
        gameStatsResult.rows.forEach(row => {
            gameStats[row.game] = {
                total_games: parseInt(row.count),
                high_score: parseInt(row.high_score),
                average_score: parseFloat(row.average_score).toFixed(1)
            };
        });

        res.json({
            overall: {
                total_players: parseInt(playersResult.rows[0].total_players),
                total_games_played: parseInt(gamesResult.rows[0].total_games_played)
            },
            by_game: gameStats,
            generated_at: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// X (Twitter) API integration
app.get('/x/user/:username', async (req, res) => {
    try {
        const { username } = req.params;
        const bearerToken = process.env.X_BEARER_TOKEN;

        if (!bearerToken) {
            return res.status(503).json({ 
                error: 'X API not configured',
                message: 'Bearer token not available'
            });
        }

        const response = await fetch(`https://api.twitter.com/2/users/by/username/${username}?user.fields=name,profile_image_url,verified,public_metrics`, {
            headers: {
                'Authorization': `Bearer ${bearerToken}`,
                'User-Agent': 'COCO-Arcade-Bot/1.0'
            }
        });

        if (!response.ok) {
            if (response.status === 404) {
                return res.status(404).json({ error: 'User not found' });
            }
            throw new Error(`X API error: ${response.status}`);
        }

        const data = await response.json();
        
        if (!data.data) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            username: data.data.username,
            name: data.data.name,
            profile_image_url: data.data.profile_image_url,
            verified: data.data.verified || false,
            public_metrics: data.data.public_metrics || {}
        });

    } catch (error) {
        console.error('Error fetching X user data:', error);
        res.status(500).json({ error: 'Failed to fetch user data' });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

module.exports = app;
