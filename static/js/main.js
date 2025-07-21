/**
 * @file main.js
 * @description Ana Uygulama Kontrolcüsü
 * * Bu dosya, uygulamanın ana giriş noktasıdır (entry point). Tüm modülleri
 * (Utils, ContentController, SettingsManager vb.) bir araya getirir ve
 * uygulamanın genel başlatılma sürecini yönetir. Global animasyonlar ve
 * olay dinleyicileri de burada tanımlanır.
 *
 * İçindekiler:
 * 1.0 App Nesnesi (Ana Kontrolcü)
 * 1.1 init() - Uygulamayı başlatır, tüm modülleri sırayla yükler.
 * 1.2 initializeGlobalAnimations() - GSAP kullanarak global animasyonları başlatır.
 * 1.3 initializeButtonAnimations() - Butonlar için hover animasyonları ekler.
 * 1.4 initializeGlobalEvents() - Global olayları (klavye kısayolları, sayfa görünürlüğü) yönetir.
 * 1.5 showHelp() - Yardım menüsünü gösterir.
 * 1.6 clearAll() - Tüm uygulama verilerini (form, LocalStorage) temizler.
 * 1.7 getStatus() - Yüklenen modüllerin durumunu kontrol eder.
 * 2.0 Global Fonksiyonlar
 * 2.1 Geriye dönük uyumluluk için global fonksiyonlar.
 * 3.0 Global Başlatma
 * 3.1 DOM yüklendiğinde App.init() fonksiyonunun çağrılması.
 */

// =================================================================================================
// 1.0 App Nesnesi (Ana Kontrolcü)
// =================================================================================================

const App = {
    /**
     * 1.1 init()
     * Uygulamanın ana başlatma fonksiyonu. Gerekli tüm modülleri ve
     * bileşenleri sırayla başlatır.
     */
    init: async function() {
        console.log('Bilgi: Haber Uygulaması ana kontrolcüsü (App) başlatılıyor...');
        
        // Temel yardımcı fonksiyonların (Utils) yüklendiğinden emin ol
        if (typeof Utils === 'undefined') {
            console.error('Hata: Temel yardımcı fonksiyonlar (Utils) yüklenemedi. Uygulama başlatılamıyor.');
            return;
        }
        
        // Merkezi ayar yöneticisini başlat
        if (window.settingsManager) {
            try {
                await window.settingsManager.init();
                console.log('Bilgi: Merkezi ayar yöneticisi başarıyla başlatıldı.');
            } catch (error) {
                console.error('Hata: Merkezi ayar yöneticisi başlatılamadı.', error);
            }
        }
        
        // İçerik kontrolcüsünü başlat
        if (typeof ContentController !== 'undefined') {
            ContentController.init();
        }
        
        this.initializeGlobalAnimations();
        this.initializeGlobalEvents();
        
        console.log('Bilgi: Uygulama başarıyla başlatıldı ve kullanıma hazır.');
    },

    /**
     * 1.2 initializeGlobalAnimations()
     * Sayfa girişi, navbar ve ana içerik için GSAP tabanlı global animasyonları başlatır.
     */
    initializeGlobalAnimations: function() {
        if (typeof gsap === 'undefined') {
            console.warn('Uyarı: GSAP kütüphanesi bulunamadı, animasyonlar devre dışı bırakıldı.');
            return;
        }

        gsap.from('body', { duration: 0.5, opacity: 0, ease: 'power2.out' });
        gsap.from('.navbar', { duration: 0.8, y: -50, opacity: 0, ease: 'power2.out', delay: 0.2 });
        gsap.from('main', { duration: 1, y: 30, opacity: 0, ease: 'power2.out', delay: 0.4 });

        this.initializeButtonAnimations();
    },

    /**
     * 1.3 initializeButtonAnimations()
     * Tüm butonlara fare ile üzerine gelindiğinde (hover) ölçeklenme animasyonu ekler.
     */
    initializeButtonAnimations: function() {
        if (typeof gsap === 'undefined') return;

        document.addEventListener('mouseover', (e) => {
            if (e.target.matches('.btn')) {
                gsap.to(e.target, { duration: 0.3, scale: 1.05, ease: 'power2.out' });
            }
        });

        document.addEventListener('mouseout', (e) => {
            if (e.target.matches('.btn')) {
                gsap.to(e.target, { duration: 0.3, scale: 1, ease: 'power2.out' });
            }
        });
    },

    /**
     * 1.4 initializeGlobalEvents()
     * Genel klavye kısayollarını (F1, Alt+C) ve sayfa görünürlük değişikliklerini
     * dinleyen olayları tanımlar.
     */
    initializeGlobalEvents: function() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'F1') {
                e.preventDefault();
                this.showHelp();
            }
            if (e.altKey && e.key === 'c') {
                e.preventDefault();
                // `confirm` kullanımı önerilmez, özel bir modal ile değiştirilmelidir.
                // if (confirm('Tüm uygulama verilerini (kayıtlar, geçmiş) silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.')) {
                //     this.clearAll();
                // }
            }
        });

        // Sayfa arka plana alındığında otomatik kaydet
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                console.log('Bilgi: Sayfa arka plana alındı, otomatik kayıt yapılıyor.');
                ContentController?.autoSave();
            }
        });

        // Sayfadan ayrılmadan önce otomatik kaydet
        window.addEventListener('beforeunload', () => {
            ContentController?.autoSave();
        });
    },

    /**
     * 1.5 showHelp()
     * Klavye kısayolları ve özellikleri içeren bir yardım bildirimi gösterir.
     */
    showHelp: function() {
        const helpContent = `
            <h5>Klavye Kısayolları</h5>
            <ul>
                <li><kbd>Ctrl + Enter</kbd> - Formu gönder</li>
                <li><kbd>Ctrl + S</kbd> - Mevcut çalışmayı kaydet</li>
                <li><kbd>Esc</kbd> - Formu temizle (onay gerekir)</li>
                <li><kbd>Alt + C</kbd> - Tüm verileri temizle (onay gerekir)</li>
                <li><kbd>F1</kbd> - Bu yardım menüsünü göster</li>
            </ul>
            <h5>Özellikler</h5>
            <ul>
                <li>30 saniyede bir otomatik kaydetme</li>
                <li>Gelişmiş metin doğrulama ve karakter takibi</li>
                <li>Sonuçları panoya kopyalama ve dosya olarak indirme</li>
            </ul>
        `;
        Utils.showNotification(helpContent, 'info', 10000);
    },

    /**
     * 1.6 clearAll()
     * Formu ve LocalStorage'daki tüm uygulama verilerini (otomatik kayıt, geçmiş, ayarlar) temizler.
     */
    clearAll: function() {
        ContentController?.clearForm();
        
        Utils.storage.remove('autoSave');
        Utils.storage.remove('processingHistory');
        Utils.storage.remove('userSettings'); // Bu anahtar `settings-manager` tarafından kullanılırsa
        
        ResultsComponent?.hide();
        LoadingComponent?.hide();
        
        Utils.showNotification('Tüm uygulama verileri başarıyla temizlendi.', 'success');
        console.log('Bilgi: Tüm uygulama verileri temizlendi.');
    },

    /**
     * 1.7 getStatus()
     * Uygulamanın çeşitli modüllerinin yüklenip yüklenmediğini kontrol eder.
     * Hata ayıklama için kullanılır.
     * @returns {object} - Modüllerin yüklenme durumunu içeren nesne.
     */
    getStatus: function() {
        return {
            baseLoaded: typeof Utils !== 'undefined',
            contentLoaded: typeof ContentController !== 'undefined',
            settingsManagerLoaded: typeof window.settingsManager !== 'undefined',
            settingsUILoaded: typeof window.settingsUI !== 'undefined',
            gsapLoaded: typeof gsap !== 'undefined'
        };
    }
};

// =================================================================================================
// 2.0 Global Fonksiyonlar
// =================================================================================================

/**
 * Geriye dönük uyumluluk veya HTML içinden kolay erişim için tanımlanmış global fonksiyonlar.
 */
function copyToClipboard() {
    ResultsComponent?.copyResult();
}

function downloadText() {
    ResultsComponent?.downloadResult();
}

// =================================================================================================
// 3.0 Global Başlatma
// =================================================================================================

/**
 * DOM içeriği tamamen yüklendiğinde `App.init()` fonksiyonunu çağırarak uygulamayı başlatır.
 */
document.addEventListener('DOMContentLoaded', async function() {
    await App.init();
});

// `App` nesnesini global scope'a taşı
window.App = App;
