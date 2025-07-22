/**
 * @file preview-modal.js
 * @description Bu dosya, haber metni işlenmeden önce kullanıcıya gönderilecek
 * olan AI prompt'unu gösteren bir önizleme modalı bileşenini yönetir.
 * Kullanıcı bu modal üzerinden işlemi onaylar veya iptal eder.
 *
 * İçindekiler:
 * 1.0 - Bileşen Başlatma ve Olay Yönetimi
 * 2.0 - Modal Kontrolü (Gösterme/Gizleme)
 * 3.0 - Veri ve Ayar Yönetimi
 * 4.0 - Prompt Oluşturma Mantığı
 * 5.0 - İçerik Güncelleme ve Yardımcı Fonksiyonlar
 */

const PreviewModal = {
    isOpen: false, // Modalın açık olup olmadığını belirten durum

    // 1.0 - Bileşen Başlatma ve Olay Yönetimi

    /**
     * Bileşeni başlatır ve olayları bağlar.
     */
    init() {
        this.bindEvents();
        console.log('Önizleme Modalı (PreviewModal) bileşeni başlatıldı.');
    },
    
    /**
     * Modal içindeki butonlar ve klavye kısayolları için olayları bağlar.
     */
    bindEvents() {
        const confirmBtn = document.getElementById('confirmProcessBtn');
        if (confirmBtn) {
            confirmBtn.addEventListener('click', () => this.confirm());
        }
        
        const closeBtn = document.querySelector('#previewModal .btn-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', (e) => { e.preventDefault(); this.hide(); });
        }
        
        const cancelBtn = document.querySelector('#previewModal .btn-outline-secondary');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', (e) => { e.preventDefault(); this.hide(); });
        }
        
        // ESC tuşu ile modalı kapatma
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.hide();
            }
        });
    },
    
    // 2.0 - Modal Kontrolü (Gösterme/Gizleme)

    /**
     * Önizleme modalını gösterir, prompt'u oluşturur ve içeriği günceller.
     * @param {string} newsText - İşlenecek olan haber metni.
     */
    async show(newsText) {
        try {
            console.log('Önizleme modalı gösteriliyor...');
            this.showLoading();
            this.showModal();
            
            // Backend'den tam prompt'u almayı dene
            try {
                const settings = await this.getCurrentSettings();
                console.log('Mevcut ayarlar alındı:', settings);

                const response = await fetch(AppConfig.apiEndpoints.buildCompletePrompt, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ newsText: newsText, settings: settings })
                });
                
                if (!response.ok) throw new Error(`API Hatası: ${response.status}`);
                
                const result = await response.json();
                if (!result.success) throw new Error(result.message || 'Prompt oluşturulamadı');
                
                console.log('Backend tarafından oluşturulan prompt başarıyla alındı.');
                this.updateContent(settings, result.data.completePrompt);

            } catch (error) {
                console.warn('Backend prompt oluşturma hatası, istemci tarafında oluşturulacak:', error);
                // Hata durumunda istemci tarafında prompt oluştur
                const settings = await this.getCurrentSettings();
                const prompt = this.buildDynamicPrompt(newsText, settings);
                this.updateContent(settings, prompt);
            }

            this.hideLoading();

        } catch (error) {
            console.error('Önizleme modalı gösterilirken hata oluştu:', error);
            this.hideLoading();
            alert('Önizleme yüklenirken bir hata oluştu: ' + (error.message || 'Bilinmeyen hata'));
        }
    },

    /**
     * Modal penceresini görünür hale getirir.
     */
    showModal() {
        const modal = document.getElementById('previewModal');
        if (modal) {
            modal.style.display = 'block';
            modal.classList.add('show');
            this.isOpen = true;
        }
    },

    /**
     * Modal penceresini gizler.
     */
    hide() {
        const modal = document.getElementById('previewModal');
        if (modal) {
            modal.style.display = 'none';
            modal.classList.remove('show');
            this.isOpen = false;
        }
        console.log('Önizleme modalı kapatıldı.');
    },

    /**
     * Modal içindeki yükleme animasyonunu gösterir.
     */
    showLoading() {
        const loadingElement = document.getElementById('previewLoading');
        if (loadingElement) loadingElement.style.display = 'block';
    },
    
    /**
     * Modal içindeki yükleme animasyonunu gizler.
     */
    hideLoading() {
        const loadingElement = document.getElementById('previewLoading');
        if (loadingElement) loadingElement.style.display = 'none';
    },

    /**
     * Kullanıcı işlemi onayladığında çalışır, modalı kapatır ve asıl işlemi tetikler.
     */
    confirm() {
        console.log('Önizleme modalı onaylandı, haber işleniyor.');
        this.hide();
        
        if (window.MainContentComponent && window.MainContentComponent.processNewsDirectly) {
            window.MainContentComponent.processNewsDirectly();
        } else {
            console.error('Ana içerik bileşeni (MainContentComponent) bulunamadı!');
        }
    },

    // 3.0 - Veri ve Ayar Yönetimi

    /**
     * Merkezi ayar yöneticisinden mevcut kullanıcı ayarlarını alır.
     * @returns {Promise<Object>} - Kullanıcı ayarlarını içeren bir nesne.
     */
    async getCurrentSettings() {
        console.log('Mevcut ayarlar merkezi yöneticiden alınıyor...');
        if (window.unifiedSettingsManager && window.unifiedSettingsManager.isReady()) {
            return window.unifiedSettingsManager.getSettings();
        }
        // Geriye dönük uyumluluk veya varsayılanlar
        return window.centralizedSettings?.getSettings() || this.getDefaultSettings();
    },
    
    /**
     * Ayarlar yüklenemediğinde kullanılacak varsayılan ayarları döndürür.
     * @returns {Object} - Varsayılan ayarlar nesnesi.
     */
    getDefaultSettings() {
        console.warn('Merkezi ayar yöneticisi hazır değil, varsayılan ayarlar kullanılıyor.');
        return {
            targetCategory: 'auto',
            writingStyle: 'formal',
            titleCityInfo: 'exclude',
            nameCensorship: 'partial',
            removeCompanyInfo: true,
            removePlateInfo: true,
            outputFormat: 'json',
            tagCount: 5,
            customInstructions: ''
        };
    },
    
    // 4.0 - Prompt Oluşturma Mantığı

    /**
     * Verilen metin ve ayarlara göre dinamik bir AI prompt'u oluşturur.
     * Bu fonksiyon, backend'e ulaşılamadığında bir yedek olarak kullanılır.
     * @param {string} newsText - İşlenecek haber metni.
     * @param {Object} settings - Kullanıcı ayarları.
     * @returns {string} - Oluşturulan tam prompt metni.
     */
    buildDynamicPrompt(newsText, settings) {
        console.log('İstemci tarafında dinamik prompt oluşturuluyor. Ayarlar:', settings);
        
        const promptParts = [
            this.buildTaskDefinition(),
            this.buildWritingRules(settings),
            this.buildOutputRequirementsModular(settings),
            this.buildCategoryList(settings),
            this.buildOutputFormat(settings),
            this.buildCustomInstructions(settings),
            this.buildNewsContent(newsText),
            this.buildFinalInstruction()
        ];
        
        const prompt = promptParts.filter(part => part && part.trim()).join('\n\n');
        console.log(`İstemci tarafında oluşturulan prompt uzunluğu: ${prompt.length} karakter.`);
        return prompt;
    },

    buildTaskDefinition: () => `GÖREV TANIMI:\nSen, profesyonel bir yapay zeka editörüsün. Görevin, verilen orijinal metni aşağıdaki kurallara göre işleyerek, belirtilen formatta özgün bir haber içeriği oluşturmaktır.`,
    buildWritingRules: (settings) => `KURALLAR:\n• ÖZGÜNLÜK: Metin tamamen yeniden yazılmalı, ancak tüm temel bilgiler korunmalıdır.\n• DİL: ${settings.writingStyle || 'formal'} bir dil kullanılmalıdır.\n• FORMAT: Çıktı sadece istenen formatta (örn: JSON) olmalıdır.`,
    buildOutputRequirementsModular: (settings) => `İSTENEN ÇIKTILAR:\n• BAŞLIK: Etkili ve dikkat çekici bir başlık (${settings.titleCityInfo === 'include' ? 'şehir bilgisi içermeli' : 'şehir bilgisi içermemeli'}).\n• ÖZET: 2-3 cümlelik kısa bir özet.\n• HABER METNİ: Özgünleştirilmiş tam metin. İsimler "${settings.nameCensorship || 'partial'}" kuralına göre sansürlenmelidir.`,
    buildCategoryList: (settings) => `KATEGORİ LİSTESİ:\n["Asayiş", "Gündem", "Ekonomi", "Spor", "Teknoloji", "Sağlık", "Yaşam"]\n${settings.targetCategory !== 'auto' ? `(Öncelikli kategori: ${settings.targetCategory})` : ''}`,
    buildOutputFormat: (settings) => `ÇIKTI FORMATI (${settings.outputFormat || 'json'}):\n{ "baslik": "", "ozet": "", "haber_metni": "", "kategori": "", "etiketler": [] }`,
    buildCustomInstructions: (settings) => (settings.customInstructions || '').trim() ? `ÖZEL TALİMATLAR:\n${settings.customInstructions}` : '',
    buildNewsContent: (newsText) => `ORİJİNAL HABER METNİ:\n${newsText}`,
    buildFinalInstruction: () => `Yukarıdaki kurallara göre bu metni işle ve sadece istenen formatta çıktı ver.`,

    // 5.0 - İçerik Güncelleme ve Yardımcı Fonksiyonlar

    /**
     * Modalın içeriğini oluşturulan prompt ile günceller.
     * @param {Object} settings - Kullanılan ayarlar.
     * @param {string} prompt - Gösterilecek prompt metni.
     */
    updateContent(settings, prompt) {
        const promptContainer = document.querySelector('#promptDisplay');
        if (!promptContainer) {
            console.error('Prompt gösterim alanı (#promptDisplay) bulunamadı.');
            return;
        }
        
        try {
            // Güvenlik için metni escape et ve <pre><code> içinde göster
            promptContainer.innerHTML = `<pre><code class="language-text">${this.escapeHtml(prompt)}</code></pre>`;
            
            // Prism.js varsa sözdizimi renklendirmesi uygula
            if (window.Prism) {
                Prism.highlightElement(promptContainer.querySelector('code'));
            }
            console.log('Modal içeriği prompt ile güncellendi.');
        } catch (error) {
            console.error('Prompt gösterimi güncellenirken hata:', error);
            promptContainer.innerHTML = `<div class="alert alert-warning">Prompt gösterilirken bir hata oluştu.</div>`;
        }
    },
    
    /**
     * HTML içinde güvenli bir şekilde metin göstermek için özel karakterleri dönüştürür.
     * @param {string} unsafe - Dönüştürülecek metin.
     * @returns {string} - Güvenli hale getirilmiş HTML metni.
     */
    escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
};

// Bileşeni global `window` nesnesine ekle
window.PreviewModal = PreviewModal;

// DOM yüklendiğinde bileşeni başlat
document.addEventListener('DOMContentLoaded', function() {
    PreviewModal.init();
});
