/**
 * $COCO - The Pink Ostrich of AVAX
 * Gallery JavaScript File
 */

document.addEventListener('DOMContentLoaded', function() {
    addOverlaysToGalleryItems();
    initGallery();
});

/**
 * Add overlays to all gallery items
 */
function addOverlaysToGalleryItems() {
    const galleryItems = document.querySelectorAll('.gallery-item');
    
    galleryItems.forEach(item => {
        // Skip if already has overlay
        if (item.querySelector('.gallery-item-overlay')) return;
        
        // Add tabindex for keyboard accessibility
        item.setAttribute('tabindex', '0');
        
        // Create overlay
        const overlay = document.createElement('div');
        overlay.className = 'gallery-item-overlay';
        
        // Add icon
        const icon = document.createElement('i');
        icon.className = 'fas fa-search-plus';
        overlay.appendChild(icon);
        
        // Add overlay to item
        item.appendChild(overlay);
    });
}

/**
 * Initialize gallery functionality
 */
function initGallery() {
    const galleryItems = document.querySelectorAll('.gallery-item');
    const lightbox = document.getElementById('gallery-lightbox');
    const lightboxImg = document.getElementById('lightbox-image');
    const closeBtn = document.querySelector('.lightbox-close');
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');
    const copyBtn = document.querySelector('.copy-btn');
    const saveBtn = document.querySelector('.save-btn');
    
    let currentIndex = 0;
    const images = [];
    
    // Collect all gallery images
    galleryItems.forEach((item, index) => {
        const img = item.querySelector('img');
        images.push({
            src: img.src,
            alt: img.alt
        });
        
        // Add click event to open lightbox
        item.addEventListener('click', function() {
            openLightbox(index);
        });
    });
    
    // Open lightbox with specific image
    function openLightbox(index) {
        currentIndex = index;
        updateLightboxImage();
        lightbox.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent scrolling
    }
    
    // Close lightbox
    function closeLightbox() {
        lightbox.classList.remove('active');
        document.body.style.overflow = ''; // Re-enable scrolling
    }
    
    // Update lightbox image
    function updateLightboxImage() {
        const image = images[currentIndex];
        lightboxImg.src = image.src;
        lightboxImg.alt = image.alt;
    }
    
    // Navigate to previous image
    function prevImage() {
        currentIndex = (currentIndex - 1 + images.length) % images.length;
        updateLightboxImage();
    }
    
    // Navigate to next image
    function nextImage() {
        currentIndex = (currentIndex + 1) % images.length;
        updateLightboxImage();
    }
    
    // Copy image to clipboard
    function copyImageToClipboard() {
        // Show loading notification
        showNotification('Copying image...', false, false);
        
        // Create a temporary canvas
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Create a temporary image to get dimensions
        const img = new Image();
        
        // Set crossOrigin to anonymous to avoid CORS issues when possible
        img.crossOrigin = 'anonymous';
        
        img.onload = function() {
            // Set canvas dimensions to match image
            canvas.width = img.width;
            canvas.height = img.height;
            
            // Draw image on canvas
            ctx.drawImage(img, 0, 0);
            
            // Convert canvas to blob
            canvas.toBlob(function(blob) {
                // Try to use the Clipboard API to copy the image
                if (navigator.clipboard && navigator.clipboard.write) {
                    const clipboardItem = new ClipboardItem({ 'image/png': blob });
                    
                    navigator.clipboard.write([clipboardItem])
                        .then(() => {
                            showNotification('Image copied to clipboard!');
                        })
                        .catch(err => {
                            console.error('Clipboard API error:', err);
                            showCopyErrorMessage();
                        });
                } else {
                    // Clipboard API not available
                    showCopyErrorMessage();
                }
            }, 'image/png');
        };
        
        img.onerror = function() {
            console.error('Error loading image for copy');
            showCopyErrorMessage();
        };
        
        // Set source to start loading
        img.src = lightboxImg.src;
    }
    
    // Show copy error message with helpful instructions
    function showCopyErrorMessage() {
        showNotification(
            'Unable to copy image directly. Please use the Save button instead.',
            true
        );
    }
    
    // Save image
    function saveImage() {
        // Create a temporary link
        const link = document.createElement('a');
        link.href = lightboxImg.src;
        
        // Extract filename from path
        const filename = lightboxImg.src.split('/').pop();
        link.download = filename;
        
        // Append to body, click, and remove
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showNotification('Image download started!');
    }
    
    // Show notification
    function showNotification(message, isError = false, autoHide = true) {
        // Check if notification already exists
        let notification = document.querySelector('.lightbox-notification');
        
        // If not, create one
        if (!notification) {
            notification = document.createElement('div');
            notification.className = 'lightbox-notification';
            document.body.appendChild(notification);
        }
        
        // Set message and class
        notification.textContent = message;
        notification.className = 'lightbox-notification';
        
        if (isError) {
            notification.classList.add('error');
        }
        
        // Show notification
        notification.classList.add('active');
        
        // Hide after 3 seconds if autoHide is true
        if (autoHide) {
            setTimeout(() => {
                notification.classList.remove('active');
            }, 3000);
        }
        
        return notification;
    }
    
    // Event listeners
    closeBtn.addEventListener('click', closeLightbox);
    prevBtn.addEventListener('click', prevImage);
    nextBtn.addEventListener('click', nextImage);
    copyBtn.addEventListener('click', copyImageToClipboard);
    saveBtn.addEventListener('click', saveImage);
    
    // Keyboard navigation
    document.addEventListener('keydown', function(e) {
        if (!lightbox.classList.contains('active')) return;
        
        switch (e.key) {
            case 'Escape':
                closeLightbox();
                break;
            case 'ArrowLeft':
                prevImage();
                break;
            case 'ArrowRight':
                nextImage();
                break;
        }
    });
    
    // Close lightbox when clicking outside the image
    lightbox.addEventListener('click', function(e) {
        if (e.target === lightbox) {
            closeLightbox();
        }
    });
}