const { Pool } = require('pg');

// Configure the connection pool using environment variables
const pool = new Pool({
  connectionString: process.env.NEON_DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Required for NeonDB connections
  }
});

// Helper function to handle database queries
async function query(text, params) {
  const client = await pool.connect();
  try {
    const res = await client.query(text, params);
    return res;
  } finally {
    client.release();
  }
}

module.exports = async (req, res) => {
  // --- CORS Headers ---
  res.setHeader('Access-Control-Allow-Origin', '*'); // Restrict in production
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle OPTIONS preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // --- GET Request: Fetch Scores ---
  if (req.method === 'GET') {
    try {
      const { gameName, limit: limitStr } = req.query;

      // Validate gameName
      if (!gameName || (gameName !== 'COCORUN' && gameName !== 'FLAPPYCOCO')) {
        return res.status(400).json({ error: 'Missing or invalid gameName query parameter. Must be COCORUN or FLAPPYCOCO.' });
      }

      // Validate and parse limit
      const limit = parseInt(limitStr) || 10; // Default to 10
      if (isNaN(limit) || limit <= 0 || limit > 100) {
         return res.status(400).json({ error: 'Invalid limit query parameter. Must be a positive integer (max 100).' });
      }

      // Fetch scores from DB, including username and profile pic
      // Uses RANK() window function to calculate rank based on score
      const sqlQuery = `
        SELECT
            xUserId,
            score,
            xUsername,         -- Fetch username
            xProfilePicUrl,    -- Fetch profile pic URL
            RANK() OVER (ORDER BY score DESC) as rank
        FROM
            ArcadeScores       -- Query the correct table
        WHERE
            gameName = $1
        ORDER BY
            score DESC
        LIMIT $2;
      `;
      const result = await query(sqlQuery, [gameName, limit]);

      res.status(200).json(result.rows);

    } catch (error) {
      console.error('Error fetching arcade leaderboard:', error);
      // Check if the error is due to the table not existing (helpful during setup)
      if (error.code === '42P01') { // '42P01' is PostgreSQL code for undefined_table
           return res.status(500).json({ error: 'Database table "ArcadeScores" not found. Please ensure the schema is applied.' });
      }
      res.status(500).json({ error: 'Failed to fetch arcade leaderboard data.' });
    }
  }
  // --- POST Request: Submit Score ---
  else if (req.method === 'POST') {
    try {
      const { gameName, score, xUserId, xUsername, xProfilePicUrl } = req.body;

      // --- Input Validation ---
      if (!gameName || (gameName !== 'COCORUN' && gameName !== 'FLAPPYCOCO')) {
        return res.status(400).json({ error: 'Invalid or missing gameName.' });
      }
      if (typeof score !== 'number' || !Number.isInteger(score) || score < 0) {
        return res.status(400).json({ error: 'Invalid or missing score. Must be a non-negative integer.' });
      }
      if (!xUserId || typeof xUserId !== 'string' || xUserId.trim() === '') {
        return res.status(400).json({ error: 'Invalid or missing xUserId.' });
      }
       // Basic validation for potentially missing username/profile pic (allow null/empty strings for now)
       if (typeof xUsername !== 'string') {
           // Could default or error, let's allow empty for now
           console.warn('Missing or invalid xUsername in score submission for user:', xUserId);
       }
       if (typeof xProfilePicUrl !== 'string') {
           // Could default or error, let's allow empty for now
           console.warn('Missing or invalid xProfilePicUrl in score submission for user:', xUserId);
       }
      // --- End Validation ---


      // UPSERT score into DB, now including username and profile pic
      const sqlQuery = `
        INSERT INTO ArcadeScores (xUserId, gameName, score, xUsername, xProfilePicUrl, playedAt)
        VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
        ON CONFLICT (xUserId, gameName)
        DO UPDATE SET
          score = GREATEST(ArcadeScores.score, EXCLUDED.score), -- Only update if new score is higher
          -- Optionally update username/pic if they changed, or keep the original
          xUsername = EXCLUDED.xUsername,                      -- Update username
          xProfilePicUrl = EXCLUDED.xProfilePicUrl,            -- Update profile pic
          playedAt = CURRENT_TIMESTAMP                     -- Always update timestamp
        WHERE ArcadeScores.score < EXCLUDED.score;            -- Condition to only update if score is higher
      `;

      // Pass all parameters to the query
      await query(sqlQuery, [xUserId, gameName, score, xUsername || 'Anonymous', xProfilePicUrl || null]); // Provide defaults if needed

      res.status(200).json({ message: 'Score submitted successfully.' });

    } catch (error) {
      console.error('Error submitting arcade score:', error);
       // Check if the error is due to the table not existing (helpful during setup)
      if (error.code === '42P01') { // '42P01' is PostgreSQL code for undefined_table
           return res.status(500).json({ error: 'Database table "ArcadeScores" not found. Please ensure the schema is applied.' });
      }
      // Check for potential foreign key constraint errors if xUserId needs to exist in 'users' table first
      // if (error.code === '23503') { // foreign_key_violation
      //    return res.status(400).json({ error: 'User associated with xUserId not found.' });
      // }
      res.status(500).json({ error: 'Failed to submit arcade score.' });
    }
  }
  // --- Method Not Allowed ---
  else {
    res.setHeader('Allow', ['GET', 'POST', 'OPTIONS']);
    res.status(405).json({ error: `Method ${req.method} not allowed.` });
  }
};