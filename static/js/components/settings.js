/**
 * Settings Component
 * Handles prompt settings and user preferences with database integration
 */

const SettingsComponent = {
    // Default settings
    defaultSettings: {
        title_include_city: true,
        name_censorship: 'G.K.',
        company_info_toggle: true,
        target_category: 'auto',
        tag_count: 5,
        output_format: 'professional'
    },
    
    // Auto-save timeout
    autoSaveTimeout: null,
    
    // Initialize component
    init: function() {
        console.log('Settings Component initialized');
        this.bindEvents();
        this.loadSettings();
        this.setupAutoSave();
    },

    // Bind events
    bindEvents: function() {
        // Event bindings will be handled by setupAutoSave
    },

    // Setup auto-save functionality
    setupAutoSave: function() {
        // Auto-save on any form change
        const settingsContainer = document.querySelector('.settings-panel');
        if (settingsContainer) {
            settingsContainer.addEventListener('change', (e) => {
                if (e.target.hasAttribute('data-setting')) {
                    console.log('Ayar değişti:', e.target.getAttribute('data-setting'), '→', this.getElementValue(e.target));
                    this.saveSettings();
                }
            });
            
            // Also listen for input events for text/number inputs
            settingsContainer.addEventListener('input', (e) => {
                if (e.target.hasAttribute('data-setting') && (e.target.type === 'text' || e.target.type === 'number')) {
                    // Debounce to avoid too many saves
                    clearTimeout(this.autoSaveTimeout);
                    this.autoSaveTimeout = setTimeout(() => {
                        console.log('Ayar değişti (input):', e.target.getAttribute('data-setting'), '→', this.getElementValue(e.target));
                        this.saveSettings();
                    }, 500);
                }
            });
        }
    },

    // Get value from form element
    getElementValue: function(element) {
        if (element.type === 'checkbox') {
            return element.checked;
        } else if (element.tagName === 'SELECT') {
            return element.value;
        } else if (element.type === 'number') {
            return parseInt(element.value) || 0;
        } else {
            return element.value;
        }
    },

    // Get all current settings from form
    getSettings: function() {
        const settings = {};
        const settingElements = document.querySelectorAll('[data-setting]');
        
        settingElements.forEach(element => {
            const settingKey = element.getAttribute('data-setting');
            settings[settingKey] = this.getElementValue(element);
        });
        
        return settings;
    },

    // Load settings from database
    loadSettings: async function() {
        try {
            // Load user settings from API for Göktuğ user
            const response = await fetch('/api/prompt/user-settings');
            if (response.ok) {
                const result = await response.json();
                if (result.success && result.data) {
                    this.applySettings(result.data);
                    console.log('Göktuğ kullanıcısının ayarları yüklendi:', result.data);
                    console.log('Aktif kullanıcı: Göktuğ (goktug_user_2025)');
                } else {
                    console.warn('Kullanıcı ayarları yüklenemedi, varsayılan ayarlar kullanılıyor');
                }
            } else {
                console.warn('Kullanıcı ayarları yüklenemedi, varsayılan ayarlar kullanılıyor');
            }
        } catch (error) {
            console.error('Kullanıcı ayarları yükleme hatası:', error);
        }
    },

    // Save settings to database using centralized manager
    saveSettings: async function() {
        try {
            const settings = this.getSettings();
            
            // Validate settings
            if (!this.validateSettings(settings)) {
                console.warn('Ayarlar geçersiz, kaydetme iptal edildi');
                return;
            }
            
            // Use centralized settings manager for saving
            if (window.centralizedSettings) {
                await window.centralizedSettings.updateSettings(settings);
                console.log('Ayarlar centralized manager ile kaydedildi:', settings);
            } else {
                console.error('Centralized settings manager not available');
                // Fallback to direct API call
                await this.saveSettingsDirectly(settings);
            }
            
        } catch (error) {
            console.error('Ayar kaydetme hatası:', error);
        }
    },
    
    // Fallback method for direct API saving
    saveSettingsDirectly: async function(settings) {
        try {
            const response = await fetch('/api/prompt/user-settings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    settings: settings
                })
            });
            
            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    console.log('Ayarlar başarıyla kaydedildi (direct):', settings);
                    this.showSaveMessage();
                } else {
                    console.error('Ayar kaydetme hatası:', result.error);
                }
            } else {
                console.error('API isteği başarısız:', response.status);
            }
        } catch (error) {
            console.error('Direct save error:', error);
        }
    },

    // Show save success message
    showSaveMessage: function() {
        // Create or update save indicator
        let indicator = document.querySelector('.save-indicator');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.className = 'save-indicator';
            indicator.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: #28a745;
                color: white;
                padding: 8px 16px;
                border-radius: 4px;
                font-size: 14px;
                z-index: 1000;
                opacity: 0;
                transition: opacity 0.3s ease;
            `;
            document.body.appendChild(indicator);
        }
        
        indicator.textContent = 'Ayarlar kaydedildi ✓';
        indicator.style.opacity = '1';
        
        // Hide after 2 seconds
        setTimeout(() => {
            indicator.style.opacity = '0';
        }, 2000);
    },

    // Apply settings from database to UI
    applySettings: function(settings) {
        if (!settings || typeof settings !== 'object') {
            console.warn('Geçersiz ayarlar, varsayılan değerler kullanılıyor');
            return;
        }
        
        // Apply each setting to the UI
        Object.keys(settings).forEach(key => {
            const element = document.querySelector(`[data-setting="${key}"]`);
            if (element) {
                if (element.type === 'checkbox') {
                    element.checked = settings[key];
                } else if (element.tagName === 'SELECT') {
                    element.value = settings[key];
                } else if (element.type === 'number') {
                    element.value = settings[key];
                } else {
                    element.value = settings[key];
                }
                
                // Trigger change event to update any dependent UI
                element.dispatchEvent(new Event('change'));
            }
        });
        
        console.log('Ayarlar UI\'ya uygulandı:', settings);
    },

    // Reset to default settings
    resetSettings: function() {
        if (confirm('Tüm ayarları varsayılan değerlere sıfırlamak istediğinizden emin misiniz?')) {
            this.applySettings(this.defaultSettings);
            this.saveSettings();
        }
    },

    // Validate settings
    validateSettings: function(settings) {
        // Basic validation
        if (typeof settings !== 'object') return false;
        
        // Validate specific fields
        if (settings.tag_count && (settings.tag_count < 1 || settings.tag_count > 10)) {
            return false;
        }
        
        return true;
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SettingsComponent;
}
