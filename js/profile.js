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
        if (!token) {
            profileLoading.classList.add('hidden');
            profileError.textContent = 'Authentication required. Please connect your X account.';
            profileError.classList.remove('hidden');
            // Optionally redirect to login or show connect button
            return;
        }

        try {
            const response = await fetch('/api/user', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`, // Send token for authentication
                    'Accept': 'application/json'
                }
            });

            if (response.status === 401) { // Unauthorized
                 profileLoading.classList.add('hidden');
                 profileError.textContent = 'Your session may have expired. Please reconnect your X account.';
                 profileError.classList.remove('hidden');
                 // Clear local storage?
                 localStorage.removeItem('xAccessToken');
                 localStorage.removeItem('cocoXUser');
                 return;
            }

            if (!response.ok) {
                throw new Error(`Failed to fetch profile: ${response.statusText}`);
            }

            const data = await response.json();
            updateProfileUI(data);

            profileLoading.classList.add('hidden');
            profileContent.classList.remove('hidden');

        } catch (error) {
            console.error("Error fetching profile:", error);
            profileLoading.classList.add('hidden');
            profileError.textContent = `Error fetching profile: ${error.message}. Please try again.`;
            profileError.classList.remove('hidden');
        }
    }

    // Function to update UI with profile data
    function updateProfileUI(data) {
        document.getElementById('user-name').textContent = data.name || 'N/A';
        document.getElementById('user-handle').textContent = data.handle ? `@${data.handle.substring(1)}` : '@N/A'; // Remove '@' if present
        document.getElementById('user-avatar').src = data.profile_image_url || 'images/cocopfp.jpg'; // Default avatar
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
            // Assuming POST to /api/profile triggers QR generation in the backend logic
             const response = await fetch('/api/profile', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                    // No body needed if backend uses session userId
                }
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
