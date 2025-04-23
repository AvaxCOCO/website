// js/profile.js

document.addEventListener('DOMContentLoaded', () => {
    const profileLoading = document.getElementById('profile-loading');
    const profileError = document.getElementById('profile-error');
    const profileContent = document.getElementById('profile-content');
    const retryProfileLoadBtn = document.getElementById('retry-profile-load');
    const generateQrBtn = document.getElementById('generate-qr-btn');
    const qrLoading = document.getElementById('qr-loading');
    const qrError = document.getElementById('qr-error');
    const qrDisplay = document.getElementById('qr-display');
    const retryQrGenerationBtn = document.getElementById('retry-qr-generation');
    const copyLinkBtn = document.getElementById('copy-link-btn');
    const referralLinkInput = document.getElementById('referral-link-input');
    const qrCodeImg = document.getElementById('qr-code-img');
    const copyStatus = document.getElementById('copy-status');
    const disconnectXBtn = document.getElementById('disconnect-x-btn');

    // Function to fetch profile data
    async function fetchProfileData() {
        profileLoading.classList.remove('hidden');
        profileError.classList.add('hidden');
        profileContent.classList.add('hidden');
        qrDisplay.classList.add('hidden'); // Hide QR initially
        generateQrBtn.classList.remove('hidden'); // Show generate button initially

        // Check if user is authenticated (using x-auth-server.js logic/localStorage)
        const token = localStorage.getItem('xAccessToken');
        const userData = localStorage.getItem('cocoXUser');
        
        if (!token) {
            profileLoading.classList.add('hidden');
            profileError.innerHTML = `
                <div class="alert alert-danger">
                    <p>Authentication required. Please connect your X account.</p>
                    <a href="x-verification.html" class="btn btn-primary mt-4">Connect X Account</a>
                </div>
            `;
            profileError.classList.remove('hidden');
            return;
        }
        
        // If we have user data in localStorage, use it and show the profile content
        if (userData) {
            try {
                const user = JSON.parse(userData);
                updateProfileUI(user);
                profileLoading.classList.add('hidden');
                profileContent.classList.remove('hidden');
                
                // Continue with API fetch in the background to get the latest data
                fetchLatestProfileData(token);
            } catch (error) {
                console.error("Error parsing user data from localStorage:", error);
                // If parsing fails, try to fetch from API
                fetchLatestProfileData(token);
            }
        } else {
            // No cached data, try to fetch from API
            fetchLatestProfileData(token);
        }
    }
    
    // Function to fetch the latest profile data from the API
    async function fetchLatestProfileData(token) {
        try {
            // First try to get user data from /api/user (session-based)
            let response = await fetch('/api/user', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`, // Send token for authentication
                    'Accept': 'application/json'
                },
                credentials: 'include' // Important: Include cookies for session
            });

            // If session is not found, try to re-authenticate with X API
            if (response.status === 401) { // Unauthorized
                console.log('Session not found, trying to re-authenticate with X API');
                
                // Try to get user data from X API directly
                const xResponse = await fetch('/api/auth/x/user', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`, // Send token for authentication
                        'Accept': 'application/json'
                    },
                    credentials: 'include' // Important: Include cookies for session
                });
                
                if (xResponse.ok) {
                    // X API authentication successful, now try to get user data again
                    response = await fetch('/api/user', {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Accept': 'application/json'
                        },
                        credentials: 'include'
                    });
                } else {
                    // X API authentication failed
                    if (!document.getElementById('profile-content').classList.contains('hidden')) {
                        // If profile content is already showing, don't show the error
                        return;
                    }
                    
                    profileLoading.classList.add('hidden');
                    profileError.innerHTML = `
                        <div class="alert alert-danger">
                            <p>Your session may have expired. Please reconnect your X account.</p>
                            <a href="x-verification.html" class="btn btn-primary mt-4">Reconnect X Account</a>
                        </div>
                    `;
                    profileError.classList.remove('hidden');
                    return;
                }
            }

            if (!response.ok) {
                // If we still get an error after re-authentication, show a more user-friendly error
                // Only show the error if we don't have cached data already showing
                if (!document.getElementById('profile-content').classList.contains('hidden')) {
                    // If profile content is already showing, don't show the error
                    return;
                }
                
                profileLoading.classList.add('hidden');
                profileError.innerHTML = `
                    <div class="alert alert-danger">
                        <p>Error fetching profile. Please try again later.</p>
                        <button id="retry-profile-load" class="btn btn-primary mt-4">Retry</button>
                    </div>
                `;
                profileError.classList.remove('hidden');
                
                // Add event listener to the retry button
                document.getElementById('retry-profile-load').addEventListener('click', fetchProfileData);
                
                return;
            }

            const data = await response.json();
            
            // Update localStorage with the latest data
            localStorage.setItem('cocoXUser', JSON.stringify(data));
            
            // Update the UI with the latest data
            updateProfileUI(data);

            profileLoading.classList.add('hidden');
            profileContent.classList.remove('hidden');
            profileError.classList.add('hidden');

        } catch (error) {
            console.error("Error fetching profile:", error);
            
            // Only show the error if we don't have cached data already showing
            if (!document.getElementById('profile-content').classList.contains('hidden')) {
                // If profile content is already showing, don't show the error
                return;
            }
            
            profileLoading.classList.add('hidden');
            profileError.innerHTML = `
                <div class="alert alert-danger">
                    <p>Error fetching profile. Please try again later.</p>
                    <button id="retry-profile-load" class="btn btn-primary mt-4">Retry</button>
                </div>
            `;
            profileError.classList.remove('hidden');
            
            // Add event listener to the retry button
            document.getElementById('retry-profile-load').addEventListener('click', fetchProfileData);
        }
    }

    // Function to update UI with profile data
    function updateProfileUI(data) {
        document.getElementById('user-name').textContent = data.name || 'N/A';
        document.getElementById('user-handle').textContent = data.handle ? `@${data.handle.substring(1)}` : '@N/A'; // Remove '@' if present
        
        // Check all possible profile image property names
        const profileImage = data.profileImage || data.profile_image_url || data.profileImageUrl || data.avatar;
        document.getElementById('user-avatar').src = profileImage || 'images/cocopfp.jpg'; // Default avatar
        
        // Log the data to help debug
        console.log('Profile data:', data);
        
        document.getElementById('referral-points').textContent = data.referral_points || 0;
        document.getElementById('engagement-points').textContent = data.engagement_points || 0; // Use alias from DB query
        document.getElementById('user-rank').textContent = data.rank || '-';
        document.getElementById('user-level').textContent = data.level || 'Beginner';

         // Store referral link if available (might be generated on first profile load)
        if (data.referralLink) {
             referralLinkInput.value = data.referralLink;
             // Maybe auto-generate QR on load if link exists?
             // handleGenerateQr(); // Uncomment to auto-generate
        } else if (data.referral_code) {
            // Construct link client-side if only code is present (less ideal)
             const baseUrl = window.location.origin;
             referralLinkInput.value = `${baseUrl}/referral-landing.html?code=${data.referral_code}`;
        }
    }

     // Function to handle QR code generation
    async function handleGenerateQr() {
        qrLoading.classList.remove('hidden');
        qrError.classList.add('hidden');
        qrDisplay.classList.add('hidden');
        generateQrBtn.classList.add('hidden'); // Hide button while loading

        const token = localStorage.getItem('xAccessToken');
        if (!token) {
            qrLoading.classList.add('hidden');
            qrError.textContent = 'Authentication required.';
            qrError.classList.remove('hidden');
            generateQrBtn.classList.remove('hidden'); // Show button again
            return;
        }

        try {
            // POST to /api/user triggers QR code generation in the backend
             const response = await fetch('/api/user', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    token: token, // Include token in the body as well
                    xUserId: JSON.parse(localStorage.getItem('cocoXUser'))?.id // Include X user ID if available
                }),
                credentials: 'include' // Important: Include cookies for session
            });

            if (response.status === 401) {
                 qrLoading.classList.add('hidden');
                 qrError.textContent = 'Session expired. Please reconnect X.';
                 qrError.classList.remove('hidden');
                 generateQrBtn.classList.remove('hidden'); // Show button again
                 return;
            }

            if (!response.ok) {
                throw new Error(`QR generation failed: ${response.statusText}`);
            }

            const data = await response.json();

            if (data.qrCodeDataUrl && data.referralLink) {
                qrCodeImg.src = data.qrCodeDataUrl;
                referralLinkInput.value = data.referralLink; // Update link just in case
                qrLoading.classList.add('hidden');
                qrDisplay.classList.remove('hidden');
                generateQrBtn.classList.add('hidden'); // Keep hidden after successful generation
            } else {
                 throw new Error('Invalid response data from QR generation endpoint.');
            }

        } catch (error) {
            console.error("Error generating QR code:", error);
            qrLoading.classList.add('hidden');
            qrError.textContent = `Error generating QR: ${error.message}. Please try again.`;
            qrError.classList.remove('hidden');
            generateQrBtn.classList.remove('hidden'); // Show button again
        }
    }

    // Function to copy link
    function copyLink() {
        referralLinkInput.select();
        referralLinkInput.setSelectionRange(0, 99999); // For mobile devices

        try {
            document.execCommand('copy'); // Deprecated but has wide support
            copyStatus.textContent = 'Link copied!';
        } catch (err) {
             // Fallback for browsers that don't support execCommand or if it fails
             navigator.clipboard.writeText(referralLinkInput.value).then(() => {
                 copyStatus.textContent = 'Link copied!';
             }).catch(clipboardErr => {
                 console.error('Failed to copy link:', clipboardErr);
                 copyStatus.textContent = 'Failed to copy!';
             });
        }

        // Clear status message after a few seconds
        setTimeout(() => {
            copyStatus.textContent = '';
        }, 3000);
    }

     // Function to handle X disconnection
    function handleDisconnectX() {
        // Manual cleanup since disconnectX function might not be available in x-auth-server.js
        localStorage.removeItem('xAccessToken');
        localStorage.removeItem('xRefreshToken');
        localStorage.removeItem('cocoXUser');
        showNotification('X account disconnected. Redirecting...', 'info');
        setTimeout(() => {
            window.location.href = '/index.html';
        }, 2000);
    }

    // --- Event Listeners ---
    if (retryProfileLoadBtn) {
        retryProfileLoadBtn.addEventListener('click', fetchProfileData);
    }

    if (generateQrBtn) {
        generateQrBtn.addEventListener('click', handleGenerateQr);
    }
     if (retryQrGenerationBtn) {
        retryQrGenerationBtn.addEventListener('click', handleGenerateQr);
    }

    if (copyLinkBtn) {
        copyLinkBtn.addEventListener('click', copyLink);
    }

     if (disconnectXBtn) {
        disconnectXBtn.addEventListener('click', handleDisconnectX);
    }

    // --- Initial Load ---
    fetchProfileData();
});

// Helper: showNotification (ensure this exists globally or define here)
function showNotification(message, type) {
    console.log(`Notification (${type}): ${message}`); // Basic console fallback
     // Reuse notification logic from wallet.js if available globally
    if (typeof window.showNotification === 'function' && window.showNotification !== showNotification) {
       window.showNotification(message, type);
       return;
    }

    // Basic fallback implementation if not globally available
    const notificationArea = document.getElementById('notification-area') || document.body; // Define an area or append to body
    const notification = document.createElement('div');
    notification.className = `notification ${type}`; // Ensure these classes exist in style.css
    notification.style.position = 'fixed';
    notification.style.top = '20px';
    notification.style.right = '20px';
    notification.style.padding = '15px';
    notification.style.backgroundColor = type === 'error' ? '#f44336' : type === 'success' ? '#4CAF50' : '#2196F3';
    notification.style.color = 'white';
    notification.style.borderRadius = '5px';
    notification.style.zIndex = '10001';
    notification.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.2)';
    notification.textContent = message;

    notificationArea.appendChild(notification);

    setTimeout(() => {
        notification.style.transition = 'opacity 0.5s ease';
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 500);
    }, 5000);
}
