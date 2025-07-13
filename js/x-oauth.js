// X (Twitter) OAuth Authentication Manager
class XOAuthManager {
    constructor() {
        this.isAuthenticated = false;
        this.currentUser = null;
        this.sessionToken = null;
        this.init();
    }

    init() {
        // Check for existing authentication
        this.checkExistingAuth();
        this.setupEventListeners();
        this.handleOAuthCallback();
    }

    setupEventListeners() {
        const connectBtn = document.getElementById('connect-x-btn');
        if (connectBtn) {
            connectBtn.addEventListener('click', () => {
                if (this.isAuthenticated) {
                    this.logout();
                } else {
                    this.initiateOAuth();
                }
            });
        }
    }

    checkExistingAuth() {
        const sessionToken = localStorage.getItem('x-session-token');
        const userProfile = localStorage.getItem('x-user-profile');
        
        if (sessionToken && userProfile) {
            try {
                this.sessionToken = sessionToken;
                this.currentUser = JSON.parse(userProfile);
                this.isAuthenticated = true;
                this.updateUI();
                
                // Verify session is still valid
                this.verifySession();
            } catch (error) {
                console.error('Error parsing stored user profile:', error);
                this.clearStoredAuth();
            }
        }
    }

    async verifySession() {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/oauth?action=profile&session_token=${this.sessionToken}`);
            
            if (!response.ok) {
                // Session expired or invalid
                this.clearStoredAuth();
                this.updateUI();
                return;
            }
            
            const data = await response.json();
            if (data.success && data.user) {
                // Update user profile with latest data
                this.currentUser = {
                    id: data.user.x_user_id,
                    username: data.user.username,
                    name: data.user.display_name,
                    profile_image_url: data.user.profile_image_url,
                    verified: data.user.verified,
                    followers_count: data.user.followers_count,
                    authenticated: true
                };
                localStorage.setItem('x-user-profile', JSON.stringify(this.currentUser));
                this.updateUI();
            }
        } catch (error) {
            console.error('Error verifying session:', error);
        }
    }

    async initiateOAuth() {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/oauth?action=x-oauth`);
            
            if (!response.ok) {
                const errorData = await response.json();
                
                // Check if OAuth is not configured
                if (response.status === 503 && errorData.fallback_available) {
                    console.warn('X OAuth not configured, enabling fallback mode');
                    this.enableFallbackMode();
                    return;
                }
                
                throw new Error('Failed to initiate OAuth');
            }
            
            const data = await response.json();
            
            if (data.auth_url) {
                // Store state for verification
                localStorage.setItem('oauth-state', data.state);
                
                // Redirect to X OAuth
                window.location.href = data.auth_url;
            } else {
                throw new Error('No auth URL received');
            }
        } catch (error) {
            console.error('Error initiating OAuth:', error);
            this.showError('Failed to connect to X. Please try again.');
        }
    }

    handleOAuthCallback() {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        const error = urlParams.get('error');
        
        if (error) {
            console.error('OAuth error:', error);
            this.showError('Authentication failed. Please try again.');
            this.clearOAuthParams();
            return;
        }
        
        if (code && state) {
            // Verify state parameter
            const storedState = localStorage.getItem('oauth-state');
            if (state !== storedState) {
                console.error('State mismatch in OAuth callback');
                this.showError('Authentication failed due to security check.');
                this.clearOAuthParams();
                return;
            }
            
            this.completeOAuth(code, state);
        }
    }

    async completeOAuth(code, state) {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/oauth?action=x-oauth`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ code, state })
            });
            
            if (!response.ok) {
                throw new Error('Failed to complete OAuth');
            }
            
            const data = await response.json();
            
            if (data.success && data.user) {
                // Store authentication data
                this.sessionToken = data.session_token;
                this.currentUser = data.user;
                this.isAuthenticated = true;
                
                localStorage.setItem('x-session-token', this.sessionToken);
                localStorage.setItem('x-user-profile', JSON.stringify(this.currentUser));
                
                // Store user profile in database
                await this.storeUserProfile(data.user, this.sessionToken);
                
                this.updateUI();
                this.showSuccess(`Successfully connected as @${this.currentUser.username}!`);
                
                // Refresh leaderboard to show updated profile
                if (window.leaderboardManager) {
                    await window.leaderboardManager.loadLeaderboard();
                    await window.leaderboardManager.updatePersonalBest();
                }
                
                // Clear OAuth parameters from URL
                this.clearOAuthParams();
            } else {
                throw new Error('Invalid response from OAuth completion');
            }
        } catch (error) {
            console.error('Error completing OAuth:', error);
            this.showError('Failed to complete authentication. Please try again.');
            this.clearOAuthParams();
        }
    }

    async storeUserProfile(user, sessionToken) {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/oauth?action=profile`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ user, session_token: sessionToken })
            });
            
            if (!response.ok) {
                console.warn('Failed to store user profile in database');
            }
        } catch (error) {
            console.error('Error storing user profile:', error);
        }
    }

    logout() {
        this.clearStoredAuth();
        this.updateUI();
        this.showSuccess('Successfully disconnected from X.');
        
        // Refresh leaderboard
        if (window.leaderboardManager) {
            window.leaderboardManager.loadLeaderboard();
            window.leaderboardManager.updatePersonalBest();
        }
    }

    clearStoredAuth() {
        this.isAuthenticated = false;
        this.currentUser = null;
        this.sessionToken = null;
        localStorage.removeItem('x-session-token');
        localStorage.removeItem('x-user-profile');
        localStorage.removeItem('oauth-state');
    }

    clearOAuthParams() {
        // Remove OAuth parameters from URL without refreshing page
        const url = new URL(window.location);
        url.searchParams.delete('code');
        url.searchParams.delete('state');
        url.searchParams.delete('error');
        window.history.replaceState({}, document.title, url.toString());
    }

    updateUI() {
        const statusElement = document.getElementById('x-status');
        const connectBtn = document.getElementById('connect-x-btn');
        const usernameInput = document.getElementById('x-username');

        if (this.isAuthenticated && this.currentUser) {
            statusElement.className = 'x-status connected';
            statusElement.innerHTML = `
                <i class="fas fa-check-circle"></i> 
                Authenticated as @${this.currentUser.username}
                ${this.currentUser.verified ? '<i class="fas fa-check-circle" style="color: #1da1f2; margin-left: 0.25rem;"></i>' : ''}
            `;
            connectBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i> Disconnect';
            
            if (usernameInput) {
                usernameInput.value = this.currentUser.username;
                usernameInput.disabled = true;
            }
        } else {
            statusElement.className = 'x-status disconnected';
            statusElement.innerHTML = '<i class="fas fa-times-circle"></i> Not connected to X';
            connectBtn.innerHTML = '<i class="fab fa-x-twitter"></i> Login with X';
            
            if (usernameInput) {
                usernameInput.value = '';
                usernameInput.disabled = false;
            }
        }

        this.updateShareButtons();
    }

    updateShareButtons() {
        const cocoRunBtn = document.getElementById('share-coco-run');
        const flappyCocoBtn = document.getElementById('share-flappy-coco');
        
        if (this.isAuthenticated) {
            const cocoRunScore = parseInt(document.getElementById('personal-coco-run')?.textContent.replace(/,/g, '') || '0');
            const flappyCocoScore = parseInt(document.getElementById('personal-flappy-coco')?.textContent.replace(/,/g, '') || '0');
            
            if (cocoRunBtn) cocoRunBtn.style.display = cocoRunScore > 0 ? 'inline-block' : 'none';
            if (flappyCocoBtn) flappyCocoBtn.style.display = flappyCocoScore > 0 ? 'inline-block' : 'none';
        } else {
            if (cocoRunBtn) cocoRunBtn.style.display = 'none';
            if (flappyCocoBtn) flappyCocoBtn.style.display = 'none';
        }
    }

    shareScore(game, score) {
        if (!this.isAuthenticated) {
            this.showError('Please authenticate with X first to share scores.');
            return;
        }

        const gameTitle = game === 'coco-run' ? 'COCO Run' : 'Flappy COCO';
        const emoji = game === 'coco-run' ? '🏃‍♂️' : '🐦';
        
        const postText = `Just scored ${score.toLocaleString()} points in ${gameTitle} ${emoji} on the $COCO Arcade! 🎮\n\nCan you beat my score? Play now at avaxcoco.com/arcade.html\n\n#COCO #AvaxGaming #Memecoin #GameFi`;
        
        const postUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(postText)}`;
        window.open(postUrl, '_blank', 'width=550,height=420');
    }

    getUserProfile() {
        return this.currentUser;
    }

    isUserAuthenticated() {
        return this.isAuthenticated;
    }

    getSessionToken() {
        return this.sessionToken;
    }

    showError(message) {
        if (window.CocoApp && window.CocoApp.showNotification) {
            window.CocoApp.showNotification(message, 'error');
        } else {
            alert(message);
        }
    }

    showSuccess(message) {
        if (window.CocoApp && window.CocoApp.showNotification) {
            window.CocoApp.showNotification(message, 'success');
        } else {
            console.log('Success:', message);
        }
    }

    enableFallbackMode() {
        // Enable fallback to username input when OAuth isn't configured
        const statusElement = document.getElementById('x-status');
        const connectBtn = document.getElementById('connect-x-btn');
        const usernameInput = document.getElementById('x-username');
        
        if (statusElement) {
            statusElement.className = 'x-status fallback';
            statusElement.innerHTML = '<i class="fas fa-info-circle"></i> X OAuth not configured - using username input';
        }
        
        if (connectBtn) {
            connectBtn.style.display = 'none';
        }
        
        if (usernameInput) {
            usernameInput.disabled = false;
            usernameInput.placeholder = 'Enter X username (fallback mode)';
        }
        
        // Show informational message
        this.showError('X OAuth is not configured. Using fallback username input. See setup guide for OAuth configuration.');
    }
}

// Global functions for backward compatibility
function connectX() {
    if (window.xOAuthManager) {
        if (window.xOAuthManager.isAuthenticated) {
            window.xOAuthManager.logout();
        } else {
            window.xOAuthManager.initiateOAuth();
        }
    }
}

function sharePersonalBest(game) {
    const scoreElement = document.getElementById(`personal-${game}`);
    const score = parseInt(scoreElement?.textContent.replace(/,/g, '') || '0');
    
    if (score > 0 && window.xOAuthManager) {
        window.xOAuthManager.shareScore(game, score);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.xOAuthManager = new XOAuthManager();
    
    // Make it globally accessible for backward compatibility
    window.xManager = window.xOAuthManager;
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = XOAuthManager;
}
