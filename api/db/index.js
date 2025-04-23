const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid'); // Import UUID generator

// Create a connection pool
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: {
    rejectUnauthorized: false // Adjust based on your Neon DB SSL settings
  }
});

// --- User Functions ---
async function createOrUpdateUser(xUser) {
  const { id, handle, name, profileImage } = xUser;

  // Ensure handle starts with '@' for consistency, remove if already present
  const formattedHandle = handle.startsWith('@') ? handle : `@${handle}`;

  const query = `
    INSERT INTO users (x_id, handle, name, profile_image_url)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (x_id)
    DO UPDATE SET
      handle = EXCLUDED.handle,
      name = EXCLUDED.name,
      profile_image_url = EXCLUDED.profile_image_url,
      updated_at = CURRENT_TIMESTAMP
    RETURNING id, referral_code -- Return internal ID and referral code
  `;

  const result = await pool.query(query, [id, formattedHandle, name, profileImage]);
  return result.rows[0]; // Return the user object including id and potentially null referral_code
}

async function getUserByXId(xId) {
  // Fetches basic user info + engagement points/rank/level
  const query = `
    SELECT u.*, p.total_points, p.rank, p.level
    FROM users u
    LEFT JOIN points p ON u.id = p.user_id
    WHERE u.x_id = $1
  `;

  const result = await pool.query(query, [xId]);
  return result.rows[0];
}

// Get user profile data including referral info and verification status
async function getUserProfile(userId) {
    // Check if userId is a string that looks like an X user ID (large number as string)
    const isXUserId = typeof userId === 'string' && userId.length > 15;
    
    let query;
    if (isXUserId) {
        // If it looks like an X user ID, search by x_id column
        query = `
            SELECT u.id, u.x_id, u.handle, u.name, u.profile_image_url,
                   u.referral_code, u.referral_points, u.verified_at, -- Added verified_at
                   p.total_points AS engagement_points, p.rank, p.level
            FROM users u
            LEFT JOIN points p ON u.id = p.user_id
            WHERE u.x_id = $1
        `;
    } else {
        // Otherwise, search by internal id column
        query = `
            SELECT u.id, u.x_id, u.handle, u.name, u.profile_image_url,
                   u.referral_code, u.referral_points, u.verified_at, -- Added verified_at
                   p.total_points AS engagement_points, p.rank, p.level
            FROM users u
            LEFT JOIN points p ON u.id = p.user_id
            WHERE u.id = $1
        `;
    }
    
    const result = await pool.query(query, [userId]);
    return result.rows[0];
}

// Ensure user has a referral code, generate if needed
async function ensureReferralCode(userId) {
    let user = await getUserProfile(userId); // Reuse profile fetch
    
    // If user doesn't exist, create a temporary user record
    if (!user) {
        console.log(`User not found for ID: ${userId}, creating a temporary user record`);
        
        try {
            // Check if userId is a string that looks like an X user ID (large number as string)
            const isXUserId = typeof userId === 'string' && userId.length > 15;
            
            if (isXUserId) {
                // Create a new user with the X ID
                const insertQuery = `
                    INSERT INTO users (x_id, handle, name, profile_image_url)
                    VALUES ($1, $2, $3, $4)
                    RETURNING id, x_id, handle, name, profile_image_url, referral_code
                `;
                
                const result = await pool.query(insertQuery, [
                    userId,
                    '@user' + userId.substring(userId.length - 6), // Generate a temporary handle
                    'User', // Generic name
                    null // No profile image
                ]);
                
                if (result.rows.length > 0) {
                    user = result.rows[0];
                    console.log(`Created temporary user record for X ID: ${userId}`);
                } else {
                    throw new Error('Failed to create temporary user record');
                }
            } else {
                throw new Error('Cannot create user without X ID');
            }
        } catch (error) {
            console.error(`Error creating temporary user: ${error.message}`);
            throw new Error(`User not found and could not create temporary record: ${error.message}`);
        }
    }

    if (!user.referral_code) {
        const newCode = uuidv4();
        
        // Check if userId is a string that looks like an X user ID (large number as string)
        const isXUserId = typeof userId === 'string' && userId.length > 15;
        
        let updateQuery;
        if (isXUserId) {
            // If it looks like an X user ID, update by x_id column
            updateQuery = 'UPDATE users SET referral_code = $1 WHERE x_id = $2 RETURNING referral_code';
        } else {
            // Otherwise, update by internal id column
            updateQuery = 'UPDATE users SET referral_code = $1 WHERE id = $2 RETURNING referral_code';
        }
        
        const result = await pool.query(updateQuery, [newCode, userId]);
        if (result.rows.length > 0) {
            console.log(`Generated and assigned referral code ${result.rows[0].referral_code} to user ${userId}`);
            return result.rows[0].referral_code;
        } else {
            console.error(`Failed to update user ${userId} with referral code, attempting to fetch again.`);
             user = await getUserProfile(userId);
             if(user && user.referral_code) return user.referral_code;
            throw new Error('Failed to update user with referral code');
        }
    }
    return user.referral_code;
}

// Get user by referral code
async function getUserByReferralCode(referralCode) {
    const query = 'SELECT id, handle FROM users WHERE referral_code = $1';
    const result = await pool.query(query, [referralCode]);
    return result.rows[0];
}

// New: Check if a user has already verified (based on verified_at timestamp)
async function getUserVerificationStatus(userId) {
    const query = 'SELECT verified_at FROM users WHERE id = $1';
    const result = await pool.query(query, [userId]);
    if (result.rows.length === 0) {
        throw new Error('User not found when checking verification status');
    }
    // Return true if verified_at is not null, false otherwise
    return result.rows[0].verified_at !== null;
}

// New: Mark a user as verified by setting the timestamp
async function markUserAsVerified(userId) {
    console.log(`Marking user ${userId} as verified.`);
    const query = 'UPDATE users SET verified_at = CURRENT_TIMESTAMP WHERE id = $1 AND verified_at IS NULL RETURNING id'; // Only update if not already set
    const result = await pool.query(query, [userId]);
    if (result.rows.length > 0) {
        console.log(`User ${userId} successfully marked as verified.`);
        return true; // Indicates successful update
    } else {
        console.log(`User ${userId} was already verified or not found.`);
        return false; // Indicates user was already verified or not found
    }
}


// --- Activity Functions ---
async function recordActivity(userId, type, content, xActivityId, points) {
  const query = `
    INSERT INTO activities (user_id, type, content, x_activity_id, points)
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT DO NOTHING -- Optional: Prevent duplicate activity logging if needed based on a unique constraint
    RETURNING id
  `;

  const result = await pool.query(query, [userId, type, content, xActivityId, points]);
  return result.rows.length > 0 ? result.rows[0].id : null; // Return ID or null if conflict occurred
}

async function getUserActivities(userId, limit = 5) {
  const query = `
    SELECT * FROM activities
    WHERE user_id = $1
    ORDER BY created_at DESC
    LIMIT $2
  `;

  const result = await pool.query(query, [userId, limit]);
  return result.rows;
}

async function getActivityByXId(xActivityId) {
  // Used by cron job and potentially verification if re-enabled
  const query = `
    SELECT * FROM activities
    WHERE x_activity_id = $1
    LIMIT 1
  `;

  const result = await pool.query(query, [xActivityId]);
  return result.rows.length > 0 ? result.rows[0] : null;
}

// --- Points Functions (Engagement Leaderboard) ---
async function updateUserPoints(userId, points) {
  // Updates 'points' table for engagement leaderboard
  console.log(`Updating engagement points for user ${userId} by ${points}`);
  const upsertQuery = `
    INSERT INTO points (user_id, total_points)
    VALUES ($1, $2)
    ON CONFLICT (user_id)
    DO UPDATE SET
      total_points = points.total_points + $2,
      last_updated = CURRENT_TIMESTAMP
    RETURNING total_points
  `;

  const result = await pool.query(upsertQuery, [userId, points]);
  const totalPoints = result.rows[0].total_points;
  console.log(`User ${userId} engagement points updated to ${totalPoints}`);

  let level = 'Beginner';
  if (totalPoints >= 50000) level = 'Gold';
  else if (totalPoints >= 25000) level = 'Silver';
  else if (totalPoints >= 10000) level = 'Bronze';

  await pool.query(
    'UPDATE points SET level = $1 WHERE user_id = $2',
    [level, userId]
  );

  await updateRankings(); // Update overall rankings

  return { totalPoints, level };
}

async function updateRankings() {
  // Updates rank in 'points' table
  console.log('Updating engagement leaderboard rankings...');
  const query = `
    WITH ranks AS (
      SELECT user_id, RANK() OVER (ORDER BY total_points DESC, created_at ASC) as rank -- Added tie-breaker
      FROM points p JOIN users u ON p.user_id = u.id -- Join to get created_at for tie-breaker
    )
    UPDATE points p
    SET rank = r.rank
    FROM ranks r
    WHERE p.user_id = r.user_id
  `;
  try {
      const result = await pool.query(query);
      console.log(`Rankings updated. Rows affected: ${result.rowCount}`);
  } catch (rankError) {
      console.error("Error updating rankings:", rankError);
  }
}

async function getLeaderboard(limit = 100, offset = 0) {
  // Gets leaderboard based on 'points' table (engagement points)
  const query = `
    SELECT u.x_id, u.handle, u.name, u.profile_image_url,
           p.total_points, p.rank, p.level
    FROM points p
    JOIN users u ON p.user_id = u.id
    WHERE p.rank IS NOT NULL -- Ensure only ranked users are returned
    ORDER BY p.rank ASC, u.created_at ASC -- Order by rank, then signup time
    LIMIT $1 OFFSET $2
  `;

  const result = await pool.query(query, [limit, offset]);
  return result.rows;
}

// --- Referral Functions ---

// Update user's referral points
async function updateUserReferralPoints(userId, pointsToAdd) {
    console.log(`Updating referral points for user ${userId} by ${pointsToAdd}`);
    const query = `
        UPDATE users
        SET referral_points = referral_points + $1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING referral_points;
    `;
    const result = await pool.query(query, [pointsToAdd, userId]);
    if (result.rows.length === 0) {
        console.error(`User not found when updating referral points for ID: ${userId}`);
        return null;
    }
    console.log(`User ${userId} referral points updated to ${result.rows[0].referral_points}`);
    return result.rows[0].referral_points;
}

// Log a referral event
async function logReferralEvent(referrerUserId, visitorIdentifier, eventType, pointsAwarded) {
    console.log(`Logging referral event: Referrer=${referrerUserId}, Visitor=${visitorIdentifier}, Type=${eventType}, Points=${pointsAwarded}`);
    const query = `
        INSERT INTO referral_events (referrer_user_id, visitor_identifier, event_type, points_awarded)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (referrer_user_id, visitor_identifier, event_type) DO NOTHING -- Important: Prevent duplicates
        RETURNING id; -- Returns ID if inserted, null/empty if conflict
    `;
    try {
        const result = await pool.query(query, [referrerUserId, visitorIdentifier, eventType, pointsAwarded]);
        if (result.rows.length > 0) {
            console.log(`Referral event logged successfully, ID: ${result.rows[0].id}`);
            return true; // Return true if inserted
        } else {
            console.log(`Referral event already exists or failed to insert (ON CONFLICT likely).`);
            return false; // Return false if duplicate/failed
        }
    } catch (error) {
        console.error('Error logging referral event in DB:', error);
        return false; // Return false on error
    }
}

// Store a referred email
async function storeReferralEmail(referrerUserId, email) {
     console.log(`Storing referral email: Referrer=${referrerUserId}, Email=${email}`);
    const query = `
        INSERT INTO referral_emails (referrer_user_id, email)
        VALUES ($1, $2)
        ON CONFLICT (referrer_user_id, email) DO NOTHING -- Prevent duplicates
        RETURNING id; -- Returns ID if inserted, null/empty if conflict
    `;
     try {
        const result = await pool.query(query, [referrerUserId, email]);
         if (result.rows.length > 0) {
            console.log(`Referral email stored successfully, ID: ${result.rows[0].id}`);
            return true; // Return true if inserted
        } else {
            console.log(`Referral email already exists or failed to insert (ON CONFLICT likely).`);
            return false; // Return false if duplicate/failed
        }
    } catch (error) {
        console.error('Error storing referral email in DB:', error);
        return false; // Return false on error
    }
}

module.exports = {
  pool, // Export pool for session store
  createOrUpdateUser,
  getUserByXId,
  getUserProfile,
  ensureReferralCode,
  getUserByReferralCode,
  getUserVerificationStatus, // New export
  markUserAsVerified, // New export
  recordActivity,
  getUserActivities,
  getActivityByXId,
  updateUserPoints,
  updateRankings,
  getLeaderboard,
  updateUserReferralPoints,
  logReferralEvent,
  storeReferralEmail
};
