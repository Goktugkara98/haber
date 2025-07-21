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
            // Settings updated - update only the changed settings
            console.log('Settings updated, applying changes:', changes);
            
            // Update the centralized manager's internal state
            if (window.promptSettingsManager) {
                window.promptSettingsManager.userSettings = settings;
            }
            
            // If we have changes, only update those specific settings
            if (changes && Object.keys(changes).length > 0) {
                console.log('Settings updated, applying changes:', changes);
                
                // Update each changed setting
                Object.entries(changes).forEach(([key, value]) => {
                    this.updateSettingDisplay(key, value);
                });
                
                // Also update the settings preview with the latest settings
                this.updateSettingsPreview(settings);
            } else {
                // If no specific changes, update everything with the latest settings
                console.log('No specific changes, updating all components');
                this.updateAllComponents(settings);
            }
            
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
     * Safely update preview panel by using the original display method
     */
    safeUpdatePreviewPanel(settings) {
        console.log('Safely updating preview panel with centralized settings:', settings);
        
        // Use the original settings preview method to preserve design
        this.updateSettingsPreview(settings);
        
        console.log('Preview panel updated using original display method');
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
                const displayValue = this.formatSettingValue(rule.rule_key, currentValue);
                
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
        if (!settings) {
            console.warn('No settings provided to updateSettingsPreviewOnly');
            return;
        }
        
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
        console.log(`Updating setting display: ${key} =`, value);
        
        // Find or create the display element for this setting
        let displayElement = document.getElementById(`setting-${key}-value`);
        const container = document.getElementById('allSettingsDisplay');
        
        if (!displayElement && container) {
            // If the display element doesn't exist, create it
            displayElement = document.createElement('span');
            displayElement.id = `setting-${key}-value`;
            displayElement.className = 'setting-value fw-bold text-primary';
            
            // Try to find the setting's container to update it
            let settingContainer = container.querySelector(`[data-setting="${key}"]`);
            
            if (!settingContainer) {
                // Try to find by text content if data-setting attribute is not present
                const settingItems = container.querySelectorAll('.setting-item');
                for (const item of settingItems) {
                    const nameElement = item.querySelector('.setting-name');
                    if (nameElement && nameElement.textContent.includes(label || this.formatSettingLabel(key))) {
                        settingContainer = item;
                        break;
                    }
                }
            }
            
            if (settingContainer) {
                const valueContainer = settingContainer.querySelector('.setting-value');
                if (valueContainer) {
                    valueContainer.parentNode.replaceChild(displayElement, valueContainer);
                } else {
                    settingContainer.appendChild(displayElement);
                }
            } else {
                // If we can't find the container, create a new one
                console.log(`Creating new setting container for: ${key}`);
                const newSetting = document.createElement('div');
                newSetting.className = 'setting-item d-flex justify-content-between align-items-center py-2 px-3 mb-2 rounded';
                newSetting.style.backgroundColor = '#f8f9fa';
                newSetting.innerHTML = `
                    <span class="setting-name text-dark">${label || this.formatSettingLabel(key)}:</span>
                `;
                newSetting.appendChild(displayElement);
                
                // Add the new setting to the settings container
                container.appendChild(newSetting);
            }
            
            console.log(`Created/updated display element for setting: ${key}`);
        } else if (!container) {
            console.warn(`Settings container not found when trying to update: ${key}`);
            return;
        }
        
        // Update the display with the new value
        if (displayElement) {
            // Get the rule from promptSettingsManager if available
            let rule = {};
            if (window.promptSettingsManager?.configData?.rules?.[key]) {
                rule = window.promptSettingsManager.configData.rules[key];
            } else {
                // Create a minimal rule object if not available
                rule = {
                    rule_key: key,
                    rule_name: label || this.formatSettingLabel(key)
                };
            }
            
            // Format the value for display
            displayElement.innerHTML = this.formatSettingDisplayValue(rule, value);
        }
    },
    
    /**
     * Get category for a setting
     */
    getCategoryForSetting(key) {
        const categories = {
            'writingStyle': 'Yazım Ayarları',
            'nameCensorship': 'Gizlilik Ayarları',
            'removeCompanyInfo': 'Gizlilik Ayarları',
            'removePlateInfo': 'Gizlilik Ayarları',
            'targetCategory': 'İçerik Ayarları',
            'titleCityInfo': 'İçerik Ayarları',
            'outputFormat': 'Çıktı Ayarları',
            'tagCount': 'Çıktı Ayarları',
            'customInstructions': 'Özelleştirme'
        };
        return categories[key] || 'Diğer Ayarlar';
    },

    /**
     * Format setting label for display
     */
    formatSettingLabel(key) {
        // Convert camelCase to space-separated words and capitalize first letter
        return key
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase());
    },
    
    /**
     * Format setting value for display with Turkish translations
     */
    formatSettingValue(key, value) {
        if (value === null || value === undefined || value === '') {
            return '<em class="text-muted">Belirtilmemiş</em>';
        }
        
        // Common value translations
        const valueTranslations = {
            // Writing Style
            'formal': 'Resmi',
            'semiformal': 'Yarı Resmi',
            'casual': 'Günlük',
            'neutral': 'Nötr',
            'professional': 'Profesyonel',
            
            // Name Censorship
            'none': 'Kapalı',
            'initials': 'Baş Harfler',
            'first_letter': 'Sadece İlk Harf',
            'full_name': 'Tam İsim',
            
            // Title City Info
            'include': 'Evet',
            'exclude': 'Hayır',
            'brackets': 'Parantez İçinde',
            
            // Output Format
            'json': 'JSON',
            'text': 'Metin',
            'html': 'HTML',
            'markdown': 'Markdown',
            
            // Target Category
            'auto': 'Otomatik',
            'politics': 'Politika',
            'economy': 'Ekonomi',
            'sports': 'Spor',
            'technology': 'Teknoloji',
            'health': 'Sağlık',
            'entertainment': 'Eğlence',
            'world': 'Dünya',
            'education': 'Eğitim'
        };
        
        // Special case handling for boolean values
        if (value === true || value === 'true' || value === 'True') {
            return '<span class="text-success"><i class="fas fa-check-circle me-1"></i>Açık</span>';
        } else if (value === false || value === 'false' || value === 'False') {
            return '<span class="text-danger"><i class="fas fa-times-circle me-1"></i>Kapalı</span>';
        }
        
        // Handle numeric values
        if (!isNaN(value) && value !== '') {
            return value;
        }
        
        // Return translated value if available, otherwise return the original value
        const translatedValue = valueTranslations[value] || value;
        
        // Special formatting for specific settings
        if (key === 'writingStyle' || key === 'nameCensorship' || 
            key === 'titleCityInfo' || key === 'outputFormat' || 
            key === 'targetCategory') {
            return `<span class="fw-bold">${translatedValue}</span>`;
        }
        
        return translatedValue;
    },
    
    /**
     * Get category for a setting key
     */
    getCategoryForSetting(key) {
        // Simple categorization based on key prefixes
        if (key.startsWith('enable')) return 'Özellikler';
        if (key.includes('Style') || key.includes('Format')) return 'Biçim';
        if (key.includes('Count') || key.includes('Length')) return 'Sınırlar';
        return 'Diğer';
    },
    
    /**
     * Format setting value for display based on rule type with Turkish translations
     */
    formatSettingDisplayValue(rule, value) {
        if (value === null || value === undefined || value === '') {
            return '<em class="text-muted">Belirtilmemiş</em>';
        }
        
        // Special handling for known settings with specific display values
        const settingKey = typeof rule === 'string' ? rule : (rule.rule_key || rule.setting_key);
        
        // Common value translations
        const valueTranslations = {
            // Writing Style
            'formal': 'Resmi',
            'semiformal': 'Yarı Resmi',
            'casual': 'Günlük',
            'neutral': 'Nötr',
            'professional': 'Profesyonel',
            
            // Name Censorship
            'none': 'Kapalı',
            'initials': 'Baş Harfler',
            'first_letter': 'Sadece İlk Harf',
            'full_name': 'Tam İsim',
            
            // Title City Info
            'include': 'Evet',
            'exclude': 'Hayır',
            'brackets': 'Parantez İçinde',
            
            // Output Format
            'json': 'JSON',
            'text': 'Metin',
            'html': 'HTML',
            'markdown': 'Markdown',
            
            // Target Category
            'auto': 'Otomatik',
            'politics': 'Politika',
            'economy': 'Ekonomi',
            'sports': 'Spor',
            'technology': 'Teknoloji',
            'health': 'Sağlık',
            'entertainment': 'Eğlence',
            'world': 'Dünya',
            'education': 'Eğitim'
        };
        
        // Special case handling for boolean values
        if (value === true || value === 'true' || value === 'True') {
            return '<span class="text-success"><i class="fas fa-check-circle me-1"></i>Açık</span>';
        } else if (value === false || value === 'false' || value === 'False') {
            return '<span class="text-danger"><i class="fas fa-times-circle me-1"></i>Kapalı</span>';
        }
        
        // Handle numeric values
        if (!isNaN(value) && value !== '') {
            // If it's a number and has a max validation, show as fraction (e.g., "3/5")
            if (rule.validation_rules?.max) {
                return `${value} / ${rule.validation_rules.max}`;
            }
            return value;
        }
        
        // Return translated value if available, otherwise return the original value
        const translatedValue = valueTranslations[value] || value;
        
        // Special formatting for specific settings
        if (settingKey === 'writingStyle' || settingKey === 'nameCensorship' || 
            settingKey === 'titleCityInfo' || settingKey === 'outputFormat' || 
            settingKey === 'targetCategory') {
            return `<span class="fw-bold">${translatedValue}</span>`;
        }
        
        return translatedValue;
    },
    
    /**
     * Update settings preview panel (full update for initial load)
     */
    updateSettingsPreview(settings) {
        const settingsContainer = document.getElementById('allSettingsDisplay');
        
        // If settings container doesn't exist yet, try again after a short delay
        if (!settingsContainer) {
            console.log('Settings container not found, retrying...');
            setTimeout(() => this.updateSettingsPreview(settings), 100);
            return;
        }
        
        // Always try to get the latest settings from centralized settings
        if (window.centralizedSettings?.settings) {
            settings = window.centralizedSettings.settings;
        }
        
        // If we still don't have settings, wait for them
        if (!settings || Object.keys(settings).length === 0) {
            console.log('Waiting for settings to be available...');
            settingsContainer.innerHTML = '<div class="text-muted">Ayarlar yükleniyor...</div>';
            
            const checkSettings = () => {
                if (window.centralizedSettings?.settings && Object.keys(window.centralizedSettings.settings).length > 0) {
                    console.log('Settings now available, updating preview...');
                    this.updateSettingsPreview(window.centralizedSettings.settings);
                } else if (window.centralizedSettings) {
                    setTimeout(checkSettings, 100);
                } else {
                    console.log('Centralized settings not available, using fallback');
                    settingsContainer.innerHTML = this.renderFallbackSettings({});
                }
            };
            
            checkSettings();
            return;
        }
        
        // Show loading message while we check for required data
        settingsContainer.innerHTML = '<div class="text-muted">Ayarlar yükleniyor...</div>';
        
        // Check if we have all required data
        const hasAllData = settings && 
                          window.promptSettingsManager && 
                          window.promptSettingsManager.configData && 
                          window.promptSettingsManager.configData.rules;
        
        if (hasAllData) {
            // All data is available, proceed with rendering
            console.log('All data available, rendering settings preview...');
        } else {
            // Wait for missing data
            console.log('Waiting for required data to load...');
            const checkData = () => {
                const currentSettings = window.centralizedSettings?.settings || settings;
                const hasDataNow = currentSettings && 
                                 window.promptSettingsManager?.configData?.rules;
                
                if (hasDataNow) {
                    console.log('Required data loaded, updating preview...');
                    this.updateSettingsPreview(currentSettings);
                } else if (window.centralizedSettings || window.promptSettingsManager) {
                    // Keep waiting if managers are still available
                    setTimeout(checkData, 100);
                } else {
                    console.log('Required managers not available, using fallback display');
                    settingsContainer.innerHTML = this.renderFallbackSettings(settings || {});
                }
            };
            
            // Start checking for data
            checkData();
            return;
        }

        console.log('Updating settings preview with:', settings);
        
        // Store the current scroll position
        const scrollPosition = settingsContainer.scrollTop;
        
        // Clear any existing content
        settingsContainer.innerHTML = '<div class="text-muted">Ayarlar yükleniyor...</div>';
        
        // If we have promptSettingsManager and config data, use it to render the settings
        if (window.promptSettingsManager) {
            // If configData isn't loaded yet, wait for it
            if (!window.promptSettingsManager.configData) {
                console.log('Waiting for config data to load...');
                const checkConfigData = () => {
                    if (window.promptSettingsManager?.configData) {
                        console.log('Config data loaded, updating preview...');
                        this.updateSettingsPreview(settings);
                    } else if (window.promptSettingsManager) {
                        // If promptSettingsManager is still available but no configData yet, keep waiting
                        setTimeout(checkConfigData, 100);
                    } else {
                        // If promptSettingsManager is no longer available, use fallback
                        console.log('PromptSettingsManager no longer available, using fallback display');
                        settingsContainer.innerHTML = this.renderFallbackSettings(settings);
                    }
                };
                
                // Show loading message while waiting
                settingsContainer.innerHTML = '<div class="text-muted">Ayarlar yükleniyor...</div>';
                
                // Start checking for config data
                checkConfigData();
                return;
            }
            
            // If we have config data but no rules, use fallback
            if (!window.promptSettingsManager.configData?.rules) {
                console.log('Config data has no rules, using fallback display');
                settingsContainer.innerHTML = this.renderFallbackSettings(settings);
                return;
            }
            
            try {
                console.log('Rendering settings preview with config data');
                
                const configData = window.promptSettingsManager.configData;
                const rules = configData?.rules || {};
                
                // Group rules by category
                const rulesByCategory = this.groupRulesByCategory(rules);
                let displayHtml = '';
                
                // Generate HTML for each category
                Object.entries(rulesByCategory).forEach(([category, { title, rules: categoryRules }]) => {
                    if (!categoryRules || categoryRules.length === 0) return;
                    
                    displayHtml += `
                        <div class="settings-category mb-4">
                            <h6 class="category-title text-primary mb-3">
                                <i class="fas fa-folder-open me-2"></i>${title}
                            </h6>
                            <div class="settings-list">
                    `;
                    
                    // Add each setting in the category
                    categoryRules.forEach(rule => {
                        if (!rule.rule_key) return;
                        
                        const settingKey = rule.rule_key;
                        const currentValue = settings ? settings[settingKey] : rule.default_value || '';
                        const displayValue = this.formatSettingDisplayValue(rule, currentValue);
                        
                        displayHtml += `
                            <div class="setting-item d-flex justify-content-between align-items-center py-2 px-3 mb-2 rounded" 
                                 style="background-color: #f8f9fa;">
                                <span class="setting-name text-dark">${rule.rule_name || this.formatSettingLabel(settingKey)}:</span>
                                <span class="setting-value fw-bold text-primary">${displayValue}</span>
                            </div>
                        `;
                    });
                    
                    displayHtml += `
                            </div>
                        </div>
                    `;
                });
                
                // Update the container with the generated HTML
                settingsContainer.innerHTML = displayHtml || this.renderFallbackSettings(settings);
                
                // Restore scroll position after update
                settingsContainer.scrollTop = scrollPosition;
                return; // Exit after successful update
                
            } catch (error) {
                console.error('Error rendering settings preview:', error);
                // Fall through to the fallback display
            }
        }
        
        // Fallback: Update the display manually if promptSettingsManager is not available
        console.log('Using fallback settings display');
        settingsContainer.innerHTML = this.renderFallbackSettings(settings);
    },
    
    /**
     * Render fallback settings display when config data is not available
     */
    renderFallbackSettings(settings) {
        if (!settings || typeof settings !== 'object' || Object.keys(settings).length === 0) {
            return `
                <div class="alert alert-warning">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    Ayarlar yüklenemedi. Lütfen sayfayı yenileyin.
                </div>`;
        }
        
        let html = '';
        
        // Group settings by category for better organization
        const settingsByCategory = {};
        
        // Add each setting to its category
        Object.entries(settings).forEach(([key, value]) => {
            const category = this.getCategoryForSetting(key);
            if (!settingsByCategory[category]) {
                settingsByCategory[category] = [];
            }
            settingsByCategory[category].push({ key, value });
        });
        
        // Generate HTML for each category
        Object.entries(settingsByCategory).forEach(([category, settingsList]) => {
            html += `
            <div class="settings-category mb-4">
                <h6 class="category-title text-primary mb-3">
                    <i class="fas fa-folder-open me-2"></i>${category}
                </h6>
                <div class="settings-list">`;
            
            settingsList.forEach(setting => {
                html += `
                    <div class="setting-item d-flex justify-content-between align-items-center py-2 px-3 mb-2 rounded" 
                         style="background-color: #f8f9fa;">
                        <span class="setting-name text-dark">${this.formatSettingLabel(setting.key)}:</span>
                        <span class="setting-value fw-bold text-primary">${this.formatSettingValue(setting.key, setting.value)}</span>
                    </div>`;
            });
            
            html += `
                </div>
            </div>`;
        });
        
        return html || '<div class="text-muted">Ayarlar yükleniyor...</div>';
    },
    
    /**
     * Update edit form with new settings
     */
    updateEditForm(settings) {
        // Update form elements with new values
        if (settings && typeof settings === 'object') {
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
    }
};

// Make available globally
window.SettingsListener = SettingsListener;

// Auto-initialize when DOM is ready
let isInitialized = false;

function initializeSettingsListener() {
    if (isInitialized) return;
    
    // Initialize the settings listener
    SettingsListener.init();
    isInitialized = true;
    
    // If centralized settings are already available, update the UI
    if (window.centralizedSettings && window.centralizedSettings.settings) {
        SettingsListener.updateSettingsPreview(window.centralizedSettings.settings);
    }
    
    console.log('Settings Listener initialization complete');
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initializeSettingsListener);

// Also try to initialize if DOM is already loaded
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(initializeSettingsListener, 0);
}
