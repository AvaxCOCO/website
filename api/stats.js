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
        const queries = [
            'SELECT COUNT(DISTINCT p.id) as total_players FROM players p JOIN scores s ON p.id = s.player_id',
            'SELECT COUNT(*) as total_games_played FROM scores',
            `SELECT g.name as game, COUNT(*) as count, MAX(s.score) as high_score, AVG(s.score) as average_score 
             FROM scores s 
             JOIN games g ON s.game_id = g.id 
             GROUP BY g.name`
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

        res.status(200).json({
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
}
