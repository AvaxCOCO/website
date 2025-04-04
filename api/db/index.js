const { Pool } = require('pg');

// Create a connection pool
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// User functions
async function createOrUpdateUser(xUser) {
  const { id, handle, name, profileImage } = xUser;
  
  const query = `
    INSERT INTO users (x_id, handle, name, profile_image_url)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (x_id) 
    DO UPDATE SET 
      handle = $2,
      name = $3,
      profile_image_url = $4,
      updated_at = CURRENT_TIMESTAMP
    RETURNING id
  `;
  
  const result = await pool.query(query, [id, handle, name, profileImage]);
  return result.rows[0].id;
}

async function getUserByXId(xId) {
  const query = `
    SELECT u.*, p.total_points, p.rank, p.level
    FROM users u
    LEFT JOIN points p ON u.id = p.user_id
    WHERE u.x_id = $1
  `;
  
  const result = await pool.query(query, [xId]);
  return result.rows[0];
}

// Activity functions
async function recordActivity(userId, type, content, xActivityId, points) {
  const query = `
    INSERT INTO activities (user_id, type, content, x_activity_id, points)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id
  `;
  
  const result = await pool.query(query, [userId, type, content, xActivityId, points]);
  return result.rows[0].id;
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

/**
 * Get activity by X activity ID
 * @param {string} xActivityId - X activity ID
 * @returns {Object|null} - Activity object or null if not found
 */
async function getActivityByXId(xActivityId) {
  const query = `
    SELECT * FROM activities
    WHERE x_activity_id = $1
    LIMIT 1
  `;
  
  const result = await pool.query(query, [xActivityId]);
  return result.rows.length > 0 ? result.rows[0] : null;
}

// Points functions
async function updateUserPoints(userId, points) {
  // First, update or insert the points record
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
  
  // Then, determine the level based on points
  let level = 'Beginner';
  if (totalPoints >= 50000) level = 'Gold';
  else if (totalPoints >= 25000) level = 'Silver';
  else if (totalPoints >= 10000) level = 'Bronze';
  
  // Update the level
  await pool.query(
    'UPDATE points SET level = $1 WHERE user_id = $2',
    [level, userId]
  );
  
  // Finally, update rankings for all users
  await updateRankings();
  
  return { totalPoints, level };
}

async function updateRankings() {
  // Update rankings based on total points
  const query = `
    UPDATE points
    SET rank = ranks.rank
    FROM (
      SELECT user_id, RANK() OVER (ORDER BY total_points DESC) as rank
      FROM points
    ) ranks
    WHERE points.user_id = ranks.user_id
  `;
  
  await pool.query(query);
}

async function getLeaderboard(limit = 100, offset = 0) {
  const query = `
    SELECT u.x_id, u.handle, u.name, u.profile_image_url, 
           p.total_points, p.rank, p.level
    FROM points p
    JOIN users u ON p.user_id = u.id
    ORDER BY p.total_points DESC
    LIMIT $1 OFFSET $2
  `;
  
  const result = await pool.query(query, [limit, offset]);
  return result.rows;
}

module.exports = {
  createOrUpdateUser,
  getUserByXId,
  recordActivity,
  getUserActivities,
  getActivityByXId,
  updateUserPoints,
  updateRankings,
  getLeaderboard
};