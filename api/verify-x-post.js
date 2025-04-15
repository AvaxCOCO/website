const fetch = require('node-fetch');
const db = require('./db'); // Assuming db/index.js is correctly referenced
require('dotenv').config(); // Ensure env vars are loaded

// Define points for verification
const VERIFICATION_POINTS = 50;

module.exports = async (req, res) => {
  // Set CORS headers (adjust origin for production)
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ verified: false, error: 'Method not allowed' });
  }

  try {
    // 1. Get Token and Validate User with X API
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ verified: false, error: 'No token provided or invalid format' });
    }
    const token = authHeader.split(' ')[1];

    console.log('Verification request received. Validating token with X API...');
    const userApiUrl = 'https://api.twitter.com/2/users/me?user.fields=profile_image_url,username,name';
    let xApiResponse;
    try {
        xApiResponse = await fetch(userApiUrl, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
    } catch (fetchError) {
        console.error('Error fetching from X API during verification:', fetchError);
        return res.status(500).json({ verified: false, error: 'Failed to contact X API' });
    }

    const xResponseText = await xApiResponse.text();
    let xUserData;
    try {
        xUserData = JSON.parse(xResponseText);
    } catch (e) {
         console.error('Failed to parse X API response during verification:', xResponseText);
         return res.status(500).json({ verified: false, error: 'Failed to parse user data response from X', details: xResponseText });
    }

    if (!xApiResponse.ok) {
        console.error('X API User data fetch error during verification:', xUserData);
        return res.status(xApiResponse.status).json({ verified: false, error: 'Failed to validate user with X', details: xUserData });
    }

    if (!xUserData || !xUserData.data) {
         console.error('Invalid user data format from X API during verification:', xUserData);
         return res.status(500).json({ verified: false, error: 'Received invalid data format from X API' });
    }
    console.log(`Token validated for user: @${xUserData.data.username}`);

    // 2. Get/Create User in DB
    const xUserProfile = {
        id: xUserData.data.id,
        handle: xUserData.data.username, // Store without '@' from API
        name: xUserData.data.name,
        profileImage: xUserData.data.profile_image_url
    };
    const userResult = await db.createOrUpdateUser(xUserProfile); // Returns { id, referral_code }
    const dbUserId = userResult.id;

    if (!dbUserId) {
        throw new Error('Failed to get internal user ID from database.');
    }
    console.log(`Internal DB User ID: ${dbUserId}`);

    // 3. Check Verification Status in DB
    const isAlreadyVerified = await db.getUserVerificationStatus(dbUserId);

    if (isAlreadyVerified) {
      console.log(`User ${dbUserId} (${xUserProfile.handle}) is already verified.`);
      // Fetch current points/rank to return consistent data
      const userRecord = await db.getUserProfile(dbUserId);
      return res.status(409).json({ // 409 Conflict
        verified: true, // Indicate they are verified
        alreadyVerified: true,
        error: 'Account already verified.',
        points: 0, // No new points awarded
        totalPoints: userRecord?.engagement_points ?? 0,
        level: userRecord?.level ?? 'Beginner',
        rank: userRecord?.rank ?? 'N/A'
      });
    }

    // 4. Mark User as Verified and Award Points (if not already verified)
    console.log(`User ${dbUserId} not verified yet. Proceeding with verification...`);
    const markedVerified = await db.markUserAsVerified(dbUserId);

    if (!markedVerified) {
        // This could happen if there was a race condition, treat as already verified
        console.warn(`User ${dbUserId} could not be marked as verified (likely already done).`);
         const userRecord = await db.getUserProfile(dbUserId);
         return res.status(409).json({
            verified: true,
            alreadyVerified: true,
            error: 'Account verification race condition or already verified.',
            points: 0,
            totalPoints: userRecord?.engagement_points ?? 0,
            level: userRecord?.level ?? 'Beginner',
            rank: userRecord?.rank ?? 'N/A'
         });
    }

    // Award points for successful verification
    const pointsResult = await db.updateUserPoints(dbUserId, VERIFICATION_POINTS);

    // Record the verification activity (optional, but good for tracking)
    await db.recordActivity(
      dbUserId,
      'verification',
      `Completed initial X post verification`,
      `verification-${dbUserId}`, // Create a unique ID for this activity type
      VERIFICATION_POINTS
    );

    // 5. Get Updated Profile and Respond
    const finalUserRecord = await db.getUserProfile(dbUserId);

    console.log(`Verification successful for user ${dbUserId}. Awarded ${VERIFICATION_POINTS} points.`);
    res.status(200).json({
      verified: true,
      alreadyVerified: false,
      points: VERIFICATION_POINTS,
      totalPoints: finalUserRecord?.engagement_points ?? 0,
      level: finalUserRecord?.level ?? 'Beginner',
      rank: finalUserRecord?.rank ?? 'N/A'
    });

  } catch (error) {
    console.error('Error verifying X post:', error);
    res.status(500).json({
      verified: false,
      error: 'Failed to verify X post due to a server error.'
    });
  }
};