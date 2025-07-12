# 🚀 Deployment Guide for $COCO Website

This guide will help you deploy your new $COCO website to replace your current deployment at `www.avaxcoco.com`.

## 📋 Prerequisites

- GitHub account
- Vercel account (connected to GitHub)
- Access to your domain settings

## 🔧 Step 1: Create New GitHub Repository

### Option A: Using GitHub Web Interface

1. **Go to GitHub**: Visit [github.com](https://github.com)
2. **Create Repository**: Click the "+" icon → "New repository"
3. **Repository Settings**:
   - **Repository name**: `website` (to match your existing repo structure)
   - **Description**: `$COCO - The Pink Ostrich of AVAX - Official Website`
   - **Visibility**: Public
   - **Initialize**: ✅ Add a README file
   - **Add .gitignore**: None (we have our own)
   - **Choose a license**: MIT License (optional)

4. **Create Repository**: Click "Create repository"

### Option B: Using Git Commands

```bash
# Navigate to your project directory
cd "c:/Users/rhysc/OneDrive/Documents/$COCO New"

# Initialize git repository
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: $COCO website with arcade and leaderboard"

# Add remote origin (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/website.git

# Push to GitHub
git branch -M main
git push -u origin main
```

## 🌐 Step 2: Deploy to Vercel

### Method 1: Vercel Dashboard (Recommended)

1. **Login to Vercel**: Go to [vercel.com](https://vercel.com) and sign in
2. **Import Project**: Click "New Project" → "Import Git Repository"
3. **Select Repository**: Choose your new `website` repository
4. **Configure Project**:
   - **Project Name**: `coco-website`
   - **Framework Preset**: Other
   - **Root Directory**: `./` (default)
   - **Build Command**: Leave empty (static site)
   - **Output Directory**: Leave empty
   - **Install Command**: Leave empty

5. **Deploy**: Click "Deploy"

### Method 2: Vercel CLI

```bash
# Install Vercel CLI (if not already installed)
npm i -g vercel

# Navigate to project directory
cd "c:/Users/rhysc/OneDrive/Documents/$COCO New"

# Deploy to Vercel
vercel

# Follow the prompts:
# - Set up and deploy? Y
# - Which scope? (select your account)
# - Link to existing project? N
# - Project name: coco-website
# - In which directory is your code located? ./
```

## 🔗 Step 3: Configure Custom Domain

### Update Domain Settings

1. **Vercel Dashboard**: Go to your project → Settings → Domains
2. **Add Domain**: Enter `www.avaxcoco.com`
3. **DNS Configuration**: Update your DNS settings:

```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

4. **Root Domain** (optional): Add `avaxcoco.com`
   - **DNS A Record**:
   ```
   Type: A
   Name: @
   Value: 76.76.19.61
   ```

### Verify Domain

- Wait for DNS propagation (can take up to 48 hours)
- Vercel will automatically issue SSL certificates
- Your site will be available at `https://www.avaxcoco.com`

## 🔄 Step 4: Update Existing Repository (Optional)

If you want to replace your existing repository content:

1. **Backup Current Repo**: Download or clone your current repository
2. **Clear Repository**: Delete all files in your existing repo
3. **Upload New Files**: Upload all files from this new website
4. **Commit Changes**:
   ```bash
   git add .
   git commit -m "Major update: New website with arcade games and leaderboard"
   git push origin main
   ```

## ⚡ Step 5: Automatic Deployments

Once connected, Vercel will automatically deploy when you:
- Push to the `main` branch
- Merge pull requests
- Make changes through GitHub web interface

## 🧪 Testing Your Deployment

### Pre-deployment Checklist

- [ ] All images load correctly
- [ ] Navigation works between pages
- [ ] Games function properly
- [ ] Leaderboard saves scores
- [ ] Mobile responsiveness
- [ ] All links work
- [ ] No console errors

### Test URLs

After deployment, test these pages:
- `https://www.avaxcoco.com/` - Homepage
- `https://www.avaxcoco.com/arcade.html` - Games
- `https://www.avaxcoco.com/leaderboard.html` - Leaderboard
- `https://www.avaxcoco.com/meme-gallery.html` - Memes

## 🔧 Troubleshooting

### Common Issues

**404 Errors on Direct Links**
- Ensure `vercel.json` is properly configured
- Check that all HTML files are in the root directory

**Images Not Loading**
- Verify image paths are relative (no leading `/`)
- Check that images exist in the `images/` directory

**Games Not Working**
- Ensure all game assets are included
- Check browser console for JavaScript errors

**Domain Not Working**
- Verify DNS settings with your domain provider
- Wait for DNS propagation (up to 48 hours)
- Check Vercel domain configuration

### Performance Optimization

The included `vercel.json` provides:
- Static file caching (1 year)
- Security headers
- Clean URLs
- Optimized routing

## 📊 Monitoring

### Vercel Analytics

Enable analytics in your Vercel dashboard to track:
- Page views
- Performance metrics
- User engagement
- Error rates

### Custom Analytics

The website includes Google Analytics integration:
- Update the tracking ID in `js/main.js`
- Configure goals for game plays and leaderboard submissions

## 🎯 Next Steps

After successful deployment:

1. **Test Everything**: Thoroughly test all features
2. **Update Social Links**: Ensure all social media links are current
3. **SEO Optimization**: Update meta tags and descriptions
4. **Performance Monitoring**: Set up analytics and monitoring
5. **Community Announcement**: Announce the new website to your community

## 🆘 Support

If you encounter issues:

1. **Check Vercel Logs**: View deployment logs in Vercel dashboard
2. **GitHub Issues**: Check repository for any issues
3. **Vercel Documentation**: [vercel.com/docs](https://vercel.com/docs)
4. **Community Support**: Vercel Discord or GitHub Discussions

---

**Ready to launch your new $COCO website!** 🚀🦩
# Deployment timestamp: Sat, Jul 12, 2025  9:34:42 AM
