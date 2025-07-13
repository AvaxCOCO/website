# X (Twitter) API Integration Setup

## Overview
The $COCO Leaderboard now includes full X API integration to fetch real user profiles, avatars, and verification status.

## Setup Instructions

### 1. Get X API Access
1. Go to https://developer.twitter.com/en/portal/dashboard
2. Create a new project/app if you don't have one
3. Navigate to your app's "Keys and tokens" section
4. Copy your **Bearer Token**

### 2. Configure Backend

#### For Local Development:
1. Open `backend/.env` file
2. Replace the placeholder with your actual Bearer Token:
   ```
   X_BEARER_TOKEN=your_actual_bearer_token_here
   ```

#### For Production (Vercel):
1. Go to your Vercel dashboard
2. Navigate to your project settings
3. Go to "Environment Variables" section
4. Add a new environment variable:
   - **Name**: `X_BEARER_TOKEN`
   - **Value**: Your actual Bearer Token
   - **Environment**: Production (and Preview if needed)
5. Redeploy your project for changes to take effect

### 3. Restart/Redeploy
- **Local**: Restart your backend server: `npm start`
- **Vercel**: Redeploy your project (automatic on git push)

## Features Enabled with X API

### User Profile Data
- Real usernames and display names
- Profile picture URLs
- Verification status (blue checkmarks)
- Follower counts

### Leaderboard Enhancements
- User avatars displayed next to scores
- Verification badges for verified users
- Rich user profiles instead of generic names

### API Endpoints
- `GET /api/x/user/:username` - Fetch X user profile data

## Fallback Behavior
If no X API token is configured:
- System works normally with basic functionality
- No profile pictures or verification status
- Users can still connect X accounts for sharing
- Leaderboard displays usernames without avatars

## Security Notes
- Never commit your Bearer Token to git
- The `.env` file is already in `.gitignore`
- Token is only used server-side for API calls
- No user authentication required - read-only access

## Testing
1. Start backend server with token configured
2. Go to leaderboard page
3. Connect an X account
4. Verify profile data is fetched correctly
5. Check browser console for any API errors

## Rate Limits
X API v2 has rate limits:
- 300 requests per 15-minute window for user lookup
- Backend includes rate limiting protection
- Errors are handled gracefully with fallbacks
