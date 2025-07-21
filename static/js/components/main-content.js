/**
 * @file main-content.js
 * @description Bu dosya, uygulamanın ana içerik alanını yönetir. Metin girişi,
 * ayarların yönetimi, AI ile işleme sürecinin tetiklenmesi ve sonuçların
 * gösterilmesi gibi temel işlevleri içerir.
 *
 * İçindekiler:
 * 1.0 - Bileşen Başlatma ve Olay Yönetimi
 * 2.0 - Metin Girişi ve Doğrulama
 * 3.0 - Ayarlar Yönetimi (Kaydetme/Yükleme)
 * 4.0 - Haber İşleme Süreci
 * 5.0 - Sonuçların Gösterimi ve Yönetimi
 * 6.0 - Geçmiş Yönetimi ve Yardımcı Fonksiyonlar
 */

const MainContentComponent = {
    elements: {}, // DOM elementleri için cache nesnesi
    settings: {}, // Ayarlar için cache nesnesi

    // 1.0 - Bileşen Başlatma ve Olay Yönetimi

    /**
     * Bileşeni başlatır, olayları bağlar ve ayarları yükler.
     */
    init: function() {
        this.cacheElements();
        this.bindEvents();
        this.loadSettings();
        this.updateCharacterCount();
        console.log('Ana İçerik (MainContentComponent) bileşeni başlatıldı.');
    },

    /**
     * Gerekli DOM elementlerini seçer ve `elements` nesnesinde saklar.
     */
    cacheElements: function() {
        this.elements = {
            // Ana elementler
            newsText: document.getElementById('newsText'),
            charCount: document.getElementById('charCount'),
            processBtn: document.getElementById('processBtn'),
            
            // Ayar elementleri
            targetCategory: document.getElementById('targetCategory'),
            writingStyle: document.getElementById('writingStyle'),
            titleCityInfo: document.getElementById('titleCityInfo'),
            nameCensorship: document.getElementById('nameCensorship'),
            removeCompanyInfo: document.getElementById('removeCompanyInfo'),
            removePlateInfo: document.getElementById('removePlateInfo'),
            outputFormat: document.getElementById('outputFormat'),
            tagCount: document.getElementById('tagCount'),
            customInstructions: document.getElementById('customInstructions'),
            
            // Sonuç ve yükleme alanları
            resultSection: document.getElementById('resultSection'),
            processedContent: document.getElementById('processedContent'),
            loadingSection: document.getElementById('loadingSection')
        };
    },

    /**
     * Gerekli olay dinleyicilerini (event listeners) bağlar.
     */
    bindEvents: function() {
        if (this.elements.newsText) {
            this.elements.newsText.addEventListener('input', this.handleTextInput.bind(this));
            this.elements.newsText.addEventListener('paste', this.handleTextPaste.bind(this));
        }

        if (this.elements.processBtn) {
            this.elements.processBtn.addEventListener('click', this.processNews.bind(this));
        }

        // Ayar değişikliklerini otomatik kaydetmek için olayları bağla
        this.bindSettingsEvents();

        // Klavye kısayollarını bağla
        document.addEventListener('keydown', this.handleKeyboardShortcuts.bind(this));
    },

    /**
     * Ayar elementlerindeki değişiklikleri dinleyerek ayarları otomatik kaydeder.
     */
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

    // 2.0 - Metin Girişi ve Doğrulama

    /**
     * Metin alanına her veri girişinde tetiklenir.
     */
    handleTextInput: function(e) {
        this.updateCharacterCount();
        this.updateProcessButtonState();
        
        // Metni otomatik kaydetmek için debounced fonksiyonu çağır
        this.debouncedSaveText = this.debouncedSaveText || Utils.debounce(() => {
            this.saveText();
        }, 1000);
        this.debouncedSaveText();
    },

    /**
     * Metin alanına yapıştırma işlemi yapıldığında tetiklenir.
     */
    handleTextPaste: function(e) {
        // Yapıştırma işlemi DOM'a yansıdıktan sonra güncelleme yap
        setTimeout(() => {
            this.updateCharacterCount();
            this.updateProcessButtonState();
        }, 10);
    },

    /**
     * Karakter sayacını günceller ve limitlere göre renklendirir.
     */
    updateCharacterCount: function() {
        if (!this.elements.newsText || !this.elements.charCount) return;
        
        const length = this.elements.newsText.value.length;
        this.elements.charCount.textContent = length.toLocaleString();
        
        const maxLength = 10000; // Örnek bir maksimum karakter limiti
        const percentage = (length / maxLength) * 100;
        
        if (percentage >= 90) {
            this.elements.charCount.style.color = 'var(--danger-color)';
        } else if (percentage >= 70) {
            this.elements.charCount.style.color = 'var(--warning-color)';
        } else {
            this.elements.charCount.style.color = 'var(--secondary-color)';
        }
    },

    /**
     * Metin uzunluğuna göre "İşle" butonunun aktif/pasif durumunu günceller.
     */
    updateProcessButtonState: function() {
        if (!this.elements.newsText || !this.elements.processBtn) return;
        
        const text = this.elements.newsText.value.trim();
        const isValid = text.length >= 10 && text.length <= 10000;
        
        this.elements.processBtn.disabled = !isValid;
    },

    /**
     * Klavye kısayollarını yönetir (Ctrl+Enter, Ctrl+S).
     */
    handleKeyboardShortcuts: function(e) {
        // Ctrl+Enter ile haberi işle
        if (e.ctrlKey && e.key === 'Enter') {
            e.preventDefault();
            if (!this.elements.processBtn.disabled) {
                this.processNews();
            }
        }
        
        // Ctrl+S ile tüm ayarları kaydet
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            this.saveAll();
            if (typeof Utils !== 'undefined') {
                Utils.showNotification('Ayarlar başarıyla kaydedildi.', 'success', 2000);
            }
        }
    },

    // 3.0 - Ayarlar Yönetimi (Kaydetme/Yükleme)

    /**
     * Mevcut ayarları yerel depolamaya (local storage) kaydeder.
     */
    saveSettings: function() {
        if (typeof Utils === 'undefined') return;
        
        const settings = this.getCurrentSettings();
        Utils.storage.set('promptSettings', settings);
        console.log('Ayarlar yerel depolamaya kaydedildi.');
    },

    /**
     * Kaydedilmiş ayarları yerel depolamadan yükler ve form elemanlarına uygular.
     */
    loadSettings: function() {
        if (typeof Utils === 'undefined') return;
        
        const savedSettings = Utils.storage.get('promptSettings');
        if (!savedSettings) return;

        Object.keys(savedSettings).forEach(key => {
            const element = this.elements[key];
            if (!element) return;

            if (element.type === 'checkbox') {
                element.checked = savedSettings[key];
            } else {
                element.value = savedSettings[key];
            }
        });
        console.log('Kaydedilmiş ayarlar yüklendi.');
    },

    /**
     * Formdaki tüm ayar elemanlarından mevcut değerleri toplar.
     * @returns {Object} - Mevcut ayarların bir nesnesi.
     */
    getCurrentSettings: function() {
        // Yeni merkezi ayar yöneticisi varsa onu kullan
        if (window.promptSettingsManager) {
            return window.promptSettingsManager.getCurrentSettings();
        }
        
        // Geriye dönük uyumluluk için manuel toplama
        const settings = {};
        const settingElements = document.querySelectorAll('[data-setting]');
        
        settingElements.forEach(element => {
            const settingKey = element.dataset.setting;
            const value = element.type === 'checkbox' ? element.checked : element.value;
            settings[settingKey] = value;
        });
        
        return settings;
    },

    // 4.0 - Haber İşleme Süreci

    /**
     * Haber işleme sürecini başlatır. Önce önizleme modalını gösterir.
     */
    processNews: async function() {
        const newsText = this.elements.newsText.value.trim();
        
        if (!newsText) {
            Utils.showNotification('Lütfen işlenecek bir haber metni girin.', 'warning');
            return;
        }

        // Doğrudan işlemek yerine önizleme modalını göster
        if (window.PreviewModal) {
            window.PreviewModal.show(newsText);
        } else {
            console.error('Önizleme Modalı (PreviewModal) bulunamadı. Doğrudan işleniyor.');
            this.processNewsDirectly(); // Modal yoksa doğrudan işle
        }
    },
    
    /**
     * Haberi doğrudan API'ye göndererek işler (önizleme modalından sonra çağrılır).
     */
    processNewsDirectly: async function() {
        const newsText = this.elements.newsText.value.trim();
        if (!newsText) {
            Utils.showNotification('Lütfen işlenecek bir haber metni girin.', 'warning');
            return;
        }

        const settings = this.getCurrentSettings();
        
        this.showLoading();
        this.hideResults();

        try {
            const requestData = {
                news_text: newsText,
                settings: settings,
                timestamp: new Date().toISOString()
            };

            console.log('Haber işleme API isteği gönderiliyor:', requestData);
            const response = await Utils.apiRequest('/api/process-news', {
                method: 'POST',
                body: JSON.stringify(requestData)
            });

            this.hideLoading();
            this.showResults(response);
            this.saveToHistory(requestData, response);

        } catch (error) {
            console.error('Haber işleme sırasında bir hata oluştu:', error);
            this.hideLoading();
            Utils.showNotification('İşlem sırasında bir hata oluştu. Lütfen tekrar deneyin.', 'danger');
        }
    },

    // 5.0 - Sonuçların Gösterimi ve Yönetimi

    /**
     * Yükleme animasyonunu gösterir.
     */
    showLoading: function() {
        if (this.elements.loadingSection) {
            this.elements.loadingSection.style.display = 'block';
        }
    },

    /**
     * Yükleme animasyonunu gizler.
     */
    hideLoading: function() {
        if (this.elements.loadingSection) {
            this.elements.loadingSection.style.display = 'none';
        }
    },

    /**
     * İşlenmiş sonuçları ekranda gösterir.
     * @param {Object} data - API'den dönen sonuç verisi.
     */
    showResults: function(data) {
        if (!this.elements.resultSection || !this.elements.processedContent) return;

        const settings = this.getCurrentSettings();
        const formattedContent = (settings.outputFormat === 'json' && data.result)
            ? this.formatJSONResult(data.result)
            : `<pre>${JSON.stringify(data, null, 2)}</pre>`;

        this.elements.processedContent.innerHTML = formattedContent;
        this.elements.resultSection.style.display = 'block';

        // Sonuçlar alanına yumuşak bir şekilde kaydır
        setTimeout(() => {
            this.elements.resultSection.scrollIntoView({ 
                behavior: 'smooth',
                block: 'start'
            });
        }, 100);
    },

    /**
     * JSON formatındaki sonucu daha okunaklı bir HTML'e dönüştürür.
     * @param {Object} result - İşlenmiş sonuç nesnesi.
     * @returns {string} - Oluşturulan HTML içeriği.
     */
    formatJSONResult: function(result) {
        if (!result) return '<p>Geçerli bir sonuç bulunamadı.</p>';

        return `
            <div class="json-result">
                <div class="result-item"><h6>Başlık:</h6><p>${result.baslik || 'N/A'}</p></div>
                <div class="result-item"><h6>Özet:</h6><p>${result.ozet || 'N/A'}</p></div>
                <div class="result-item"><h6>Haber Metni:</h6><div class="news-content">${result.haber_metni || 'N/A'}</div></div>
                <div class="result-item"><h6>Kategori:</h6><span class="category-badge">${result.kategori || 'N/A'}</span></div>
                <div class="result-item"><h6>Etiketler:</h6><div class="tags">${result.etiketler ? result.etiketler.map(tag => `<span class="tag">${tag}</span>`).join('') : 'N/A'}</div></div>
            </div>
        `;
    },

    /**
     * Sonuçlar bölümünü gizler.
     */
    hideResults: function() {
        if (this.elements.resultSection) {
            this.elements.resultSection.style.display = 'none';
        }
    },

    // 6.0 - Geçmiş Yönetimi ve Yardımcı Fonksiyonlar

    /**
     * Mevcut metin girişini yerel depolamaya kaydeder.
     */
    saveText: function() {
        if (typeof Utils === 'undefined' || !this.elements.newsText) return;
        
        const text = this.elements.newsText.value;
        if (text.length > 0) {
            Utils.storage.set('currentNewsText', text);
        }
    },

    /**
     * Kaydedilmiş metni yerel depolamadan yükler.
     */
    loadSavedText: function() {
        if (typeof Utils === 'undefined' || !this.elements.newsText) return;
        
        const savedText = Utils.storage.get('currentNewsText');
        if (savedText && !this.elements.newsText.value) {
            this.elements.newsText.value = savedText;
            this.updateCharacterCount();
            this.updateProcessButtonState();
        }
    },

    /**
     * Hem ayarları hem de metni aynı anda kaydeder.
     */
    saveAll: function() {
        this.saveSettings();
        this.saveText();
    },

    /**
     * Tamamlanan bir işlemi geçmişe kaydeder.
     * @param {Object} input - İşleme gönderilen veri.
     * @param {Object} output - İşlemden dönen sonuç.
     */
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
        
        // Sadece son 20 işlemi sakla
        if (history.length > 20) {
            history = history.slice(0, 20);
        }

        Utils.storage.set('processingHistory', history);
        console.log('Yeni işlem geçmişe eklendi.');
    },

    /**
     * Metin alanını ve sonuçları temizler.
     */
    clearAll: function() {
        if (this.elements.newsText) {
            this.elements.newsText.value = '';
        }
        
        this.updateCharacterCount();
        this.updateProcessButtonState();
        this.hideResults();
        
        if (typeof Utils !== 'undefined') {
            Utils.storage.remove('currentNewsText');
            Utils.showNotification('Giriş alanı ve sonuçlar temizlendi.', 'info');
        }
    },
};

// DOM yüklendiğinde bileşeni başlat ve kaydedilmiş metni yükle
document.addEventListener('DOMContentLoaded', function() {
    MainContentComponent.init();
    MainContentComponent.loadSavedText();
});

// Bileşeni global `window` nesnesine ekle
window.MainContentComponent = MainContentComponent;
