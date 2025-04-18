// api/_middleware/session.js
// IMPORTANT: Vercel might handle middleware differently, especially with file-based routing.
// If this global approach doesn't work, you'll need to apply session middleware
// within each individual API route file that requires session access.

// Use the official 'redis' package (v4+)
const { createClient } = require('redis');
const session = require('express-session');
const RedisStore = require('connect-redis').default; // connect-redis v7+ supports redis v4 clients
require('dotenv').config(); // Ensure env vars are loaded

// Initialize client.
const redisClient = createClient({
    url: process.env.REDIS_URL // Use the connection string
});
redisClient.on('error', (err) => console.error('Redis Client Error:', err));

// Create a promise that resolves once connected.
// We connect here so the connection is established reuse across function invocations (within limits)
const redisConnectPromise = redisClient.connect().catch(err => {
    console.error('Failed to connect to Redis:', err);
    // Exit or handle critical failure if Redis is essential for startup
    process.exit(1); // Or throw error to prevent middleware setup
});

// Variable to hold the configured session middleware
let sessionMiddlewareInstance;

// Async function to initialize the middleware once Redis is connected
async function initializeSessionMiddleware() {
    if (sessionMiddlewareInstance) return sessionMiddlewareInstance;

    await redisConnectPromise; // Wait for the connection to be established
    console.log('Redis client connected successfully.');

    sessionMiddlewareInstance = session({
        store: new RedisStore({
            client: redisClient,
            // Optional: prefix for session keys in Redis
            // prefix: "myapp:session:",
        }),
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: process.env.NODE_ENV === 'production',
            httpOnly: true,
            maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
            sameSite: 'lax'
        }
    });
    return sessionMiddlewareInstance;
}

// Export middleware function for Vercel
module.exports = async (req, res, next) => {
    try {
        // Ensure secret is set
        if (!process.env.SESSION_SECRET) {
            console.error("\n!!! FATAL ERROR: SESSION_SECRET environment variable is not set. Sessions will not be secure. !!!\n");
            // Stop processing if the secret is missing
            return res.status(500).json({ error: 'Server configuration error: Session secret missing.' });
        }

        // Get or initialize the session middleware instance
        const middleware = await initializeSessionMiddleware();

        // Apply the actual session middleware logic
        middleware(req, res, (err) => {
            if (err) {
                console.error("Session middleware execution error:", err);
                // Handle error appropriately
                // Avoid sending response if headers already sent
                if (!res.headersSent) {
                    return res.status(500).json({ error: 'Session initialization/handling error.' });
                }
                return; // Stop further processing if error occurs
            }
            // If session middleware initializes without error, proceed
            next();
        });
    } catch (initError) {
        console.error("Failed to initialize session middleware:", initError);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Failed to initialize session infrastructure.' });
        }
    }
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