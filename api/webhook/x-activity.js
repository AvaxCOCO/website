const db = require('../db');

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
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
    // Verify the request is from X
    const xToken = req.headers['x-twitter-webhooks-signature'];
    
    if (!xToken) {
      console.warn('Missing X signature header');
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // In a production environment, you should verify the signature
    // This is a simplified version for demonstration
    
    // Process the webhook payload
    const payload = req.body;
    console.log('Received webhook payload:', JSON.stringify(payload));
    
    // Check if this is a CRC check from X
    if (payload.crc_token) {
      const hmac = require('crypto').createHmac('sha256', process.env.X_CONSUMER_SECRET)
        .update(payload.crc_token)
        .digest('base64');
      
      return res.json({ response_token: 'sha256=' + hmac });
    }
    
    // Process different types of activities
    if (payload.tweet_create_events) {
      await processTweets(payload.tweet_create_events);
    }
    
    if (payload.favorite_events) {
      await processFavorites(payload.favorite_events);
    }
    
    if (payload.retweet_events) {
      await processRetweets(payload.retweet_events);
    }
    
    // Return success response
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ error: 'Failed to process webhook' });
  }
};

/**
 * Process tweets and award points
 * @param {Array} tweets - Array of tweet objects
 */
async function processTweets(tweets) {
  for (const tweet of tweets) {
    try {
      // Skip tweets from the $COCO account itself
      if (tweet.user.screen_name.toLowerCase() === 'avaxcoco') {
        continue;
      }
      
      // Check if the tweet mentions $COCO
      const hasCoco = tweet.text.toLowerCase().includes('$coco') || 
                      tweet.text.toLowerCase().includes('#coco');
      
      if (hasCoco) {
        // Get or create user
        const xUser = {
          id: tweet.user.id_str,
          handle: '@' + tweet.user.screen_name,
          name: tweet.user.name,
          profileImage: tweet.user.profile_image_url_https
        };
        
        const userId = await db.createOrUpdateUser(xUser);
        
        // Record the activity
        const activityId = await db.recordActivity(
          userId,
          'tweet',
          tweet.text,
          tweet.id_str,
          10 // Points for mentioning $COCO in a tweet
        );
        
        // Update user points
        await db.updateUserPoints(userId, 10);
        
        console.log(`Awarded 10 points to ${xUser.handle} for tweeting about $COCO`);
      }
    } catch (error) {
      console.error('Error processing tweet:', error);
    }
  }
}

/**
 * Process favorites (likes) and award points
 * @param {Array} favorites - Array of favorite event objects
 */
async function processFavorites(favorites) {
  for (const favorite of favorites) {
    try {
      // Skip likes from the $COCO account itself
      if (favorite.user.screen_name.toLowerCase() === 'avaxcoco') {
        continue;
      }
      
      // Check if the liked tweet is from $COCO or mentions $COCO
      const isCocoTweet = favorite.favorited_status.user.screen_name.toLowerCase() === 'avaxcoco';
      const mentionsCoco = favorite.favorited_status.text.toLowerCase().includes('$coco') || 
                          favorite.favorited_status.text.toLowerCase().includes('#coco');
      
      if (isCocoTweet || mentionsCoco) {
        // Get or create user
        const xUser = {
          id: favorite.user.id_str,
          handle: '@' + favorite.user.screen_name,
          name: favorite.user.name,
          profileImage: favorite.user.profile_image_url_https
        };
        
        const userId = await db.createOrUpdateUser(xUser);
        
        // Record the activity
        const activityId = await db.recordActivity(
          userId,
          'like',
          `Liked: ${favorite.favorited_status.text}`,
          favorite.favorited_status.id_str,
          2 // Points for liking a $COCO tweet
        );
        
        // Update user points
        await db.updateUserPoints(userId, 2);
        
        console.log(`Awarded 2 points to ${xUser.handle} for liking a $COCO tweet`);
      }
    } catch (error) {
      console.error('Error processing favorite:', error);
    }
  }
}

/**
 * Process retweets and award points
 * @param {Array} retweets - Array of retweet event objects
 */
async function processRetweets(retweets) {
  for (const retweet of retweets) {
    try {
      // Skip retweets from the $COCO account itself
      if (retweet.user.screen_name.toLowerCase() === 'avaxcoco') {
        continue;
      }
      
      // Check if the retweeted tweet is from $COCO or mentions $COCO
      const isCocoTweet = retweet.retweeted_status.user.screen_name.toLowerCase() === 'avaxcoco';
      const mentionsCoco = retweet.retweeted_status.text.toLowerCase().includes('$coco') || 
                          retweet.retweeted_status.text.toLowerCase().includes('#coco');
      
      if (isCocoTweet || mentionsCoco) {
        // Get or create user
        const xUser = {
          id: retweet.user.id_str,
          handle: '@' + retweet.user.screen_name,
          name: retweet.user.name,
          profileImage: retweet.user.profile_image_url_https
        };
        
        const userId = await db.createOrUpdateUser(xUser);
        
        // Record the activity
        const activityId = await db.recordActivity(
          userId,
          'retweet',
          `Retweeted: ${retweet.retweeted_status.text}`,
          retweet.retweeted_status.id_str,
          5 // Points for retweeting a $COCO tweet
        );
        
        // Update user points
        await db.updateUserPoints(userId, 5);
        
        console.log(`Awarded 5 points to ${xUser.handle} for retweeting a $COCO tweet`);
      }
    } catch (error) {
      console.error('Error processing retweet:', error);
    }
  }
}