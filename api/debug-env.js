export default async function handler(req, res) {
    // Only allow this in development or for debugging
    const isDev = process.env.NODE_ENV !== 'production';
    
    // Temporarily allow in production for debugging
    // if (!isDev) {
    //     return res.status(403).json({ error: 'Debug endpoint disabled in production' });
    // }
    
    try {
        const envCheck = {
            X_BEARER_TOKEN: process.env.X_BEARER_TOKEN ? 'SET' : 'MISSING',
            DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'MISSING',
            NODE_ENV: process.env.NODE_ENV || 'undefined',
            timestamp: new Date().toISOString()
        };
        
        // Don't expose actual values, just check if they exist
        res.status(200).json({
            environment_variables: envCheck,
            message: 'Environment variable status check'
        });
        
    } catch (error) {
        res.status(500).json({ 
            error: 'Error checking environment variables',
            details: error.message 
        });
    }
}
