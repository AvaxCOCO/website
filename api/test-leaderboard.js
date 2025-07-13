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

        // Mock data for testing
        const mockData = {
            'coco-run': [
                {
                    id: 1,
                    game: 'coco-run',
                    score: 15420,
                    level_reached: 8,
                    play_time_seconds: 245,
                    username: 'CocoChampion',
                    twitter_handle: 'cocochamp',
                    created_at: '2024-01-15T10:30:00Z',
                    rank: 1
                },
                {
                    id: 2,
                    game: 'coco-run',
                    score: 12850,
                    level_reached: 7,
                    play_time_seconds: 198,
                    username: 'AvaxRunner',
                    twitter_handle: 'avaxrunner',
                    created_at: '2024-01-14T15:45:00Z',
                    rank: 2
                },
                {
                    id: 3,
                    game: 'coco-run',
                    score: 11200,
                    level_reached: 6,
                    play_time_seconds: 167,
                    username: 'PlatformMaster',
                    twitter_handle: null,
                    created_at: '2024-01-13T09:20:00Z',
                    rank: 3
                }
            ],
            'flappy-coco': [
                {
                    id: 4,
                    game: 'flappy-coco',
                    score: 89,
                    level_reached: 1,
                    play_time_seconds: 45,
                    username: 'FlappyPro',
                    twitter_handle: 'flappypro',
                    created_at: '2024-01-15T14:20:00Z',
                    rank: 1
                },
                {
                    id: 5,
                    game: 'flappy-coco',
                    score: 67,
                    level_reached: 1,
                    play_time_seconds: 32,
                    username: 'WingMaster',
                    twitter_handle: 'wingmaster',
                    created_at: '2024-01-14T11:30:00Z',
                    rank: 2
                },
                {
                    id: 6,
                    game: 'flappy-coco',
                    score: 45,
                    level_reached: 1,
                    play_time_seconds: 23,
                    username: 'CocoPilot',
                    twitter_handle: null,
                    created_at: '2024-01-13T16:45:00Z',
                    rank: 3
                }
            ]
        };

        const gameData = mockData[game] || [];
        const limitedData = gameData.slice(0, limit);
        
        res.status(200).json({
            game,
            leaderboard: limitedData,
            total_entries: limitedData.length,
            generated_at: new Date().toISOString(),
            note: 'This is mock data for testing purposes'
        });

    } catch (error) {
        console.error('Error in test leaderboard:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
