/**
 * Centralized Settings Manager
 * Single source of truth for all application settings
 */

class CentralizedSettingsManager {
    constructor() {
        this.settings = {};
        this.configData = {};
        this.listeners = [];
        this.isLoaded = false;
    }

    /**
     * Initialize and load settings from backend
     */
    async init() {
        try {
            console.log('=== CENTRALIZING SETTINGS MANAGEMENT ===');
            
            // Load configuration and user settings
            await this.loadFromBackend();
            
            // Mark as loaded
            this.isLoaded = true;
            
            // Notify all listeners that settings are ready
            this.notifyListeners('init', this.settings);
            
            console.log('Centralized settings manager initialized with:', this.settings);
            
        } catch (error) {
            console.error('Failed to initialize centralized settings:', error);
            throw error;
        }
    }

    /**
     * Load settings from backend
     */
    async loadFromBackend() {
        try {
            // Load configuration data
            const configResponse = await fetch('/api/prompt/config');
            if (!configResponse.ok) {
                throw new Error('Failed to load config');
            }
            
            const configResult = await configResponse.json();
            if (!configResult.success) {
                throw new Error(configResult.error || 'Config load failed');
            }
            
            this.configData = configResult.data;
            
            // Load user settings
            const userResponse = await fetch('/api/prompt/user-settings');
            if (!userResponse.ok) {
                throw new Error('Failed to load user settings');
            }
            
            const userResult = await userResponse.json();
            if (!userResult.success) {
                throw new Error(userResult.error || 'User settings load failed');
            }
            
            // Extract settings from nested structure and normalize
            this.settings = this.normalizeSettings(userResult.data.settings || {});
            
            console.log('Settings loaded from backend:', this.settings);
            
        } catch (error) {
            console.error('Error loading settings from backend:', error);
            // Use default settings as fallback
            this.settings = this.getDefaultSettings();
        }
    }

    /**
     * Normalize settings from backend (convert string booleans to actual booleans)
     */
    normalizeSettings(rawSettings) {
        const normalized = {};
        
        for (const [key, value] of Object.entries(rawSettings)) {
            // Convert string booleans to actual booleans
            if (value === 'True' || value === 'true') {
                normalized[key] = true;
            } else if (value === 'False' || value === 'false') {
                normalized[key] = false;
            } else if (!isNaN(value) && value !== '') {
                // Convert numeric strings to numbers
                normalized[key] = parseInt(value) || parseFloat(value) || value;
            } else {
                normalized[key] = value;
            }
        }
        
        console.log('Normalized settings:', normalized);
        return normalized;
    }

    /**
     * Get default settings
     */
    getDefaultSettings() {
        return {
            targetCategory: 'auto',
            writingStyle: 'formal',
            titleCityInfo: 'exclude',
            nameCensorship: 'partial',
            removeCompanyInfo: true,
            removePlateInfo: true,
            outputFormat: 'json',
            tagCount: 5,
            customInstructions: ''
        };
    }

    /**
     * Get current settings (public API)
     */
    getSettings() {
        return { ...this.settings };
    }

    /**
     * Get config data
     */
    getConfigData() {
        return this.configData;
    }

    /**
     * Update a single setting
     */
    async updateSetting(key, value) {
        try {
            console.log(`Updating setting: ${key} = ${value}`);
            
            // Update local settings
            this.settings[key] = value;
            
            // Save to backend
            await this.saveToBackend();
            
            // Notify all listeners
            this.notifyListeners('update', this.settings, { key, value });
            
            console.log('Setting updated successfully');
            
        } catch (error) {
            console.error('Failed to update setting:', error);
            throw error;
        }
    }

    /**
     * Update multiple settings (selective update to prevent data corruption)
     */
    async updateSettings(newSettings) {
        try {
            console.log('Updating multiple settings:', newSettings);
            console.log('Current settings before update:', this.settings);
            
            // Selective update: only update settings that actually changed
            const changedSettings = {};
            const previousSettings = { ...this.settings };
            
            Object.keys(newSettings).forEach(key => {
                const newValue = newSettings[key];
                const currentValue = this.settings[key];
                
                // Only update if the value actually changed
                if (newValue !== currentValue) {
                    this.settings[key] = newValue;
                    changedSettings[key] = newValue;
                    console.log(`Setting ${key} changed: ${currentValue} → ${newValue}`);
                } else {
                    console.log(`Setting ${key} unchanged: ${currentValue}`);
                }
            });
            
            console.log('Only changed settings:', changedSettings);
            console.log('Final settings after selective update:', this.settings);
            
            // Save to backend
            await this.saveToBackend();
            
            // Notify all listeners with only the changed settings
            this.notifyListeners('update', this.settings, changedSettings);
            
            console.log('Settings updated successfully (selective update)');
            
        } catch (error) {
            console.error('Failed to update settings:', error);
            throw error;
        }
    }

    /**
     * Save settings to backend
     */
    async saveToBackend() {
        try {
            const response = await fetch('/api/prompt/user-settings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    settings: this.settings
                })
            });

            if (!response.ok) {
                throw new Error('Failed to save settings');
            }

            const result = await response.json();
            if (!result.success) {
                throw new Error(result.error || 'Save failed');
            }

            console.log('Settings saved to backend successfully');

        } catch (error) {
            console.error('Error saving settings to backend:', error);
            throw error;
        }
    }

    /**
     * Add a listener for settings changes
     */
    addListener(callback) {
        this.listeners.push(callback);
        
        // If settings are already loaded, notify immediately
        if (this.isLoaded) {
            callback('init', this.settings);
        }
    }

    /**
     * Remove a listener
     */
    removeListener(callback) {
        const index = this.listeners.indexOf(callback);
        if (index > -1) {
            this.listeners.splice(index, 1);
        }
    }

    /**
     * Notify all listeners of changes
     */
    notifyListeners(event, settings, changes = null) {
        this.listeners.forEach(callback => {
            try {
                callback(event, settings, changes);
            } catch (error) {
                console.error('Error in settings listener:', error);
            }
        });
    }

    /**
     * Check if settings are loaded
     */
    isReady() {
        return this.isLoaded;
    }
}

// Create global instance
window.centralizedSettings = new CentralizedSettingsManager();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CentralizedSettingsManager;
}
