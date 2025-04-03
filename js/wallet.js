/**
 * $COCO - The Pink Ostrich of AVAX
 * Wallet Integration JavaScript File using thirdweb
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize wallet connection
    initThirdwebConnection();
});

/**
 * Initialize thirdweb wallet connection
 */
function initThirdwebConnection() {
    // Get all wallet connect buttons
    const connectButtons = document.querySelectorAll('#connect-wallet-btn, #mobile-connect-wallet-btn, #how-to-buy-connect-btn');
    
    // Add click event to all buttons
    connectButtons.forEach(button => {
        button.addEventListener('click', openThirdwebModal);
    });
    
    // Check if user was previously connected
    checkPreviousConnection();
}

/**
 * Open thirdweb connect modal
 */
function openThirdwebModal() {
    // Show loading state on buttons
    showWalletLoading();
    
    try {
        // Initialize thirdweb Connect
        const connect = new ThirdwebConnect.ConnectWallet({
            appName: "$COCO - The Pink Ostrich of AVAX",
            chainId: 43114, // Avalanche C-Chain
            supportedChains: [
                {
                    chainId: 43114,
                    rpcUrl: "https://api.avax.network/ext/bc/C/rpc",
                    chainName: "Avalanche C-Chain",
                    nativeCurrency: {
                        name: "AVAX",
                        symbol: "AVAX",
                        decimals: 18
                    },
                    blockExplorer: "https://snowtrace.io"
                }
            ]
        });
        
        // Open the modal
        connect.openModal();
        
        // Listen for connection
        connect.on("connect", (walletAddress, provider) => {
            console.log("Connected to wallet:", walletAddress);
            handleSuccessfulConnection(walletAddress);
            
            // Store connection info
            localStorage.setItem('walletConnected', 'true');
            localStorage.setItem('walletAddress', walletAddress);
        });
        
        // Listen for disconnection
        connect.on("disconnect", () => {
            console.log("Disconnected from wallet");
            handleDisconnection();
            
            // Clear connection info
            localStorage.removeItem('walletConnected');
            localStorage.removeItem('walletAddress');
        });
        
        // Listen for chain change
        connect.on("chainChanged", (chainId) => {
            console.log("Chain changed to:", chainId);
            
            // Check if chain is Avalanche
            if (chainId !== 43114) {
                showSwitchNetworkNotification();
            }
        });
        
        // Listen for error
        connect.on("error", (error) => {
            console.error("Wallet connection error:", error);
            showWalletError(error.message);
            hideWalletLoading();
        });
    } catch (error) {
        console.error("Error initializing thirdweb:", error);
        showWalletError("Failed to initialize wallet connection");
        hideWalletLoading();
    }
}

/**
 * Check if user was previously connected
 */
function checkPreviousConnection() {
    const walletConnected = localStorage.getItem('walletConnected');
    const walletAddress = localStorage.getItem('walletAddress');
    
    if (walletConnected === 'true' && walletAddress) {
        handleSuccessfulConnection(walletAddress);
    }
}

/**
 * Handle successful wallet connection
 * @param {string} account - Connected wallet address
 */
function handleSuccessfulConnection(account) {
    // Format address for display (0x1234...5678)
    const formattedAddress = `${account.substring(0, 6)}...${account.substring(account.length - 4)}`;
    
    // Update all connect wallet buttons
    const connectButtons = document.querySelectorAll('#connect-wallet-btn, #mobile-connect-wallet-btn, #how-to-buy-connect-btn');
    
    connectButtons.forEach(button => {
        button.textContent = formattedAddress;
        button.classList.add('connected');
    });
    
    // Hide loading state
    hideWalletLoading();
    
    // Show success notification
    showNotification('Wallet connected successfully!', 'success');
}

/**
 * Handle wallet disconnection
 */
function handleDisconnection() {
    // Update all connect wallet buttons
    const connectButtons = document.querySelectorAll('#connect-wallet-btn, #mobile-connect-wallet-btn, #how-to-buy-connect-btn');
    
    connectButtons.forEach(button => {
        button.textContent = 'Connect Wallet';
        button.classList.remove('connected');
    });
    
    // Show notification
    showNotification('Wallet disconnected', 'info');
}

/**
 * Show wallet loading state
 */
function showWalletLoading() {
    // Get all connect wallet buttons
    const connectButtons = document.querySelectorAll('#connect-wallet-btn, #mobile-connect-wallet-btn, #how-to-buy-connect-btn');
    
    // Update button text and add loading class
    connectButtons.forEach(button => {
        const originalText = button.textContent;
        button.setAttribute('data-original-text', originalText);
        button.textContent = 'Connecting...';
        button.classList.add('loading');
        button.disabled = true;
    });
}

/**
 * Hide wallet loading state
 */
function hideWalletLoading() {
    // Get all connect wallet buttons
    const connectButtons = document.querySelectorAll('#connect-wallet-btn, #mobile-connect-wallet-btn, #how-to-buy-connect-btn');
    
    // Restore original button text and remove loading class
    connectButtons.forEach(button => {
        const originalText = button.getAttribute('data-original-text');
        if (originalText && !button.classList.contains('connected')) {
            button.textContent = originalText;
        }
        button.classList.remove('loading');
        button.disabled = false;
    });
}

/**
 * Show switch network notification
 */
function showSwitchNetworkNotification() {
    showNotification('Please switch to the Avalanche C-Chain network', 'warning');
}

/**
 * Show wallet error
 * @param {string} message - Error message
 */
function showWalletError(message) {
    showNotification(message, 'error');
}

/**
 * Show notification
 * @param {string} message - Notification message
 * @param {string} type - Notification type (success, error, info, warning)
 */
function showNotification(message, type) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-message">${message}</span>
            <button class="notification-close">&times;</button>
        </div>
    `;
    
    // Add to body
    document.body.appendChild(notification);
    
    // Add event listener to close button
    const closeButton = notification.querySelector('.notification-close');
    closeButton.addEventListener('click', () => {
        notification.remove();
    });
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        notification.classList.add('notification-hide');
        
        // Remove from DOM after animation completes
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 5000);
}