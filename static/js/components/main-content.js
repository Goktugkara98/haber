// Main Content Component JavaScript

const MainContentComponent = {
    elements: {},
    settings: {},
    
    // Initialize the component
    init: function() {
        this.cacheElements();
        this.bindEvents();
        this.loadSettings();
        this.updateCharacterCount();
        console.log('Main Content Component initialized');
    },

    // Cache DOM elements
    cacheElements: function() {
        this.elements = {
            newsText: document.getElementById('newsText'),
            charCount: document.getElementById('charCount'),
            processBtn: document.getElementById('processBtn'),
            
            // Settings elements
            targetCategory: document.getElementById('targetCategory'),
            writingStyle: document.getElementById('writingStyle'),
            titleCityInfo: document.getElementById('titleCityInfo'),
            nameCensorship: document.getElementById('nameCensorship'),
            removeCompanyInfo: document.getElementById('removeCompanyInfo'),
            removePlateInfo: document.getElementById('removePlateInfo'),
            outputFormat: document.getElementById('outputFormat'),
            tagCount: document.getElementById('tagCount'),
            customInstructions: document.getElementById('customInstructions'),
            
            // Result elements
            resultSection: document.getElementById('resultSection'),
            processedContent: document.getElementById('processedContent'),
            loadingSection: document.getElementById('loadingSection')
        };
    },

    // Bind events
    bindEvents: function() {
        // Text input events
        if (this.elements.newsText) {
            this.elements.newsText.addEventListener('input', this.handleTextInput.bind(this));
            this.elements.newsText.addEventListener('paste', this.handleTextPaste.bind(this));
        }

        // Process button
        if (this.elements.processBtn) {
            this.elements.processBtn.addEventListener('click', this.processNews.bind(this));
        }

        // Auto-save settings on change
        this.bindSettingsEvents();

        // Keyboard shortcuts
        document.addEventListener('keydown', this.handleKeyboardShortcuts.bind(this));
    },

    // Bind settings events for auto-save
    bindSettingsEvents: function() {
        const settingsElements = [
            'targetCategory', 'writingStyle', 'titleCityInfo', 'nameCensorship',
            'removeCompanyInfo', 'removePlateInfo', 'outputFormat', 'tagCount', 'customInstructions'
        ];

        settingsElements.forEach(elementId => {
            const element = this.elements[elementId];
            if (element) {
                const eventType = element.type === 'checkbox' ? 'change' : 'input';
                element.addEventListener(eventType, this.saveSettings.bind(this));
            }
        });
    },

    // Handle text input
    handleTextInput: function(e) {
        this.updateCharacterCount();
        this.updateProcessButton();
        
        // Auto-save text
        this.debouncedSaveText = this.debouncedSaveText || Utils.debounce(() => {
            this.saveText();
        }, 1000);
        this.debouncedSaveText();
    },

    // Handle text paste
    handleTextPaste: function(e) {
        setTimeout(() => {
            this.updateCharacterCount();
            this.updateProcessButton();
        }, 10);
    },

    // Update character count
    updateCharacterCount: function() {
        if (!this.elements.newsText || !this.elements.charCount) return;
        
        const length = this.elements.newsText.value.length;
        this.elements.charCount.textContent = length.toLocaleString();
        
        // Update styling based on length
        const maxLength = 10000;
        const percentage = (length / maxLength) * 100;
        
        if (percentage >= 90) {
            this.elements.charCount.style.color = 'var(--danger-color)';
        } else if (percentage >= 70) {
            this.elements.charCount.style.color = 'var(--warning-color)';
        } else {
            this.elements.charCount.style.color = 'var(--secondary-color)';
        }
    },

    // Update process button state
    updateProcessButton: function() {
        if (!this.elements.newsText || !this.elements.processBtn) return;
        
        const text = this.elements.newsText.value.trim();
        const isValid = text.length >= 10 && text.length <= 10000;
        
        this.elements.processBtn.disabled = !isValid;
    },



    // Handle keyboard shortcuts
    handleKeyboardShortcuts: function(e) {
        // Ctrl+Enter to process
        if (e.ctrlKey && e.key === 'Enter') {
            e.preventDefault();
            if (!this.elements.processBtn.disabled) {
                this.processNews();
            }
        }
        
        // Ctrl+S to save
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            this.saveAll();
            if (typeof Utils !== 'undefined') {
                Utils.showNotification('Ayarlar kaydedildi', 'success', 2000);
            }
        }
    },

    // Process news
    processNews: async function() {
        const newsText = this.elements.newsText.value.trim();
        
        if (!newsText) {
            if (typeof Utils !== 'undefined') {
                Utils.showNotification('Lütfen haber metni girin', 'warning');
            }
            return;
        }

        // Get current settings
        const settings = this.getCurrentSettings();
        
        // Show loading
        this.showLoading();
        this.hideResults();

        try {
            // Prepare request data
            const requestData = {
                news_text: newsText,
                settings: settings,
                timestamp: new Date().toISOString()
            };

            // Make API request
            const response = await Utils.apiRequest('/api/process-news', {
                method: 'POST',
                body: JSON.stringify(requestData)
            });

            // Hide loading and show results
            this.hideLoading();
            this.showResults(response);

            // Save to history
            this.saveToHistory(requestData, response);

        } catch (error) {
            console.error('Processing error:', error);
            this.hideLoading();
            
            if (typeof Utils !== 'undefined') {
                Utils.showNotification('İşlem sırasında hata oluştu', 'danger');
            }
        }
    },

    // Get current settings
    getCurrentSettings: function() {
        return {
            targetCategory: this.elements.targetCategory?.value || 'auto',
            writingStyle: this.elements.writingStyle?.value || 'formal',
            titleCityInfo: this.elements.titleCityInfo?.value || 'exclude',
            nameCensorship: this.elements.nameCensorship?.value || 'initials',
            removeCompanyInfo: this.elements.removeCompanyInfo?.checked || false,
            removePlateInfo: this.elements.removePlateInfo?.checked || false,
            outputFormat: this.elements.outputFormat?.value || 'json',
            tagCount: parseInt(this.elements.tagCount?.value || 5),
            customInstructions: this.elements.customInstructions?.value.trim() || ''
        };
    },

    // Show loading
    showLoading: function() {
        if (this.elements.loadingSection) {
            this.elements.loadingSection.style.display = 'block';
        }
    },

    // Hide loading
    hideLoading: function() {
        if (this.elements.loadingSection) {
            this.elements.loadingSection.style.display = 'none';
        }
    },

    // Show results
    showResults: function(data) {
        if (!this.elements.resultSection || !this.elements.processedContent) return;

        // Format the result based on output format
        const settings = this.getCurrentSettings();
        let formattedContent = '';

        if (settings.outputFormat === 'json' && data.result) {
            formattedContent = this.formatJSONResult(data.result);
        } else {
            formattedContent = `<pre>${JSON.stringify(data, null, 2)}</pre>`;
        }

        this.elements.processedContent.innerHTML = formattedContent;
        this.elements.resultSection.style.display = 'block';

        // Scroll to results
        setTimeout(() => {
            this.elements.resultSection.scrollIntoView({ 
                behavior: 'smooth',
                block: 'start'
            });
        }, 100);
    },

    // Format JSON result for display
    formatJSONResult: function(result) {
        if (!result) return '<p>Sonuç bulunamadı</p>';

        return `
            <div class="json-result">
                <div class="result-item">
                    <h6>Başlık:</h6>
                    <p>${result.baslik || 'Belirtilmemiş'}</p>
                </div>
                <div class="result-item">
                    <h6>Özet:</h6>
                    <p>${result.ozet || 'Belirtilmemiş'}</p>
                </div>
                <div class="result-item">
                    <h6>Haber Metni:</h6>
                    <div class="news-content">${result.haber_metni || 'Belirtilmemiş'}</div>
                </div>
                <div class="result-item">
                    <h6>Kategori:</h6>
                    <span class="category-badge">${result.kategori || 'Belirtilmemiş'}</span>
                </div>
                <div class="result-item">
                    <h6>Etiketler:</h6>
                    <div class="tags">
                        ${result.etiketler ? result.etiketler.map(tag => `<span class="tag">${tag}</span>`).join('') : 'Belirtilmemiş'}
                    </div>
                </div>
            </div>
        `;
    },

    // Hide results
    hideResults: function() {
        if (this.elements.resultSection) {
            this.elements.resultSection.style.display = 'none';
        }
    },

    // Save settings
    saveSettings: function() {
        if (typeof Utils === 'undefined') return;
        
        const settings = this.getCurrentSettings();
        Utils.storage.set('promptSettings', settings);
    },

    // Load settings
    loadSettings: function() {
        if (typeof Utils === 'undefined') return;
        
        const savedSettings = Utils.storage.get('promptSettings');
        if (!savedSettings) return;

        // Apply saved settings
        Object.keys(savedSettings).forEach(key => {
            const element = this.elements[key];
            if (!element) return;

            if (element.type === 'checkbox') {
                element.checked = savedSettings[key];
            } else if (element.type === 'range') {
                element.value = savedSettings[key];
            } else {
                element.value = savedSettings[key];
            }
        });
    },

    // Save text
    saveText: function() {
        if (typeof Utils === 'undefined' || !this.elements.newsText) return;
        
        const text = this.elements.newsText.value;
        if (text.length > 0) {
            Utils.storage.set('currentNewsText', text);
        }
    },

    // Load saved text
    loadSavedText: function() {
        if (typeof Utils === 'undefined' || !this.elements.newsText) return;
        
        const savedText = Utils.storage.get('currentNewsText');
        if (savedText && !this.elements.newsText.value) {
            this.elements.newsText.value = savedText;
            this.updateCharacterCount();
            this.updateProcessButton();
        }
    },

    // Save all data
    saveAll: function() {
        this.saveSettings();
        this.saveText();
    },

    // Save to history
    saveToHistory: function(input, output) {
        if (typeof Utils === 'undefined') return;
        
        const historyItem = {
            id: Date.now(),
            input: input,
            output: output,
            timestamp: new Date().toISOString()
        };

        let history = Utils.storage.get('processingHistory', []);
        history.unshift(historyItem);
        
        // Keep only last 20 items
        if (history.length > 20) {
            history = history.slice(0, 20);
        }

        Utils.storage.set('processingHistory', history);
    },

    // Clear all
    clearAll: function() {
        if (this.elements.newsText) {
            this.elements.newsText.value = '';
        }
        
        this.updateCharacterCount();
        this.updateProcessButton();
        this.hideResults();
        
        if (typeof Utils !== 'undefined') {
            Utils.storage.remove('currentNewsText');
            Utils.showNotification('Tüm veriler temizlendi', 'info');
        }
    },

    // Get processing history
    getHistory: function() {
        if (typeof Utils === 'undefined') return [];
        return Utils.storage.get('processingHistory', []);
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    MainContentComponent.init();
    MainContentComponent.loadSavedText();
});

// Export for global access
window.MainContentComponent = MainContentComponent;
