/**
 * @file base.js
 * @description Temel Yardımcı Fonksiyonlar ve Yapılandırma
 * * Bu dosya, uygulama genelinde kullanılacak olan temel yapılandırma ayarlarını,
 * yardımcı fonksiyonları (utility functions) ve global olay yöneticilerini içerir.
 * API endpoint'leri, metin doğrulama, bildirim gösterme, panoya kopyalama gibi
 * sık kullanılan işlevler burada tanımlanmıştır.
 *
 * İçindekiler:
 * 1.0 Global Yapılandırma (AppConfig)
 * 1.1 apiEndpoints - API adresleri.
 * 1.2 settings - Genel uygulama ayarları.
 * 1.3 messages - Kullanıcıya gösterilecek mesajlar.
 * 2.0 Global Yardımcı Fonksiyonlar (Utils)
 * 2.1 validateText() - Metin uzunluğunu doğrular.
 * 2.2 showNotification() - Bildirim mesajı gösterir.
 * 2.3 copyToClipboard() - Metni panoya kopyalar.
 * 2.4 downloadText() - Metni dosya olarak indirir.
 * 2.5 formatDate() - Tarih formatlar.
 * 2.6 debounce() - Fonksiyon çağırma sıklığını sınırlar.
 * 2.7 apiRequest() - API istekleri için yardımcı fonksiyon.
 * 2.8 storage - LocalStorage işlemleri (set, get, remove).
 * 3.0 Global Olay Yöneticileri
 * 3.1 DOMContentLoaded - Sayfa yüklendiğinde çalışan olaylar.
 */

// =================================================================================================
// 1.0 Global Yapılandırma (AppConfig)
// =================================================================================================

const AppConfig = {
    /**
     * 1.1 apiEndpoints
     * Backend API adreslerini merkezi bir yerden yönetir.
     */
    apiEndpoints: {
        // News processing endpoints
        processNews: '/api/v1/news/process',
        
        // History endpoints
        getHistory: '/api/v1/news/history',
        getStatistics: '/api/v1/news/statistics',
        markAsRead: '/api/v1/news/mark-as-read',
        
        // Prompt endpoints
        getPromptConfig: '/api/v1/prompts/config',
        getPromptSections: '/api/v1/prompts/sections',
        updatePromptSection: '/api/v1/prompts/sections',
        getUserSettings: '/api/v1/prompts/settings',
        saveUserSettings: '/api/v1/prompts/settings',
        buildCompletePrompt: '/api/v1/prompts/build-complete-prompt',
        buildCompletePrompt: '/api/v1/prompts/build-complete-prompt',
        processWithPrompt: '/api/v1/prompts/process-news'
    },
    
    /**
     * 1.2 settings
     * Uygulama genelindeki sabit ayarları içerir.
     */
    settings: {
        maxTextLength: 10000,
        minTextLength: 10,
        autoSaveInterval: 30000, // 30 saniye
        animationDuration: 300
    },
    
    /**
     * 1.3 messages
     * Kullanıcı arayüzünde gösterilecek metinleri barındırır.
     */
    messages: {
        tr: {
            textTooShort: 'Metin çok kısa, en az 10 karakter olmalı.',
            textTooLong: 'Metin çok uzun, maksimum 10.000 karakter olmalı.',
            processingError: 'İşlem sırasında bir hata oluştu. Lütfen tekrar deneyin.',
            copySuccess: 'Metin başarıyla panoya kopyalandı!',
            downloadSuccess: 'Dosya başarıyla indirildi!',
            saveSuccess: 'Değişiklikler başarıyla kaydedildi!',
            loadingText: 'İşleniyor, lütfen bekleyin...',
            networkError: 'Ağ bağlantısı hatası. Lütfen internet bağlantınızı kontrol edin.'
        }
    }
};

// =================================================================================================
// 2.0 Global Yardımcı Fonksiyonlar (Utils)
// =================================================================================================

const Utils = {
    /**
     * 2.1 validateText()
     * Verilen metnin minimum ve maksimum uzunluk kurallarına uyup uymadığını kontrol eder.
     * @param {string} text - Kontrol edilecek metin.
     * @param {number} minLength - İzin verilen minimum karakter sayısı.
     * @param {number} maxLength - İzin verilen maksimum karakter sayısı.
     * @returns {{valid: boolean, message?: string}} - Doğrulama sonucu ve (geçersizse) hata mesajı.
     */
    validateText: function(text, minLength = AppConfig.settings.minTextLength, maxLength = AppConfig.settings.maxTextLength) {
        if (!text || text.trim().length < minLength) {
            return { valid: false, message: AppConfig.messages.tr.textTooShort };
        }
        if (text.length > maxLength) {
            return { valid: false, message: AppConfig.messages.tr.textTooLong };
        }
        return { valid: true };
    },

    /**
     * 2.2 showNotification()
     * Ekranda geçici bir bildirim mesajı gösterir.
     * @param {string} message - Gösterilecek mesaj.
     * @param {string} type - Bildirim türü ('info', 'success', 'warning', 'danger').
     * @param {number} duration - Bildirimin ekranda kalma süresi (ms).
     */
    showNotification: function(message, type = 'info', duration = 5000) {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
        alertDiv.style.cssText = 'top: 20px; right: 20px; z-index: 1050; min-width: 300px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);';
        alertDiv.innerHTML = `${message}<button type="button" class="btn-close" data-bs-dismiss="alert"></button>`;
        
        document.body.appendChild(alertDiv);
        
        // Belirtilen süre sonunda bildirimi kaldır
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.remove();
            }
        }, duration);
        
        // GSAP kütüphanesi varsa animasyon ekle
        if (typeof gsap !== 'undefined') {
            gsap.from(alertDiv, { duration: 0.5, x: 100, opacity: 0, ease: 'power2.out' });
        }
    },

    /**
     * 2.3 copyToClipboard()
     * Verilen metni kullanıcının panosuna kopyalar.
     * @param {string} text - Kopyalanacak metin.
     * @returns {Promise<boolean>} - İşlemin başarılı olup olmadığını belirten Promise.
     */
    copyToClipboard: async function(text) {
        try {
            if (navigator.clipboard) {
                await navigator.clipboard.writeText(text);
            } else {
                // Eski tarayıcılar için fallback
                const textArea = document.createElement('textarea');
                textArea.value = text;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
            }
            this.showNotification(AppConfig.messages.tr.copySuccess, 'success');
            return true;
        } catch (error) {
            console.error('Hata: Panoya kopyalama işlemi başarısız oldu.', error);
            this.showNotification('Kopyalama başarısız oldu!', 'danger');
            return false;
        }
    },

    /**
     * 2.4 downloadText()
     * Verilen metni bir .txt dosyası olarak indirir.
     * @param {string} text - İndirilecek metin.
     * @param {string} filename - Dosya adı.
     * @returns {boolean} - İşlemin başarılı olup olmadığı.
     */
    downloadText: function(text, filename = 'islenmis_haber.txt') {
        try {
            const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            
            this.showNotification(AppConfig.messages.tr.downloadSuccess, 'success');
            return true;
        } catch (error) {
            console.error('Hata: Dosya indirme işlemi başarısız oldu.', error);
            this.showNotification('İndirme başarısız oldu!', 'danger');
            return false;
        }
    },

    /**
     * 2.5 formatDate()
     * Tarih nesnesini veya string'ini "GG.AA.YYYY SS:DD:ss" formatına çevirir.
     * @param {Date|string} date - Formatlanacak tarih.
     * @returns {string} - Formatlanmış tarih.
     */
    formatDate: function(date) {
        if (!date) return '';
        const d = new Date(date);
        return d.toLocaleDateString('tr-TR') + ' ' + d.toLocaleTimeString('tr-TR');
    },

    /**
     * 2.6 debounce()
     * Bir fonksiyonun belirli bir süre içinde yalnızca bir kez çalışmasını sağlar.
     * @param {Function} func - Çalıştırılacak fonksiyon.
     * @param {number} wait - Bekleme süresi (ms).
     * @returns {Function} - Debounce edilmiş fonksiyon.
     */
    debounce: function(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * 2.7 apiRequest()
     * Fetch API kullanarak standart bir API isteği gönderir.
     * @param {string} url - İstek yapılacak URL.
     * @param {object} options - Fetch için yapılandırma seçenekleri.
     * @returns {Promise<any>} - API'den dönen JSON veri.
     */
    apiRequest: async function(url, options = {}) {
        try {
            const defaultOptions = {
                headers: { 'Content-Type': 'application/json' },
            };
            
            const response = await fetch(url, { ...defaultOptions, ...options });
            
            if (!response.ok) {
                throw new Error(`HTTP Hatası! Durum: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Hata: API isteği başarısız oldu.', error);
            this.showNotification(AppConfig.messages.tr.networkError, 'danger');
            throw error;
        }
    },

    /**
     * 2.8 storage
     * LocalStorage üzerinde veri okuma, yazma ve silme işlemleri için yardımcı fonksiyonlar.
     */
    storage: {
        set: function(key, value) {
            try {
                localStorage.setItem(key, JSON.stringify(value));
                return true;
            } catch (error) {
                console.error(`Hata: LocalStorage'a veri yazılamadı (key: ${key}).`, error);
                return false;
            }
        },
        get: function(key, defaultValue = null) {
            try {
                const item = localStorage.getItem(key);
                if (item === null) return defaultValue;
                try {
                    return JSON.parse(item);
                } catch (e) {
                    // JSON parse edilemezse ham veriyi döndür
                    return item;
                }
            } catch (error) {
                console.error(`Hata: LocalStorage'dan veri okunamadı (key: ${key}).`, error);
                return defaultValue;
            }
        },
        remove: function(key) {
            try {
                localStorage.removeItem(key);
                return true;
            } catch (error) {
                console.error(`Hata: LocalStorage'dan veri silinemedi (key: ${key}).`, error);
                return false;
            }
        }
    }
};

// =================================================================================================
// 3.0 Global Olay Yöneticileri
// =================================================================================================

/**
 * 3.1 DOMContentLoaded
 * Sayfa tamamen yüklendiğinde çalışır. Bootstrap tooltip'lerini başlatır.
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('Bilgi: Temel betikler (base.js) yüklendi ve DOM hazır.');
    
    // Bootstrap tooltip'lerini başlat
    if (typeof bootstrap !== 'undefined') {
        const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl);
        });
    }
});

// Değişkenleri global scope'a taşıyarak diğer modüllerin erişimine aç
window.AppConfig = AppConfig;
window.Utils = Utils;
