# $COCO Leaderboard Page - Detailed Implementation Plan

Based on analysis of the current website and the example provided (cookavax.com), this document outlines a comprehensive plan for implementing the $COCO leaderboard page. This plan focuses on Twitter integration, tracking user engagement with $COCO, and creating an engaging leaderboard experience.

## 1. Overview and Goals

```mermaid
graph TD
    A[Leaderboard Page] --> B[Twitter Authentication]
    A --> C[User Ranking Display]
    A --> D[Point System]
    A --> E[User Profile]
    
    B --> B1[Connect Twitter Account]
    B --> B2[Link to Wallet]
    
    C --> C1[Top Users Display]
    C --> C2[User Search]
    C --> C3[Pagination]
    
    D --> D1[Twitter Mentions]
    D --> D2[Hashtag Usage]
    D --> D3[Retweets/Likes]
    
    E --> E1[User Stats]
    E --> E2[Activity History]
    E --> E3[Rewards Status]
```

**Primary Goals:**
- Allow users to connect their Twitter accounts
- Track how much users talk about $COCO on Twitter
- Display a leaderboard ranking users based on their $COCO engagement
- Incentivize community participation and brand awareness

## 2. User Experience Flow

```mermaid
sequenceDiagram
    participant User
    participant Website
    participant Twitter
    participant Backend
    
    User->>Website: Visit leaderboard page
    Website->>User: Display leaderboard & connect button
    
    User->>Website: Click "Connect Twitter"
    Website->>Twitter: Redirect to Twitter OAuth
    Twitter->>User: Request authorization
    User->>Twitter: Authorize application
    Twitter->>Website: Return with auth token
    Website->>Backend: Send token for verification
    Backend->>Twitter: Verify token & get user info
    Twitter->>Backend: Return user data
    Backend->>Website: Confirm authentication
    Website->>User: Display connected status
    
    Note over User,Backend: After connection
    
    User->>Twitter: Post about $COCO
    Twitter->>Backend: Webhook notification
    Backend->>Backend: Calculate points
    Backend->>Website: Update leaderboard
    Website->>User: Show updated ranking
```

## 3. Page Structure and Design

The leaderboard page will maintain the same visual style as the existing website, using the same color scheme, typography, and overall aesthetic. Here's the proposed structure:

### 3.1 Header Section
- Title: "$COCO Leaderboard"
- Subtitle: "Talk about $COCO, earn rewards!"
- Brief explanation of how the leaderboard works
- Prominent "Connect Your Twitter" button

### 3.2 Leaderboard Display
- Top 3 users highlighted with special styling (similar to cookavax.com)
- Remaining users listed in descending order of points
- Each entry includes:
  - Rank number
  - Twitter profile picture
  - Twitter handle
  - Points earned
  - Twitter verification badge (if applicable)

### 3.3 User Profile Section
- Only visible when user is connected
- Shows user's current rank and points
- Recent activity (last 5 tweets about $COCO)
- Progress toward next reward tier

### 3.4 How It Works Section
- Step-by-step explanation of how to earn points
- Examples of effective tweets
- Information about rewards

## 4. Point System

```mermaid
graph LR
    A[Twitter Activities] --> B[Point Calculation]
    B --> C[Leaderboard Ranking]
    C --> D[Rewards Distribution]
    
    A --> A1[Mentioning $COCO]
    A --> A2[Using #COCO hashtag]
    A --> A3[Retweeting $COCO content]
    A --> A4[Liking $COCO tweets]
    
    B --> B1[Basic points per action]
    B --> B2[Engagement multipliers]
    B --> B3[Consistency bonuses]
    
    D --> D1[Presale allocations]
    D --> D2[Exclusive NFTs]
    D --> D3[Community recognition]
```

**Point Allocation:**
- Mentioning $COCO in a tweet: 10 points
- Using #COCO hashtag: 5 points
- Retweeting official $COCO content: 15 points
- Liking official $COCO tweets: 2 points
- Engagement on user's $COCO tweets (likes/retweets): 1 point per engagement
- Consistency bonus: +5 points per day of consecutive activity

## 5. Technical Implementation

### 5.1 Frontend Components

**HTML Structure:**
- Create a new `leaderboard.html` file based on existing page structure
- Implement responsive design for all device sizes
- Include sections for the leaderboard, user profile, and how-it-works

**CSS Styling:**
- Extend existing CSS with leaderboard-specific styles
- Create animations for rank changes and point updates
- Implement responsive design for mobile users

**JavaScript Functionality:**
- Twitter authentication handling
- Leaderboard data fetching and display
- Real-time updates for user activities
- Search and filtering functionality

### 5.2 Backend Requirements

```mermaid
graph TD
    A[Backend Services] --> B[Authentication Service]
    A --> C[Twitter Monitoring Service]
    A --> D[Points Calculation Service]
    A --> E[Database]
    
    B --> B1[OAuth Handling]
    B --> B2[Token Management]
    
    C --> C1[Twitter API Integration]
    C --> C2[Webhook Listeners]
    
    D --> D1[Activity Tracking]
    D --> D2[Point Rules Engine]
    
    E --> E1[User Profiles]
    E --> E2[Activity History]
    E --> E3[Leaderboard Data]
```

**Key Components:**
1. **Authentication System**
   - Twitter OAuth integration
   - User profile storage
   - Session management

2. **Twitter Monitoring**
   - Twitter API integration to track mentions, hashtags, and engagement
   - Webhook setup for real-time notifications
   - Rate limit handling and fallback mechanisms

3. **Database Structure**
   - Users table (Twitter ID, handle, profile pic, wallet address)
   - Activities table (user ID, activity type, timestamp, points)
   - Leaderboard table (user ID, total points, rank, last updated)

4. **API Endpoints**
   - `/auth/twitter` - Handle Twitter authentication
   - `/api/leaderboard` - Get leaderboard data
   - `/api/user/:id` - Get user profile and stats
   - `/api/activities/:userId` - Get user activities

### 5.3 Twitter API Integration

The Twitter API v2 will be used to:
1. Authenticate users via OAuth 2.0
2. Search for tweets mentioning $COCO
3. Track user engagement with $COCO content
4. Monitor hashtag usage

**Required Twitter API Endpoints:**
- OAuth 2.0 authorization
- Tweet search and filtering
- User profile information
- Tweet engagement metrics

### 5.4 Wallet Integration

To link Twitter accounts with crypto wallets:
1. User connects Twitter account
2. User connects wallet (using existing wallet connection functionality)
3. Backend associates the Twitter ID with the wallet address
4. All future activities from that Twitter account are credited to the linked wallet

## 6. Development Approach

A phased approach to implementation:

### Phase 1: Static Leaderboard
- Create the HTML/CSS for the leaderboard page
- Implement the page design with placeholder data
- Ensure responsive design works on all devices

### Phase 2: Twitter Authentication
- Implement the "Connect Twitter" functionality
- Set up the OAuth flow
- Store user credentials securely

### Phase 3: Backend Integration
- Develop the backend services for tracking Twitter activity
- Implement the points calculation system
- Create the database structure

### Phase 4: Real-time Updates
- Add real-time updates to the leaderboard
- Implement notifications for point changes
- Add user profile and activity history

## 7. Technical Considerations

### 7.1 Twitter API Limitations
- Rate limits: 500,000 tweets/month for standard access
- Search limitations: 7-day lookback period
- Authentication requirements: Developer account and approved app

### 7.2 Security Considerations
- Secure storage of OAuth tokens
- Protection against fake accounts and spam
- Prevention of point manipulation

### 7.3 Scalability
- Efficient database design for quick leaderboard updates
- Caching strategies for frequently accessed data
- Batch processing for point calculations

## 8. Implementation Timeline

```mermaid
gantt
    title $COCO Leaderboard Implementation Timeline
    dateFormat  YYYY-MM-DD
    section Frontend
    Static Leaderboard Page           :a1, 2025-04-10, 5d
    Twitter Connect UI                :a2, after a1, 3d
    User Profile UI                   :a3, after a2, 4d
    Real-time Updates                 :a4, 2025-04-25, 5d
    section Backend
    Twitter OAuth Setup               :b1, 2025-04-12, 4d
    Database Design                   :b2, 2025-04-15, 3d
    Twitter Monitoring Service        :b3, after b2, 7d
    Points Calculation System         :b4, after b3, 5d
    section Integration
    Frontend-Backend Integration      :c1, 2025-04-28, 6d
    Testing                           :c2, after c1, 4d
    Bug Fixes                         :c3, after c2, 3d
    section Launch
    Beta Release                      :d1, 2025-05-10, 3d
    Full Launch                       :d2, after d1, 1d
```

## 9. Example Code Snippets

To give you an idea of what the implementation will look like, here are some simplified code snippets:

### HTML Structure (leaderboard.html)
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <!-- Same head structure as your existing pages -->
    <title>$COCO Leaderboard - The Pink Ostrich of AVAX</title>
    <link rel="stylesheet" href="css/leaderboard.css">
</head>
<body>
    <!-- Header (same as other pages) -->
    
    <!-- Leaderboard Section -->
    <section id="leaderboard" class="leaderboard-section">
        <div class="container">
            <div class="section-header">
                <h2>$COCO Leaderboard</h2>
                <p>Talk about $COCO, earn rewards!</p>
            </div>
            
            <div class="twitter-connect">
                <p>Connect your Twitter account to start earning points and climb the leaderboard!</p>
                <button id="connect-twitter-btn" class="btn btn-primary btn-large">
                    <i class="fab fa-twitter"></i> Connect Twitter
                </button>
            </div>
            
            <div class="leaderboard-container">
                <div class="top-users">
                    <!-- Top 3 users will be displayed here -->
                </div>
                
                <div class="leaderboard-list">
                    <!-- Rest of the users will be displayed here -->
                </div>
                
                <div class="leaderboard-pagination">
                    <!-- Pagination controls -->
                </div>
            </div>
        </div>
    </section>
    
    <!-- User Profile Section (visible only when connected) -->
    <section id="user-profile" class="user-profile-section hidden">
        <!-- User profile content -->
    </section>
    
    <!-- How It Works Section -->
    <section id="how-it-works" class="how-it-works-section">
        <!-- Explanation of the leaderboard system -->
    </section>
    
    <!-- Footer (same as other pages) -->
    
    <!-- JavaScript -->
    <script src="js/leaderboard.js"></script>
</body>
</html>
```

### JavaScript for Twitter Authentication (simplified)
```javascript
// Twitter authentication handling
document.getElementById('connect-twitter-btn').addEventListener('click', function() {
    // Redirect to backend authentication endpoint
    window.location.href = '/auth/twitter';
});

// Check if user is returning from Twitter OAuth
document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const authToken = urlParams.get('oauth_token');
    const authVerifier = urlParams.get('oauth_verifier');
    
    if (authToken && authVerifier) {
        // Complete the authentication process
        fetch('/auth/twitter/callback', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                oauth_token: authToken,
                oauth_verifier: authVerifier
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Show user as connected
                showUserProfile(data.user);
                loadLeaderboard();
            }
        });
    }
});

// Load leaderboard data
function loadLeaderboard() {
    fetch('/api/leaderboard')
        .then(response => response.json())
        .then(data => {
            renderLeaderboard(data);
        });
}

// Render leaderboard with user data
function renderLeaderboard(data) {
    const topUsers = document.querySelector('.top-users');
    const leaderboardList = document.querySelector('.leaderboard-list');
    
    // Clear existing content
    topUsers.innerHTML = '';
    leaderboardList.innerHTML = '';
    
    // Render top 3 users
    data.slice(0, 3).forEach((user, index) => {
        topUsers.innerHTML += `
            <div class="top-user rank-${index + 1}">
                <div class="rank">#${index + 1}</div>
                <img src="${user.profileImage}" alt="${user.handle}" class="user-avatar">
                <div class="user-info">
                    <div class="user-handle">@${user.handle}</div>
                    <div class="user-points">${user.points} points</div>
                </div>
            </div>
        `;
    });
    
    // Render remaining users
    data.slice(3).forEach((user, index) => {
        leaderboardList.innerHTML += `
            <div class="leaderboard-item">
                <div class="rank">#${index + 4}</div>
                <img src="${user.profileImage}" alt="${user.handle}" class="user-avatar">
                <div class="user-handle">@${user.handle}</div>
                <div class="user-points">${user.points} points</div>
            </div>
        `;
    });
}
```

## 10. Next Steps

1. Begin implementation with the static leaderboard page
2. Set up Twitter Developer Account for API access
3. Implement the frontend components
4. Develop the backend services
5. Integrate and test the complete system