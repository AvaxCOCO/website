# Setting Up X (Twitter) API Integration for $COCO Leaderboard

This guide explains how to set up the X (formerly Twitter) API integration for the $COCO leaderboard to enable real user authentication and engagement tracking.

## Prerequisites

1. An X Developer Account
2. A registered X application with OAuth 2.0 credentials

## Step 1: Create an X Developer Account

1. Go to [X Developer Portal](https://developer.twitter.com/en/portal/dashboard)
2. Sign in with your X account
3. Apply for a developer account if you don't already have one
4. Follow the application process to get approved

## Step 2: Create a New Project and App

1. Once approved, go to the Developer Portal
2. Create a new Project
3. Create a new App within that Project
4. Select the appropriate App environment (Production or Development)

## Step 3: Configure OAuth 2.0 Settings

1. In your App settings, navigate to the "Authentication settings" section
2. Enable OAuth 2.0
3. Set the Type of App to "Web App"
4. Add the following Callback URL:
   ```
   https://your-website-domain.com/callback.html
   ```
   (Replace with your actual domain where the $COCO website is hosted)
5. Set the Website URL to your main website URL
6. Save your changes

## Step 4: Get Your API Keys

1. In your App settings, find the "Keys and tokens" section
2. Note down the following:
   - Client ID (OAuth 2.0)
   - Client Secret (OAuth 2.0)

## Step 5: Update the X Authentication Code

1. Open the `js/x-auth.js` file
2. Replace the placeholder values with your actual API credentials:

```javascript
// X API Configuration
const xConfig = {
    clientId: 'YOUR_X_CLIENT_ID', // Replace with your actual X API client ID
    redirectUri: window.location.origin + '/callback.html', // Callback URL registered with X
    scope: 'tweet.read users.read offline.access', // Required permissions
    state: generateRandomState(), // Security measure to prevent CSRF attacks
};
```

3. In the `exchangeCodeForToken` function, replace the client secret placeholder:

```javascript
'Authorization': 'Basic ' + btoa(xConfig.clientId + ':' + 'YOUR_CLIENT_SECRET')
```

## Step 6: Set Up Backend for Token Exchange (Important!)

For security reasons, the OAuth token exchange should happen on a server, not in client-side JavaScript. You'll need to:

1. Create a server endpoint to handle the token exchange
2. Update the `exchangeCodeForToken` function to call your server endpoint instead of directly calling the X API
3. Implement the token exchange logic on your server

Example server endpoint (Node.js with Express):

```javascript
app.post('/api/exchange-x-token', async (req, res) => {
  try {
    const { code } = req.body;
    
    const params = new URLSearchParams();
    params.append('grant_type', 'authorization_code');
    params.append('code', code);
    params.append('redirect_uri', 'https://your-website-domain.com/callback.html');
    params.append('code_verifier', 'challenge'); // For PKCE
    
    const response = await fetch('https://api.twitter.com/2/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(process.env.X_CLIENT_ID + ':' + process.env.X_CLIENT_SECRET).toString('base64')
      },
      body: params
    });
    
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error exchanging token:', error);
    res.status(500).json({ error: 'Failed to exchange token' });
  }
});
```

## Step 7: Implement $COCO Engagement Tracking

To track user engagement with $COCO on X, you'll need to:

1. Create a server endpoint to fetch and analyze a user's tweets
2. Look for mentions of $COCO, hashtags, retweets, etc.
3. Calculate points based on engagement
4. Store this data in your database

Example server endpoint for engagement tracking:

```javascript
app.get('/api/coco-engagement/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { token } = req.headers;
    
    // Fetch user's tweets
    const response = await fetch(`https://api.twitter.com/2/users/${userId}/tweets?max_results=100&tweet.fields=created_at,public_metrics`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    
    // Analyze tweets for $COCO mentions
    let points = 0;
    const activities = [];
    
    for (const tweet of data.data) {
      if (tweet.text.includes('$COCO')) {
        // Add points for mentioning $COCO
        points += 10;
        activities.push({
          type: 'tweet',
          content: tweet.text,
          timestamp: tweet.created_at,
          points: 10
        });
      }
      
      if (tweet.text.includes('#COCO')) {
        // Add points for using #COCO hashtag
        points += 5;
      }
      
      // Check for retweets and likes would require additional API calls
    }
    
    // Calculate rank (this would typically come from your database)
    const rank = calculateRank(points);
    
    res.json({
      points,
      rank,
      activities
    });
  } catch (error) {
    console.error('Error fetching engagement:', error);
    res.status(500).json({ error: 'Failed to fetch engagement data' });
  }
});
```

## Step 8: Testing

1. Test the authentication flow by clicking the "Connect X" button
2. Verify that users are redirected to X for authorization
3. Confirm that after authorization, users are redirected back to your callback page
4. Check that user data is properly displayed on the leaderboard

## Security Considerations

1. Never expose your Client Secret in client-side code
2. Always use HTTPS for your website
3. Implement proper CSRF protection using the state parameter
4. Store tokens securely and refresh them when needed
5. Consider implementing rate limiting for your API endpoints

## Troubleshooting

- If authentication fails, check your callback URL configuration
- Verify that your app has the correct permissions
- Check browser console for any JavaScript errors
- Ensure your server endpoints are properly handling the requests
- Verify that your X Developer account is in good standing

For more information, refer to the [X OAuth 2.0 documentation](https://developer.twitter.com/en/docs/authentication/oauth-2-0).