/**
 * $COCO X (Twitter) Authentication
 * Handles real X authentication using OAuth 2.0
 */

// X API Configuration
const xConfig = {
    clientId: 'ZjBWSGMwTWwyai1UeXQwQlJhdFU6MTpjaQ', // X API client ID
    // Use the appropriate callback URL based on the environment
    redirectUri: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:3000/callback.html'  // Local development
        : window.location.hostname === 'avaxcoco.vercel.app'
            ? 'https://avaxcoco.vercel.app/callback.html'  // Vercel deployment
            : window.location.hostname.includes('www')
                ? 'https://www.avaxcoco.com/callback.html'  // Production with www
                : 'https://avaxcoco.com/callback.html',  // Production without www
    scope: 'tweet.read users.read offline.access', // Required permissions
    // We'll generate a new state for each authentication attempt
};

// PKCE Code Verifier and Challenge
let codeVerifier = '';

// Generate and store a new state and code verifier when the page loads
const xAuthState = generateRandomState();
codeVerifier = generateCodeVerifier();
console.log('Generated new state:', xAuthState.substring(0, 5) + '...');
console.log('Generated code verifier:', codeVerifier.substring(0, 5) + '...');

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
    console.log('connectToX called');
    
    // Store state and code verifier for CSRF protection and PKCE
    localStorage.setItem('xAuthState', xAuthState);
    localStorage.setItem('xCodeVerifier', codeVerifier);
    console.log('Stored state in localStorage:', xAuthState.substring(0, 5) + '...');
    console.log('Stored code verifier in localStorage:', codeVerifier.substring(0, 5) + '...');
    
    // Generate code challenge from verifier (using SHA-256)
    generateCodeChallenge(codeVerifier).then(codeChallenge => {
        console.log('Generated code challenge:', codeChallenge.substring(0, 5) + '...');
        
        // Build authorization URL
        const authUrl = new URL('https://twitter.com/i/oauth2/authorize');
        authUrl.searchParams.append('response_type', 'code');
        authUrl.searchParams.append('client_id', xConfig.clientId);
        authUrl.searchParams.append('redirect_uri', xConfig.redirectUri);
        authUrl.searchParams.append('scope', xConfig.scope);
        authUrl.searchParams.append('state', xAuthState);
        authUrl.searchParams.append('code_challenge', codeChallenge);
        authUrl.searchParams.append('code_challenge_method', 'S256');
        
        console.log('Authorization URL created with redirect_uri:', xConfig.redirectUri);
        
        // Redirect to X authorization page
        window.location.href = authUrl.toString();
    });
}

/**
 * Exchange authorization code for access token
 * @param {string} code - Authorization code from X
 */
async function exchangeCodeForToken(code) {
    console.log('exchangeCodeForToken called with code');
    
    try {
        // Retrieve the stored code verifier
        const storedCodeVerifier = localStorage.getItem('xCodeVerifier');
        if (!storedCodeVerifier) {
            console.error('Code verifier not found in localStorage. This is required for PKCE.');
            console.log('localStorage keys available:', Object.keys(localStorage).join(', '));
            throw new Error('Code verifier not found in localStorage');
        }
        
        console.log('Retrieved code verifier from localStorage:', storedCodeVerifier.substring(0, 5) + '...', 'Length:', storedCodeVerifier.length);
        
        // Log the redirect URI being used
        console.log('Using redirect URI:', xConfig.redirectUri);
        console.log('Current origin:', window.location.origin);
        
        // SECURITY WARNING: This approach exposes your client secret in client-side code
        // For production, it's recommended to use a server-side endpoint to handle token exchange
        // This simplified approach is used to avoid needing a separate server
        
        const tokenUrl = 'https://api.twitter.com/2/oauth2/token';
        console.log('Token URL:', tokenUrl);
        
        const params = new URLSearchParams();
        params.append('grant_type', 'authorization_code');
        params.append('code', code);
        params.append('redirect_uri', xConfig.redirectUri);
        params.append('code_verifier', storedCodeVerifier); // Use the stored code verifier
        
        console.log('Request parameters:', {
            grant_type: 'authorization_code',
            code: code ? 'Present (not shown for security)' : 'Missing',
            redirect_uri: xConfig.redirectUri,
            code_verifier: storedCodeVerifier ? storedCodeVerifier.substring(0, 5) + '...' : 'Missing'
        });
        
        // Create Basic Auth header with client ID and secret
        // SECURITY WARNING: This exposes your client secret
        const clientSecret = 'NGN5jNMv2dUhEBzpKBtNWqHrTpRqNkH5Lo8TRcs21Ot0zKh5gg';
        const auth = btoa(`${xConfig.clientId}:${clientSecret}`);
        
        console.log('Making token exchange request with params:', {
            grant_type: 'authorization_code',
            code: code ? code.substring(0, 5) + '...' : 'Missing',
            redirect_uri: xConfig.redirectUri,
            code_verifier: storedCodeVerifier ? storedCodeVerifier.substring(0, 5) + '...' : 'Missing'
        });
        
        try {
            const response = await fetch(tokenUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': `Basic ${auth}`
                },
                body: params
            });
            
            console.log('Token exchange response status:', response.status);
            console.log('Token exchange response headers:',
                Array.from(response.headers.entries())
                    .map(([key, value]) => `${key}: ${value}`)
                    .join(', ')
            );
            
            // Try to get the response text regardless of status
            const responseText = await response.text();
            console.log('Token exchange response text:', responseText);
            
            // If not OK, throw an error
            if (!response.ok) {
                try {
                    // Try to parse as JSON if possible
                    const errorData = JSON.parse(responseText);
                    console.error('Token exchange error data:', errorData);
                    throw new Error(`Token exchange failed: ${response.status} ${JSON.stringify(errorData)}`);
                } catch (parseError) {
                    // If parsing fails, use the raw text
                    throw new Error(`Token exchange failed: ${response.status} ${responseText}`);
                }
            }
            
            // Parse the response as JSON
            const data = JSON.parse(responseText);
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
            await fetchXUserData(data.access_token);
            
            return data;
        } catch (fetchError) {
            console.error('Fetch error during token exchange:', fetchError);
            throw fetchError;
        }
        
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
    console.log('Token first 10 chars:', token.substring(0, 10) + '...');
    
    try {
        // Fetch user profile data directly from X API
        console.log('Fetching user profile data from X API');
        const userApiUrl = 'https://api.twitter.com/2/users/me?user.fields=profile_image_url,username,name';
        console.log('Fetching user data from URL:', userApiUrl);
        
        const response = await fetch(userApiUrl, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log('User data response status:', response.status);
        console.log('User data response headers:',
            Array.from(response.headers.entries())
                .map(([key, value]) => `${key}: ${value}`)
                .join(', ')
        );
        
        // Get the response text first
        const responseText = await response.text();
        console.log('User data response text:', responseText);
        
        if (!response.ok) {
            try {
                // Try to parse as JSON if possible
                const errorData = JSON.parse(responseText);
                console.error('User data error:', errorData);
                throw new Error(`Failed to fetch user data: ${response.status} ${JSON.stringify(errorData)}`);
            } catch (parseError) {
                // If parsing fails, use the raw text
                throw new Error(`Failed to fetch user data: ${response.status} ${responseText}`);
            }
        }
        
        console.log('User data response successful, parsing data');
        const userData = JSON.parse(responseText);
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
 * Generate a random code verifier for PKCE
 * @returns {string} - Random code verifier
 */
function generateCodeVerifier() {
    const array = new Uint8Array(32); // 32 bytes = 256 bits
    window.crypto.getRandomValues(array);
    return base64UrlEncode(array);
}

/**
 * Generate a code challenge from a code verifier using SHA-256
 * @param {string} codeVerifier - The code verifier
 * @returns {Promise<string>} - The code challenge
 */
async function generateCodeChallenge(codeVerifier) {
    // Convert the code verifier to a Uint8Array
    const encoder = new TextEncoder();
    const data = encoder.encode(codeVerifier);
    
    // Hash the code verifier using SHA-256
    const hash = await window.crypto.subtle.digest('SHA-256', data);
    
    // Convert the hash to a base64url encoded string
    return base64UrlEncode(new Uint8Array(hash));
}

/**
 * Base64Url encode a Uint8Array
 * @param {Uint8Array} buffer - The buffer to encode
 * @returns {string} - The base64url encoded string
 */
function base64UrlEncode(buffer) {
    // Convert the buffer to a base64 string
    const base64 = btoa(String.fromCharCode.apply(null, buffer));
    
    // Convert base64 to base64url by replacing characters
    return base64
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
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