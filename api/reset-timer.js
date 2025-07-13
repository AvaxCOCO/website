export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Calculate next Friday at 10pm CST
        function getNextResetTime() {
            const now = new Date();
            
            // Convert to CST (UTC-6, or UTC-5 during DST)
            const cstOffset = -6; // CST is UTC-6
            const nowCST = new Date(now.getTime() + (cstOffset * 60 * 60 * 1000));
            
            // Find next Friday
            const daysUntilFriday = (5 - nowCST.getDay() + 7) % 7;
            const nextFriday = new Date(nowCST);
            nextFriday.setDate(nowCST.getDate() + (daysUntilFriday === 0 ? 7 : daysUntilFriday));
            
            // Set to 10pm CST
            nextFriday.setHours(22, 0, 0, 0);
            
            // If it's Friday and past 10pm, get next Friday
            if (nowCST.getDay() === 5 && nowCST.getHours() >= 22) {
                nextFriday.setDate(nextFriday.getDate() + 7);
            }
            
            // Convert back to UTC for storage/transmission
            return new Date(nextFriday.getTime() - (cstOffset * 60 * 60 * 1000));
        }

        function getLastResetTime() {
            const now = new Date();
            const cstOffset = -6;
            const nowCST = new Date(now.getTime() + (cstOffset * 60 * 60 * 1000));
            
            // Find last Friday
            const daysSinceLastFriday = (nowCST.getDay() + 2) % 7;
            const lastFriday = new Date(nowCST);
            lastFriday.setDate(nowCST.getDate() - daysSinceLastFriday);
            lastFriday.setHours(22, 0, 0, 0);
            
            // If it's before this Friday 10pm, use previous Friday
            if (nowCST.getDay() < 5 || (nowCST.getDay() === 5 && nowCST.getHours() < 22)) {
                lastFriday.setDate(lastFriday.getDate() - 7);
            }
            
            return new Date(lastFriday.getTime() - (cstOffset * 60 * 60 * 1000));
        }

        const nextReset = getNextResetTime();
        const lastReset = getLastResetTime();
        const now = new Date();
        const timeUntilReset = nextReset.getTime() - now.getTime();

        // Calculate time components
        const days = Math.floor(timeUntilReset / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeUntilReset % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((timeUntilReset % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeUntilReset % (1000 * 60)) / 1000);

        res.status(200).json({
            next_reset: nextReset.toISOString(),
            last_reset: lastReset.toISOString(),
            time_until_reset: {
                total_milliseconds: timeUntilReset,
                days,
                hours,
                minutes,
                seconds
            },
            reset_schedule: "Every Friday at 10:00 PM CST",
            current_time: now.toISOString()
        });

    } catch (error) {
        console.error('Error calculating reset timer:', error);
        res.status(500).json({ 
            error: 'Failed to calculate reset timer',
            details: error.message 
        });
    }
}
