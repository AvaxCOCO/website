const { Pool } = require('pg');

// Configure the connection pool using environment variables
// Ensure NEON_DATABASE_URL is set in your Vercel project environment variables
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
  // Allow requests from any origin for simplicity in development/testing.
  // For production, restrict this to your actual frontend domain(s).
  res.setHeader('Access-Control-Allow-Origin', '*');
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
      if (isNaN(limit) || limit <= 0 || limit > 100) { // Add a reasonable upper bound
         return res.status(400).json({ error: 'Invalid limit query parameter. Must be a positive integer (max 100).' });
      }

      // Fetch scores from DB
      // Select only columns that exist in the user's table
      const sqlQuery = `
        SELECT
            xUserId,
            score,
            RANK() OVER (ORDER BY score DESC) as rank
        FROM
            ArcadeScores
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
      res.status(500).json({ error: 'Failed to fetch arcade leaderboard data.' });
    }
  }
  // --- POST Request: Submit Score ---
  else if (req.method === 'POST') {
    try {
      // Only expect fields present in the user's table schema
      const { gameName, score, xUserId, xUsername, xProfilePicUrl } = req.body; // Keep receiving username/pic from game

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
      // NOTE: We still receive xUsername and xProfilePicUrl from the game,
      // but we won't use them in the database query below as the columns don't exist.
      // We could add validation for them here if desired, but it's not strictly necessary.
      // --- End Validation ---


      // UPSERT score into DB
      // Use 'playedAt' to match the user's column name
      // Only insert/update columns that exist in the user's table definition
      const sqlQuery = `
        INSERT INTO ArcadeScores (xUserId, gameName, score, playedAt) -- Use playedAt column name
        VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
        ON CONFLICT (xUserId, gameName)
        DO UPDATE SET
          score = GREATEST(ArcadeScores.score, EXCLUDED.score), -- Only update if new score is higher
          playedAt = CURRENT_TIMESTAMP                     -- Update timestamp
        WHERE ArcadeScores.score < EXCLUDED.score;            -- Condition to only update if score is higher
      `;


      await query(sqlQuery, [xUserId, gameName, score]); // Pass only the used parameters

      res.status(200).json({ message: 'Score submitted successfully.' });

    } catch (error) {
      console.error('Error submitting arcade score:', error);
      // Check for specific DB errors if needed (e.g., constraint violations)
      res.status(500).json({ error: 'Failed to submit arcade score.' });
    }
  }
  // --- Method Not Allowed ---
  else {
    res.setHeader('Allow', ['GET', 'POST', 'OPTIONS']);
    res.status(405).json({ error: `Method ${req.method} not allowed.` });
  }
};