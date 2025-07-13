# Admin Guide - Leaderboard Management

## Clear Leaderboard Endpoint

The admin endpoint allows you to clear leaderboard entries when needed.

### Endpoint
`POST /api/admin/clear-leaderboard`

### Authentication
Requires an admin key set in Vercel environment variables as `ADMIN_KEY`.

### Usage Examples

#### 1. Clear Specific Game Leaderboard

**Using curl:**
```bash
# Clear COCO Run leaderboard
curl -X POST https://your-domain.vercel.app/api/admin/clear-leaderboard \
  -H "Content-Type: application/json" \
  -H "x-admin-key: YOUR_ADMIN_KEY" \
  -d '{"game": "coco-run"}'

# Clear Flappy COCO leaderboard
curl -X POST https://your-domain.vercel.app/api/admin/clear-leaderboard \
  -H "Content-Type: application/json" \
  -H "x-admin-key: YOUR_ADMIN_KEY" \
  -d '{"game": "flappy-coco"}'
```

**Using JavaScript/Fetch:**
```javascript
// Clear COCO Run leaderboard
fetch('/api/admin/clear-leaderboard', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-admin-key': 'YOUR_ADMIN_KEY'
  },
  body: JSON.stringify({
    game: 'coco-run'
  })
});
```

#### 2. Clear All Leaderboards

**Using curl:**
```bash
curl -X POST https://your-domain.vercel.app/api/admin/clear-leaderboard \
  -H "Content-Type: application/json" \
  -H "x-admin-key: YOUR_ADMIN_KEY" \
  -d '{"clearAll": true}'
```

**Using JavaScript/Fetch:**
```javascript
// Clear all leaderboards
fetch('/api/admin/clear-leaderboard', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-admin-key': 'YOUR_ADMIN_KEY'
  },
  body: JSON.stringify({
    clearAll: true
  })
});
```

### Setup Instructions

1. **Set Admin Key in Vercel:**
   - Go to your Vercel dashboard
   - Navigate to your project settings
   - Go to Environment Variables
   - Add a new variable:
     - Name: `ADMIN_KEY`
     - Value: `your-secure-admin-key-here`
   - Redeploy your application

2. **Security Notes:**
   - Keep your admin key secure and private
   - Use a strong, random admin key
   - Only share with trusted administrators
   - Consider rotating the key periodically

### Response Examples

**Success Response:**
```json
{
  "message": "Successfully cleared coco-run leaderboard",
  "deletedScores": 15
}
```

**Error Responses:**
```json
// Unauthorized
{
  "error": "Unauthorized - Invalid admin key"
}

// Invalid game
{
  "error": "Invalid game specified"
}

// Missing parameters
{
  "error": "Must specify either \"game\" (coco-run or flappy-coco) or \"clearAll\": true"
}
```

### Valid Game Names
- `coco-run` - COCO Run platformer game
- `flappy-coco` - Flappy COCO game

### Use Cases
- **Season Reset:** Clear leaderboards at the start of new competitive seasons
- **Testing:** Clear test data during development
- **Maintenance:** Remove invalid or problematic entries
- **Fresh Start:** Reset leaderboards for special events or competitions
