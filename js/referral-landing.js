// js/referral-landing.js

document.addEventListener('DOMContentLoaded', () => {
    const referralError = document.getElementById('referral-error');
    const referralContent = document.getElementById('file-referral-content');
    const referrerInfo = document.getElementById('referrer-info');
    const timerMessage = document.getElementById('timer-message');
    const visitStatus = document.getElementById('visit-status');
    const emailForm = document.getElementById('email-form');
    const emailInput = document.getElementById('email-input');
    const emailStatus = document.getElementById('email-status');
    const connectXBtn = document.getElementById('connect-x-btn');
    const connectWalletBtn = document.getElementById('connect-wallet-btn'); // Use the existing ID

    let referrerCode = null;
    let visitTracked = false;
    let visitTimerId = null;
    const VISIT_TRACK_DELAY = 15000; // 15 seconds

    // --- Initialization ---
    function initReferralPage() {
        // 1. Get referral code from URL
        const urlParams = new URLSearchParams(window.location.search);
        referrerCode = urlParams.get('code');

        if (!referrerCode) {
            showReferralError('Missing referral code in URL.');
            return;
        }

         // Store code in sessionStorage for other scripts (wallet.js)
         try {
            sessionStorage.setItem('referrer_code', referrerCode);
            console.log("Referrer code stored in sessionStorage:", referrerCode);
        } catch (e) {
            console.warn("Could not set referrer_code in sessionStorage:", e);
            // Continue, but wallet connect tracking might fail if page reloads
        }

        // 2. Fetch referrer info
        fetchReferrerInfo();

        // 3. Start visit timer
        startVisitTimer();

        // 4. Add event listeners
        addEventListeners();

        // Show content
        referralContent.classList.remove('hidden');
    }

    // --- Helper Functions ---
    function showReferralError(message) {
        console.error("Referral Error:", message);
        referralContent.classList.add('hidden');
        referralError.classList.remove('hidden');
        if (message) {
             referralError.textContent = message; // Update error message if provided
        }
        clearTimeout(visitTimerId); // Stop timer if error occurs
    }

    async function fetchReferrerInfo() {
        try {
            // Use the correct endpoint for fetching referrer info
            const response = await fetch(`/api/user?code=${referrerCode}`);
            if (!response.ok) {
                if (response.status === 404) throw new Error('Referral code not found.');
                throw new Error(`Failed to fetch referrer info: ${response.statusText}`);
            }
            const data = await response.json();
            if (data.referrerHandle) {
                // Check if the handle already starts with @ to avoid double @@ symbols
                const handle = data.referrerHandle.startsWith('@') ? 
                    data.referrerHandle : `@${data.referrerHandle}`;
                referrerInfo.textContent = `You were referred by ${handle}!`;
            } else {
                 referrerInfo.textContent = 'Welcome! Thanks for visiting.';
            }
        } catch (error) {
            console.error("Error fetching referrer info:", error);
            
            // Try the alternative endpoint if the first one fails
            try {
                console.log("Trying alternative endpoint for referrer info");
                const altResponse = await fetch(`/api/referral?code=${referrerCode}`);
                if (!altResponse.ok) {
                    throw new Error(`Failed to fetch referrer info from alternative endpoint: ${altResponse.statusText}`);
                }
                const altData = await altResponse.json();
                if (altData.referrerHandle) {
                    // Check if the handle already starts with @ to avoid double @@ symbols
                    const handle = altData.referrerHandle.startsWith('@') ? 
                        altData.referrerHandle : `@${altData.referrerHandle}`;
                    referrerInfo.textContent = `You were referred by ${handle}!`;
                    return; // Success, exit the function
                }
            } catch (altError) {
                console.error("Error fetching referrer info from alternative endpoint:", altError);
                // Continue to show the original error
            }
            
            referrerInfo.textContent = 'Could not load referrer information.';
            // Consider showing main error block if code is invalid
            if (error.message.includes('not found')) {
                showReferralError('Invalid referral code.');
            }
        }
    }

    function startVisitTimer() {
        timerMessage.textContent = `Stick around for 15 seconds to support your referrer...`;
        visitStatus.classList.add('hidden');

        visitTimerId = setTimeout(() => {
            trackVisit();
        }, VISIT_TRACK_DELAY);
    }

    async function trackVisit() {
        if (visitTracked) return; // Don't track more than once per page load

        timerMessage.textContent = `Tracking visit...`;

        try {
            // Use the correct endpoint for visit tracking
            const response = await fetch('/api/referral', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    referrerCode: referrerCode,
                    eventType: 'visit'
                    // visitorIdentifier will be handled server-side using session ID
                })
            });

            const data = await response.json();

            if (response.ok) {
                visitTracked = true;
                timerMessage.textContent = `Thanks for visiting!`;
                showStatusMessage(visitStatus, 'Referrer credited for your visit!', 'success');
                 console.log('Visit tracked successfully.');
            } else if (response.status === 409) { // Duplicate
                visitTracked = true; // Assume already tracked
                 timerMessage.textContent = `Visit already credited.`;
                 showStatusMessage(visitStatus, 'Visit already credited.', 'info');
                 console.log('Visit already tracked for this session.');
            }
            else {
                throw new Error(data.error || `Failed to track visit: ${response.statusText}`);
            }
        } catch (error) {
            console.error("Error tracking visit:", error);
            timerMessage.textContent = `Could not track visit.`;
            showStatusMessage(visitStatus, `Error tracking visit: ${error.message}`, 'error');
        }
    }

     async function handleEmailSubmit(event) {
        event.preventDefault();
        const email = emailInput.value.trim();
        if (!email) {
            showStatusMessage(emailStatus, 'Please enter a valid email.', 'error');
            return;
        }

        showStatusMessage(emailStatus, 'Submitting...', 'info', true);

         try {
            // Use the correct endpoint for email submissions
            const response = await fetch('/api/referral', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    referrerCode: referrerCode,
                    eventType: 'email',
                    email: email
                    // visitorIdentifier is the email itself for this event type
                })
            });

            const data = await response.json();

            if (response.ok) {
                showStatusMessage(emailStatus, 'Email submitted! Referrer credited.', 'success');
                emailInput.disabled = true; // Prevent resubmission
                event.target.querySelector('button').disabled = true;
                console.log('Email tracked successfully.');
            } else if (response.status === 409) { // Duplicate email for this referrer
                 showStatusMessage(emailStatus, 'This email has already been submitted for this referrer.', 'info');
                 emailInput.disabled = true;
                 event.target.querySelector('button').disabled = true;
                 console.log('Duplicate email submission.');
            }
            else {
                throw new Error(data.error || `Failed to submit email: ${response.statusText}`);
            }
        } catch (error) {
            console.error("Error submitting email:", error);
            showStatusMessage(emailStatus, `Error: ${error.message}`, 'error');
        } finally {
            // Hide loading indicator eventually if one was added
        }
    }

     function handleConnectX() {
        // Redirect to the backend login endpoint, passing the referrer code
        // The backend (/api/auth/x/login.js) will store it in the session
        const loginUrl = `/api/auth/x/login?referrer_code=${referrerCode}`;
        console.log("Redirecting to X login:", loginUrl);
        window.location.href = loginUrl;
         // Note: The actual referral tracking happens server-side AFTER successful X auth
    }

    function showStatusMessage(element, message, type, isLoading = false) {
        if (!element) return;
        element.textContent = message;
        element.className = `status-message ${type}`; // Reset classes
        element.classList.remove('hidden');

        if (isLoading) {
            element.classList.add('loading'); // Add loading style if needed
        } else {
             element.classList.remove('loading');
        }
    }

    // --- Event Listeners Setup ---
    function addEventListeners() {
        if (emailForm) {
            emailForm.addEventListener('submit', handleEmailSubmit);
        }

        if (connectXBtn) {
            connectXBtn.addEventListener('click', handleConnectX);
        }

        // Wallet connection is handled by js/wallet.js which should be loaded
        // Ensure wallet.js checks sessionStorage('referrer_code') on connect
        // and calls the '/api/referral' endpoint with eventType 'wallet_connect'
         if (connectWalletBtn) {
             // We don't need a specific listener here if wallet.js handles it globally
             console.log("Wallet connect button found. Ensuring js/wallet.js is loaded and configured.");
        }
    }

    // --- Run Init ---
    initReferralPage();

});
