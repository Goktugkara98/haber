/**
 * AI Prompt Settings Manager
 * Handles dynamic loading and management of prompt settings from database
 */

class PromptSettingsManager {
    constructor() {
        this.settings = {};
        this.userSettings = {};
        this.configData = null;
        this.init();
    }

    async init() {
        try {
            await this.loadSettings();
            this.renderSettings();
            this.bindEvents();
        } catch (error) {
            console.error('Error initializing prompt settings:', error);
            this.showError('Ayarlar yüklenirken hata oluştu');
        }
    }

    async loadSettings() {
        try {
            // Load configuration data from backend
            const response = await fetch('/api/prompt/config');
            if (!response.ok) {
                throw new Error('Failed to load settings');
            }
            
            const result = await response.json();
            if (!result.success) {
                throw new Error(result.error || 'Unknown error');
            }
            
            this.configData = result.data;
            
            // Load user settings
            console.log('=== LOADING USER SETTINGS FROM API ===');
            const userResponse = await fetch('/api/prompt/user-settings');
            console.log('User settings API response status:', userResponse.status);
            
            if (userResponse.ok) {
                const userResult = await userResponse.json();
                console.log('User settings API result:', JSON.stringify(userResult, null, 2));
                
                if (userResult.success) {
                    // Extract the actual settings from the nested structure
                    this.userSettings = userResult.data.settings || {};
                    console.log('Loaded userSettings into PromptSettingsManager:', JSON.stringify(this.userSettings, null, 2));
                    console.log('nameCensorship specifically:', this.userSettings.nameCensorship);
                } else {
                    console.warn('User settings API returned success=false:', userResult.error);
                }
            } else {
                console.warn('User settings API request failed with status:', userResponse.status);
            }
            
        } catch (error) {
            console.error('Error loading settings:', error);
            throw error;
        }
    }

    renderSettings() {
        if (!this.configData || !this.configData.rules) {
            this.showError('Ayar verisi bulunamadı');
            return;
        }

        // Show all settings summary - DISABLED to prevent cross-contamination
        // this.updateAllSettingsDisplay();
        console.log('updateAllSettingsDisplay disabled to prevent cross-contamination');
        
        // Bind edit button event
        this.bindEditButton();
    }

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
    }

    renderCategory(categoryKey, categoryData) {
        if (categoryData.rules.length === 0) return '';

        let html = `
            <div class="settings-section">
                <h6 class="settings-section-title">${categoryData.title}</h6>
        `;

        categoryData.rules.forEach(rule => {
            html += this.renderRule(rule);
        });

        html += '</div>';
        return html;
    }

    renderRule(rule) {
        const ruleKey = rule.rule_key;
        const currentValue = this.userSettings[ruleKey] || rule.default_value || '';
        
        let html = `
            <div class="mb-3">
                <label for="${ruleKey}" class="form-label">${rule.rule_name}</label>
        `;

        switch (rule.rule_type) {
            case 'select':
                html += this.renderSelectRule(rule, currentValue);
                break;
            case 'multiselect':
                html += this.renderMultiSelectRule(rule, currentValue);
                break;
            case 'toggle':
                html += this.renderToggleRule(rule, currentValue);
                break;
            case 'range':
                html += this.renderRangeRule(rule, currentValue);
                break;
            case 'text':
                html += this.renderTextRule(rule, currentValue);
                break;
            default:
                html += this.renderTextRule(rule, currentValue);
        }

        html += '</div>';
        return html;
    }

    renderSelectRule(rule, currentValue) {
        const ruleKey = rule.rule_key;
        const options = this.configData.rule_options[ruleKey] || [];
        
        let html = `<select class="form-select" id="${ruleKey}" data-setting="${ruleKey}" data-rule-type="select">`;
        
        options.forEach(option => {
            const selected = option.option_key === currentValue ? 'selected' : '';
            html += `<option value="${option.option_key}" ${selected}>${option.option_label}</option>`;
        });
        
        html += '</select>';
        return html;
    }

    renderMultiSelectRule(rule, currentValue) {
        const ruleKey = rule.rule_key;
        const options = this.configData.rule_options[ruleKey] || [];
        const selectedValues = Array.isArray(currentValue) ? currentValue : 
                              (currentValue ? currentValue.split(',') : []);
        
        let html = `<select class="form-select" id="${ruleKey}" data-setting="${ruleKey}" data-rule-type="multiselect" multiple>`;
        
        options.forEach(option => {
            const selected = selectedValues.includes(option.option_key) ? 'selected' : '';
            html += `<option value="${option.option_key}" ${selected}>${option.option_label}</option>`;
        });
        
        html += '</select>';
        return html;
    }

    renderToggleRule(rule, currentValue) {
        const ruleKey = rule.rule_key;
        const isChecked = currentValue === 'true' || currentValue === true || currentValue === '1';
        const checked = isChecked ? 'checked' : '';
        
        return `
            <div class="form-check">
                <input class="form-check-input" type="checkbox" id="${ruleKey}" 
                       data-setting="${ruleKey}" data-rule-type="toggle" ${checked}>
                <label class="form-check-label" for="${ruleKey}">
                    ${rule.rule_name}
                </label>
            </div>
        `;
    }

    renderRangeRule(rule, currentValue) {
        const ruleKey = rule.rule_key;
        const validation = rule.validation_rules ? JSON.parse(rule.validation_rules) : {};
        const min = validation.min || 1;
        const max = validation.max || 10;
        const value = currentValue || rule.default_value || min;
        
        return `
            <input type="range" class="form-range" id="${ruleKey}" 
                   data-setting="${ruleKey}" data-rule-type="range"
                   min="${min}" max="${max}" value="${value}">
            <div class="d-flex justify-content-between">
                <small class="text-muted">${min}</small>
                <small class="text-muted" id="${ruleKey}_value">${value}</small>
                <small class="text-muted">${max}</small>
            </div>
        `;
    }

    renderTextRule(rule, currentValue) {
        const ruleKey = rule.rule_key;
        const validation = rule.validation_rules ? JSON.parse(rule.validation_rules) : {};
        const maxLength = validation.maxLength || 500;
        const placeholder = `${rule.rule_name} girin...`;
        
        if (maxLength > 100) {
            return `
                <textarea class="form-control" id="${ruleKey}" 
                          data-setting="${ruleKey}" data-rule-type="text"
                          rows="3" maxlength="${maxLength}" 
                          placeholder="${placeholder}">${currentValue}</textarea>
                <div class="form-text">Maksimum ${maxLength} karakter</div>
            `;
        } else {
            return `
                <input type="text" class="form-control" id="${ruleKey}" 
                       data-setting="${ruleKey}" data-rule-type="text"
                       maxlength="${maxLength}" value="${currentValue}" 
                       placeholder="${placeholder}">
            `;
        }
    }

    bindEvents() {
        // No dynamic input events needed since we only show summary
        // Edit button events are handled in bindEditButton method
    }

    handleSettingChange(element) {
        const settingKey = element.dataset.setting;
        const ruleType = element.dataset.ruleType;
        let value;

        switch (ruleType) {
            case 'select':
                value = element.value;
                break;
            case 'multiselect':
                value = Array.from(element.selectedOptions).map(option => option.value);
                break;
            case 'toggle':
                value = element.checked;
                break;
            case 'range':
                value = element.value;
                this.updateRangeValue(element);
                break;
            case 'text':
                value = element.value;
                break;
            default:
                value = element.value;
        }

        // Update local settings
        this.userSettings[settingKey] = value;
        
        // Save to backend
        this.saveUserSetting(settingKey, value);
        
        // Update all settings display - DISABLED to prevent cross-contamination
        // this.updateAllSettingsDisplay();
        console.log('updateAllSettingsDisplay disabled after setting change to prevent cross-contamination');
    }

    updateRangeValue(rangeElement) {
        const valueDisplay = document.getElementById(rangeElement.id + '_value');
        if (valueDisplay) {
            valueDisplay.textContent = rangeElement.value;
        }
    }

    async saveUserSetting(settingKey, value) {
        try {
            const response = await fetch('/api/prompt/user-settings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    settings: {
                        [settingKey]: value
                    }
                })
            });

            if (!response.ok) {
                throw new Error('Failed to save setting');
            }

            const result = await response.json();
            if (!result.success) {
                throw new Error(result.error || 'Unknown error');
            }

        } catch (error) {
            console.error('Error saving setting:', error);
            // Show user-friendly error message
            this.showToast('Ayar kaydedilemedi', 'error');
        }
    }

    updateAllSettingsDisplay() {
        const displayContainer = document.getElementById('allSettingsDisplay');
        if (!displayContainer || !this.configData) return;

        let displayHtml = '';
        
        // Group settings by category for better organization
        const rulesByCategory = this.groupRulesByCategory(this.configData.rules);
        
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
                const settingKey = rule.rule_key;
                // Properly access nested settings data
                const userSettingsData = this.userSettings.settings || this.userSettings;
                const currentValue = userSettingsData[settingKey] || rule.default_value || '';
                let displayValue = this.formatDisplayValue(rule, currentValue);
                
                displayHtml += `
                    <div class="setting-item d-flex justify-content-between align-items-center py-1 px-2 rounded" 
                         style="background-color: #f8f9fa; margin-bottom: 4px;">
                        <span class="setting-name text-dark">${rule.rule_name}:</span>
                        <span class="setting-value fw-bold text-primary">${displayValue}</span>
                    </div>
                `;
            });
            
            displayHtml += '</div>';
        });

        displayContainer.innerHTML = displayHtml || '<em class="text-muted">Ayar bulunamadı</em>';
    }
    
    formatDisplayValue(rule, value) {
        if (!value && value !== false && value !== 0) {
            return '<em class="text-muted">Belirtilmemiş</em>';
        }
        
        // Format display value based on rule type
        if (rule.rule_type === 'select' || rule.rule_type === 'multiselect') {
            const options = this.configData.rule_options[rule.rule_key] || [];
            if (rule.rule_type === 'select') {
                const option = options.find(opt => opt.option_key === value);
                return option ? option.option_label : value;
            } else {
                const selectedOptions = Array.isArray(value) ? value : [value];
                return selectedOptions.map(val => {
                    const option = options.find(opt => opt.option_key === val);
                    return option ? option.option_label : val;
                }).join(', ');
            }
        } else if (rule.rule_type === 'toggle') {
            // Convert string values from database to boolean for proper display
            const boolValue = value === true || value === 'true' || value === 'True';
            return boolValue ? '<span class="text-success">✓ Evet</span>' : '<span class="text-danger">✗ Hayır</span>';
        } else if (rule.rule_type === 'range') {
            return `${value} / ${rule.validation_rules ? JSON.parse(rule.validation_rules).max || 10 : 10}`;
        }
        
        return value;
    }
    
    bindEditButton() {
        const editBtn = document.getElementById('editSettingsBtn');
        if (editBtn) {
            editBtn.addEventListener('click', () => {
                this.openSettingsEditor();
            });
        }
    }
    
    openSettingsEditor() {
        // Create a modal for editing settings
        this.showSettingsModal();
    }
    
    showSettingsModal() {
        // Create modal HTML
        const modalHtml = `
            <div class="modal fade" id="settingsEditModal" tabindex="-1" aria-labelledby="settingsEditModalLabel" role="dialog" aria-modal="true">
                <div class="modal-dialog modal-lg modal-dialog-scrollable">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="settingsEditModalLabel">
                                <i class="fas fa-cogs me-2"></i>
                                AI Prompt Ayarlarını Düzenle
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <div id="modalSettingsContainer">
                                <!-- Settings will be loaded here -->
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">İptal</button>
                            <button type="button" class="btn btn-primary" id="saveAllSettingsBtn">
                                <i class="fas fa-save me-1"></i>
                                Tüm Ayarları Kaydet
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Remove existing modal if any
        const existingModal = document.getElementById('settingsEditModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        // Add modal to body
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // Load settings into modal
        this.loadSettingsIntoModal();
        
        // Get modal element
        const modalElement = document.getElementById('settingsEditModal');
        
        // Initialize and show modal
        const modal = new bootstrap.Modal(modalElement);
        
        // Handle modal show event to manage focus
        modalElement.addEventListener('shown.bs.modal', function () {
            // Set focus to the first focusable element in the modal
            const focusableElements = modalElement.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
            if (focusableElements.length > 0) {
                focusableElements[0].focus();
            }
            
            // Remove any aria-hidden attributes that might have been added by Bootstrap
            modalElement.removeAttribute('aria-hidden');
        });
        
        // Handle modal hide event to restore focus
        modalElement.addEventListener('hidden.bs.modal', function () {
            // Restore focus to the element that opened the modal
            document.querySelector('[data-bs-toggle="modal"][data-bs-target="#settingsEditModal"]')?.focus();
        });
        
        // Show the modal
        modal.show();
        
        // Bind save button
        document.getElementById('saveAllSettingsBtn').addEventListener('click', () => {
            this.saveAllModalSettings();
            modal.hide();
        });
    }
    
    loadSettingsIntoModal() {
        const container = document.getElementById('modalSettingsContainer');
        if (!container || !this.configData) return;
        
        // Reuse the existing render logic but for modal
        const rulesByCategory = this.groupRulesByCategory(this.configData.rules);
        
        let html = '';
        Object.keys(rulesByCategory).forEach(category => {
            html += this.renderCategory(category, rulesByCategory[category]);
        });
        
        container.innerHTML = html;
        
        // Apply current user settings to form elements
        this.applyCurrentSettingsToModal();
        
        // Bind events for modal settings
        container.addEventListener('change', (e) => {
            if (e.target.dataset.setting) {
                // Update local settings but don't save to backend yet
                this.updateLocalSetting(e.target);
            }
        });
    }
    
    applyCurrentSettingsToModal() {
        // Apply current user settings to modal form elements
        const userSettingsData = this.userSettings.settings || this.userSettings;
        
        console.log('Applying settings to modal:', userSettingsData);
        
        Object.keys(userSettingsData).forEach(settingKey => {
            const element = document.getElementById(settingKey);
            if (element) {
                const value = userSettingsData[settingKey];
                const ruleType = element.dataset.ruleType;
                
                console.log(`Setting ${settingKey} to ${value} (type: ${ruleType})`);
                
                switch (ruleType) {
                    case 'select':
                        element.value = value;
                        break;
                    case 'multiselect':
                        if (Array.isArray(value)) {
                            Array.from(element.options).forEach(option => {
                                option.selected = value.includes(option.value);
                            });
                        }
                        break;
                    case 'toggle':
                        // Handle both string and boolean values
                        element.checked = value === 'True' || value === 'true' || value === true;
                        break;
                    case 'range':
                        element.value = value;
                        this.updateRangeValue(element);
                        break;
                    case 'text':
                        element.value = value || '';
                        break;
                    default:
                        element.value = value;
                }
            } else {
                console.warn(`Element not found for setting: ${settingKey}`);
            }
        });
    }
    
    updateLocalSetting(element) {
        const settingKey = element.dataset.setting;
        const ruleType = element.dataset.ruleType;
        let value;

        switch (ruleType) {
            case 'select':
                value = element.value;
                break;
            case 'multiselect':
                value = Array.from(element.selectedOptions).map(option => option.value);
                break;
            case 'toggle':
                value = element.checked;
                break;
            case 'range':
                value = element.value;
                this.updateRangeValue(element);
                break;
            case 'text':
                value = element.value;
                break;
            default:
                value = element.value;
        }

        // Update local settings properly - ensure we have the settings object
        if (!this.userSettings.settings) {
            this.userSettings.settings = {};
        }
        this.userSettings.settings[settingKey] = value;
        
        console.log(`Updated local setting ${settingKey} to:`, value);
    }
    
    /**
     * Collect current settings from modal form elements
     */
    collectCurrentModalSettings() {
        const settings = {};
        const modalContainer = document.getElementById('modalSettingsContainer');
        
        if (!modalContainer) {
            console.warn('Modal container not found, falling back to userSettings');
            return this.userSettings.settings || this.userSettings;
        }
        
        // Collect values from all form elements in the modal
        const formElements = modalContainer.querySelectorAll('[data-setting]');
        
        formElements.forEach(element => {
            const settingKey = element.dataset.setting;
            const ruleType = element.dataset.ruleType;
            let value;
            
            switch (ruleType) {
                case 'toggle':
                    value = element.checked;
                    break;
                case 'select':
                    value = element.value;
                    break;
                case 'multiselect':
                    value = Array.from(element.selectedOptions).map(option => option.value);
                    break;
                case 'number':
                    value = parseInt(element.value) || 0;
                    break;
                case 'text':
                default:
                    value = element.value;
                    break;
            }
            
            settings[settingKey] = value;
        });
        
        console.log('Collected fresh settings from modal:', settings);
        return settings;
    }
    
    async saveAllModalSettings() {
        try {
            // Collect fresh settings data from modal form elements
            const settingsToSave = this.collectCurrentModalSettings();
            
            console.log('Saving settings via centralized manager:', settingsToSave);
            
            // Use centralized settings manager instead of direct API call
            if (window.centralizedSettings) {
                await window.centralizedSettings.updateSettings(settingsToSave);
                console.log('Settings saved via centralized manager - UI will update automatically');
                
                // Update local userSettings to stay in sync
                this.userSettings.settings = settingsToSave;
                
                this.showToast('Tüm ayarlar başarıyla kaydedildi', 'success');
            } else {
                console.error('Centralized settings manager not available, falling back to direct API');
                
                // Fallback to direct API call if centralized manager is not available
                const response = await fetch('/api/prompt/user-settings', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        settings: settingsToSave
                    })
                });

                if (!response.ok) {
                    throw new Error('Failed to save settings');
                }

                const result = await response.json();
                if (!result.success) {
                    throw new Error(result.error || 'Unknown error');
                }
                
                // Update the local userSettings with the saved data
                if (result.data && result.data.settings) {
                    this.userSettings = result.data;
                }
                
                this.showToast('Ayarlar kaydedildi (fallback mode)', 'success');
            }

        } catch (error) {
            console.error('Error saving all settings:', error);
            this.showToast('Ayarlar kaydedilemedi', 'error');
        }
    }

    showError(message) {
        const summaryContainer = document.getElementById('allSettingsDisplay');
        if (summaryContainer) {
            summaryContainer.innerHTML = `
                <div class="alert alert-danger" role="alert">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    ${message}
                </div>
            `;
        } else {
            console.error('Settings error:', message);
        }
    }

    showToast(message, type = 'info') {
        // Simple toast notification (you can enhance this)
        const toast = document.createElement('div');
        toast.className = `alert alert-${type === 'error' ? 'danger' : 'success'} position-fixed`;
        toast.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
        toast.innerHTML = `
            <i class="fas fa-${type === 'error' ? 'exclamation-circle' : 'check-circle'} me-2"></i>
            ${message}
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    // Public method to get current settings for form submission
    getCurrentSettings() {
        // Get real-time values from UI elements
        const currentSettings = {};
        
        try {
            // Get target category from UI
            const categorySelects = document.querySelectorAll('select[data-setting="targetCategory"], input[name="targetCategory"]:checked');
            const categoryInputs = document.querySelectorAll('input[data-setting="targetCategory"]:checked');
            
            if (categorySelects.length > 0) {
                currentSettings.targetCategory = categorySelects[0].value || 'auto';
            } else if (categoryInputs.length > 0) {
                currentSettings.targetCategory = categoryInputs[0].value || 'auto';
            } else {
                currentSettings.targetCategory = this.userSettings.targetCategory || 'auto';
            }
            
            // Get writing style from UI
            const styleSelects = document.querySelectorAll('select[data-setting="writingStyle"], input[name="writingStyle"]:checked');
            const styleInputs = document.querySelectorAll('input[data-setting="writingStyle"]:checked');
            
            if (styleSelects.length > 0) {
                currentSettings.writingStyle = styleSelects[0].value || 'formal';
            } else if (styleInputs.length > 0) {
                currentSettings.writingStyle = styleInputs[0].value || 'formal';
            } else {
                currentSettings.writingStyle = this.userSettings.writingStyle || 'formal';
            }
            
            // Get title city info from UI
            const titleCitySelects = document.querySelectorAll('select[data-setting="titleCityInfo"], input[name="titleCityInfo"]:checked');
            const titleCityInputs = document.querySelectorAll('input[data-setting="titleCityInfo"]:checked');
            
            if (titleCitySelects.length > 0) {
                currentSettings.titleCityInfo = titleCitySelects[0].value || 'exclude';
            } else if (titleCityInputs.length > 0) {
                currentSettings.titleCityInfo = titleCityInputs[0].value || 'exclude';
            } else {
                currentSettings.titleCityInfo = this.userSettings.titleCityInfo || 'exclude';
            }
            
            // Get name censorship from UI
            const nameCensorshipSelects = document.querySelectorAll('select[data-setting="nameCensorship"], input[name="nameCensorship"]:checked');
            const nameCensorshipInputs = document.querySelectorAll('input[data-setting="nameCensorship"]:checked');
            
            if (nameCensorshipSelects.length > 0) {
                currentSettings.nameCensorship = nameCensorshipSelects[0].value !== undefined ? nameCensorshipSelects[0].value : 'partial';
            } else if (nameCensorshipInputs.length > 0) {
                currentSettings.nameCensorship = nameCensorshipInputs[0].value !== undefined ? nameCensorshipInputs[0].value : 'partial';
            } else {
                // Use stored setting if available, otherwise default to 'partial'
                currentSettings.nameCensorship = this.userSettings.nameCensorship !== undefined ? this.userSettings.nameCensorship : 'partial';
            }
            
            console.log('DEBUG: Name censorship setting - from UI elements:', nameCensorshipSelects.length + nameCensorshipInputs.length, 'from userSettings:', this.userSettings.nameCensorship, 'final value:', currentSettings.nameCensorship);
            
            // Get boolean settings from UI - improved detection
            // Company info removal
            const companyInfoCheckbox = document.querySelector('input[data-setting="removeCompanyInfo"][type="checkbox"]');
            const companyInfoSelect = document.querySelector('select[data-setting="removeCompanyInfo"]');
            
            if (companyInfoCheckbox) {
                currentSettings.removeCompanyInfo = companyInfoCheckbox.checked;
                console.log('DEBUG: Company info removal from checkbox:', companyInfoCheckbox.checked);
            } else if (companyInfoSelect) {
                currentSettings.removeCompanyInfo = companyInfoSelect.value === 'true';
                console.log('DEBUG: Company info removal from select:', companyInfoSelect.value);
            } else {
                // Convert string values from database to boolean
                const storedValue = this.userSettings.removeCompanyInfo;
                if (storedValue !== undefined) {
                    currentSettings.removeCompanyInfo = storedValue === true || storedValue === 'true' || storedValue === 'True';
                } else {
                    currentSettings.removeCompanyInfo = true; // default
                }
                console.log('DEBUG: Company info removal from stored settings:', storedValue, '-> converted to:', currentSettings.removeCompanyInfo);
            }
            
            // Plate info removal
            const plateInfoCheckbox = document.querySelector('input[data-setting="removePlateInfo"][type="checkbox"]');
            const plateInfoSelect = document.querySelector('select[data-setting="removePlateInfo"]');
            
            if (plateInfoCheckbox) {
                currentSettings.removePlateInfo = plateInfoCheckbox.checked;
                console.log('DEBUG: Plate info removal from checkbox:', plateInfoCheckbox.checked);
            } else if (plateInfoSelect) {
                currentSettings.removePlateInfo = plateInfoSelect.value === 'true';
                console.log('DEBUG: Plate info removal from select:', plateInfoSelect.value);
            } else {
                // Convert string values from database to boolean
                const storedValue = this.userSettings.removePlateInfo;
                if (storedValue !== undefined) {
                    currentSettings.removePlateInfo = storedValue === true || storedValue === 'true' || storedValue === 'True';
                } else {
                    currentSettings.removePlateInfo = true; // default
                }
                console.log('DEBUG: Plate info removal from stored settings:', storedValue, '-> converted to:', currentSettings.removePlateInfo);
            }
            
            // Get output format from UI
            const outputFormatElements = document.querySelectorAll('select[data-setting="outputFormat"], input[data-setting="outputFormat"]:checked');
            if (outputFormatElements.length > 0) {
                currentSettings.outputFormat = outputFormatElements[0].value || 'json';
            } else {
                currentSettings.outputFormat = this.userSettings.outputFormat || 'json';
            }
            
            // Get tag count from UI
            const tagCountElements = document.querySelectorAll('select[data-setting="tagCount"], input[data-setting="tagCount"]');
            if (tagCountElements.length > 0) {
                currentSettings.tagCount = parseInt(tagCountElements[0].value) || 5;
            } else {
                currentSettings.tagCount = parseInt(this.userSettings.tagCount) || 5;
            }
            
            // Get custom instructions from UI
            const customInstructionsElements = document.querySelectorAll('textarea[data-setting="customInstructions"], input[data-setting="customInstructions"]');
            if (customInstructionsElements.length > 0) {
                currentSettings.customInstructions = customInstructionsElements[0].value || '';
            } else {
                currentSettings.customInstructions = this.userSettings.customInstructions || '';
            }
            
            console.log('Current settings from UI:', currentSettings);
            return currentSettings;
            
        } catch (error) {
            console.error('Error getting current settings from UI:', error);
            // Fallback to stored user settings
            return { ...this.userSettings };
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    const manager = new PromptSettingsManager();
    window.promptSettingsManager = manager;
    window.PromptSettingsManager = manager; // Also make available as PromptSettingsManager
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PromptSettingsManager;
}
