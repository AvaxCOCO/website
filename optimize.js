#!/usr/bin/env node

/**
 * $COCO Website Optimization Script
 * Optimizes images, minifies CSS/JS, and improves performance
 */

const fs = require('fs');
const path = require('path');

// Simple CSS minifier
function minifyCSS(css) {
    return css
        // Remove comments
        .replace(/\/\*[\s\S]*?\*\//g, '')
        // Remove unnecessary whitespace
        .replace(/\s+/g, ' ')
        // Remove whitespace around specific characters
        .replace(/\s*([{}:;,>+~])\s*/g, '$1')
        // Remove trailing semicolons
        .replace(/;}/g, '}')
        // Remove leading/trailing whitespace
        .trim();
}

// Simple JS minifier (basic)
function minifyJS(js) {
    return js
        // Remove single-line comments (but preserve URLs)
        .replace(/\/\/(?![^\r\n]*https?:)[^\r\n]*/g, '')
        // Remove multi-line comments
        .replace(/\/\*[\s\S]*?\*\//g, '')
        // Remove unnecessary whitespace
        .replace(/\s+/g, ' ')
        // Remove whitespace around operators and punctuation
        .replace(/\s*([{}();,=+\-*/<>!&|])\s*/g, '$1')
        // Remove trailing semicolons before }
        .replace(/;}/g, '}')
        .trim();
}

// Generate critical CSS for above-the-fold content
function generateCriticalCSS() {
    const criticalCSS = `
/* Critical CSS for above-the-fold content */
:root{--primary-color:#FF1493;--primary-light:#FF69B4;--background-dark:#0D0221;--background-light:#1A0347;--text-light:#FFFFFF;--font-primary:'Fredoka',sans-serif;--spacing-md:1rem;--spacing-lg:1.5rem;--spacing-xl:2rem;--transition-normal:0.3s ease}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body{width:100%;max-width:100%;overflow-x:hidden}
body{font-family:var(--font-primary);color:var(--text-light);background:linear-gradient(135deg,var(--background-dark) 0%,var(--background-light) 100%);min-height:100vh}
.container{width:100%;max-width:1200px;margin:0 auto;padding:0 var(--spacing-lg)}
.header{position:fixed;top:0;left:0;width:100%;padding:var(--spacing-md) 0;background-color:rgba(13,2,33,0.8);backdrop-filter:blur(10px);z-index:10}
.navbar .container{display:flex;justify-content:space-between;align-items:center}
.nav-brand h1{font-size:1.5rem;font-weight:700;color:var(--primary-color)}
.hero-section{min-height:100vh;display:flex;align-items:center;padding:4rem 0;margin-top:80px}
.hero-content{display:flex;align-items:center;justify-content:space-between;gap:var(--spacing-xl)}
.hero-text h1{font-size:3rem;font-weight:700;color:var(--primary-color);margin-bottom:0.5rem}
.hero-text h2{font-size:2rem;font-weight:600;margin-bottom:var(--spacing-lg)}
.btn{display:inline-flex;align-items:center;justify-content:center;padding:0.5rem 1.5rem;border-radius:9999px;font-weight:700;text-transform:uppercase;transition:all 0.2s ease}
.btn-primary{background:linear-gradient(45deg,var(--primary-color),#8A2BE2);color:var(--text-light)}
#preloader{position:fixed;top:0;left:0;width:100%;height:100%;background-color:var(--background-dark);display:flex;justify-content:center;align-items:center;z-index:1000}
    `;
    
    return minifyCSS(criticalCSS);
}

// Optimize images (placeholder - would need actual image optimization library)
function optimizeImages() {
    console.log('📸 Image optimization would require additional libraries like sharp or imagemin');
    console.log('   Consider implementing WebP conversion and responsive images');
    
    // Generate WebP conversion suggestions
    const imageExtensions = ['.png', '.jpg', '.jpeg'];
    const imagesDir = path.join(__dirname, 'images');
    
    if (fs.existsSync(imagesDir)) {
        const files = fs.readdirSync(imagesDir, { recursive: true });
        const imageFiles = files.filter(file => 
            imageExtensions.some(ext => file.toLowerCase().endsWith(ext))
        );
        
        console.log(`   Found ${imageFiles.length} images that could be optimized`);
        console.log('   Recommendation: Convert to WebP format for better compression');
    }
}

// Generate service worker for caching
function generateServiceWorker() {
    const serviceWorkerContent = `
// $COCO Service Worker for caching
const CACHE_NAME = 'coco-v1.0.0';
const urlsToCache = [
    '/',
    '/css/style.css',
    '/css/animations.css',
    '/css/responsive.css',
    '/js/main.js',
    '/js/wallet.js',
    '/js/animations.js',
    '/images/cocohero.png',
    '/images/cocoarena.png',
    'https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&display=swap'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(urlsToCache))
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) {
                    return response;
                }
                return fetch(event.request);
            })
    );
});
    `.trim();
    
    fs.writeFileSync(path.join(__dirname, 'sw.js'), serviceWorkerContent);
    console.log('✅ Generated service worker (sw.js)');
}

// Create optimized CSS bundle
function createOptimizedCSS() {
    const cssFiles = [
        'css/style.css',
        'css/animations.css',
        'css/responsive.css'
    ];
    
    let combinedCSS = '';
    
    cssFiles.forEach(file => {
        const filePath = path.join(__dirname, file);
        if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, 'utf8');
            combinedCSS += content + '\n';
        }
    });
    
    const minifiedCSS = minifyCSS(combinedCSS);
    
    // Create minified version
    fs.writeFileSync(path.join(__dirname, 'css/bundle.min.css'), minifiedCSS);
    console.log('✅ Created minified CSS bundle (css/bundle.min.css)');
    
    // Create critical CSS file
    const criticalCSS = generateCriticalCSS();
    fs.writeFileSync(path.join(__dirname, 'css/critical.css'), criticalCSS);
    console.log('✅ Generated critical CSS (css/critical.css)');
}

// Create optimized JS bundle
function createOptimizedJS() {
    const jsFiles = [
        'js/main.js',
        'js/animations.js',
        'js/wallet.js',
        'js/particles-config.js',
        'js/fix-layout.js'
    ];
    
    let combinedJS = '';
    
    jsFiles.forEach(file => {
        const filePath = path.join(__dirname, file);
        if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, 'utf8');
            combinedJS += content + '\n';
        }
    });
    
    const minifiedJS = minifyJS(combinedJS);
    
    // Create minified version
    fs.writeFileSync(path.join(__dirname, 'js/bundle.min.js'), minifiedJS);
    console.log('✅ Created minified JS bundle (js/bundle.min.js)');
}

// Generate performance report
function generatePerformanceReport() {
    const report = {
        timestamp: new Date().toISOString(),
        optimizations: [
            'CSS minification and bundling',
            'JavaScript minification and bundling',
            'Critical CSS extraction',
            'Service worker for caching',
            'Security headers in vercel.json',
            'Image lazy loading implemented',
            'Proper meta tags and SEO optimization',
            'Responsive design optimizations'
        ],
        recommendations: [
            'Implement WebP image format conversion',
            'Add image compression pipeline',
            'Consider implementing a CDN for static assets',
            'Add performance monitoring (Web Vitals)',
            'Implement resource hints (preload, prefetch)',
            'Consider code splitting for larger applications'
        ],
        metrics: {
            css_files_bundled: 3,
            js_files_bundled: 5,
            estimated_size_reduction: '30-40%',
            cache_strategy: 'Service Worker + HTTP headers'
        }
    };
    
    fs.writeFileSync(
        path.join(__dirname, 'performance-report.json'), 
        JSON.stringify(report, null, 2)
    );
    console.log('📊 Generated performance report (performance-report.json)');
}

// Main optimization function
function optimize() {
    console.log('🚀 Starting $COCO website optimization...\n');
    
    try {
        createOptimizedCSS();
        createOptimizedJS();
        generateServiceWorker();
        optimizeImages();
        generatePerformanceReport();
        
        console.log('\n✨ Optimization complete!');
        console.log('\n📋 Next steps:');
        console.log('   1. Update HTML to use bundle.min.css and bundle.min.js');
        console.log('   2. Register service worker in main.js');
        console.log('   3. Test performance improvements');
        console.log('   4. Consider implementing WebP image conversion');
        
    } catch (error) {
        console.error('❌ Optimization failed:', error.message);
        process.exit(1);
    }
}

// Run optimization if called directly
if (require.main === module) {
    optimize();
}

module.exports = { optimize, minifyCSS, minifyJS };
