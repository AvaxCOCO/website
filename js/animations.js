/**
 * $COCO - The Pink Ostrich of AVAX
 * Animations JavaScript File
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize animations
    initHeroAnimations();
    initButtonAnimations();
    initSectionAnimations();
    initHoverAnimations();
    initStepVerticalAnimations();
});

/**
 * Initialize hero section animations
 */
function initHeroAnimations() {
    // Animate hero content on page load
    const heroText = document.querySelector('.hero-text');
    const heroImage = document.querySelector('.hero-image');
    
    if (heroText && heroImage) {
        // Add fade-in animations with delay
        heroText.classList.add('fade-in');
        heroImage.classList.add('fade-in');
        
        // Add floating animation to hero image
        const heroCocoImg = document.querySelector('.hero-coco-img');
        if (heroCocoImg) {
            heroCocoImg.classList.add('float');
        }
    }
    
    // Add parallax effect to hero section
    const heroSection = document.querySelector('.hero-section');
    
    if (heroSection) {
        window.addEventListener('scroll', function() {
            const scrollPosition = window.scrollY;
            heroSection.style.backgroundPosition = `center ${scrollPosition * 0.5}px`;
        });
    }
}

/**
 * Initialize button animations
 */
function initButtonAnimations() {
    // Add hover animations to buttons
    const buttons = document.querySelectorAll('.btn');
    
    buttons.forEach(button => {
        button.addEventListener('mouseenter', function() {
            this.classList.add('hover-scale');
        });
        
        button.addEventListener('mouseleave', function() {
            this.classList.remove('hover-scale');
        });
    });
    
    // Add special animation to rocket button
    const rocketBtn = document.querySelector('.rocket-btn');
    
    if (rocketBtn) {
        rocketBtn.addEventListener('mouseenter', function() {
            const btnRocket = this.querySelector('.btn-rocket');
            if (btnRocket) {
                btnRocket.classList.add('hover-float');
            }
        });
        
        rocketBtn.addEventListener('mouseleave', function() {
            const btnRocket = this.querySelector('.btn-rocket');
            if (btnRocket) {
                btnRocket.classList.remove('hover-float');
            }
        });
    }
}

/**
 * Initialize section animations
 */
function initSectionAnimations() {
    // Add scroll reveal animations to sections
    const sections = document.querySelectorAll('section');
    
    sections.forEach((section, index) => {
        // Add reveal class based on index (alternating left/right)
        if (index % 2 === 0) {
            section.classList.add('reveal', 'reveal-left');
        } else {
            section.classList.add('reveal', 'reveal-right');
        }
    });
    
    // Add reveal animations to cards
    const cards = document.querySelectorAll('.defi-card, .step-card');
    
    cards.forEach((card, index) => {
        card.classList.add('reveal', 'reveal-bottom');
        // Add delay based on index
        card.style.transitionDelay = `${index * 0.1}s`;
    });
    
    // Add animations to benefits diagram
    const diagramSteps = document.querySelectorAll('.diagram-step');
    
    diagramSteps.forEach((step, index) => {
        step.classList.add('reveal', 'reveal-bottom');
        step.style.transitionDelay = `${index * 0.2}s`;
    });
    
    // Add pulse animation to coming soon badge
    const comingSoonBadge = document.querySelector('.coming-soon-badge');
    
    if (comingSoonBadge) {
        comingSoonBadge.classList.add('pulse');
    }
}

/**
 * Initialize hover animations
 */
function initHoverAnimations() {
    // Add hover animations to cards
    const cards = document.querySelectorAll('.defi-card, .step-card');
    
    cards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.classList.add('hover-float');
        });
        
        card.addEventListener('mouseleave', function() {
            this.classList.remove('hover-float');
        });
    });
    
    // Add hover animations to social links
    const socialLinks = document.querySelectorAll('.social-link, .social-icons a');
    
    socialLinks.forEach(link => {
        link.addEventListener('mouseenter', function() {
            this.classList.add('hover-scale');
        });
        
        link.addEventListener('mouseleave', function() {
            this.classList.remove('hover-scale');
        });
    });
}

/**
 * Create animated particles
 * @param {HTMLElement} container - Container element for particles
 * @param {number} count - Number of particles to create
 */
function createParticles(container, count) {
    // Clear existing particles
    container.innerHTML = '';
    
    // Create new particles
    for (let i = 0; i < count; i++) {
        const particle = document.createElement('div');
        particle.classList.add('particle');
        
        // Random position
        const posX = Math.random() * 100;
        const posY = Math.random() * 100;
        
        // Random size
        const size = Math.random() * 5 + 2;
        
        // Random animation duration
        const duration = Math.random() * 20 + 10;
        
        // Random animation delay
        const delay = Math.random() * 5;
        
        // Set styles
        particle.style.left = `${posX}%`;
        particle.style.top = `${posY}%`;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.animationDuration = `${duration}s`;
        particle.style.animationDelay = `${delay}s`;
        
        // Add to container
        container.appendChild(particle);
    }
}

/**
 * Add typing animation to element
 * @param {HTMLElement} element - Element to add typing animation to
 * @param {string} text - Text to type
 * @param {number} speed - Typing speed in milliseconds
 */
function typeText(element, text, speed) {
    let i = 0;
    element.textContent = '';
    element.classList.add('typing');
    
    function type() {
        if (i < text.length) {
            element.textContent += text.charAt(i);
            i++;
            setTimeout(type, speed);
        } else {
            element.classList.remove('typing');
        }
    }
    
    type();
}

/**
 * Add shake animation to element
 * @param {HTMLElement} element - Element to add shake animation to
 */
function shakeElement(element) {
    element.classList.add('shake');
    
    // Remove animation class after it completes
    setTimeout(function() {
        element.classList.remove('shake');
    }, 500);
}

/**
 * Add glow animation to element
 * @param {HTMLElement} element - Element to add glow animation to
 * @param {number} duration - Duration of glow in milliseconds
 */
function glowElement(element, duration) {
    element.classList.add('glow');
    
    // Remove animation class after specified duration
    if (duration) {
        setTimeout(function() {
            element.classList.remove('glow');
        }, duration);
    }
}

/**
 * Initialize animations for vertical steps
 */
function initStepVerticalAnimations() {
    const stepVerticals = document.querySelectorAll('.step-vertical');
    
    // Add scroll observer for step animations
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                
                // Animate the image
                const img = entry.target.querySelector('.step-img');
                if (img) {
                    img.classList.add('fade-in');
                }
                
                // Animate the content with a slight delay
                const content = entry.target.querySelector('.step-content-vertical');
                if (content) {
                    setTimeout(() => {
                        content.classList.add('fade-in');
                    }, 300);
                }
                
                // Animate the step number
                const stepNumber = entry.target.querySelector('.step-number-vertical');
                if (stepNumber) {
                    stepNumber.classList.add('scale-animation');
                    setTimeout(() => {
                        stepNumber.classList.remove('scale-animation');
                    }, 1500);
                }
            }
        });
    }, {
        threshold: 0.2
    });
    
    // Observe each step
    stepVerticals.forEach(step => {
        observer.observe(step);
        
        // Add hover effects to step content wrapper
        const contentWrapper = step.querySelector('.step-content-wrapper');
        if (contentWrapper) {
            contentWrapper.addEventListener('mouseenter', function() {
                this.style.transform = 'translateY(-5px)';
                this.style.boxShadow = '0 10px 25px rgba(255, 20, 147, 0.4)';
            });
            
            contentWrapper.addEventListener('mouseleave', function() {
                this.style.transform = 'translateY(0)';
                this.style.boxShadow = 'var(--shadow-lg)';
            });
        }
    });
}