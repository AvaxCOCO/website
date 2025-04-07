/**
 * Fetches and displays arcade leaderboard scores for a specific game.
 * @param {string} gameName - The name of the game ('COCORUN' or 'FLAPPYCOCO').
 * @param {string} tbodyId - The ID of the table body element to populate.
 */
async function fetchAndDisplayScores(gameName, tbodyId) {
    const tbody = document.getElementById(tbodyId);
    if (!tbody) {
        console.error(`[FE Error] Leaderboard table body with ID "${tbodyId}" not found.`);
        return;
    }

    // Set initial loading state
    tbody.innerHTML = '<tr><td colspan="3" style="text-align: center; padding: 15px;">Loading...</td></tr>';

    try {
        // Construct the API URL
        const apiUrl = `/api/arcade-leaderboard?gameName=${encodeURIComponent(gameName)}&limit=10`;
        console.log(`[FE Log] Fetching scores for ${gameName} from ${apiUrl}`); // Log fetch attempt

        const response = await fetch(apiUrl);

        if (!response.ok) {
            let errorDetails = '';
            try {
                const errorData = await response.json();
                errorDetails = errorData.error || JSON.stringify(errorData);
            } catch (e) {
                errorDetails = await response.text();
            }
            throw new Error(`Failed to fetch scores: ${response.status} ${response.statusText} - ${errorDetails}`);
        }

        const scores = await response.json();
        console.log(`[FE Log] Received scores data for ${gameName}:`, JSON.stringify(scores)); // Log received data as string

        // Clear loading state
        tbody.innerHTML = '';

        if (scores.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" style="text-align: center; padding: 15px;">No scores yet!</td></tr>';
            return;
        }

        // Populate table rows
        scores.forEach((score, index) => {
            // *** ADDED DETAILED LOGGING PER ITEM ***
            console.log(`[FE Log] Processing item ${index} for ${gameName}:`, JSON.stringify(score)); // Log the raw score object

            const row = tbody.insertRow();
            row.style.borderBottom = '1px solid rgba(255, 105, 180, 0.2)'; // Add style matching HTML

            // Rank cell
            const rankCell = row.insertCell();
            rankCell.textContent = score.rank; // Uses lowercase 'rank' from response
            rankCell.style.padding = '8px';
            rankCell.style.textAlign = 'left';

            // Player cell (with image and username)
            const playerCell = row.insertCell();
            playerCell.style.padding = '8px';
            playerCell.style.textAlign = 'left';
            playerCell.style.display = 'flex';
            playerCell.style.alignItems = 'center';

            // Check both cases, prioritize lowercase as seen in Network response
            const profilePicUrl = score.xprofilepicurl || score.xProfilePicUrl || 'images/transparent images/cocoannounce-transparent.png';
            const userName = score.xusername || score.xUsername || 'Anonymous';

            console.log(`[FE Log] Item ${index} (${gameName}) - Raw username: [lc] ${score.xusername}, [mc] ${score.xUsername}`);
            console.log(`[FE Log] Item ${index} (${gameName}) - Determined userName: ${userName}`);
            console.log(`[FE Log] Item ${index} (${gameName}) - Raw profilePicUrl: [lc] ${score.xprofilepicurl}, [mc] ${score.xProfilePicUrl}`);
            console.log(`[FE Log] Item ${index} (${gameName}) - Determined profilePicUrl: ${profilePicUrl}`);
            // *** END LOGGING ***

            // Profile image
            const img = document.createElement('img');
            img.src = profilePicUrl;
            img.alt = userName;
            img.style.width = '24px';
            img.style.height = '24px';
            img.style.borderRadius = '50%';
            img.style.marginRight = '8px';
            img.onerror = () => {
                console.warn(`[FE Warn] Failed to load image for ${userName}: ${profilePicUrl}. Falling back to default.`);
                img.src = 'images/transparent images/cocoannounce-transparent.png';
            };

            playerCell.appendChild(img);
            playerCell.appendChild(document.createTextNode(userName));

            // Score cell
            const scoreCell = row.insertCell();
            scoreCell.textContent = typeof score.score === 'number' ? score.score : 'N/A'; // Uses lowercase 'score' from response
            scoreCell.style.padding = '8px';
            scoreCell.style.textAlign = 'right';
        });

    } catch (error) {
        console.error(`[FE Error] Error loading leaderboard for ${gameName}:`, error);
        const errorMessage = error.message || 'Error loading scores.';
        tbody.innerHTML = `<tr><td colspan="3" style="text-align: center; padding: 15px; color: #ff69b4;">${errorMessage}</td></tr>`;
    }
}

// Add event listener to load leaderboards when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log("[FE Log] DOM Content Loaded, fetching leaderboards...");
    fetchAndDisplayScores('COCORUN', 'cocorun-leaderboard-body');
    fetchAndDisplayScores('FLAPPYCOCO', 'flappycoco-leaderboard-body');
});