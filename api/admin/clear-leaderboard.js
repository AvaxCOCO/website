import { Pool } from 'pg';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Simple admin key check - you can set this in Vercel environment variables
    const adminKey = req.headers['x-admin-key'] || req.body.adminKey;
    if (!adminKey || adminKey !== process.env.ADMIN_KEY) {
        return res.status(401).json({ error: 'Unauthorized - Invalid admin key' });
    }

    const client = await pool.connect();
    
    try {
        const { game } = req.body;

        await client.query('BEGIN');

        if (game && (game === 'coco-run' || game === 'flappy-coco')) {
            // Clear specific game leaderboard
            const gameResult = await client.query(
                'SELECT id FROM games WHERE name = $1',
                [game]
            );

            if (gameResult.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(400).json({ error: 'Invalid game specified' });
            }

            const gameId = gameResult.rows[0].id;

            // Delete scores for specific game
            const deleteResult = await client.query(
                'DELETE FROM scores WHERE game_id = $1',
                [gameId]
            );

            await client.query('COMMIT');

            res.status(200).json({
                message: `Successfully cleared ${game} leaderboard`,
                deletedScores: deleteResult.rowCount
            });

        } else if (req.body.clearAll === true) {
            // Clear all leaderboards
            const deleteResult = await client.query('DELETE FROM scores');
            
            await client.query('COMMIT');

            res.status(200).json({
                message: 'Successfully cleared all leaderboards',
                deletedScores: deleteResult.rowCount
            });

        } else {
            await client.query('ROLLBACK');
            return res.status(400).json({ 
                error: 'Must specify either "game" (coco-run or flappy-coco) or "clearAll": true' 
            });
        }

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error clearing leaderboard:', error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        client.release();
    }
}
