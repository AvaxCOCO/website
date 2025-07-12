/*
 * $COCO - Animations JavaScript
 * Advanced animations and effects
 */

// ===== GSAP Animations =====
document.addEventListener('DOMContentLoaded', function() {
    // Check if GSAP is loaded
    if (typeof gsap !== 'undefined') {
        initGSAPAnimations();
    }
    
    initCustomAnimations();
    initScrollTriggerAnimations();
});

// ===== GSAP Animations =====
function initGSAPAnimations() {
    // Register ScrollTrigger plugin
    if (typeof ScrollTrigger !== 'undefined') {
        gsap.registerPlugin(ScrollTrigger);
    }
    
    // Hero section animations
    const heroTimeline = gsap.timeline();
    
    heroTimeline
        .from('.hero-text h1', {
            duration: 1,
            y: 50,
            opacity: 0,
            ease: 'power3.out'
        })
        .from('.hero-text h2', {
            duration: 0.8,
            y: 30,
            opacity: 0,
            ease: 'power3.out'
        }, '-=0.5')
        .from('.hero-text p', {
            duration: 0.8,
            y: 30,
            opacity: 0,
            ease: 'power3.out'
        }, '-=0.3')
        .from('.hero-buttons .btn', {
            duration: 0.6,
            y: 20,
            opacity: 0,
            stagger: 0.2,
            ease: 'power3.out'
        }, '-=0.3')
        .from('.hero-coco-img', {
            duration: 1.2,
            scale: 0.8,
            opacity: 0,
            ease: 'elastic.out(1, 0.5)'
        }, '-=0.8');
    
    // Floating COCO animation
    gsap.to('.hero-coco-img', {
        y: -20,
        duration: 3,
        ease: 'power1.inOut',
        yoyo: true,
        repeat: -1
    });
    
    // Section reveal animations
    gsap.utils.toArray('section').forEach((section, index) => {
        if (index === 0) return; // Skip hero section
        
        gsap.from(section.querySelector('.section-header'), {
            scrollTrigger: {
                trigger: section,
                start: 'top 80%',
                end: 'bottom 20%',
                toggleActions: 'play none none reverse'
            },
            duration: 0.8,
            y: 50,
            opacity: 0,
            ease: 'power3.out'
        });
    });
    
    // Step cards animation
    gsap.utils.toArray('.step-card').forEach((card, index) => {
        gsap.from(card, {
            scrollTrigger: {
                trigger: card,
                start: 'top 85%',
                toggleActions: 'play none none reverse'
            },
            duration: 0.6,
            y: 50,
            opacity: 0,
            delay: index * 0.1,
            ease: 'power3.out'
        });
    });
    
    // Launch section animations
    const launchTl = gsap.timeline({
        scrollTrigger: {
            trigger: '.launch-section',
            start: 'top 70%',
            toggleActions: 'play none none reverse'
        }
    });
    
    launchTl
        .from('.launch-info', {
            duration: 0.8,
            x: -50,
            opacity: 0,
            ease: 'power3.out'
        })
        .from('.launch-action', {
            duration: 0.8,
            x: 50,
            opacity: 0,
            ease: 'power3.out'
        }, '-=0.4')
        .from('.launch-img', {
            duration: 1,
            scale: 0.8,
            opacity: 0,
            ease: 'elastic.out(1, 0.5)'
        }, '-=0.4');
    
    // Button hover animations
    gsap.utils.toArray('.btn').forEach(button => {
        button.addEventListener('mouseenter', () => {
            gsap.to(button, {
                duration: 0.3,
                scale: 1.05,
                ease: 'power2.out'
            });
        });
        
        button.addEventListener('mouseleave', () => {
            gsap.to(button, {
                duration: 0.3,
                scale: 1,
                ease: 'power2.out'
            });
        });
    });
    
    // Rocket button special animation
    gsap.utils.toArray('.rocket-btn').forEach(button => {
        const rocket = button.querySelector('.btn-rocket');
        if (rocket) {
            button.addEventListener('mouseenter', () => {
                gsap.to(rocket, {
                    duration: 0.5,
                    x: 5,
                    y: -10,
                    rotation: 10,
                    ease: 'power2.out'
                });
            });
            
            button.addEventListener('mouseleave', () => {
                gsap.to(rocket, {
                    duration: 0.5,
                    x: 0,
                    y: 0,
                    rotation: 0,
                    ease: 'power2.out'
                });
            });
        }
    });
}

// ===== Custom Animations =====
function initCustomAnimations() {
    // Typewriter effect for hero text
    typewriterEffect('.hero-text h1', 100);
    
    // Number counter animation
    animateCounters();
    
    // Particle effects
    createParticles();
    
    // Loading dots animation
    animateLoadingDots();
}

// ===== Typewriter Effect =====
function typewriterEffect(selector, speed = 100) {
    const element = document.querySelector(selector);
    if (!element) return;
    
    const text = element.textContent;
    element.textContent = '';
    element.style.borderRight = '2px solid var(--primary-color)';
    
    let i = 0;
    const timer = setInterval(() => {
        if (i < text.length) {
            element.textContent += text.charAt(i);
            i++;
        } else {
            clearInterval(timer);
            // Remove cursor after typing is complete
            setTimeout(() => {
                element.style.borderRight = 'none';
            }, 1000);
        }
    }, speed);
}

// ===== Number Counter Animation =====
function animateCounters() {
    const counters = document.querySelectorAll('[data-count]');
    
    const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const counter = entry.target;
                const target = parseInt(counter.dataset.count);
                const duration = parseInt(counter.dataset.duration) || 2000;
                
                animateNumber(counter, 0, target, duration);
                counterObserver.unobserve(counter);
            }
        });
    });
    
    counters.forEach(counter => {
        counterObserver.observe(counter);
    });
}

function animateNumber(element, start, end, duration) {
    const startTime = performance.now();
    
    function updateNumber(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function (ease out)
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const current = Math.floor(start + (end - start) * easeOut);
        
        element.textContent = current.toLocaleString();
        
        if (progress < 1) {
            requestAnimationFrame(updateNumber);
        }
    }
    
    requestAnimationFrame(updateNumber);
}

// ===== Particle Effects =====
function createParticles() {
    const particleContainer = document.createElement('div');
    particleContainer.className = 'particle-container';
    particleContainer.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: -1;
        overflow: hidden;
    `;
    
    document.body.appendChild(particleContainer);
    
    // Create particles periodically
    setInterval(() => {
        if (Math.random() < 0.3) { // 30% chance every interval
            createParticle(particleContainer);
        }
    }, 2000);
}

function createParticle(container) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    
    // Random properties
    const size = Math.random() * 6 + 2;
    const left = Math.random() * 100;
    const animationDuration = Math.random() * 3 + 4;
    const opacity = Math.random() * 0.5 + 0.1;
    
    particle.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        background: var(--primary-color);
        border-radius: 50%;
        left: ${left}%;
        bottom: -10px;
        opacity: ${opacity};
        animation: particle-float ${animationDuration}s linear forwards;
    `;
    
    container.appendChild(particle);
    
    // Remove particle after animation
    setTimeout(() => {
        if (particle.parentNode) {
            particle.parentNode.removeChild(particle);
        }
    }, animationDuration * 1000);
}

// ===== Loading Dots Animation =====
function animateLoadingDots() {
    const loadingElements = document.querySelectorAll('.loading-dots');
    
    loadingElements.forEach(element => {
        let dotCount = 0;
        const maxDots = 3;
        
        setInterval(() => {
            dotCount = (dotCount + 1) % (maxDots + 1);
            element.textContent = element.textContent.replace(/\.+$/, '') + '.'.repeat(dotCount);
        }, 500);
    });
}

// ===== Scroll Trigger Animations =====
function initScrollTriggerAnimations() {
    // Parallax backgrounds
    const parallaxElements = document.querySelectorAll('[data-parallax]');
    
    parallaxElements.forEach(element => {
        const speed = parseFloat(element.dataset.parallax) || 0.5;
        
        if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
            gsap.to(element, {
                yPercent: -50 * speed,
                ease: 'none',
                scrollTrigger: {
                    trigger: element,
                    start: 'top bottom',
                    end: 'bottom top',
                    scrub: true
                }
            });
        }
    });
    
    // Stagger animations for lists
    const staggerLists = document.querySelectorAll('[data-stagger]');
    
    staggerLists.forEach(list => {
        const items = list.children;
        const staggerDelay = parseFloat(list.dataset.stagger) || 0.1;
        
        if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
            gsap.from(items, {
                duration: 0.6,
                y: 30,
                opacity: 0,
                stagger: staggerDelay,
                ease: 'power3.out',
                scrollTrigger: {
                    trigger: list,
                    start: 'top 80%',
                    toggleActions: 'play none none reverse'
                }
            });
        }
    });
}

// ===== Text Animations =====
function initTextAnimations() {
    // Split text for character-by-character animation
    const splitTexts = document.querySelectorAll('[data-split]');
    
    splitTexts.forEach(element => {
        const text = element.textContent;
        element.innerHTML = '';
        
        [...text].forEach((char, index) => {
            const span = document.createElement('span');
            span.textContent = char === ' ' ? '\u00A0' : char;
            span.style.display = 'inline-block';
            span.style.opacity = '0';
            span.style.transform = 'translateY(20px)';
            span.style.transition = `all 0.5s ease ${index * 0.05}s`;
            element.appendChild(span);
        });
        
        // Trigger animation when element comes into view
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const spans = entry.target.querySelectorAll('span');
                    spans.forEach(span => {
                        span.style.opacity = '1';
                        span.style.transform = 'translateY(0)';
                    });
                    observer.unobserve(entry.target);
                }
            });
        });
        
        observer.observe(element);
    });
}

// ===== Mouse Follow Effect =====
function initMouseFollowEffect() {
    const cursor = document.createElement('div');
    cursor.className = 'custom-cursor';
    cursor.style.cssText = `
        position: fixed;
        width: 20px;
        height: 20px;
        background: var(--primary-color);
        border-radius: 50%;
        pointer-events: none;
        z-index: 9999;
        opacity: 0;
        transition: opacity 0.3s ease;
        mix-blend-mode: difference;
    `;
    
    document.body.appendChild(cursor);
    
    let mouseX = 0;
    let mouseY = 0;
    let cursorX = 0;
    let cursorY = 0;
    
    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        cursor.style.opacity = '1';
    });
    
    document.addEventListener('mouseleave', () => {
        cursor.style.opacity = '0';
    });
    
    // Smooth cursor movement
    function updateCursor() {
        cursorX += (mouseX - cursorX) * 0.1;
        cursorY += (mouseY - cursorY) * 0.1;
        
        cursor.style.left = cursorX - 10 + 'px';
        cursor.style.top = cursorY - 10 + 'px';
        
        requestAnimationFrame(updateCursor);
    }
    
    updateCursor();
    
    // Cursor interactions
    const interactiveElements = document.querySelectorAll('a, button, .btn');
    
    interactiveElements.forEach(element => {
        element.addEventListener('mouseenter', () => {
            cursor.style.transform = 'scale(1.5)';
            cursor.style.background = 'var(--secondary-color)';
        });
        
        element.addEventListener('mouseleave', () => {
            cursor.style.transform = 'scale(1)';
            cursor.style.background = 'var(--primary-color)';
        });
    });
}

// ===== Performance Monitoring =====
function monitorAnimationPerformance() {
    let frameCount = 0;
    let lastTime = performance.now();
    
    function measureFPS() {
        frameCount++;
        const currentTime = performance.now();
        
        if (currentTime - lastTime >= 1000) {
            const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
            
            // Log FPS for debugging
            if (fps < 30) {
                console.warn('Low FPS detected:', fps);
            }
            
            frameCount = 0;
            lastTime = currentTime;
        }
        
        requestAnimationFrame(measureFPS);
    }
    
    requestAnimationFrame(measureFPS);
}

// ===== Initialize Advanced Animations =====
document.addEventListener('DOMContentLoaded', function() {
    // Only initialize advanced features if performance is good
    if (navigator.hardwareConcurrency >= 4) {
        initTextAnimations();
        // initMouseFollowEffect(); // Disabled - causing pink line issue
    }
    
    // Always monitor performance
    monitorAnimationPerformance();
});

// ===== Export Animation Functions =====
window.CocoAnimations = {
    typewriterEffect,
    animateNumber,
    createParticle
};
