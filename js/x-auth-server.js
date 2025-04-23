/**
 * $COCO X (Twitter) Authentication - Server-side Implementation
 * Uses a secure server-side approach with Vercel serverless functions
 */

// Simple notification function if not defined elsewhere
function showNotification(message, type) {
    console.log(`Notification (${type}): ${message}`);
    
    // If we're in a browser environment, try to show a visual notification
    if (typeof document !== 'undefined') {
        // Check if there's an existing notification element
        let notificationElement = document.getElementById('x-auth-notification');
        
        // If not, create one
        if (!notificationElement) {
            notificationElement = document.createElement('div');
            notificationElement.id = 'x-auth-notification';
            notificationElement.style.position = 'fixed';
            notificationElement.style.bottom = '20px';
            notificationElement.style.right = '20px';
            notificationElement.style.padding = '10px 20px';
            notificationElement.style.borderRadius = '5px';
            notificationElement.style.color = 'white';
            notificationElement.style.fontWeight = 'bold';
            notificationElement.style.zIndex = '9999';
            document.body.appendChild(notificationElement);
        }
        
        // Set the message and style based on type
        notificationElement.textContent = message;
        
        // Set color based on notification type
        if (type === 'error') {
            notificationElement.style.backgroundColor = '#e74c3c';
        } else if (type === 'success') {
            notificationElement.style.backgroundColor = '#2ecc71';
        } else {
            notificationElement.style.backgroundColor = '#3498db';
        }
        
        // Show the notification
        notificationElement.style.display = 'block';
        
        // Hide after 5 seconds
        setTimeout(() => {
            notificationElement.style.display = 'none';
        }, 5000);
    }
}

// Configuration
const xAuthConfig = {
    // The base URL for API requests - automatically detects environment
    apiBaseUrl: '/api',  // Vercel API routes are always at /api
    
    // Callback page URL
    callbackUrl: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:3000/callback.html'  // Local development
        : window.location.hostname === 'avaxcoco.vercel.app'
            ? 'https://avaxcoco.vercel.app/callback.html'  // Vercel deployment
            : window.location.hostname.includes('www')
                ? 'https://www.avaxcoco.com/callback.html'  // Production with www
                : 'https://avaxcoco.com/callback.html'  // Production without www
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
            exchangeCodeForToken(code, state);
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
async function connectToX() {
    console.log('connectToX called');
    
    try {
        // Request authorization URL from server
        const response = await fetch(`${xAuthConfig.apiBaseUrl}/auth/x/login`);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(`Failed to initiate authentication: ${data.error}`);
        }
        
        // Store state for CSRF protection
        if (data.state) {
            localStorage.setItem('xAuthState', data.state);
            console.log('Stored state in localStorage:', data.state.substring(0, 5) + '...');
        } else {
            console.error('No state received from server.');
            showNotification('Authentication failed: No state received.', 'error');
            return;
        }

        // Store code verifier if provided by the server
        if (data.codeVerifier) {
            localStorage.setItem('xCodeVerifier', data.codeVerifier);
            console.log('Stored code verifier in localStorage:', data.codeVerifier.substring(0, 5) + '...');
        } else {
            console.log('No codeVerifier received from server. This is not necessarily an error.');
            // Not necessarily an error if codeVerifier is not needed or expected
        }
        
        // Redirect to X authorization page
        console.log('Redirecting to authorization URL:', data.authUrl);
        window.location.href = data.authUrl;
    } catch (error) {
        console.error('Error starting authentication:', error);
        showNotification('Failed to start authentication: ' + error.message, 'error');
    }
}

/**
 * Exchange authorization code for access token
 * @param {string} code - Authorization code from X
 * @param {string} state - State parameter from X
 */
async function exchangeCodeForToken(code, state) {
    console.log('exchangeCodeForToken called with code and state');
    
    try {
        // Exchange code for token via server
        const response = await fetch(`${xAuthConfig.apiBaseUrl}/auth/x/callback`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ code, state, codeVerifier: localStorage.getItem('xCodeVerifier') })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            console.error('Token exchange error:', data);
            throw new Error(`Token exchange failed: ${data.error}`);
        }
        
        console.log('Token data received:', {
            access_token: data.access_token ? 'Present (not shown for security)' : 'Missing',
            refresh_token: data.refresh_token ? 'Present (not shown for security)' : 'Missing',
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
    } catch (error) {
        console.error('Error exchanging code for token:', error);
        showNotification('Authentication failed: ' + error.message, 'error');
    }
}

/**
 * Fetch user data from X API via server
 * @param {string} token - Access token
 */
async function fetchXUserData(token) {
    console.log('fetchXUserData called with token');
    
    try {
        // Fetch user data via server
        const response = await fetch(`${xAuthConfig.apiBaseUrl}/auth/x/user`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            console.error('User data error:', errorData);
            throw new Error(`Failed to fetch user data: ${errorData.error}`);
        }
        
        const userData = await response.json();
        console.log('User data received:', {
            id: userData.id,
            handle: userData.handle,
            name: userData.name,
            points: userData.points,
            rank: userData.rank
        });
        
        // Save user data
        console.log('Saving user data to localStorage');
        localStorage.setItem('cocoXUser', JSON.stringify(userData));
        
        // Update UI - This should happen on the leaderboard page, not here.
        console.log('User data stored. UI update will occur on leaderboard page.');
        // updateUIAfterAuth(userData); // Removed call - function not defined on callback.html
        
        // Show success message
        console.log('Authentication complete, showing success notification');
        showNotification('Successfully connected X account!', 'success');
        
    } catch (error) {
        console.error('Error fetching or processing user data:', error);
        // Show a more generic error, as the specific error message might be misleading here
        showNotification('Failed to retrieve user details after token exchange.', 'error');
    }
}

// Removed redundant disconnectX function from this file.
// Disconnect logic should be handled by the page where the button exists (e.g., leaderboard.js, profile.js)
