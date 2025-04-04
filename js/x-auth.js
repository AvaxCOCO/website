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
    console.log('initXAuth called');
    
    // Check if we have a stored token
    const token = localStorage.getItem('xAccessToken');
    console.log('Stored token:', token ? 'Present (not shown for security)' : 'Missing');
    
    if (token) {
        console.log('Token found, fetching user data');
        // Validate token and get user data
        fetchXUserData(token);
    } else {
        console.log('No token found');
    }
    
    // Check if we're on the callback page
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    
    console.log('URL parameters:', {
        code: code ? 'Present (not shown for security)' : 'Missing',
        state: state ? 'Present (not shown for security)' : 'Missing'
    });
    
    if (code && state) {
        console.log('Code and state found in URL parameters');
        
        // Verify state to prevent CSRF attacks
        const storedState = localStorage.getItem('xAuthState');
        console.log('Stored state:', storedState ? 'Present (not shown for security)' : 'Missing');
        
        if (state === storedState) {
            console.log('State verification successful, exchanging code for token');
            // Exchange code for access token
            exchangeCodeForToken(code);
        } else {
            console.error('State mismatch - possible CSRF attack');
            console.log('URL state:', state ? state.substring(0, 5) + '...' : 'null');
            console.log('Stored state:', storedState ? storedState.substring(0, 5) + '...' : 'null');
            showNotification('Authentication failed: Security error', 'error');
        }
    } else {
        console.log('No code or state found in URL parameters');
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
    console.log('exchangeCodeForToken called with code');
    
    try {
        // SECURITY WARNING: This approach exposes your client secret in client-side code
        // For production, it's recommended to use a server-side endpoint to handle token exchange
        // This simplified approach is used to avoid needing a separate server
        
        const tokenUrl = 'https://api.twitter.com/2/oauth2/token';
        console.log('Token URL:', tokenUrl);
        
        const params = new URLSearchParams();
        params.append('grant_type', 'authorization_code');
        params.append('code', code);
        params.append('redirect_uri', xConfig.redirectUri);
        params.append('code_verifier', 'challenge'); // For PKCE
        
        console.log('Request parameters:', {
            grant_type: 'authorization_code',
            code: code ? 'Present (not shown for security)' : 'Missing',
            redirect_uri: xConfig.redirectUri,
            code_verifier: 'challenge'
        });
        
        // Create Basic Auth header with client ID and secret
        // SECURITY WARNING: This exposes your client secret
        const clientSecret = 'NGN5jNMv2dUhEBzpKBtNWqHrTpRqNkH5Lo8TRcs21Ot0zKh5gg';
        const auth = btoa(`${xConfig.clientId}:${clientSecret}`);
        
        console.log('Making token exchange request');
        const response = await fetch(tokenUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${auth}`
            },
            body: params
        });
        
        console.log('Token exchange response status:', response.status);
        
        if (!response.ok) {
            const errorData = await response.json();
            console.error('Token exchange error:', errorData);
            throw new Error(`Token exchange failed: ${response.status} ${JSON.stringify(errorData)}`);
        }
        
        console.log('Token exchange successful, parsing response');
        const data = await response.json();
        console.log('Token data received:', {
            access_token: data.access_token ? 'Present (not shown for security)' : 'Missing',
            refresh_token: data.refresh_token ? 'Present (not shown for security)' : 'Missing',
            token_type: data.token_type,
            expires_in: data.expires_in
        });
        
        // Store tokens securely
        localStorage.setItem('xAccessToken', data.access_token);
        if (data.refresh_token) {
            localStorage.setItem('xRefreshToken', data.refresh_token);
        }
        
        console.log('Tokens stored in localStorage');
        
        // Fetch user data with the new token
        console.log('Fetching user data with new token');
        fetchXUserData(data.access_token);
        
    } catch (error) {
        console.error('Error exchanging code for token:', error);
        showNotification('Authentication failed: ' + error.message, 'error');
    }
}

/**
 * Fetch user data from X API
 * @param {string} token - Access token
 */
async function fetchXUserData(token) {
    console.log('fetchXUserData called with token');
    
    try {
        // Fetch user profile data directly from X API
        console.log('Fetching user profile data from X API');
        const response = await fetch('https://api.twitter.com/2/users/me?user.fields=profile_image_url,username,name', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log('User data response status:', response.status);
        
        if (!response.ok) {
            const errorData = await response.json();
            console.error('User data error:', errorData);
            throw new Error(`Failed to fetch user data: ${response.status} ${JSON.stringify(errorData)}`);
        }
        
        console.log('User data response successful, parsing data');
        const userData = await response.json();
        console.log('User data received:', {
            id: userData.data?.id,
            username: userData.data?.username,
            name: userData.data?.name,
            profile_image_url: userData.data?.profile_image_url ? 'Present (not shown for privacy)' : 'Missing'
        });
        
        // Fetch user's $COCO engagement metrics
        // In a real implementation, this would be a call to your backend
        // For now, we'll simulate this with mock data
        console.log('Fetching $COCO engagement metrics');
        const cocoEngagement = await fetchCocoEngagement(userData.data.id, token);
        console.log('Engagement data received:', {
            points: cocoEngagement.points,
            rank: cocoEngagement.rank,
            activities: cocoEngagement.activities ? cocoEngagement.activities.length + ' activities' : 'No activities'
        });
        
        // Combine user profile with engagement data
        console.log('Combining user profile with engagement data');
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
        console.log('Saving user data to localStorage');
        localStorage.setItem('cocoXUser', JSON.stringify(combinedUserData));
        
        // Update UI
        console.log('Updating UI with user data');
        updateUIAfterAuth(combinedUserData);
        
        // Show success message
        console.log('Authentication complete, showing success notification');
        showNotification('Successfully connected X account!', 'success');
        
    } catch (error) {
        console.error('Error fetching user data:', error);
        showNotification('Failed to get user data: ' + error.message, 'error');
    }
}

/**
 * Fetch user's $COCO engagement metrics
 * @param {string} userId - X user ID
 * @param {string} token - Access token
 * @returns {Promise<Object>} - Engagement data
 */
async function fetchCocoEngagement(userId, token) {
    console.log('fetchCocoEngagement called for user ID:', userId);
    
    // In a real implementation, this would be a call to your backend
    // which would analyze the user's tweets for $COCO mentions
    
    // For now, we'll simulate this with a mock response
    console.log('Simulating engagement data with mock response');
    return new Promise(resolve => {
        setTimeout(() => {
            const mockData = {
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
            };
            console.log('Generated mock engagement data:', {
                points: mockData.points,
                rank: mockData.rank,
                activities: mockData.activities.length + ' activities'
            });
            resolve(mockData);
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