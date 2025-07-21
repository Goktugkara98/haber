/**
 * @file results.js
 * @description Bu dosya, AI tarafından işlenmiş haber metninin sonuçlarını
 * gösteren bileşeni yönetir. Sonuçların formatlanması, kopyalanması,
 * indirilmesi ve paylaşılması gibi işlevleri içerir.
 *
 * İçindekiler:
 * 1.0 - Bileşen Başlatma ve Olay Yönetimi
 * 2.0 - Sonuç Gösterimi ve Yönetimi
 * 3.0 - Sonuç Formatlama ve Animasyon
 * 4.0 - Eylem Butonları (Kopyala, İndir, Paylaş)
 * 5.0 - Yardımcı Fonksiyonlar
 */

const ResultsComponent = {
    elements: {}, // DOM elementleri için cache nesnesi
    currentResult: null, // Gösterilen mevcut sonuç verisi

    // 1.0 - Bileşen Başlatma ve Olay Yönetimi

    /**
     * Bileşeni başlatır, DOM elementlerini cache'ler ve olayları bağlar.
     */
    init: function() {
        this.cacheElements();
        this.bindEvents();
        console.log('Sonuç (ResultsComponent) bileşeni başlatıldı.');
    },

    /**
     * Gerekli DOM elementlerini seçer ve `elements` nesnesinde saklar.
     */
    cacheElements: function() {
        this.elements = {
            section: document.getElementById('resultSection'),
            content: document.getElementById('processedText'),
            copyBtn: document.querySelector('.btn-copy'),
            downloadBtn: document.querySelector('.btn-download'),
            shareBtn: document.querySelector('.btn-share'),
            stats: document.querySelector('.results-stats')
        };
    },

    /**
     * Eylem butonları için olay dinleyicilerini bağlar.
     */
    bindEvents: function() {
        if (this.elements.copyBtn) {
            this.elements.copyBtn.addEventListener('click', this.copyResult.bind(this));
        }
        if (this.elements.downloadBtn) {
            this.elements.downloadBtn.addEventListener('click', this.downloadResult.bind(this));
        }
        if (this.elements.shareBtn) {
            this.elements.shareBtn.addEventListener('click', this.shareResult.bind(this));
        }
    },

    // 2.0 - Sonuç Gösterimi ve Yönetimi

    /**
     * Sonuçlar bölümünü gösterir, içeriği render eder ve istatistikleri günceller.
     * @param {Object} result - Gösterilecek sonuç verisi.
     */
    show: function(result) {
        if (!this.elements.section || !result) return;

        this.currentResult = result;
        this.renderResult(result);
        this.updateStats(result);
        
        this.elements.section.style.display = 'block';
        this.elements.section.classList.add('show');

        // GSAP ile animasyonlu giriş
        if (typeof gsap !== 'undefined') {
            gsap.fromTo(this.elements.section, 
                { opacity: 0, y: 30 },
                { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }
            );
        }

        // Sonuçlar alanına yumuşak kaydırma
        setTimeout(() => {
            this.elements.section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 200);
        console.log('Sonuçlar gösteriliyor.', result);
    },

    /**
     * Sonuçlar bölümünü gizler.
     */
    hide: function() {
        if (!this.elements.section) return;

        this.elements.section.classList.remove('show');
        
        // GSAP ile animasyonlu çıkış
        if (typeof gsap !== 'undefined') {
            gsap.to(this.elements.section, {
                opacity: 0,
                y: -20,
                duration: 0.4,
                ease: 'power2.in',
                onComplete: () => { this.elements.section.style.display = 'none'; }
            });
        } else {
            this.elements.section.style.display = 'none';
        }
        console.log('Sonuçlar gizlendi.');
    },

    /**
     * Sonuçlar bölümünü temizler ve gizler.
     */
    clear: function() {
        this.currentResult = null;
        this.hide();
    },

    // 3.0 - Sonuç Formatlama ve Animasyon

    /**
     * Sonuç verisini HTML olarak formatlayıp ekrana basar.
     * @param {Object} result - İşlenmiş sonuç verisi.
     */
    renderResult: function(result) {
        if (!this.elements.content) return;

        const originalText = result.original_text || result.input?.newsText || 'Orijinal metin bulunamadı.';
        const processedText = result.processed_text || result.output || 'İşlenmiş metin bulunamadı.';

        this.elements.content.innerHTML = `
            <div class="result-original mb-4">
                <h6 class="text-primary"><i class="fas fa-file-alt me-2"></i>Orijinal Metin</h6>
                <p class="text-muted small">${this.truncateText(originalText, 250)}</p>
            </div>
            <hr>
            <div class="result-processed">
                <h6 class="text-success"><i class="fas fa-magic me-2"></i>AI Tarafından Üretilen Metin</h6>
                <div class="processed-content">${this.formatProcessedText(processedText)}</div>
            </div>
        `;

        this.animateTyping();
    },

    /**
     * İşlenmiş metni paragraflara ayırarak formatlar.
     * @param {string} text - Formatlanacak metin.
     * @returns {string} - HTML <p> tag'leri ile formatlanmış metin.
     */
    formatProcessedText: function(text) {
        if (typeof text !== 'string') return '<p>Geçersiz metin formatı.</p>';
        return text.split('\n').filter(p => p.trim()).map(p => `<p>${p.trim()}</p>`).join('');
    },

    /**
     * İşlenmiş metnin ekrana yazılıyormuş gibi görünmesini sağlayan animasyonu çalıştırır.
     */
    animateTyping: function() {
        const processedContent = this.elements.content.querySelector('.processed-content');
        if (!processedContent || typeof gsap === 'undefined') return;

        const paragraphs = Array.from(processedContent.querySelectorAll('p'));
        gsap.from(paragraphs, {
            duration: 0.5,
            y: 20,
            opacity: 0,
            stagger: 0.15,
            ease: 'power2.out'
        });
    },

    /**
     * İşlem istatistiklerini (karakter sayısı, süre vb.) günceller ve gösterir.
     * @param {Object} result - İstatistikleri içeren sonuç verisi.
     */
    updateStats: function(result) {
        if (!this.elements.stats) return;

        const statsData = {
            originalLength: result.original_text?.length || 0,
            processedLength: result.processed_text?.length || 0,
            processingTime: result.processing_time || 'N/A',
            similarity: result.similarity || 'N/A'
        };

        this.elements.stats.innerHTML = `
            <h6><i class="fas fa-chart-pie me-2"></i>İşlem İstatistikleri</h6>
            <div class="stats-grid">
                <div class="stat-item" title="Orijinal metnin karakter sayısı"><span class="stat-value">${statsData.originalLength}</span><div class="stat-label">Orijinal K.</div></div>
                <div class="stat-item" title="İşlenmiş metnin karakter sayısı"><span class="stat-value">${statsData.processedLength}</span><div class="stat-label">İşlenmiş K.</div></div>
                <div class="stat-item" title="İşlemin tamamlanma süresi"><span class="stat-value">${statsData.processingTime}s</span><div class="stat-label">Süre</div></div>
                <div class="stat-item" title="Metinler arası benzerlik oranı"><span class="stat-value">${statsData.similarity}%</span><div class="stat-label">Benzerlik</div></div>
            </div>
        `;

        // İstatistikleri animasyonla göster
        if (typeof gsap !== 'undefined') {
            gsap.from('.stat-item', {
                duration: 0.5,
                y: 15,
                opacity: 0,
                stagger: 0.1,
                ease: 'power2.out',
                delay: 0.3
            });
        }
    },

    // 4.0 - Eylem Butonları (Kopyala, İndir, Paylaş)

    /**
     * Sonuç metnini panoya kopyalar.
     */
    copyResult: function() {
        if (!this.currentResult) return;
        const textToCopy = this.getFullResultText();
        Utils.copyToClipboard(textToCopy);
        this.animateButton(this.elements.copyBtn, 'success', 'Kopyalandı!');
    },

    /**
     * Sonuç metnini bir .txt dosyası olarak indirir.
     */
    downloadResult: function() {
        if (!this.currentResult) return;
        const textToDownload = this.getFullResultText();
        const filename = `islenmis_haber_${new Date().toISOString().split('T')[0]}.txt`;
        Utils.downloadText(textToDownload, filename);
        this.animateButton(this.elements.downloadBtn, 'success', 'İndirildi!');
    },

    /**
     * Sonuç metnini paylaşmak için tarayıcının paylaşım özelliğini kullanır.
     */
    shareResult: function() {
        if (!this.currentResult) return;
        const textToShare = this.getFullResultText();
        
        if (navigator.share) {
            navigator.share({
                title: 'İşlenmiş Haber Metni',
                text: textToShare
            }).then(() => {
                Utils.showNotification('Paylaşım başarılı!', 'success');
            }).catch((error) => {
                console.log('Paylaşım hatası:', error);
                this.fallbackShare(textToShare); // Paylaşım başarısız olursa panoya kopyala
            });
        } else {
            this.fallbackShare(textToShare);
        }
        this.animateButton(this.elements.shareBtn, 'info', 'Paylaşılıyor...');
    },

    // 5.0 - Yardımcı Fonksiyonlar

    /**
     * Kopyalama, indirme ve paylaşma için tam metin formatını oluşturur.
     * @returns {string} - Başlık ve açıklamalarla formatlanmış tam metin.
     */
    getFullResultText: function() {
        if (!this.currentResult) return '';
        return `İŞLENMİŞ HABER SONUCU (${new Date().toLocaleString('tr-TR')})\n=================================\n\nİŞLENMİŞ METİN:\n${this.currentResult.processed_text || ''}\n\n=================================\nORİJİNAL METİN:\n${this.currentResult.original_text || ''}`;
    },

    /**
     * Bir metni belirli bir uzunlukta keser ve sonuna "..." ekler.
     * @param {string} text - Kesilecek metin.
     * @param {number} maxLength - Maksimum uzunluk.
     * @returns {string} - Kısaltılmış metin.
     */
    truncateText: (text, maxLength) => (text.length > maxLength) ? text.substring(0, maxLength) + '...' : text,

    /**
     * Paylaşım özelliği desteklenmiyorsa panoya kopyalama işlemini yapar.
     * @param {string} text - Panoya kopyalanacak metin.
     */
    fallbackShare: function(text) {
        Utils.copyToClipboard(text);
        Utils.showNotification('Metin panoya kopyalandı, şimdi paylaşabilirsiniz!', 'info');
    },

    /**
     * Tıklanan butona geçici bir geri bildirim animasyonu ve metni uygular.
     * @param {HTMLElement} button - Animasyon uygulanacak buton.
     * @param {string} type - Geri bildirim tipi ('success', 'info').
     * @param {string} message - Butonda gösterilecek geçici mesaj.
     */
    animateButton: function(button, type, message) {
        if (!button || typeof gsap === 'undefined') return;

        const originalText = button.innerHTML;
        const icon = type === 'success' ? 'fas fa-check' : 'fas fa-share-alt';
        
        button.innerHTML = `<i class="${icon} me-2"></i>${message}`;
        button.disabled = true;

        gsap.fromTo(button, { scale: 1 }, { 
            scale: 1.05, duration: 0.1, yoyo: true, repeat: 1,
            onComplete: () => {
                setTimeout(() => {
                    button.innerHTML = originalText;
                    button.disabled = false;
                }, 1500);
            }
        });
    }
};

// Bileşeni global `window` nesnesine ekle
window.ResultsComponent = ResultsComponent;
