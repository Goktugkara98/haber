/**
 * @file text-input.js
 * @description Bu dosya, kullanıcıların haber metnini ve özel kuralları
 * girdiği metin alanı (textarea) bileşenlerini yönetir. Karakter sayacı,
 * otomatik boyutlandırma ve temel doğrulama gibi işlevleri içerir.
 *
 * İçindekiler:
 * 1.0 - Bileşen Başlatma ve Olay Yönetimi
 * 2.0 - Metin Alanı Etkileşimleri
 * 3.0 - Doğrulama ve Geri Bildirim
 * 4.0 - Yardımcı Fonksiyonlar ve Veri Erişimi
 */

const TextInputComponent = {
    elements: {}, // DOM elementleri için cache nesnesi

    // 1.0 - Bileşen Başlatma ve Olay Yönetimi

    /**
     * Bileşeni başlatır, DOM elementlerini cache'ler ve olayları bağlar.
     */
    init: function() {
        this.cacheElements();
        this.bindEvents();
        this.setupInitialState();
        console.log('Metin Giriş (TextInputComponent) bileşeni başlatıldı.');
    },

    /**
     * Gerekli DOM elementlerini seçer ve `elements` nesnesinde saklar.
     */
    cacheElements: function() {
        this.elements = {
            newsText: document.getElementById('newsText'),
            rules: document.getElementById('rules'),
            characterCount: document.querySelector('.character-count'),
            form: document.getElementById('newsForm')
        };
    },

    /**
     * Metin alanları için olay dinleyicilerini bağlar.
     */
    bindEvents: function() {
        if (this.elements.newsText) {
            this.elements.newsText.addEventListener('input', this.handleTextInput.bind(this));
            this.elements.newsText.addEventListener('paste', this.handlePaste.bind(this));
            this.elements.newsText.addEventListener('focus', this.handleFocus.bind(this));
            this.elements.newsText.addEventListener('blur', this.handleBlur.bind(this));
        }

        if (this.elements.rules) {
            this.elements.rules.addEventListener('input', (e) => this.autoResize(e.target));
        }
    },

    /**
     * Bileşenin başlangıç durumunu ayarlar (örn: karakter sayacı).
     */
    setupInitialState: function() {
        if (this.elements.newsText && !this.elements.characterCount) {
            const countDiv = document.createElement('div');
            countDiv.className = 'character-count';
            // Maksimum limiti bir yapılandırma dosyasından almak daha iyidir.
            const maxLength = 10000; 
            countDiv.textContent = `0/${maxLength}`;
            this.elements.newsText.parentElement.appendChild(countDiv);
            this.elements.characterCount = countDiv;
        }
    },

    // 2.0 - Metin Alanı Etkileşimleri

    /**
     * Ana metin alanına her veri girişinde tetiklenir.
     * @param {Event} e - Input olayı nesnesi.
     */
    handleTextInput: function(e) {
        const text = e.target.value;
        this.updateCharacterCount(text);
        this.validateText(text);
        this.autoResize(e.target);
        
        // Otomatik kaydetme işlemini gecikmeli olarak tetikle
        if (typeof MainContentComponent !== 'undefined') {
            this.debouncedAutoSave = this.debouncedAutoSave || Utils.debounce(() => {
                MainContentComponent.saveText();
            }, 1500);
            this.debouncedAutoSave();
        }
    },

    /**
     * Metin alanına yapıştırma işlemi yapıldığında tetiklenir.
     * @param {Event} e - Paste olayı nesnesi.
     */
    handlePaste: function(e) {
        // Yapıştırılan metnin DOM'a yansımasını bekleyip güncelleme yap
        setTimeout(() => {
            const text = e.target.value;
            this.updateCharacterCount(text);
            this.validateText(text);
            this.autoResize(e.target);
        }, 10);
    },

    /**
     * Metin alanı odaklandığında çalışır ve görsel stil uygular.
     * @param {Event} e - Focus olayı nesnesi.
     */
    handleFocus: function(e) {
        e.target.parentElement.classList.add('focused');
    },

    /**
     * Metin alanı odağını kaybettiğinde çalışır ve görsel stili kaldırır.
     * @param {Event} e - Blur olayı nesnesi.
     */
    handleBlur: function(e) {
        e.target.parentElement.classList.remove('focused');
    },

    /**
     * Metin alanının yüksekliğini içeriğine göre otomatik olarak ayarlar.
     * @param {HTMLElement} textarea - Boyutlandırılacak textarea elementi.
     */
    autoResize: function(textarea) {
        textarea.style.height = 'auto'; // Önce sıfırla
        textarea.style.height = (textarea.scrollHeight) + 'px';
    },

    // 3.0 - Doğrulama ve Geri Bildirim

    /**
     * Karakter sayacını günceller ve limitlere göre renklendirir.
     * @param {string} text - Mevcut metin.
     */
    updateCharacterCount: function(text) {
        if (!this.elements.characterCount) return;

        const length = text.length;
        const maxLength = 10000; // Bu değer global bir config'den gelmeli
        
        this.elements.characterCount.textContent = `${length}/${maxLength}`;
        
        this.elements.characterCount.classList.remove('warning', 'danger');
        if (length > maxLength) {
            this.elements.characterCount.classList.add('danger');
        } else if (length > maxLength * 0.9) {
            this.elements.characterCount.classList.add('warning');
        }
    },

    /**
     * Metnin geçerli olup olmadığını kontrol eder ve arayüze geri bildirim ekler.
     * @param {string} text - Doğrulanacak metin.
     */
    validateText: function(text) {
        if (!this.elements.newsText) return;

        // Doğrulama mantığı (örneğin Utils içinde olabilir)
        const minLength = 10;
        const maxLength = 10000;
        let validation = { valid: true, message: 'Metin geçerli.' };

        if (text.trim().length < minLength) {
            validation = { valid: false, message: `Metin en az ${minLength} karakter olmalıdır.` };
        } else if (text.length > maxLength) {
            validation = { valid: false, message: `Metin en fazla ${maxLength} karakter olabilir.` };
        }

        // Geri bildirim stillerini ve mesajını güncelle
        this.elements.newsText.classList.remove('is-valid', 'is-invalid');
        const feedbackElement = this.elements.newsText.parentElement.querySelector('.validation-feedback');
        if (feedbackElement) feedbackElement.remove();

        if (text.length > 0) {
            this.addFeedback(validation.message, validation.valid ? 'valid' : 'invalid');
            this.elements.newsText.classList.add(validation.valid ? 'is-valid' : 'is-invalid');
        }
    },

    /**
     * Metin alanının altına doğrulama geri bildirim mesajı ekler.
     * @param {string} message - Gösterilecek mesaj.
     * @param {string} type - Mesaj tipi ('valid' veya 'invalid').
     */
    addFeedback: function(message, type) {
        const feedbackDiv = document.createElement('div');
        feedbackDiv.className = `validation-feedback ${type}-feedback`;
        feedbackDiv.textContent = message;
        this.elements.newsText.parentElement.appendChild(feedbackDiv);
    },

    // 4.0 - Yardımcı Fonksiyonlar ve Veri Erişimi

    /**
     * Ana haber metni alanının içeriğini döndürür.
     * @returns {string} - Temizlenmiş metin.
     */
    getText: function() {
        return this.elements.newsText ? this.elements.newsText.value.trim() : '';
    },

    /**
     * Ana haber metni alanına metin atar ve arayüzü günceller.
     * @param {string} text - Atanacak metin.
     */
    setText: function(text) {
        if (this.elements.newsText) {
            this.elements.newsText.value = text;
            // Değişikliği yansıtmak için input olayını manuel tetikle
            this.handleTextInput({ target: this.elements.newsText });
        }
    },

    /**
     * Özel kurallar alanının içeriğini döndürür.
     * @returns {string} - Temizlenmiş kurallar metni.
     */
    getRules: function() {
        return this.elements.rules ? this.elements.rules.value.trim() : '';
    },

    /**
     * Tüm giriş alanlarını temizler ve stilleri sıfırlar.
     */
    clear: function() {
        if (this.elements.newsText) {
            this.setText('');
        }
        if (this.elements.rules) {
            this.elements.rules.value = '';
            this.autoResize(this.elements.rules);
        }
        console.log('Metin giriş alanları temizlendi.');
    },

    /**
     * Ana metin alanına odaklanır.
     */
    focus: function() {
        if (this.elements.newsText) {
            this.elements.newsText.focus();
        }
    }
};

// Bileşeni global `window` nesnesine ekle
window.TextInputComponent = TextInputComponent;
