# $COCO Leaderboard Backend API

A Node.js/Express backend API for the $COCO arcade leaderboard system with Neon PostgreSQL database integration and Twitter functionality.

## 🚀 Features

- **PostgreSQL Integration**: Uses Neon PostgreSQL for persistent leaderboard storage
- **Twitter Integration**: Links player scores to Twitter handles for social sharing
- **RESTful API**: Clean endpoints for score submission and leaderboard retrieval
- **Security**: Rate limiting, CORS protection, input validation
- **Scalable**: Designed for production deployment

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Neon PostgreSQL database (already configured)

## 🛠️ Installation

1. **Install dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Environment Setup:**
   The `.env` file is already configured with your Neon database credentials.

3. **Initialize Database:**
   ```bash
   npm run init-db
   ```
   This creates the necessary tables and indexes in your Neon database.

## 🎮 Running the Server

### Development Mode
```bash
npm run dev
```
Server runs on `http://localhost:3001` with auto-restart on file changes.

### Production Mode
```bash
npm start
```

## 📊 Database Schema

### Tables Created:
- **players**: User accounts with Twitter integration
- **games**: Game definitions (COCO Run, Flappy COCO)
- **scores**: Leaderboard entries with player/game relationships

### Indexes:
- Optimized for fast leaderboard queries
- Twitter handle lookups
- Player-specific score retrieval

## 🔗 API Endpoints

### Health Check
```
GET /health
```
Returns server status and timestamp.

### Leaderboards
```
GET /api/leaderboard/:game?limit=10
```
Get top scores for a specific game.
- **Games**: `coco-run`, `flappy-coco`
- **Limit**: 1-100 entries (default: 10)

### Personal Bests
```
GET /api/player/:username/best
```
Get a player's best scores across all games.

### Submit Score
```
POST /api/score
```
Submit a new score to the leaderboard.

**Body:**
```json
{
  "game": "coco-run",
  "score": 1500,
  "level_reached": 3,
  "play_time_seconds": 120,
  "player_name": "PlayerName",
  "twitter_handle": "TwitterHandle"
}
```

### Statistics
```
GET /api/stats
```
Get overall leaderboard statistics.

## 🔒 Security Features

- **Rate Limiting**: 100 requests per 15 minutes per IP
- **CORS Protection**: Configured for your domains
- **Input Validation**: Joi schema validation
- **SQL Injection Protection**: Parameterized queries

## 🌐 CORS Configuration

Allowed origins:
- `http://localhost:3000`
- `http://127.0.0.1:3000`
- `https://avaxcoco.com`
- `https://www.avaxcoco.com`
- `file://` (for local development)

## 📈 Monitoring

### Health Check
Monitor server health at `/health` endpoint.

### Logs
- Server startup information
- Database connection status
- Error logging for debugging

## 🚀 Deployment

### Environment Variables for Production:
```bash
NODE_ENV=production
PORT=3001
ALLOWED_ORIGINS=https://avaxcoco.com,https://www.avaxcoco.com
```

### Recommended Deployment Platforms:
- **Vercel**: Serverless deployment
- **Railway**: Container deployment
- **Heroku**: Traditional hosting
- **DigitalOcean App Platform**: Managed containers

## 🔧 Configuration

### Rate Limiting
Adjust in `.env`:
```
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100  # Max requests per window
```

### Database Connection
Your Neon PostgreSQL is already configured. Connection details in `.env`.

## 📝 API Response Examples

### Leaderboard Response:
```json
{
  "game": "coco-run",
  "leaderboard": [
    {
      "rank": 1,
      "username": "PlayerName",
      "twitter_handle": "TwitterHandle",
      "score": 1500,
      "level_reached": 3,
      "created_at": "2025-01-12T10:30:00Z"
    }
  ],
  "total_entries": 1
}
```

### Score Submission Response:
```json
{
  "success": true,
  "score_id": 123,
  "rank": 5,
  "message": "Score submitted successfully!"
}
```

## 🐛 Troubleshooting

### Database Connection Issues:
1. Verify Neon database is active
2. Check `.env` credentials
3. Ensure database is initialized (`npm run init-db`)

### CORS Errors:
1. Add your domain to `ALLOWED_ORIGINS` in `.env`
2. Restart the server

### Rate Limiting:
1. Check if you're exceeding 100 requests per 15 minutes
2. Adjust limits in `.env` if needed

## 📞 Support

For issues with the $COCO leaderboard backend:
1. Check server logs for error details
2. Verify database connectivity
3. Ensure all environment variables are set correctly

## 🎯 Next Steps

1. **Start the backend server**: `npm run dev`
2. **Test the API**: Use the health endpoint
3. **Connect frontend**: Update frontend to use `http://localhost:3001/api`
4. **Deploy**: Choose your preferred hosting platform

Your $COCO arcade now has a professional, scalable leaderboard system! 🎮🚀
