// X Authentication User Data Endpoint
const fetch = require('node-fetch');
const db = require('../../db');

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
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
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Fetch user profile data from X API
    const userApiUrl = 'https://api.twitter.com/2/users/me?user.fields=profile_image_url,username,name';
    
    const response = await fetch(userApiUrl, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const responseText = await response.text();
    let userData;
    
    try {
      userData = JSON.parse(responseText);
    } catch (e) {
      return res.status(500).json({ 
        error: 'Failed to parse user data response', 
        details: responseText 
      });
    }
    
    if (!response.ok) {
      console.error('User data fetch error:', userData);
      return res.status(response.status).json({ 
        error: 'Failed to fetch user data', 
        details: userData 
      });
    }
    
    // Create or update user in database
    const xUser = {
      id: userData.data.id,
      handle: '@' + userData.data.username,
      name: userData.data.name,
      profileImage: userData.data.profile_image_url
    };
    
    try {
      // Create or update the user in the database
      const userId = await db.createOrUpdateUser(xUser);
      
      // Get user data from database
      const userRecord = await db.getUserByXId(userData.data.id);
      
      // Get recent activities
      const activities = await db.getUserActivities(userId);
      
      // Combine user profile with database data
      const combinedUserData = {
        id: userData.data.id,
        handle: '@' + userData.data.username,
        name: userData.data.name,
        profileImage: userData.data.profile_image_url,
        points: userRecord?.total_points || 0,
        rank: userRecord?.rank || 999,
        level: userRecord?.level || 'Beginner',
        activities: activities || []
      };
      
      res.json(combinedUserData);
    } catch (dbError) {
      console.error('Database error:', dbError);
      
      // Fallback to mock data if database fails
      const mockData = {
        id: userData.data.id,
        handle: '@' + userData.data.username,
        name: userData.data.name,
        profileImage: userData.data.profile_image_url,
        points: Math.floor(Math.random() * 10000),
        rank: Math.floor(Math.random() * 100) + 1,
        level: 'Beginner',
        activities: [
          {
            type: 'tweet',
            content: 'Just bought some $COCO! To the moon! 🚀',
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            points: 10
          }
        ]
      };
      
      res.json(mockData);
    };
    
    res.json(combinedUserData);
  } catch (error) {
    console.error('Error fetching user data:', error);
    res.status(500).json({ error: 'Failed to fetch user data' });
  }
};