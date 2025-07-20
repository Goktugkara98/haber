/**
 * Simple Preview Modal Component
 * Shows AI prompt preview before processing news
 */

const PreviewModal = {
    isOpen: false,
    
    init() {
        console.log('Preview Modal initialized');
        this.bindEvents();
    },
    
    bindEvents() {
        // Confirm button
        const confirmBtn = document.getElementById('confirmProcessBtn');
        if (confirmBtn) {
            confirmBtn.addEventListener('click', () => this.confirm());
        }
        
        // Close buttons
        const closeBtn = document.querySelector('#previewModal .btn-close');
        const cancelBtn = document.querySelector('#previewModal .btn-secondary');
        
        if (closeBtn) closeBtn.addEventListener('click', () => this.hide());
        if (cancelBtn) cancelBtn.addEventListener('click', () => this.hide());
        
        // ESC key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.hide();
            }
        });
    },
    
    async show(newsText) {
        try {
            console.log('=== PREVIEW MODAL DEBUG START ===');
            console.log('Showing preview modal with text:', newsText.substring(0, 50) + '...');
            
            // Show loading state
            this.showLoading();
            
            // Get current settings asynchronously
            console.log('About to get current settings...');
            const settings = await this.getCurrentSettings();
            console.log('=== SETTINGS RECEIVED IN PREVIEW MODAL ===');
            console.log('Full settings object:', JSON.stringify(settings, null, 2));
            console.log('nameCensorship specifically:', settings.nameCensorship);
            console.log('typeof nameCensorship:', typeof settings.nameCensorship);
            
            // Build prompt
            console.log('Building prompt with these settings...');
            const prompt = this.buildPrompt(newsText, settings);
            console.log('Built prompt length:', prompt.length);
            
            // Update modal content
            this.updateContent(settings, prompt);
            
            // Show modal
            this.showModal();
            
            // Hide loading state
            this.hideLoading();
            
            console.log('=== PREVIEW MODAL DEBUG END ===');
            
        } catch (error) {
            console.error('Error showing preview modal:', error);
            this.hideLoading();
            alert('Önizleme yüklenirken hata oluştu: ' + (error.message || 'Bilinmeyen hata'));
        }
    },
    
    async getCurrentSettings() {
        try {
            console.log('=== GETTING CURRENT SETTINGS FROM CENTRALIZED MANAGER ===');
            
            // Use centralized settings manager
            if (window.centralizedSettings && window.centralizedSettings.isReady()) {
                const settings = window.centralizedSettings.getSettings();
                console.log('Settings from centralized manager:', JSON.stringify(settings, null, 2));
                return settings;
            } else {
                console.warn('Centralized settings manager not ready, waiting...');
                
                // Wait for centralized settings to be ready
                return new Promise((resolve) => {
                    const checkReady = () => {
                        if (window.centralizedSettings && window.centralizedSettings.isReady()) {
                            const settings = window.centralizedSettings.getSettings();
                            console.log('Settings from centralized manager (after wait):', JSON.stringify(settings, null, 2));
                            resolve(settings);
                        } else {
                            setTimeout(checkReady, 100);
                        }
                    };
                    checkReady();
                });
            }
            
        } catch (error) {
            console.error('Error getting current settings from centralized manager:', error);
            return this.getDefaultSettings();
        }
    },
    
    getDefaultSettings() {
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
    
    showLoading() {
        const loadingElement = document.getElementById('previewLoading');
        if (loadingElement) {
            loadingElement.style.display = 'block';
        }
    },
    
    hideLoading() {
        const loadingElement = document.getElementById('previewLoading');
        if (loadingElement) {
            loadingElement.style.display = 'none';
        }
    },
    
    buildPrompt(newsText, settings) {
        // Build dynamic, fluent prompt based on user selections
        const prompt = this.buildDynamicPrompt(newsText, settings);
        return prompt;
    },
    
    buildDynamicPrompt(newsText, settings) {
        console.log('DEBUG Frontend: Building modular prompt with settings:', settings);
        
        // Build each section modularly - matching backend structure
        const taskDefinition = this.buildTaskDefinition();
        const writingRules = this.buildWritingRules(settings);
        const outputRequirements = this.buildOutputRequirementsModular(settings);
        const categoryList = this.buildCategoryList(settings);
        const outputFormat = this.buildOutputFormat(settings);
        const customInstructions = this.buildCustomInstructions(settings);
        const newsContent = this.buildNewsContent(newsText);
        const finalInstruction = this.buildFinalInstruction();
        
        // Combine all sections
        const promptParts = [
            taskDefinition,
            writingRules,
            outputRequirements,
            categoryList,
            outputFormat,
            customInstructions,
            newsContent,
            finalInstruction
        ];
        
        // Filter out empty parts and join
        const prompt = promptParts.filter(part => part.trim()).join('\n\n');
        
        console.log('DEBUG Frontend: Generated prompt length:', prompt.length, 'characters');
        return prompt;
    },
    
    buildTaskDefinition() {
        return `GÖREV TANIMI:
Sen, kurumsal bir gazetenin web sitesi için içerik üreten profesyonel bir yapay zeka editörüsün. Görevin, sana verilen orijinal haber metnini aşağıdaki kurallara göre işleyerek, belirtilen JSON formatında profesyonel ve özgün bir haber içeriği oluşturmaktır.`;
    },
    
    buildWritingRules(settings) {
        const writingStyle = settings.writingStyle || 'formal';
        
        let rules = 'KURALLAR:\n';
        rules += '• ÖZGÜNLÜK: Metin tamamen yeniden yazılmalı, kopya olmamalıdır. Ancak orijinal haberdeki tüm temel bilgiler, veriler, isimler ve tarihler korunmalıdır.\n';
        rules += `• KURUMSAL DİL: ${this.getWritingStyleRule(writingStyle)}\n`;
        rules += '• ÇIKTININ FORMATI: Çıktı, yalnızca ve yalnızca aşağıda belirtilen JSON yapısına uygun olmalıdır. Cevabına asla açıklama veya ek metin ekleme, sadece JSON çıktısı ver.\n';
        
        return rules;
    },
    
    buildOutputRequirementsModular(settings) {
        let requirements = 'İSTENEN ÇIKTILAR:\n';
        
        // Title requirements - dynamic based on city info setting
        requirements += this.buildTitleRequirements(settings);
        
        // Summary requirements
        requirements += this.buildSummaryRequirements(settings);
        
        // Content requirements - dynamic based on multiple settings
        requirements += this.buildContentRequirements(settings);
        
        // Category requirements - dynamic based on target category
        requirements += this.buildCategoryRequirements(settings);
        
        // Tags requirements - dynamic based on tag count
        requirements += this.buildTagsRequirements(settings);
        
        return requirements;
    },
    
    buildTitleRequirements(settings) {
        const titleCityInfo = settings.titleCityInfo || 'exclude';
        
        let titleReq = '• ETKİLİ BAŞLIK: Haberi net yansıtan, profesyonel, dikkat çekici, yanıltıcı olmayan';
        
        if (titleCityInfo === 'exclude') {
            titleReq += ', şehir bilgisi içermeyen';
            console.log('DEBUG Frontend: Title will exclude city info');
        } else if (titleCityInfo === 'include') {
            titleReq += ', şehir bilgisi içeren';
            console.log('DEBUG Frontend: Title will include city info');
        } else {
            console.log('DEBUG Frontend: Title city info setting is auto/default');
        }
        
        titleReq += ' bir başlık.\n';
        return titleReq;
    },
    
    buildSummaryRequirements(settings) {
        return '• HABER ÖZETİ: Haberin en önemli noktalarını içeren, 2-3 cümlelik, şehir bilgisi içeren kısa bir özet.\n';
    },
    
    buildContentRequirements(settings) {
        let contentReq = '• ÖZGÜN HABER METNİ: Tüm bilgileri koruyarak, metni özgün cümlelerle baştan yaz';
        
        // Name censorship rule - modular
        // Get the actual setting value, default to 'none' if not set
        const nameCensorship = settings.nameCensorship !== undefined ? settings.nameCensorship : 'none';
        console.log('DEBUG: Building content requirements with nameCensorship:', nameCensorship);
        
        // Only add name censorship text if it's not 'none'
        if (nameCensorship !== 'none') {
            const nameCensorshipText = this.getNameCensorshipText(nameCensorship);
            if (nameCensorshipText) {
                contentReq += `. ${nameCensorshipText}`;
                console.log('DEBUG: Applied name censorship rule:', nameCensorshipText);
            }
        }
        
        // Company info removal - modular
        const removeCompanyInfo = settings.removeCompanyInfo;
        if (removeCompanyInfo) {
            contentReq += '. Özel şirket bilgilerini metinden çıkar';
            console.log('DEBUG Frontend: Company info removal enabled');
        }
        
        // Plate info removal - modular
        const removePlateInfo = settings.removePlateInfo;
        if (removePlateInfo) {
            contentReq += '. Plaka bilgilerini metinden çıkar';
            console.log('DEBUG Frontend: Plate info removal enabled');
        }
        
        contentReq += '.\n';
        return contentReq;
    },
    
    buildCategoryRequirements(settings) {
        const targetCategory = settings.targetCategory;
        console.log('DEBUG Frontend: targetCategory from settings:', targetCategory);
        
        if (targetCategory && targetCategory !== 'auto' && targetCategory.trim()) {
            // User has selected a specific category
            const categoryDisplayName = this.getCategoryDisplayName(targetCategory);
            const categoryReq = `• MUHTEMEL KATEGORİ: Mümkünse "${categoryDisplayName}" kategorisini tercih et, uygun değilse en uygun kategoriyi seç.\n`;
            console.log('DEBUG Frontend: Using specific category preference:', categoryDisplayName);
            return categoryReq;
        } else {
            // User wants automatic category selection
            console.log('DEBUG Frontend: Using automatic category selection');
            return '• MUHTEMEL KATEGORİ: Verilen kategori listesinden en uygun olanı seç.\n';
        }
    },
    
    buildTagsRequirements(settings) {
        const tagCount = settings.tagCount || 5;
        console.log('DEBUG Frontend: Tag count setting:', tagCount);
        
        return `• ETİKETLER: Haberle ilgili, SEO uyumlu ${tagCount} adet etiket oluştur ve bunları bir dizi (array) olarak listele.\n`;
    },
    
    buildCategoryList(settings) {
        const fullCategories = ["Asayiş", "Gündem", "Ekonomi", "Siyaset", "Spor", "Teknoloji", "Sağlık", "Yaşam", "Eğitim", "Dünya", "Kültür & Sanat", "Magazin", "Genel"];
        
        if (settings) {
            const targetCategory = settings.targetCategory;
            if (targetCategory && targetCategory !== 'auto' && targetCategory.trim()) {
                // User has selected a specific category - highlight it in the list
                const categoryName = this.getCategoryDisplayName(targetCategory);
                if (fullCategories.includes(categoryName)) {
                    console.log('DEBUG Frontend: Highlighting selected category in list:', categoryName);
                    return `KATEGORİ LİSTESİ (SEÇİLİ: ${categoryName}):
${JSON.stringify(fullCategories)}

ÖNEM: Yukarıdaki listeden "${categoryName}" kategorisi tercih edilmektedir.`;
                }
            }
        }
        
        // Default: show full list without preference
        console.log('DEBUG Frontend: Showing full category list without preference');
        return `KATEGORİ LİSTESİ:
${JSON.stringify(fullCategories)}`;
    },
    
    buildOutputFormat(settings) {
        const outputFormat = settings.outputFormat || 'json';
        console.log('DEBUG Frontend: Output format setting:', outputFormat);
        
        if (outputFormat === 'json') {
            console.log('DEBUG Frontend: Using JSON output format');
            return `[ÇIKTI FORMATI: JSON]
Çıktı formatı JSON olarak ayarlanmıştır. Aşağıdaki yapıya uygun olarak çıktı ver:
{
  "baslik": "",
  "ozet": "",
  "haber_metni": "",
  "kategori": "",
  "etiketler": []
}`;
        } else if (outputFormat === 'xml') {
            console.log('DEBUG Frontend: Using XML output format');
            return `[ÇIKTI FORMATI: XML]
Çıktı formatı XML olarak ayarlanmıştır. Aşağıdaki yapıya uygun olarak çıktı ver:
<haber>
  <baslik></baslik>
  <ozet></ozet>
  <haber_metni></haber_metni>
  <kategori></kategori>
  <etiketler></etiketler>
</haber>`;
        } else if (outputFormat === 'plain') {
            console.log('DEBUG Frontend: Using PLAIN TEXT output format');
            return `[ÇIKTI FORMATI: DÜZ METİN]
Çıktı formatı düz metin olarak ayarlanmıştır. Aşağıdaki yapıya uygun olarak çıktı ver:
BAŞLIK: [başlık]
ÖZET: [özet]
HABER METNİ: [haber metni]
KATEGORİ: [kategori]
ETİKETLER: [etiketler]`;
        } else {
            console.log('DEBUG Frontend: Unknown output format', outputFormat, ', using default JSON');
            return `[VARSAYILAN ÇIKTI FORMATI: JSON]
Çıktı formatı JSON olarak ayarlanmıştır. Aşağıdaki yapıya uygun olarak çıktı ver:
{
  "baslik": "",
  "ozet": "",
  "haber_metni": "",
  "kategori": "",
  "etiketler": []
}`;
        }
    },
    
    buildCustomInstructions(settings) {
        const customInstructions = (settings.customInstructions || '').trim();
        
        if (customInstructions) {
            console.log('DEBUG Frontend: Custom instructions provided:', customInstructions.length, 'characters');
            return `ÖZEL TALİMATLAR:
${customInstructions}`;
        }
        
        return '';
    },
    
    buildNewsContent(newsText) {
        if (newsText && newsText.trim()) {
            console.log('DEBUG Frontend: News text provided:', newsText.length, 'characters');
            return `ORİJİNAL HABER METNİ:
${newsText}`;
        }
        
        return '';
    },
    
    buildFinalInstruction() {
        return 'Yukarıdaki kurallara göre bu haber metnini işle ve sadece JSON formatında çıktı ver:';
    },
    
    getSettingLabel(key) {
        const labels = {
            targetCategory: 'Hedef Kategori',
            writingStyle: 'Yazım Stili',
            titleCityInfo: 'Başlıkta Şehir',
            nameCensorship: 'İsim Sansürleme',
            removeCompanyInfo: 'Şirket Bilgisi',
            removePlateInfo: 'Plaka Bilgisi',
            outputFormat: 'Çıktı Formatı',
            tagCount: 'Etiket Sayısı',
            customInstructions: 'Özel Talimatlar'
        };
        return labels[key] || key;
    },
    
    getNameCensorshipRule(nameCensorship) {
        switch (nameCensorship) {
            case 'full':
                return 'İsimleri tamamen sansürle (örn: A.B.)';
            case 'partial':
                return 'İsimleri kısmi sansürle (örn: Ahmet K.)';
            case 'none':
                return 'İsimleri sansürleme';
            default:
                return 'İsimleri sansürle (örn: A.B.)';
        }
    },
    
    getWritingStyleRule(writingStyle) {
        console.log('DEBUG Frontend: Writing style setting:', writingStyle);
        
        switch (writingStyle) {
            case 'formal':
                console.log('DEBUG Frontend: Using FORMAL writing style');
                return '[FORMAL YAZIM STİLİ] Kullanılacak dil resmi, profesyonel ve bilgilendirici olmalıdır. Argo veya clickbait ifadelerden kaçınılmalıdır.';
            case 'informal':
                console.log('DEBUG Frontend: Using INFORMAL writing style');
                return '[SAMIMİ YAZIM STİLİ] Kullanılacak dil samimi, sıcak ve anlaşılır olmalıdır. Okuyucuyla yakın bir bağ kurmalı, ancak yine de profesyonel kalmalıdır.';
            case 'neutral':
                console.log('DEBUG Frontend: Using NEUTRAL writing style');
                return '[NÖTR YAZIM STİLİ] Kullanılacak dil tamamen nötr, objektif ve duygusal yüklenmeden uzak bilgilendirici olmalıdır. Sadece gerçekleri aktarmalıdır.';
            default:
                console.log('DEBUG Frontend: Unknown writing style', writingStyle, ', using default FORMAL');
                return '[VARSAYILAN FORMAL YAZIM STİLİ] Kullanılacak dil resmi, profesyonel ve bilgilendirici olmalıdır. Argo veya clickbait ifadelerden kaçınılmalıdır.';
        }
    },
    
    buildOutputRequirements(settings) {
        let requirements = 'İSTENEN ÇIKTILAR:\n';
        
        // Title requirements
        let titleReq = '• ETKİLİ BAŞLIK: Haberi net yansıtan, profesyonel, dikkat çekici, yanıltıcı olmayan';
        if (settings.titleCityInfo === 'exclude') {
            titleReq += ', şehir bilgisi içermeyen';
        } else if (settings.titleCityInfo === 'include') {
            titleReq += ', şehir bilgisi içeren';
        }
        titleReq += ' bir başlık.\n';
        requirements += titleReq;
        
        // Summary requirements
        requirements += '• HABER ÖZETİ: Haberin en önemli noktalarını içeren, 2-3 cümlelik, şehir bilgisi içeren kısa bir özet.\n';
        
        // Content requirements
        let contentReq = '• ÖZGÜN HABER METNİ: Tüm bilgileri koruyarak, metni özgün cümlelerle baştan yaz';
        
        // Add name censorship rule
        const nameCensorshipText = this.getNameCensorshipText(settings.nameCensorship);
        if (nameCensorshipText) {
            contentReq += '. ' + nameCensorshipText;
        }
        
        // Add company info rule
        if (settings.removeCompanyInfo) {
            contentReq += '. Özel şirket bilgilerini metinden çıkar';
        }
        
        // Add plate info rule
        if (settings.removePlateInfo) {
            contentReq += '. Plaka bilgilerini metinden çıkar';
        }
        
        contentReq += '.\n';
        requirements += contentReq;
        
        // Category requirements - modular and precise
        console.log('DEBUG Frontend: targetCategory from settings:', settings.targetCategory);
        
        if (settings.targetCategory && settings.targetCategory !== 'auto' && settings.targetCategory.trim()) {
            // User has selected a specific category
            const categoryDisplayName = this.getCategoryDisplayName(settings.targetCategory);
            requirements += `• MUHTEMEL KATEGORİ: Mümkünse "${categoryDisplayName}" kategorisini tercih et, uygun değilse en uygun kategoriyi seç.\n`;
            console.log('DEBUG Frontend: Using specific category preference:', categoryDisplayName);
        } else {
            // User wants automatic category selection
            requirements += '• MUHTEMEL KATEGORİ: Verilen kategori listesinden en uygun olanı seç.\n';
            console.log('DEBUG Frontend: Using automatic category selection');
        }
        
        // Tags requirements
        const tagCount = settings.tagCount || 5;
        requirements += `• ETİKETLER: Haberle ilgili, SEO uyumlu ${tagCount} adet etiket oluştur ve bunları bir dizi (array) olarak listele.\n`;
        
        return requirements;
    },
    
    getNameCensorshipText(nameCensorship) {
        console.log('DEBUG: Getting name censorship text for:', nameCensorship);
        
        // Ensure we have a valid value
        if (!nameCensorship) {
            console.warn('No nameCensorship value provided, defaulting to none');
            return '';
        }
        
        // Convert to string in case it's a number or something else
        const censorship = String(nameCensorship).toLowerCase().trim();
        
        switch (censorship) {
            case 'full':
                return 'İsimleri tamamen sansürle (örn: A.B.)';
            case 'partial':
                return 'İsimleri kısmi sansürle (örn: Ahmet K.)';
            case 'none':
                return '';
            default:
                console.warn('Unknown nameCensorship value:', nameCensorship, 'defaulting to none');
                return '';
        }
    },
    
    getCategoryDisplayName(category) {
        const categoryMap = {
            'asayis': 'Asayiş',
            'gundem': 'Gündem',
            'ekonomi': 'Ekonomi',
            'siyaset': 'Siyaset',
            'spor': 'Spor',
            'teknoloji': 'Teknoloji',
            'saglik': 'Sağlık',
            'yasam': 'Yaşam',
            'egitim': 'Eğitim',
            'dunya': 'Dünya',
            'kultur': 'Kültür & Sanat',
            'magazin': 'Magazin',
            'genel': 'Genel'
        };
        return categoryMap[category] || category;
    },
    
    updateContent(settings, prompt) {
        // Update prompt display only
        const promptContainer = document.getElementById('promptDisplay');
        if (promptContainer) {
            promptContainer.textContent = prompt;
        }
    },
    
    showModal() {
        const modal = document.getElementById('previewModal');
        if (modal) {
            modal.style.display = 'block';
            modal.classList.add('show');
            modal.setAttribute('aria-hidden', 'false');
            
            // No backdrop - keep screen bright
            
            this.isOpen = true;
        }
    },
    
    createBackdrop() {
        // Remove existing backdrop
        this.removeBackdrop();
        
        // Create very light backdrop that doesn't darken screen
        const backdrop = document.createElement('div');
        backdrop.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.1);
            z-index: 1040;
            pointer-events: auto;
        `;
        backdrop.addEventListener('click', () => this.hide());
        
        document.body.appendChild(backdrop);
        this.backdrop = backdrop;
    },
    
    removeBackdrop() {
        if (this.backdrop) {
            this.backdrop.remove();
            this.backdrop = null;
        }
    },
    
    hide() {
        const modal = document.getElementById('previewModal');
        if (modal) {
            modal.style.display = 'none';
            modal.classList.remove('show');
            modal.setAttribute('aria-hidden', 'true');
        }
        
        this.removeBackdrop();
        this.isOpen = false;
        
        console.log('Preview modal hidden');
    },
    
    confirm() {
        console.log('Preview modal confirmed');
        this.hide();
        
        // Trigger actual processing
        if (window.MainContentComponent && window.MainContentComponent.processNewsDirectly) {
            window.MainContentComponent.processNewsDirectly();
        } else {
            console.error('MainContentComponent not found');
        }
    }
};

// Make available globally
window.PreviewModal = PreviewModal;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    PreviewModal.init();
});
