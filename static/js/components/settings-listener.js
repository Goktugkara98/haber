/**
 * Settings Listener Component
 * Listens for settings changes and updates all UI components accordingly
 */

const SettingsListener = {
    init() {
        console.log('Settings Listener initialized');
        
        // Register listener with centralized settings manager
        if (window.centralizedSettings) {
            window.centralizedSettings.addListener(this.onSettingsChange.bind(this));
        }
    },

    /**
     * Handle settings changes
     */
    onSettingsChange(event, settings, changes) {
        console.log(`Settings ${event}:`, settings, changes);
        
        if (event === 'init') {
            // Initial settings load - update all UI components
            this.updateAllComponents(settings);
        } else if (event === 'update') {
            // Settings updated - use SAFE update that prevents cross-contamination
            console.log('Settings saved, updating preview panel safely with centralized data');
            
            // Update the centralized manager's internal state
            if (window.promptSettingsManager) {
                window.promptSettingsManager.userSettings = settings;
            }
            
            // Use safe update method that uses centralized data only
            this.safeUpdatePreviewPanel(settings);
            
            // Show success message
            if (typeof Utils !== 'undefined') {
                Utils.showNotification('Ayarlar kaydedildi', 'success', 2000);
            }
        }
    },

    /**
     * Update all UI components with new settings
     */
    updateAllComponents(settings) {
        // Update settings preview panel
        this.updateSettingsPreview(settings);
        
        // Update edit form
        this.updateEditForm(settings);
        
        // Update any other components that need settings
        console.log('All UI components updated with settings:', settings);
    },

    /**
     * Safely update preview panel by directly updating the display elements
     */
    safeUpdatePreviewPanel(settings) {
        console.log('Safely updating preview panel with centralized settings:', settings);
        
        // Update the preview panel directly without relying on disabled methods
        this.updatePreviewPanelDirectly(settings);
        
        console.log('Preview panel updated directly with centralized data');
    },
    
    /**
     * Update preview panel by directly modifying DOM elements
     */
    updatePreviewPanelDirectly(settings) {
        const displayContainer = document.getElementById('allSettingsDisplay');
        if (!displayContainer) {
            console.warn('Preview panel container not found');
            return;
        }
        
        // Get the config data for display formatting
        const configData = window.promptSettingsManager?.configData;
        if (!configData || !configData.rules) {
            console.warn('Config data not available for preview panel update');
            return;
        }
        
        // Build the display HTML using the same logic as updateAllSettingsDisplay
        let displayHtml = '';
        
        // Group settings by category
        const rulesByCategory = this.groupRulesByCategory(configData.rules);
        
        Object.keys(rulesByCategory).forEach(categoryKey => {
            const category = rulesByCategory[categoryKey];
            if (category.rules.length === 0) return;
            
            displayHtml += `
                <div class="settings-category mb-3">
                    <h6 class="settings-category-title text-primary mb-2">
                        <i class="fas fa-folder-open me-1"></i>
                        ${category.title}
                    </h6>
            `;
            
            category.rules.forEach(rule => {
                const currentValue = settings[rule.rule_key];
                const displayValue = this.formatSettingValue(rule, currentValue);
                
                displayHtml += `
                    <div class="setting-item d-flex justify-content-between align-items-center mb-2 p-2 border rounded">
                        <div class="setting-info">
                            <span class="setting-name fw-bold">${rule.rule_name}</span>
                            <small class="setting-description text-muted d-block">${rule.rule_description || ''}</small>
                        </div>
                        <div class="setting-value">
                            <span class="badge bg-secondary">${displayValue}</span>
                        </div>
                    </div>
                `;
            });
            
            displayHtml += '</div>';
        });
        
        // Update the display container
        displayContainer.innerHTML = displayHtml;
        
        console.log('Preview panel DOM updated directly');
    },
    
    /**
     * Group rules by category (copied from prompt-settings.js)
     */
    groupRulesByCategory(rules) {
        const categories = {
            'general': 'Genel Ayarlar',
            'content': 'İçerik Ayarları', 
            'output': 'Çıktı Ayarları'
        };

        const grouped = {};
        
        Object.keys(categories).forEach(key => {
            grouped[key] = {
                title: categories[key],
                rules: []
            };
        });

        Object.values(rules).forEach(rule => {
            const category = rule.rule_category || 'general';
            if (grouped[category]) {
                grouped[category].rules.push(rule);
            }
        });

        // Sort rules within each category by display_order
        Object.keys(grouped).forEach(category => {
            grouped[category].rules.sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
        });

        return grouped;
    },
    
    /**
     * Format setting value for display (copied from prompt-settings.js)
     */
    formatSettingValue(rule, value) {
        if (rule.rule_type === 'boolean') {
            return value ? 'Evet' : 'Hayır';
        } else if (rule.rule_type === 'select' && rule.rule_options) {
            const option = rule.rule_options.find(opt => opt.value === value);
            return option ? option.label : value;
        } else {
            return value || 'Belirtilmemiş';
        }
    },
    
    /**
     * Update settings preview panel directly (bypassing old prompt settings manager)
     */
    updateSettingsPreviewOnly(settings) {
        console.log('Directly updating settings preview panel with:', settings);
        
        // Find the settings summary container
        const summaryContainer = document.querySelector('.settings-summary-content');
        if (!summaryContainer) {
            console.warn('Settings summary container not found');
            return;
        }
        
        // Update each setting display directly
        this.updateSettingDisplay('targetCategory', settings.targetCategory, 'Hedef Kategori');
        this.updateSettingDisplay('writingStyle', settings.writingStyle, 'Yazım Stili');
        this.updateSettingDisplay('titleCityInfo', settings.titleCityInfo, 'Başlık Şehir Bilgisi');
        this.updateSettingDisplay('nameCensorship', settings.nameCensorship, 'İsim Sansürü');
        this.updateSettingDisplay('removeCompanyInfo', settings.removeCompanyInfo, 'Şirket Bilgisi');
        this.updateSettingDisplay('removePlateInfo', settings.removePlateInfo, 'Plaka Bilgisi');
        this.updateSettingDisplay('outputFormat', settings.outputFormat, 'Çıktı Formatı');
        this.updateSettingDisplay('tagCount', settings.tagCount, 'Etiket Sayısı');
        
        console.log('Settings preview panel updated directly');
    },
    
    /**
     * Update individual setting display
     */
    updateSettingDisplay(key, value, label) {
        // Find the setting display element
        const settingElement = document.querySelector(`[data-setting-display="${key}"]`);
        if (!settingElement) {
            console.warn(`Setting display element not found for: ${key}`);
            return;
        }
        
        // Format the value for display
        let displayValue = this.formatSettingValue(key, value);
        
        // Update the display
        const valueElement = settingElement.querySelector('.setting-value');
        if (valueElement) {
            valueElement.innerHTML = displayValue;
        }
    },
    
    /**
     * Format setting value for display
     */
    formatSettingValue(key, value) {
        switch (key) {
            case 'targetCategory':
                return value === 'auto' ? 'Otomatik' : value;
            case 'writingStyle':
                const styles = { 'formal': 'Resmi', 'neutral': 'Nötr', 'casual': 'Günlük' };
                return styles[value] || value;
            case 'titleCityInfo':
                return value === 'include' ? 'İçerir' : 'İçermez';
            case 'nameCensorship':
                const censorship = { 'none': 'Sansürsüz', 'partial': 'Kısmi', 'full': 'Tam' };
                return censorship[value] || value;
            case 'removeCompanyInfo':
            case 'removePlateInfo':
                const boolValue = value === true || value === 'true' || value === 'True';
                return boolValue ? '<span class="text-success">✓ Evet</span>' : '<span class="text-danger">✗ Hayır</span>';
            case 'outputFormat':
                return value === 'json' ? 'JSON' : value;
            case 'tagCount':
                return `${value} adet`;
            default:
                return value;
        }
    },
    
    /**
     * Update settings preview panel (full update for initial load)
     */
    updateSettingsPreview(settings) {
        if (window.promptSettingsManager && typeof window.promptSettingsManager.updateAllSettingsDisplay === 'function') {
            // Force refresh of settings preview
            window.promptSettingsManager.userSettings = settings;
            window.promptSettingsManager.updateAllSettingsDisplay();
            console.log('Settings preview panel updated (full)');
        }
    },

    /**
     * Update edit form with new settings
     */
    updateEditForm(settings) {
        // Update form elements with new values
        Object.keys(settings).forEach(key => {
            const element = document.querySelector(`[data-setting="${key}"]`);
            if (element) {
                if (element.type === 'checkbox') {
                    element.checked = settings[key] === true || settings[key] === 'true' || settings[key] === 'True';
                } else if (element.tagName === 'SELECT') {
                    element.value = settings[key];
                } else if (element.type === 'number') {
                    element.value = settings[key];
                } else {
                    element.value = settings[key];
                }
            }
        });
        
        console.log('Edit form updated with settings');
    }
};

// Make available globally
window.SettingsListener = SettingsListener;

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Wait a bit for other components to initialize first
    setTimeout(() => {
        SettingsListener.init();
    }, 100);
});
