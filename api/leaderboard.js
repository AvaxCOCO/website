const db = require('./db');

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;
    
    const leaderboard = await db.getLeaderboard(limit, offset);
    
    res.json(leaderboard);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    
    // Return mock data if database fails
    const mockLeaderboard = Array.from({ length: 10 }, (_, i) => ({
      x_id: `user${i+1}`,
      handle: `@user${i+1}`,
      name: `User ${i+1}`,
      profile_image_url: 'https://via.placeholder.com/50',
      total_points: 10000 - (i * 1000),
      rank: i + 1,
      level: i < 3 ? 'Gold' : i < 6 ? 'Silver' : 'Bronze'
    }));
    
    res.json(mockLeaderboard);
  }
};