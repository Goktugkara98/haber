/**
 * @file settings-config.js
 * @description Ayar Yapılandırma Modülü
 * * Bu dosya, uygulamadaki tüm ayarların merkezi yapılandırmasını içerir.
 * Her ayarın veritabanı anahtarı (dbKey), arayüzde görünecek adı (displayName),
 * seçenekleri, varsayılan değeri ve kategorisi burada tanımlanır. Bu yapı,
 * ayarların dinamik olarak oluşturulmasını ve yönetilmesini sağlar.
 *
 * İçindekiler:
 * 1.0 SettingsConfig Nesnesi - Tüm ayarların yapılandırması.
 * 2.0 Categories Nesnesi - Ayar kategorilerinin tanımı.
 * 3.0 SettingsUtils Nesnesi - Ayarlarla ilgili yardımcı fonksiyonlar.
 * 3.1 getConfig() - Belirli bir ayarın yapılandırmasını getirir.
 * 3.2 getDisplayLabel() - Bir ayar değeri için okunabilir etiketi getirir.
 * 3.3 getAllKeys() - Tüm ayar anahtarlarını listeler.
 * 3.4 getByCategory() - Ayarları kategoriye göre gruplar.
 * 3.5 getDefaults() - Tüm ayarlar için varsayılan değerleri döndürür.
 */

// =================================================================================================
// 1.0 SettingsConfig Nesnesi
// =================================================================================================

const SettingsConfig = {
    // Haber Çeşidi
    newsType: {
        dbKey: 'newsType',
        displayName: 'Haber Çeşidi',
        previewText: 'Haber çeşidi',
        options: [
            { value: 'social', label: 'Sosyal Medya Haberi' },
            { value: 'comprehensive', label: 'Kapsamlı Haber' }
        ],
        defaultValue: 'comprehensive',
        category: 'content',
        order: 1
    },

    // Hedef Kategori
    targetCategory: {
        dbKey: 'targetCategory',
        displayName: 'Hedef Kategori',
        previewText: 'Hedef kategori',
        options: [
            { value: 'auto', label: 'Otomatik Seç' },
            { value: 'Asayiş', label: 'Asayiş' },
            { value: 'Gündem', label: 'Gündem' },
            { value: 'Ekonomi', label: 'Ekonomi' },
            { value: 'Siyaset', label: 'Siyaset' },
            { value: 'Spor', label: 'Spor' },
            { value: 'Teknoloji', label: 'Teknoloji' },
            { value: 'Sağlık', label: 'Sağlık' },
            { value: 'Yaşam', label: 'Yaşam' },
            { value: 'Eğitim', label: 'Eğitim' },
            { value: 'Dünya', label: 'Dünya' },
            { value: 'Kültür & Sanat', label: 'Kültür & Sanat' },
            { value: 'Magazin', label: 'Magazin' },
            { value: 'Genel', label: 'Genel' }
        ],
        defaultValue: 'auto',
        category: 'content',
        order: 2
    },

    // Başlıkta Şehir Bilgisi
    titleCityInfo: {
        dbKey: 'titleCityInfo',
        displayName: 'Başlıkta Şehir Bilgisi',
        previewText: 'Başlıkta şehir bilgisi',
        options: [
            { value: 'True', label: 'Evet, eklensin' },
            { value: 'False', label: 'Hayır, eklenmesin' }
        ],
        defaultValue: 'False',
        category: 'content',
        order: 3
    },

    // Şirket Bilgisi Kaldır
    removeCompanyInfo: {
        dbKey: 'removeCompanyInfo',
        displayName: 'Şirket Bilgisi Kaldır',
        previewText: 'Şirket bilgisi kaldırma',
        options: [
            { value: 'True', label: 'Evet, kaldırılsın' },
            { value: 'False', label: 'Hayır, kalsın' }
        ],
        defaultValue: 'True',
        category: 'privacy',
        order: 4
    },

    // Plaka Bilgisi Kaldır
    removePlateInfo: {
        dbKey: 'removePlateInfo',
        displayName: 'Plaka Bilgisi Kaldır',
        previewText: 'Plaka bilgisi kaldırma',
        options: [
            { value: 'True', label: 'Evet, kaldırılsın' },
            { value: 'False', label: 'Hayır, kalsın' }
        ],
        defaultValue: 'True',
        category: 'privacy',
        order: 5
    },

    // Etiket Sayısı
    tagCount: {
        dbKey: 'tagCount',
        displayName: 'Etiket Sayısı',
        previewText: 'Etiket sayısı',
        options: [
            { value: '3', label: '3 Etiket' },
            { value: '5', label: '5 Etiket' },
            { value: '7', label: '7 Etiket' }
        ],
        defaultValue: '5',
        category: 'content',
        order: 6
    },

    // Özel Talimatlar
    customInstructions: {
        dbKey: 'customInstructions',
        displayName: 'Özel Talimatlar',
        previewText: 'Özel talimatlar',
        type: 'textarea',
        placeholder: 'Haber oluşturma ile ilgili ek talimatlarınızı buraya yazın...',
        defaultValue: '',
        category: 'content',
        order: 7
    },

    // İsim Sansürleme
    nameCensorship: {
        dbKey: 'nameCensorship',
        displayName: 'İsim Sansürleme',
        previewText: 'İsim sansürleme',
        options: [
            { value: 'none', label: 'Sansürleme Yok' },
            { value: 'initials', label: 'Baş Harfler' },
            { value: 'full', label: 'Tam Sansür' }
        ],
        defaultValue: 'initials',
        category: 'privacy',
        order: 7
    },

    // Yazım Stili
    writingStyle: {
        dbKey: 'writingStyle',
        displayName: 'Yazım Stili',
        previewText: 'Yazım stili',
        options: [
            { value: 'formal', label: 'Resmi' },
            { value: 'informal', label: 'Samimi' }
        ],
        defaultValue: 'formal',
        category: 'content',
        order: 9
    },

    // Çıktı Formatı
    outputFormat: {
        dbKey: 'outputFormat',
        displayName: 'Çıktı Formatı',
        previewText: 'Çıktı formatı',
        options: [
            { value: 'json', label: 'JSON (Tavsiye Edilen)' },
            { value: 'text', label: 'Düz Metin' },
            { value: 'markdown', label: 'Markdown' }
        ],
        defaultValue: 'json',
        category: 'format',
        order: 8
    }
};

// =================================================================================================
// 2.0 Categories Nesnesi
// =================================================================================================

const Categories = {
    content: {
        name: 'İçerik Ayarları',
        icon: 'fas fa-file-alt',
        description: 'Haberin başlığı, kategorisi ve içeriği ile ilgili temel ayarlar.',
        order: 1
    },
    privacy: {
        name: 'Gizlilik Ayarları',
        icon: 'fas fa-shield-alt',
        description: 'Haber metnindeki hassas bilgilerin (şirket, plaka vb.) korunması ile ilgili ayarlar.',
        order: 2
    },
    format: {
        name: 'Format Ayarları',
        icon: 'fas fa-cogs',
        description: 'Üretilecek çıktının formatını ve yapısal özelliklerini belirleyen ayarlar.',
        order: 3
    }
};

// =================================================================================================
// 3.0 SettingsUtils Nesnesi
// =================================================================================================

const SettingsUtils = {
    /**
     * 3.1 getConfig()
     * Verilen anahtara (key) karşılık gelen ayar yapılandırmasını döndürür.
     * @param {string} key - Ayar anahtarı.
     * @returns {object|null} - Ayar yapılandırması veya bulunamazsa null.
     */
    getConfig(key) {
        return SettingsConfig[key] || null;
    },

    /**
     * 3.2 getDisplayLabel()
     * Bir ayarın teknik değerini (örn: 'comprehensive') kullanıcı dostu bir etikete (örn: 'Kapsamlı Haber') çevirir.
     * @param {string} key - Ayar anahtarı.
     * @param {string|boolean} value - Ayarın mevcut değeri.
     * @returns {string} - Kullanıcı dostu etiket.
     */
    getDisplayLabel(key, value) {
        try {
            const config = this.getConfig(key);
            if (!config) return value;

            if (typeof value === 'boolean') value = value.toString();
            if (value === 'True') return 'Evet';
            if (value === 'False') return 'Hayır';

            if (!config.options || !Array.isArray(config.options) || value === undefined || value === '') {
                return value || 'Belirtilmemiş';
            }

            const option = config.options.find(opt => String(opt.value) === String(value));
            return option ? option.label : value;
        } catch (error) {
            console.error(`Hata: Ayar etiketi alınırken sorun oluştu (${key}=${value}):`, error);
            return value;
        }
    },
    
    /**
     * 3.3 getAllKeys()
     * `SettingsConfig` içinde tanımlı tüm ayar anahtarlarının bir listesini döndürür.
     * @returns {string[]} - Ayar anahtarları dizisi.
     */
    getAllKeys() {
        return Object.keys(SettingsConfig);
    },

    /**
     * 3.4 getByCategory()
     * Ayarları kategorilerine göre gruplandırılmış bir nesne olarak döndürür.
     * @param {string} category - Kategori adı.
     * @returns {object} - Belirtilen kategoriye ait ayarlar.
     */
    getByCategory(category) {
        const result = {};
        for (const [key, config] of Object.entries(SettingsConfig)) {
            if (config.category === category) {
                result[key] = config;
            }
        }
        return result;
    },

    /**
     * 3.5 getDefaults()
     * Tüm ayarlar için tanımlanmış varsayılan değerleri içeren bir nesne döndürür.
     * @returns {object} - Varsayılan ayarlar nesnesi.
     */
    getDefaults() {
        const defaults = {};
        for (const [key, config] of Object.entries(SettingsConfig)) {
            defaults[key] = config.defaultValue;
        }
        return defaults;
    }
};

// Yapılandırmaları ve yardımcı fonksiyonları global scope'a taşı
window.SettingsConfig = SettingsConfig;
window.Categories = Categories;
window.SettingsUtils = SettingsUtils;
