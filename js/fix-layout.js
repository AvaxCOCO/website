/**
 * $COCO - Layout Fix JavaScript
 * This file disables animations that might be affecting the layout
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('Layout fix script loaded');
    
    // Disable animations that might affect layout
    disableAnimations();
    
    // Fix container alignment
    fixContainerAlignment();
    
    // Fix section alignment
    fixSectionAlignment();
});

/**
 * Disable animations that might affect layout
 */
function disableAnimations() {
    // Disable scroll reveal animations
    const revealElements = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-bottom, .fade-in');
    revealElements.forEach(element => {
        element.classList.add('active');
        element.style.transform = 'none';
        element.style.opacity = '1';
        element.style.transition = 'none';
        
        // Also fix any child elements
        const children = element.querySelectorAll('*');
        children.forEach(child => {
            child.style.transform = 'none';
            child.style.opacity = '1';
            child.style.transition = 'none';
        });
    });
    
    // Disable floating characters
    const floatingCharacters = document.querySelector('.floating-characters');
    if (floatingCharacters) {
        floatingCharacters.style.display = 'none';
    }
    
    // Disable hover animations
    const hoverElements = document.querySelectorAll('.hover-float, .hover-scale');
    hoverElements.forEach(element => {
        element.classList.remove('hover-float', 'hover-scale');
    });
    
    // Remove all animation and transition styles
    const allElements = document.querySelectorAll('*');
    allElements.forEach(element => {
        const style = window.getComputedStyle(element);
        if (style.animation !== 'none' || style.transition !== 'none') {
            element.style.animation = 'none';
            element.style.transition = 'none';
        }
    });
}

/**
 * Fix container alignment
 */
function fixContainerAlignment() {
    const containers = document.querySelectorAll('.container');
    containers.forEach(container => {
        container.style.width = '100%';
        container.style.maxWidth = '1200px';
        container.style.margin = '0 auto';
        container.style.padding = '0 24px';
        container.style.boxSizing = 'border-box';
    });
}

/**
 * Fix section alignment
 */
function fixSectionAlignment() {
    const sections = document.querySelectorAll('section');
    sections.forEach(section => {
        section.style.width = '100%';
        section.style.maxWidth = '100%';
        section.style.margin = '0';
        section.style.padding = '80px 0';
        section.style.boxSizing = 'border-box';
        section.style.overflow = 'hidden';
    });
}