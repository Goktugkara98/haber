// Content JavaScript - Imports and orchestrates content area components

// Import component modules (these will be loaded via script tags in HTML)
// Components: text-input.js, settings.js, results.js, loading.js

// Content area controller
const ContentController = (function() {
    let isInitialized = false;
    
    const controller = {
        // Initialize all content components
        init: function() {
            // Prevent multiple initializations
            if (isInitialized) {
                console.log('Content Controller already initialized, skipping...');
                return this;
            }
            
            console.log('Content Controller başlatılıyor...');
            
            // Initialize components if they exist
            if (typeof TextInputComponent !== 'undefined') {
                TextInputComponent.init();
            }
            
            if (typeof SettingsComponent !== 'undefined') {
                SettingsComponent.init();
            }
            
            if (typeof ResultsComponent !== 'undefined') {
                ResultsComponent.init();
            }
            
            if (typeof LoadingComponent !== 'undefined') {
                LoadingComponent.init();
            }
            
            if (window.PreviewModal && !window.PreviewModal.isInitialized) {
                window.PreviewModal.init();
            }
            
            this.bindEvents();
            this.loadSavedData();
            
            isInitialized = true;
            console.log('Content Controller başlatıldı');
            return this;
        },

    // Bind global content events
    bindEvents: function() {
        // Form submission handler
        const newsForm = document.getElementById('newsForm');
        if (newsForm) {
            newsForm.addEventListener('submit', this.handleFormSubmit.bind(this));
        }

        // Auto-save functionality
        this.setupAutoSave();
        
        // Keyboard shortcuts
        this.setupKeyboardShortcuts();
    },

    // Handle main form submission
    handleFormSubmit: async function(e) {
        e.preventDefault();
        
        const formData = this.collectFormData();
        
        // Validate data
        const validation = this.validateFormData(formData);
        if (!validation.valid) {
            Utils.showNotification(validation.message, 'warning');
            return;
        }

        // Show loading
        if (typeof LoadingComponent !== 'undefined') {
            LoadingComponent.show();
        }

        // Hide previous results
        if (typeof ResultsComponent !== 'undefined') {
            ResultsComponent.hide();
        }

        try {
            // Process the news
            const result = await this.processNews(formData);
            
            // Hide loading
            if (typeof LoadingComponent !== 'undefined') {
                LoadingComponent.hide();
            }

            // Show results
            if (typeof ResultsComponent !== 'undefined') {
                ResultsComponent.show(result);
            }

            // Save to history
            this.saveToHistory(formData, result);

        } catch (error) {
            console.error('Form submission error:', error);
            
            if (typeof LoadingComponent !== 'undefined') {
                LoadingComponent.hide();
            }
            
            Utils.showNotification(AppConfig.messages.tr.processingError, 'danger');
        }
    },

    // Collect form data
    collectFormData: function() {
        const newsText = document.getElementById('newsText')?.value || '';
        const rules = document.getElementById('rules')?.value || '';
        
        // Collect settings if SettingsComponent exists
        let settings = {};
        if (typeof SettingsComponent !== 'undefined') {
            settings = SettingsComponent.getSettings();
        }

        return {
            newsText: newsText.trim(),
            rules: rules.trim(),
            settings: settings,
            timestamp: new Date().toISOString()
        };
    },

    // Validate form data
    validateFormData: function(data) {
        // Validate news text
        const textValidation = Utils.validateText(data.newsText);
        if (!textValidation.valid) {
            return textValidation;
        }

        return { valid: true };
    },

    // Process news via API
    processNews: async function(data) {
        const response = await Utils.apiRequest(AppConfig.apiEndpoints.processNews, {
            method: 'POST',
            body: JSON.stringify({
                news_text: data.newsText,
                rules: data.rules,
                settings: data.settings
            })
        });

        return response;
    },

    // Setup auto-save functionality
    setupAutoSave: function() {
        const autoSaveInterval = AppConfig.settings.autoSaveInterval;
        
        if (autoSaveInterval > 0) {
            setInterval(() => {
                this.autoSave();
            }, autoSaveInterval);
        }
    },

    // Auto-save current form data
    autoSave: function() {
        const formData = this.collectFormData();
        
        if (formData.newsText.length > 0) {
            Utils.storage.set('autoSave', formData);
            console.log('Auto-save completed');
        }
    },

    // Load saved data
    loadSavedData: function() {
        const savedData = Utils.storage.get('autoSave');
        
        if (savedData) {
            // Restore text input
            const newsTextEl = document.getElementById('newsText');
            if (newsTextEl && !newsTextEl.value) {
                newsTextEl.value = savedData.newsText;
            }

            // Restore rules
            const rulesEl = document.getElementById('rules');
            if (rulesEl && !rulesEl.value) {
                rulesEl.value = savedData.rules;
            }

            // Restore settings if component exists
            if (typeof window.promptSettingsManager !== 'undefined' && savedData.settings) {
                // Settings are automatically loaded from database, no need to restore
                console.log('Settings will be loaded from database');
            }

            console.log('Saved data restored');
        }
    },

    // Save to processing history
    saveToHistory: function(input, output) {
        const historyItem = {
            id: Date.now(),
            input: input,
            output: output,
            timestamp: new Date().toISOString()
        };

        let history = Utils.storage.get('processingHistory', []);
        history.unshift(historyItem);
        
        // Keep only last 10 items
        if (history.length > 10) {
            history = history.slice(0, 10);
        }

        Utils.storage.set('processingHistory', history);
    },

    // Setup keyboard shortcuts
    setupKeyboardShortcuts: function() {
        document.addEventListener('keydown', (e) => {
            // Ctrl+Enter to submit form
            if (e.ctrlKey && e.key === 'Enter') {
                e.preventDefault();
                const newsForm = document.getElementById('newsForm');
                if (newsForm) {
                    newsForm.dispatchEvent(new Event('submit'));
                }
            }

            // Ctrl+S to save
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                this.autoSave();
                Utils.showNotification('Manuel kayıt yapıldı', 'info');
            }

            // Escape to clear form
            if (e.key === 'Escape') {
                if (confirm('Formu temizlemek istediğinizden emin misiniz?')) {
                    this.clearForm();
                }
            }
        });
    },

    // Clear form data
    clearForm: function() {
        const newsTextEl = document.getElementById('newsText');
        const rulesEl = document.getElementById('rules');
        
        if (newsTextEl) newsTextEl.value = '';
        if (rulesEl) rulesEl.value = '';

        // Clear settings if component exists
        if (typeof SettingsComponent !== 'undefined') {
            SettingsComponent.reset();
        }

        // Hide results
        if (typeof ResultsComponent !== 'undefined') {
            ResultsComponent.hide();
        }

        // Clear auto-save
        Utils.storage.remove('autoSave');
        
        Utils.showNotification('Form temizlendi', 'info');
    },

        // Get processing history
        getHistory: function() {
            return Utils.storage.get('processingHistory', []);
        }
    };

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            controller.init();
        });
    } else {
        // DOMContentLoaded has already fired
        setTimeout(() => controller.init(), 0);
    }

    return controller;
})();

// Export for global access
window.ContentController = ContentController;
