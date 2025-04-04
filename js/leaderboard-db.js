/**
 * $COCO Leaderboard with Database Integration
 * This file handles fetching and displaying leaderboard data from the database
 */

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
  console.log('Leaderboard page loaded');
  
  // Check if user is authenticated
  const token = localStorage.getItem('xAccessToken');
  const userData = localStorage.getItem('cocoXUser');
  
  if (token && userData) {
    // User is authenticated, show their profile
    showUserProfile(JSON.parse(userData));
  }
  
  // Fetch and display leaderboard data
  fetchLeaderboard();
});

/**
 * Fetch leaderboard data from the API
 */
async function fetchLeaderboard() {
  try {
    const leaderboardContainer = document.querySelector('.leaderboard-list');
    const topUsersContainer = document.querySelector('.top-users');
    
    if (!leaderboardContainer || !topUsersContainer) {
      console.error('Leaderboard containers not found');
      return;
    }
    
    // Show loading state
    leaderboardContainer.innerHTML = '<div class="loading">Loading leaderboard data...</div>';
    
    // Fetch leaderboard data from API
    const response = await fetch('/api/leaderboard');
    
    if (!response.ok) {
      throw new Error(`Failed to fetch leaderboard: ${response.status} ${response.statusText}`);
    }
    
    const leaderboardData = await response.json();
    console.log('Leaderboard data:', leaderboardData);
    
    // Render the leaderboard
    renderLeaderboard(leaderboardData, topUsersContainer, leaderboardContainer);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    document.querySelector('.leaderboard-list').innerHTML = 
      `<div class="error">Failed to load leaderboard: ${error.message}</div>`;
  }
}

/**
 * Render leaderboard data
 * @param {Array} data - Leaderboard data
 * @param {Element} topUsersContainer - Container for top 3 users
 * @param {Element} leaderboardContainer - Container for remaining users
 */
function renderLeaderboard(data, topUsersContainer, leaderboardContainer) {
  // Clear existing content
  topUsersContainer.innerHTML = '';
  leaderboardContainer.innerHTML = '';
  
  if (!data || data.length === 0) {
    leaderboardContainer.innerHTML = '<div class="empty">No leaderboard data available</div>';
    return;
  }
  
  // Render top 3 users
  const topUsers = data.slice(0, 3);
  topUsers.forEach((user, index) => {
    const rank = user.rank || (index + 1);
    topUsersContainer.innerHTML += `
      <div class="top-user rank-${rank}">
        <div class="rank">#${rank}</div>
        <img src="${user.profile_image_url || 'images/cocopfp.jpg'}" alt="${user.handle}" class="user-avatar">
        <div class="user-info">
          <div class="user-handle">${user.handle}</div>
          <div class="user-points">${user.total_points || 0} points</div>
          <div class="user-level">${user.level || 'Beginner'}</div>
        </div>
      </div>
    `;
  });
  
  // Render remaining users
  const remainingUsers = data.slice(3);
  remainingUsers.forEach((user) => {
    const rank = user.rank || 0;
    leaderboardContainer.innerHTML += `
      <div class="leaderboard-item">
        <div class="rank">#${rank}</div>
        <img src="${user.profile_image_url || 'images/cocopfp.jpg'}" alt="${user.handle}" class="user-avatar">
        <div class="user-handle">${user.handle}</div>
        <div class="user-points">${user.total_points || 0} points</div>
        <div class="user-level">${user.level || 'Beginner'}</div>
      </div>
    `;
  });
}

/**
 * Show user profile
 * @param {Object} userData - User data
 */
function showUserProfile(userData) {
  const userProfilePreview = document.getElementById('user-profile-preview');
  const twitterConnectContainer = document.getElementById('twitter-connect-container');
  
  if (!userProfilePreview || !twitterConnectContainer) {
    console.error('User profile containers not found');
    return;
  }
  
  // Hide connect button, show user profile
  twitterConnectContainer.classList.add('hidden');
  userProfilePreview.classList.remove('hidden');
  
  // Update user profile with data
  const userHandle = userProfilePreview.querySelector('.user-handle');
  const userPoints = userProfilePreview.querySelector('.user-points');
  const userRank = userProfilePreview.querySelector('.user-rank');
  const userImage = userProfilePreview.querySelector('.user-image');
  const userLevel = userProfilePreview.querySelector('.user-level');
  
  if (userHandle) userHandle.textContent = userData.handle;
  if (userPoints) userPoints.textContent = `${userData.points || 0} points`;
  if (userRank) userRank.textContent = `Rank #${userData.rank || 0}`;
  if (userImage && userData.profileImage) userImage.src = userData.profileImage;
  if (userLevel) userLevel.textContent = userData.level || 'Beginner';
  
  // Show user activities if available
  const userActivities = userProfilePreview.querySelector('.user-activities');
  if (userActivities && userData.activities && userData.activities.length > 0) {
    userActivities.innerHTML = '<h4>Recent Activities</h4>';
    
    userData.activities.forEach(activity => {
      const date = new Date(activity.timestamp || activity.created_at);
      const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
      
      userActivities.innerHTML += `
        <div class="activity ${activity.type}">
          <div class="activity-content">${activity.content}</div>
          <div class="activity-meta">
            <span class="activity-type">${activity.type}</span>
            <span class="activity-points">+${activity.points} points</span>
            <span class="activity-time">${formattedDate}</span>
          </div>
        </div>
      `;
    });
  }
}