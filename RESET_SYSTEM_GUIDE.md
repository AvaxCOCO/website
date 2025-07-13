# 🕒 Weekly Leaderboard Reset System

## Overview
The $COCO Arcade features an automated weekly leaderboard reset system that creates exciting competition cycles and keeps the leaderboard fresh. The system resets every **Friday at 10:00 PM CST**.

## ⏰ Reset Schedule
- **Frequency**: Weekly
- **Day**: Friday
- **Time**: 10:00 PM CST (Central Standard Time)
- **UTC Time**: 3:00 AM Saturday (UTC)
- **Automation**: Vercel Cron Job

## 🎯 Features

### Frontend Features
- **Live Countdown Timer**: Shows days, hours, minutes, and seconds until next reset
- **Warning Notifications**: Alerts users when reset is less than 24 hours away
- **Automatic Refresh**: Page refreshes when reset occurs
- **Responsive Design**: Timer adapts to all screen sizes
- **Visual Indicators**: Color-coded warnings and status updates

### Backend Features
- **Score Archival**: All scores are saved before reset (no data loss)
- **Season Tracking**: Historical data for each competition period
- **Reset Logging**: Complete audit trail of all reset events
- **API Endpoints**: RESTful APIs for timer and reset management

## 📊 Database Schema

### leaderboard_archive
Stores historical scores from previous weeks:
```sql
- id: Primary key
- game: Game type (coco-run, flappy-coco)
- username: Player identifier
- score: Player's score
- level_reached: Level achieved (for COCO Run)
- play_time_seconds: Time spent playing
- player_name: Display name
- twitter_handle: X/Twitter username
- created_at: Original score timestamp
- archived_at: When score was archived
- reset_week: Week number for organization
```

### leaderboard_resets
Tracks reset events:
```sql
- id: Primary key
- reset_time: When reset occurred
- scores_archived: Number of scores archived
- created_at: Record creation time
```

### leaderboard_seasons
Season winners and statistics:
```sql
- id: Primary key
- season_number: Sequential season number
- start_date: Season start time
- end_date: Season end time
- total_players: Number of unique players
- total_games: Total games played
- coco_run_winner: COCO Run champion
- coco_run_high_score: Winning COCO Run score
- flappy_coco_winner: Flappy COCO champion
- flappy_coco_high_score: Winning Flappy COCO score
```

## 🔧 API Endpoints

### GET /api/reset-timer
Returns countdown information:
```json
{
  "next_reset": "2025-01-17T03:00:00.000Z",
  "last_reset": "2025-01-10T03:00:00.000Z",
  "time_until_reset": {
    "total_milliseconds": 432000000,
    "days": 5,
    "hours": 0,
    "minutes": 0,
    "seconds": 0
  },
  "reset_schedule": "Every Friday at 10:00 PM CST",
  "current_time": "2025-01-12T03:00:00.000Z"
}
```

### POST /api/admin/reset-leaderboard
Manually trigger a reset (admin only):
```json
{
  "success": true,
  "message": "Leaderboard reset successfully",
  "reset_time": "2025-01-12T03:00:00.000Z"
}
```

### POST /api/init-reset-tables
Initialize database tables for reset system:
```json
{
  "success": true,
  "message": "Reset tables initialized successfully",
  "tables_created": [
    "leaderboard_archive",
    "leaderboard_resets",
    "leaderboard_seasons"
  ]
}
```

## ⚙️ Automation Setup

### Vercel Cron Job
The system uses Vercel's cron functionality configured in `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/admin/reset-leaderboard",
      "schedule": "0 3 * * 6"
    }
  ]
}
```

**Cron Schedule Explanation**:
- `0 3 * * 6` = At 3:00 AM UTC on Saturday (10:00 PM CST Friday)
- `0` = 0 minutes
- `3` = 3rd hour (3 AM UTC)
- `*` = Every day of month
- `*` = Every month
- `6` = Saturday (0=Sunday, 6=Saturday)

## 🎮 User Experience

### Before Reset (Normal Operation)
- Countdown timer shows time remaining
- Players compete for weekly high scores
- Leaderboard updates in real-time

### 24 Hours Before Reset
- Warning notification appears
- Timer background changes to amber
- "Get your high scores in now!" message

### During Reset
- Scores are archived automatically
- Current leaderboard is cleared
- Season winners are recorded
- Reset event is logged

### After Reset
- Fresh leaderboard for new week
- Countdown timer resets to next Friday
- Previous week's data preserved in archive
- New competition cycle begins

## 🏆 Competition Cycles

### Weekly Champions
Each week produces champions in both games:
- **COCO Run Champion**: Highest score in platformer game
- **Flappy COCO Champion**: Highest score in flying game

### Season Statistics
- Total unique players per week
- Total games played
- Average scores
- Participation trends

### Historical Data
- All scores preserved permanently
- Searchable by week/season
- Player progression tracking
- Long-term statistics

## 🔒 Security & Reliability

### Data Protection
- No score data is ever lost
- Complete backup before each reset
- Audit trail for all operations
- Error handling and recovery

### Failsafe Mechanisms
- Fallback timer calculation if API fails
- Manual reset capability for emergencies
- Database transaction safety
- Rollback capabilities

### Monitoring
- Reset event logging
- Error tracking and alerts
- Performance monitoring
- User experience metrics

## 🚀 Benefits

### For Players
- **Fresh Competition**: New chances to be #1 every week
- **Achievable Goals**: Weekly cycles feel more attainable
- **Excitement**: Countdown creates urgency and engagement
- **Fair Play**: Everyone starts equal each week

### For Community
- **Regular Engagement**: Weekly reset drives return visits
- **Social Sharing**: Weekly champions get recognition
- **Competition**: Healthy rivalry between players
- **Growth**: New players can compete immediately

### For Platform
- **User Retention**: Weekly cycles encourage regular play
- **Data Insights**: Rich analytics on player behavior
- **Scalability**: System handles growth automatically
- **Maintenance**: Fresh start prevents data bloat

## 📈 Future Enhancements

### Planned Features
- **Season Leaderboards**: View historical champions
- **Player Profiles**: Individual statistics and achievements
- **Notifications**: Email/push alerts for reset warnings
- **Rewards**: NFTs or tokens for weekly champions
- **Tournaments**: Special event competitions

### Technical Improvements
- **Real-time Updates**: WebSocket connections for live updates
- **Advanced Analytics**: Detailed player behavior tracking
- **Mobile App**: Dedicated mobile application
- **API Expansion**: More endpoints for third-party integrations

## 🛠️ Maintenance

### Regular Tasks
- Monitor reset execution
- Check database performance
- Review error logs
- Update documentation

### Emergency Procedures
- Manual reset if automation fails
- Database recovery procedures
- Communication with users
- System status updates

---

*This reset system ensures fair, exciting, and engaging competition for all $COCO Arcade players while maintaining data integrity and providing rich historical insights.*
