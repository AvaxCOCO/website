/**
 * $COCO X Post Verification
 * This script handles the process of verifying a user's X post about $COCO
 * to establish their position on the leaderboard
 */

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
  // Check if we're on the verification page
  const verificationContainer = document.getElementById('x-post-verification');
  if (verificationContainer) {
    initializeVerification();
  }
});

/**
 * Initialize the verification process
 */
function initializeVerification() {
  const verificationContainer = document.getElementById('x-post-verification');
  const verificationStatus = document.getElementById('verification-status');
  const postButton = document.getElementById('post-to-x-button');
  const verifyButton = document.getElementById('verify-post-button');
  
  // Generate a unique verification code for this user
  const verificationCode = generateVerificationCode();
  
  // Store the verification code in localStorage
  localStorage.setItem('cocoVerificationCode', verificationCode);
  
  // Update the suggested post text with the verification code
  const suggestedPostElement = document.getElementById('suggested-post');
  if (suggestedPostElement) {
    suggestedPostElement.textContent = 
      `I'm joining the $COCO leaderboard! 🚀 Building my $COCO bag on #AVAX. Verification: ${verificationCode} #AVAXCOCO`;
  }
  
  // Set up the post button
  if (postButton) {
    postButton.addEventListener('click', function() {
      const postText = suggestedPostElement.textContent;
      const encodedText = encodeURIComponent(postText);
      const tweetUrl = `https://twitter.com/intent/tweet?text=${encodedText}`;
      
      // Open Twitter in a new window
      window.open(tweetUrl, '_blank');
      
      // Update UI to show next step
      verificationStatus.innerHTML = `
        <div class="alert alert-info">
          <p>Post created! Now verify your post to earn your position on the leaderboard.</p>
        </div>
      `;
      
      postButton.classList.add('hidden');
      verifyButton.classList.remove('hidden');
    });
  }
  
  // Set up the verify button
  if (verifyButton) {
    verifyButton.addEventListener('click', function() {
      verifyButton.disabled = true;
      verifyButton.textContent = 'Verifying...';
      
      verifyXPost(verificationCode)
        .then(result => {
          if (result.verified) {
            verificationStatus.innerHTML = `
              <div class="alert alert-success">
                <p>🎉 Verification successful! Your post has been verified and you've earned ${result.points} points.</p>
                <p>Your current rank: #${result.rank}</p>
              </div>
              <div class="mt-4">
                <a href="/leaderboard.html" class="btn btn-primary">View Leaderboard</a>
              </div>
            `;
            verifyButton.classList.add('hidden');
          } else {
            verificationStatus.innerHTML = `
              <div class="alert alert-danger">
                <p>Verification failed: ${result.error}</p>
                <p>Please make sure you've posted the exact text with your verification code.</p>
              </div>
            `;
            verifyButton.disabled = false;
            verifyButton.textContent = 'Verify Post';
          }
        })
        .catch(error => {
          console.error('Verification error:', error);
          verificationStatus.innerHTML = `
            <div class="alert alert-danger">
              <p>Error during verification: ${error.message}</p>
              <p>Please try again later.</p>
            </div>
          `;
          verifyButton.disabled = false;
          verifyButton.textContent = 'Verify Post';
        });
    });
  }
}

/**
 * Generate a unique verification code
 * @returns {string} - Verification code
 */
function generateVerificationCode() {
  // Get user info if available
  const userData = localStorage.getItem('cocoXUser');
  let userPrefix = '';
  
  if (userData) {
    const user = JSON.parse(userData);
    userPrefix = user.handle.replace('@', '').substring(0, 3);
  }
  
  // Generate a random code
  const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
  
  // Combine with timestamp for uniqueness
  const timestamp = Date.now().toString(36).substring(-4);
  
  return `${userPrefix}${randomPart}${timestamp}`.substring(0, 10);
}

/**
 * Verify the user's X post
 * @param {string} verificationCode - The verification code to look for
 * @returns {Promise<Object>} - Result of verification
 */
async function verifyXPost(verificationCode) {
  try {
    // Get the user's X token
    const token = localStorage.getItem('xAccessToken');
    
    if (!token) {
      throw new Error('Not authenticated with X');
    }
    
    // Call our API to verify the post
    const response = await fetch('/api/verify-x-post', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ verificationCode })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to verify post');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error verifying X post:', error);
    throw error;
  }
}