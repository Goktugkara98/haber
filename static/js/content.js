/**
 * @file content.js
 * @description İçerik Alanı Kontrolcüsü
 * * Bu dosya, ana içerik alanındaki bileşenleri (metin girişi, ayarlar, sonuçlar)
 * yöneten ve aralarındaki etkileşimi organize eden `ContentController`'ı içerir.
 * Form gönderimi, otomatik kaydetme, klavye kısayolları gibi ana işlevsellikler
 * burada yönetilir.
 *
 * İçindekiler:
 * 1.0 ContentController Nesnesi
 * 1.1 init() - Tüm içerik bileşenlerini ve olayları başlatır.
 * 1.2 bindEvents() - Global içerik olaylarını (form gönderimi, kısayollar) bağlar.
 * 1.3 handleFormSubmit() - Ana formun gönderilme işlemini yönetir.
 * 1.4 collectFormData() - Formdaki verileri toplar.
 * 1.5 validateFormData() - Form verilerini doğrular.
 * 1.6 processNews() - Haber metnini işlemek için API isteği gönderir.
 * 1.7 setupAutoSave() - Otomatik kaydetme mekanizmasını ayarlar.
 * 1.8 autoSave() - Mevcut form verilerini LocalStorage'a kaydeder.
 * 1.9 loadSavedData() - Kaydedilmiş verileri forma geri yükler.
 * 1.10 saveToHistory() - İşlem sonucunu geçmişe kaydeder.
 * 1.11 setupKeyboardShortcuts() - Klavye kısayollarını tanımlar.
 * 1.12 clearForm() - Formu temizler.
 * 1.13 getHistory() - İşlem geçmişini getirir.
 * 2.0 Global Başlatma
 * 2.1 ContentController'ın otomatik başlatılması.
 */

// =================================================================================================
// 1.0 ContentController Nesnesi
// =================================================================================================

const ContentController = (function() {
    let isInitialized = false;
    
    const controller = {
        /**
         * 1.1 init()
         * Tüm içerik bileşenlerini (TextInput, Settings, Results vb.) başlatır,
         * olayları bağlar ve kaydedilmiş verileri yükler.
         */
        init: function() {
            if (isInitialized) {
                console.log('Bilgi: ContentController zaten başlatılmış, tekrar başlatma atlandı.');
                return this;
            }
            
            console.log('Bilgi: ContentController başlatılıyor...');
            
            // Bileşenleri varlık kontrolü yaparak başlat
            if (typeof TextInputComponent !== 'undefined') TextInputComponent.init();
            if (typeof SettingsComponent !== 'undefined') SettingsComponent.init();
            if (typeof ResultsComponent !== 'undefined') ResultsComponent.init();
            if (typeof LoadingComponent !== 'undefined') LoadingComponent.init();
            if (window.PreviewModal && !window.PreviewModal.isInitialized) window.PreviewModal.init();
            
            this.bindEvents();
            this.loadSavedData();
            
            isInitialized = true;
            console.log('Bilgi: ContentController başarıyla başlatıldı.');
            return this;
        },

        /**
         * 1.2 bindEvents()
         * Form gönderimi, otomatik kaydetme ve klavye kısayolları gibi
         * genel olay dinleyicilerini tanımlar.
         */
        bindEvents: function() {
            const newsForm = document.getElementById('newsForm');
            if (newsForm) {
                newsForm.addEventListener('submit', this.handleFormSubmit.bind(this));
            }
            this.setupAutoSave();
            this.setupKeyboardShortcuts();
        },

        /**
         * 1.3 handleFormSubmit()
         * Form gönderildiğinde tetiklenir. Verileri toplar, doğrular,
         * API'ye gönderir ve sonucu ekranda gösterir.
         * @param {Event} e - Form submit olayı.
         */
        handleFormSubmit: async function(e) {
            e.preventDefault();
            
            const formData = this.collectFormData();
            const validation = this.validateFormData(formData);
            if (!validation.valid) {
                Utils.showNotification(validation.message, 'warning');
                return;
            }

            LoadingComponent?.show();
            ResultsComponent?.hide();

            try {
                const result = await this.processNews(formData);
                LoadingComponent?.hide();
                ResultsComponent?.show(result);
                this.saveToHistory(formData, result);
            } catch (error) {
                console.error('Hata: Form gönderimi sırasında bir hata oluştu.', error);
                LoadingComponent?.hide();
                Utils.showNotification(AppConfig.messages.tr.processingError, 'danger');
            }
        },

        /**
         * 1.4 collectFormData()
         * Formdaki metin, kurallar ve ayar verilerini bir nesne olarak toplar.
         * @returns {object} - Form verilerini içeren nesne.
         */
        collectFormData: function() {
            return {
                newsText: document.getElementById('newsText')?.value.trim() || '',
                rules: document.getElementById('rules')?.value.trim() || '',
                settings: window.settingsManager?.getSettings() || {},
                timestamp: new Date().toISOString()
            };
        },

        /**
         * 1.5 validateFormData()
         * Toplanan form verilerinin geçerliliğini kontrol eder.
         * @param {object} data - Kontrol edilecek form verileri.
         * @returns {{valid: boolean, message?: string}} - Doğrulama sonucu.
         */
        validateFormData: function(data) {
            return Utils.validateText(data.newsText);
        },

        /**
         * 1.6 processNews()
         * Verileri API'ye göndererek haber metninin işlenmesini sağlar.
         * @param {object} data - İşlenecek veriler (haber metni ve ayarlar).
         * @returns {Promise<object>} - API'den dönen işlem sonucu.
         */
        processNews: async function(data) {
            try {
                window.statisticsManager?.onProcessingStart();
                
                const response = await fetch(AppConfig.apiEndpoints.processNews, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        news_text: data.newsText,
                        settings: data.settings || {}
                    })
                });
                
                const result = await response.json();
                window.statisticsManager?.onProcessingComplete();
                return result;
                
            } catch (error) {
                console.error('Hata: Haber işleme API isteği başarısız oldu.', error);
                window.statisticsManager?.onProcessingComplete();
                return {
                    success: false,
                    error: `İşlem sırasında bir hata oluştu: ${error.message}`
                };
            }
        },

        /**
         * 1.7 setupAutoSave()
         * `AppConfig` içinde tanımlanan aralıklarla `autoSave` fonksiyonunu çalıştırır.
         */
        setupAutoSave: function() {
            const autoSaveInterval = AppConfig.settings.autoSaveInterval;
            if (autoSaveInterval > 0) {
                setInterval(() => this.autoSave(), autoSaveInterval);
            }
        },

        /**
         * 1.8 autoSave()
         * Formdaki mevcut verileri LocalStorage'a kaydeder.
         */
        autoSave: function() {
            const formData = this.collectFormData();
            if (formData.newsText.length > 0) {
                Utils.storage.set('autoSave', formData);
                console.log('Bilgi: Form verileri otomatik olarak kaydedildi.');
            }
        },

        /**
         * 1.9 loadSavedData()
         * Sayfa yüklendiğinde LocalStorage'daki kaydedilmiş verileri forma geri yükler.
         */
        loadSavedData: function() {
            const savedData = Utils.storage.get('autoSave');
            if (savedData) {
                const newsTextEl = document.getElementById('newsText');
                if (newsTextEl && !newsTextEl.value) {
                    newsTextEl.value = savedData.newsText;
                }
                const rulesEl = document.getElementById('rules');
                if (rulesEl && !rulesEl.value) {
                    rulesEl.value = savedData.rules;
                }
                console.log('Bilgi: Kaydedilmiş form verileri başarıyla geri yüklendi.');
            }
        },

        /**
         * 1.10 saveToHistory()
         * Tamamlanan bir işlemi (girdi ve çıktı) LocalStorage'daki geçmiş listesine ekler.
         * @param {object} input - Kullanıcının girdiği veriler.
         * @param {object} output - API'den dönen sonuç.
         */
        saveToHistory: function(input, output) {
            const historyItem = {
                id: Date.now(),
                input: input,
                output: output,
                timestamp: new Date().toISOString()
            };

            let history = Utils.storage.get('processingHistory', []);
            history.unshift(historyItem);
            
            if (history.length > 10) { // Sadece son 10 işlemi tut
                history = history.slice(0, 10);
            }

            Utils.storage.set('processingHistory', history);
        },

        /**
         * 1.11 setupKeyboardShortcuts()
         * Uygulama genelinde kullanılacak klavye kısayollarını (Ctrl+Enter, Ctrl+S, Esc) tanımlar.
         */
        setupKeyboardShortcuts: function() {
            document.addEventListener('keydown', (e) => {
                if (e.ctrlKey && e.key === 'Enter') {
                    e.preventDefault();
                    document.getElementById('newsForm')?.dispatchEvent(new Event('submit'));
                }
                if (e.ctrlKey && e.key === 's') {
                    e.preventDefault();
                    this.autoSave();
                    Utils.showNotification('Mevcut çalışma manuel olarak kaydedildi.', 'info');
                }
                if (e.key === 'Escape') {
                    // confirm() kullanımı tarayıcıda takılmalara neden olabileceğinden önerilmez.
                    // Bunun yerine özel bir modal penceresi kullanılabilir.
                    // Şimdilik bu özelliği devre dışı bırakıyoruz.
                    // if (confirm('Formu temizlemek istediğinizden emin misiniz?')) {
                    //     this.clearForm();
                    // }
                }
            });
        },

        /**
         * 1.12 clearForm()
         * Metin alanlarını, ayarları ve sonuçları temizler. Otomatik kaydı siler.
         */
        clearForm: function() {
            document.getElementById('newsText').value = '';
            document.getElementById('rules').value = '';
            SettingsComponent?.reset();
            ResultsComponent?.hide();
            Utils.storage.remove('autoSave');
            Utils.showNotification('Form başarıyla temizlendi.', 'info');
        },

        /**
         * 1.13 getHistory()
         * LocalStorage'dan işlem geçmişini alır.
         * @returns {Array} - İşlem geçmişi dizisi.
         */
        getHistory: function() {
            return Utils.storage.get('processingHistory', []);
        }
    };

    // =================================================================================================
    // 2.0 Global Başlatma
    // =================================================================================================
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => controller.init());
    } else {
        setTimeout(() => controller.init(), 0);
    }

    return controller;
})();

window.ContentController = ContentController;
