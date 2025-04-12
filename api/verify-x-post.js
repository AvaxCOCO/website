const fetch = require('node-fetch');
const db = require('./db');

/**
 * Verifies a user's X post containing their verification code
 * This approach minimizes API calls while still providing real X activity verification
 */
module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get the user's X token from the Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Get the verification code from the request body
    const { verificationCode } = req.body;
    
    if (!verificationCode) {
      return res.status(400).json({ error: 'Missing verification code' });
    }
    
    // First, get the user's X ID
    const userResponse = await fetch('https://api.twitter.com/2/users/me', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!userResponse.ok) {
      return res.status(userResponse.status).json({ 
        error: 'Failed to fetch user data from X' 
      });
    }
    
    const userData = await userResponse.json();
    const userId = userData.data.id;
    
    // Now fetch the user's recent tweets (fetch more to increase chance of finding verification)
    const tweetsResponse = await fetch(
      `https://api.twitter.com/2/users/${userId}/tweets?max_results=50&tweet.fields=created_at,text`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    if (!tweetsResponse.ok) {
      return res.status(tweetsResponse.status).json({ 
        error: 'Failed to fetch tweets from X' 
      });
    }
    
    const tweetsData = await tweetsResponse.json();
    
    // Check if any of the tweets contain the verification code and $COCO
    const verificationTweet = tweetsData.data?.find(tweet => 
      tweet.text.includes(verificationCode) && 
      (tweet.text.includes('$COCO') || tweet.text.includes('@AVAXCOCO'))
    );
    
    if (!verificationTweet) {
      return res.status(404).json({ 
        verified: false,
        error: 'No tweet found with your verification code and $COCO mention' 
      });
    }
    
    // Get or create the user in our database
    const xUser = {
      id: userId,
      handle: '@' + userData.data.username,
      name: userData.data.name,
      profileImage: userData.data.profile_image_url
    };
    
    const dbUserId = await db.createOrUpdateUser(xUser);
    
    // Check if this tweet has already been verified
    const existingActivity = await db.getActivityByXId(verificationTweet.id);
    
    if (existingActivity) {
      return res.status(409).json({ 
        verified: false,
        error: 'This tweet has already been verified' 
      });
    }
    
    // Record the activity
    const points = 50; // Award 50 points for verification post
    const activityId = await db.recordActivity(
      dbUserId,
      'verification',
      verificationTweet.text,
      verificationTweet.id,
      points
    );
    
    // Update user points
    const pointsResult = await db.updateUserPoints(dbUserId, points);
    
    // Get the user's updated rank
    const userRecord = await db.getUserByXId(userId);
    
    // Return success response
    res.status(200).json({
      verified: true,
      points: points,
      totalPoints: pointsResult.totalPoints,
      level: pointsResult.level,
      rank: userRecord.rank || 'N/A',
      tweetId: verificationTweet.id
    });
  } catch (error) {
    console.error('Error verifying X post:', error);
    res.status(500).json({ 
      verified: false,
      error: 'Failed to verify X post' 
    });
  }
};