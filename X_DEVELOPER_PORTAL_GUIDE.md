# Guide to Check and Update Redirect URIs in X Developer Portal

## Background
The error "Something went wrong. You weren't able to give access to the App" typically occurs when the redirect URI used in your authentication request doesn't match any of the callback URLs registered in the X Developer Portal.

## Steps to Check and Update Callback URLs

1. **Log in to the X Developer Portal**
   - Go to [developer.twitter.com](https://developer.twitter.com/)
   - Sign in with your X (Twitter) account

2. **Navigate to Your Project**
   - Go to the "Projects & Apps" section
   - Select the project you're using for $COCO

3. **Check the App Settings**
   - In your app settings, look for the "Authentication settings" or "Callback URLs" section
   - Check the list of registered callback URLs

4. **Add the New Callback URL**
   - If `http://localhost:3000/callback-server.html` is not in the list, add it
   - Make sure to click "Save" or "Update" after adding the URL

5. **Verify Other Settings**
   - Ensure the app has the correct permissions (read, write, etc.)
   - Check that the app type is set correctly (e.g., "Web App", "Single Page App")
   - Verify the client ID matches what's in your `.env` file

## Alternative Solution

If you can't update the X Developer Portal settings (e.g., if you don't have access or need to wait for approval), you can temporarily revert to using the original callback URL:

1. Update the `.env` file to use the original callback URL:
   ```
   REDIRECT_URI_LOCAL=http://localhost:3000/callback.html
   ```

2. Copy the showNotification function from `callback-server.html` to `callback.html`:
   ```javascript
   // Simple notification function if not defined elsewhere
   function showNotification(message, type) {
       console.log(`Notification (${type}): ${message}`);
       
       // Create a notification element
       let notificationElement = document.createElement('div');
       notificationElement.style.position = 'fixed';
       notificationElement.style.bottom = '20px';
       notificationElement.style.right = '20px';
       notificationElement.style.padding = '10px 20px';
       notificationElement.style.borderRadius = '5px';
       notificationElement.style.color = 'white';
       notificationElement.style.fontWeight = 'bold';
       notificationElement.style.zIndex = '9999';
       
       // Set the message
       notificationElement.textContent = message;
       
       // Set color based on notification type
       if (type === 'error') {
           notificationElement.style.backgroundColor = '#e74c3c';
       } else if (type === 'success') {
           notificationElement.style.backgroundColor = '#2ecc71';
       } else {
           notificationElement.style.backgroundColor = '#3498db';
       }
       
       // Add to the document
       document.body.appendChild(notificationElement);
       
       // Remove after 5 seconds
       setTimeout(() => {
           document.body.removeChild(notificationElement);
       }, 5000);
   }
   ```

3. Update `callback.html` to use `x-auth-server.js` instead of `x-auth.js`

## Next Steps After Fixing Redirect URI

Once you've updated the X Developer Portal or reverted to the original callback URL:

1. Restart the server: `taskkill /F /IM node.exe` and then run `.\test-x-auth-server.bat` again
2. Try the authentication flow again
3. If it works, you can proceed with implementing the leaderboard functionality

Remember that any changes to the X Developer Portal settings might take a few minutes to propagate.