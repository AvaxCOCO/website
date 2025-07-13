import { Pool } from 'pg';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { game } = req.query;
        const limit = Math.min(parseInt(req.query.limit) || 10, 100);

        if (!['coco-run', 'flappy-coco'].includes(game)) {
            return res.status(400).json({ error: 'Invalid game specified' });
        }

        const query = `
            SELECT 
                s.id,
                g.name as game,
                s.score,
                s.level_reached,
                s.play_time_seconds,
                p.username,
                p.twitter_handle,
                s.created_at,
                ROW_NUMBER() OVER (ORDER BY s.score DESC, s.created_at ASC) as rank
            FROM scores s
            JOIN games g ON s.game_id = g.id
            JOIN players p ON s.player_id = p.id
            WHERE g.name = $1 
            ORDER BY s.score DESC, s.created_at ASC 
            LIMIT $2
        `;

        const result = await pool.query(query, [game, limit]);
        
        res.status(200).json({
            game,
            leaderboard: result.rows,
            total_entries: result.rows.length,
            generated_at: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
