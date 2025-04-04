# $COCO X Authentication Server

This is a minimal server-side implementation for X (Twitter) authentication that resolves the security issues with the client-side approach.

## Why Server-Side Authentication?

The client-side implementation had several issues:
1. **Security Risk**: Client secret was exposed in client-side code
2. **CORS Issues**: When testing locally, CORS restrictions prevented API calls
3. **Authentication Failures**: The redirect flow was breaking down after X authorization

This server-side implementation fixes these issues by:
1. Keeping the client secret secure on the server
2. Handling all API calls to X from the server
3. Providing a more robust authentication flow

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

The `.env` file contains all necessary configuration. Make sure the redirect URIs match what's registered in your X Developer Portal.

### 3. Start the Server

```bash
node server.js
```

The server will start on port 3000 by default (or the port specified in your `.env` file).

## How It Works

### Authentication Flow

1. **Client initiates auth**: User clicks "Connect X" button
2. **Server generates auth URL**: Creates state and PKCE values
3. **User authenticates with X**: Redirects to X for authorization
4. **X redirects back**: Returns to callback URL with code
5. **Server exchanges code for token**: Securely exchanges code for access token
6. **Server fetches user data**: Gets user profile from X API
7. **Client receives user data**: Displays user profile and engagement metrics

### Key Files

- `server.js`: The Express server that handles authentication
- `js/x-auth-server.js`: Client-side code that communicates with the server
- `callback-server.html`: Callback page for handling X redirects
- `x-auth-server-test.html`: Test page for the server-side authentication

## Testing the Implementation

1. Start the server: `node server.js`
2. Open `x-auth-server-test.html` in your browser
3. Click "Check Server Status" to verify the server is running
4. Click "Start X Authentication" to begin the auth flow
5. After redirecting back from X, you should see your user data

## Integration with Existing Website

To integrate this with your existing website:

1. Replace references to `x-auth.js` with `x-auth-server.js`
2. Update your callback page to use the server-side implementation
3. Make sure your server is running when testing authentication

Example:
```html
<!-- Before -->
<script src="js/x-auth.js"></script>

<!-- After -->
<script src="js/x-auth-server.js"></script>
```

## Deployment

For production deployment:

1. Deploy the Express server to a hosting service (Vercel, Heroku, etc.)
2. Update the `.env` file with production URLs
3. Make sure your X Developer Portal has the correct callback URLs registered

## Troubleshooting

### Common Issues

1. **"Server connection failed"**: Make sure the server is running
2. **"Authentication failed: Security error"**: State mismatch - try clearing localStorage
3. **"Failed to exchange code for token"**: Check that your client ID and secret are correct
4. **"No user data"**: Token exchange worked but user data fetch failed

### Debugging

The test page and callback page both include detailed debug information to help diagnose issues.

## Security Considerations

This implementation:
- Keeps the client secret secure on the server
- Uses PKCE for additional security
- Validates state to prevent CSRF attacks
- Stores tokens securely in localStorage

## Next Steps

Once authentication is working:
1. Implement proper session management
2. Add database storage for user data
3. Implement the leaderboard functionality
4. Add token refresh handling