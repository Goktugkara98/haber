/**
 * @file settings-manager.js
 * @description Ayar Yöneticisi Modülü
 * * Bu dosya, kullanıcı ayarlarını yöneten `SettingsManager` sınıfını içerir.
 * Ayarları veritabanından getirme (fetch), yerel olarak saklama, güncelleme
 * ve veritabanına kaydetme işlemlerinden sorumludur. Ayrıca, ayarlarda
 * yapılan değişiklikleri dinleyen (listener) diğer modülleri bilgilendirir.
 *
 * İçindekiler:
 * 1.0 SettingsManager Sınıfı
 * 1.1 constructor() - Sınıfın başlangıç durumu.
 * 1.2 init() - Ayarları veritabanından yükleyerek yöneticiyi başlatır.
 * 1.3 loadFromDatabase() - API aracılığıyla kullanıcı ayarlarını yükler.
 * 1.4 saveToDatabase() - Ayarları API aracılığıyla veritabanına kaydeder.
 * 1.5 updateSettings() - Ayarları günceller ve değişiklikleri yayınlar.
 * 1.6 getSettings() - Mevcut ayarları döndürür.
 * 1.7 getSetting() - Belirli bir ayarın değerini döndürür.
 * 1.8 getDisplaySettings() - Ayarları okunabilir etiketlerle birlikte döndürür.
 * 1.9 addListener() - Ayar değişikliklerini dinlemek için bir fonksiyon ekler.
 * 1.10 removeListener() - Bir dinleyiciyi kaldırır.
 * 1.11 notifyListeners() - Tüm dinleyicilere değişiklikleri bildirir.
 * 1.12 isReady() - Ayarların yüklenip hazır olduğunu kontrol eder.
 * 2.0 Global Başlatma
 * 2.1 Global `settingsManager` nesnesinin oluşturulması.
 */

// =================================================================================================
// 1.0 SettingsManager Sınıfı
// =================================================================================================

class SettingsManager {
    /**
     * 1.1 constructor()
     * SettingsManager sınıfının yapıcı metodu. Ayarları, yüklenme durumunu
     * ve dinleyicileri saklamak için başlangıç değişkenlerini ayarlar.
     */
    constructor() {
        this.settings = {};
        this.isLoaded = false;
        this.listeners = [];
        console.log('Bilgi: SettingsManager örneği oluşturuldu.');
    }

    /**
     * 1.2 init()
     * Ayar yöneticisini başlatır. Ayarları veritabanından yüklemeye çalışır.
     * Başarısız olursa, varsayılan ayarlarla devam eder.
     * @returns {Promise<boolean>} - Yüklemenin başarılı olup olmadığını belirtir.
     */
    async init() {
        try {
            console.log('Bilgi: Kullanıcı ayarları veritabanından yükleniyor...');
            await this.loadFromDatabase();
            this.isLoaded = true;
            this.notifyListeners('loaded', this.settings);
            console.log('Bilgi: Ayarlar başarıyla yüklendi:', this.settings);
            return true;
        } catch (error) {
            console.error('Hata: Ayarlar veritabanından yüklenemedi. Varsayılan değerler kullanılacak.', error);
            this.settings = window.SettingsUtils.getDefaults();
            this.isLoaded = true;
            this.notifyListeners('loaded', this.settings);
            return false;
        }
    }

    /**
     * 1.3 loadFromDatabase()
     * `/api/prompt/user-settings` endpoint'ine bir GET isteği göndererek
     * kullanıcı ayarlarını yükler ve eksik ayarları varsayılanlarla tamamlar.
     */
    async loadFromDatabase() {
        const response = await fetch('/api/prompt/user-settings');
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const result = await response.json();
        if (!result.success) {
            throw new Error(result.message || 'API\'den ayarlar alınamadı.');
        }

        this.settings = result.data.settings || {};
        
        // Eksik ayarları varsayılan değerlerle doldur
        const defaults = window.SettingsUtils.getDefaults();
        for (const [key, defaultValue] of Object.entries(defaults)) {
            if (!(key in this.settings)) {
                this.settings[key] = defaultValue;
            }
        }
    }

    /**
     * 1.4 saveToDatabase()
     * Verilen ayarları `/api/prompt/user-settings` endpoint'ine POST isteği
     * ile göndererek veritabanına kaydeder.
     * @param {object} newSettings - Kaydedilecek yeni ayarlar.
     * @returns {Promise<object>} - API'den dönen sonuç.
     */
    async saveToDatabase(newSettings) {
        const response = await fetch('/api/prompt/user-settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ settings: newSettings })
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const result = await response.json();
        if (!result.success) {
            throw new Error(result.message || 'Ayarlar kaydedilemedi.');
        }
        return result;
    }

    /**
     * 1.5 updateSettings()
     * Ayarları hem veritabanında hem de yerel olarak günceller.
     * Güncelleme sonrası tüm dinleyicileri bilgilendirir.
     * @param {object} newSettings - Güncellenecek ayarlar.
     * @returns {Promise<boolean>} - İşlemin başarılı olup olmadığını belirtir.
     */
    async updateSettings(newSettings) {
        try {
            console.log('Bilgi: Ayarlar güncelleniyor...', newSettings);
            await this.saveToDatabase(newSettings);
            this.settings = { ...this.settings, ...newSettings };
            this.notifyListeners('updated', this.settings, newSettings);
            console.log('Bilgi: Ayarlar başarıyla güncellendi ve kaydedildi.');
            return true;
        } catch (error) {
            console.error('Hata: Ayarlar güncellenirken bir sorun oluştu.', error);
            throw error; // Hatanın üst katmanlara iletilmesi
        }
    }

    /**
     * 1.6 getSettings()
     * Mevcut ayarların bir kopyasını döndürür.
     * @returns {object} - Ayarlar nesnesi.
     */
    getSettings() {
        return { ...this.settings };
    }

    /**
     * 1.7 getSetting()
     * Belirtilen anahtara sahip ayarın değerini döndürür.
     * @param {string} key - Ayar anahtarı.
     * @returns {*} - Ayarın değeri.
     */
    getSetting(key) {
        return this.settings[key];
    }

    /**
     * 1.8 getDisplaySettings()
     * Ayarları, okunabilir etiketleri ve kategorileri ile birlikte bir nesne
     * olarak döndürür. Arayüzde gösterim için kullanılır.
     * @returns {object} - Detaylı ayarlar nesnesi.
     */
    getDisplaySettings() {
        const displaySettings = {};
        for (const [key, value] of Object.entries(this.settings)) {
            const config = window.SettingsUtils.getConfig(key);
            if (config) {
                displaySettings[key] = {
                    value: value,
                    displayName: config.displayName,
                    displayValue: window.SettingsUtils.getDisplayLabel(key, value),
                    category: config.category
                };
            }
        }
        return displaySettings;
    }

    /**
     * 1.9 addListener()
     * Ayar değişikliklerini dinlemek için bir geri çağırma (callback) fonksiyonu ekler.
     * @param {Function} callback - Dinleyici fonksiyon.
     */
    addListener(callback) {
        this.listeners.push(callback);
        console.log('Bilgi: Yeni bir ayar dinleyicisi eklendi.');
    }

    /**
     * 1.10 removeListener()
     * Eklenmiş bir dinleyiciyi kaldırır.
     * @param {Function} callback - Kaldırılacak dinleyici fonksiyon.
     */
    removeListener(callback) {
        const index = this.listeners.indexOf(callback);
        if (index > -1) {
            this.listeners.splice(index, 1);
            console.log('Bilgi: Bir ayar dinleyicisi kaldırıldı.');
        }
    }

    /**
     * 1.11 notifyListeners()
     * Kayıtlı tüm dinleyicilere bir ayar değişikliği olduğunu bildirir.
     * @param {string} event - Olay türü ('loaded', 'updated').
     * @param {object} settings - Güncel ayarlar.
     * @param {object|null} changes - Sadece değişen ayarlar.
     */
    notifyListeners(event, settings, changes = null) {
        console.log(`Bilgi: ${this.listeners.length} dinleyiciye "${event}" olayı bildiriliyor.`);
        this.listeners.forEach(callback => {
            try {
                callback(event, settings, changes);
            } catch (error) {
                console.error('Hata: Ayar dinleyicisi çalıştırılırken bir hata oluştu.', error);
            }
        });
    }

    /**
     * 1.12 isReady()
     * Ayarların veritabanından yüklenip kullanıma hazır olup olmadığını kontrol eder.
     * @returns {boolean} - Hazırsa `true`, değilse `false`.
     */
    isReady() {
        return this.isLoaded;
    }
}

// =================================================================================================
// 2.0 Global Başlatma
// =================================================================================================

/**
 * Uygulamanın her yerinden erişilebilmesi için `SettingsManager` sınıfından
 * global bir örnek oluşturur.
 */
window.settingsManager = new SettingsManager();
