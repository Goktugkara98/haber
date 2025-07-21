/**
 * @file loading.js
 * @description Bu dosya, uygulama genelinde kullanılan ve özelleştirilebilen 
 * yükleme ekranı (loading screen) bileşenini yönetir. Adım adım ilerleme, 
 * animasyonlar ve farklı yükleme senaryoları için kontroller içerir.
 *
 * İçindekiler:
 * 1.0 - Bileşen Yapılandırması ve Durum Yönetimi
 * 2.0 - Başlatma ve DOM Elementleri
 * 3.0 - Yükleme Ekranı Kontrolü (Gösterme/Gizleme)
 * 4.0 - Adım ve İlerleme Yönetimi
 * 5.0 - Özelleştirme ve Yardımcı Fonksiyonlar
 */

// 1.0 - Bileşen Yapılandırması ve Durum Yönetimi
const LoadingComponent = {
    elements: {}, // DOM elementleri için cache nesnesi
    currentStep: 0, // Aktif olan adımın indeksi
    steps: [ // Yükleme ekranında gösterilecek varsayılan adımlar
        { text: 'Metin analiz ediliyor...', icon: 'fas fa-search' },
        { text: 'AI modeli hazırlanıyor...', icon: 'fas fa-brain' },
        { text: 'İçerik üretiliyor...', icon: 'fas fa-magic' },
        { text: 'Sonuç hazırlanıyor...', icon: 'fas fa-check-circle' }
    ],
    stepTimer: null, // Adımlar arasındaki geçişi yöneten zamanlayıcı

    // 2.0 - Başlatma ve DOM Elementleri

    /**
     * Bileşeni başlatır.
     */
    init: function() {
        this.cacheElements();
        this.createLoadingSteps();
        console.log('Yükleme Ekranı (LoadingComponent) bileşeni başlatıldı.');
    },

    /**
     * Gerekli DOM elementlerini seçer ve `elements` nesnesinde saklar.
     */
    cacheElements: function() {
        this.elements = {
            section: document.getElementById('loadingSection'),
            spinner: document.querySelector('.loading-spinner'),
            text: document.querySelector('.loading-text'),
            progress: document.querySelector('.progress-bar'),
            steps: document.querySelector('.loading-steps')
        };
    },

    /**
     * `steps` dizisindeki adımları HTML olarak oluşturur ve ekrana yerleştirir.
     */
    createLoadingSteps: function() {
        if (!this.elements.steps) return;

        const stepsHTML = this.steps.map((step, index) => `
            <div class="loading-step" data-step="${index}">
                <i class="${step.icon}"></i>
                <span>${step.text}</span>
            </div>
        `).join('');

        this.elements.steps.innerHTML = stepsHTML;
    },

    // 3.0 - Yükleme Ekranı Kontrolü (Gösterme/Gizleme)

    /**
     * Yükleme ekranını gösterir ve animasyonları başlatır.
     * @param {string|null} customText - Gösterilecek özel bir metin (opsiyonel).
     */
    show: function(customText = null) {
        if (!this.elements.section) return;

        // Bileşenin durumunu sıfırla
        this.currentStep = 0;
        this.updateProgress(0);
        this.resetSteps();

        if (customText && this.elements.text) {
            this.elements.text.textContent = customText;
        }

        this.elements.section.style.display = 'block';
        this.elements.section.classList.add('show');

        // GSAP ile animasyonları uygula
        if (typeof gsap !== 'undefined') {
            gsap.fromTo(this.elements.section, 
                { opacity: 0, y: 20 },
                { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }
            );

            if (this.elements.spinner) {
                gsap.set(this.elements.spinner, { rotation: 0 });
                gsap.to(this.elements.spinner, {
                    rotation: 360,
                    duration: 1,
                    repeat: -1,
                    ease: 'none'
                });
            }
        }

        // Adım ilerlemesini başlat
        this.startStepProgression();
    },

    /**
     * Yükleme ekranını gizler ve animasyonları durdurur.
     */
    hide: function() {
        if (!this.elements.section) return;

        this.elements.section.classList.remove('show');

        // GSAP ile animasyonları durdur ve gizle
        if (typeof gsap !== 'undefined') {
            gsap.killTweensOf(this.elements.spinner);
            
            gsap.to(this.elements.section, {
                opacity: 0,
                y: -20,
                duration: 0.3,
                ease: 'power2.in',
                onComplete: () => {
                    this.elements.section.style.display = 'none';
                }
            });
        } else {
            // GSAP yoksa standart gizleme
            setTimeout(() => {
                this.elements.section.style.display = 'none';
            }, 300);
        }

        // Zamanlayıcıyı temizle
        if (this.stepTimer) {
            clearInterval(this.stepTimer);
            this.stepTimer = null;
        }
    },

    // 4.0 - Adım ve İlerleme Yönetimi

    /**
     * Adımların belirli aralıklarla ilerlemesini sağlar.
     */
    startStepProgression: function() {
        if (this.steps.length === 0) return;
        if (this.stepTimer) clearInterval(this.stepTimer);

        this.activateStep(0); // İlk adımı hemen aktif et

        this.stepTimer = setInterval(() => {
            this.currentStep++;
            
            if (this.currentStep < this.steps.length) {
                this.activateStep(this.currentStep);
                this.updateProgress((this.currentStep / this.steps.length) * 100);
            } else {
                this.completeAllSteps();
                clearInterval(this.stepTimer);
                this.stepTimer = null;
            }
        }, 1500); // Adım geçiş süresi: 1.5 saniye
    },

    /**
     * Belirtilen indeksteki adımı aktif hale getirir.
     * @param {number} stepIndex - Aktif edilecek adımın indeksi.
     */
    activateStep: function(stepIndex) {
        const stepElements = this.elements.section.querySelectorAll('.loading-step');
        
        stepElements.forEach((step, index) => {
            step.classList.remove('active', 'completed');
            if (index < stepIndex) {
                step.classList.add('completed');
            } else if (index === stepIndex) {
                step.classList.add('active');
            }
        });

        if (this.elements.text && this.steps[stepIndex]) {
            this.elements.text.textContent = this.steps[stepIndex].text;
        }

        // GSAP ile aktif adıma animasyon ekle
        if (typeof gsap !== 'undefined') {
            const activeStep = stepElements[stepIndex];
            if (activeStep) {
                gsap.fromTo(activeStep, 
                    { x: -10, opacity: 0.5 },
                    { x: 0, opacity: 1, duration: 0.3, ease: 'power2.out' }
                );
            }
        }
    },

    /**
     * Tüm adımları tamamlandı olarak işaretler ve ilerleme çubuğunu doldurur.
     */
    completeAllSteps: function() {
        const stepElements = this.elements.section.querySelectorAll('.loading-step');
        stepElements.forEach(step => {
            step.classList.remove('active');
            step.classList.add('completed');
        });

        this.updateProgress(100);
        
        if (this.elements.text) {
            this.elements.text.textContent = 'İşlem tamamlandı!';
        }
    },

    /**
     * Tüm adımların durumunu (aktif/tamamlandı) sıfırlar.
     */
    resetSteps: function() {
        const stepElements = this.elements.section.querySelectorAll('.loading-step');
        stepElements.forEach(step => {
            step.classList.remove('active', 'completed');
        });
    },

    /**
     * İlerleme çubuğunun (progress bar) doluluk oranını günceller.
     * @param {number} percentage - İlerleme yüzdesi (0-100).
     */
    updateProgress: function(percentage) {
        if (!this.elements.progress) return;

        // GSAP ile animasyonlu güncelleme
        if (typeof gsap !== 'undefined') {
            gsap.to(this.elements.progress, {
                width: percentage + '%',
                duration: 0.5,
                ease: 'power2.out'
            });
        } else {
            this.elements.progress.style.width = percentage + '%';
        }
    },

    // 5.0 - Özelleştirme ve Yardımcı Fonksiyonlar

    /**
     * Yükleme ekranındaki ana metni değiştirir.
     * @param {string} message - Gösterilecek yeni metin.
     */
    setMessage: function(message) {
        if (this.elements.text) {
            this.elements.text.textContent = message;
        }
    },

    /**
     * Varsayılan adımları yeni bir adımlar dizisi ile değiştirir.
     * @param {Array<Object>} customSteps - Yeni adımlar dizisi.
     */
    setSteps: function(customSteps) {
        this.steps = customSteps;
        this.createLoadingSteps(); // HTML'i yeniden oluştur
    },

    /**
     * Yükleme ekranını özel bir yapılandırma ile gösterir.
     * @param {Object} config - Yapılandırma nesnesi.
     * @param {string} config.message - Yükleme metni.
     * @param {Array} [config.steps=null] - Özel adımlar.
     * @param {boolean} [config.showProgress=true] - İlerleme çubuğu gösterilsin mi?
     */
    showCustom: function(config) {
        const {
            message = 'Yükleniyor...',
            steps = null,
            showProgress = true
        } = config;

        if (steps) {
            this.setSteps(steps);
        }

        if (!showProgress && this.elements.progress) {
            this.elements.progress.style.display = 'none';
        }

        this.show(message);
    },

    /**
     * Yükleme ekranının görünür olup olmadığını kontrol eder.
     * @returns {boolean} - Görünür ise true, değilse false.
     */
    isVisible: function() {
        return this.elements.section && 
               this.elements.section.style.display !== 'none' &&
               this.elements.section.classList.contains('show');
    },

    /**
     * Mevcut aktif adımın indeksini döndürür.
     * @returns {number} - Aktif adım indeksi.
     */
    getCurrentStep: function() {
        return this.currentStep;
    },

    /**
     * Belirtilen bir adıma atlar.
     * @param {number} stepIndex - Atlanacak adımın indeksi.
     */
    skipToStep: function(stepIndex) {
        if (stepIndex >= 0 && stepIndex < this.steps.length) {
            this.currentStep = stepIndex;
            this.activateStep(stepIndex);
            this.updateProgress((stepIndex / this.steps.length) * 100);
        }
    }
};

// Bileşeni global `window` nesnesine ekleyerek erişilebilir yapma
window.LoadingComponent = LoadingComponent;
