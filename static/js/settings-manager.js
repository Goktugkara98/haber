/**
 * Settings Manager
 * Handles fetching, storing, and updating settings
 */

class SettingsManager {
    constructor() {
        this.settings = {};
        this.isLoaded = false;
        this.listeners = [];
        
        console.log('Settings Manager initialized');
    }

    /**
     * Initialize and load settings from database
     */
    async init() {
        try {
            console.log('Loading settings from database...');
            await this.loadFromDatabase();
            this.isLoaded = true;
            this.notifyListeners('loaded', this.settings);
            console.log('Settings loaded:', this.settings);
            return true;
        } catch (error) {
            console.error('Failed to load settings:', error);
            // Use default values as fallback
            this.settings = window.SettingsUtils.getDefaults();
            this.isLoaded = true;
            this.notifyListeners('loaded', this.settings);
            console.log('Using default settings:', this.settings);
            return false;
        }
    }

    /**
     * Load settings from database
     */
    async loadFromDatabase() {
        const response = await fetch('/api/prompt/user-settings');
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.message || 'Failed to load settings');
        }

        // Store the settings from database
        this.settings = result.data.settings || {};
        
        // Ensure all settings have values (use defaults for missing ones)
        const defaults = window.SettingsUtils.getDefaults();
        for (const [key, defaultValue] of Object.entries(defaults)) {
            if (!(key in this.settings)) {
                this.settings[key] = defaultValue;
            }
        }
    }

    /**
     * Save settings to database
     */
    async saveToDatabase(newSettings) {
        const response = await fetch('/api/prompt/user-settings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                settings: newSettings
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.message || 'Failed to save settings');
        }

        return result;
    }

    /**
     * Update settings
     */
    async updateSettings(newSettings) {
        try {
            console.log('Updating settings:', newSettings);
            
            // Save to database
            await this.saveToDatabase(newSettings);
            
            // Update local settings
            this.settings = { ...this.settings, ...newSettings };
            
            // Notify listeners
            this.notifyListeners('updated', this.settings, newSettings);
            
            console.log('Settings updated successfully:', this.settings);
            return true;
        } catch (error) {
            console.error('Failed to update settings:', error);
            throw error;
        }
    }

    /**
     * Get current settings
     */
    getSettings() {
        return { ...this.settings };
    }

    /**
     * Get a specific setting value
     */
    getSetting(key) {
        return this.settings[key];
    }

    /**
     * Get settings with display labels
     */
    getDisplaySettings() {
        const displaySettings = {};
        
        for (const [key, value] of Object.entries(this.settings)) {
            const config = window.SettingsUtils.getConfig(key);
            if (config) {
                displaySettings[key] = {
                    value: value,
                    displayName: config.displayName,
                    displayValue: window.SettingsUtils.getDisplayLabel(key, value),
                    category: config.category
                };
            }
        }
        
        return displaySettings;
    }

    /**
     * Add a listener for settings changes
     */
    addListener(callback) {
        this.listeners.push(callback);
        console.log('Settings listener added');
    }

    /**
     * Remove a listener
     */
    removeListener(callback) {
        const index = this.listeners.indexOf(callback);
        if (index > -1) {
            this.listeners.splice(index, 1);
            console.log('Settings listener removed');
        }
    }

    /**
     * Notify all listeners of changes
     */
    notifyListeners(event, settings, changes = null) {
        console.log(`Notifying ${this.listeners.length} listeners of ${event} event`);
        
        this.listeners.forEach(callback => {
            try {
                callback(event, settings, changes);
            } catch (error) {
                console.error('Error in settings listener:', error);
            }
        });
    }

    /**
     * Check if settings are loaded and ready
     */
    isReady() {
        return this.isLoaded;
    }
}

// Create global instance
window.settingsManager = new SettingsManager();
