// X Authentication User Data Endpoint - Updated to use database data
const fetch = require('node-fetch');
const db = require('../../db'); // Use the database module

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*'); // Adjust for production environment if needed
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // --- 1. Extract Token ---
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided or invalid format' });
    }
    const token = authHeader.split(' ')[1];

    // --- 2. Fetch User Profile from X API ---
    const userApiUrl = 'https://api.twitter.com/2/users/me?user.fields=profile_image_url,username,name';
    let xApiResponse;
    try {
      xApiResponse = await fetch(userApiUrl, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
    } catch (fetchError) {
      console.error('Error fetching from X API:', fetchError);
      return res.status(500).json({ error: 'Failed to contact X API' });
    }

    const xResponseText = await xApiResponse.text();
    let xUserData;
    try {
      xUserData = JSON.parse(xResponseText);
    } catch (e) {
      console.error('Failed to parse X API response:', xResponseText);
      return res.status(500).json({
        error: 'Failed to parse user data response from X',
        details: xResponseText
      });
    }

    if (!xApiResponse.ok) {
      console.error('X API User data fetch error:', xUserData);
      // Forward X API error status and message if possible
      return res.status(xApiResponse.status).json({
        error: 'Failed to fetch user data from X',
        details: xUserData
      });
    }

    if (!xUserData || !xUserData.data) {
         console.error('Invalid user data format from X API:', xUserData);
         return res.status(500).json({ error: 'Received invalid data format from X API' });
    }


    // --- 3. Prepare User Data for Database ---
    const xUserProfile = {
      id: xUserData.data.id,
      handle: xUserData.data.username, // Store without '@' prefix in DB maybe? DB function handles adding it if needed. Assuming handle is stored without '@'.
      name: xUserData.data.name,
      profileImage: xUserData.data.profile_image_url
    };

    // --- 4. Interact with Database ---
    let userRecord = null;
    let activities = [];
    let internalUserId = null;

    try {
      // Create or update the user in the database, get internal ID
      internalUserId = await db.createOrUpdateUser(xUserProfile); //

      if (internalUserId) {
         // Get user data from database (including points, rank, level)
         userRecord = await db.getUserByXId(xUserProfile.id); //

         // Get recent activities using the internal database ID
         activities = await db.getUserActivities(internalUserId); //
      } else {
          console.error('Failed to get internalUserId from createOrUpdateUser for X ID:', xUserProfile.id);
          // Proceed without DB data, but log the issue
      }

    } catch (dbError) {
      console.error('Database error fetching user details:', dbError);
      // Don't fail the request, just return profile data without points/rank/activities
      // You might want stricter error handling depending on requirements
    }

    // --- 5. Combine Data and Respond ---
    const combinedUserData = {
      id: xUserProfile.id,
      handle: '@' + xUserProfile.handle, // Add '@' for display consistency
      name: xUserProfile.name,
      profileImage: xUserProfile.profileImage,
      points: userRecord?.total_points ?? 0, // Default to 0 if no record/points
      rank: userRecord?.rank ?? null,        // Default to null if no record/rank
      level: userRecord?.level ?? 'Beginner', // Default to Beginner
      activities: activities                  // Use fetched activities or empty array
    };

    res.status(200).json(combinedUserData);

  } catch (error) {
    // Catch any unexpected errors during the process
    console.error('Unexpected error in /api/auth/x/user:', error);
    res.status(500).json({ error: 'An unexpected server error occurred' });
  }
};