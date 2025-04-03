/**
 * $COCO - The Pink Ostrich of AVAX
 * Particles Configuration File
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize particles
    initParticles();
});

/**
 * Initialize particles background
 */
function initParticles() {
    if (typeof particlesJS !== 'undefined') {
        particlesJS('particles-js', {
            "particles": {
                "number": {
                    "value": 80,
                    "density": {
                        "enable": true,
                        "value_area": 800
                    }
                },
                "color": {
                    "value": ["#FF1493", "#8A2BE2", "#2AAA8A"]
                },
                "shape": {
                    "type": ["circle", "triangle", "star"],
                    "stroke": {
                        "width": 0,
                        "color": "#000000"
                    },
                    "polygon": {
                        "nb_sides": 5
                    }
                },
                "opacity": {
                    "value": 0.5,
                    "random": true,
                    "anim": {
                        "enable": true,
                        "speed": 1,
                        "opacity_min": 0.1,
                        "sync": false
                    }
                },
                "size": {
                    "value": 3,
                    "random": true,
                    "anim": {
                        "enable": true,
                        "speed": 2,
                        "size_min": 0.1,
                        "sync": false
                    }
                },
                "line_linked": {
                    "enable": true,
                    "distance": 150,
                    "color": "#FF1493",
                    "opacity": 0.2,
                    "width": 1
                },
                "move": {
                    "enable": true,
                    "speed": 2,
                    "direction": "none",
                    "random": true,
                    "straight": false,
                    "out_mode": "out",
                    "bounce": false,
                    "attract": {
                        "enable": true,
                        "rotateX": 600,
                        "rotateY": 1200
                    }
                }
            },
            "interactivity": {
                "detect_on": "canvas",
                "events": {
                    "onhover": {
                        "enable": true,
                        "mode": "grab"
                    },
                    "onclick": {
                        "enable": true,
                        "mode": "push"
                    },
                    "resize": true
                },
                "modes": {
                    "grab": {
                        "distance": 140,
                        "line_linked": {
                            "opacity": 0.8
                        }
                    },
                    "bubble": {
                        "distance": 400,
                        "size": 40,
                        "duration": 2,
                        "opacity": 8,
                        "speed": 3
                    },
                    "repulse": {
                        "distance": 200,
                        "duration": 0.4
                    },
                    "push": {
                        "particles_nb": 4
                    },
                    "remove": {
                        "particles_nb": 2
                    }
                }
            },
            "retina_detect": true
        });
    } else {
        console.warn('particles.js not loaded');
        
        // Fallback to simple CSS background
        const particlesContainer = document.getElementById('particles-js');
        if (particlesContainer) {
            particlesContainer.style.background = 'radial-gradient(circle, rgba(26, 3, 71, 0.8) 0%, rgba(13, 2, 33, 1) 100%)';
        }
    }
}

/**
 * Create custom particle effect for specific elements
 * @param {string} selector - CSS selector for target elements
 */
function createElementParticles(selector) {
    const elements = document.querySelectorAll(selector);
    
    elements.forEach(element => {
        // Create particle container
        const particleContainer = document.createElement('div');
        particleContainer.className = 'particles-container';
        element.appendChild(particleContainer);
        
        // Create particles
        for (let i = 0; i < 20; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            
            // Random position
            const posX = Math.random() * 100;
            const posY = Math.random() * 100;
            
            // Random size
            const size = Math.random() * 5 + 2;
            
            // Random color
            const colors = ['#FF1493', '#8A2BE2', '#2AAA8A'];
            const color = colors[Math.floor(Math.random() * colors.length)];
            
            // Set styles
            particle.style.left = `${posX}%`;
            particle.style.top = `${posY}%`;
            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;
            particle.style.backgroundColor = color;
            
            // Add to container
            particleContainer.appendChild(particle);
        }
    });
}

/**
 * Create particle trail effect for mouse movement
 */
function createMouseTrailEffect() {
    // Create container for particles
    const trailContainer = document.createElement('div');
    trailContainer.className = 'trail-container';
    document.body.appendChild(trailContainer);
    
    // Track mouse movement
    document.addEventListener('mousemove', (e) => {
        // Create particle
        const particle = document.createElement('div');
        particle.className = 'trail-particle';
        
        // Random size
        const size = Math.random() * 5 + 2;
        
        // Random color
        const colors = ['#FF1493', '#8A2BE2', '#2AAA8A'];
        const color = colors[Math.floor(Math.random() * colors.length)];
        
        // Set styles
        particle.style.left = `${e.clientX}px`;
        particle.style.top = `${e.clientY}px`;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.backgroundColor = color;
        
        // Add to container
        trailContainer.appendChild(particle);
        
        // Remove particle after animation
        setTimeout(() => {
            particle.remove();
        }, 1000);
    });
}

/**
 * Create confetti effect
 * @param {HTMLElement} element - Target element to trigger confetti
 */
function createConfettiEffect(element) {
    if (!element) return;
    
    element.addEventListener('click', (e) => {
        // Create container for confetti
        const confettiContainer = document.createElement('div');
        confettiContainer.className = 'confetti-container';
        confettiContainer.style.position = 'fixed';
        confettiContainer.style.top = '0';
        confettiContainer.style.left = '0';
        confettiContainer.style.width = '100%';
        confettiContainer.style.height = '100%';
        confettiContainer.style.pointerEvents = 'none';
        confettiContainer.style.zIndex = '9999';
        document.body.appendChild(confettiContainer);
        
        // Create confetti pieces
        for (let i = 0; i < 100; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            
            // Random position
            const posX = e.clientX;
            const posY = e.clientY;
            
            // Random size
            const size = Math.random() * 10 + 5;
            
            // Random color
            const colors = ['#FF1493', '#8A2BE2', '#2AAA8A', '#FF69B4', '#9370DB'];
            const color = colors[Math.floor(Math.random() * colors.length)];
            
            // Random rotation
            const rotation = Math.random() * 360;
            
            // Random shape
            const shapes = ['circle', 'square', 'triangle'];
            const shape = shapes[Math.floor(Math.random() * shapes.length)];
            
            // Set styles
            confetti.style.left = `${posX}px`;
            confetti.style.top = `${posY}px`;
            confetti.style.width = `${size}px`;
            confetti.style.height = `${size}px`;
            confetti.style.backgroundColor = color;
            confetti.style.transform = `rotate(${rotation}deg)`;
            
            if (shape === 'circle') {
                confetti.style.borderRadius = '50%';
            } else if (shape === 'triangle') {
                confetti.style.width = '0';
                confetti.style.height = '0';
                confetti.style.backgroundColor = 'transparent';
                confetti.style.borderLeft = `${size/2}px solid transparent`;
                confetti.style.borderRight = `${size/2}px solid transparent`;
                confetti.style.borderBottom = `${size}px solid ${color}`;
            }
            
            // Add animation
            confetti.style.animation = `confetti-fall ${Math.random() * 3 + 2}s ease-out forwards`;
            
            // Add to container
            confettiContainer.appendChild(confetti);
        }
        
        // Remove container after animation
        setTimeout(() => {
            confettiContainer.remove();
        }, 5000);
    });
    
    // Add CSS for confetti animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes confetti-fall {
            0% {
                transform: translateY(0) rotate(0deg);
                opacity: 1;
            }
            100% {
                transform: translateY(1000px) rotate(720deg);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
}