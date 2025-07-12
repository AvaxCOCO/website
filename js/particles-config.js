// Particles.js Configuration for $COCO Website

// Initialize particles when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Check if particles.js is loaded and particles container exists
    if (typeof particlesJS !== 'undefined' && document.getElementById('particles-js')) {
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
                    "value": ["#FF1493", "#FF69B4", "#8A2BE2", "#2AAA8A"]
                },
                "shape": {
                    "type": "circle",
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
                    "random": false,
                    "anim": {
                        "enable": false,
                        "speed": 1,
                        "opacity_min": 0.1,
                        "sync": false
                    }
                },
                "size": {
                    "value": 3,
                    "random": true,
                    "anim": {
                        "enable": false,
                        "speed": 40,
                        "size_min": 0.1,
                        "sync": false
                    }
                },
                "line_linked": {
                    "enable": true,
                    "distance": 150,
                    "color": "#FF1493",
                    "opacity": 0.4,
                    "width": 1
                },
                "move": {
                    "enable": true,
                    "speed": 6,
                    "direction": "none",
                    "random": false,
                    "straight": false,
                    "out_mode": "out",
                    "bounce": false,
                    "attract": {
                        "enable": false,
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
                        "mode": "repulse"
                    },
                    "onclick": {
                        "enable": true,
                        "mode": "push"
                    },
                    "resize": true
                },
                "modes": {
                    "grab": {
                        "distance": 400,
                        "line_linked": {
                            "opacity": 1
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
        
        console.log('Particles.js initialized successfully! ✨');
    } else {
        console.log('Particles.js not loaded or container not found');
    }
});

// Fallback function if particles.js fails to load
function initFallbackBackground() {
    const particlesContainer = document.getElementById('particles-js');
    if (particlesContainer && !particlesContainer.hasChildNodes()) {
        // Create a simple animated background as fallback
        particlesContainer.style.background = `
            linear-gradient(45deg, 
                rgba(255, 20, 147, 0.1) 0%, 
                rgba(138, 43, 226, 0.1) 50%, 
                rgba(42, 170, 138, 0.1) 100%)
        `;
        particlesContainer.style.animation = 'gradientShift 10s ease-in-out infinite';
        
        // Add CSS animation if not already present
        if (!document.querySelector('#fallback-animation-style')) {
            const style = document.createElement('style');
            style.id = 'fallback-animation-style';
            style.textContent = `
                @keyframes gradientShift {
                    0%, 100% { 
                        background: linear-gradient(45deg, 
                            rgba(255, 20, 147, 0.1) 0%, 
                            rgba(138, 43, 226, 0.1) 50%, 
                            rgba(42, 170, 138, 0.1) 100%);
                    }
                    50% { 
                        background: linear-gradient(45deg, 
                            rgba(42, 170, 138, 0.1) 0%, 
                            rgba(255, 20, 147, 0.1) 50%, 
                            rgba(138, 43, 226, 0.1) 100%);
                    }
                }
            `;
            document.head.appendChild(style);
        }
        
        console.log('Fallback background initialized');
    }
}

// Initialize fallback after a delay if particles.js doesn't load
setTimeout(() => {
    if (typeof particlesJS === 'undefined') {
        initFallbackBackground();
    }
}, 2000);
