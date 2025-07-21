/**
 * Settings Configuration
 * Maps database keys to all UI display logic
 * Updated based on user requirements - 2025-07-21
 */

const SettingsConfig = {
    // Haber Çeşidi (News Type)
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

    // Hedef Kategori (Target Category)
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

    // Başlıkta Şehir Bilgisi (City Info in Title)
    titleCityInfo: {
        dbKey: 'titleCityInfo',
        displayName: 'Başlıkta Şehir Bilgisi',
        previewText: 'Başlıkta şehir bilgisi',
        options: [
            { value: 'True', label: 'Evet' },
            { value: 'False', label: 'Hayır' }
        ],
        defaultValue: 'False',
        category: 'content',
        order: 3
    },

    // Şirket Bilgisi Kaldır (Remove Company Info)
    removeCompanyInfo: {
        dbKey: 'removeCompanyInfo',
        displayName: 'Şirket Bilgisi Kaldır',
        previewText: 'Şirket bilgisi kaldırma',
        options: [
            { value: 'True', label: 'Evet' },
            { value: 'False', label: 'Hayır' }
        ],
        defaultValue: 'True',
        category: 'privacy',
        order: 4
    },

    // Plaka Bilgisi Kaldır (Remove Plate Info)
    removePlateInfo: {
        dbKey: 'removePlateInfo',
        displayName: 'Plaka Bilgisi Kaldır',
        previewText: 'Plaka bilgisi kaldırma',
        options: [
            { value: 'True', label: 'Evet' },
            { value: 'False', label: 'Hayır' }
        ],
        defaultValue: 'True',
        category: 'privacy',
        order: 5
    },

    // Etiket Sayısı (Tag Count)
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

    // Özel Talimatlar (Custom Instructions)
    customInstructions: {
        dbKey: 'customInstructions',
        displayName: 'Özel Talimatlar',
        previewText: 'Özel talimatlar',
        type: 'textarea',
        placeholder: 'Haber oluşturma ile ilgili özel talimatlarınızı yazın...',
        defaultValue: '',
        category: 'content',
        order: 7
    },

    // Çıktı Formatı (Output Format)
    outputFormat: {
        dbKey: 'outputFormat',
        displayName: 'Çıktı Formatı',
        previewText: 'Çıktı formatı',
        options: [
            { value: 'json', label: 'JSON' },
            { value: 'text', label: 'Metin' },
            { value: 'markdown', label: 'Markdown' }
        ],
        defaultValue: 'json',
        category: 'format',
        order: 8
    }
};

// Category definitions
const Categories = {
    content: {
        name: 'İçerik Ayarları',
        icon: 'fas fa-file-text',
        description: 'Haber içeriği ile ilgili temel ayarlar',
        order: 1
    },
    privacy: {
        name: 'Gizlilik Ayarları',
        icon: 'fas fa-shield-alt',
        description: 'Kişisel bilgilerin korunması ayarları',
        order: 2
    },
    format: {
        name: 'Format Ayarları',
        icon: 'fas fa-cogs',
        description: 'Çıktı formatı ve görünüm ayarları',
        order: 3
    }
};

// Utility functions
const SettingsUtils = {
    /**
     * Get setting config by key
     */
    getConfig(key) {
        return SettingsConfig[key] || null;
    },

    /**
     * Get display label for a setting value
     */
    getDisplayLabel(key, value) {
        try {
            const config = this.getConfig(key);
            if (!config) {
                console.warn(`No config found for setting: ${key}`);
                return value;
            }

            // Handle boolean values
            if (value === true || value === 'true' || value === 'True') return 'Evet';
            if (value === false || value === 'false' || value === 'False') return 'Hayır';

            // Special handling for nameCensorship
            if (key === 'nameCensorship') {
                return this.getNameCensorshipText(value);
            }

            // If no options array or value is empty, return as is
            if (!config.options || !Array.isArray(config.options) || value === undefined || value === '') {
                return value;
            }

            // Try to find matching option
            const option = config.options.find(opt => {
                // Handle both string and number comparisons
                return String(opt.value) === String(value);
            });

            return option ? option.label : value;
        } catch (error) {
            console.error(`Error getting display label for ${key}=${value}:`, error);
            return value; // Return original value on error
        }
    },
    
    /**
     * Get display text for nameCensorship setting
     */
    getNameCensorshipText(value) {
        const options = {
            'none': 'Sansürsüz',
            'partial': 'Kısmi Sansür',
            'full': 'Tam Sansür',
            'initials': 'Sadece Baş Harfler'
        };
        return options[value] || value;
    },

    /**
     * Get all setting keys
     */
    getAllKeys() {
        return Object.keys(SettingsConfig);
    },

    /**
     * Get settings by category
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
     * Get default values for all settings
     */
    getDefaults() {
        const defaults = {};
        for (const [key, config] of Object.entries(SettingsConfig)) {
            defaults[key] = config.defaultValue;
        }
        return defaults;
    }
};

// Make available globally
window.SettingsConfig = SettingsConfig;
window.Categories = Categories;
window.SettingsUtils = SettingsUtils;
