// Tooltip and Prompt Preview Component JavaScript

const TooltipComponent = {
    tooltips: {},
    promptTexts: {},
    activeTooltip: null,
    
    // Initialize the component
    init: function() {
        this.loadPromptTexts();
        this.bindEvents();
        this.createPromptModal();
        console.log('Tooltip Component initialized');
    },

    // Load prompt texts from your configuration
    loadPromptTexts: function() {
        this.promptTexts = {
            gorev_tanimi: "Sen, kurumsal bir gazetenin web sitesi için içerik üreten profesyonel bir yapay zeka editörüsün. Görevin, sana verilen orijinal haber metnini ve kuralları kullanarak, belirtilen JSON formatında profesyonel ve özgün bir haber içeriği oluşturmaktır.",
            
            ozgunluk: "Metin tamamen yeniden yazılmalı, kopya olmamalıdır. Ancak orijinal haberdeki tüm temel bilgiler, veriler, isimler ve tarihler korunmalıdır.",
            
            kurumsal_dil: "Kullanılacak dil resmi, profesyonel ve bilgilendirici olmalıdır. Argo veya clickbait ifadelerden kaçınılmalıdır.",
            
            ciktinin_formati: "Çıktı, yalnızca ve yalnızca 'cikti_formati_json' içinde belirtilen yapıya uygun, geçerli bir JSON nesnesi olmalıdır. Cevabına asla açıklama veya ek metin ekleme, sadece JSON çıktısı ver.",
            
            etkili_baslik: "Haberi net yansıtan, profesyonel, dikkat çekici, yanıltıcı olmayan, şehir bilgisi içermeyen bir başlık.",
            
            haber_ozeti: "Haberin en önemli noktalarını içeren, 2-3 cümlelik, şehir bilgisi içeren kısa bir özet.",
            
            ozgun_haber_metni: "Tüm bilgileri koruyarak, metni özgün cümlelerle baştan yaz. İsimleri sansürle (örn: A.B.), özel şirket ve plaka bilgisi verme.",
            
            muhtemel_kategori: "Verilen kategori listesinden en uygun olanı seç: Asayiş, Gündem, Ekonomi, Siyaset, Spor, Teknoloji, Sağlık, Yaşam, Eğitim, Dünya, Kültür & Sanat, Magazin, Genel",
            
            etiketler: "Haberle ilgili, SEO uyumlu 5 adet etiket oluştur ve bunları bir dizi (array) olarak listele."
        };
    },

    // Bind events
    bindEvents: function() {
        // Add event listeners for click-only functionality
        document.addEventListener('click', this.handleTooltipClick.bind(this), true);
    },



    // Handle tooltip click for detailed view
    handleTooltipClick: function(e) {
        const element = e.target.closest('[data-tooltip]');
        if (!element) return;

        e.preventDefault();
        const tooltipKey = element.getAttribute('data-tooltip');
        if (!tooltipKey || !this.promptTexts[tooltipKey]) return;

        this.showPromptModal(tooltipKey);
    },

    // Create prompt modal
    createPromptModal: function() {
        const modal = document.createElement('div');
        modal.className = 'prompt-preview-modal';
        modal.innerHTML = `
            <div class="prompt-preview-content">
                <div class="prompt-preview-header">
                    <h3 class="prompt-preview-title">Prompt Önizleme</h3>
                    <button class="prompt-preview-close">&times;</button>
                </div>
                <div class="prompt-preview-body">
                    <div class="prompt-preview-section">
                        <h6 id="prompt-section-title">Bölüm</h6>
                        <textarea class="prompt-preview-editable" id="prompt-text-editor"></textarea>
                    </div>
                </div>
                <div class="prompt-preview-actions">
                    <button class="prompt-preview-btn prompt-preview-btn-secondary" id="prompt-reset-btn">Sıfırla</button>
                    <button class="prompt-preview-btn prompt-preview-btn-primary" id="prompt-save-btn">Kaydet</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        this.promptModal = modal;

        // Bind modal events
        modal.querySelector('.prompt-preview-close').addEventListener('click', this.hidePromptModal.bind(this));
        modal.querySelector('#prompt-save-btn').addEventListener('click', this.savePromptText.bind(this));
        modal.querySelector('#prompt-reset-btn').addEventListener('click', this.resetPromptText.bind(this));
        
        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.hidePromptModal();
            }
        });
    },

    // Show prompt modal
    showPromptModal: function(tooltipKey) {
        if (!this.promptModal) return;

        this.currentEditingKey = tooltipKey;
        const title = this.getPromptTitle(tooltipKey);
        const text = this.promptTexts[tooltipKey];

        this.promptModal.querySelector('#prompt-section-title').textContent = title;
        this.promptModal.querySelector('#prompt-text-editor').value = text;
        this.promptModal.style.display = 'flex';

        // Focus on textarea
        setTimeout(() => {
            this.promptModal.querySelector('#prompt-text-editor').focus();
        }, 100);
    },

    // Hide prompt modal
    hidePromptModal: function() {
        if (this.promptModal) {
            this.promptModal.style.display = 'none';
            this.currentEditingKey = null;
        }
    },

    // Save prompt text
    savePromptText: function() {
        if (!this.currentEditingKey) return;

        const newText = this.promptModal.querySelector('#prompt-text-editor').value.trim();
        if (newText) {
            this.promptTexts[this.currentEditingKey] = newText;
            this.saveToStorage();
            
            if (typeof Utils !== 'undefined') {
                Utils.showNotification('Prompt metni güncellendi', 'success', 2000);
            }
        }

        this.hidePromptModal();
    },

    // Reset prompt text
    resetPromptText: function() {
        if (!this.currentEditingKey) return;

        // Reset to original text
        this.loadPromptTexts();
        const originalText = this.promptTexts[this.currentEditingKey];
        this.promptModal.querySelector('#prompt-text-editor').value = originalText;
        
        if (typeof Utils !== 'undefined') {
            Utils.showNotification('Prompt metni sıfırlandı', 'info', 2000);
        }
    },

    // Get prompt title for display
    getPromptTitle: function(key) {
        const titles = {
            gorev_tanimi: 'Görev Tanımı',
            ozgunluk: 'Özgünlük Kuralı',
            kurumsal_dil: 'Kurumsal Dil Kuralı',
            ciktinin_formati: 'Çıktı Formatı Kuralı',
            etkili_baslik: 'Etkili Başlık Açıklaması',
            haber_ozeti: 'Haber Özeti Açıklaması',
            ozgun_haber_metni: 'Özgün Haber Metni Açıklaması',
            muhtemel_kategori: 'Kategori Seçimi Açıklaması',
            etiketler: 'Etiket Oluşturma Açıklaması'
        };
        return titles[key] || 'Prompt Bölümü';
    },

    // Save to localStorage
    saveToStorage: function() {
        if (typeof Utils !== 'undefined') {
            Utils.storage.set('customPromptTexts', this.promptTexts);
        }
    },

    // Load from localStorage
    loadFromStorage: function() {
        if (typeof Utils !== 'undefined') {
            const saved = Utils.storage.get('customPromptTexts');
            if (saved) {
                this.promptTexts = { ...this.promptTexts, ...saved };
            }
        }
    },

    // Get current prompt configuration
    getCurrentPromptConfig: function() {
        return {
            texts: this.promptTexts,
            timestamp: new Date().toISOString()
        };
    },

    // Export prompt configuration
    exportPromptConfig: function() {
        const config = this.getCurrentPromptConfig();
        const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = 'prompt-config.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },

    // Import prompt configuration
    importPromptConfig: function(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const config = JSON.parse(e.target.result);
                if (config.texts) {
                    this.promptTexts = { ...this.promptTexts, ...config.texts };
                    this.saveToStorage();
                    
                    if (typeof Utils !== 'undefined') {
                        Utils.showNotification('Prompt konfigürasyonu yüklendi', 'success');
                    }
                }
            } catch (error) {
                console.error('Import error:', error);
                if (typeof Utils !== 'undefined') {
                    Utils.showNotification('Dosya formatı geçersiz', 'danger');
                }
            }
        };
        reader.readAsText(file);
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    TooltipComponent.init();
    TooltipComponent.loadFromStorage();
});

// Export for global access
window.TooltipComponent = TooltipComponent;
