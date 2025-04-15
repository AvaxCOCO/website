// js/wallet.js
/**
 * $COCO - The Pink Ostrich of AVAX
 * Wallet Integration JavaScript File using thirdweb
 * --- MODIFIED FOR REFERRAL TRACKING ---
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
        // Initialize thirdweb Connect (Ensure ThirdwebConnect is loaded via CDN)
        if (typeof ThirdwebConnect === 'undefined') {
             console.error("ThirdwebConnect SDK not loaded. Wallet connection unavailable.");
             showWalletError("Wallet connection library failed to load.");
             hideWalletLoading();
             return;
        }

        const connect = new ThirdwebConnect.ConnectWallet({
            appName: "$COCO - The Pink Ostrich of AVAX",
            chainId: 43114, // Avalanche C-Chain
            supportedChains: [
                {
                    chainId: 43114,
                    rpcUrl: "https://api.avax.network/ext/bc/C/rpc",
                    chainName: "Avalanche C-Chain",
                    nativeCurrency: { name: "AVAX", symbol: "AVAX", decimals: 18 },
                    blockExplorer: "https://snowtrace.io"
                }
            ]
            // theme: "dark" // Optional: set theme
        });

        // Open the modal
        connect.openModal();

        // Listen for connection
        connect.on("connect", (walletAddress, provider) => {
            console.log("Connected to wallet:", walletAddress);
            handleSuccessfulConnection(walletAddress); // Existing logic + referral check

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
            if (chainId !== 43114) {
                showSwitchNetworkNotification();
            }
        });

        // Listen for error
        connect.on("error", (error) => {
            console.error("Wallet connection error:", error);
            showWalletError(error.message || "An unknown wallet connection error occurred.");
            hideWalletLoading();
        });
    } catch (error) {
        console.error("Error initializing thirdweb:", error);
        showWalletError("Failed to initialize wallet connection setup.");
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
        handleSuccessfulConnection(walletAddress); // Call handler but maybe skip referral check here?
        console.log("Previously connected wallet found:", walletAddress);
    }
}

/**
 * Handle successful wallet connection
 * @param {string} account - Connected wallet address
 */
function handleSuccessfulConnection(account) {
    // Format address for display
    const formattedAddress = `${account.substring(0, 6)}...${account.substring(account.length - 4)}`;

    // Update all connect wallet buttons
    const connectButtons = document.querySelectorAll('#connect-wallet-btn, #mobile-connect-wallet-btn, #how-to-buy-connect-btn');
    connectButtons.forEach(button => {
        button.textContent = formattedAddress;
        button.classList.add('connected');
        // Optionally disable button after connection
        // button.disabled = true;
    });

    hideWalletLoading();
    showNotification('Wallet connected successfully!', 'success');

    // --- New Referral Tracking Logic ---
    try {
        const referrerCode = sessionStorage.getItem('referrer_code');
        if (referrerCode) {
            console.log(`Referrer code found in sessionStorage during wallet connect: ${referrerCode}`);
            trackWalletReferral(referrerCode, account);
        } else {
             console.log("No referrer code found in sessionStorage during wallet connect.");
        }
    } catch(e) {
         console.warn("Could not access sessionStorage for referral tracking:", e);
    }
    // --- End New Logic ---
}

/**
 * New: Track wallet connection for referral points
 * @param {string} referrerCode
 * @param {string} walletAddress
 */
async function trackWalletReferral(referrerCode, walletAddress) {
    console.log(`Attempting to track wallet connect referral for ${walletAddress} via code ${referrerCode}`);
     // Display status on landing page if element exists
     const walletStatusElement = document.getElementById('wallet-status');

    try {
         showStatusMessage(walletStatusElement, 'Checking referral...', 'info', true); // Show loading

        const response = await fetch('/api/referral', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                referrerCode: referrerCode,
                eventType: 'wallet_connect',
                walletAddress: walletAddress // Send wallet address as visitor identifier
            })
        });

        const data = await response.json();

        if (response.ok) {
            console.log('Wallet connect referral tracked successfully.');
            showStatusMessage(walletStatusElement, 'Referrer credited!', 'success');
             // Optionally clear the code after successful tracking?
            // sessionStorage.removeItem('referrer_code');
        } else if (response.status === 409) { // Duplicate
             console.log('Wallet connect referral already tracked for this address.');
             showStatusMessage(walletStatusElement, 'Referral already credited.', 'info');
        }
        else {
             throw new Error(data.error || `Failed to track wallet referral: ${response.statusText}`);
        }
    } catch (error) {
        console.error("Error tracking wallet referral:", error);
         showStatusMessage(walletStatusElement, `Referral tracking failed: ${error.message}`, 'error');
    }
}


/**
 * Handle wallet disconnection
 */
function handleDisconnection() {
    const connectButtons = document.querySelectorAll('#connect-wallet-btn, #mobile-connect-wallet-btn, #how-to-buy-connect-btn');
    connectButtons.forEach(button => {
        button.textContent = 'Connect Wallet';
        button.classList.remove('connected');
         button.disabled = false; // Re-enable button
    });
    showNotification('Wallet disconnected', 'info');
}

/**
 * Show wallet loading state
 */
function showWalletLoading() {
    const connectButtons = document.querySelectorAll('#connect-wallet-btn, #mobile-connect-wallet-btn, #how-to-buy-connect-btn');
    connectButtons.forEach(button => {
        // Avoid changing text if already connected
        if (!button.classList.contains('connected')) {
            const originalText = button.textContent;
            button.setAttribute('data-original-text', originalText);
            button.textContent = 'Connecting...';
        }
         button.classList.add('loading');
         button.disabled = true;
    });
}

/**
 * Hide wallet loading state
 */
function hideWalletLoading() {
    const connectButtons = document.querySelectorAll('#connect-wallet-btn, #mobile-connect-wallet-btn, #how-to-buy-connect-btn');
    connectButtons.forEach(button => {
        if (!button.classList.contains('connected')) {
             const originalText = button.getAttribute('data-original-text') || 'Connect Wallet';
             button.textContent = originalText;
        }
        button.classList.remove('loading');
        // Only re-enable if not connected
        if (!button.classList.contains('connected')) {
            button.disabled = false;
        }
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


// --- Helper: showNotification & showStatusMessage ---
// Ensure these are available, either globally or defined within this scope.
// Using global scope assumed here based on original code structure.

/**
 * Show notification (Assume global or defined elsewhere e.g., in main.js)
 * @param {string} message - Notification message
 * @param {string} type - Notification type (success, error, info, warning)
 */
// function showNotification(message, type) { ... } // Definition assumed available

/**
* Helper to show status messages on referral landing page actions
* @param {HTMLElement} element - The HTML element to display the status in.
* @param {string} message - The message text.
* @param {'success'|'error'|'info'} type - The type of message.
* @param {boolean} isLoading - Optional flag for loading state.
*/
function showStatusMessage(element, message, type, isLoading = false) {
    if (!element) return; // Only run if the status element exists on the current page
    element.textContent = message;
    element.className = `status-message ${type}`; // Reset classes
    element.classList.remove('hidden');

    if (isLoading) {
        element.classList.add('loading');
    } else {
         element.classList.remove('loading');
    }

    // Optional: Auto-hide non-loading messages after a delay
    if (!isLoading) {
        setTimeout(() => {
            // Check if message hasn't changed (e.g., by a subsequent error)
            if (element.textContent === message) {
                 element.classList.add('hidden');
                 element.textContent = '';
            }
        }, 5000); // Hide after 5 seconds
    }
}