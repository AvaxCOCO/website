 // --- Get Canvas and Context ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas ? canvas.getContext('2d') : null; // Check canvas exists
console.log("game.js script executing...");
console.log("Canvas element:", canvas);
console.log("Canvas context:", ctx);

// --- Game Settings ---
const gravity = 0.5;
const jumpStrength = -10;
const playerRunSpeed = 3; // Placeholder - movement not implemented yet

// --- Tile Settings ---
const TILE_WIDTH = 16;
const TILE_HEIGHT = 16;
const TILES = { EMPTY: 0, GRASS: 1, DIRT: 2, COIN: 3 };
// Coordinates based on image_d5301d.png
const tileSpriteData = {
    [TILES.GRASS]: { sx: 224, sy: 64 },
    [TILES.DIRT]:  { sx: 224, sy: 80 },
    [TILES.COIN]:  { sx: 64,  sy: 112 } // Using 'Coin full'
};

// --- Level Map ---
const levelMap = [];
const TILES_PER_SCREEN_X = canvas ? Math.floor(canvas.width / TILE_WIDTH) : 30; // Approx tiles horizontally visible
const MAP_COLS = TILES_PER_SCREEN_X * 10; // Make map 10 screens wide
const MAP_ROWS = canvas ? canvas.height / TILE_HEIGHT : 40;
// --- Advanced Procedural Level Generation ---

// --- Config ---
const MIN_GROUND_ROW = MAP_ROWS - 8; // Highest possible ground
const MAX_GROUND_ROW = MAP_ROWS - 3; // Lowest possible ground
const START_AREA_COLS = 15;          // Safe flat area at the beginning
const MIN_PLATFORM_LENGTH = 3;
const MAX_PLATFORM_LENGTH = 8;
const MIN_GAP_WIDTH = 2;
const MAX_GAP_WIDTH = 5; // Max jumpable gap? Needs testing.
const PLATFORM_SPAWN_CHANCE = 0.15; // Chance to spawn a platform cluster per column check
const GAP_CHANCE = 0.1;           // Chance to start a gap per column check
const ELEVATION_CHANGE_CHANCE = 0.02;// Chance to change base elevation per column check
const COIN_CHANCE_GROUND = 0.1;    // Chance for coin above ground tile
const COIN_CHANCE_PLATFORM = 0.3;  // Chance for coin above platform tile

// --- Initialization ---
for (let r = 0; r < MAP_ROWS; r++) {
    levelMap[r] = [];
    for (let c = 0; c < MAP_COLS; c++) {
        levelMap[r][c] = TILES.EMPTY; // Initialize empty
    }
}

// --- Generation Logic ---
let currentGroundRow = Math.floor((MIN_GROUND_ROW + MAX_GROUND_ROW) / 2); // Start mid-elevation
let inGap = false;
let gapWidth = 0;
let platformSegmentLength = 0;

for (let c = 0; c < MAP_COLS; c++) {
    // --- Ensure Safe Start Area ---
    if (c < START_AREA_COLS) {
        levelMap[currentGroundRow][c] = TILES.GRASS;
        levelMap[currentGroundRow + 1][c] = TILES.DIRT;
        levelMap[currentGroundRow + 2][c] = TILES.DIRT; // Extra dirt layer
        // Add some coins in start area
         if (c > 5 && c % 2 === 0 && currentGroundRow -1 > 0) levelMap[currentGroundRow - 1][c] = TILES.COIN;
        continue; // Skip other generation for start area
    }

    // --- Handle Platform Segments (Overrides ground/gaps temporarily) ---
    if (platformSegmentLength > 0) {
        platformSegmentLength--;
        // Platform tiles already placed when segment started
        continue; // Move to next column
    }

    // --- Decide Elevation Change ---
    if (Math.random() < ELEVATION_CHANGE_CHANCE && !inGap) {
        let change = (Math.random() < 0.5) ? -1 : 1; // Go up or down
        let nextGroundRow = currentGroundRow + change * Math.floor(1 + Math.random() * 2); // Change by 1 or 2 rows
        currentGroundRow = Math.max(MIN_GROUND_ROW, Math.min(MAX_GROUND_ROW, nextGroundRow));
        // Simple transition: just end previous ground, player has to jump/drop
    }

    // --- Decide Gaps ---
    if (inGap) {
        gapWidth--;
        if (gapWidth <= 0) {
            inGap = false;
        }
    } else { // Not currently in a gap
        if (Math.random() < GAP_CHANCE) {
            inGap = true;
            gapWidth = MIN_GAP_WIDTH + Math.floor(Math.random() * (MAX_GAP_WIDTH - MIN_GAP_WIDTH + 1));
            gapWidth--; // Account for current column being the first gap tile
        }
    }

    // --- Place Ground Tiles (if not in a gap) ---
    if (!inGap) {
        levelMap[currentGroundRow][c] = TILES.GRASS;
        if (currentGroundRow + 1 < MAP_ROWS) levelMap[currentGroundRow + 1][c] = TILES.DIRT;
        if (currentGroundRow + 2 < MAP_ROWS) levelMap[currentGroundRow + 2][c] = TILES.DIRT; // Extra dirt

        // Place Coins above ground
        if (Math.random() < COIN_CHANCE_GROUND && currentGroundRow - 1 > 0) {
            levelMap[currentGroundRow - 1][c] = TILES.COIN;
        }
    } else {
         // Optional: Place coins over gaps? Maybe in an arc? (More complex)
    }


    // --- Decide Floating Platforms ---
    // Check slightly ahead to prevent platforms right at column start
    if (c > START_AREA_COLS + 5 && platformSegmentLength <= 0 && Math.random() < PLATFORM_SPAWN_CHANCE) {
        let platformLength = MIN_PLATFORM_LENGTH + Math.floor(Math.random() * (MAX_PLATFORM_LENGTH - MIN_PLATFORM_LENGTH + 1));
        // Place higher than current ground, or lower if ground is high
        let basePlatformRow = currentGroundRow - 4 - Math.floor(Math.random() * 4);
        if (currentGroundRow <= MIN_GROUND_ROW + 2) { // If ground is high, place below
             basePlatformRow = currentGroundRow + 3 + Math.floor(Math.random() * 2);
        }
        basePlatformRow = Math.max(1, Math.min(MAP_ROWS - 2, basePlatformRow)); // Clamp within bounds

        for (let pc = 0; pc < platformLength && (c + pc) < MAP_COLS; pc++) {
            levelMap[basePlatformRow][c + pc] = TILES.GRASS;
            if (basePlatformRow + 1 < MAP_ROWS) levelMap[basePlatformRow + 1][c + pc] = TILES.DIRT;

            // Place coins above platform
            if (Math.random() < COIN_CHANCE_PLATFORM && basePlatformRow - 1 > 0) {
                levelMap[basePlatformRow - 1][c + pc] = TILES.COIN;
            }
        }
        platformSegmentLength = platformLength -1; // Set counter for columns this platform occupies
    }
}

// --- Final Pass / Cleanup (Optional) ---
// Could add checks here to ensure goal is reachable, etc.

// --- End Advanced Generation ---
// --- End Level Map ---

// --- Image Loading ---
let images = {};
// *** IMPORTANT: Ensure this path 'ASSETS/' matches your folder name! ***
const assetFolder = 'ASSETS/';
// Using final filenames from image_a2070a.jpg
let imagesToLoad = [
    { name: 'p_idle', src: assetFolder + 'coco_idle.png' }, { name: 'p_jump', src: assetFolder + 'coco_jump.png' },
    { name: 'p_fall', src: assetFolder + 'coco_fall.png' }, { name: 'p_run1', src: assetFolder + 'coco_platform_run_1.png' },
    { name: 'p_run2', src: assetFolder + 'coco_platform_run_2.png' }, { name: 'p_run3', src: assetFolder + 'coco_platform_run_3.png' },
    { name: 'p_run4', src: assetFolder + 'coco_platform_run_4.png' }, { name: 'p_run5', src: assetFolder + 'coco_platform_run_5.png' },
    { name: 'gameOverBanner', src: assetFolder + 'game_over_banner.png' }, { name: 'levelCompleteBanner', src: assetFolder + 'level_complete_banner.png'},
    { name: 'startButton', src: assetFolder + 'start_button.png' }, { name: 'tryAgainButton', src: assetFolder + 'try_again_button.png' },
    { name: 'titleLogo', src: assetFolder + 'title_logo_platformer.png' }, { name: 'sky', src: assetFolder + 'sky_image.png' },
    { name: 'landscape', src: assetFolder + 'coco_landscape_sprites.png' }, { name: 'numbers', src: assetFolder + 'number_sprites.png' }
];
let imagesLoaded = 0;
let imageLoadErrorOccurred = false;

// --- Number Sprite Data & Settings --- (Using h: 149)
const numberSpriteData = [
    { x: 32,   y: 6, w: 103, h: 149 }, { x: 145,  y: 6, w: 68,  h: 149 }, { x: 234,  y: 5, w: 87,  h: 149 }, { x: 337,  y: 6, w: 87,  h: 149 }, { x: 434,  y: 6, w: 97,  h: 149 }, { x: 547,  y: 6, w: 88,  h: 149 }, { x: 643,  y: 3, w: 98,  h: 149 }, { x: 744,  y: 6, w: 87,  h: 149 }, { x: 844,  y: 4, w: 96,  h: 149 }, { x: 948,  y: 4, w: 97,  h: 149 } ];
const numberDrawHeight = 40; // Adjust score size if needed
const numberSpacing = 2;
// --- End Number Sprite Data ---

function imageLoaded() {
    if (imageLoadErrorOccurred) return; imagesLoaded++;
    // console.log(`Successfully loaded ${imagesLoaded}/${imagesToLoad.length}`); // Optional log
    if (imagesLoaded === imagesToLoad.length) { console.log("All images loaded successfully! Attempting initialization..."); initializeGame(); }
}

imagesToLoad.forEach(imgData => {
    let img = new Image(); img.onload = imageLoaded;
    img.onerror = () => { if (!imageLoadErrorOccurred) { console.error(`!!! Failed to load image: ${imgData.src} - Check path/filename !!!`); imageLoadErrorOccurred = true; } images[imgData.name] = null; };
    if (!imgData.src || typeof imgData.src !== 'string') { console.error(`Invalid image src definition for name: ${imgData.name}`); imageLoadErrorOccurred = true; images[imgData.name] = null; } else { img.src = imgData.src; images[imgData.name] = img; }
});

// --- Game Variables ---
let playerX, playerY, playerVx, playerVy;
let playerWidth, playerHeight; let onGround = false; let facingRight = true;
// Define collision hitbox dimensions globally
let playerCollisionWidth = 0; // Will be calculated in initializeGame
let playerCollisionXOffset = 0; // Will be calculated in initializeGame
let currentRunFrame = 0; const runFrameCount = 5; const runFrameDelay = 6; let runFrameTimer = 0;
let gameState = 'loading'; let frame = 0, score = 0;
let startButtonArea = null, tryAgainButtonArea = null;
let titleLogoPos = {}, gameOverBannerPos = {}, levelCompleteBannerPos = {}, gameOverScorePos = {};
let keyLeftPressed = false;
let keyRightPressed = false; // Keep the original declaration
let cameraX = 0;
let cameraY = 0; // Keep Y at 0 for now (no vertical scroll)
let goalX = (MAP_COLS - 5) * TILE_WIDTH; // Update level goal X coordinate (5 tiles from end)
// Removed duplicate declaration of keyRightPressed on the next line

// --- Utility Functions ---
function checkCollision(rect1, rect2) { if (!rect1 || !rect2 || rect1.width <= 0 || rect1.height <= 0 || rect2.width <= 0 || rect2.height <= 0) { return false; } return rect1.x < rect2.x + rect2.width && rect1.x + rect1.width > rect2.x && rect1.y < rect2.y + rect2.height && rect1.y + rect1.height > rect2.y; }
function drawScore(scoreValue, drawX, drawY, align = 'left') { if (!images.numbers) return; let scoreStr = scoreValue.toString(); let currentDrawX = drawX; let digitDrawInfo = []; let totalScoreWidth = 0; for (let i = 0; i < scoreStr.length; i++) { let digit = parseInt(scoreStr[i]); let drawWidth = 0; if (digit >= 0 && digit <= 9) { let sprite = numberSpriteData[digit]; if (sprite && sprite.h > 0) { let aspectRatio = sprite.w / sprite.h; drawWidth = numberDrawHeight * aspectRatio; } } digitDrawInfo.push(drawWidth); totalScoreWidth += drawWidth; } totalScoreWidth += Math.max(0, scoreStr.length - 1) * numberSpacing; if (align === 'center') { currentDrawX = drawX - totalScoreWidth / 2; } else if (align === 'right') { currentDrawX = drawX - totalScoreWidth; } for (let i = 0; i < scoreStr.length; i++) { let digit = parseInt(scoreStr[i]); if (digit >= 0 && digit <= 9) { let sprite = numberSpriteData[digit]; let drawWidth = digitDrawInfo[i]; if (sprite && drawWidth > 0) { ctx.drawImage(images.numbers, sprite.x, sprite.y, sprite.w, sprite.h, currentDrawX, drawY, drawWidth, numberDrawHeight); currentDrawX += drawWidth + numberSpacing; } } } }
function getTile(col, row) { if (row >= 0 && row < MAP_ROWS && col >= 0 && col < MAP_COLS) { return levelMap[row][col]; } return TILES.EMPTY; }
function isSolidTile(tileType) { return tileType === TILES.GRASS || tileType === TILES.DIRT; }
// --- End Tile Collision Helper ---

// --- Initialization Function ---
function initializeGame() {
    console.log("Inside initializeGame()...");
    // Robust Image Check
    const requiredImages = ['p_idle', 'p_jump', 'p_fall', 'p_run1', 'p_run2', 'p_run3', 'p_run4', 'p_run5', 'gameOverBanner', 'startButton', 'tryAgainButton', 'sky', 'landscape', 'numbers', 'titleLogo', 'levelCompleteBanner'];
    let allLoadedAndValid = true; for (let name of requiredImages) { if (!images[name] || !(images[name].naturalWidth > 0 && images[name].naturalHeight > 0)) { console.error(`Initialization Error: Image "${name}" invalid!`); allLoadedAndValid = false; } } if (!allLoadedAndValid) { gameState = 'criticalError'; if(ctx){ ctx.fillStyle='red'; ctx.font='12px sans-serif'; ctx.textAlign='center'; ctx.fillText('ERROR: Invalid image assets. Check console.', canvas.width/2, canvas.height/2); } console.error("Initialization failed: Invalid image assets."); return; } console.log("All required image objects seem valid.");

    // Set Initial State
    gameState = 'start';
    playerX = canvas.width / 4; playerY = (MAP_ROWS - 5) * TILE_HEIGHT;
    playerVx = 0; playerVy = 0; onGround = false; facingRight = true;
    currentRunFrame = 0; runFrameTimer = 0; score = 0; frame = 0;

    // Read Dimensions (using 50x50 based on user info)
    playerWidth = 50;
    playerHeight = 50;
    obstacleWidth = TILE_WIDTH; obstacleNaturalHeight = TILE_HEIGHT; // Use tile size
    // Calculate and assign collision hitbox dimensions (now using global vars)
    playerCollisionWidth = TILE_WIDTH * 1.8; // Approx 28.8px
    playerCollisionXOffset = (playerWidth - playerCollisionWidth) / 2; // Center hitbox
    console.log(`Player dimensions set: ${playerWidth}x${playerHeight}, Collision Box Width: ${playerCollisionWidth}`);

    // Calculate UI positions and SIZES
    console.log("Calculating UI positions...");
    try {
        // Title Logo (Scaled)
        let titleScaleWidth = canvas.width * 0.8; let titleAspect = images.titleLogo.naturalHeight / images.titleLogo.naturalWidth; titleLogoPos = { w: titleScaleWidth, h: titleScaleWidth * titleAspect, x: canvas.width / 2 - titleScaleWidth / 2, y: canvas.height * 0.1 };
        // Start Button (Scaled, assume square aspect if needed)
        let buttonTargetWidth = 120; let startAspect = images.startButton.naturalHeight > 0 ? images.startButton.naturalHeight / images.startButton.naturalWidth : 1; let startDrawWidth = buttonTargetWidth; let startDrawHeight = buttonTargetWidth * startAspect; startButtonArea = { x: canvas.width / 2 - startDrawWidth / 2, y: titleLogoPos.y + titleLogoPos.h + 30, width: startDrawWidth, height: startDrawHeight };
        // console.log("Calculated startButtonArea:", startButtonArea); // Remove DEBUG LOG
        // Game Over Banner (Scaled)
        let bannerScaleWidth = canvas.width * 0.7; let bannerAspect = images.gameOverBanner.naturalHeight / images.gameOverBanner.naturalWidth; gameOverBannerPos = { w: bannerScaleWidth, h: bannerScaleWidth * bannerAspect, x: canvas.width / 2 - bannerScaleWidth / 2, y: Math.max(10, (canvas.height / 4) - (bannerScaleWidth * bannerAspect) / 2) };
        // Level Complete Banner (Scaled)
        let completeScaleWidth = canvas.width * 0.7; let completeAspect = images.levelCompleteBanner.naturalHeight / images.levelCompleteBanner.naturalWidth; levelCompleteBannerPos = { w: completeScaleWidth, h: completeScaleWidth * completeAspect, x: canvas.width / 2 - completeScaleWidth / 2, y: canvas.height * 0.25 };
        // Try Again Button (Scaled, assume square aspect if needed)
        let tryAgainAspect = images.tryAgainButton.naturalHeight > 0 ? images.tryAgainButton.naturalHeight / images.tryAgainButton.naturalWidth : 1; let tryAgainDrawWidth = buttonTargetWidth; let tryAgainDrawHeight = buttonTargetWidth * tryAgainAspect; tryAgainButtonArea = { x: canvas.width / 2 - tryAgainDrawWidth / 2, y: gameOverBannerPos.y + gameOverBannerPos.h + 15, width: tryAgainDrawWidth, height: tryAgainDrawHeight };
        // Game Over Score Position
        gameOverScorePos.x = canvas.width / 2; gameOverScorePos.y = tryAgainButtonArea.y + tryAgainButtonArea.height + 15;
        console.log("UI positions calculated successfully.");
    } catch (e) { console.error("ERROR during UI Position Calculation:", e); gameState = 'criticalError'; if(ctx) { /* Draw error */ } return; }

    if (!canvas.hasInputListener) {
        canvas.addEventListener('mousedown', handleInput);
        // Add keyboard listeners
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('keyup', handleKeyUp);
        canvas.hasInputListener = true;
    }

    // Final check
    if (playerHeight > 0 && playerWidth > 0 && TILE_WIDTH > 0 && TILE_HEIGHT > 0) {
         if(gameState !== 'criticalError' && !canvas.gameLoopRunning) { console.log("Initialization complete. Starting game loop..."); gameLoop(); canvas.gameLoopRunning = true; }
    } else { console.error("ERROR: Invalid dimensions after initialization checks."); gameState = 'criticalError'; }
}


// --- Input Handling ---
function handleInput(event) {
    const rect = canvas.getBoundingClientRect(); const clickX = event.clientX - rect.left; const clickY = event.clientY - rect.top;
    if (gameState === 'playing' && onGround) { playerVy = jumpStrength; onGround = false; } // Jump
    else if (gameState === 'start' && startButtonArea) {
        // const clickRect = {x: clickX, y: clickY, width:1, height:1}; // Remove DEBUG LOG related vars
        // const collisionResult = checkCollision(clickRect, startButtonArea); // Remove DEBUG LOG related vars
        // console.log(`Click: (${clickX}, ${clickY}), ButtonArea:`, startButtonArea, `Collision: ${collisionResult}`); // Remove DEBUG LOG
        if (checkCollision({x: clickX, y: clickY, width:1, height:1}, startButtonArea)) { // Use original check
             gameState = 'playing';
             score=0; frame=0;
             // Reset player position/state
             playerY = canvas.height/2; // Drop in from middle
             playerVy=0;
             onGround=false;
             playerX = canvas.width / 4; // Reset X pos
        }
    } // Start Game
    else if (gameState === 'gameOver' && tryAgainButtonArea) { if (checkCollision({x: clickX, y: clickY, width:1, height:1}, tryAgainButtonArea)) { gameState = 'start'; playerX = canvas.width / 4; playerY = (MAP_ROWS - 5) * TILE_HEIGHT; playerVy = 0; onGround = false; score=0; frame=0; } } // Retry
}

// --- NEW: Keyboard Handlers ---
function handleKeyDown(event) {
    const key = event.key.toLowerCase();
    if (key === 'a' || key === 'arrowleft') {
        keyLeftPressed = true;
    } else if (key === 'd' || key === 'arrowright') {
        keyRightPressed = true;
    }
    // Optional: Prevent default browser behavior for arrow keys/space if needed
    // if (['arrowleft', 'arrowright', 'arrowup', 'arrowdown', ' '].includes(key)) {
    //     event.preventDefault();
    // }
}

function handleKeyUp(event) {
    const key = event.key.toLowerCase();
    if (key === 'a' || key === 'arrowleft') {
        keyLeftPressed = false;
    } else if (key === 'd' || key === 'arrowright') {
        keyRightPressed = false;
    }
}
// --- End Keyboard Handlers ---

// --- Game Loop ---
function gameLoop() {
     if (gameState === 'criticalError'){ canvas.gameLoopRunning = false; return; }
     canvas.gameLoopRunning = true;

     // --- Update ---
     if (gameState === 'playing') {
        frame++;
        // Physics
        if (!onGround) { playerVy += gravity; } else { playerVy = 0; }
        // --- Horizontal Movement ---
        if (keyRightPressed && !keyLeftPressed) {
            playerVx = playerRunSpeed;
            facingRight = true;
        } else if (keyLeftPressed && !keyRightPressed) {
            playerVx = -playerRunSpeed;
            facingRight = false;
        } else {
            playerVx = 0; // Stop if both or neither key is pressed
        }

        // Apply Velocity
        let nextX = playerX + playerVx;
        let nextY = playerY + playerVy;

        // Collision (Simplified Ground Check Only)
        onGround = false;
        // Use collision hitbox for ground checks
        let collisionBoxX = nextX + playerCollisionXOffset;
        let playerLeftTile = Math.floor(collisionBoxX / TILE_WIDTH);
        let playerRightTile = Math.floor((collisionBoxX + playerCollisionWidth - 1) / TILE_WIDTH);
        let checkTileRow = Math.floor((nextY + playerHeight) / TILE_HEIGHT);
        if (playerVy >= 0) { // Only check below if falling or still
            let tileBelowLeft = getTile(playerLeftTile, checkTileRow);
            let tileBelowRight = getTile(playerRightTile, checkTileRow);
            if (isSolidTile(tileBelowLeft) || isSolidTile(tileBelowRight)) {
                 let groundLevelY = checkTileRow * TILE_HEIGHT;
                 if ((playerY + playerHeight) <= groundLevelY && (nextY + playerHeight) >= groundLevelY) {
                     nextY = groundLevelY - playerHeight; playerVy = 0; onGround = true;
                 }
            }
        }
        // --- Wall Collision ---
        // Use collision hitbox for wall checks
        let nextCollisionBoxX = nextX + playerCollisionXOffset;
        let nextPlayerLeftTile = Math.floor(nextCollisionBoxX / TILE_WIDTH);
        let nextPlayerRightTile = Math.floor((nextCollisionBoxX + playerCollisionWidth - 1) / TILE_WIDTH);
        let playerTopTile = Math.floor(playerY / TILE_HEIGHT); // Use current Y for wall checks
        let playerBottomTile = Math.floor((playerY + playerHeight - 1) / TILE_HEIGHT);

        if (playerVx > 0) { // Moving Right
            for (let r = playerTopTile; r <= playerBottomTile; r++) {
                if (isSolidTile(getTile(nextPlayerRightTile, r))) {
                    // Align collision box right edge to tile left edge
                    nextX = (nextPlayerRightTile * TILE_WIDTH) - playerCollisionWidth - playerCollisionXOffset;
                    playerVx = 0;
                    break; // Stop checking rows once collision found
                }
            }
        } else if (playerVx < 0) { // Moving Left
            for (let r = playerTopTile; r <= playerBottomTile; r++) {
                if (isSolidTile(getTile(nextPlayerLeftTile, r))) {
                    // Align collision box left edge to tile right edge
                    nextX = (nextPlayerLeftTile + 1) * TILE_WIDTH - playerCollisionXOffset;
                    playerVx = 0;
                    break; // Stop checking rows once collision found
                }
            }
        }
        // TODO: Add Ceiling collision checks here using nextY

        // Update position
        playerY = nextY; // Update Y first (handles gravity/jump/ground collision)
        playerX = nextX; // Update X after wall collision checks

        // --- Level Complete Check ---
        if (playerX + playerWidth / 2 > goalX) {
            gameState = 'levelComplete';
        }

        // Animation Frame Update (Basic cycle, not linked to movement yet)
        runFrameTimer++; if (runFrameTimer >= runFrameDelay) { runFrameTimer = 0; currentRunFrame++; if (currentRunFrame >= runFrameCount) { currentRunFrame = 0; } }

        // Collectibles
        // --- Update Camera ---
        let targetCameraX = playerX - canvas.width / 3; // Keep player 1/3rd from left
        // Clamp camera within map boundaries
        cameraX = Math.max(0, Math.min(targetCameraX, MAP_COLS * TILE_WIDTH - canvas.width));
        // cameraY = ... // Add vertical clamping if needed later

        // Check all tiles the player overlaps for coins
        let startCol = Math.floor(playerX / TILE_WIDTH);
        let endCol = Math.floor((playerX + playerWidth - 1) / TILE_WIDTH);
        let startRow = Math.floor(playerY / TILE_HEIGHT);
        let endRow = Math.floor((playerY + playerHeight - 1) / TILE_HEIGHT);

        for (let r = startRow; r <= endRow; r++) {
            for (let c = startCol; c <= endCol; c++) {
                if (getTile(c, r) === TILES.COIN) {
                    levelMap[r][c] = TILES.EMPTY; // Remove coin from map
                    score++; // Increment score
                    // Optional: Add sound effect or particle effect here
                }
            }
        }

        // Fall off screen check
        if (playerY > canvas.height) { gameState = 'gameOver'; }
        // TODO: Level Complete Check

     } // End update playing state

     // --- Draw ---
     // --- Clear Canvas ---
     ctx.clearRect(0, 0, canvas.width, canvas.height);

     // --- Draw Background (Always) ---
     if (images.sky) {
         ctx.drawImage(images.sky, 0, 0, canvas.width, canvas.height);
     } else {
         ctx.fillStyle = '#afeeee'; // Fallback color
         ctx.fillRect(0, 0, canvas.width, canvas.height);
     }

     // --- Draw World (Level & Player) or Static UI ---
     if (gameState === 'playing') {
         // --- Apply Camera and Draw World ---
         ctx.save();
         ctx.translate(-cameraX, -cameraY);

         drawLevel(); // Draw the tilemap

         // Draw Player
         let currentPlayerSpriteKey = 'p_idle';
         // Determine sprite based on state (jump/fall/run/idle)
          if (!onGround) {
              currentPlayerSpriteKey = playerVy < 0 ? 'p_jump' : 'p_fall';
          } else {
              if (Math.abs(playerVx) > 0.1) { // Check if moving horizontally
                  currentPlayerSpriteKey = `p_run${currentRunFrame + 1}`; // Use run frames
              } else {
                  currentPlayerSpriteKey = 'p_idle'; // Idle on ground
              }
          }
         let currentPlayerSprite = images[currentPlayerSpriteKey];
         if (currentPlayerSprite && playerWidth > 0 && playerHeight > 0) {
               // Handle Horizontal Flipping
               ctx.save();
               ctx.translate(playerX + playerWidth / 2, playerY + playerHeight / 2);
               ctx.scale(facingRight ? 1 : -1, 1);
               ctx.drawImage(currentPlayerSprite, -playerWidth / 2, -playerHeight / 2, playerWidth, playerHeight);
               ctx.restore(); // Restore from flipping
         } else { /* Fallback drawing */ }

         ctx.restore(); // Restore from camera translation

         // --- Draw Playing UI (Score) ---
         drawScore(score, 20, 20, 'left'); // Draw score fixed on screen

     } else {
         // --- Draw Static UI (Start, Game Over, Level Complete, Loading, Error) ---
         if (gameState === 'start') {
             if (images.titleLogo && titleLogoPos.w > 0) { ctx.drawImage(images.titleLogo, titleLogoPos.x, titleLogoPos.y, titleLogoPos.w, titleLogoPos.h); }
             if (images.startButton && startButtonArea) { ctx.drawImage(images.startButton, startButtonArea.x, startButtonArea.y, startButtonArea.width, startButtonArea.height); }
         } else if (gameState === 'gameOver') {
             if (images.gameOverBanner && gameOverBannerPos.w > 0) { ctx.drawImage(images.gameOverBanner, gameOverBannerPos.x, gameOverBannerPos.y, gameOverBannerPos.w, gameOverBannerPos.h); }
             if (images.tryAgainButton && tryAgainButtonArea) { drawScore(score, gameOverScorePos.x, gameOverScorePos.y, 'center'); ctx.drawImage(images.tryAgainButton, tryAgainButtonArea.x, tryAgainButtonArea.y, tryAgainButtonArea.width, tryAgainButtonArea.height); }
         } else if (gameState === 'levelComplete') {
              if (images.levelCompleteBanner && levelCompleteBannerPos.w > 0) { ctx.drawImage(images.levelCompleteBanner, levelCompleteBannerPos.x, levelCompleteBannerPos.y, levelCompleteBannerPos.w, levelCompleteBannerPos.h); }
              drawScore(score, canvas.width / 2, levelCompleteBannerPos.y + levelCompleteBannerPos.h + 20, 'center');
         } else if (gameState === 'loading') {
              ctx.fillStyle = 'black'; ctx.font = '20px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('Loading assets...', canvas.width / 2, canvas.height / 2);
         } else if (gameState === 'criticalError') {
              ctx.fillStyle='red'; ctx.font='12px sans-serif'; ctx.textAlign='center'; ctx.fillText('ERROR: See console.', canvas.width/2, canvas.height/2);
         }
     }

     requestAnimationFrame(gameLoop);
}

// --- Function to Draw Level from Map ---
function drawLevel() {
    if (!images.landscape) { console.error("drawLevel Error: Landscape image not loaded."); return; }
    for (let r = 0; r < MAP_ROWS; r++) {
        for (let c = 0; c < MAP_COLS; c++) {
            let tileType = levelMap[r][c];
            if (tileType === TILES.EMPTY) continue;
            let spriteInfo = tileSpriteData[tileType];
            if (!spriteInfo) continue;
            let destX = c * TILE_WIDTH; let destY = r * TILE_HEIGHT;
            try {
                ctx.drawImage( images.landscape, spriteInfo.sx, spriteInfo.sy, TILE_WIDTH, TILE_HEIGHT, destX, destY, TILE_WIDTH, TILE_HEIGHT );
            } catch (e) { console.error(`RUNTIME Error drawing tile type ${tileType} at ${destX}, ${destY}`, e); gameState = 'criticalError'; break; }
        } if (gameState === 'criticalError') break;
    }
}

// --- Initial message while loading ---
if (ctx) { ctx.fillStyle = 'black'; ctx.font = '20px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('Loading assets...', canvas.width / 2, canvas.height / 2); }
else { console.error("Canvas context not available."); }

// Note: gameLoop() starts inside initializeGame() after images load.
