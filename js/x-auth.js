/**
 * $COCO X (Twitter) Authentication
 * Handles real X authentication using OAuth 2.0
 */

// X API Configuration
const xConfig = {
    clientId: 'ZjBWSGMwTWwyai1UeXQwQlJhdFU6MTpjaQ', // X API client ID
    redirectUri: `${window.location.origin}/callback.html`, // Dynamically use current domain
    scope: 'tweet.read users.read offline.access', // Required permissions
    state: generateRandomState(), // Security measure to prevent CSRF attacks
};

/**
 * Initialize X authentication
 */
function initXAuth() {
    // Check if we have a stored token
    const token = localStorage.getItem('xAccessToken');
    if (token) {
        // Validate token and get user data
        fetchXUserData(token);
    }
    
    // Check if we're on the callback page
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    
    if (code && state) {
        // Verify state to prevent CSRF attacks
        const storedState = localStorage.getItem('xAuthState');
        if (state === storedState) {
            // Exchange code for access token
            exchangeCodeForToken(code);
        } else {
            console.error('State mismatch - possible CSRF attack');
            showNotification('Authentication failed: Security error', 'error');
        }
    }
}

/**
 * Start X authentication flow
 */
function connectToX() {
    // Store state for CSRF protection
    localStorage.setItem('xAuthState', xConfig.state);
    
    // Build authorization URL
    const authUrl = new URL('https://twitter.com/i/oauth2/authorize');
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('client_id', xConfig.clientId);
    authUrl.searchParams.append('redirect_uri', xConfig.redirectUri);
    authUrl.searchParams.append('scope', xConfig.scope);
    authUrl.searchParams.append('state', xConfig.state);
    authUrl.searchParams.append('code_challenge', 'challenge'); // For PKCE
    authUrl.searchParams.append('code_challenge_method', 'plain');
    
    // Redirect to X authorization page
    window.location.href = authUrl.toString();
}

/**
 * Exchange authorization code for access token
 * @param {string} code - Authorization code from X
 */
async function exchangeCodeForToken(code) {
    try {
        // SECURITY WARNING: This approach exposes your client secret in client-side code
        // For production, it's recommended to use a server-side endpoint to handle token exchange
        // This simplified approach is used to avoid needing a separate server
        
        const tokenUrl = 'https://api.twitter.com/2/oauth2/token';
        const params = new URLSearchParams();
        params.append('grant_type', 'authorization_code');
        params.append('code', code);
        params.append('redirect_uri', xConfig.redirectUri);
        params.append('code_verifier', 'challenge'); // For PKCE
        
        // Create Basic Auth header with client ID and secret
        // SECURITY WARNING: This exposes your client secret
        const clientSecret = 'NGN5jNMv2dUhEBzpKBtNWqHrTpRqNkH5Lo8TRcs21Ot0zKh5gg';
        const auth = btoa(`${xConfig.clientId}:${clientSecret}`);
        
        const response = await fetch(tokenUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${auth}`
            },
            body: params
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            console.error('Token exchange error:', errorData);
            throw new Error('Token exchange failed');
        }
        
        const data = await response.json();
        
        // Store tokens securely
        localStorage.setItem('xAccessToken', data.access_token);
        if (data.refresh_token) {
            localStorage.setItem('xRefreshToken', data.refresh_token);
        }
        
        // Fetch user data with the new token
        fetchXUserData(data.access_token);
        
    } catch (error) {
        console.error('Error exchanging code for token:', error);
        showNotification('Authentication failed', 'error');
    }
}

/**
 * Fetch user data from X API
 * @param {string} token - Access token
 */
async function fetchXUserData(token) {
    try {
        // Fetch user profile data directly from X API
        const response = await fetch('https://api.twitter.com/2/users/me?user.fields=profile_image_url,username,name', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            console.error('User data error:', errorData);
            throw new Error('Failed to fetch user data');
        }
        
        const userData = await response.json();
        
        // Fetch user's $COCO engagement metrics
        // In a real implementation, this would be a call to your backend
        // For now, we'll simulate this with mock data
        const cocoEngagement = await fetchCocoEngagement(userData.data.id, token);
        
        // Combine user profile with engagement data
        const combinedUserData = {
            id: userData.data.id,
            handle: '@' + userData.data.username,
            name: userData.data.name,
            profileImage: userData.data.profile_image_url,
            points: cocoEngagement.points,
            rank: cocoEngagement.rank,
            level: determineLevel(cocoEngagement.points),
            activities: cocoEngagement.activities
        };
        
        // Save user data
        localStorage.setItem('cocoXUser', JSON.stringify(combinedUserData));
        
        // Update UI
        updateUIAfterAuth(combinedUserData);
        
        // Show success message
        showNotification('Successfully connected X account!', 'success');
        
    } catch (error) {
        console.error('Error fetching user data:', error);
        showNotification('Failed to get user data', 'error');
    }
}

/**
 * Fetch user's $COCO engagement metrics
 * @param {string} userId - X user ID
 * @param {string} token - Access token
 * @returns {Promise<Object>} - Engagement data
 */
async function fetchCocoEngagement(userId, token) {
    // In a real implementation, this would be a call to your backend
    // which would analyze the user's tweets for $COCO mentions
    
    // For now, we'll simulate this with a mock response
    return new Promise(resolve => {
        setTimeout(() => {
            resolve({
                points: Math.floor(Math.random() * 10000),
                rank: Math.floor(Math.random() * 100) + 1,
                activities: [
                    {
                        type: 'tweet',
                        content: 'Just bought some $COCO! To the moon! 🚀',
                        timestamp: new Date(Date.now() - 3600000).toISOString(),
                        points: 10
                    },
                    {
                        type: 'retweet',
                        content: 'Retweeted: $COCO is the best memecoin on AVAX!',
                        timestamp: new Date(Date.now() - 7200000).toISOString(),
                        points: 15
                    },
                    {
                        type: 'like',
                        content: 'Liked: Check out the new $COCO sticker campaign!',
                        timestamp: new Date(Date.now() - 86400000).toISOString(),
                        points: 2
                    }
                ]
            });
        }, 1000);
    });
}


/**
 * Determine user level based on points
 * @param {number} points - User points
 * @returns {string} - User level
 */
function determineLevel(points) {
    if (points >= 50000) return 'Gold';
    if (points >= 25000) return 'Silver';
    if (points >= 10000) return 'Bronze';
    return 'Beginner';
}

/**
 * Generate random state for CSRF protection
 * @returns {string} - Random state
 */
function generateRandomState() {
    const array = new Uint8Array(16);
    window.crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Disconnect X account
 */
function disconnectX() {
    // Clear stored tokens and user data
    localStorage.removeItem('xAccessToken');
    localStorage.removeItem('xRefreshToken');
    localStorage.removeItem('cocoXUser');
    localStorage.removeItem('xAuthState');
    
    // Reset UI
    const twitterConnectContainer = document.getElementById('twitter-connect-container');
    const userProfilePreview = document.getElementById('user-profile-preview');
    const userProfileSection = document.getElementById('user-profile');
    
    if (twitterConnectContainer) twitterConnectContainer.classList.remove('hidden');
    if (userProfilePreview) userProfilePreview.classList.add('hidden');
    if (userProfileSection) userProfileSection.classList.add('hidden');
    
    // Show notification
    showNotification('X account disconnected', 'info');
}