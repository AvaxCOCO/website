// --- Get Canvas and Context ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// --- Game Settings ---
const gravity = 0.4;
const flapStrength = -7;
const birdStartX = 100;
const obstacleSpeed = 2;
const gapSize = 150;
const obstacleSpawnRate = 120;
let groundSpeed = obstacleSpeed;
const effectiveGroundHeight = 50; // Adjust if needed
const minDistanceFromTop = 50;

// --- Image Loading (Fallback Mode) ---
let images = {};
let imagesLoaded = 0;

// Create fallback images using canvas
function createFallbackImages() {
    console.log("Creating fallback images for Flappy COCO...");
    
    // Create simple colored rectangles as fallback sprites
    const createColoredCanvas = (width, height, color) => {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, width, height);
        return canvas;
    };
    
    // Create text-based buttons
    const createTextButton = (text, width, height, bgColor, textColor) => {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        // Background
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, width, height);
        
        // Border
        ctx.strokeStyle = textColor;
        ctx.lineWidth = 2;
        ctx.strokeRect(1, 1, width-2, height-2);
        
        // Text
        ctx.fillStyle = textColor;
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, width/2, height/2);
        
        return canvas;
    };
    
    // Player sprites (pink ostrich bird)
    images.idle = createColoredCanvas(40, 40, '#FF69B4');
    images.flap = createColoredCanvas(40, 40, '#FF1493');
    images.fall = createColoredCanvas(40, 40, '#C71585');
    images.crash = createColoredCanvas(40, 40, '#8B0000');
    
    // UI elements
    images.startButton = createTextButton('START', 120, 40, '#2AAA8A', '#FFFFFF');
    images.tryAgainButton = createTextButton('TRY AGAIN', 120, 40, '#F44336', '#FFFFFF');
    
    // Banners
    images.gameOverBanner = createTextButton('GAME OVER', 300, 60, '#F44336', '#FFFFFF');
    images.title = createTextButton('FLAPPY $COCO', 400, 80, '#FF1493', '#FFFFFF');
    
    // Background
    const skyCanvas = document.createElement('canvas');
    skyCanvas.width = 800;
    skyCanvas.height = 600;
    const skyCtx = skyCanvas.getContext('2d');
    const gradient = skyCtx.createLinearGradient(0, 0, 0, 600);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(1, '#98FB98');
    skyCtx.fillStyle = gradient;
    skyCtx.fillRect(0, 0, 800, 600);
    images.sky = skyCanvas;
    
    // Ground
    const groundCanvas = document.createElement('canvas');
    groundCanvas.width = 800;
    groundCanvas.height = 50;
    const groundCtx = groundCanvas.getContext('2d');
    groundCtx.fillStyle = '#8B4513';
    groundCtx.fillRect(0, 0, 800, 50);
    images.ground = groundCanvas;
    
    // Obstacle (pipe)
    const obstacleCanvas = document.createElement('canvas');
    obstacleCanvas.width = 60;
    obstacleCanvas.height = 400;
    const obstacleCtx = obstacleCanvas.getContext('2d');
    obstacleCtx.fillStyle = '#32CD32';
    obstacleCtx.fillRect(0, 0, 60, 400);
    obstacleCtx.strokeStyle = '#228B22';
    obstacleCtx.lineWidth = 3;
    obstacleCtx.strokeRect(0, 0, 60, 400);
    images.obstacle = obstacleCanvas;
    
    // Numbers sprite sheet
    const numbersCanvas = document.createElement('canvas');
    numbersCanvas.width = 1050;
    numbersCanvas.height = 160;
    const numbersCtx = numbersCanvas.getContext('2d');
    numbersCtx.fillStyle = '#FFFFFF';
    numbersCtx.font = 'bold 120px Arial';
    numbersCtx.textBaseline = 'top';
    
    // Draw numbers 0-9 at their expected positions
    const numberPositions = [
        { x: 32, text: '0' }, { x: 145, text: '1' }, { x: 234, text: '2' },
        { x: 337, text: '3' }, { x: 434, text: '4' }, { x: 547, text: '5' },
        { x: 643, text: '6' }, { x: 744, text: '7' }, { x: 844, text: '8' }, { x: 948, text: '9' }
    ];
    
    numberPositions.forEach(pos => {
        numbersCtx.fillText(pos.text, pos.x, 6);
    });
    
    images.numbers = numbersCanvas;
    
    console.log("Fallback images for Flappy COCO created successfully!");
    return true;
}

// --- Number Sprite Data & Settings ---
const numberSpriteData = [
    { x: 32,   y: 6, w: 103, h: 149 }, { x: 145,  y: 6, w: 68,  h: 149 },
    { x: 234,  y: 5, w: 87,  h: 149 }, { x: 337,  y: 6, w: 87,  h: 149 },
    { x: 434,  y: 6, w: 97,  h: 149 }, { x: 547,  y: 6, w: 88,  h: 149 },
    { x: 643,  y: 3, w: 98,  h: 149 }, { x: 744,  y: 6, w: 87,  h: 149 },
    { x: 844,  y: 4, w: 96,  h: 149 }, { x: 948,  y: 4, w: 97,  h: 149 }
];
const numberDrawHeight = 72;
const numberSpacing = 4;
// --- End Number Sprite Data ---


// Initialize with fallback images immediately
console.log("Using fallback images for Flappy COCO game...");
if (createFallbackImages()) {
    console.log("Fallback images created successfully! Attempting initialization...");
    initializeGame();
} else {
    console.error("Failed to create fallback images!");
    gameState = 'criticalError';
}

// --- Game Variables ---
let playerY, playerVy, playerWidth, playerHeight;
let gameState; let frame = 0, score; let obstacles = [], groundX = 0;
let groundImageWidth = 0, obstacleWidth = 0, obstacleNaturalHeight = 0;
let startButtonArea = null, tryAgainButtonArea = null;
let gameOverBannerPos = { x:0, y:0, w:0, h:0 }; let gameOverScorePos = { x:0, y:0 };

// --- Utility Functions ---
function checkCollision(rect1, rect2) {
    if (!rect1 || !rect2 || rect1.width <= 0 || rect1.height <= 0 || rect2.width <= 0 || rect2.height <= 0) { return false; }
    return rect1.x < rect2.x + rect2.width && rect1.x + rect1.width > rect2.x && rect1.y < rect2.y + rect2.height && rect1.y + rect1.height > rect2.y;
}
function drawScore(scoreValue, drawX, drawY, align = 'left') {
    if (!images.numbers) return; let scoreStr = scoreValue.toString(); let currentDrawX = drawX; let digitDrawInfo = []; let totalScoreWidth = 0;
    for (let i = 0; i < scoreStr.length; i++) { let digit = parseInt(scoreStr[i]); let drawWidth = 0; if (digit >= 0 && digit <= 9) { let sprite = numberSpriteData[digit]; if (sprite && sprite.h > 0) { let aspectRatio = sprite.w / sprite.h; drawWidth = numberDrawHeight * aspectRatio; } } digitDrawInfo.push(drawWidth); totalScoreWidth += drawWidth; } totalScoreWidth += Math.max(0, scoreStr.length - 1) * numberSpacing;
    if (align === 'center') { currentDrawX = drawX - totalScoreWidth / 2; } else if (align === 'right') { currentDrawX = drawX - totalScoreWidth; }
    for (let i = 0; i < scoreStr.length; i++) { let digit = parseInt(scoreStr[i]); if (digit >= 0 && digit <= 9) { let sprite = numberSpriteData[digit]; let drawWidth = digitDrawInfo[i]; if (sprite && drawWidth > 0) { ctx.drawImage(images.numbers, sprite.x, sprite.y, sprite.w, sprite.h, currentDrawX, drawY, drawWidth, numberDrawHeight); currentDrawX += drawWidth + numberSpacing; } } }
}

// --- Initialization Function ---
function initializeGame() {
    if (!images.idle || !images.ground || !images.obstacle || !images.startButton || !images.tryAgainButton || !images.gameOverBanner || !images.sky || !images.numbers || !images.title) { /* Error Handling */ }

    gameState = 'start';
    playerY = canvas.height / 2.5; playerVy = 0; score = 0; frame = 0; obstacles = []; groundX = 0;

    playerWidth = images.idle.width; playerHeight = images.idle.height;
    groundImageWidth = images.ground.width; obstacleWidth = images.obstacle.width; obstacleNaturalHeight = images.obstacle.height;

    console.log(`--- InitializeGame ---`);

    // Calculate Game Over Banner Position & Size
    if (images.gameOverBanner.width > 0) {
         let bannerTargetWidth = canvas.width * 0.80;
         let bannerAspectRatio = images.gameOverBanner.height / images.gameOverBanner.width;
         gameOverBannerPos.w = bannerTargetWidth;
         gameOverBannerPos.h = bannerTargetWidth * bannerAspectRatio;
         gameOverBannerPos.x = canvas.width / 2 - gameOverBannerPos.w / 2;
         gameOverBannerPos.y = Math.max(10, (canvas.height / 4) - gameOverBannerPos.h / 2);
    } else { /* Fallback */ }

    // Calculate Score position BELOW banner
    gameOverScorePos.x = canvas.width / 2; // Centered horizontally
    gameOverScorePos.y = gameOverBannerPos.y + gameOverBannerPos.h + 5; // Below banner + 5px gap

    // Calculate Try Again Button position BELOW score
    tryAgainButtonArea = {
        x: canvas.width / 2 - images.tryAgainButton.width / 2,
        y: gameOverScorePos.y + numberDrawHeight + 5, // Below score + 5px gap
        width: images.tryAgainButton.width,
        height: images.tryAgainButton.height
    };

    // Start Button position
    startButtonArea = { x: 0, y: 0, width: images.startButton.width, height: images.startButton.height };


    if (!canvas.hasInputListener) { canvas.addEventListener('mousedown', handleInput); canvas.hasInputListener = true; }

    if (playerHeight > 0 && effectiveGroundHeight > 0 && obstacleWidth > 0 && obstacleNaturalHeight > 0) {
         if(gameState !== 'criticalError' && !canvas.gameLoopRunning) { console.log("Starting game loop..."); gameLoop(); canvas.gameLoopRunning = true; }
    } else { /* Error handling */ }
}


// --- Input Handling ---
function handleInput(event) {
    const rect = canvas.getBoundingClientRect(); const clickX = event.clientX - rect.left; const clickY = event.clientY - rect.top;
    if (gameState === 'playing') { playerVy = flapStrength; }
    else if (gameState === 'start' && startButtonArea) { if (checkCollision({x: clickX, y: clickY, width:1, height:1}, startButtonArea)) { obstacles = []; playerY = canvas.height / 2.5; playerVy = flapStrength; score = 0; frame = 0; gameState = 'playing'; if (!canvas.gameLoopRunning) { gameLoop(); canvas.gameLoopRunning = true;} } }
    else if (gameState === 'gameOver' && tryAgainButtonArea) { if (checkCollision({x: clickX, y: clickY, width:1, height:1}, tryAgainButtonArea)) { obstacles = []; playerY = canvas.height / 2.5; playerVy = 0; score = 0; frame = 0; gameState = 'start'; if (!canvas.gameLoopRunning) { gameLoop(); canvas.gameLoopRunning = true;} } }
}

// --- Game Loop ---
let lastFrameTime = 0;

function gameLoop(currentTime) {
     if (gameState === 'criticalError'){ canvas.gameLoopRunning = false; return; }
     canvas.gameLoopRunning = true;
     ctx.clearRect(0, 0, canvas.width, canvas.height); if (images.sky) { ctx.drawImage(images.sky, 0, 0, canvas.width, canvas.height); } else { ctx.fillStyle = '#afeeee'; ctx.fillRect(0, 0, canvas.width, canvas.height); }
     if (gameState === 'playing') {
         frame++;
         playerVy += gravity;
         playerY += playerVy;

         let isGameOver = false;

         // Check ground collision
         if (playerY + playerHeight > canvas.height - effectiveGroundHeight) {
             playerY = canvas.height - effectiveGroundHeight - playerHeight;
             playerVy = 0;
             isGameOver = true;
             console.log("Game Over! Hit ground. Final Score:", score);
         }
         // Check ceiling collision
         if (playerY < 0) {
             playerY = 0;
             playerVy = 0;
             // isGameOver = true; // Optional
         }

         // Spawn obstacles
         if (frame % obstacleSpawnRate === 0) {
             let minGapY = gapSize / 2 + minDistanceFromTop;
             let maxGapY = canvas.height - effectiveGroundHeight - gapSize / 2 - 50;
             if (maxGapY <= minGapY) { maxGapY = minGapY + 50; }
             let gapCenterY = Math.random() * (maxGapY - minGapY) + minGapY;
             obstacles.push({ x: canvas.width, gapY: gapCenterY, passed: false });
         }

         // Move obstacles
         for (let i = obstacles.length - 1; i >= 0; i--) {
             obstacles[i].x -= obstacleSpeed;
             if (obstacles[i].x + obstacleWidth < 0) {
                 obstacles.splice(i, 1);
             }
         }

         // Move ground
         groundX -= groundSpeed;
         if (images.ground && groundImageWidth > 0 && groundX <= -groundImageWidth) {
             groundX = 0;
         }

         // Check obstacle collision and score
         let playerRect = { x: birdStartX, y: playerY, width: playerWidth, height: playerHeight };
         for (let i = 0; i < obstacles.length; i++) {
             let obs = obstacles[i];
             if (obstacleWidth <= 0 || effectiveGroundHeight <= 0) continue;

             let topPipeBottomY = obs.gapY - gapSize / 2;
             let bottomPipeTopY = obs.gapY + gapSize / 2;
             let requiredBottomPipeHeight = Math.max(0, (canvas.height - effectiveGroundHeight) - bottomPipeTopY);
             let requiredTopPipeHeight = Math.max(0, topPipeBottomY);
             let topPipeRect = { x: obs.x, y: 0, width: obstacleWidth, height: requiredTopPipeHeight };
             let bottomPipeRect = { x: obs.x, y: bottomPipeTopY, width: obstacleWidth, height: requiredBottomPipeHeight };

             if (!isGameOver && (checkCollision(playerRect, topPipeRect) || checkCollision(playerRect, bottomPipeRect))) {
                 console.log("Game Over! Obstacle Collision Detected! Final Score:", score);
                 isGameOver = true;
             }

             if (!obs.passed && birdStartX > obs.x + obstacleWidth / 2) {
                 score++;
                 obs.passed = true;
             }
         }

         // Set game state and submit score if game over occurred in this frame
         if (isGameOver) {
             gameState = 'gameOver';
             submitScore(); // Call submission function
         }
     } // End (gameState === 'playing')

     // --- Score Submission Function ---
     function submitScore() {
         if (typeof score !== 'number') {
             console.error("Invalid score type for submission:", score);
             return;
         }
         
         try {
             // Get player name from prompt or use default
             let playerName = prompt("Enter your name for the leaderboard:", "COCO Player");
             if (!playerName || playerName.trim() === "") {
                 playerName = "Anonymous";
             }
             playerName = playerName.trim().substring(0, 20); // Limit name length
             
             // Check if leaderboard system is available (from parent window or global)
             if (typeof addScore === 'function') {
                 // Direct function call if available
                 addScore('flappy-coco', playerName, score);
                 console.log(`Score ${score} submitted for ${playerName} in Flappy COCO`);
             } else if (window.parent && typeof window.parent.addScore === 'function') {
                 // Try parent window (if game is in iframe)
                 window.parent.addScore('flappy-coco', playerName, score);
                 console.log(`Score ${score} submitted for ${playerName} in Flappy COCO (via parent)`);
             } else {
                 // Fallback: Save directly to localStorage
                 const key = 'flappy-coco-leaderboard';
                 let scores = localStorage.getItem(key);
                 scores = scores ? JSON.parse(scores) : [];
                 
                 const newScore = {
                     name: playerName,
                     score: score,
                     date: new Date().toLocaleDateString(),
                     timestamp: Date.now()
                 };
                 
                 scores.push(newScore);
                 scores = scores.sort((a, b) => b.score - a.score).slice(0, 50); // Keep top 50
                 localStorage.setItem(key, JSON.stringify(scores));
                 
                 console.log(`Score ${score} saved locally for ${playerName} in Flappy COCO`);
             }
         } catch (error) {
             console.error("Error during score submission:", error);
         }
     }
     // --- End Score Submission Function ---

     // --- Draw Obstacles ---
     if (images.obstacle && obstacleWidth > 0) {
         obstacles.forEach((obs, index) => { let bottomPipeTopY = obs.gapY + gapSize / 2; let topPipeBottomY = obs.gapY - gapSize / 2; let requiredBottomPipeHeight = Math.max(0, (canvas.height - effectiveGroundHeight) - bottomPipeTopY); let requiredTopPipeHeight = Math.max(0, topPipeBottomY); if (requiredBottomPipeHeight > 0) { ctx.drawImage(images.obstacle, obs.x, bottomPipeTopY, obstacleWidth, requiredBottomPipeHeight); } if (requiredTopPipeHeight > 0) { ctx.save(); ctx.translate(obs.x + obstacleWidth / 2, topPipeBottomY); ctx.scale(1, -1); ctx.drawImage(images.obstacle, -obstacleWidth / 2, 0, obstacleWidth, requiredTopPipeHeight); ctx.restore(); } });
     }

     // --- Draw Ground ---
     if (images.ground && groundImageWidth > 0 && effectiveGroundHeight > 0) {
         ctx.drawImage(images.ground, 0, 0, groundImageWidth, effectiveGroundHeight, groundX, canvas.height - effectiveGroundHeight, groundImageWidth, effectiveGroundHeight); ctx.drawImage(images.ground, 0, 0, groundImageWidth, effectiveGroundHeight, groundX + groundImageWidth, canvas.height - effectiveGroundHeight, groundImageWidth, effectiveGroundHeight);
     } else { ctx.fillStyle = '#8B4513'; ctx.fillRect(0, canvas.height - effectiveGroundHeight, canvas.width, effectiveGroundHeight); }

     // --- Draw Player ---
     let currentBirdImage = images.idle;
     if (gameState === 'playing') { if (playerVy < -1) currentBirdImage = images.flap; else if (playerVy > 1) currentBirdImage = images.fall; } else if (gameState === 'gameOver') { currentBirdImage = images.crash; } else if (gameState === 'start') { currentBirdImage = images.idle; } if (currentBirdImage && playerWidth > 0 && playerHeight > 0) { ctx.drawImage(currentBirdImage, birdStartX, playerY, playerWidth, playerHeight); }

     // --- Draw UI ---
     if (gameState === 'start') {
         if (images.title && images.title.width > 0) { let titleDrawWidth = canvas.width * 0.75; let titleAspectRatio = images.title.height > 0 ? images.title.height / images.title.width : 1; let titleDrawHeight = titleDrawWidth * titleAspectRatio; let titleX = canvas.width / 2 - titleDrawWidth / 2; let titleY = canvas.height * 0.15; ctx.drawImage(images.title, titleX, titleY, titleDrawWidth, titleDrawHeight); if (images.startButton && startButtonArea) { startButtonArea.x = canvas.width / 2 - images.startButton.width / 2; startButtonArea.y = titleY + titleDrawHeight + 40; ctx.drawImage(images.startButton, startButtonArea.x, startButtonArea.y); } } else { /* Fallback text */ }
     } else if (gameState === 'gameOver') {
         if (images.gameOverBanner && gameOverBannerPos.w > 0) {
             ctx.drawImage(images.gameOverBanner, gameOverBannerPos.x, gameOverBannerPos.y, gameOverBannerPos.w, gameOverBannerPos.h);
             drawScore(score, gameOverScorePos.x, gameOverScorePos.y, 'center');
             if (images.tryAgainButton && tryAgainButtonArea) {
                  ctx.drawImage(images.tryAgainButton, tryAgainButtonArea.x, tryAgainButtonArea.y);
             }
         } else { /* Fallback text */ }
     }
     if (gameState === 'playing') { drawScore(score, 20, 20, 'left'); }

     requestAnimationFrame(gameLoop);
}

// --- Initial message while loading ---
if (ctx) {
     ctx.fillStyle = 'black'; ctx.font = '20px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('Loading assets...', canvas.width / 2, canvas.height / 2);
} else { console.error("Canvas context not available for initial loading message."); }

// Note: gameLoop() starts inside initializeGame() after images load.
