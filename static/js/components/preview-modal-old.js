/**
 * Preview Modal Component
 * Shows AI prompt preview and selected settings before processing
 */

const PreviewModalComponent = {
    modal: null,
    
    init: function() {
        this.bindEvents();
        console.log('Preview Modal Component initialized');
    },
    
    bindEvents: function() {
        // Bind confirm process button in modal
        document.addEventListener('click', (e) => {
            if (e.target.id === 'confirmProcessBtn') {
                this.confirmProcess();
            }
        });
    },
    
    async show(newsText) {
        try {
            // Get current settings and build prompt
            const settings = await this.getCurrentSettings();
            const prompt = await this.buildPrompt(newsText, settings);
            
            // Update modal content
            this.updateSettingsDisplay(settings);
            this.updatePromptDisplay(prompt);
            
            // Show custom modal to avoid backdrop issues
            const modalElement = document.getElementById('previewModal');
            modalElement.style.display = 'block';
            modalElement.classList.add('show');
            modalElement.setAttribute('aria-hidden', 'false');
            
            // Add custom backdrop
            this.createCustomBackdrop();
            
            // Store reference for cleanup
            this.modalElement = modalElement;
            
        } catch (error) {
            console.error('Error showing preview modal:', error);
            Utils.showNotification('Önizleme yüklenirken hata oluştu', 'danger');
        }
    },
    
    async getCurrentSettings() {
        try {
            // Always use PromptSettingsManager for current frontend state
            if (typeof PromptSettingsManager !== 'undefined' && PromptSettingsManager.userSettings) {
                console.log('Using frontend settings from PromptSettingsManager:', PromptSettingsManager.userSettings);
                return {
                    userSettings: PromptSettingsManager.userSettings.settings || PromptSettingsManager.userSettings,
                    configData: PromptSettingsManager.configData
                };
            }
            
            // Fallback: fetch from API only if PromptSettingsManager is not available
            console.log('PromptSettingsManager not available, fetching from API');
            const response = await fetch('/api/prompt/user-settings');
            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    return {
                        userSettings: result.data.settings,
                        configData: null
                    };
                }
            }
            
            throw new Error('Settings could not be loaded');
            
        } catch (error) {
            console.error('Error getting current settings:', error);
            throw error;
        }
    },
    
    async buildPrompt(newsText, settings) {
        try {
            // Call the API to build the complete prompt
            const response = await fetch('/api/prompt/build-complete-prompt', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    news_text: newsText,
                    settings: settings.userSettings
                })
            });
            
            if (!response.ok) {
                throw new Error('Failed to build prompt');
            }
            
            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.error || 'Unknown error');
            }
            
            return result.data.complete_prompt;
            
        } catch (error) {
            console.error('Error building prompt:', error);
            // Return a fallback prompt structure
            return this.buildFallbackPrompt(newsText, settings);
        }
    },
    
    buildFallbackPrompt(newsText, settings) {
        const userSettings = settings.userSettings;
        
        let prompt = `AI Haber Editörü Görevi:
Sen profesyonel bir haber editörüsün. Aşağıdaki haber metnini verilen kurallara göre düzenle.

Seçilen Ayarlar:
`;
        
        // Add selected settings to prompt
        Object.keys(userSettings).forEach(key => {
            const value = userSettings[key];
            prompt += `- ${key}: ${value}\n`;
        });
        
        prompt += `\nOrijinal Haber Metni:
${newsText}

Lütfen bu metni yukarıdaki ayarlara göre düzenle ve JSON formatında döndür.`;
        
        return prompt;
    },
    
    updateSettingsDisplay(settings) {
        const container = document.getElementById('selectedSettingsDisplay');
        if (!container) return;
        
        const userSettings = settings.userSettings;
        const configData = settings.configData;
        
        let html = '';
        
        // Create setting badges
        Object.keys(userSettings).forEach(settingKey => {
            const value = userSettings[settingKey];
            let displayValue = value;
            let icon = 'fas fa-cog';
            
            // Try to get human-readable label if config data is available
            if (configData && configData.rule_options && configData.rule_options[settingKey]) {
                const option = configData.rule_options[settingKey].find(opt => opt.option_key === value);
                if (option) {
                    displayValue = option.option_label;
                }
            }
            
            // Set appropriate icons for different setting types
            switch (settingKey) {
                case 'targetCategory':
                    icon = 'fas fa-folder';
                    break;
                case 'writingStyle':
                    icon = 'fas fa-pen';
                    break;
                case 'nameCensorship':
                    icon = 'fas fa-user-secret';
                    break;
                case 'outputFormat':
                    icon = 'fas fa-file-code';
                    break;
                case 'tagCount':
                    icon = 'fas fa-tags';
                    break;
                case 'titleCityInfo':
                    icon = 'fas fa-map-marker-alt';
                    break;
                case 'removeCompanyInfo':
                case 'removePlateInfo':
                    icon = 'fas fa-shield-alt';
                    break;
                default:
                    icon = 'fas fa-cog';
            }
            
            // Handle boolean values
            if (value === 'True' || value === 'true' || value === true) {
                displayValue = 'Evet';
            } else if (value === 'False' || value === 'false' || value === false) {
                displayValue = 'Hayır';
            }
            
            html += `
                <div class="col-md-4 col-sm-6">
                    <div class="setting-badge">
                        <i class="${icon}"></i>
                        <span class="setting-label">${this.getSettingLabel(settingKey)}:</span>
                        <span class="setting-value">${displayValue}</span>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html || '<div class="col-12"><em class="text-muted">Ayar bulunamadı</em></div>';
    },
    
    getSettingLabel(settingKey) {
        const labels = {
            'targetCategory': 'Hedef Kategori',
            'writingStyle': 'Yazım Stili',
            'titleCityInfo': 'Başlıkta Şehir',
            'nameCensorship': 'İsim Sansürleme',
            'removeCompanyInfo': 'Şirket Bilgisi',
            'removePlateInfo': 'Plaka Bilgisi',
            'outputFormat': 'Çıktı Formatı',
            'tagCount': 'Etiket Sayısı',
            'customInstructions': 'Özel Talimatlar'
        };
        
        return labels[settingKey] || settingKey;
    },
    
    updatePromptDisplay(prompt) {
        const container = document.getElementById('promptDisplay');
        if (container) {
            container.textContent = prompt;
        }
    },
    
        // Create custom backdrop
        this.backdrop = document.createElement('div');
        this.backdrop.className = 'custom-modal-backdrop';
        this.backdrop.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
            z-index: 1040;
            opacity: 0;
            transition: opacity 0.15s ease;
        `;
        
        // Add click handler to close modal
        this.backdrop.addEventListener('click', () => this.hide());
        
        document.body.appendChild(this.backdrop);
        
        // Trigger fade in
        setTimeout(() => {
            this.backdrop.style.opacity = '1';
        }, 10);
    },
    
    removeCustomBackdrop() {
        if (this.backdrop) {
            this.backdrop.remove();
            this.backdrop = null;
        }
    },
    
    confirmProcess() {
        // Hide the preview modal
        this.hide();
        
        // Trigger the actual processing
        if (typeof MainContentComponent !== 'undefined') {
            MainContentComponent.processNewsDirectly();
        } else if (typeof ContentController !== 'undefined') {
            ContentController.processFromPreview();
        }
    },
    
    hide() {
        if (this.modalElement) {
            this.modalElement.style.display = 'none';
            this.modalElement.classList.remove('show');
            this.modalElement.setAttribute('aria-hidden', 'true');
        }
        
        // Remove custom backdrop
        this.removeCustomBackdrop();
        
        // Clean up references
        this.modalElement = null;
    }
};

// Export for global access
window.PreviewModalComponent = PreviewModalComponent;
