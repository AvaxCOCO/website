/**
 * $COCO Leaderboard JavaScript
 * Handles X (formerly Twitter) authentication, leaderboard data, and user interactions
 */

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Content Loaded');
    
    try {
        // Initialize the leaderboard
        initLeaderboard();
        
        // Set up event listeners
        setupEventListeners();
        
        // Add animations
        setupAnimations();
    } catch (error) {
        console.error('Error initializing leaderboard:', error);
    }
});

/**
 * Initialize the leaderboard with mock data
 */
function initLeaderboard() {
    // Show preloader
    const preloader = document.getElementById('preloader');
    
    // Simulate loading time
    setTimeout(() => {
        if (preloader) {
            preloader.style.opacity = '0';
            setTimeout(() => {
                preloader.style.display = 'none';
            }, 500);
        }
        
        // Check if user is already authenticated
        try {
            checkAuthStatus();
        } catch (error) {
            console.error('Error checking auth status:', error);
        }
        
        // Initialize particles background
        try {
            const particlesContainer = document.getElementById('particles-js');
            if (particlesContainer && typeof particlesJS !== 'undefined') {
                // Instead of loading the config file (which can cause CORS issues),
                // we'll use the inline configuration
                particlesJS('particles-js', {
                    "particles": {
                        "number": { "value": 80, "density": { "enable": true, "value_area": 800 } },
                        "color": { "value": "#FF1493" },
                        "shape": { "type": "circle" },
                        "opacity": { "value": 0.5, "random": false },
                        "size": { "value": 3, "random": true },
                        "line_linked": { "enable": true, "distance": 150, "color": "#8A2BE2", "opacity": 0.4, "width": 1 },
                        "move": { "enable": true, "speed": 2, "direction": "none", "random": false, "straight": false, "out_mode": "out", "bounce": false }
                    },
                    "interactivity": {
                        "detect_on": "canvas",
                        "events": {
                            "onhover": { "enable": true, "mode": "grab" },
                            "onclick": { "enable": true, "mode": "push" },
                            "resize": true
                        }
                    },
                    "retina_detect": true
                });
            }
        } catch (error) {
            console.error('Error initializing particles:', error);
        }
    }, 1500);
}

/**
 * Set up event listeners for user interactions
 */
function setupEventListeners() {
    try {
        // Log section existence for debugging
        console.log('Hero section exists:', document.getElementById('hero') !== null);
        console.log('DeFi section exists:', document.getElementById('defi') !== null);
        console.log('How to Buy section exists:', document.getElementById('how-to-buy') !== null);
        console.log('Community section exists:', document.getElementById('community') !== null);
        console.log('Presale section exists:', document.getElementById('presale') !== null);
        console.log('Preloader exists:', document.getElementById('preloader') !== null);
        console.log('Particles container exists:', document.getElementById('particles-js') !== null);
        
        // Force visibility for sections
        const sections = [
            'leaderboard-hero',
            'top-users',
            'leaderboard-table',
            'how-it-works',
            'user-profile'
        ];
        
        sections.forEach(sectionId => {
            const section = document.getElementById(sectionId);
            if (section) {
                console.log('Forced visibility for section:', sectionId);
                section.style.display = 'block';
                section.style.visibility = 'visible';
                section.style.opacity = '1';
            }
        });
        
        // X connect button
        const connectTwitterBtn = document.getElementById('connect-twitter-btn');
        if (connectTwitterBtn) {
            connectTwitterBtn.addEventListener('click', handleTwitterConnect);
        }
        
        // X disconnect button (added inside user-profile-preview)
        const disconnectXBtn = document.getElementById('disconnect-x-btn');
        if (disconnectXBtn) {
            disconnectXBtn.addEventListener('click', handleXDisconnect);
        } else {
            // This might log initially if the button is inside a hidden container,
            // but the listener should still work once the container is shown and the button exists.
            console.warn('Disconnect X button (#disconnect-x-btn) not found during initial setup.');
        }
        
        // Search functionality
        const searchBtn = document.getElementById('search-btn');
        const searchInput = document.getElementById('search-input');
        
        if (searchBtn && searchInput) {
            searchBtn.addEventListener('click', () => {
                searchLeaderboard(searchInput.value);
            });
            
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    searchLeaderboard(searchInput.value);
                }
            });
        }
        
        // Time filter
        const timeFilter = document.getElementById('time-filter');
        if (timeFilter) {
            timeFilter.addEventListener('change', () => {
                filterLeaderboard(timeFilter.value);
            });
        }
        
        // Mobile menu toggle
        const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
        const mobileMenu = document.querySelector('.mobile-menu');
        const closeMenu = document.querySelector('.close-menu');
        
        if (mobileMenuToggle && mobileMenu && closeMenu) {
            mobileMenuToggle.addEventListener('click', () => {
                mobileMenu.classList.add('active');
            });
            
            closeMenu.addEventListener('click', () => {
                mobileMenu.classList.remove('active');
            });
        }
        
        // Header scroll effect
        window.addEventListener('scroll', () => {
            const header = document.querySelector('header');
            if (header) {
                if (window.scrollY > 50) {
                    header.classList.add('scrolled');
                } else {
                    header.classList.remove('scrolled');
                }
            }
        });
        
        // Remove preloader after a delay
        const preloader = document.getElementById('preloader');
        if (preloader) {
            setTimeout(() => {
                preloader.style.opacity = '0';
                setTimeout(() => {
                    preloader.style.display = 'none';
                    console.log('Removed preloader');
                }, 500);
            }, 1000);
        }
    } catch (error) {
        console.error('Error setting up event listeners:', error);
    }
}

/**
 * Handle X connect button click
 * Redirects to X OAuth flow
 */
function handleTwitterConnect() {
    try {
        // Show loading state on button
        const connectBtn = document.getElementById('connect-twitter-btn');
        if (!connectBtn) {
            console.error('Connect X button not found');
            return;
        }
        
        const originalText = connectBtn.innerHTML;
        connectBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Connecting...';
        connectBtn.disabled = true;
        
        // Start X authentication flow
        // This function is defined in x-auth-server.js
        connectToX();
        
    } catch (error) {
        console.error('Error in handleTwitterConnect:', error);
        showNotification('Error connecting X account', 'error');
        
        // Reset button
        const connectBtn = document.getElementById('connect-twitter-btn');
        if (connectBtn) {
            connectBtn.innerHTML = originalText;
            connectBtn.disabled = false;
        }
    }
}

/**
 * Handle X disconnect button click
 */
function handleXDisconnect() {
    try {
        console.log('Disconnecting X account');

        // Clear authentication data from localStorage
        localStorage.removeItem('xAccessToken');
        localStorage.removeItem('xRefreshToken');
        localStorage.removeItem('cocoXUser');

        // Update UI elements
        const twitterConnectContainer = document.getElementById('twitter-connect-container');
        const userProfilePreview = document.getElementById('user-profile-preview');
        const userProfileSection = document.getElementById('user-profile'); // Assuming this is the main profile section

        if (twitterConnectContainer) {
            twitterConnectContainer.classList.remove('hidden');
        }
        if (userProfilePreview) {
            userProfilePreview.classList.add('hidden');
        }
        if (userProfileSection) {
            userProfileSection.classList.add('hidden');
        }

        // Reset connect button state if needed (optional, depends on initial state)
        const connectBtn = document.getElementById('connect-twitter-btn');
         if (connectBtn) {
             // Restore original button content (ensure this matches the HTML)
             const originalText = '<img src="images/Ecosystem/xiconwhite.png" alt="X" class="x-icon-small" style="width: 20px; margin-right: 8px;"> Connect X';
             connectBtn.innerHTML = originalText;
             connectBtn.disabled = false;
        }


        showNotification('X account disconnected successfully.', 'success');
        console.log('X account disconnected and UI updated.');

    } catch (error) {
        console.error('Error disconnecting X account:', error);
        showNotification('Error disconnecting X account.', 'error');
    }
}

/**
 * Check if user is already authenticated with X
 */
function checkAuthStatus() {
    try {
        console.log('Checking authentication status');
        
        // Check for user data in localStorage first
        const userData = localStorage.getItem('cocoXUser');
        if (userData) {
            try {
                console.log('Found user data in localStorage');
                const parsedUserData = JSON.parse(userData);
                updateUIAfterAuth(parsedUserData);
                return; // Exit early if we have user data
            } catch (error) {
                console.error('Error parsing user data:', error);
                localStorage.removeItem('cocoXUser');
            }
        }
        
        // If no user data, check for access token
        const accessToken = localStorage.getItem('xAccessToken');
        if (accessToken) {
            console.log('Found access token, fetching user data');
            // We have a token but no user data, try to fetch user data
            fetchXUserData(accessToken)
                .catch(error => {
                    console.error('Error fetching user data with stored token:', error);
                    // If token is invalid, clear it
                    if (error.message.includes('401') || error.message.includes('Unauthorized')) {
                        console.log('Token appears to be invalid, clearing stored tokens');
                        localStorage.removeItem('xAccessToken');
                        localStorage.removeItem('xRefreshToken');
                    }
                });
        } else {
            console.log('No authentication data found');
        }
    } catch (error) {
        console.error('Error in checkAuthStatus:', error);
    }
}

/**
 * Update UI after successful authentication
 */
function updateUIAfterAuth(userData) {
    console.log('updateUIAfterAuth called with user data:', userData);
    
    try {
        // Update connect button container
        const twitterConnectContainer = document.getElementById('twitter-connect-container');
        const userProfilePreview = document.getElementById('user-profile-preview');
        
        console.log('Elements found:', {
            twitterConnectContainer: twitterConnectContainer ? 'Found' : 'Not found',
            userProfilePreview: userProfilePreview ? 'Found' : 'Not found'
        });
        
        if (twitterConnectContainer && userProfilePreview) {
            try {
                console.log('Updating UI elements: hiding connect button, showing user preview');
                twitterConnectContainer.classList.add('hidden');
                userProfilePreview.classList.remove('hidden');
                
                // Update user preview data
                const userAvatar = document.getElementById('user-avatar');
                const userHandle = document.getElementById('user-handle');
                const userRank = document.getElementById('user-rank');
                const userPoints = document.getElementById('user-points');
                
                console.log('User preview elements found:', {
                    userAvatar: userAvatar ? 'Found' : 'Not found',
                    userHandle: userHandle ? 'Found' : 'Not found',
                    userRank: userRank ? 'Found' : 'Not found',
                    userPoints: userPoints ? 'Found' : 'Not found'
                });
                
                if (userAvatar) userAvatar.src = userData.profileImage;
                if (userHandle) userHandle.textContent = userData.handle;
                if (userRank) userRank.textContent = `Rank: #${userData.rank}`;
                
                // Calculate and display AVAX allocation bonus
                const avaxBonus = calculateAvaxBonus(userData.points);
                console.log('Calculated AVAX bonus:', avaxBonus);
                if (userPoints) userPoints.textContent = `+${avaxBonus} AVAX Bonus`;
                
                console.log('User preview updated successfully');
            } catch (error) {
                console.error('Error updating user preview:', error);
            }
        } else {
            console.error('Required UI elements not found for user preview');
        }
        
        // Show user profile section
        const userProfileSection = document.getElementById('user-profile');
        console.log('User profile section found:', userProfileSection ? 'Yes' : 'No');
        
        if (userProfileSection) {
            try {
                console.log('Showing user profile section');
                userProfileSection.classList.remove('hidden');
                
                // Update profile data
                const profileAvatar = document.getElementById('profile-avatar-img');
                const profileHandle = document.getElementById('profile-handle');
                const profileRank = document.getElementById('profile-rank');
                const profilePoints = document.getElementById('profile-points');
                const profileLevel = document.getElementById('profile-level');
                
                console.log('Profile elements found:', {
                    profileAvatar: profileAvatar ? 'Found' : 'Not found',
                    profileHandle: profileHandle ? 'Found' : 'Not found',
                    profileRank: profileRank ? 'Found' : 'Not found',
                    profilePoints: profilePoints ? 'Found' : 'Not found',
                    profileLevel: profileLevel ? 'Found' : 'Not found'
                });
                
                if (profileAvatar) profileAvatar.src = userData.profileImage;
                if (profileHandle) profileHandle.textContent = userData.handle;
                if (profileRank) profileRank.textContent = `#${userData.rank}`;
                
                // Calculate and display AVAX allocation bonus
                const avaxBonus = calculateAvaxBonus(userData.points);
                console.log('Calculated AVAX bonus for profile:', avaxBonus);
                if (profilePoints) profilePoints.textContent = `${userData.points} points (${avaxBonus} AVAX)`;
                if (profileLevel) profileLevel.textContent = userData.level;
                
                // Update progress bar
                const progressBarFill = document.getElementById('progress-bar-fill');
                if (progressBarFill) {
                    const progressPercentage = Math.min((userData.points / 50000) * 100, 100);
                    console.log('Setting progress bar to:', progressPercentage + '%');
                    progressBarFill.style.width = `${progressPercentage}%`;
                } else {
                    console.error('Progress bar fill element not found');
                }
                
                // Update allocation bonus progress
                const recentActivity = document.getElementById('recent-activity');
                console.log('Recent activity element found:', recentActivity ? 'Yes' : 'No');
                
                if (recentActivity) {
                    try {
                        if (userData.activities && userData.activities.length > 0) {
                            console.log('Updating recent activities:', userData.activities.length + ' activities found');
                            recentActivity.innerHTML = '';
                            
                            userData.activities.forEach((activity, index) => {
                                try {
                                    console.log(`Processing activity ${index + 1}:`, activity.type);
                                    const activityTime = new Date(activity.timestamp);
                                    const timeAgo = getTimeAgo(activityTime);
                                    
                                    const activityItem = document.createElement('div');
                                    activityItem.className = 'activity-item';
                                    activityItem.innerHTML = `
                                        <div class="activity-content">
                                            <p>${activity.content}</p>
                                            <div class="activity-meta">
                                                <span class="activity-time">${timeAgo}</span>
                                                <span class="activity-points">+${calculateAvaxBonus(activity.points)} AVAX</span>
                                            </div>
                                        </div>
                                    `;
                                    
                                    recentActivity.appendChild(activityItem);
                                    console.log(`Activity ${index + 1} added to DOM`);
                                } catch (error) {
                                    console.error(`Error rendering activity item ${index + 1}:`, error);
                                }
                            });
                            console.log('All activities rendered successfully');
                        } else {
                            console.log('No activities found in user data');
                        }
                    } catch (error) {
                        console.error('Error updating recent activity:', error);
                    }
                }
                
                console.log('User profile section updated successfully');
            } catch (error) {
                console.error('Error updating user profile section:', error);
            }
        } else {
            console.error('User profile section element not found');
        }
    } catch (error) {
        console.error('Error in updateUIAfterAuth:', error);
    }
}

/**
 * Search the leaderboard for a specific X handle
 */
function searchLeaderboard(query) {
    if (!query) {
        showNotification('Please enter an X handle to search', 'warning');
        return;
    }
    
    // In a real implementation, this would make an API call
    // For now, we'll just show a notification
    showNotification(`Searching for "${query}"...`, 'info');
    
    // Simulate search delay
    setTimeout(() => {
        showNotification(`No results found for "${query}". Try another handle.`, 'warning');
    }, 1000);
}

/**
 * Filter the leaderboard by time period
 */
function filterLeaderboard(timeFilter) {
    // In a real implementation, this would make an API call
    // For now, we'll just show a notification
    let timeText = 'all time';
    
    if (timeFilter === 'this-week') {
        timeText = 'this week';
    } else if (timeFilter === 'this-month') {
        timeText = 'this month';
    }
    
    showNotification(`Showing leaderboard for ${timeText}`, 'info');
}

/**
 * Show a notification message
 */
function showNotification(message, type = 'info') {
    // Check if notification container exists, create if not
    let notificationContainer = document.querySelector('.notification-container');
    
    if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.className = 'notification-container';
        document.body.appendChild(notificationContainer);
        
        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            .notification-container {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 9999;
            }
            
            .notification {
                padding: 12px 20px;
                margin-bottom: 10px;
                border-radius: 4px;
                color: white;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                display: flex;
                align-items: center;
                min-width: 300px;
                transform: translateX(120%);
                transition: transform 0.3s ease;
            }
            
            .notification.show {
                transform: translateX(0);
            }
            
            .notification.info {
                background-color: #3498db;
            }
            
            .notification.success {
                background-color: #2ecc71;
            }
            
            .notification.warning {
                background-color: #f39c12;
            }
            
            .notification.error {
                background-color: #e74c3c;
            }
            
            .notification-icon {
                margin-right: 10px;
                font-size: 18px;
            }
            
            .notification-message {
                flex: 1;
            }
            
            .notification-close {
                cursor: pointer;
                margin-left: 10px;
                opacity: 0.7;
            }
            
            .notification-close:hover {
                opacity: 1;
            }
        `;
        document.head.appendChild(style);
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    // Set icon based on type
    let icon = 'info-circle';
    if (type === 'success') icon = 'check-circle';
    if (type === 'warning') icon = 'exclamation-triangle';
    if (type === 'error') icon = 'times-circle';
    
    notification.innerHTML = `
        <div class="notification-icon">
            <i class="fas fa-${icon}"></i>
        </div>
        <div class="notification-message">${message}</div>
        <div class="notification-close">
            <i class="fas fa-times"></i>
        </div>
    `;
    
    // Add to container
    notificationContainer.appendChild(notification);
    
    // Show notification with animation
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Set up close button
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    });
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }
    }, 5000);
}

/**
 * Get time ago string from date
 */
function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    
    let interval = Math.floor(seconds / 31536000);
    if (interval >= 1) {
        return interval === 1 ? '1 year ago' : `${interval} years ago`;
    }
    
    interval = Math.floor(seconds / 2592000);
    if (interval >= 1) {
        return interval === 1 ? '1 month ago' : `${interval} months ago`;
    }
    
    interval = Math.floor(seconds / 86400);
    if (interval >= 1) {
        return interval === 1 ? '1 day ago' : `${interval} days ago`;
    }
    
    interval = Math.floor(seconds / 3600);
    if (interval >= 1) {
        return interval === 1 ? '1 hour ago' : `${interval} hours ago`;
    }
    
    interval = Math.floor(seconds / 60);
    if (interval >= 1) {
        return interval === 1 ? '1 minute ago' : `${interval} minutes ago`;
    }
    
    return seconds < 10 ? 'just now' : `${Math.floor(seconds)} seconds ago`;
}

/**
 * Calculate AVAX allocation bonus based on points
 * @param {number} points - User points
 * @returns {number} - AVAX allocation bonus
 */
function calculateAvaxBonus(points) {
    // Maximum bonus is 50 AVAX
    const maxBonus = 50;
    
    // Calculate bonus (1 AVAX per 1000 points, up to 50 AVAX)
    const bonus = Math.min((points / 1000), maxBonus);
    
    // Round to 2 decimal places
    return Math.round(bonus * 100) / 100;
}

/**
 * Add leaderboard link to index.html navigation
 * This is a helper function that runs when the page loads to ensure
 * the leaderboard link is present in the main navigation
 */
function addLeaderboardToMainNav() {
    // This function would be used if we wanted to dynamically add the leaderboard link
    // to the main navigation on the index page. Since we're creating a separate page,
    // we've already added the link in the HTML.
}

/**
 * Set up animations for the leaderboard elements
 */
function setupAnimations() {
    try {
        // Animate elements when they come into view
        const animateOnScroll = function() {
            try {
                const elements = document.querySelectorAll('.step-card, .top-user, .leaderboard-hero-content');
                
                if (elements.length > 0) {
                    elements.forEach(element => {
                        try {
                            const elementTop = element.getBoundingClientRect().top;
                            const elementBottom = element.getBoundingClientRect().bottom;
                            
                            // Check if element is in viewport
                            if (elementTop < window.innerHeight && elementBottom > 0) {
                                element.style.opacity = '1';
                                element.style.transform = 'translateY(0)';
                            }
                        } catch (error) {
                            console.error('Error animating element:', error);
                        }
                    });
                }
            } catch (error) {
                console.error('Error in animateOnScroll:', error);
            }
        };
        
        // Set initial styles
        const elements = document.querySelectorAll('.step-card, .top-user, .leaderboard-hero-content');
        if (elements.length > 0) {
            elements.forEach(element => {
                try {
                    element.style.opacity = '0';
                    element.style.transform = 'translateY(20px)';
                    element.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
                } catch (error) {
                    console.error('Error setting initial styles:', error);
                }
            });
        }
        
        // Run on load
        setTimeout(animateOnScroll, 300);
        
        // Run on scroll
        window.addEventListener('scroll', animateOnScroll);
    } catch (error) {
        console.error('Error setting up animations:', error);
    }
}
