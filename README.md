# $COCO - The Pink Ostrich of AVAX

A memecoin website featuring DeFi integration, arcade games, and community features built for the Avalanche blockchain.

## 🚀 Features

### Main Website
- **Modern Design**: Beautiful pink COCO branding with gradient backgrounds
- **Arena.social Integration**: Launch platform integration (replacing presale)
- **DeFi Guides**: Step-by-step integration tutorials
- **Community Hub**: Social media links and engagement features
- **Responsive Design**: Optimized for desktop, tablet, and mobile

### 🎮 Arcade System
- **COCO Run**: Endless runner game with obstacle avoidance
- **Flappy COCO**: Bird-style flying game with pipes
- **Professional UI**: Game selection and navigation interface
- **Cross-platform**: Works on all devices

### 🏆 Leaderboard System
- **Real-time Tracking**: Live score updates for both games
- **Top 10 Rankings**: Gold, silver, bronze styling for top players
- **Personal Bests**: Individual progress tracking
- **Local Storage**: Persistent score saving
- **Tab Interface**: Switch between game leaderboards

## 🛠️ Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Animations**: GSAP, Custom CSS animations
- **Games**: HTML5 Canvas, JavaScript game engines
- **Storage**: LocalStorage for score persistence
- **Deployment**: Vercel-ready static site

## 📁 Project Structure

```
/
├── index.html              # Homepage
├── arcade.html             # Game selection page
├── leaderboard.html        # Score tracking page
├── meme-gallery.html       # Meme collection page
├── css/
│   ├── style.css          # Main styles
│   ├── animations.css     # Animation effects
│   └── responsive.css     # Mobile responsiveness
├── js/
│   ├── main.js           # Core functionality
│   ├── animations.js     # Animation controllers
│   └── games.js          # Game integration
├── images/               # Website assets
├── FlappyCOCO_Game/     # Flappy COCO game files
├── COCORun_Game/        # COCO Run game files
└── README.md            # This file
```

## 🎯 Games

### COCO Run
- **Objective**: Jump over obstacles and collect coins
- **Controls**: Spacebar or click to jump
- **Features**: Progressive difficulty, score tracking, leaderboard integration

### Flappy COCO
- **Objective**: Navigate through pipe gaps
- **Controls**: Spacebar or click to flap
- **Features**: Physics-based gameplay, collision detection, score submission

## 🏆 Leaderboard Features

- **Automatic Score Submission**: Games automatically save high scores
- **Player Names**: Custom name entry for leaderboard entries
- **Persistent Storage**: Scores saved locally in browser
- **Top Rankings**: Display of highest scores with special styling
- **Personal Progress**: Track individual improvement over time

## 🚀 Deployment

This website is optimized for Vercel deployment:

1. **Connect Repository**: Link your GitHub repo to Vercel
2. **Auto-Deploy**: Automatic deployments on push to main branch
3. **Custom Domain**: Configure your domain (e.g., avaxcoco.com)
4. **Performance**: Optimized static site generation

## 🎨 Customization

### Colors
The website uses CSS custom properties for easy theming:
- `--primary-color`: #FF1493 (Vibrant Pink)
- `--secondary-color`: #8A2BE2 (Deep Purple)
- `--accent-color`: #2AAA8A (Jungle Green)

### Animations
- GSAP-powered smooth animations
- Custom CSS keyframe animations
- Scroll-triggered reveals
- Interactive hover effects

## 🔧 Development

### Local Development
1. Clone the repository
2. Open `index.html` in a web browser
3. Or use a local server: `python -m http.server 8000`

### Adding New Games
1. Create game folder in root directory
2. Include `index.html` and `game.js`
3. Add game card to `arcade.html`
4. Integrate with leaderboard system

## 📱 Browser Support

- **Modern Browsers**: Chrome, Firefox, Safari, Edge
- **Mobile**: iOS Safari, Chrome Mobile, Samsung Internet
- **Features**: HTML5 Canvas, LocalStorage, CSS Grid/Flexbox

## 🎮 Game Integration

Games automatically integrate with the leaderboard system:

```javascript
// Score submission example
function submitScore() {
    const playerName = prompt("Enter your name:");
    addScore('game-id', playerName, score);
}
```

## 🌟 Community

- **Website**: [avaxcoco.com](https://avaxcoco.com)
- **Twitter**: [@AvaxCOCO](https://twitter.com/AvaxCOCO)
- **Telegram**: [COCO Community](https://t.me/avaxcoco)

## 📄 License

This project is open source and available under the MIT License.

---

**$COCO - The Pink Ostrich of AVAX** 🦩🚀
