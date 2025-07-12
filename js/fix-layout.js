// Layout Fix and Optimization for $COCO Website

// Fix layout issues and optimize performance
document.addEventListener('DOMContentLoaded', function() {
    console.log('Layout fixes initialized');
    
    // Fix viewport height issues on mobile
    fixViewportHeight();
    
    // Fix image loading issues
    fixImageLoading();
    
    // Fix scroll behavior
    fixScrollBehavior();
    
    // Fix responsive navigation
    fixResponsiveNav();
    
    // Fix floating characters animation
    fixFloatingCharacters();
    
    // Performance optimizations
    optimizePerformance();
});

// Fix viewport height for mobile devices
function fixViewportHeight() {
    function setVH() {
        let vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
    }
    
    setVH();
    window.addEventListener('resize', setVH);
    window.addEventListener('orientationchange', setVH);
}

// Fix image loading and lazy loading
function fixImageLoading() {
    const images = document.querySelectorAll('img');
    
    images.forEach(img => {
        // Add loading attribute for better performance
        if (!img.hasAttribute('loading')) {
            img.setAttribute('loading', 'lazy');
        }
        
        // Handle image load errors
        img.addEventListener('error', function() {
            console.warn(`Failed to load image: ${this.src}`);
            // You could set a fallback image here
            // this.src = 'images/fallback.png';
        });
        
        // Add loaded class when image loads
        img.addEventListener('load', function() {
            this.classList.add('loaded');
        });
    });
}

// Fix scroll behavior and smooth scrolling
function fixScrollBehavior() {
    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // Fix scroll position on page load
    if (window.location.hash) {
        setTimeout(() => {
            const target = document.querySelector(window.location.hash);
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        }, 100);
    }
}

// Fix responsive navigation
function fixResponsiveNav() {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', function() {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
            document.body.classList.toggle('nav-open');
        });
        
        // Close nav when clicking on a link
        document.querySelectorAll('.nav-menu a').forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
                document.body.classList.remove('nav-open');
            });
        });
        
        // Close nav when clicking outside
        document.addEventListener('click', function(e) {
            if (!hamburger.contains(e.target) && !navMenu.contains(e.target)) {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
                document.body.classList.remove('nav-open');
            }
        });
    }
}

// Fix floating characters animation
function fixFloatingCharacters() {
    const characters = document.querySelectorAll('.floating-character');
    
    characters.forEach((character, index) => {
        // Add random animation delay
        character.style.animationDelay = `${index * 0.5}s`;
        
        // Add intersection observer for performance
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.animationPlayState = 'running';
                } else {
                    entry.target.style.animationPlayState = 'paused';
                }
            });
        });
        
        observer.observe(character);
    });
}

// Performance optimizations
function optimizePerformance() {
    // Debounce scroll events
    let scrollTimeout;
    window.addEventListener('scroll', function() {
        if (scrollTimeout) {
            clearTimeout(scrollTimeout);
        }
        scrollTimeout = setTimeout(handleScroll, 10);
    });
    
    // Debounce resize events
    let resizeTimeout;
    window.addEventListener('resize', function() {
        if (resizeTimeout) {
            clearTimeout(resizeTimeout);
        }
        resizeTimeout = setTimeout(handleResize, 100);
    });
    
    // Preload critical images
    preloadCriticalImages();
    
    // Fix memory leaks
    window.addEventListener('beforeunload', cleanup);
}

function handleScroll() {
    // Add scroll-based optimizations here
    const scrollY = window.scrollY;
    
    // Update header background on scroll
    const header = document.querySelector('.header');
    if (header) {
        if (scrollY > 100) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    }
}

function handleResize() {
    // Handle resize optimizations
    fixViewportHeight();
}

function preloadCriticalImages() {
    const criticalImages = [
        'images/transparent images/cocorockettrspt.png',
        'images/transparent images/cocoofficetrspt.png'
    ];
    
    criticalImages.forEach(src => {
        const img = new Image();
        img.src = src;
    });
}

function cleanup() {
    // Clean up event listeners and intervals
    console.log('Cleaning up resources');
}

// Fix common CSS issues
function addCSSFixes() {
    const style = document.createElement('style');
    style.textContent = `
        /* Fix for iOS Safari viewport units */
        .hero-section {
            min-height: 100vh;
            min-height: calc(var(--vh, 1vh) * 100);
        }
        
        /* Fix for image loading */
        img {
            max-width: 100%;
            height: auto;
        }
        
        img:not(.loaded) {
            opacity: 0;
            transition: opacity 0.3s ease;
        }
        
        img.loaded {
            opacity: 1;
        }
        
        /* Fix for button hover states on touch devices */
        @media (hover: none) {
            .btn:hover {
                transform: none;
            }
        }
        
        /* Fix for nav menu on mobile */
        @media (max-width: 768px) {
            .nav-menu.active {
                display: flex !important;
            }
        }
        
        /* Fix for floating characters on mobile */
        @media (max-width: 768px) {
            .floating-characters {
                display: none;
            }
        }
        
        /* Fix for scroll behavior */
        html {
            scroll-behavior: smooth;
        }
        
        /* Fix for focus states */
        button:focus,
        a:focus {
            outline: 2px solid var(--primary-color);
            outline-offset: 2px;
        }
    `;
    document.head.appendChild(style);
}

// Initialize CSS fixes
addCSSFixes();

// Export functions for external use
window.layoutFixes = {
    fixViewportHeight,
    fixImageLoading,
    fixScrollBehavior,
    fixResponsiveNav,
    fixFloatingCharacters
};

console.log('Layout fixes loaded successfully! 🔧');
