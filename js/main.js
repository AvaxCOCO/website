/**
 * $COCO - The Pink Ostrich of AVAX
 * Main JavaScript File
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Content Loaded');
    
    // Check if elements exist
    console.log('Hero section exists:', !!document.getElementById('hero'));
    console.log('DeFi section exists:', !!document.getElementById('defi'));
    console.log('How to Buy section exists:', !!document.getElementById('how-to-buy'));
    console.log('Community section exists:', !!document.getElementById('community'));
    console.log('Presale section exists:', !!document.getElementById('presale'));
    console.log('Preloader exists:', !!document.getElementById('preloader'));
    console.log('Particles container exists:', !!document.getElementById('particles-js'));
    
    // Initialize components
    initPreloader();
    initScrollEvents();
    initMobileMenu();
    initCountdown();
    initScrollReveal();
    // Add floating characters dynamically
    addFloatingCharacters();
    
    // Add hover effects to social media icons
    initSocialIconEffects();
    
    // Add animation to step cards
    initStepCardAnimations();
    addFloatingCharacters();
    
    // Force show content immediately
    document.body.style.overflow = 'visible';
    
    // Force show all sections
    const sections = document.querySelectorAll('section');
    sections.forEach(function(section) {
        section.style.display = 'block';
        section.style.opacity = '1';
        section.style.visibility = 'visible';
        console.log('Forced visibility for section:', section.id);
    });
    
    // Remove preloader immediately
    const preloader = document.getElementById('preloader');
    if (preloader) {
        preloader.style.display = 'none';
        console.log('Removed preloader');
    }
});

/**
 * Initialize preloader
 */
function initPreloader() {
    const preloader = document.getElementById('preloader');
    
    // Hide preloader after page loads
    window.addEventListener('load', function() {
        setTimeout(function() {
            preloader.classList.add('preloader-fade-out');
            
            // Enable scrolling after preloader is hidden
            document.body.style.overflow = 'visible';
        }, 1000);
    });
    
    // Fallback to hide preloader if load event doesn't fire
    setTimeout(function() {
        if (preloader && !preloader.classList.contains('preloader-fade-out')) {
            preloader.classList.add('preloader-fade-out');
            document.body.style.overflow = 'visible';
            console.log('Preloader hidden by fallback timer');
        }
    }, 3000);
    
    // Disable scrolling while preloader is active
    document.body.style.overflow = 'hidden';
}

/**
 * Initialize scroll events
 */
function initScrollEvents() {
    const header = document.querySelector('header');
    const scrollDownBtn = document.querySelector('.scroll-down');
    
    // Add scrolled class to header when scrolling down
    window.addEventListener('scroll', function() {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });
    
    // Smooth scroll to sections when clicking on navigation links
    const navLinks = document.querySelectorAll('nav a, .mobile-menu a, .footer-nav a, .scroll-down a');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            
            if (targetId.startsWith('#') && targetId !== '#') {
                e.preventDefault();
                
                const targetSection = document.querySelector(targetId);
                
                if (targetSection) {
                    // Close mobile menu if open
                    document.querySelector('.mobile-menu').classList.remove('active');
                    
                    // Scroll to section
                    window.scrollTo({
                        top: targetSection.offsetTop - 80,
                        behavior: 'smooth'
                    });
                }
            }
        });
    });
}

/**
 * Initialize mobile menu
 */
function initMobileMenu() {
    const menuToggle = document.querySelector('.mobile-menu-toggle');
    const closeMenu = document.querySelector('.close-menu');
    const mobileMenu = document.querySelector('.mobile-menu');
    
    // Open mobile menu
    menuToggle.addEventListener('click', function() {
        mobileMenu.classList.add('active');
    });
    
    // Close mobile menu
    closeMenu.addEventListener('click', function() {
        mobileMenu.classList.remove('active');
    });
    
    // Close mobile menu when clicking outside
    document.addEventListener('click', function(e) {
        if (!mobileMenu.contains(e.target) && !menuToggle.contains(e.target) && mobileMenu.classList.contains('active')) {
            mobileMenu.classList.remove('active');
        }
    });
}

/**
 * Initialize countdown timer
 */
function initCountdown() {
    // Set the countdown date to May 3rd, 2025 at 3:30 PM CST
    const countdownDate = new Date('May 3, 2025 15:30:00 GMT-0600');
    
    // Update countdown every second
    const countdownTimer = setInterval(function() {
        // Get current date and time
        const now = new Date().getTime();
        
        // Calculate the time remaining
        const distance = countdownDate - now;
        
        // Calculate days, hours, minutes, and seconds
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        
        // Display the countdown
        document.getElementById('countdown-days').textContent = days.toString().padStart(2, '0');
        document.getElementById('countdown-hours').textContent = hours.toString().padStart(2, '0');
        document.getElementById('countdown-minutes').textContent = minutes.toString().padStart(2, '0');
        document.getElementById('countdown-seconds').textContent = seconds.toString().padStart(2, '0');
        
        // If the countdown is finished, display a message
        if (distance < 0) {
            clearInterval(countdownTimer);
            document.getElementById('countdown').innerHTML = '<div class="countdown-finished">Presale is Live!</div>';
            document.getElementById('presale-btn').classList.add('btn-pulse');
        }
    }, 1000);
    
    // Add rocket launch animation to presale button
    const presaleBtn = document.getElementById('presale-btn');
    const btnRocket = document.querySelector('.btn-rocket');
    
    if (presaleBtn) {
        presaleBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Add rocket launch animation
            btnRocket.classList.add('rocket-launch');
            
            // Reset animation after it completes
            setTimeout(function() {
                btnRocket.classList.remove('rocket-launch');
            }, 2000);
            
            // Show alert (in a real implementation, this would open a presale modal)
            setTimeout(function() {
                alert('Presale coming soon! Join our community to stay updated.');
            }, 500);
        });
    }
}

/**
 * Initialize scroll reveal animations
 */
function initScrollReveal() {
    const revealElements = document.querySelectorAll('.reveal');
    
    function checkReveal() {
        const windowHeight = window.innerHeight;
        const revealPoint = 150;
        
        revealElements.forEach(element => {
            const revealTop = element.getBoundingClientRect().top;
            
            if (revealTop < windowHeight - revealPoint) {
                element.classList.add('active');
                
                // If this is a step-vertical element, trigger additional animations
                if (element.classList.contains('step-vertical')) {
                    // Add a slight delay for the content to appear after the step becomes visible
                    setTimeout(() => {
                        const contentWrapper = element.querySelector('.step-content-wrapper');
                        if (contentWrapper) {
                            contentWrapper.style.opacity = '1';
                            contentWrapper.style.transform = 'translateY(0)';
                        }
                    }, 200);
                }
            }
        });
    }
    
    // Check on scroll
    window.addEventListener('scroll', checkReveal);
    
    // Check on page load
    checkReveal();
    
    // Add initial transform to step content wrappers for animation
    document.querySelectorAll('.step-vertical').forEach((step, index) => {
        const contentWrapper = step.querySelector('.step-content-wrapper');
        if (contentWrapper) {
            // Set initial state for animation
            contentWrapper.style.opacity = '0';
            
            // Alternate left/right animations
            if (step.classList.contains('reveal-left')) {
                contentWrapper.style.transform = 'translateX(-50px)';
            } else if (step.classList.contains('reveal-right')) {
                contentWrapper.style.transform = 'translateX(50px)';
            } else {
                contentWrapper.style.transform = 'translateY(30px)';
            }
            
            // Add transition properties
            contentWrapper.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
        }
    });
}

/**
 * Add floating characters dynamically
 */
function addFloatingCharacters() {
    const floatingContainer = document.querySelector('.floating-characters');
    const characterImages = [
        'images/transparent images/cocoannounce-transparent.png',
        'images/transparent images/cocotrophy-transparent.png',
        'images/transparent images/cococoffee-transparent.png'
    ];
    
    // Add existing characters
    const existingCharacters = document.querySelectorAll('.floating-character');
    
    // Make sure container exists
    if (!floatingContainer) return;
    
    // Add event listener for mousemove to create subtle parallax effect
    document.addEventListener('mousemove', function(e) {
        const mouseX = e.clientX / window.innerWidth;
        const mouseY = e.clientY / window.innerHeight;
        
        existingCharacters.forEach(character => {
            const offsetX = (mouseX - 0.5) * 20;
            const offsetY = (mouseY - 0.5) * 20;
            const depth = parseFloat(character.getAttribute('data-depth') || 0.1);
            
            character.style.transform = `translate(${offsetX * depth}px, ${offsetY * depth}px)`;
        });
    });
}

/**
 * Initialize social media icon effects
 */
function initSocialIconEffects() {
    // Add hover effects to social icons in footer
    const socialIcons = document.querySelectorAll('.social-icons a');
    socialIcons.forEach(icon => {
        icon.addEventListener('mouseenter', function() {
            const iconElement = this.querySelector('i');
            iconElement.classList.add('fa-beat');
        });
        
        icon.addEventListener('mouseleave', function() {
            const iconElement = this.querySelector('i');
            iconElement.classList.remove('fa-beat');
        });
    });
    
    // Add hover effects to social links in community section
    const socialLinks = document.querySelectorAll('.social-link');
    socialLinks.forEach(link => {
        link.addEventListener('mouseenter', function() {
            const iconElement = this.querySelector('i');
            iconElement.classList.add('fa-beat');
        });
        
        link.addEventListener('mouseleave', function() {
            const iconElement = this.querySelector('i');
            iconElement.classList.remove('fa-beat');
        });
    });
}

/**
 * Initialize step card animations
 */
function initStepCardAnimations() {
    const stepCards = document.querySelectorAll('.step-card');
    
    stepCards.forEach((card, index) => {
        // Add staggered fade-in class
        card.classList.add(`fade-in-${index + 1}`);
        
        // Add hover effect
        card.addEventListener('mouseenter', function() {
            this.classList.add('hover-scale');
            
            // Add pulse effect to step number
            const stepNumber = this.querySelector('.step-number');
            if (stepNumber) {
                stepNumber.classList.add('scale-animation');
            }
        });
        
        card.addEventListener('mouseleave', function() {
            this.classList.remove('hover-scale');
            
            // Remove pulse effect from step number
            const stepNumber = this.querySelector('.step-number');
            if (stepNumber) {
                stepNumber.classList.remove('scale-animation');
            }
        });
    });
}