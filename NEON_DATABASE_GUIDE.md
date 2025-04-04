# Neon Database Integration for $COCO X Authentication

This guide explains how to set up and use Neon Serverless Postgres with your $COCO X authentication system.

## What is Neon?

Neon is a serverless Postgres database that scales automatically and is fully managed. It's perfect for projects like the $COCO leaderboard because:

1. It's serverless - no infrastructure to maintain
2. It scales automatically with your usage
3. It uses standard PostgreSQL, which is perfect for structured data
4. It integrates seamlessly with Vercel

## Step 1: Create a Neon Database in Vercel

1. Go to your Vercel dashboard
2. Navigate to "Storage" → "Create a database"
3. Select "Neon - Serverless Postgres"
4. Click "Create"
5. Follow the setup wizard to create your database
6. Save the connection string provided by Vercel

## Step 2: Set Up Database Schema

You can set up the database schema in two ways:

### Option 1: Using the Neon Console

1. Go to the Neon console (you can access it from Vercel)
2. Open the SQL Editor
3. Copy and paste the contents of `neon-schema.sql` into the editor
4. Run the SQL commands to create the tables and indexes

### Option 2: Using the Neon CLI

1. Install the Neon CLI: `npm install -g neonctl`
2. Log in to Neon: `neonctl auth`
3. Run the SQL file: `neonctl sql -f neon-schema.sql`

## Step 3: Add the Database Connection String to Vercel

1. Go to your project in the Vercel dashboard
2. Click on "Settings" > "Environment Variables"
3. Add a new variable:
   - Name: `POSTGRES_URL`
   - Value: (The connection string provided by Neon)
4. Click "Save"
5. Redeploy your project for the changes to take effect

## Step 4: Test the Integration

After deploying, you can test the integration:

1. Visit your leaderboard page
2. Connect your X account
3. Verify that your user data is stored in the database
4. Check that the leaderboard displays data from the database

## Database Schema

The database schema consists of three main tables:

### Users Table

Stores information about users who have connected their X accounts:

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  x_id VARCHAR(255) UNIQUE NOT NULL,
  handle VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  profile_image_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Activities Table

Tracks X activities related to $COCO:

```sql
CREATE TABLE activities (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  type VARCHAR(50) NOT NULL, -- 'tweet', 'retweet', 'like', etc.
  content TEXT,
  x_activity_id VARCHAR(255),
  points INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Points Table

Tracks user points and rankings:

```sql
CREATE TABLE points (
  user_id INTEGER REFERENCES users(id) PRIMARY KEY,
  total_points INTEGER DEFAULT 0,
  rank INTEGER,
  level VARCHAR(50) DEFAULT 'Beginner',
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## API Endpoints

The following API endpoints interact with the database:

### User Data Endpoint

`GET /api/auth/x/user`

Fetches user data from X and stores it in the database. Returns user profile and engagement data.

### Leaderboard Endpoint

`GET /api/leaderboard`

Fetches the leaderboard data from the database. Supports pagination with `limit` and `offset` query parameters.

## Monitoring and Management

You can monitor and manage your Neon database through the Vercel dashboard:

1. Go to your project in Vercel
2. Click on "Storage"
3. Select your Neon database
4. Click "View Dashboard" to access the Neon console

From the Neon console, you can:
- Monitor database performance
- Run SQL queries
- Manage tables and indexes
- Create backups
- Scale your database resources

## Next Steps

1. **Implement X Activity Tracking**: Create a webhook or scheduled function to fetch and record X activities
2. **Add Admin Dashboard**: Create an interface for managing users and activities
3. **Implement Point Rules**: Define and implement rules for awarding points based on different activities

## Troubleshooting

### Connection Issues

If you encounter connection issues:

1. Verify that the `POSTGRES_URL` environment variable is set correctly
2. Check that your IP is allowed in Neon's connection settings
3. Ensure that the database user has the necessary permissions

### Query Errors

If you encounter query errors:

1. Check the database schema to ensure tables and columns exist
2. Verify that your queries match the schema
3. Check for syntax errors in your SQL queries

### Performance Issues

If you encounter performance issues:

1. Add appropriate indexes to frequently queried columns
2. Optimize your queries to reduce database load
3. Consider scaling your Neon database resources