const fetch = require('node-fetch');
const db = require('../db');

module.exports = async (req, res) => {
  // Verify this is a scheduled function call
  // In Vercel, you can set up a CRON job to call this endpoint
  const isAuthorized = req.headers.authorization === `Bearer ${process.env.CRON_SECRET}`;
  
  if (!isAuthorized) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  try {
    console.log('Starting scheduled X search for $COCO mentions');
    
    // Get the bearer token for X API
    const bearerToken = process.env.X_BEARER_TOKEN;
    
    if (!bearerToken) {
      throw new Error('X_BEARER_TOKEN environment variable is not set');
    }
    
    // Search for recent tweets mentioning $COCO
    const searchResults = await searchXForCoco(bearerToken);
    
    // Process the search results
    const processedCount = await processSearchResults(searchResults);
    
    console.log(`Processed ${processedCount} tweets mentioning $COCO`);
    
    res.status(200).json({ 
      success: true, 
      processed: processedCount 
    });
  } catch (error) {
    console.error('Error in scheduled X search:', error);
    res.status(500).json({ error: 'Failed to search X for $COCO mentions' });
  }
};

/**
 * Search X for tweets mentioning $COCO
 * @param {string} bearerToken - X API bearer token
 * @returns {Array} - Array of tweet objects
 */
async function searchXForCoco(bearerToken) {
  // Define search queries
  const queries = [
    '$COCO',
    '#COCO',
    'AVAXCOCO',
    '$COCO AVAX'
  ];
  
  let allResults = [];
  
  for (const query of queries) {
    try {
      // Get current time minus 1 hour (to avoid duplicates with webhook)
      const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
      
      // Search URL with parameters
      const searchUrl = new URL('https://api.twitter.com/2/tweets/search/recent');
      searchUrl.searchParams.append('query', query);
      searchUrl.searchParams.append('start_time', oneHourAgo);
      searchUrl.searchParams.append('max_results', '100');
      searchUrl.searchParams.append('tweet.fields', 'created_at,author_id,text');
      searchUrl.searchParams.append('expansions', 'author_id');
      searchUrl.searchParams.append('user.fields', 'id,name,username,profile_image_url');
      
      const response = await fetch(searchUrl.toString(), {
        headers: {
          'Authorization': `Bearer ${bearerToken}`
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`X API error: ${response.status} ${errorText}`);
      }
      
      const data = await response.json();
      
      if (data.data && data.data.length > 0) {
        // Combine tweets with user data
        const tweets = data.data.map(tweet => {
          const user = data.includes.users.find(user => user.id === tweet.author_id);
          return {
            ...tweet,
            user: user
          };
        });
        
        allResults = [...allResults, ...tweets];
      }
    } catch (error) {
      console.error(`Error searching for "${query}":`, error);
    }
  }
  
  // Remove duplicates based on tweet ID
  const uniqueTweets = Array.from(
    new Map(allResults.map(tweet => [tweet.id, tweet])).values()
  );
  
  return uniqueTweets;
}

/**
 * Process search results and award points
 * @param {Array} tweets - Array of tweet objects
 * @returns {number} - Number of processed tweets
 */
async function processSearchResults(tweets) {
  let processedCount = 0;
  
  for (const tweet of tweets) {
    try {
      // Skip tweets from the $COCO account itself
      if (tweet.user.username.toLowerCase() === 'avaxcoco') {
        continue;
      }
      
      // Check if we've already processed this tweet
      const existingActivity = await db.getActivityByXId(tweet.id);
      
      if (existingActivity) {
        continue; // Skip already processed tweets
      }
      
      // Get or create user
      const xUser = {
        id: tweet.user.id,
        handle: '@' + tweet.user.username,
        name: tweet.user.name,
        profileImage: tweet.user.profile_image_url
      };
      
      const userId = await db.createOrUpdateUser(xUser);
      
      // Record the activity
      const activityId = await db.recordActivity(
        userId,
        'tweet',
        tweet.text,
        tweet.id,
        10 // Points for mentioning $COCO in a tweet
      );
      
      // Update user points
      await db.updateUserPoints(userId, 10);
      
      console.log(`Awarded 10 points to ${xUser.handle} for tweeting about $COCO`);
      processedCount++;
    } catch (error) {
      console.error('Error processing tweet:', error);
    }
  }
  
  return processedCount;
}