/**
 * @file tooltips.js
 * @description Bu dosya, uygulama içindeki ayarlar ve kurallar için
 * ipucu (tooltip) ve detaylı prompt önizleme/düzenleme modalını yönetir.
 * Prompt metinlerini API'den çeker ve kullanıcıların bu metinleri
 * düzenlemesine olanak tanır.
 *
 * İçindekiler:
 * 1.0 - Bileşen Başlatma ve Olay Yönetimi
 * 2.0 - Prompt Metin Yönetimi (Yükleme/Kaydetme)
 * 3.0 - Prompt Önizleme Modalı (Gösterme/Gizleme)
 * 4.0 - Prompt Düzenleme ve Sıfırlama
 * 5.0 - Ayar Düzenleme Modalı (Gelecek Geliştirme)
 * 6.0 - Yardımcı Fonksiyonlar ve Veri Erişimi
 */

const TooltipComponent = {
    promptTexts: {}, // Prompt metinleri için cache nesnesi
    promptModal: null, // Prompt düzenleme modalı DOM elementi
    currentEditingKey: null, // Düzenlenmekte olan prompt'un anahtarı

    // 1.0 - Bileşen Başlatma ve Olay Yönetimi

    /**
     * Bileşeni başlatır, prompt metinlerini yükler ve olayları bağlar.
     */
    init: function() {
        this.loadPromptTexts();
        this.bindEvents();
        this.createPromptModal();
        console.log('İpucu ve Prompt (TooltipComponent) bileşeni başlatıldı.');
    },

    /**
     * Gerekli olay dinleyicilerini bağlar.
     */
    bindEvents: function() {
        // Tooltip'lere tıklanıldığında modalı açmak için olay delegasyonu kullan
        document.addEventListener('click', this.handleTooltipClick.bind(this), true);
    },

    /**
     * Tooltip ikonlarına tıklandığında ilgili prompt modalını açar.
     * @param {Event} e - Click olayı nesnesi.
     */
    handleTooltipClick: function(e) {
        const element = e.target.closest('[data-tooltip]');
        if (!element) return;

        e.preventDefault();
        e.stopPropagation(); // Diğer olayları engelle

        const tooltipKey = element.getAttribute('data-tooltip');
        if (tooltipKey && this.promptTexts[tooltipKey]) {
            this.showPromptModal(tooltipKey);
        } else {
            console.warn(`Tooltip anahtarı '${tooltipKey}' için prompt metni bulunamadı.`);
        }
    },

    // 2.0 - Prompt Metin Yönetimi (Yükleme/Kaydetme)

    /**
     * Prompt metinlerini önce API'den, başarısız olursa varsayılanlardan yükler.
     */
    loadPromptTexts: async function() {
        try {
            const response = await fetch('/api/prompt/config');
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.data.sections) {
                    this.promptTexts = {};
                    for (const [key, section] of Object.entries(data.data.sections)) {
                        this.promptTexts[key] = section.prompt_text;
                    }
                    console.log('Prompt metinleri API üzerinden başarıyla yüklendi.');
                    return;
                }
            }
            throw new Error('API yanıtı hatalı veya boş.');
        } catch (error) {
            console.error('Prompt metinleri API üzerinden yüklenemedi, varsayılanlar kullanılıyor:', error);
            this.loadDefaultPromptTexts();
        }
    },

    /**
     * API'ye ulaşılamadığında kullanılacak varsayılan prompt metinlerini yükler.
     */
    loadDefaultPromptTexts: function() {
        this.promptTexts = {
            gorev_tanimi: "Sen, profesyonel bir AI editörsün. Görevin, verilen metni kurallara göre işleyerek özgün bir haber içeriği oluşturmaktır.",
            kurumsal_dil: "Kullanılacak dil resmi, profesyonel ve bilgilendirici olmalıdır.",
            etkili_baslik: "Haberi net yansıtan, dikkat çekici ve yanıltıcı olmayan bir başlık oluştur.",
            // Diğer varsayılan promptlar...
        };
    },

    /**
     * Değiştirilen bir prompt metnini API'ye göndererek kaydeder.
     */
    savePromptText: async function() {
        if (!this.currentEditingKey) return;

        const newText = this.promptModal.querySelector('#prompt-text-editor').value.trim();
        if (!newText) {
            Utils.showNotification('Prompt metni boş olamaz.', 'warning');
            return;
        }

        try {
            const response = await fetch(`/api/prompt/sections/${this.currentEditingKey}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt_text: newText })
            });

            if (!response.ok) throw new Error('Ağ yanıtı başarısız.');
            
            const data = await response.json();
            if (data.success) {
                this.promptTexts[this.currentEditingKey] = newText;
                Utils.showNotification('Prompt metni başarıyla güncellendi.', 'success');
                this.hidePromptModal();
            } else {
                throw new Error(data.error || 'Kaydetme başarısız oldu.');
            }
        } catch (error) {
            console.error('Prompt metni kaydedilirken hata:', error);
            Utils.showNotification(`Kaydetme hatası: ${error.message}`, 'danger');
        }
    },

    // 3.0 - Prompt Önizleme Modalı (Gösterme/Gizleme)

    /**
     * Prompt düzenleme modalının HTML yapısını oluşturur ve body'e ekler.
     */
    createPromptModal: function() {
        if (document.querySelector('.prompt-preview-modal')) return;

        const modal = document.createElement('div');
        modal.className = 'prompt-preview-modal';
        modal.innerHTML = `
            <div class="prompt-preview-content">
                <div class="prompt-preview-header">
                    <h3 class="prompt-preview-title">Prompt Bölümü Önizleme</h3>
                    <button class="prompt-preview-close">&times;</button>
                </div>
                <div class="prompt-preview-body">
                    <h6 id="prompt-section-title">Bölüm Başlığı</h6>
                    <textarea class="prompt-preview-editable" id="prompt-text-editor" rows="10"></textarea>
                </div>
                <div class="prompt-preview-actions">
                    <button class="prompt-preview-btn secondary" id="prompt-reset-btn">Varsayılana Dön</button>
                    <button class="prompt-preview-btn primary" id="prompt-save-btn">Kaydet ve Kapat</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        this.promptModal = modal;

        // Modal içi olayları bağla
        modal.querySelector('.prompt-preview-close').addEventListener('click', this.hidePromptModal.bind(this));
        modal.querySelector('#prompt-save-btn').addEventListener('click', this.savePromptText.bind(this));
        modal.querySelector('#prompt-reset-btn').addEventListener('click', this.resetPromptText.bind(this));
        modal.addEventListener('click', (e) => {
            if (e.target === modal) this.hidePromptModal();
        });
    },

    /**
     * Prompt düzenleme modalını gösterir ve ilgili verilerle doldurur.
     * @param {string} tooltipKey - Gösterilecek prompt'un anahtarı.
     */
    showPromptModal: function(tooltipKey) {
        if (!this.promptModal) return;

        this.currentEditingKey = tooltipKey;
        const title = this.getPromptTitle(tooltipKey);
        const text = this.promptTexts[tooltipKey] || 'Bu bölüm için metin bulunamadı.';
        
        this.promptModal.querySelector('#prompt-section-title').textContent = title;
        this.promptModal.querySelector('#prompt-text-editor').value = text;
        this.promptModal.style.display = 'flex';

        setTimeout(() => this.promptModal.querySelector('#prompt-text-editor').focus(), 50);
    },

    /**
     * Prompt düzenleme modalını gizler.
     */
    hidePromptModal: function() {
        if (this.promptModal) {
            this.promptModal.style.display = 'none';
            this.currentEditingKey = null;
        }
    },

    // 4.0 - Prompt Düzenleme ve Sıfırlama

    /**
     * Düzenlenen prompt metnini varsayılan haline geri yükler.
     */
    resetPromptText: async function() {
        if (!this.currentEditingKey) return;

        if (confirm('Bu bölümün prompt metnini varsayılan haline getirmek istediğinizden emin misiniz?')) {
            // Varsayılanları yeniden yükle ve sadece ilgili alanı güncelle
            await this.loadPromptTexts(); 
            const originalText = this.promptTexts[this.currentEditingKey];
            this.promptModal.querySelector('#prompt-text-editor').value = originalText;
            Utils.showNotification('Prompt metni varsayılan haline sıfırlandı.', 'info');
        }
    },

    // 5.0 - Ayar Düzenleme Modalı (Gelecek Geliştirme)
    // Bu bölüm, gelecekte ayarların doğrudan tooltip üzerinden
    // düzenlenmesi için bir yapı sunar. Mevcut kodda aktif kullanılmıyor.

    // 6.0 - Yardımcı Fonksiyonlar ve Veri Erişimi

    /**
     * Prompt anahtarına göre modal için bir başlık döndürür.
     * @param {string} key - Prompt anahtarı.
     * @returns {string} - İnsan tarafından okunabilir başlık.
     */
    getPromptTitle: function(key) {
        const titles = {
            gorev_tanimi: 'AI Görev Tanımı',
            ozgunluk: 'Özgünlük Kuralı',
            kurumsal_dil: 'Yazım Stili Kuralı',
            ciktinin_formati: 'Çıktı Formatı Kuralı',
            etkili_baslik: 'Başlık Oluşturma Kuralı',
            haber_ozeti: 'Özet Oluşturma Kuralı',
            ozgun_haber_metni: 'Haber Metni Yazma Kuralı',
            muhtemel_kategori: 'Kategori Belirleme Kuralı',
            etiketler: 'Etiket Oluşturma Kuralı'
        };
        return titles[key] || 'Bilinmeyen Kural';
    },

    /**
     * Mevcut prompt yapılandırmasını dışa aktarmak için bir nesne döndürür.
     * @returns {Object} - Mevcut prompt yapılandırması.
     */
    getCurrentPromptConfig: function() {
        return {
            texts: this.promptTexts,
            timestamp: new Date().toISOString()
        };
    }
};

// DOM yüklendiğinde bileşeni başlat
document.addEventListener('DOMContentLoaded', function() {
    TooltipComponent.init();
});

// Bileşeni global `window` nesnesine ekle
window.TooltipComponent = TooltipComponent;
