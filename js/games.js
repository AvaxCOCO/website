/*
 * $COCO - Games JavaScript
 * Interactive games and mini-games
 */

// ===== Game State Management =====
const GameState = {
    currentGame: null,
    score: 0,
    highScores: JSON.parse(localStorage.getItem('cocoHighScores')) || {},
    isPlaying: false
};

// ===== Initialize Games =====
document.addEventListener('DOMContentLoaded', function() {
    initGameButtons();
    loadHighScores();
    createGameModal();
});

// ===== Game Modal Creation =====
function createGameModal() {
    const modal = document.createElement('div');
    modal.id = 'game-modal';
    modal.className = 'game-modal';
    modal.innerHTML = `
        <div class="game-modal-content">
            <div class="game-modal-header">
                <h3 id="game-title">$COCO Game</h3>
                <button class="game-close-btn" onclick="closeGameModal()">&times;</button>
            </div>
            <div class="game-modal-body">
                <div id="game-container"></div>
                <div class="game-controls">
                    <div class="game-score">
                        <span>Score: <span id="current-score">0</span></span>
                        <span>High Score: <span id="high-score">0</span></span>
                    </div>
                    <div class="game-buttons">
                        <button class="btn btn-primary" onclick="startCurrentGame()">Start Game</button>
                        <button class="btn btn-secondary" onclick="resetCurrentGame()">Reset</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Add modal styles
    modal.style.cssText = `
        display: none;
        position: fixed;
        z-index: 10000;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.8);
        backdrop-filter: blur(5px);
    `;
    
    document.body.appendChild(modal);
}

// ===== Game Button Initialization =====
function initGameButtons() {
    const gameButtons = document.querySelectorAll('[data-game]');
    
    gameButtons.forEach(button => {
        button.addEventListener('click', function() {
            const gameType = this.dataset.game;
            openGameModal(gameType);
        });
    });
}

// ===== Modal Management =====
function openGameModal(gameType) {
    const modal = document.getElementById('game-modal');
    const title = document.getElementById('game-title');
    const container = document.getElementById('game-container');
    
    // Clear previous game
    container.innerHTML = '';
    
    // Set game title and initialize
    switch(gameType) {
        case 'catch':
            title.textContent = '$COCO Catch Game';
            initCatchGame(container);
            break;
        case 'memory':
            title.textContent = '$COCO Memory Game';
            initMemoryGame(container);
            break;
        case 'runner':
            title.textContent = '$COCO Runner';
            initRunnerGame(container);
            break;
        case 'puzzle':
            title.textContent = '$COCO Puzzle';
            initPuzzleGame(container);
            break;
        default:
            title.textContent = '$COCO Game';
            container.innerHTML = '<p>Game not found!</p>';
    }
    
    GameState.currentGame = gameType;
    updateHighScore();
    modal.style.display = 'block';
    
    // Track game open event
    if (window.CocoApp && window.CocoApp.trackEvent) {
        window.CocoApp.trackEvent('game_opened', { game_type: gameType });
    }
}

function closeGameModal() {
    const modal = document.getElementById('game-modal');
    modal.style.display = 'none';
    
    // Stop any running games
    if (GameState.isPlaying) {
        stopCurrentGame();
    }
    
    GameState.currentGame = null;
}

// ===== Game Control Functions =====
function startCurrentGame() {
    if (!GameState.currentGame) return;
    
    GameState.isPlaying = true;
    GameState.score = 0;
    updateScore();
    
    switch(GameState.currentGame) {
        case 'catch':
            startCatchGame();
            break;
        case 'memory':
            startMemoryGame();
            break;
        case 'runner':
            startRunnerGame();
            break;
        case 'puzzle':
            startPuzzleGame();
            break;
    }
    
    // Track game start event
    if (window.CocoApp && window.CocoApp.trackEvent) {
        window.CocoApp.trackEvent('game_started', { game_type: GameState.currentGame });
    }
}

function stopCurrentGame() {
    GameState.isPlaying = false;
    
    // Game-specific stop logic
    if (window.gameInterval) {
        clearInterval(window.gameInterval);
    }
    if (window.gameAnimationFrame) {
        cancelAnimationFrame(window.gameAnimationFrame);
    }
}

function resetCurrentGame() {
    stopCurrentGame();
    GameState.score = 0;
    updateScore();
    
    // Reinitialize current game
    if (GameState.currentGame) {
        const container = document.getElementById('game-container');
        openGameModal(GameState.currentGame);
    }
}

// ===== Score Management =====
function updateScore(points = 0) {
    GameState.score += points;
    document.getElementById('current-score').textContent = GameState.score;
    
    // Check for new high score
    const currentHigh = GameState.highScores[GameState.currentGame] || 0;
    if (GameState.score > currentHigh) {
        GameState.highScores[GameState.currentGame] = GameState.score;
        saveHighScores();
        updateHighScore();
        
        // Show celebration
        if (window.CocoApp && window.CocoApp.showNotification) {
            window.CocoApp.showNotification('New High Score! 🎉', 'success');
        }
    }
}

function updateHighScore() {
    const highScore = GameState.highScores[GameState.currentGame] || 0;
    document.getElementById('high-score').textContent = highScore;
}

function saveHighScores() {
    localStorage.setItem('cocoHighScores', JSON.stringify(GameState.highScores));
}

function loadHighScores() {
    const saved = localStorage.getItem('cocoHighScores');
    if (saved) {
        GameState.highScores = JSON.parse(saved);
    }
}

// ===== CATCH GAME =====
function initCatchGame(container) {
    container.innerHTML = `
        <div class="catch-game">
            <div class="catch-game-area" id="catch-area">
                <div class="coco-catcher" id="catcher"></div>
            </div>
            <div class="catch-instructions">
                <p>Use arrow keys or mouse to move $COCO and catch the falling tokens!</p>
            </div>
        </div>
    `;
    
    // Add game styles
    const style = document.createElement('style');
    style.textContent = `
        .catch-game-area {
            width: 100%;
            height: 400px;
            background: linear-gradient(180deg, var(--background-dark), var(--background-light));
            border: 2px solid var(--primary-color);
            border-radius: 10px;
            position: relative;
            overflow: hidden;
        }
        .coco-catcher {
            width: 60px;
            height: 60px;
            background: var(--primary-color);
            border-radius: 50%;
            position: absolute;
            bottom: 10px;
            left: 50%;
            transform: translateX(-50%);
            transition: left 0.1s ease;
        }
        .falling-token {
            width: 30px;
            height: 30px;
            background: var(--secondary-color);
            border-radius: 50%;
            position: absolute;
            top: -30px;
        }
        .catch-instructions {
            text-align: center;
            margin-top: 10px;
            color: var(--text-muted);
        }
    `;
    document.head.appendChild(style);
}

function startCatchGame() {
    const catcher = document.getElementById('catcher');
    const gameArea = document.getElementById('catch-area');
    let catcherPosition = 50; // percentage
    let tokens = [];
    
    // Catcher movement
    function moveCatcher(direction) {
        if (direction === 'left' && catcherPosition > 5) {
            catcherPosition -= 5;
        } else if (direction === 'right' && catcherPosition < 95) {
            catcherPosition += 5;
        }
        catcher.style.left = catcherPosition + '%';
    }
    
    // Keyboard controls
    document.addEventListener('keydown', function(e) {
        if (!GameState.isPlaying) return;
        
        switch(e.key) {
            case 'ArrowLeft':
                e.preventDefault();
                moveCatcher('left');
                break;
            case 'ArrowRight':
                e.preventDefault();
                moveCatcher('right');
                break;
        }
    });
    
    // Mouse controls
    gameArea.addEventListener('mousemove', function(e) {
        if (!GameState.isPlaying) return;
        
        const rect = gameArea.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        catcherPosition = (mouseX / rect.width) * 100;
        catcherPosition = Math.max(5, Math.min(95, catcherPosition));
        catcher.style.left = catcherPosition + '%';
    });
    
    // Create falling tokens
    function createToken() {
        const token = document.createElement('div');
        token.className = 'falling-token';
        token.style.left = Math.random() * 90 + '%';
        gameArea.appendChild(token);
        tokens.push({
            element: token,
            y: -30,
            speed: 2 + Math.random() * 3
        });
    }
    
    // Game loop
    function gameLoop() {
        if (!GameState.isPlaying) return;
        
        // Move tokens
        tokens.forEach((token, index) => {
            token.y += token.speed;
            token.element.style.top = token.y + 'px';
            
            // Check collision with catcher
            const tokenRect = token.element.getBoundingClientRect();
            const catcherRect = catcher.getBoundingClientRect();
            
            if (tokenRect.bottom >= catcherRect.top &&
                tokenRect.left < catcherRect.right &&
                tokenRect.right > catcherRect.left) {
                // Caught!
                updateScore(10);
                token.element.remove();
                tokens.splice(index, 1);
            }
            
            // Remove if off screen
            if (token.y > 400) {
                token.element.remove();
                tokens.splice(index, 1);
            }
        });
        
        // Create new tokens randomly
        if (Math.random() < 0.02) {
            createToken();
        }
        
        window.gameAnimationFrame = requestAnimationFrame(gameLoop);
    }
    
    gameLoop();
}

// ===== MEMORY GAME =====
function initMemoryGame(container) {
    container.innerHTML = `
        <div class="memory-game">
            <div class="memory-grid" id="memory-grid"></div>
            <div class="memory-instructions">
                <p>Match the $COCO pairs! Click cards to flip them.</p>
            </div>
        </div>
    `;
    
    // Add styles
    const style = document.createElement('style');
    style.textContent = `
        .memory-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 10px;
            max-width: 400px;
            margin: 0 auto;
        }
        .memory-card {
            width: 80px;
            height: 80px;
            background: var(--background-light);
            border: 2px solid var(--primary-color);
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.3s ease;
            font-size: 24px;
        }
        .memory-card.flipped {
            background: var(--primary-color);
            transform: rotateY(180deg);
        }
        .memory-card.matched {
            background: var(--success-color);
            cursor: default;
        }
        .memory-instructions {
            text-align: center;
            margin-top: 20px;
            color: var(--text-muted);
        }
    `;
    document.head.appendChild(style);
}

function startMemoryGame() {
    const grid = document.getElementById('memory-grid');
    const symbols = ['🦩', '🚀', '💎', '⭐', '🎯', '🔥', '💰', '🎪'];
    const cards = [...symbols, ...symbols].sort(() => Math.random() - 0.5);
    let flippedCards = [];
    let matchedPairs = 0;
    
    grid.innerHTML = '';
    
    cards.forEach((symbol, index) => {
        const card = document.createElement('div');
        card.className = 'memory-card';
        card.dataset.symbol = symbol;
        card.dataset.index = index;
        card.textContent = '?';
        
        card.addEventListener('click', function() {
            if (flippedCards.length < 2 && !this.classList.contains('flipped') && !this.classList.contains('matched')) {
                this.classList.add('flipped');
                this.textContent = symbol;
                flippedCards.push(this);
                
                if (flippedCards.length === 2) {
                    setTimeout(checkMatch, 1000);
                }
            }
        });
        
        grid.appendChild(card);
    });
    
    function checkMatch() {
        const [card1, card2] = flippedCards;
        
        if (card1.dataset.symbol === card2.dataset.symbol) {
            card1.classList.add('matched');
            card2.classList.add('matched');
            matchedPairs++;
            updateScore(20);
            
            if (matchedPairs === symbols.length) {
                setTimeout(() => {
                    if (window.CocoApp && window.CocoApp.showNotification) {
                        window.CocoApp.showNotification('Congratulations! You won! 🎉', 'success');
                    }
                }, 500);
            }
        } else {
            card1.classList.remove('flipped');
            card2.classList.remove('flipped');
            card1.textContent = '?';
            card2.textContent = '?';
        }
        
        flippedCards = [];
    }
}

// ===== RUNNER GAME =====
function initRunnerGame(container) {
    container.innerHTML = `
        <div class="runner-game">
            <div class="runner-game-area" id="runner-area">
                <div class="runner-coco" id="runner-coco">🦩</div>
            </div>
            <div class="runner-instructions">
                <p>Press SPACE to jump over obstacles!</p>
            </div>
        </div>
    `;
    
    // Add styles
    const style = document.createElement('style');
    style.textContent = `
        .runner-game-area {
            width: 100%;
            height: 300px;
            background: linear-gradient(180deg, #87CEEB, #90EE90);
            border: 2px solid var(--primary-color);
            border-radius: 10px;
            position: relative;
            overflow: hidden;
        }
        .runner-coco {
            width: 50px;
            height: 50px;
            position: absolute;
            bottom: 50px;
            left: 50px;
            font-size: 40px;
            transition: bottom 0.3s ease;
        }
        .runner-obstacle {
            width: 30px;
            height: 50px;
            background: var(--error-color);
            position: absolute;
            bottom: 50px;
            right: -30px;
        }
        .runner-instructions {
            text-align: center;
            margin-top: 10px;
            color: var(--text-muted);
        }
    `;
    document.head.appendChild(style);
}

function startRunnerGame() {
    const gameArea = document.getElementById('runner-area');
    const coco = document.getElementById('runner-coco');
    let isJumping = false;
    let obstacles = [];
    let gameSpeed = 2;
    
    // Jump function
    function jump() {
        if (isJumping) return;
        
        isJumping = true;
        coco.style.bottom = '150px';
        
        setTimeout(() => {
            coco.style.bottom = '50px';
            setTimeout(() => {
                isJumping = false;
            }, 300);
        }, 300);
    }
    
    // Controls
    document.addEventListener('keydown', function(e) {
        if (!GameState.isPlaying) return;
        
        if (e.code === 'Space') {
            e.preventDefault();
            jump();
        }
    });
    
    // Create obstacles
    function createObstacle() {
        const obstacle = document.createElement('div');
        obstacle.className = 'runner-obstacle';
        gameArea.appendChild(obstacle);
        obstacles.push({
            element: obstacle,
            x: gameArea.offsetWidth
        });
    }
    
    // Game loop
    function runnerLoop() {
        if (!GameState.isPlaying) return;
        
        // Move obstacles
        obstacles.forEach((obstacle, index) => {
            obstacle.x -= gameSpeed;
            obstacle.element.style.right = (gameArea.offsetWidth - obstacle.x) + 'px';
            
            // Check collision
            if (obstacle.x < 100 && obstacle.x > 50 && !isJumping) {
                // Game over
                GameState.isPlaying = false;
                if (window.CocoApp && window.CocoApp.showNotification) {
                    window.CocoApp.showNotification('Game Over! Try again!', 'error');
                }
                return;
            }
            
            // Remove off-screen obstacles
            if (obstacle.x < -30) {
                obstacle.element.remove();
                obstacles.splice(index, 1);
                updateScore(5);
            }
        });
        
        // Create new obstacles
        if (Math.random() < 0.005) {
            createObstacle();
        }
        
        // Increase speed gradually
        gameSpeed += 0.001;
        
        window.gameAnimationFrame = requestAnimationFrame(runnerLoop);
    }
    
    runnerLoop();
}

// ===== PUZZLE GAME =====
function initPuzzleGame(container) {
    container.innerHTML = `
        <div class="puzzle-game">
            <div class="puzzle-grid" id="puzzle-grid"></div>
            <div class="puzzle-instructions">
                <p>Arrange the pieces to complete the $COCO image!</p>
            </div>
        </div>
    `;
    
    // Add styles
    const style = document.createElement('style');
    style.textContent = `
        .puzzle-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 2px;
            max-width: 300px;
            margin: 0 auto;
            border: 2px solid var(--primary-color);
            border-radius: 10px;
            overflow: hidden;
        }
        .puzzle-piece {
            width: 98px;
            height: 98px;
            background: var(--background-light);
            border: 1px solid var(--primary-color);
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            font-size: 24px;
            transition: all 0.3s ease;
        }
        .puzzle-piece:hover {
            background: var(--primary-color);
        }
        .puzzle-piece.empty {
            background: var(--background-dark);
        }
        .puzzle-instructions {
            text-align: center;
            margin-top: 20px;
            color: var(--text-muted);
        }
    `;
    document.head.appendChild(style);
}

function startPuzzleGame() {
    const grid = document.getElementById('puzzle-grid');
    const pieces = ['🦩', '💎', '🚀', '⭐', '🎯', '🔥', '💰', '🎪', ''];
    let currentState = [...pieces].sort(() => Math.random() - 0.5);
    let emptyIndex = currentState.indexOf('');
    
    function renderGrid() {
        grid.innerHTML = '';
        currentState.forEach((piece, index) => {
            const div = document.createElement('div');
            div.className = piece === '' ? 'puzzle-piece empty' : 'puzzle-piece';
            div.textContent = piece;
            div.addEventListener('click', () => movePiece(index));
            grid.appendChild(div);
        });
    }
    
    function movePiece(index) {
        const row = Math.floor(index / 3);
        const col = index % 3;
        const emptyRow = Math.floor(emptyIndex / 3);
        const emptyCol = emptyIndex % 3;
        
        // Check if piece is adjacent to empty space
        if ((Math.abs(row - emptyRow) === 1 && col === emptyCol) ||
            (Math.abs(col - emptyCol) === 1 && row === emptyRow)) {
            
            // Swap pieces
            [currentState[index], currentState[emptyIndex]] = [currentState[emptyIndex], currentState[index]];
            emptyIndex = index;
            renderGrid();
            
            // Check if solved
            if (JSON.stringify(currentState) === JSON.stringify(pieces)) {
                updateScore(100);
                if (window.CocoApp && window.CocoApp.showNotification) {
                    window.CocoApp.showNotification('Puzzle solved! 🎉', 'success');
                }
            }
        }
    }
    
    renderGrid();
}

// ===== Export Game Functions =====
window.CocoGames = {
    openGameModal,
    closeGameModal,
    startCurrentGame,
    resetCurrentGame,
    GameState
};
