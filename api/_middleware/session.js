// api/_middleware/session.js
// IMPORTANT: Vercel might handle middleware differently, especially with file-based routing.
// If this global approach doesn't work, you'll need to apply session middleware
// within each individual API route file that requires session access.

const Redis = require('ioredis');
const session = require('express-session');
const RedisStore = require('connect-redis').default; // Use .default for CommonJS require with v7+
require('dotenv').config(); // Ensure environment variables are loaded

const redisClient = new Redis({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: null,
  enableReadyCheck: false // Important for serverless environments
});

const sessionMiddleware = session({
  store: new RedisStore({
    client: redisClient,
  }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 7,
    sameSite: 'lax'
  }
});

// Export middleware function for Vercel (or manual application)
module.exports = (req, res, next) => {
    // Check if secret is set (critical for security)
    if (!process.env.SESSION_SECRET) {
        console.error("\n!!! FATAL ERROR: SESSION_SECRET environment variable is not set. Sessions will not be secure. !!!\n");
        // In a real production app, you might want to throw an error or prevent startup.
        // For now, we log and continue, but this MUST be fixed.
        // return res.status(500).send('Server configuration error: Session secret missing.');
    }

    // Apply the actual session middleware logic
    sessionMiddleware(req, res, (err) => {
        if (err) {
            console.error("Session middleware error:", err);
            // Handle error appropriately, maybe return 500
            return res.status(500).send('Session initialization error.');
        }
        // If session middleware initializes without error, proceed to the next handler (the API route)
        next();
    });
};

// --- Notes if global middleware doesn't work: ---
// You would import and apply `sessionMiddleware` within each API route file like this:
/*
// Example in api/profile.js

const express = require('express'); // Or just use the Vercel req/res directly
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const { pool } = require('../db');
require('dotenv').config();

// Define sessionMiddleware configuration (as above)
const sessionMiddleware = session({...});

module.exports = async (req, res) => {
    // Apply middleware manually at the start of the handler
    sessionMiddleware(req, res, async (err) => {
        if (err) { return res.status(500).send('Session error'); }

        // Now req.session is available
        if (!req.session.userId) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        // ... rest of the API logic ...
        // Example: const profile = await db.getUserProfile(req.session.userId);
        // res.json(profile);
    });
};
*/