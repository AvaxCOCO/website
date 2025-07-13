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
    player_name: Joi.string().min(1).max(50).required(),
    twitter_handle: Joi.string().min(1).max(15).optional().allow(null)
});

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

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
}
