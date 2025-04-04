# X API Application Setup for $COCO Leaderboard

## App Details Section

### NAME
```
$COCO-Leaderboard
```

### DESCRIPTION
```
The $COCO-Leaderboard app tracks user engagement with $COCO token on X. It allows users to connect their X accounts to earn points and AVAX allocation bonuses by mentioning $COCO, using #COCO hashtags, and engaging with official $COCO content. This app helps build community engagement and rewards active supporters during the $COCO presale phase.
```

## App Info Section

### Callback URI / Redirect URL
```
https://www.avaxcoco.com/callback.html
```

### Website URL
```
https://www.avaxcoco.com
```

### Organization Name
```
$COCO Finance
```

### Organization URL
```
https://www.avaxcoco.com
```

### Terms of Service (if needed)
```
https://www.avaxcoco.com/terms
```

### Privacy Policy (if needed)
```
https://www.avaxcoco.com/privacy
```

## User Authentication Settings

When setting up authentication:
1. Select "OAuth 2.0" as the authentication type
2. Choose "Web App" as the app type
3. Select the following scopes/permissions:
   - `tweet.read` (to read user tweets)
   - `users.read` (to get user profile information)
   - `offline.access` (to get refresh tokens)

## After Approval

Once your application is approved and you receive your Client ID and Client Secret, update the `js/x-auth.js` file with these credentials:

```javascript
// X API Configuration
const xConfig = {
    clientId: 'YOUR_X_CLIENT_ID', // Replace with your actual X API client ID
    redirectUri: 'https://www.avaxcoco.com/callback.html', // Your callback URL
    scope: 'tweet.read users.read offline.access', // Required permissions
    state: generateRandomState(), // Security measure to prevent CSRF attacks
};
```

Also update the client secret in the `exchangeCodeForToken` function:

```javascript
'Authorization': 'Basic ' + btoa(xConfig.clientId + ':' + 'YOUR_CLIENT_SECRET')
```

## Next Steps

1. Create the callback.html page (already done)
2. Update your leaderboard.js to use the X authentication (already done)
3. Consider creating basic terms and privacy pages if required by X
4. Test the authentication flow once approved