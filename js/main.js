/**
 * $COCO - The Pink Ostrich of AVAX
 * Main JavaScript File
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Content Loaded');

    // Initialize components
    initPreloader(); // Call preloader logic first
    initScrollEvents();
    initMobileMenu();
    initCountdown();
    initScrollReveal();
    addFloatingCharacters();
    initSocialIconEffects();
    initStepCardAnimations();

    // Debug logs to check if elements exist (can be removed later)
    console.log('Hero section exists:', !!document.getElementById('hero'));
    console.log('DeFi section exists:', !!document.getElementById('defi'));
    console.log('How to Buy section exists:', !!document.getElementById('how-to-buy'));
    console.log('Community section exists:', !!document.getElementById('community'));
    console.log('Presale section exists:', !!document.getElementById('presale'));
    console.log('Particles container exists:', !!document.getElementById('particles-js'));
});

/**
 * Initialize preloader and manage body overflow
 */
function initPreloader() {
    const preloader = document.getElementById('preloader');
    console.log('Preloader exists:', !!preloader);

    if (preloader) {
        // Preloader exists, so hide overflow initially
        document.body.style.overflow = 'hidden';
        console.log('Preloader found, overflow set to hidden.');

        const hidePreloader = () => {
            // Check preloader element again inside async callback
            const currentPreloader = document.getElementById('preloader');
            if (currentPreloader && !currentPreloader.classList.contains('preloader-fade-out')) {
                currentPreloader.classList.add('preloader-fade-out');
                // Enable scrolling ONLY after preloader is hidden
                document.body.style.overflow = 'visible';
                console.log('Preloader hidden, overflow set to visible.');
                 // Clean up listeners to prevent multiple calls
                window.removeEventListener('load', loadListener);
                clearTimeout(fallbackTimeout);
            }
        };

        const loadListener = () => {
            console.log('Window load event fired.');
            setTimeout(hidePreloader, 1000); // Delay fade-out slightly after load
        };

        // Hide preloader after page loads
        window.addEventListener('load', loadListener);

        // Fallback to hide preloader if load event takes too long
        const fallbackTimeout = setTimeout(() => {
            console.log('Preloader fallback timer fired.');
            hidePreloader();
        }, 3000); // Adjust fallback delay if needed

    } else {
        // No preloader found, ensure scrolling is enabled immediately
        document.body.style.overflow = 'visible';
        console.log('No preloader element found, overflow set to visible.');
    }
}


/**
 * Initialize scroll events
 */
function initScrollEvents() {
    const header = document.querySelector('header');
    const scrollDownBtn = document.querySelector('.scroll-down');

    // Add scrolled class to header when scrolling down
    if (header) {
        window.addEventListener('scroll', function() {
            if (window.scrollY > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        });
    } else {
         console.warn('Header element not found for scroll events.');
    }


    // Smooth scroll to sections when clicking on navigation links
    const navLinks = document.querySelectorAll('nav a, .mobile-menu a, .footer-nav a, .scroll-down a');

    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');

            if (targetId && targetId.startsWith('#') && targetId !== '#') {
                e.preventDefault();

                const targetSection = document.querySelector(targetId);
                const mobileMenu = document.querySelector('.mobile-menu'); // Define mobileMenu here

                if (targetSection) {
                    // Close mobile menu if open
                    if (mobileMenu) { // Check if mobileMenu exists
                       mobileMenu.classList.remove('active');
                    }


                    // Scroll to section (adjust offset as needed)
                    window.scrollTo({
                        top: targetSection.offsetTop - 80, // Adjust 80 if header height changes
                        behavior: 'smooth'
                    });
                } else {
                    console.warn('Target section not found for link:', targetId);
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

    if (menuToggle && closeMenu && mobileMenu) {
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
            // Check if the click is outside the menu AND outside the toggle button
            if (!mobileMenu.contains(e.target) && !menuToggle.contains(e.target) && mobileMenu.classList.contains('active')) {
                mobileMenu.classList.remove('active');
            }
        });
    } else {
         console.warn('Mobile menu elements not found. Ensure .mobile-menu-toggle, .close-menu, and .mobile-menu exist.');
    }

}

/**
 * Initialize countdown timer
 */
function initCountdown() {
    const countdownElement = document.getElementById('countdown');
    if (!countdownElement) {
        // Don't run if countdown element isn't on the page
        return;
    }

    // Set the countdown date to May 3rd, 2025 at 3:30 PM CST (UTC-5 during CDT, UTC-6 during CST)
    // Check current timezone offset carefully. Assuming CDT (UTC-5) for May.
    // Format: 'YYYY-MM-DDTHH:mm:ssZ' or Date object. Using UTC is safer.
    // May 3, 2025 15:30:00 UTC-05:00
    const countdownDate = new Date(Date.UTC(2025, 4, 3, 20, 30, 0)); // May is month 4 (0-indexed), 15:30 CST = 20:30 UTC

    const daysElement = document.getElementById('countdown-days');
    const hoursElement = document.getElementById('countdown-hours');
    const minutesElement = document.getElementById('countdown-minutes');
    const secondsElement = document.getElementById('countdown-seconds');
    const presaleBtn = document.getElementById('presale-btn');
    const btnRocket = presaleBtn ? presaleBtn.querySelector('.btn-rocket') : null;


    // Update countdown every second
    const countdownTimer = setInterval(function() {
        // Get current date and time in UTC
        const now = new Date().getTime();

        // Calculate the time remaining
        const distance = countdownDate.getTime() - now; // Use getTime() for consistency

        // Calculate days, hours, minutes, and seconds
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        // Display the countdown
        if (daysElement) daysElement.textContent = days.toString().padStart(2, '0');
        if (hoursElement) hoursElement.textContent = hours.toString().padStart(2, '0');
        if (minutesElement) minutesElement.textContent = minutes.toString().padStart(2, '0');
        if (secondsElement) secondsElement.textContent = seconds.toString().padStart(2, '0');

        // If the countdown is finished, display a message
        if (distance < 0) {
            clearInterval(countdownTimer);
            countdownElement.innerHTML = '<div class="countdown-finished">Presale is Live!</div>';
            if(presaleBtn) presaleBtn.classList.add('btn-pulse');
        }
    }, 1000);

    // Add rocket launch animation to presale button
    if (presaleBtn && btnRocket) {
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
    } else if (!presaleBtn){
        console.warn('Presale button (#presale-btn) not found.');
    } else if (!btnRocket){
        console.warn('Rocket element (.btn-rocket) inside presale button not found.');
    }
}


/**
 * Initialize scroll reveal animations
 */
function initScrollReveal() {
    const revealElements = document.querySelectorAll('.reveal');
    if (revealElements.length === 0) return; // Don't run if no reveal elements

    const checkReveal = () => {
        const windowHeight = window.innerHeight;
        const revealPoint = 100; // Adjust reveal point if needed

        revealElements.forEach(element => {
            const revealTop = element.getBoundingClientRect().top;

            // Check if element is within viewport
            if (revealTop < windowHeight - revealPoint) {
                element.classList.add('active');

                 // Specific handling for step-vertical content reveal delay
                 if (element.classList.contains('step-vertical')) {
                    const contentWrapper = element.querySelector('.step-content-wrapper');
                    if (contentWrapper && !contentWrapper.style.opacity) { // Check if already animated
                        // Add a slight delay for the content to appear after the step becomes visible
                        setTimeout(() => {
                            contentWrapper.style.opacity = '1';
                            contentWrapper.style.transform = 'translateY(0) translateX(0)'; // Reset transform
                        }, 200); // Delay in ms
                    }
                }
            }
            // Optional: Remove 'active' class if element scrolls out of view upwards
            // else if (revealTop > windowHeight) {
            //    element.classList.remove('active');
            // }
        });
    };


     // Add initial transform to step content wrappers for animation
     document.querySelectorAll('.step-vertical').forEach((step) => {
        const contentWrapper = step.querySelector('.step-content-wrapper');
        if (contentWrapper) {
            // Set initial state for animation
            contentWrapper.style.opacity = '0';
            // Apply initial transform based on reveal direction or default to translateY
            if (step.classList.contains('reveal-left')) {
                contentWrapper.style.transform = 'translateX(-50px)';
            } else if (step.classList.contains('reveal-right')) {
                contentWrapper.style.transform = 'translateX(50px)';
            } else {
                contentWrapper.style.transform = 'translateY(30px)';
            }
            // Ensure transition is set (can also be done in CSS)
            contentWrapper.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
        }
    });


    // Check on scroll and resize
    window.addEventListener('scroll', checkReveal);
    window.addEventListener('resize', checkReveal); // Re-check on resize

    // Check on page load/DOMContentLoaded
    checkReveal(); // Run once initially
}


/**
 * Add floating characters dynamically
 */
function addFloatingCharacters() {
    const floatingContainer = document.querySelector('.floating-characters');
    if (!floatingContainer) return; // Don't run if container doesn't exist

    const existingCharacters = floatingContainer.querySelectorAll('.floating-character');
    if (existingCharacters.length === 0) {
        console.warn('No elements with class .floating-character found inside .floating-characters container.');
        return;
    }

    // Add event listener for mousemove to create subtle parallax effect
    document.addEventListener('mousemove', function(e) {
        // Request animation frame for performance
        window.requestAnimationFrame(() => {
            const mouseX = e.clientX / window.innerWidth;
            const mouseY = e.clientY / window.innerHeight;

            existingCharacters.forEach(character => {
                // Ensure depth is a valid number, default to 0.1
                const depth = parseFloat(character.getAttribute('data-depth') || '0.1') || 0.1;
                const maxOffset = 20; // Max pixel offset

                // Calculate offset based on mouse position and depth
                const offsetX = (mouseX - 0.5) * maxOffset * depth;
                const offsetY = (mouseY - 0.5) * maxOffset * depth;

                // Apply transform
                character.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
            });
        });
    });
}


/**
 * Initialize social media icon effects
 */
function initSocialIconEffects() {
    // Add hover effects to social icons
    const socialIcons = document.querySelectorAll('.social-icons a, .social-link'); // Target both footer and community icons

    socialIcons.forEach(icon => {
        const iconElement = icon.querySelector('i'); // Get the <i> tag inside the link

        if(iconElement) { // Only proceed if an <i> tag is found
            icon.addEventListener('mouseenter', function() {
                iconElement.classList.add('fa-beat');
            });

            icon.addEventListener('mouseleave', function() {
                iconElement.classList.remove('fa-beat');
            });
        }


        // Add coming soon popup for all social media except X (Twitter)
        // Assumes X links have a specific class 'x' or '.x-icon-small' or similar identifier
        // Adjust the condition below if your X link identifier is different
         if (!icon.classList.contains('x') && !icon.querySelector('.x-icon-small') && icon.getAttribute('href') === '#') { // Check if it's NOT X and links to '#'
             icon.addEventListener('click', function(e) {
                e.preventDefault();
                alert('Coming soon! Follow us on X for updates.');
            });
        }
    });
}


/**
 * Initialize step card animations
 */
function initStepCardAnimations() {
    const stepCards = document.querySelectorAll('.step-card');
    if (stepCards.length === 0) return; // Don't run if no step cards

    stepCards.forEach((card, index) => {
        // Add staggered fade-in class (ensure these classes are defined in CSS)
        // card.classList.add(`fade-in-${index + 1}`); // Uncomment if using CSS animation classes

        const stepNumber = card.querySelector('.step-number');

        // Add hover effect
        card.addEventListener('mouseenter', function() {
            this.classList.add('hover-scale'); // Ensure hover-scale class is defined in CSS

            // Add pulse effect to step number
            if (stepNumber) {
                stepNumber.classList.add('scale-animation'); // Ensure scale-animation class is defined
            }
        });

        card.addEventListener('mouseleave', function() {
            this.classList.remove('hover-scale');

            // Remove pulse effect from step number
            if (stepNumber) {
                stepNumber.classList.remove('scale-animation');
            }
        });
    });
}