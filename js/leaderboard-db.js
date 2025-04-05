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
    // Corrected selectors based on leaderboard.html
    const leaderboardTableBody = document.getElementById('leaderboard-table-body');
    const topUsersContainer = document.querySelector('#top-users .top-users-container');

    if (!leaderboardTableBody || !topUsersContainer) {
      console.error('Leaderboard containers not found. Need #leaderboard-table-body and #top-users .top-users-container');
      return;
    }
    
    // Show loading state
    // Show loading state in the table body
    leaderboardTableBody.innerHTML = '<tr><td colspan="4" class="loading">Loading leaderboard data...</td></tr>';
    // Clear top users container
    topUsersContainer.innerHTML = '<div class="loading">Loading top users...</div>';
    
    // Fetch leaderboard data from API
    const response = await fetch('/api/leaderboard');
    
    if (!response.ok) {
      throw new Error(`Failed to fetch leaderboard: ${response.status} ${response.statusText}`);
    }
    
    const leaderboardData = await response.json();
    console.log('Leaderboard data:', leaderboardData);
    
    // Render the leaderboard using the correct containers
    renderLeaderboard(leaderboardData, topUsersContainer, leaderboardTableBody);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    // Display error in the table body
    document.getElementById('leaderboard-table-body').innerHTML =
      `<tr><td colspan="4" class="error">Failed to load leaderboard: ${error.message}</td></tr>`;
  }
}

/**
 * Render leaderboard data
 * @param {Array} data - Leaderboard data
 * @param {Element} topUsersContainer - Container for top 3 users
 * @param {Element} leaderboardTableBody - Container (tbody) for remaining users
 */
function renderLeaderboard(data, topUsersContainer, leaderboardTableBody) {
  // Clear existing content / loading states
  topUsersContainer.innerHTML = '';
  leaderboardTableBody.innerHTML = '';
  
  if (!data || data.length === 0) {
    leaderboardTableBody.innerHTML = '<tr><td colspan="4" class="empty">No leaderboard data available</td></tr>';
    topUsersContainer.innerHTML = '<div class="empty">No top users yet</div>'; // Also clear top users
    return;
  }
  
  // Render top 3 users
  // Sort data by points descending to ensure ranks are correct if not provided by API
  data.sort((a, b) => (b.total_points || 0) - (a.total_points || 0));

  const topUsers = data.slice(0, 3);
  const rankClasses = ['rank-2', 'rank-1', 'rank-3']; // Order for visual layout (2nd, 1st, 3rd)
  const rankDataOrder = [1, 0, 2]; // Index in topUsers array corresponding to rankClasses

  rankDataOrder.forEach((dataIndex, layoutIndex) => {
      if (dataIndex < topUsers.length) {
          const user = topUsers[dataIndex];
          const rank = dataIndex + 1; // Actual rank (1, 2, 3)
          const rankClass = rankClasses[layoutIndex]; // CSS class for layout

          // Calculate bonus (assuming calculateAvaxBonus exists or we define it)
          const bonus = calculateAvaxBonus(user.total_points || 0);

          let userCardHTML = `
            <div class="top-user ${rankClass}">
              <div class="rank">#${rank}</div>
              <div class="user-card">
                  <img src="${user.profile_image_url || 'images/cocopfp.jpg'}" alt="${user.handle}" class="user-avatar">
                  <div class="user-info">
                      <div class="user-handle">@${user.handle}</div>
                      <div class="user-points">${user.total_points || 0} <i class="fas fa-star"></i></div>
                      <div class="user-bonus" style="font-size: 0.8em; color: #aaa;">+${bonus} AVAX Bonus</div>
                  </div>
              </div>
          `;
          // Add crown for rank 1
          if (rank === 1) {
              userCardHTML += `<div class="crown-icon"><i class="fas fa-crown"></i></div>`;
          }
          userCardHTML += `</div>`;
          topUsersContainer.innerHTML += userCardHTML;
      }
  });
  
  // Render remaining users
  // Render remaining users into the table body
  const remainingUsers = data.slice(3);
  remainingUsers.forEach((user, index) => {
    const rank = index + 4; // Rank starts from 4 for the rest
    const bonus = calculateAvaxBonus(user.total_points || 0); // Calculate bonus

    leaderboardTableBody.innerHTML += `
      <tr>
        <td class="rank-cell">${rank}</td>
        <td class="user-cell">
          <img src="${user.profile_image_url || 'images/cocopfp.jpg'}" alt="${user.handle}" class="user-avatar-small">
          <span class="user-handle">@${user.handle}</span>
        </td>
        <td class="points-cell">${user.total_points || 0}</td>
        <td class="activity-cell">+${bonus} AVAX Bonus</td>
      </tr>
    `;
  });
}

// Helper function to calculate AVAX bonus (assuming 1 point = 0.001 AVAX bonus)
// This might need adjustment based on actual rules defined elsewhere
function calculateAvaxBonus(points) {
    return (points * 0.001).toFixed(2);
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