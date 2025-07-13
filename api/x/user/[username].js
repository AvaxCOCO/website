export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { username } = req.query;
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

        res.status(200).json({
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
}
