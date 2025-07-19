// Settings Component JavaScript

const SettingsComponent = {
    elements: {},
    defaultSettings: {
        aiModel: 'default',
        creativity: 50,
        preserveStyle: true,
        autoSave: true,
        language: 'tr',
        outputFormat: 'paragraph'
    },
    
    // Initialize the component
    init: function() {
        this.cacheElements();
        this.bindEvents();
        this.loadSettings();
        console.log('Settings Component initialized');
    },

    // Cache DOM elements
    cacheElements: function() {
        this.elements = {
            aiModel: document.getElementById('aiModel'),
            creativity: document.getElementById('creativity'),
            creativityValue: document.getElementById('creativityValue'),
            preserveStyle: document.getElementById('preserveStyle'),
            autoSave: document.getElementById('autoSave'),
            language: document.getElementById('language'),
            outputFormat: document.getElementById('outputFormat'),
            resetBtn: document.getElementById('resetSettings'),
            saveBtn: document.getElementById('saveSettings')
        };
    },

    // Bind events
    bindEvents: function() {
        // Creativity slider
        if (this.elements.creativity) {
            this.elements.creativity.addEventListener('input', this.handleCreativityChange.bind(this));
        }

        // All form controls
        Object.keys(this.elements).forEach(key => {
            const element = this.elements[key];
            if (element && element.tagName !== 'BUTTON' && element.tagName !== 'SPAN') {
                element.addEventListener('change', this.handleSettingChange.bind(this));
            }
        });

        // Reset button
        if (this.elements.resetBtn) {
            this.elements.resetBtn.addEventListener('click', this.resetSettings.bind(this));
        }

        // Save button
        if (this.elements.saveBtn) {
            this.elements.saveBtn.addEventListener('click', this.saveSettings.bind(this));
        }
    },

    // Handle creativity slider change
    handleCreativityChange: function(e) {
        const value = e.target.value;
        if (this.elements.creativityValue) {
            this.elements.creativityValue.textContent = value + '%';
        }
        
        // Update slider color based on value
        const percentage = (value - e.target.min) / (e.target.max - e.target.min) * 100;
        e.target.style.background = `linear-gradient(to right, var(--primary-color) 0%, var(--primary-color) ${percentage}%, #ddd ${percentage}%, #ddd 100%)`;
        
        this.handleSettingChange(e);
    },

    // Handle any setting change
    handleSettingChange: function(e) {
        // Auto-save if enabled
        const autoSaveEnabled = this.elements.autoSave ? this.elements.autoSave.checked : true;
        if (autoSaveEnabled) {
            this.debouncedSave = this.debouncedSave || Utils.debounce(() => {
                this.saveSettings();
            }, 1000);
            this.debouncedSave();
        }

        // Visual feedback
        this.showSettingChanged(e.target);
    },

    // Show visual feedback for changed setting
    showSettingChanged: function(element) {
        element.classList.add('setting-changed');
        
        // Animate with GSAP if available
        if (typeof gsap !== 'undefined') {
            gsap.fromTo(element, 
                { scale: 1 },
                { 
                    scale: 1.05, 
                    duration: 0.1, 
                    yoyo: true, 
                    repeat: 1,
                    ease: 'power2.inOut',
                    onComplete: () => {
                        setTimeout(() => {
                            element.classList.remove('setting-changed');
                        }, 2000);
                    }
                }
            );
        } else {
            setTimeout(() => {
                element.classList.remove('setting-changed');
            }, 2000);
        }
    },

    // Get current settings
    getSettings: function() {
        const settings = {};
        
        if (this.elements.aiModel) {
            settings.aiModel = this.elements.aiModel.value;
        }
        
        if (this.elements.creativity) {
            settings.creativity = parseInt(this.elements.creativity.value);
        }
        
        if (this.elements.preserveStyle) {
            settings.preserveStyle = this.elements.preserveStyle.checked;
        }
        
        if (this.elements.autoSave) {
            settings.autoSave = this.elements.autoSave.checked;
        }
        
        if (this.elements.language) {
            settings.language = this.elements.language.value;
        }
        
        if (this.elements.outputFormat) {
            settings.outputFormat = this.elements.outputFormat.value;
        }

        return settings;
    },

    // Set settings
    setSettings: function(settings) {
        if (!settings) return;

        Object.keys(settings).forEach(key => {
            const element = this.elements[key];
            if (!element) return;

            if (element.type === 'checkbox') {
                element.checked = settings[key];
            } else if (element.type === 'range') {
                element.value = settings[key];
                if (key === 'creativity') {
                    this.handleCreativityChange({ target: element });
                }
            } else {
                element.value = settings[key];
            }
        });
    },

    // Load settings from storage
    loadSettings: function() {
        const savedSettings = Utils.storage.get('userSettings', this.defaultSettings);
        this.setSettings(savedSettings);
    },

    // Save settings to storage
    saveSettings: function() {
        const currentSettings = this.getSettings();
        Utils.storage.set('userSettings', currentSettings);
        
        // Show feedback
        Utils.showNotification('Ayarlar kaydedildi', 'success', 2000);
        
        console.log('Settings saved:', currentSettings);
        return currentSettings;
    },

    // Reset to default settings
    resetSettings: function() {
        if (confirm('Tüm ayarları varsayılan değerlere sıfırlamak istediğinizden emin misiniz?')) {
            this.setSettings(this.defaultSettings);
            this.saveSettings();
            Utils.showNotification('Ayarlar sıfırlandı', 'info');
        }
    },

    // Reset to defaults (programmatic)
    reset: function() {
        this.setSettings(this.defaultSettings);
    },

    // Validate settings
    validateSettings: function(settings) {
        const errors = [];

        if (settings.creativity < 0 || settings.creativity > 100) {
            errors.push('Yaratıcılık değeri 0-100 arasında olmalıdır');
        }

        if (!['tr', 'en'].includes(settings.language)) {
            errors.push('Geçersiz dil seçimi');
        }

        return {
            valid: errors.length === 0,
            errors: errors
        };
    },

    // Export settings as JSON
    exportSettings: function() {
        const settings = this.getSettings();
        const dataStr = JSON.stringify(settings, null, 2);
        Utils.downloadText(dataStr, 'haber_ayarlari.json');
    },

    // Import settings from JSON
    importSettings: function(jsonString) {
        try {
            const settings = JSON.parse(jsonString);
            const validation = this.validateSettings(settings);
            
            if (validation.valid) {
                this.setSettings(settings);
                this.saveSettings();
                Utils.showNotification('Ayarlar içe aktarıldı', 'success');
                return true;
            } else {
                Utils.showNotification('Geçersiz ayar dosyası: ' + validation.errors.join(', '), 'danger');
                return false;
            }
        } catch (error) {
            Utils.showNotification('Ayar dosyası okunamadı', 'danger');
            return false;
        }
    },

    // Get setting by key
    getSetting: function(key) {
        const settings = this.getSettings();
        return settings[key];
    },

    // Set individual setting
    setSetting: function(key, value) {
        if (this.elements[key]) {
            const element = this.elements[key];
            
            if (element.type === 'checkbox') {
                element.checked = value;
            } else {
                element.value = value;
            }
            
            this.handleSettingChange({ target: element });
        }
    },

    // Check if auto-save is enabled
    isAutoSaveEnabled: function() {
        return this.getSetting('autoSave') !== false;
    }
};

// Export for global access
window.SettingsComponent = SettingsComponent;
