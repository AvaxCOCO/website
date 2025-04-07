/**
 * Fetches and displays arcade leaderboard scores for a specific game.
 * @param {string} gameName - The name of the game ('COCORUN' or 'FLAPPYCOCO').
 * @param {string} tbodyId - The ID of the table body element to populate.
 */
async function fetchAndDisplayScores(gameName, tbodyId) {
    const tbody = document.getElementById(tbodyId);
    if (!tbody) {
        console.error(`Leaderboard table body with ID "${tbodyId}" not found.`);
        return;
    }

    // Set initial loading state
    tbody.innerHTML = '<tr><td colspan="3" style="text-align: center; padding: 15px;">Loading...</td></tr>';

    try {
        // Construct the API URL - CORRECTED PATH
        // Calls /api/arcade-leaderboard which is handled by api/arcade-leaderboard.js
        const apiUrl = `/api/arcade-leaderboard?gameName=${encodeURIComponent(gameName)}&limit=10`; // Removed '/scores' from the path

        const response = await fetch(apiUrl);

        if (!response.ok) {
            // Try to get more specific error info from the response body if possible
            let errorDetails = '';
            try {
                const errorData = await response.json(); // Attempt to parse as JSON
                errorDetails = errorData.error || JSON.stringify(errorData);
            } catch (e) {
                errorDetails = await response.text(); // Fallback to plain text
            }
            throw new Error(`Failed to fetch scores: ${response.status} ${response.statusText} - ${errorDetails}`);
        }

        const scores = await response.json();

        // Clear loading state
        tbody.innerHTML = '';

        if (scores.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" style="text-align: center; padding: 15px;">No scores yet!</td></tr>';
            return;
        }

        // Populate table rows
        scores.forEach(score => {
            const row = tbody.insertRow();
            row.style.borderBottom = '1px solid rgba(255, 105, 180, 0.2)'; // Add style matching HTML

            // Rank cell
            const rankCell = row.insertCell();
            rankCell.textContent = score.rank;
            rankCell.style.padding = '8px';
            rankCell.style.textAlign = 'left';

            // Player cell (with image and username)
            const playerCell = row.insertCell();
            playerCell.style.padding = '8px';
            playerCell.style.textAlign = 'left';
            playerCell.style.display = 'flex'; // Use flex for alignment
            playerCell.style.alignItems = 'center';

            // Profile image
            const img = document.createElement('img');
            img.src = score.xprofilepicurl || 'images/transparent images/cocoannounce-transparent.png'; // Use placeholder if missing
            img.alt = score.xusername || 'Player';
            img.style.width = '24px';
            img.style.height = '24px';
            img.style.borderRadius = '50%';
            img.style.marginRight = '8px';
            img.onerror = () => { img.src = 'images/transparent images/cocoannounce-transparent.png'; }; // Fallback on error

            playerCell.appendChild(img);
            // Use text node for safety against potential HTML injection in usernames
            playerCell.appendChild(document.createTextNode(score.xusername || 'Anonymous'));

            // Score cell
            const scoreCell = row.insertCell();
             // Ensure score is treated as a number, handle potential nulls/undefined just in case
            scoreCell.textContent = typeof score.score === 'number' ? score.score : 'N/A';
            scoreCell.style.padding = '8px';
            scoreCell.style.textAlign = 'right';
        });

    } catch (error) {
        console.error(`Error loading leaderboard for ${gameName}:`, error);
        // Display the actual error message if possible
        const errorMessage = error.message || 'Error loading scores.';
        tbody.innerHTML = `<tr><td colspan="3" style="text-align: center; padding: 15px; color: #ff69b4;">${errorMessage}</td></tr>`;
    }
}

// Add event listener to load leaderboards when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Make sure the IDs match the tbody elements in arcade.html
    fetchAndDisplayScores('COCORUN', 'cocorun-leaderboard-body');
    fetchAndDisplayScores('FLAPPYCOCO', 'flappycoco-leaderboard-body');
});