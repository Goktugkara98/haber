/**
 * Fix for modal backdrop issues with detailed logging
 * This script ensures proper cleanup of Bootstrap modal backdrops
 */

// Enhanced logger function
const logger = {
    log: function(message, data = null) {
        console.log(`[Modal Debug] ${message}`, data || '');
        this.logToUI(`[${new Date().toISOString()}] ${message}`);
    },
    error: function(message, error = null) {
        console.error(`[Modal Debug] ERROR: ${message}`, error || '');
        this.logToUI(`[${new Date().toISOString()}] ERROR: ${message}`, 'error');
    },
    logToUI: function(message, type = 'info') {
        // Create log container if it doesn't exist
        let logContainer = document.getElementById('modal-debug-logs');
        if (!logContainer) {
            logContainer = document.createElement('div');
            logContainer.id = 'modal-debug-logs';
            logContainer.style.position = 'fixed';
            logContainer.style.bottom = '10px';
            logContainer.style.right = '10px';
            logContainer.style.width = '300px';
            logContainer.style.maxHeight = '200px';
            logContainer.style.overflow = 'auto';
            logContainer.style.backgroundColor = 'rgba(0,0,0,0.8)';
            logContainer.style.color = 'white';
            logContainer.style.padding = '10px';
            logContainer.style.fontFamily = 'monospace';
            logContainer.style.fontSize = '12px';
            logContainer.style.zIndex = '99999';
            logContainer.style.display = 'none'; // Hidden by default
            document.body.appendChild(logContainer);
            
            // Add toggle button
            const toggleBtn = document.createElement('button');
            toggleBtn.textContent = 'Toggle Logs';
            toggleBtn.style.position = 'fixed';
            toggleBtn.style.bottom = '10px';
            toggleBtn.style.right = '10px';
            toggleBtn.style.zIndex = '100000';
            toggleBtn.onclick = () => {
                logContainer.style.display = logContainer.style.display === 'none' ? 'block' : 'none';
            };
            document.body.appendChild(toggleBtn);
        }
        
        const logEntry = document.createElement('div');
        logEntry.textContent = message;
        logEntry.style.color = type === 'error' ? '#ff6b6b' : '#ffffff';
        logEntry.style.borderBottom = '1px solid #333';
        logEntry.style.padding = '2px 0';
        logContainer.prepend(logEntry);
        
        // Keep only the last 50 log entries
        if (logContainer.children.length > 50) {
            logContainer.removeChild(logContainer.lastChild);
        }
    }
};

document.addEventListener('DOMContentLoaded', function() {
    logger.log('DOM fully loaded, initializing modal debugger');

    // Fix for modal backdrop issues with detailed logging
    const fixModalBackdrop = function(source) {
        logger.log(`Fixing modal backdrops (triggered by: ${source})`);
        
        // Log current state before fixing
        const backdropCount = document.querySelectorAll('.modal-backdrop').length;
        const isModalOpen = document.body.classList.contains('modal-open');
        logger.log(`Current state - Backdrops: ${backdropCount}, modal-open: ${isModalOpen}`);
        
        try {
            // Remove all existing backdrops
            const backdrops = document.querySelectorAll('.modal-backdrop');
            logger.log(`Found ${backdrops.length} backdrops to remove`);
            
            backdrops.forEach((backdrop, index) => {
                try {
                    logger.log(`Removing backdrop #${index + 1}`, { 
                        className: backdrop.className,
                        style: backdrop.style.cssText,
                        parent: backdrop.parentNode ? backdrop.parentNode.tagName : 'no parent'
                    });
                    if (backdrop.parentNode) {
                        backdrop.parentNode.removeChild(backdrop);
                        logger.log(`Successfully removed backdrop #${index + 1}`);
                    } else {
                        logger.log(`Backdrop #${index + 1} has no parent node`);
                    }
                } catch (e) {
                    logger.error(`Error removing backdrop #${index + 1}`, e);
                }
            });
            
            // Remove modal-open class from body
            if (document.body.classList.contains('modal-open')) {
                document.body.classList.remove('modal-open');
                logger.log('Removed modal-open class from body');
            } else {
                logger.log('modal-open class not found on body');
            }
            
            // Fix body style
            if (document.body.style.paddingRight) {
                logger.log(`Removing padding-right: ${document.body.style.paddingRight}`);
                document.body.style.paddingRight = '0';
            }
            
            if (document.body.style.overflow === 'hidden') {
                logger.log('Removing overflow: hidden from body');
                document.body.style.overflow = '';
            }
            
            // Force reflow/repaint
            document.body.offsetHeight;
            
        } catch (e) {
            logger.error('Error in fixModalBackdrop', e);
        }
    };

    // Log all modal events
    const logModalEvent = function(event) {
        const modalId = event.target.id || 'unknown';
        logger.log(`Modal Event: ${event.type} on #${modalId}`, {
            type: event.type,
            target: event.target,
            bubbles: event.bubbles,
            timestamp: new Date().toISOString()
        });
        
        // For show/hide events, log the current state
        if (event.type.includes('show') || event.type.includes('hide')) {
            logger.log(`Modal state - display: ${window.getComputedStyle(event.target).display}, ` +
                      `visibility: ${window.getComputedStyle(event.target).visibility}, ` +
                      `opacity: ${window.getComputedStyle(event.target).opacity}`);
        }
    };

    // Apply the fix when any modal is shown
    document.addEventListener('show.bs.modal', function(e) {
        logModalEvent(e);
        fixModalBackdrop('show.bs.modal');
    });

    // Apply the fix when any modal is hidden
    document.addEventListener('hidden.bs.modal', function(e) {
        logModalEvent(e);
        fixModalBackdrop('hidden.bs.modal');
    });

    // Also add a global function that can be called manually
    window.fixModalBackdrop = fixModalBackdrop;
    
    // Add keyboard shortcut to manually trigger fix (Ctrl+Alt+M)
    document.addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.altKey && e.key === 'm') {
            logger.log('Manual fix triggered by keyboard shortcut');
            fixModalBackdrop('manual-trigger');
            
            // Show the log panel
            const logContainer = document.getElementById('modal-debug-logs');
            if (logContainer) {
                logContainer.style.display = 'block';
            }
        }
    });
    
    logger.log('Modal debugger initialized. Press Ctrl+Alt+M to manually fix or toggle logs.');
});
