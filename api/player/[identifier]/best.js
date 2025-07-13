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
        const { identifier } = req.query;

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

        res.status(200).json({
            player: identifier,
            personal_bests: result.rows,
            generated_at: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error fetching player stats:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
