# $COCO X Verification System - Free Tier Approach

This guide explains the X verification system implemented for the $COCO leaderboard, which is designed to work within the free tier limits of the X API.

## Overview

Instead of continuously monitoring X for mentions of $COCO (which would require the paid API tier), this system uses a user-initiated verification approach:

1. Users connect their X account to the $COCO website
2. They are directed to post a specific message containing a unique verification code
3. The system verifies this post and awards points
4. The user's position on the leaderboard is established

This approach minimizes API calls while still providing real verification of X activity.

## How It Works

### Step 1: User Authentication

Users authenticate with X using OAuth 2.0, which allows the application to:
- Verify the user's identity
- Access their public tweets (with their permission)
- No access to private data or ability to post on their behalf

### Step 2: Verification Post

After authentication, users are directed to the verification page where they:
1. See a suggested post containing:
   - A mention of $COCO
   - A unique verification code
   - Relevant hashtags
2. Click a button to open X with this pre-populated text
3. Post the message on their X account

### Step 3: Verification Check

After posting, the user returns to the verification page and:
1. Clicks the "Verify My Post" button
2. The system makes a single API call to check their recent posts
3. If a post with the verification code is found, points are awarded
4. The user is added to the leaderboard

## Benefits of This Approach

1. **Stays Within Free Tier Limits**: The X API free tier allows up to 100 requests per month, which is sufficient for this verification approach.

2. **Real Verification**: Unlike simulated activities, this approach verifies real user engagement on X.

3. **User-Initiated**: Since the process is user-initiated, it only makes API calls when necessary.

4. **Scalable**: This approach can scale to thousands of users while staying within API limits, as each user only requires a few API calls.

5. **Upgradable**: If you later subscribe to the paid X API tier, the system can be easily expanded to include the webhook and continuous monitoring features.

## Technical Implementation

### Client-Side Components

1. **x-verification.html**: The page that guides users through the verification process.

2. **js/x-post-verification.js**: Handles the client-side logic for generating verification codes and checking verification status.

### Server-Side Components

1. **api/verify-x-post.js**: Serverless function that verifies the user's X post by:
   - Fetching the user's recent tweets
   - Checking for the verification code
   - Awarding points and updating the leaderboard

2. **api/db/index.js**: Database utility functions for storing user data, activities, and points.

## API Usage Considerations

The free tier of the X API has these limitations:

- 100 requests per month
- Limited search capabilities
- No webhook support

This implementation is designed to work within these constraints by:

1. Making only necessary API calls
2. Using direct user timeline checks instead of search
3. Implementing user-initiated verification instead of webhooks

## Point System

The current point system awards:

- 50 points for a verified X post about $COCO

You can adjust this value in the `api/verify-x-post.js` file.

## Future Enhancements

If you later upgrade to the paid X API tier, you can enhance the system with:

1. **Webhooks**: Implement real-time monitoring of $COCO mentions
2. **Advanced Search**: Use the full search capabilities to find all $COCO mentions
3. **Engagement Tracking**: Track likes, retweets, and replies to $COCO content
4. **Automated Points**: Award points automatically for various types of engagement

## Setup Instructions

1. Deploy the code to Vercel
2. Set up the Neon database using the provided schema
3. Configure environment variables in Vercel:
   - `POSTGRES_URL`: Your Neon database connection string
   - `X_CLIENT_ID`: Your X API client ID
   - `X_CLIENT_SECRET`: Your X API client secret

## Testing the System

To test the verification system:

1. Connect your X account on the leaderboard page
2. Follow the verification steps on the x-verification.html page
3. Post the suggested message on X
4. Click the "Verify My Post" button
5. Check that points are awarded and you appear on the leaderboard

This approach provides a solid foundation for your $COCO leaderboard while staying within the free tier limits of the X API.