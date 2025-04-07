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

// --- Image Loading ---
let images = {};
let imagesToLoad = [
    // Player Sprites
    { name: 'idle', src: 'COCOFLAP/coco_idle.png' },
    { name: 'flap', src: 'COCOFLAP/coco_flap.png' },
    { name: 'fall', src: 'COCOFLAP/coco_fall.png' },
    { name: 'crash', src: 'COCOFLAP/coco_crash.png' },
    // UI Sprites
    { name: 'gameOverBanner', src: 'COCOFLAP/game_over_banner.png' },
    { name: 'startButton', src: 'COCOFLAP/start_button.png' },
    { name: 'tryAgainButton', src: 'COCOFLAP/try_again_button.png' },
    // Scenery & Obstacles
    { name: 'sky', src: 'COCOFLAP/sky_image.png' },
    { name: 'ground', src: 'COCOFLAP/ground_image.png' },
    { name: 'obstacle', src: 'COCOFLAP/obstacle_one.png' },
    // Score & Title
    { name: 'numbers', src: 'COCOFLAP/number_sprites.png' }, // Using PNG
    { name: 'title', src: 'COCOFLAP/title_image.png' }      // Using PNG
];
let imagesLoaded = 0;

// --- Number Sprite Data & Settings ---
// Using h: 149 based on user input from previous step
const numberSpriteData = [
    { x: 32,   y: 6, w: 103, h: 149 }, { x: 145,  y: 6, w: 68,  h: 149 },
    { x: 234,  y: 5, w: 87,  h: 149 }, { x: 337,  y: 6, w: 87,  h: 149 },
    { x: 434,  y: 6, w: 97,  h: 149 }, { x: 547,  y: 6, w: 88,  h: 149 },
    { x: 643,  y: 3, w: 98,  h: 149 }, { x: 744,  y: 6, w: 87,  h: 149 },
    { x: 844,  y: 4, w: 96,  h: 149 }, { x: 948,  y: 4, w: 97,  h: 149 }
];
const numberDrawHeight = 72; // Draw height for score digits
const numberSpacing = 4;
// --- End Number Sprite Data ---


function imageLoaded() {
    imagesLoaded++;
    if (imagesLoaded === imagesToLoad.length) { console.log("All images loaded!"); initializeGame(); }
}

imagesToLoad.forEach(imgData => { /* ... Image loading loop ... */
    let img = new Image(); img.onload = imageLoaded;
    img.onerror = () => console.error(`Failed to load image: ${imgData.src}`);
    img.src = imgData.src; images[imgData.name] = img;
});

// --- Game Variables --- (Declarations remain same)
let playerY, playerVy, playerWidth, playerHeight;
let gameState; let frame = 0, score; let obstacles = [], groundX = 0;
let groundImageWidth = 0, obstacleWidth = 0, obstacleNaturalHeight = 0;
let startButtonArea = null, tryAgainButtonArea = null;
let gameOverBannerPos = { x:0, y:0, w:0, h:0 }; let gameOverScorePos = { x:0, y:0 };

// --- Utility Functions ---
function checkCollision(rect1, rect2) { /* ... Same checkCollision ... */
    if (!rect1 || !rect2 || rect1.width <= 0 || rect1.height <= 0 || rect2.width <= 0 || rect2.height <= 0) { return false; }
    return rect1.x < rect2.x + rect2.width && rect1.x + rect1.width > rect2.x && rect1.y < rect2.y + rect2.height && rect1.y + rect1.height > rect2.y;
}
function drawScore(scoreValue, drawX, drawY, align = 'left') { /* ... Same drawScore logic ... */
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

    playerWidth = images.idle.naturalWidth; playerHeight = images.idle.naturalHeight;
    groundImageWidth = images.ground.naturalWidth; obstacleWidth = images.obstacle.naturalWidth; obstacleNaturalHeight = images.obstacle.naturalHeight;

    console.log(`--- InitializeGame ---`);

    // Calculate Game Over Banner Position & Size
    if (images.gameOverBanner.naturalWidth > 0) {
         let bannerTargetWidth = canvas.width * 0.80;
         let bannerAspectRatio = images.gameOverBanner.naturalHeight / images.gameOverBanner.naturalWidth;
         gameOverBannerPos.w = bannerTargetWidth;
         gameOverBannerPos.h = bannerTargetWidth * bannerAspectRatio;
         gameOverBannerPos.x = canvas.width / 2 - gameOverBannerPos.w / 2;
         gameOverBannerPos.y = Math.max(10, (canvas.height / 4) - gameOverBannerPos.h / 2);
    } else { /* Fallback */ }

    // *** FIX: Calculate Score position BELOW banner ***
    gameOverScorePos.x = canvas.width / 2; // Centered horizontally
    gameOverScorePos.y = gameOverBannerPos.y + gameOverBannerPos.h + 5; // Below banner + 5px gap

    // *** FIX: Calculate Try Again Button position BELOW score ***
    tryAgainButtonArea = {
        x: canvas.width / 2 - images.tryAgainButton.naturalWidth / 2,
        // Position below score, accounting for score draw height
        y: gameOverScorePos.y + numberDrawHeight + 5, // Below score + 5px gap
        width: images.tryAgainButton.naturalWidth,
        height: images.tryAgainButton.naturalHeight
    };

    // Start Button position (will be calculated in draw loop for 'start' state)
    startButtonArea = { x: 0, y: 0, width: images.startButton.naturalWidth, height: images.startButton.naturalHeight };


    if (!canvas.hasInputListener) { canvas.addEventListener('mousedown', handleInput); canvas.hasInputListener = true; }

    // Check dimensions before starting loop
    if (playerHeight > 0 && effectiveGroundHeight > 0 && obstacleWidth > 0 && obstacleNaturalHeight > 0) {
         if(gameState !== 'criticalError' && !canvas.gameLoopRunning) { console.log("Starting game loop..."); gameLoop(); canvas.gameLoopRunning = true; }
    } else { /* Error handling */ }
}


// --- Input Handling ---
function handleInput(event) { /* ... Same handleInput logic ... */
    const rect = canvas.getBoundingClientRect(); const clickX = event.clientX - rect.left; const clickY = event.clientY - rect.top;
    if (gameState === 'playing') { playerVy = flapStrength; }
    else if (gameState === 'start' && startButtonArea) { if (checkCollision({x: clickX, y: clickY, width:1, height:1}, startButtonArea)) { obstacles = []; playerY = canvas.height / 2.5; playerVy = flapStrength; score = 0; frame = 0; gameState = 'playing'; if (!canvas.gameLoopRunning) { gameLoop(); canvas.gameLoopRunning = true;} } }
    else if (gameState === 'gameOver' && tryAgainButtonArea) { if (checkCollision({x: clickX, y: clickY, width:1, height:1}, tryAgainButtonArea)) { obstacles = []; playerY = canvas.height / 2.5; playerVy = 0; score = 0; frame = 0; gameState = 'start'; if (!canvas.gameLoopRunning) { gameLoop(); canvas.gameLoopRunning = true;} } }
}

// --- Game Loop ---
let lastFrameTime = 0;

function gameLoop(currentTime) { /* ... Most of gameLoop remains the same ... */
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
             // Optional: Make hitting ceiling game over?
             // isGameOver = true;
             // console.log("Game Over! Hit ceiling. Final Score:", score);
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

             // Check collision only if not already game over from ground hit
             if (!isGameOver && (checkCollision(playerRect, topPipeRect) || checkCollision(playerRect, bottomPipeRect))) {
                 console.log("Game Over! Obstacle Collision Detected! Final Score:", score);
                 isGameOver = true;
                 // Don't break here, let score check run for the current frame
             }

             // Check score increment
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

     // --- NEW: Score Submission Function ---
     function submitScore() {
         if (typeof score !== 'number') {
             console.error("Invalid score type for submission:", score);
             return;
         }
         try {
             const cocoXUserString = localStorage.getItem('cocoXUser');
             if (cocoXUserString) {
                 console.log("X User found in localStorage, attempting score submission...");
                 const user = JSON.parse(cocoXUserString);
                 // Validate parsed user data
                 if (user && user.id && user.handle && user.profileImage) {
                     fetch('/api/arcade-leaderboard/submit', {
                         method: 'POST',
                         headers: { 'Content-Type': 'application/json' },
                         body: JSON.stringify({
                             gameName: 'FLAPPYCOCO', // Correct game name
                             score: score, // Use the global score variable
                             xUserId: user.id,
                             xUsername: user.handle,
                             xProfilePicUrl: user.profileImage
                         })
                     })
                     .then(response => {
                         if (!response.ok) {
                             response.text().then(text => {
                                 console.error('Failed to submit score:', response.status, response.statusText, text);
                             });
                         } else {
                             console.log('Score submitted successfully.');
                         }
                     })
                     .catch(error => {
                         console.error('Network or fetch error submitting score:', error);
                     });
                 } else {
                     console.warn("Parsed X User data is incomplete or invalid. Cannot submit score.", user);
                 }
             } else {
                 console.log("No X User found in localStorage. Score not submitted.");
             }
         } catch (error) {
             console.error("Error during score submission logic:", error);
         }
     }
     // --- End Score Submission Function ---
     if (images.obstacle && obstacleWidth > 0) { /* ... Obstacle drawing logic remains same ... */
         obstacles.forEach((obs, index) => { let bottomPipeTopY = obs.gapY + gapSize / 2; let topPipeBottomY = obs.gapY - gapSize / 2; let requiredBottomPipeHeight = Math.max(0, (canvas.height - effectiveGroundHeight) - bottomPipeTopY); let requiredTopPipeHeight = Math.max(0, topPipeBottomY); if (requiredBottomPipeHeight > 0) { ctx.drawImage(images.obstacle, obs.x, bottomPipeTopY, obstacleWidth, requiredBottomPipeHeight); } if (requiredTopPipeHeight > 0) { ctx.save(); ctx.translate(obs.x + obstacleWidth / 2, topPipeBottomY); ctx.scale(1, -1); ctx.drawImage(images.obstacle, -obstacleWidth / 2, 0, obstacleWidth, requiredTopPipeHeight); ctx.restore(); } });
     }
     if (images.ground && groundImageWidth > 0 && effectiveGroundHeight > 0) { /* ... Ground drawing logic remains same ... */
         ctx.drawImage(images.ground, 0, 0, groundImageWidth, effectiveGroundHeight, groundX, canvas.height - effectiveGroundHeight, groundImageWidth, effectiveGroundHeight); ctx.drawImage(images.ground, 0, 0, groundImageWidth, effectiveGroundHeight, groundX + groundImageWidth, canvas.height - effectiveGroundHeight, groundImageWidth, effectiveGroundHeight);
     } else { ctx.fillStyle = '#8B4513'; ctx.fillRect(0, canvas.height - effectiveGroundHeight, canvas.width, effectiveGroundHeight); }
     let currentBirdImage = images.idle; /* ... Player drawing logic remains same ... */
     if (gameState === 'playing') { if (playerVy < -1) currentBirdImage = images.flap; else if (playerVy > 1) currentBirdImage = images.fall; } else if (gameState === 'gameOver') { currentBirdImage = images.crash; } else if (gameState === 'start') { currentBirdImage = images.idle; } if (currentBirdImage && playerWidth > 0 && playerHeight > 0) { ctx.drawImage(currentBirdImage, birdStartX, playerY, playerWidth, playerHeight); }
     // --- Draw UI ---
     if (gameState === 'start') { /* ... Start screen UI remains same ... */
         if (images.title && images.title.naturalWidth > 0) { let titleDrawWidth = canvas.width * 0.75; let titleAspectRatio = images.title.naturalHeight > 0 ? images.title.naturalHeight / images.title.naturalWidth : 1; let titleDrawHeight = titleDrawWidth * titleAspectRatio; let titleX = canvas.width / 2 - titleDrawWidth / 2; let titleY = canvas.height * 0.15; ctx.drawImage(images.title, titleX, titleY, titleDrawWidth, titleDrawHeight); if (images.startButton && startButtonArea) { startButtonArea.x = canvas.width / 2 - images.startButton.naturalWidth / 2; startButtonArea.y = titleY + titleDrawHeight + 40; ctx.drawImage(images.startButton, startButtonArea.x, startButtonArea.y); } } else { /* Fallback text */ }
     } else if (gameState === 'gameOver') {
         // Draw Banner, Score, Button - using pre-calculated positions from initializeGame
         // Order depends on calculation order in initializeGame now
         if (images.gameOverBanner && gameOverBannerPos.w > 0) {
             ctx.drawImage(images.gameOverBanner, gameOverBannerPos.x, gameOverBannerPos.y, gameOverBannerPos.w, gameOverBannerPos.h); // Draw Banner

             // *** Draw Score ABOVE Button using calculated positions ***
             drawScore(score, gameOverScorePos.x, gameOverScorePos.y, 'center');

             if (images.tryAgainButton && tryAgainButtonArea) {
                  // Draw Button using calculated position
                  ctx.drawImage(images.tryAgainButton, tryAgainButtonArea.x, tryAgainButtonArea.y);
             }
         } else { /* Fallback text */ }
     }
     if (gameState === 'playing') { drawScore(score, 20, 20, 'left'); } // Draw score using sprites
     requestAnimationFrame(gameLoop);
}

// --- Initial message while loading ---
if (ctx) { /* ... Loading message ... */
     ctx.fillStyle = 'black'; ctx.font = '20px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('Loading assets...', canvas.width / 2, canvas.height / 2);
} else { console.error("Canvas context not available for initial loading message."); }

// Note: gameLoop() starts inside initializeGame() after images load.