// Wallet Connection Functionality for $COCO Website

class WalletManager {
    constructor() {
        this.isConnected = false;
        this.currentAccount = null;
        this.provider = null;
        this.init();
    }

    init() {
        // Initialize wallet connection
        this.setupEventListeners();
        this.checkExistingConnection();
    }

    setupEventListeners() {
        const connectButton = document.getElementById('connect-wallet');
        if (connectButton) {
            connectButton.addEventListener('click', () => this.connectWallet());
        }

        // Listen for account changes
        if (window.ethereum) {
            window.ethereum.on('accountsChanged', (accounts) => {
                this.handleAccountsChanged(accounts);
            });

            window.ethereum.on('chainChanged', (chainId) => {
                this.handleChainChanged(chainId);
            });
        }
    }

    async connectWallet() {
        try {
            if (typeof window.ethereum !== 'undefined') {
                // Request account access
                const accounts = await window.ethereum.request({
                    method: 'eth_requestAccounts'
                });

                if (accounts.length > 0) {
                    this.currentAccount = accounts[0];
                    this.isConnected = true;
                    this.updateUI();
                    
                    // Check if we're on Avalanche network
                    await this.checkNetwork();
                    
                    console.log('Wallet connected:', this.currentAccount);
                } else {
                    throw new Error('No accounts found');
                }
            } else {
                // No wallet detected
                this.showWalletNotFound();
            }
        } catch (error) {
            console.error('Error connecting wallet:', error);
            this.showError('Failed to connect wallet. Please try again.');
        }
    }

    async checkNetwork() {
        try {
            const chainId = await window.ethereum.request({ method: 'eth_chainId' });
            const avalancheChainId = '0xa86a'; // Avalanche C-Chain

            if (chainId !== avalancheChainId) {
                await this.switchToAvalanche();
            }
        } catch (error) {
            console.error('Error checking network:', error);
        }
    }

    async switchToAvalanche() {
        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: '0xa86a' }], // Avalanche C-Chain
            });
        } catch (switchError) {
            // This error code indicates that the chain has not been added to MetaMask
            if (switchError.code === 4902) {
                try {
                    await window.ethereum.request({
                        method: 'wallet_addEthereumChain',
                        params: [
                            {
                                chainId: '0xa86a',
                                chainName: 'Avalanche Network',
                                nativeCurrency: {
                                    name: 'AVAX',
                                    symbol: 'AVAX',
                                    decimals: 18,
                                },
                                rpcUrls: ['https://api.avax.network/ext/bc/C/rpc'],
                                blockExplorerUrls: ['https://snowtrace.io/'],
                            },
                        ],
                    });
                } catch (addError) {
                    console.error('Error adding Avalanche network:', addError);
                }
            }
        }
    }

    handleAccountsChanged(accounts) {
        if (accounts.length === 0) {
            // User disconnected wallet
            this.disconnect();
        } else if (accounts[0] !== this.currentAccount) {
            // User switched accounts
            this.currentAccount = accounts[0];
            this.updateUI();
        }
    }

    handleChainChanged(chainId) {
        // Reload the page when chain changes
        window.location.reload();
    }

    disconnect() {
        this.isConnected = false;
        this.currentAccount = null;
        this.updateUI();
        console.log('Wallet disconnected');
    }

    updateUI() {
        const connectButton = document.getElementById('connect-wallet');
        if (connectButton) {
            if (this.isConnected) {
                connectButton.textContent = `${this.currentAccount.slice(0, 6)}...${this.currentAccount.slice(-4)}`;
                connectButton.classList.add('connected');
            } else {
                connectButton.textContent = 'Connect Wallet';
                connectButton.classList.remove('connected');
            }
        }
    }

    async checkExistingConnection() {
        try {
            if (window.ethereum) {
                const accounts = await window.ethereum.request({ method: 'eth_accounts' });
                if (accounts.length > 0) {
                    this.currentAccount = accounts[0];
                    this.isConnected = true;
                    this.updateUI();
                }
            }
        } catch (error) {
            console.error('Error checking existing connection:', error);
        }
    }

    showWalletNotFound() {
        alert('No Ethereum wallet found. Please install MetaMask or Core Wallet to connect.');
    }

    showError(message) {
        // You can replace this with a more sophisticated notification system
        alert(message);
    }

    // Utility method to get current account
    getCurrentAccount() {
        return this.currentAccount;
    }

    // Utility method to check if wallet is connected
    isWalletConnected() {
        return this.isConnected;
    }
}

// Initialize wallet manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.walletManager = new WalletManager();
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WalletManager;
}
