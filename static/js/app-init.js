/**
 * @file app-init.js
 * @description Uygulama Başlatma Modülü
 * * Bu dosya, haber işleme uygulamasının ana başlatma mantığını içerir.
 * Ayarlar sistemini yükler, yapılandırır ve önizleme modal entegrasyonunu
 * gerçekleştirir. Uygulamanın genel başlangıç akışını yönetir.
 *
 * İçindekiler:
 * 1.0 AppInit Sınıfı
 * 1.1 constructor() - Sınıfın başlangıç durumu.
 * 1.2 init() - Uygulamayı başlatan ana fonksiyon.
 * 1.3 initializeSettings() - Ayarlar sistemini (yönetici ve arayüz) başlatır.
 * 1.4 initializePreviewModal() - Önizleme modalının davranışını genişletir.
 * 1.5 showErrorMessage() - Kullanıcıya hata mesajı gösterir.
 * 1.6 isReady() - Uygulamanın hazır olup olmadığını kontrol eder.
 * 2.0 Global Başlatma
 * 2.1 Global `appInit` nesnesinin oluşturulması.
 * 2.2 DOM yüklendiğinde uygulamanın otomatik başlatılması.
 */

// =================================================================================================
// 1.0 AppInit Sınıfı
// =================================================================================================

class AppInit {
    /**
     * 1.1 constructor()
     * AppInit sınıfının yapıcı metodu. Başlatılma durumunu izlemek için
     * `isInitialized` özelliğini ayarlar.
     */
    constructor() {
        this.isInitialized = false;
    }

    /**
     * 1.2 init()
     * Uygulamayı başlatır. Eğer daha önce başlatılmışsa işlemi atlar.
     * Ayarları ve önizleme modalını sırayla başlatır.
     */
    async init() {
        if (this.isInitialized) {
            console.log('Bilgi: Uygulama zaten başlatılmış. Tekrar başlatma işlemi atlandı.');
            return;
        }

        try {
            console.log('===== HABER UYGULAMASI BAŞLATILIYOR =====');

            // Adım 1: Ayarlar sistemini başlat
            await this.initializeSettings();

            // Adım 2: Önizleme modal entegrasyonunu başlat
            this.initializePreviewModal();

            // Uygulamayı hazır olarak işaretle
            this.isInitialized = true;
            console.log('===== HABER UYGULAMASI BAŞARIYLA BAŞLATILDI =====');

        } catch (error) {
            console.error('Hata: Uygulama başlatılırken kritik bir hata oluştu.', error);
            this.showErrorMessage('Uygulama başlatılırken ciddi bir hata oluştu. Lütfen konsolu kontrol edin.');
        }
    }

    /**
     * 1.3 initializeSettings()
     * Ayarlar sistemini (SettingsManager ve SettingsUI) başlatır.
     * Gerekli modüllerin yüklendiğinden emin olur ve ayarları veritabanından yükler.
     */
    async initializeSettings() {
        console.log('Bilgi: Ayarlar sistemi başlatılıyor...');

        // Gerekli ayar yapılandırma dosyalarının yüklenip yüklenmediğini kontrol et
        if (!window.SettingsConfig || !window.SettingsUtils) {
            throw new Error('Ayarlar yapılandırma dosyaları (SettingsConfig/SettingsUtils) bulunamadı.');
        }

        // Ayarlar arayüzünü (UI) başlat
        if (!window.settingsUI) {
            throw new Error('Ayarlar arayüzü (SettingsUI) modülü bulunamadı.');
        }
        window.settingsUI.init();

        // Ayar yöneticisini (Manager) başlat ve verileri yükle
        if (!window.settingsManager) {
            throw new Error('Ayar yöneticisi (SettingsManager) modülü bulunamadı.');
        }
        
        const success = await window.settingsManager.init();
        if (!success) {
            console.warn('Uyarı: Ayarlar veritabanından yüklenemedi. Varsayılan değerler kullanılıyor.');
        }

        console.log('Bilgi: Ayarlar sistemi başarıyla yüklendi.');
    }

    /**
     * 1.4 initializePreviewModal()
     * Önizleme modalının (PreviewModal) davranışını, backend'den tam prompt alacak
     * ve ayarları `settingsManager` üzerinden yönetecek şekilde genişletir.
     */
    initializePreviewModal() {
        console.log('Bilgi: Önizleme modal entegrasyonu başlatılıyor...');

        if (window.PreviewModal) {
            // `getCurrentSettings` metodunu, ayarları `settingsManager`'dan alacak şekilde override et
            window.PreviewModal.getCurrentSettings = async function() {
                if (window.settingsManager && window.settingsManager.isReady()) {
                    return window.settingsManager.getSettings();
                }
                // Eğer ayarlar yüklenemediyse varsayılan ayarlara geri dön
                console.warn('Uyarı: Ayarlar alınamadı, varsayılan değerler kullanılıyor.');
                return window.SettingsUtils.getDefaults();
            };

            // `buildPrompt` metodunu, tam prompt'u backend'den alacak şekilde override et
            window.PreviewModal.buildPrompt = async function(newsText, settings) {
                try {
                    console.log('Bilgi: Tam prompt backend\'den oluşturuluyor...');
                    
                    const response = await fetch('/api/prompt/build-complete-prompt', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ settings: settings, news_text: newsText })
                    });

                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                    }

                    const result = await response.json();
                    
                    if (result.success && result.data && result.data.prompt) {
                        console.log('Bilgi: Tam prompt backend\'den başarıyla alındı.');
                        return result.data.prompt;
                    } else {
                        throw new Error(result.error || 'Backend\'den prompt oluşturulamadı.');
                    }
                    
                } catch (error) {
                    console.error('Hata: Tam prompt oluşturulurken hata oluştu. Basit bir prompt kullanılacak.', error);
                    // Hata durumunda basit bir fallback prompt oluştur
                    const previewText = window.settingsUI ? window.settingsUI.getPreviewText(settings) : 'Varsayılan ayarlar';
                    return `Aşağıdaki haber metnini analiz et ve işle:\n\nAyarlar: ${previewText}\n\nHaber Metni:\n${newsText}`;
                }
            };

            // `show` metodunu, asenkron `buildPrompt` işlemini yönetecek şekilde güncelle
            const originalShow = window.PreviewModal.show;
            window.PreviewModal.show = async function(newsText) {
                this.showLoading();
                this.showModal();
                
                try {
                    // Mevcut ayarları al (zaman aşımı ile birlikte)
                    const settings = await Promise.race([
                        this.getCurrentSettings(),
                        new Promise((_, reject) => setTimeout(() => reject(new Error('Ayarların yüklenmesi zaman aşımına uğradı')), 5000))
                    ]);
                    
                    // Tam prompt'u asenkron olarak oluştur
                    const prompt = await this.buildPrompt(newsText, settings);
                    
                    // Modal içeriğini güncelle
                    this.updateContent(settings, prompt);
                    this.hideLoading();
                    
                } catch (error) {
                    console.error('Hata: Önizleme modalı gösterilirken bir hata oluştu. Fallback kullanılıyor.', error);
                    // Hata durumunda varsayılan ayarlarla devam et
                    const settings = this.getDefaultSettings();
                    const prompt = await this.buildPrompt(newsText, settings);
                    this.updateContent(settings, prompt);
                    this.hideLoading();
                }
            };

            console.log('Bilgi: Önizleme modal entegrasyonu tamamlandı.');
        } else {
            console.warn('Uyarı: Önizleme modalı (PreviewModal) bulunamadı. Entegrasyon atlandı.');
        }
    }

    /**
     * 1.5 showErrorMessage()
     * Kullanıcıya bir hata mesajı gösterir. Eğer `Utils.showNotification` mevcutsa onu,
     * değilse konsolu kullanır.
     * @param {string} message - Gösterilecek hata mesajı.
     */
    showErrorMessage(message) {
        if (window.Utils && window.Utils.showNotification) {
            window.Utils.showNotification(message, 'error');
        } else {
            console.error('Kullanıcıya gösterilecek hata mesajı:', message);
        }
    }

    /**
     * 1.6 isReady()
     * Uygulamanın başlatılıp başlatılmadığını kontrol eder.
     * @returns {boolean} - Uygulama hazırsa `true`, değilse `false`.
     */
    isReady() {
        return this.isInitialized;
    }
}

// =================================================================================================
// 2.0 Global Başlatma
// =================================================================================================

/**
 * 2.1 Global `appInit` nesnesinin oluşturulması.
 * Uygulamanın her yerinden erişilebilmesi için `AppInit` sınıfından bir örnek oluşturur.
 */
window.appInit = new AppInit();

/**
 * 2.2 DOM yüklendiğinde uygulamanın otomatik başlatılması.
 * Sayfanın tüm HTML içeriği yüklendiğinde `appInit.init()` fonksiyonunu çağırır.
 * Diğer scriptlerin yüklenmesine zaman tanımak için kısa bir gecikme eklenmiştir.
 */
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        window.appInit.init();
    }, 100);
});
