# Setting Up X Webhooks for $COCO Activity Tracking

This guide explains how to set up X (Twitter) webhooks to track user activities related to $COCO.

## Overview

X webhooks allow your application to receive real-time updates when users interact with content related to $COCO. This includes:

- Tweets mentioning $COCO
- Retweets of $COCO content
- Likes of $COCO content

By tracking these activities, you can award points to users and build a more engaging leaderboard.

## Prerequisites

1. X Developer Account with Elevated Access
2. X API v2 Project with OAuth 2.0 configured
3. Your $COCO website deployed on Vercel

## Step 1: Create a Webhook in the X Developer Portal

1. Log in to the [X Developer Portal](https://developer.twitter.com/en/portal/dashboard)
2. Navigate to your project
3. Click on "Project Settings"
4. Scroll down to "Webhooks"
5. Click "Set up a webhook"
6. Enter your webhook URL: `https://yourdomain.com/api/webhook/x-activity`
7. Click "Save"

## Step 2: Subscribe to Events

1. In the webhook settings, click "Manage subscriptions"
2. Subscribe to the following events:
   - `tweet_create_events` - Notifies when users create tweets
   - `favorite_events` - Notifies when users like tweets
   - `retweet_events` - Notifies when users retweet content

## Step 3: Set Environment Variables in Vercel

Add the following environment variables to your Vercel project:

1. `X_CONSUMER_SECRET` - Your X API consumer secret (used for CRC validation)
2. `X_BEARER_TOKEN` - Your X API bearer token (used for the scheduled search)
3. `CRON_SECRET` - A random string to secure your cron endpoint

## Step 4: Test the Webhook

1. In the X Developer Portal, click "Send test event"
2. Select an event type (e.g., `tweet_create_events`)
3. Check your Vercel logs to confirm the webhook received the event

## Step 5: Verify CRC Validation

X will periodically send Challenge-Response Checks (CRC) to verify your webhook endpoint. The webhook implementation already handles this, but you should monitor your logs to ensure it's working correctly.

## Understanding the Implementation

### Webhook Endpoint

The webhook endpoint (`api/webhook/x-activity.js`) processes incoming events from X:

1. Verifies the request is from X
2. Processes different types of activities:
   - Tweets mentioning $COCO
   - Retweets of $COCO content
   - Likes of $COCO content
3. Awards points based on the activity type:
   - 10 points for tweets
   - 5 points for retweets
   - 2 points for likes

### Scheduled Search

In addition to the webhook, a scheduled function (`api/cron/search-x-mentions.js`) runs hourly to search for $COCO mentions that might have been missed by the webhook:

1. Searches for tweets containing $COCO, #COCO, etc.
2. Processes any new mentions
3. Awards points for these activities

This dual approach ensures comprehensive tracking of $COCO-related activities.

## Point System

The current point system is:

| Activity | Points |
|----------|--------|
| Tweet mentioning $COCO | 10 |
| Retweet of $COCO content | 5 |
| Like of $COCO content | 2 |

You can adjust these values in the webhook and scheduled search implementations.

## Monitoring and Troubleshooting

### Monitoring Webhook Activity

1. Check your Vercel logs for webhook events
2. Monitor the `activities` table in your Neon database
3. Watch the leaderboard for updates

### Common Issues

1. **Webhook not receiving events**:
   - Verify the webhook URL is correct
   - Check that you've subscribed to the right events
   - Ensure your X API credentials are valid

2. **CRC validation failing**:
   - Verify your `X_CONSUMER_SECRET` environment variable

3. **Points not being awarded**:
   - Check the database connection
   - Verify the user record is being created
   - Check for errors in the activity processing functions

## Next Steps

1. **Refine the point system** - Adjust point values based on engagement
2. **Add more activity types** - Track additional X interactions
3. **Create an admin dashboard** - Monitor and manage activities
4. **Implement anti-spam measures** - Prevent abuse of the point system

By following this guide, you'll have a fully functional X webhook that tracks user activities and awards points for the $COCO leaderboard.