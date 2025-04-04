const fetch = require('node-fetch');
const db = require('../db');

/**
 * A simplified X activity tracker that works with the free tier of the X API
 * This uses the public search API which has limitations but doesn't require the paid plan
 */
module.exports = async (req, res) => {
  // Verify this is a scheduled function call
  const isAuthorized = req.headers.authorization === `Bearer ${process.env.CRON_SECRET}`;
  
  if (!isAuthorized) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  try {
    console.log('Starting basic X search for $COCO mentions');
    
    // Get the bearer token for X API
    const bearerToken = process.env.X_BEARER_TOKEN;
    
    if (!bearerToken) {
      throw new Error('X_BEARER_TOKEN environment variable is not set');
    }
    
    // Search for recent tweets mentioning $COCO using the free tier API
    const searchResults = await searchXForCocoBasic(bearerToken);
    
    // Process the search results
    const processedCount = await processSearchResults(searchResults);
    
    console.log(`Processed ${processedCount} tweets mentioning $COCO`);
    
    res.status(200).json({ 
      success: true, 
      processed: processedCount 
    });
  } catch (error) {
    console.error('Error in basic X search:', error);
    res.status(500).json({ error: 'Failed to search X for $COCO mentions' });
  }
};

/**
 * Search X for tweets mentioning $COCO using the free tier API
 * @param {string} bearerToken - X API bearer token
 * @returns {Array} - Array of tweet objects
 */
async function searchXForCocoBasic(bearerToken) {
  // Define search queries - we'll try each one separately
  const queries = [
    '$COCO',
    '#COCO',
    'AVAXCOCO',
    '$COCO AVAX'
  ];
  
  let allResults = [];
  
  for (const query of queries) {
    try {
      // The free tier has limited search capabilities
      // We'll use the standard search API with basic parameters
      const searchUrl = new URL('https://api.twitter.com/2/tweets/search/recent');
      searchUrl.searchParams.append('query', query);
      searchUrl.searchParams.append('max_results', '10'); // Limited to 10 in free tier
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

/**
 * Alternative approach: Manually check specific users' timelines
 * This can be used if you have a list of users you want to track
 * @param {string} bearerToken - X API bearer token
 * @returns {Array} - Array of tweet objects
 */
async function checkUserTimelines(bearerToken) {
  // List of users to check (e.g., influencers, community members)
  const usersToCheck = [
    '1234567890', // Replace with actual user IDs
    '0987654321'
  ];
  
  let allResults = [];
  
  for (const userId of usersToCheck) {
    try {
      const timelineUrl = new URL(`https://api.twitter.com/2/users/${userId}/tweets`);
      timelineUrl.searchParams.append('max_results', '5');
      timelineUrl.searchParams.append('tweet.fields', 'created_at,text');
      
      const response = await fetch(timelineUrl.toString(), {
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
        // Filter tweets that mention $COCO
        const cocoTweets = data.data.filter(tweet => 
          tweet.text.toLowerCase().includes('$coco') || 
          tweet.text.toLowerCase().includes('#coco')
        );
        
        // Add user info to tweets
        const userResponse = await fetch(`https://api.twitter.com/2/users/${userId}?user.fields=id,name,username,profile_image_url`, {
          headers: {
            'Authorization': `Bearer ${bearerToken}`
          }
        });
        
        const userData = await userResponse.json();
        
        const tweetsWithUser = cocoTweets.map(tweet => ({
          ...tweet,
          user: userData.data
        }));
        
        allResults = [...allResults, ...tweetsWithUser];
      }
    } catch (error) {
      console.error(`Error checking timeline for user ${userId}:`, error);
    }
  }
  
  return allResults;
}