import { Pool } from 'pg';
import Joi from 'joi';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

const scoreSchema = Joi.object({
    game: Joi.string().valid('coco-run', 'flappy-coco').required(),
    score: Joi.number().integer().min(0).max(1000000).required(),
    level_reached: Joi.number().integer().min(1).max(100).default(1),
    play_time_seconds: Joi.number().integer().min(0).max(3600).default(0),
    username: Joi.string().min(1).max(50).required(),
    twitter_handle: Joi.string().min(1).max(15).optional().allow(null)
});

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const client = await pool.connect();
    
    try {
        const { error, value } = scoreSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }

        const { game, score, level_reached, play_time_seconds, username, twitter_handle } = value;

        await client.query('BEGIN');

        // Get or create player
        let playerResult = await client.query(
            'SELECT id FROM players WHERE username = $1',
            [username]
        );

        let playerId;
        if (playerResult.rows.length === 0) {
            // Create new player
            const newPlayerResult = await client.query(
                'INSERT INTO players (username, twitter_handle) VALUES ($1, $2) RETURNING id',
                [username, twitter_handle]
            );
            playerId = newPlayerResult.rows[0].id;
        } else {
            playerId = playerResult.rows[0].id;
            // Update twitter handle if provided
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
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'Invalid game specified' });
        }

        const gameId = gameResult.rows[0].id;

        // Insert score
        const scoreResult = await client.query(
            'INSERT INTO scores (player_id, game_id, score, level_reached, play_time_seconds) VALUES ($1, $2, $3, $4, $5) RETURNING id, created_at',
            [playerId, gameId, score, level_reached, play_time_seconds]
        );

        const newScore = scoreResult.rows[0];

        // Get the rank of the new score
        const rankQuery = `
            SELECT COUNT(*) + 1 as rank
            FROM scores s
            JOIN games g ON s.game_id = g.id
            WHERE g.name = $1 AND (s.score > $2 OR (s.score = $2 AND s.created_at < $3))
        `;

        const rankResult = await client.query(rankQuery, [game, score, newScore.created_at]);
        const rank = parseInt(rankResult.rows[0].rank);

        await client.query('COMMIT');

        res.status(201).json({
            message: 'Score submitted successfully',
            score: {
                id: newScore.id,
                game,
                score,
                rank,
                username,
                twitter_handle,
                created_at: newScore.created_at
            }
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error submitting score:', error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        client.release();
    }
}
