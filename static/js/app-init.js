/**
 * Application Initialization
 * Initializes the clean settings system
 */

class AppInit {
    constructor() {
        this.isInitialized = false;
    }

    /**
     * Initialize the application
     */
    async init() {
        if (this.isInitialized) {
            console.log('App already initialized');
            return;
        }

        try {
            console.log('=== HABER APPLICATION STARTING ===');

            // Step 1: Initialize settings system
            await this.initializeSettings();

            // Step 2: Initialize preview modal integration
            this.initializePreviewModal();

            // Mark as ready
            this.isInitialized = true;
            console.log('=== HABER APPLICATION READY ===');

        } catch (error) {
            console.error('Failed to initialize app:', error);
            this.showErrorMessage('Uygulama başlatılırken hata oluştu');
        }
    }

    /**
     * Initialize settings system
     */
    async initializeSettings() {
        console.log('Initializing settings system...');

        // Check if config is loaded
        if (!window.SettingsConfig || !window.SettingsUtils) {
            throw new Error('Settings config not loaded');
        }

        // Initialize settings UI first
        if (!window.settingsUI) {
            throw new Error('Settings UI not available');
        }
        window.settingsUI.init();

        // Initialize settings manager and load data
        if (!window.settingsManager) {
            throw new Error('Settings manager not available');
        }
        
        const success = await window.settingsManager.init();
        if (!success) {
            console.warn('Settings manager initialized with fallback values');
        }

        console.log('Settings system ready');
    }

    /**
     * Initialize preview modal integration
     */
    initializePreviewModal() {
        console.log('Initializing preview modal integration...');

        // Enhance PreviewModal to use the complete prompt from backend
        if (window.PreviewModal) {
            // Override the getCurrentSettings method to use our new settings manager
            window.PreviewModal.getCurrentSettings = async function() {
                if (window.settingsManager && window.settingsManager.isReady()) {
                    return window.settingsManager.getSettings();
                } else {
                    // Fallback to default settings
                    return window.SettingsUtils.getDefaults();
                }
            };

            // Override buildPrompt to fetch the complete prompt from backend
            window.PreviewModal.buildPrompt = async function(newsText, settings) {
                try {
                    console.log('Building complete prompt from backend...');
                    
                    const response = await fetch('/api/prompt/build-complete-prompt', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            settings: settings,
                            news_text: newsText
                        })
                    });

                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                    }

                    const result = await response.json();
                    
                    if (result.success && result.data && result.data.prompt) {
                        console.log('Complete prompt received from backend');
                        return result.data.prompt;
                    } else {
                        throw new Error(result.error || 'Failed to build prompt');
                    }
                    
                } catch (error) {
                    console.error('Error building complete prompt:', error);
                    
                    // Fallback to a simple prompt
                    const previewText = window.settingsUI ? window.settingsUI.getPreviewText(settings) : 'Varsayılan ayarlar';
                    return `Aşağıdaki haber metnini analiz et ve işle:\n\nAyarlar: ${previewText}\n\nHaber Metni:\n${newsText}`;
                }
            };

            // Update the show method to handle async buildPrompt
            const originalShow = window.PreviewModal.show;
            window.PreviewModal.show = async function(newsText) {
                this.showLoading();
                this.showModal();
                
                try {
                    // Get current settings
                    const settings = await Promise.race([
                        this.getCurrentSettings(),
                        new Promise((_, reject) => setTimeout(() => reject(new Error('Settings load timeout')), 5000))
                    ]);
                    
                    // Build complete prompt (now async)
                    const prompt = await this.buildPrompt(newsText, settings);
                    
                    // Update modal content
                    this.updateContent(settings, prompt);
                    this.hideLoading();
                    
                } catch (error) {
                    console.error('Error showing preview modal:', error);
                    
                    // Fallback
                    const settings = this.getDefaultSettings();
                    const prompt = await this.buildPrompt(newsText, settings);
                    this.updateContent(settings, prompt);
                    this.hideLoading();
                }
            };

            console.log('Preview modal integration ready');
        } else {
            console.warn('PreviewModal not found');
        }
    }

    /**
     * Show error message to user
     */
    showErrorMessage(message) {
        if (window.Utils && window.Utils.showNotification) {
            window.Utils.showNotification(message, 'error');
        } else {
            console.error(message);
        }
    }

    /**
     * Check if app is ready
     */
    isReady() {
        return this.isInitialized;
    }
}

// Create global instance
window.appInit = new AppInit();

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Small delay to ensure all scripts are loaded
    setTimeout(() => {
        window.appInit.init();
    }, 100);
});
