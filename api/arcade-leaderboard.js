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

      // *** CORRECTED SELECT STATEMENT ***
      // Fetch scores from DB, including username and profile pic
      const sqlQuery = `
        SELECT
            xUserId,
            score,
            xUsername,         -- Added xUsername
            xProfilePicUrl,    -- Added xProfilePicUrl
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
      console.error('[API GET Error] Error fetching arcade leaderboard:', error);
      if (error.code === '42P01') {
           return res.status(500).json({ error: 'Database table "ArcadeScores" not found. Please ensure the schema is applied.' });
      }
      res.status(500).json({ error: 'Failed to fetch arcade leaderboard data.' });
    }
  }
  // --- POST Request: Submit Score ---
  else if (req.method === 'POST') {
    try {
      // Add logging
      console.log('[API POST] Received Request Body:', JSON.stringify(req.body));

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
       if (typeof xUsername !== 'string') {
           console.warn('[API POST Warning] Missing or invalid xUsername in score submission for user:', xUserId);
       }
       if (typeof xProfilePicUrl !== 'string') {
           console.warn('[API POST Warning] Missing or invalid xProfilePicUrl in score submission for user:', xUserId);
       }
      // --- End Validation ---

      // *** CORRECTED INSERT/UPDATE STATEMENT ***
      // Include xUsername and xProfilePicUrl in INSERT and UPDATE
      const sqlQuery = `
        INSERT INTO ArcadeScores (xUserId, gameName, score, xUsername, xProfilePicUrl, playedAt)
        VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
        ON CONFLICT (xUserId, gameName)
        DO UPDATE SET
          score = GREATEST(ArcadeScores.score, EXCLUDED.score),
          xUsername = EXCLUDED.xUsername,          -- Added xUsername update
          xProfilePicUrl = EXCLUDED.xProfilePicUrl, -- Added xProfilePicUrl update
          playedAt = CURRENT_TIMESTAMP
        WHERE ArcadeScores.score < EXCLUDED.score;
      `;

      const queryParams = [
          xUserId,
          gameName,
          score,
          xUsername || null, // Pass username (or null if missing)
          xProfilePicUrl || null // Pass profile pic url (or null if missing)
      ];

      // Add logging
      console.log('[API POST] Executing Query With Params:', JSON.stringify(queryParams));

      await query(sqlQuery, queryParams); // Pass all 5 parameters

      res.status(200).json({ message: 'Score submitted successfully.' });

    } catch (error) {
      console.error('[API POST Error] Error submitting arcade score:', error);
      if (error.code === '42P01') {
           return res.status(500).json({ error: 'Database table "ArcadeScores" not found. Please ensure the schema is applied.' });
      }
      // Log the full error for more details
      res.status(500).json({ error: 'Failed to submit arcade score.', details: error.message });
    }
  }
  // --- Method Not Allowed ---
  else {
    res.setHeader('Allow', ['GET', 'POST', 'OPTIONS']);
    res.status(405).json({ error: `Method ${req.method} not allowed.` });
  }
};