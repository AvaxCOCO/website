# Deploying $COCO Website with X Authentication to Vercel

This guide walks you through the process of deploying your $COCO website with X authentication to Vercel.

## Prerequisites

1. A [Vercel account](https://vercel.com/signup)
2. [Git](https://git-scm.com/downloads) installed on your computer
3. [Node.js](https://nodejs.org/) (version 14 or higher) installed
4. X Developer account with API credentials

## Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

## Step 2: Login to Vercel

```bash
vercel login
```

Follow the prompts to log in to your Vercel account.

## Step 3: Prepare Your Environment Variables

Create a `.env` file in your project root with your X API credentials:

```
# X API Credentials
X_CLIENT_ID=your_x_client_id
X_CLIENT_SECRET=your_x_client_secret

# Server Configuration
PORT=3000
NODE_ENV=production

# Redirect URIs
REDIRECT_URI_LOCAL=http://localhost:3000/callback.html
REDIRECT_URI_VERCEL=https://avaxcoco.vercel.app/callback.html
REDIRECT_URI_PROD=https://avaxcoco.com/callback.html
REDIRECT_URI_PROD_WWW=https://www.avaxcoco.com/callback.html
```

## Step 4: Update X Developer Portal Settings

1. Log in to the [X Developer Portal](https://developer.twitter.com/)
2. Navigate to your project and app
3. Update the callback URLs to include:
   - `https://avaxcoco.vercel.app/callback.html` (for Vercel preview)
   - `https://avaxcoco.com/callback.html` (for production)
   - `https://www.avaxcoco.com/callback.html` (for production with www)

## Step 5: Deploy to Vercel

### Option 1: Deploy from CLI

Run the following command in your project directory:

```bash
vercel --prod
```

Follow the prompts to configure your project. When asked about environment variables, you can either:
- Enter them manually during the deployment process
- Use the Vercel dashboard to add them after deployment

### Option 2: Deploy from GitHub

1. Push your code to a GitHub repository
2. Log in to the [Vercel Dashboard](https://vercel.com/dashboard)
3. Click "New Project"
4. Import your GitHub repository
5. Configure the project:
   - Framework Preset: Other
   - Root Directory: ./
   - Build Command: (leave empty)
   - Output Directory: ./
6. Add environment variables from your `.env` file
7. Click "Deploy"

## Step 6: Configure Environment Variables in Vercel

If you didn't add environment variables during deployment:

1. Go to your project in the Vercel dashboard
2. Click on "Settings" > "Environment Variables"
3. Add all the variables from your `.env` file
4. Click "Save"
5. Redeploy your project for the changes to take effect

## Step 7: Test Your Deployment

1. Visit your deployed site (e.g., `https://avaxcoco.vercel.app`)
2. Navigate to the leaderboard page
3. Test the X authentication flow
4. Verify that user data is displayed correctly

## Step 8: Set Up a Custom Domain (Optional)

1. In the Vercel dashboard, go to your project
2. Click on "Settings" > "Domains"
3. Add your custom domain (e.g., `avaxcoco.com`)
4. Follow the instructions to configure your DNS settings

## Troubleshooting

### Authentication Issues

If you encounter authentication issues:

1. Check the browser console for errors
2. Verify that your environment variables are set correctly in Vercel
3. Ensure your callback URLs are registered in the X Developer Portal
4. Check that your X API credentials are valid

### API Route Issues

If your API routes aren't working:

1. Check the Vercel function logs in the dashboard
2. Verify that your `vercel.json` file is configured correctly
3. Ensure your API routes are properly structured

### CORS Issues

If you encounter CORS issues:

1. Check that your API routes include the proper CORS headers
2. Verify that your client-side code is using the correct API base URL

## Continuous Deployment

Vercel automatically deploys your site when you push changes to your connected GitHub repository. To manually trigger a deployment:

```bash
vercel --prod
```

## Local Development

To test your site locally before deploying:

```bash
vercel dev
```

This will start a local development server that mimics the Vercel production environment.