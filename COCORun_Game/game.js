// --- Global Canvas and Context Variables ---
let canvas, ctx;

// Simple initialization that waits for everything to be ready
function initializeGame() {
    console.log("Initializing game...");
    
    // Get canvas and context
    canvas = document.getElementById('gameCanvas');
    if (!canvas) {
        console.error("Canvas element not found!");
        return;
    }
    
    ctx = canvas.getContext('2d');
    if (!ctx) {
        console.error("Canvas context not available!");
        return;
    }
    
    console.log("Canvas and context ready, starting game initialization...");
    
    // Start loading images immediately
    loadImages();
}

function loadImages() {
    console.log("Starting image loading...");
    
    // Start loading all images
    imagesToLoad.forEach(imgData => {
        let img = new Image(); 
        img.onload = imageLoaded;
        img.onerror = () => { 
            console.error(`!!! Failed to load image: ${imgData.name} from ${imgData.src} - Check path/filename !!!`); 
            if (!imageLoadErrorOccurred) { 
                imageLoadErrorOccurred = true; 
            } 
            images[imgData.name] = null; 
        };
        if (!imgData.src || typeof imgData.src !== 'string') { 
            console.error(`Invalid image src definition for name: ${imgData.name}`); 
            imageLoadErrorOccurred = true; 
            images[imgData.name] = null; 
        } else { 
            console.log(`Loading image: ${imgData.name} from ${imgData.src}`);
            img.src = imgData.src; 
            images[imgData.name] = img; 
        }
    });
}

function startGameInitialization() {
    // This function will call completeInitialization after images load
    console.log("Starting game initialization...");
}

// --- Game Settings ---
const gravity = 0.5;
const jumpStrength = -10;
const playerRunSpeed = 3;
const PLAYER_DRAW_WIDTH = 50;
const PLAYER_DRAW_HEIGHT = 50;
const PLAYER_COLLISION_WIDTH_FACTOR = 1.8; // Multiplier for TILE_WIDTH
const CAMERA_X_OFFSET_FACTOR = 1/3; // Player position from left edge
const SCORE_X_POS = 20;
const SCORE_Y_POS = 20;
const LEVEL_TIME_LIMIT = 60; // Seconds per level
const LEVEL_INDICATOR_X_POS = canvas ? canvas.width - 20 : 620; // Position from right
const LEVEL_INDICATOR_Y_POS = 20;
const TIMER_X_POS = canvas ? canvas.width / 2 : 320; // Center
const TIMER_Y_POS = 20;

// UI Layout Constants
const UI_TITLE_LOGO_SCALE_WIDTH_FACTOR = 0.8;
const UI_TITLE_LOGO_Y_POS_FACTOR = 0.1;
const UI_BUTTON_TARGET_WIDTH = 120;
const UI_START_BUTTON_Y_SPACING = 30;
const UI_BANNER_SCALE_WIDTH_FACTOR = 0.7;
const UI_GAME_OVER_BANNER_MIN_Y_POS = 10;
const UI_GAME_OVER_BANNER_Y_POS_FACTOR = 0.25; // Relative to canvas height
const UI_LEVEL_COMPLETE_BANNER_Y_POS_FACTOR = 0.25; // Relative to canvas height
const UI_TRY_AGAIN_BUTTON_Y_SPACING = 15;
const UI_GAME_OVER_SCORE_Y_SPACING = 15;
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
const MAP_COLS = TILES_PER_SCREEN_X * 8; // Define fixed level width (e.g., 8 screens)
const MAP_ROWS = canvas ? Math.ceil(canvas.height / TILE_HEIGHT) : 40; // Use ceil for rows
// --- Level Generator Object ---
const LevelGenerator = {
    config: {
        // Removed chunk logic
        BASE_MIN_GROUND_ROW_OFFSET: 8,    // Base offset from bottom (higher on screen)
        BASE_MAX_GROUND_ROW_OFFSET: 3,    // Base offset from bottom (lower on screen)
        VERTICAL_SHIFT_PER_LEVEL: 0.5,    // How many rows the ground shifts up per level
        START_AREA_COLS: 15,
        MIN_PLATFORM_LENGTH: 3,
        MAX_PLATFORM_LENGTH: 8,
        MIN_GAP_WIDTH: 3,            // Updated minimum gap width to 3 tiles (48px)
        MAX_GAP_WIDTH: 5,            // Max jumpable gap? Needs testing.
        PLATFORM_SPAWN_CHANCE: 0.15,
        GAP_CHANCE: 0.1,
        ELEVATION_CHANGE_CHANCE: 0.02,
        COIN_CHANCE_GROUND: 0.1,
        COIN_CHANCE_PLATFORM: 0.3,
        // Derived values will be calculated in init
        MIN_GROUND_ROW: 0,
        MAX_GROUND_ROW: 0,
    },
    state: {
        currentGroundRow: 0,
        inGap: false,
        gapWidth: 0,
        platformSegmentLength: 0,
        initialStartingGroundRow: 0, // Store the ground row used for the very start
        // Removed chunk logic
    },

    // Initialize config and state for a specific level
    initializeForLevel: function(mapRows, levelNumber) {
        // Calculate vertical shift based on level
        const verticalShift = Math.floor((levelNumber - 1) * this.config.VERTICAL_SHIFT_PER_LEVEL);

        // Adjust ground offsets, ensuring they don't go too high or cross over
        let currentMinOffset = Math.max(1, this.config.BASE_MIN_GROUND_ROW_OFFSET - verticalShift);
        let currentMaxOffset = Math.max(1, this.config.BASE_MAX_GROUND_ROW_OFFSET - verticalShift);

        // Ensure min offset remains greater than max offset (higher on screen)
        if (currentMinOffset <= currentMaxOffset) {
            currentMinOffset = currentMaxOffset + 1; // Keep at least 1 row difference
            console.warn(`Vertical shift limited for Level ${levelNumber} to prevent ground range inversion.`);
        }

        // Calculate ground rows based on adjusted offsets
        this.config.MIN_GROUND_ROW = mapRows - currentMinOffset; // Higher row number = lower on screen
        this.config.MAX_GROUND_ROW = mapRows - currentMaxOffset; // Lower row number = higher on screen

        // Clamp ground rows to valid map bounds (leaving space top/bottom)
        this.config.MIN_GROUND_ROW = Math.max(1, this.config.MIN_GROUND_ROW);
        this.config.MAX_GROUND_ROW = Math.min(mapRows - 2, this.config.MAX_GROUND_ROW);

        // Final check to ensure min is still above max after clamping
        if (this.config.MIN_GROUND_ROW >= this.config.MAX_GROUND_ROW) {
             this.config.MIN_GROUND_ROW = this.config.MAX_GROUND_ROW - 1;
             this.config.MIN_GROUND_ROW = Math.max(1, this.config.MIN_GROUND_ROW); // Re-clamp after adjustment
        }

        // Initialize state ground row based on the calculated bounds for this level
        this.state.currentGroundRow = Math.floor((this.config.MIN_GROUND_ROW + this.config.MAX_GROUND_ROW) / 2);
        this.state.inGap = false;
        this.state.gapWidth = 0;
        this.state.platformSegmentLength = 0;
        this.state.initialStartingGroundRow = this.state.currentGroundRow; // Store the specific starting row
        console.log(`Level ${levelNumber}: Ground Range [${this.config.MIN_GROUND_ROW} - ${this.config.MAX_GROUND_ROW}] (Offsets: Min=${currentMinOffset}, Max=${currentMaxOffset}), StartRow: ${this.state.initialStartingGroundRow}`);
    },

    // Generates the entire map for a given level
    generateLevelMap: function(map, mapRows, mapCols, difficulty = 0, levelNumber = 1) {
        this.initializeForLevel(mapRows, levelNumber); // Set up config & state for this level

        // Initialize map array
        for (let r = 0; r < mapRows; r++) {
            map[r] = [];
            for (let c = 0; c < mapCols; c++) {
                map[r][c] = TILES.EMPTY;
            }
        }

        // Use local references for easier access inside the loop
        let config = this.config; // Config is now level-specific via initializeForLevel
        let state = this.state;   // State is reset via initializeForLevel

        console.log(`Generating Level ${levelNumber} (Cols: ${mapCols}, Difficulty: ${difficulty.toFixed(3)})`);

        for (let c = 0; c < mapCols; c++) { // Loop through all columns for the level
            // No need to initialize columns here, done at the start of the function

            // --- Ensure Safe Start Area ---
            if (c < config.START_AREA_COLS) {
                // Ensure ground row exists
                 if (!map[state.currentGroundRow]) map[state.currentGroundRow] = [];
                 map[state.currentGroundRow][c] = TILES.GRASS;

                if (state.currentGroundRow + 1 < mapRows) {
                     if (!map[state.currentGroundRow + 1]) map[state.currentGroundRow + 1] = [];
                     map[state.currentGroundRow + 1][c] = TILES.DIRT;
                }
                if (state.currentGroundRow + 2 < mapRows) {
                     if (!map[state.currentGroundRow + 2]) map[state.currentGroundRow + 2] = [];
                     map[state.currentGroundRow + 2][c] = TILES.DIRT;
                }
                // Add some coins in start area
                if (c > 5 && c % 2 === 0 && state.currentGroundRow - 1 > 0) {
                     if (!map[state.currentGroundRow - 1]) map[state.currentGroundRow - 1] = [];
                     map[state.currentGroundRow - 1][c] = TILES.COIN;
                }
                continue; // Skip other generation for start area columns
            }

            // --- Handle Platform Segments ---
            if (state.platformSegmentLength > 0) {
                state.platformSegmentLength--;
                // Tiles were placed when the platform started, just continue
                continue;
            }

            // --- Decide Elevation Change ---
            // Difficulty scaling uses the 'difficulty' parameter passed to the function
            // Apply difficulty scaling: Increase chance slightly
            const currentElevationChangeChance = Math.min(0.1, config.ELEVATION_CHANGE_CHANCE + difficulty * 0.05); // Cap at 10%
            if (Math.random() < currentElevationChangeChance && !state.inGap) {
                let change = (Math.random() < 0.5) ? -1 : 1;
                let nextGroundRow = state.currentGroundRow + change * Math.floor(1 + Math.random() * 2);
                state.currentGroundRow = Math.max(config.MIN_GROUND_ROW, Math.min(config.MAX_GROUND_ROW, nextGroundRow));
            }

            // --- Decide Gaps ---
            // Difficulty scaling uses the 'difficulty' parameter passed to the function
            if (state.inGap) {
                state.gapWidth--;
                if (state.gapWidth <= 0) {
                    state.inGap = false;
                }
            } else {
                // Apply difficulty scaling: Increase gap chance and max width slightly
                const currentGapChance = Math.min(0.3, config.GAP_CHANCE + difficulty * 0.1); // Cap chance at 30%
                if (Math.random() < currentGapChance) {
                    state.inGap = true;
                    const currentMaxGapWidth = Math.min(8, Math.floor(config.MAX_GAP_WIDTH + difficulty * 3)); // Cap max width at 8 tiles
                    const currentMinGapWidth = Math.min(currentMaxGapWidth - 1, Math.floor(config.MIN_GAP_WIDTH + difficulty * 1)); // Ensure min < max, cap min increase
                    state.gapWidth = currentMinGapWidth + Math.floor(Math.random() * (currentMaxGapWidth - currentMinGapWidth + 1));
                    state.gapWidth = Math.max(1, state.gapWidth); // Ensure gap is at least 1
                    state.gapWidth--; // Account for current column being the first gap tile
                }
            }

            // --- Place Ground Tiles ---
            if (!state.inGap) {
                 if (!map[state.currentGroundRow]) map[state.currentGroundRow] = [];
                 map[state.currentGroundRow][c] = TILES.GRASS;

                if (state.currentGroundRow + 1 < mapRows) {
                     if (!map[state.currentGroundRow + 1]) map[state.currentGroundRow + 1] = [];
                     map[state.currentGroundRow + 1][c] = TILES.DIRT;
                }
                 if (state.currentGroundRow + 2 < mapRows) {
                     if (!map[state.currentGroundRow + 2]) map[state.currentGroundRow + 2] = [];
                     map[state.currentGroundRow + 2][c] = TILES.DIRT;
                 }

                // Place Coins above ground
                // Difficulty scaling uses the 'difficulty' parameter passed to the function
                // Apply difficulty scaling: Decrease coin chance slightly
                const currentCoinChanceGround = Math.max(0.02, config.COIN_CHANCE_GROUND - difficulty * 0.05); // Floor at 2%
                if (Math.random() < currentCoinChanceGround && state.currentGroundRow - 1 > 0) {
                     if (!map[state.currentGroundRow - 1]) map[state.currentGroundRow - 1] = [];
                     map[state.currentGroundRow - 1][c] = TILES.COIN;
                }
            }

            // --- Decide Floating Platforms ---
            // Difficulty scaling uses the 'difficulty' parameter passed to the function
            // Apply difficulty scaling: Decrease platform spawn chance slightly
            const currentPlatformSpawnChance = Math.max(0.05, config.PLATFORM_SPAWN_CHANCE - difficulty * 0.1); // Floor at 5%
            if (c > config.START_AREA_COLS + 5 && state.platformSegmentLength <= 0 && Math.random() < currentPlatformSpawnChance) {
                // Apply difficulty scaling: Slightly shorter platforms at high difficulty? (Optional)
                const currentMaxPlatformLength = Math.max(config.MIN_PLATFORM_LENGTH + 1, Math.floor(config.MAX_PLATFORM_LENGTH - difficulty * 2));
                const currentMinPlatformLength = config.MIN_PLATFORM_LENGTH;
                let platformLength = currentMinPlatformLength + Math.floor(Math.random() * (currentMaxPlatformLength - currentMinPlatformLength + 1));
                platformLength = Math.max(currentMinPlatformLength, platformLength); // Ensure min length
                let basePlatformRow = state.currentGroundRow - 4 - Math.floor(Math.random() * 4); // Try placing above
                if (state.currentGroundRow <= config.MIN_GROUND_ROW + 2) { // If ground is high, place below
                     basePlatformRow = state.currentGroundRow + 3 + Math.floor(Math.random() * 2);
                }
                basePlatformRow = Math.max(1, Math.min(mapRows - 2, basePlatformRow)); // Clamp within bounds

                for (let pc = 0; pc < platformLength; pc++) {
                    let platformCol = c + pc;
                    // Ensure rows exist before placing tiles
                    if (!map[basePlatformRow]) map[basePlatformRow] = [];
                    map[basePlatformRow][platformCol] = TILES.GRASS;

                    if (basePlatformRow + 1 < mapRows) {
                         if (!map[basePlatformRow + 1]) map[basePlatformRow + 1] = [];
                         map[basePlatformRow + 1][platformCol] = TILES.DIRT;
                    }

                    // Place coins above platform
                    // Apply difficulty scaling: Decrease coin chance slightly
                    const currentCoinChancePlatform = Math.max(0.1, config.COIN_CHANCE_PLATFORM - difficulty * 0.15); // Floor at 10%
                    if (Math.random() < currentCoinChancePlatform && basePlatformRow - 1 > 0) {
                         if (!map[basePlatformRow - 1]) map[basePlatformRow - 1] = [];
                         map[basePlatformRow - 1][platformCol] = TILES.COIN; // Place coin
                    }
                }
                state.platformSegmentLength = platformLength - 1; // Set counter
            }
        }
        // this.state.generatedCols = endCol; // Removed chunk logic
    } // End of generateLevelMap method
};
// --- End Level Generator ---

// --- Image Loading ---
let images = {};
// *** IMPORTANT: Ensure this path 'ASSETS/' matches your folder name! ***
// Use absolute path for web deployment
const assetFolder = window.location.hostname === 'localhost' || window.location.protocol === 'file:' 
    ? 'ASSETS/' 
    : '/COCORun_Game/ASSETS/';
// Using final filenames from image_a2070a.jpg
let imagesToLoad = [
    { name: 'p_idle', src: assetFolder + 'coco_idle.png' }, { name: 'p_jump', src: assetFolder + 'coco_jump.png' },
    { name: 'p_fall', src: assetFolder + 'coco_fall.png' }, { name: 'p_run1', src: assetFolder + 'coco_platform_run_1.png' },
    { name: 'p_run2', src: assetFolder + 'coco_platform_run_2.png' }, { name: 'p_run3', src: assetFolder + 'coco_platform_run_3.png' },
    { name: 'p_run4', src: assetFolder + 'coco_platform_run_4.png' }, { name: 'p_run5', src: assetFolder + 'coco_platform_run_5.png' },
    { name: 'gameOverBanner', src: assetFolder + 'game_over_banner.png' }, { name: 'levelCompleteBanner', src: assetFolder + 'level_complete_banner.png'},
    { name: 'startButton', src: assetFolder + 'start_button.png' }, { name: 'tryAgainButton', src: assetFolder + 'try_again_button.png' },
    { name: 'titleLogo', src: assetFolder + 'title_logo_platformer.png' }, { name: 'sky', src: assetFolder + 'sky_image.png' },
    { name: 'landscape', src: assetFolder + 'coco_landscape_sprites.png' }, { name: 'numbers', src: assetFolder + 'number_sprites.png' },
    { name: 'nextLevelButton', src: assetFolder + 'next_level_button.png' } // Added next level button
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
    if (imagesLoaded === imagesToLoad.length) { console.log("All images loaded successfully! Attempting initialization..."); completeInitialization(); }
}

// --- Game Variables ---
let playerX, playerY, playerVx, playerVy;
let playerWidth, playerHeight; let onGround = false; let facingRight = true;
// Define collision hitbox dimensions globally
let playerCollisionWidth = 0; // Will be calculated in initializeGame
let playerCollisionXOffset = 0; // Will be calculated in initializeGame
let currentRunFrame = 0; const runFrameCount = 5; const runFrameDelay = 6; let runFrameTimer = 0;
let gameState = 'loading'; let frame = 0, score = 0, currentDifficulty = 0, currentLevelNumber = 1, levelTimer = LEVEL_TIME_LIMIT;
let startButtonArea = null, tryAgainButtonArea = null, nextLevelButtonArea = null; // Added nextLevelButtonArea
let titleLogoPos = {}, gameOverBannerPos = {}, levelCompleteBannerPos = {}, gameOverScorePos = {}, levelCompleteScorePos = {}, levelCompleteLevelPos = {}; // Added positions for level complete screen
let keyLeftPressed = false;
let keyRightPressed = false; // Keep the original declaration
let cameraX = 0;
let cameraY = 0; // Keep Y at 0 for now (no vertical scroll)
// let goalX = (MAP_COLS - 5) * TILE_WIDTH; // Removed fixed goal
// Removed duplicate declaration of keyRightPressed on the next line

// --- Utility Functions ---
function checkCollision(rect1, rect2) { if (!rect1 || !rect2 || rect1.width <= 0 || rect1.height <= 0 || rect2.width <= 0 || rect2.height <= 0) { return false; } return rect1.x < rect2.x + rect2.width && rect1.x + rect1.width > rect2.x && rect1.y < rect2.y + rect2.height && rect1.y + rect1.height > rect2.y; }
function drawScore(scoreValue, drawX, drawY, align = 'left') { if (!images.numbers) return; let scoreStr = scoreValue.toString(); let currentDrawX = drawX; let digitDrawInfo = []; let totalScoreWidth = 0; for (let i = 0; i < scoreStr.length; i++) { let digit = parseInt(scoreStr[i]); let drawWidth = 0; if (digit >= 0 && digit <= 9) { let sprite = numberSpriteData[digit]; if (sprite && sprite.h > 0) { let aspectRatio = sprite.w / sprite.h; drawWidth = numberDrawHeight * aspectRatio; } } digitDrawInfo.push(drawWidth); totalScoreWidth += drawWidth; } totalScoreWidth += Math.max(0, scoreStr.length - 1) * numberSpacing; if (align === 'center') { currentDrawX = drawX - totalScoreWidth / 2; } else if (align === 'right') { currentDrawX = drawX - totalScoreWidth; } for (let i = 0; i < scoreStr.length; i++) { let digit = parseInt(scoreStr[i]); if (digit >= 0 && digit <= 9) { let sprite = numberSpriteData[digit]; let drawWidth = digitDrawInfo[i]; if (sprite && drawWidth > 0) { ctx.drawImage(images.numbers, sprite.x, sprite.y, sprite.w, sprite.h, currentDrawX, drawY, drawWidth, numberDrawHeight); currentDrawX += drawWidth + numberSpacing; } } } }
function getTile(col, row) {
    // Check row bounds first
    if (row < 0 || row >= MAP_ROWS) { return TILES.EMPTY; }
    // Check if the column exists in the row array and is within generated bounds
    if (col >= 0 && col < MAP_COLS && levelMap[row] && levelMap[row][col] !== undefined) { // Use MAP_COLS for boundary check
        return levelMap[row][col];
    }
    return TILES.EMPTY; // Return empty for ungenerated or out-of-bounds columns
}
function isSolidTile(tileType) { return tileType === TILES.GRASS || tileType === TILES.DIRT; }
// --- End Tile Collision Helper ---

// --- Initialization Function ---
function completeInitialization() {
    console.log("Inside completeInitialization()...");
    // Robust Image Check
    const requiredImages = ['p_idle', 'p_jump', 'p_fall', 'p_run1', 'p_run2', 'p_run3', 'p_run4', 'p_run5', 'gameOverBanner', 'startButton', 'tryAgainButton', 'sky', 'landscape', 'numbers', 'titleLogo', 'levelCompleteBanner', 'nextLevelButton']; // Added nextLevelButton
    let allLoadedAndValid = true; for (let name of requiredImages) { if (!images[name] || !(images[name].naturalWidth > 0 && images[name].naturalHeight > 0)) { console.error(`Initialization Error: Image "${name}" invalid!`); allLoadedAndValid = false; } } if (!allLoadedAndValid) { gameState = 'criticalError'; if(ctx){ ctx.fillStyle='red'; ctx.font='12px sans-serif'; ctx.textAlign='center'; ctx.fillText('ERROR: Invalid image assets. Check console.', canvas.width/2, canvas.height/2); } console.error("Initialization failed: Invalid image assets."); return; } console.log("All required image objects seem valid.");

    // --- Don't start level 1 here, wait for user input ---
    // startLevel(1); // Removed initial call

    // Set Initial Game State to show Start Screen
    gameState = 'start';
    // Initialize variables that might be needed before level starts (score maybe?)
    score = 0; // Initialize score
    currentLevelNumber = 1; // Start at level 1
    // Other player/level variables will be set by startLevel when the button is clicked

    // Read Dimensions (using 50x50 based on user info)
    playerWidth = PLAYER_DRAW_WIDTH;
    playerHeight = PLAYER_DRAW_HEIGHT;
    obstacleWidth = TILE_WIDTH; obstacleNaturalHeight = TILE_HEIGHT; // Use tile size
    // Calculate and assign collision hitbox dimensions (now using global vars)
    playerCollisionWidth = TILE_WIDTH * PLAYER_COLLISION_WIDTH_FACTOR;
    playerCollisionXOffset = (playerWidth - playerCollisionWidth) / 2; // Center hitbox
    console.log(`Player dimensions set: ${playerWidth}x${playerHeight}, Collision Box Width: ${playerCollisionWidth}`);

    // Calculate UI positions and SIZES
    console.log("Calculating UI positions...");
    try {
        // Title Logo (Scaled)
        let titleScaleWidth = canvas.width * UI_TITLE_LOGO_SCALE_WIDTH_FACTOR; let titleAspect = images.titleLogo.naturalHeight / images.titleLogo.naturalWidth; titleLogoPos = { w: titleScaleWidth, h: titleScaleWidth * titleAspect, x: canvas.width / 2 - titleScaleWidth / 2, y: canvas.height * UI_TITLE_LOGO_Y_POS_FACTOR };
        // Start Button (Scaled, assume square aspect if needed)
        let buttonTargetWidth = UI_BUTTON_TARGET_WIDTH; let startAspect = images.startButton.naturalHeight > 0 ? images.startButton.naturalHeight / images.startButton.naturalWidth : 1; let startDrawWidth = buttonTargetWidth; let startDrawHeight = buttonTargetWidth * startAspect; startButtonArea = { x: canvas.width / 2 - startDrawWidth / 2, y: titleLogoPos.y + titleLogoPos.h + UI_START_BUTTON_Y_SPACING, width: startDrawWidth, height: startDrawHeight };
        // console.log("Calculated startButtonArea:", startButtonArea); // Remove DEBUG LOG
        // Game Over Banner (Scaled)
        let bannerScaleWidth = canvas.width * UI_BANNER_SCALE_WIDTH_FACTOR; let bannerAspect = images.gameOverBanner.naturalHeight / images.gameOverBanner.naturalWidth; gameOverBannerPos = { w: bannerScaleWidth, h: bannerScaleWidth * bannerAspect, x: canvas.width / 2 - bannerScaleWidth / 2, y: Math.max(UI_GAME_OVER_BANNER_MIN_Y_POS, (canvas.height * UI_GAME_OVER_BANNER_Y_POS_FACTOR) - (bannerScaleWidth * bannerAspect) / 2) };
        // Level Complete Banner (Scaled)
        let completeScaleWidth = canvas.width * UI_BANNER_SCALE_WIDTH_FACTOR; let completeAspect = images.levelCompleteBanner.naturalHeight / images.levelCompleteBanner.naturalWidth; levelCompleteBannerPos = { w: completeScaleWidth, h: completeScaleWidth * completeAspect, x: canvas.width / 2 - completeScaleWidth / 2, y: canvas.height * UI_LEVEL_COMPLETE_BANNER_Y_POS_FACTOR };
        // Try Again Button (Scaled, assume square aspect if needed)
        let tryAgainAspect = images.tryAgainButton.naturalHeight > 0 ? images.tryAgainButton.naturalHeight / images.tryAgainButton.naturalWidth : 1; let tryAgainDrawWidth = UI_BUTTON_TARGET_WIDTH; let tryAgainDrawHeight = UI_BUTTON_TARGET_WIDTH * tryAgainAspect; tryAgainButtonArea = { x: canvas.width / 2 - tryAgainDrawWidth / 2, y: gameOverBannerPos.y + gameOverBannerPos.h + UI_TRY_AGAIN_BUTTON_Y_SPACING, width: tryAgainDrawWidth, height: tryAgainDrawHeight };
        // Game Over Score Position
        gameOverScorePos.x = canvas.width / 2; gameOverScorePos.y = tryAgainButtonArea.y + tryAgainButtonArea.height + UI_GAME_OVER_SCORE_Y_SPACING;
        // Next Level Button (similar position to try again)
        let nextLevelAspect = images.nextLevelButton.naturalHeight > 0 ? images.nextLevelButton.naturalHeight / images.nextLevelButton.naturalWidth : 1;
        let nextLevelDrawWidth = UI_BUTTON_TARGET_WIDTH;
        let nextLevelDrawHeight = UI_BUTTON_TARGET_WIDTH * nextLevelAspect;
        // Position it below the level complete banner
        nextLevelButtonArea = { x: canvas.width / 2 - nextLevelDrawWidth / 2, y: levelCompleteBannerPos.y + levelCompleteBannerPos.h + UI_TRY_AGAIN_BUTTON_Y_SPACING, width: nextLevelDrawWidth, height: nextLevelDrawHeight };
        // Level Complete Score/Level Position (below next level button)
        levelCompleteScorePos.x = canvas.width / 2;
        levelCompleteScorePos.y = nextLevelButtonArea.y + nextLevelButtonArea.height + UI_GAME_OVER_SCORE_Y_SPACING;
        levelCompleteLevelPos.x = canvas.width / 2;
        levelCompleteLevelPos.y = levelCompleteScorePos.y + numberDrawHeight + 5; // Place level below score

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
        if (checkCollision({x: clickX, y: clickY, width:1, height:1}, startButtonArea)) {
             startLevel(1); // Start level 1 when the button is clicked
        }
    } // Start Game
    else if (gameState === 'gameOver' && tryAgainButtonArea) { if (checkCollision({x: clickX, y: clickY, width:1, height:1}, tryAgainButtonArea)) { startLevel(1); } } // Retry: Restart level 1
    else if (gameState === 'levelComplete' && nextLevelButtonArea) { if (checkCollision({x: clickX, y: clickY, width:1, height:1}, nextLevelButtonArea)) { startLevel(currentLevelNumber + 1); } } // Next Level
}

// --- NEW: Keyboard Handlers ---
function handleKeyDown(event) {
    const key = event.key.toLowerCase();
    if (key === 'a' || key === 'arrowleft') {
        keyLeftPressed = true;
    } else if (key === 'd' || key === 'arrowright') {
        keyRightPressed = true;
    }
    else if ((key === ' ' || key === 'w' || key === 'arrowup') && gameState === 'playing' && onGround) { // Jump with Space, W, or ArrowUp
        playerVy = jumpStrength;
        onGround = false;
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
        // --- Ceiling Collision ---
        else if (playerVy < 0) { // Check ceiling only if moving up
            let checkCeilingTileRow = Math.floor(nextY / TILE_HEIGHT);
            let tileAboveLeft = getTile(playerLeftTile, checkCeilingTileRow);
            let tileAboveRight = getTile(playerRightTile, checkCeilingTileRow);

            if (isSolidTile(tileAboveLeft) || isSolidTile(tileAboveRight)) {
                let ceilingLevelY = (checkCeilingTileRow + 1) * TILE_HEIGHT;
                if (playerY >= ceilingLevelY && nextY < ceilingLevelY) { // Check if moving into ceiling
                    nextY = ceilingLevelY; // Align bottom of ceiling tile
                    playerVy = 0; // Stop upward movement
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
        // Ceiling collision check added above, before wall checks

        // Update position
        playerY = nextY; // Update Y first (handles gravity/jump/ground collision)
        playerX = nextX; // Update X after wall collision checks

        // --- Level Complete Check (REMOVED for continuous play) ---
        // if (playerX + playerWidth / 2 > goalX) {
        //     gameState = 'levelComplete';
        // }

        // Animation Frame Update (Basic cycle, not linked to movement yet)
        runFrameTimer++; if (runFrameTimer >= runFrameDelay) { runFrameTimer = 0; currentRunFrame++; if (currentRunFrame >= runFrameCount) { currentRunFrame = 0; } }

        // Collectibles
        // --- Update Camera ---
        let targetCameraX = playerX - canvas.width * CAMERA_X_OFFSET_FACTOR; // Keep player offset from left
        // Clamp camera within map boundaries
        cameraX = Math.max(0, Math.min(targetCameraX, MAP_COLS * TILE_WIDTH - canvas.width)); // Re-clamp camera to map bounds
        // cameraY = ... // Add vertical clamping if needed later

        // --- Update Level Timer ---
        levelTimer -= 1 / 60; // Assuming 60 FPS, decrement timer each frame
        if (levelTimer <= 0 && gameState === 'playing') { // Check if already game over
            levelTimer = 0;
            gameState = 'gameOver'; // Timer running out is Game Over
            console.log("Game Over! Timer ran out. Final Score:", score);
            submitScore(); // Call submission function
        }

        // --- Difficulty is now set per level, not continuously calculated ---
        // const difficultyIncreaseRate = 0.00005;
        // const maxDifficulty = 0.9;
        // currentDifficulty = Math.min(maxDifficulty, playerX * difficultyIncreaseRate);

        // --- Chunk Generation Removed ---
        // const generationThreshold = (LevelGenerator.state.generatedCols - LevelGenerator.config.CHUNK_WIDTH) * TILE_WIDTH;
        // if (cameraX > generationThreshold) {
        //      console.log(`Generating new chunk. Current Difficulty: ${currentDifficulty.toFixed(3)}`);
        //      LevelGenerator.generateChunk(levelMap, MAP_ROWS, LevelGenerator.state.generatedCols, currentDifficulty);
        // }

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

        // --- Level End Check (Reaching Right Edge) ---
        if (playerX >= MAP_COLS * TILE_WIDTH && gameState === 'playing') {
            gameState = 'levelComplete';
            levelTimer = 0; // Ensure timer shows 0 on complete screen
        }
        // --- Fall off screen check (Only if level not complete and not already game over) ---
        else if (playerY > canvas.height + playerHeight && gameState === 'playing') {
            gameState = 'gameOver'; // Player fell off
            console.log("Game Over! Player fell off. Final Score:", score);
            submitScore(); // Call submission function
        }
        // Removed duplicate fall check and TODO

     } // End update playing state

     // --- Score Submission Function ---
     async function submitScore() {
         if (typeof score !== 'number') {
             console.error("Invalid score type for submission:", score);
             return;
         }
         try {
             // Check if we're in the parent window (leaderboard system available)
             if (window.parent && window.parent.leaderboardManager) {
                 // Get player name - use Twitter handle if connected, otherwise prompt
                 let playerName = 'Anonymous';
                 if (window.parent.twitterManager && window.parent.twitterManager.connectedUsername) {
                     playerName = window.parent.twitterManager.connectedUsername;
                 } else {
                     playerName = prompt('Enter your name for the leaderboard:', 'Anonymous') || 'Anonymous';
                 }
                 
                 // Submit to the backend API via the leaderboard manager
                 const result = await window.parent.leaderboardManager.submitScore(
                     'coco-run', 
                     playerName, 
                     score, 
                     currentLevelNumber, 
                     Math.floor((LEVEL_TIME_LIMIT - levelTimer))
                 );
                 
                 if (result && result.success) {
                     console.log(`Score ${score} submitted successfully! Rank: ${result.rank}`);
                     // Show rank notification
                     if (result.rank <= 10) {
                         alert(`🎉 Congratulations! You're ranked #${result.rank} on the leaderboard!`);
                     }
                 } else {
                     console.log(`Score ${score} submitted via fallback system for COCO Run`);
                 }
             } else {
                 // Fallback to local storage if leaderboard system not available
                 const key = 'coco-run-leaderboard';
                 let scores = localStorage.getItem(key);
                 scores = scores ? JSON.parse(scores) : [];
                 
                 const newScore = {
                     username: 'Anonymous',
                     score: score,
                     created_at: new Date().toLocaleDateString(),
                     timestamp: Date.now()
                 };
                 
                 scores.push(newScore);
                 scores = scores.sort((a, b) => b.score - a.score).slice(0, 50); // Keep top 50
                 localStorage.setItem(key, JSON.stringify(scores));
                 
                 console.log(`Score ${score} saved locally for COCO Run (Level ${currentLevelNumber})`);
             }
         } catch (error) {
             console.error("Error during score submission:", error);
         }
     }
     // --- End Score Submission Function ---

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
         // Draw Score, Level, and Timer
         drawScore(score, SCORE_X_POS, SCORE_Y_POS, 'left');
         drawText(`Level: ${currentLevelNumber}`, LEVEL_INDICATOR_X_POS, LEVEL_INDICATOR_Y_POS, 'right', '16px sans-serif', 'white');
         drawText(`Time: ${Math.ceil(levelTimer)}`, TIMER_X_POS, TIMER_Y_POS, 'center', '16px sans-serif', 'white');

     } else {
         // --- Draw Static UI (Start, Game Over, Level Complete, Loading, Error) ---
         if (gameState === 'start') {
             if (images.titleLogo && titleLogoPos.w > 0) { ctx.drawImage(images.titleLogo, titleLogoPos.x, titleLogoPos.y, titleLogoPos.w, titleLogoPos.h); }
             if (images.startButton && startButtonArea) { ctx.drawImage(images.startButton, startButtonArea.x, startButtonArea.y, startButtonArea.width, startButtonArea.height); }
         } else if (gameState === 'gameOver') { // Game Over Screen
             if (images.gameOverBanner && gameOverBannerPos.w > 0) { ctx.drawImage(images.gameOverBanner, gameOverBannerPos.x, gameOverBannerPos.y, gameOverBannerPos.w, gameOverBannerPos.h); }
             if (images.tryAgainButton && tryAgainButtonArea) {
                 drawScore(score, gameOverScorePos.x, gameOverScorePos.y, 'center'); // Show final score
                 ctx.drawImage(images.tryAgainButton, tryAgainButtonArea.x, tryAgainButtonArea.y, tryAgainButtonArea.width, tryAgainButtonArea.height);
             }
         } else if (gameState === 'levelComplete') { // Level Complete Screen
                    if (images.levelCompleteBanner && levelCompleteBannerPos.w > 0) { ctx.drawImage(images.levelCompleteBanner, levelCompleteBannerPos.x, levelCompleteBannerPos.y, levelCompleteBannerPos.w, levelCompleteBannerPos.h); }
                    if (images.nextLevelButton && nextLevelButtonArea) {
                        drawScore(score, levelCompleteScorePos.x, levelCompleteScorePos.y, 'center'); // Show score
                        drawText(`Level ${currentLevelNumber} Complete!`, levelCompleteLevelPos.x, levelCompleteLevelPos.y, 'center', '20px sans-serif', 'white'); // Show level completed
                        ctx.drawImage(images.nextLevelButton, nextLevelButtonArea.x, nextLevelButtonArea.y, nextLevelButtonArea.width, nextLevelButtonArea.height); // Show next level button
                    }
         } else if (gameState === 'loading') {
              ctx.fillStyle = 'black'; ctx.font = '20px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('Loading assets...', canvas.width / 2, canvas.height / 2);
         } else if (gameState === 'criticalError') {
              ctx.fillStyle='red'; ctx.font='12px sans-serif'; ctx.textAlign='center'; ctx.fillText('ERROR: See console.', canvas.width/2, canvas.height/2);
         }
     }

     requestAnimationFrame(gameLoop);
}

// --- NEW: Function to Start/Restart a Level ---
function startLevel(levelNum) {
    console.log(`Starting Level ${levelNum}...`);
    currentLevelNumber = levelNum;
    gameState = 'playing'; // Set state to playing

    // Calculate difficulty for this level (e.g., linear increase, capped)
    const difficultyIncreasePerLevel = 0.08; // How much harder each level gets
    const maxLevelDifficulty = 0.9;
    currentDifficulty = Math.min(maxLevelDifficulty, (levelNum - 1) * difficultyIncreasePerLevel);

    // Generate the map for the current level
    LevelGenerator.generateLevelMap(levelMap, MAP_ROWS, MAP_COLS, currentDifficulty, levelNum);

    // Reset player state
    playerX = canvas.width / 4; // Reset X position
    // Reset player state consistently for every level start
    playerX = canvas.width / 4;       // Reset X position
    playerY = canvas.height / 2;      // Drop in from middle
    playerVx = 0;
    playerVy = 0;
    onGround = false;
    facingRight = true;
    cameraX = 0;                      // Reset camera
    currentRunFrame = 0;              // Reset animation frame
    runFrameTimer = 0;

    // Reset level timer and frame count
    levelTimer = LEVEL_TIME_LIMIT;
    frame = 0;
    // Reset score only if starting level 1
    if (levelNum === 1) {
        score = 0;
    }

    console.log(`Level ${levelNum} started. Difficulty: ${currentDifficulty.toFixed(3)}`);
}

// --- NEW: Helper to draw text ---
function drawText(text, x, y, align = 'left', font = '16px sans-serif', color = 'black') {
    ctx.fillStyle = color;
    ctx.font = font;
    ctx.textAlign = align;
    ctx.fillText(text, x, y);
}

// --- Function to Draw Level from Map ---
function drawLevel() {
    if (!images.landscape) { console.error("drawLevel Error: Landscape image not loaded."); return; }

    // Calculate visible column range based on camera
    const startCol = Math.floor(cameraX / TILE_WIDTH);
    const endCol = Math.min( // Use fixed MAP_COLS for drawing bounds now
        startCol + Math.ceil(canvas.width / TILE_WIDTH) + 1,
        MAP_COLS // Draw up to the end of the fixed map
    );

    for (let r = 0; r < MAP_ROWS; r++) {
        for (let c = startCol; c < endCol; c++) {
            // Use getTile which handles checks for undefined columns/rows (though less critical with fixed map)
            let tileType = getTile(c, r);
            if (tileType === TILES.EMPTY) continue;

            let spriteInfo = tileSpriteData[tileType];
            if (!spriteInfo) continue; // Should not happen if TILES enum is correct

            let destX = c * TILE_WIDTH;
            let destY = r * TILE_HEIGHT;

            try {
                // Draw the tile
                ctx.drawImage(
                    images.landscape,
                    spriteInfo.sx, spriteInfo.sy, TILE_WIDTH, TILE_HEIGHT, // Source rect
                    destX, destY, TILE_WIDTH, TILE_HEIGHT                  // Destination rect
                );
            } catch (e) {
                console.error(`RUNTIME Error drawing tile type ${tileType} at col ${c}, row ${r}`, e);
                gameState = 'criticalError'; // Stop the game on drawing error
                return; // Exit drawLevel immediately
            }
        }
    }
}

// --- Initial message while loading ---
if (ctx) { ctx.fillStyle = 'black'; ctx.font = '20px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('Loading assets...', canvas.width / 2, canvas.height / 2); }
else { console.error("Canvas context not available."); }

// Note: gameLoop() starts inside initializeGame() after images load.
