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
        this.createSettingEditModal();
        console.log('Tooltip Component initialized');
    },

    // Load prompt texts from database
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
                    console.log('Prompt texts loaded from database');
                    return;
                }
            }
        } catch (error) {
            console.error('Failed to load prompt texts from database:', error);
        }
        
        // Fallback to default texts if database load fails
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
        const currentValue = this.getCurrentSettingValue(tooltipKey);
        
        // Add current value in brackets if available
        const titleWithValue = currentValue ? `${title} [${currentValue}]` : title;

        this.promptModal.querySelector('#prompt-section-title').textContent = titleWithValue;
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
    savePromptText: async function() {
        if (!this.currentEditingKey) return;

        const newText = this.promptModal.querySelector('#prompt-text-editor').value.trim();
        if (newText) {
            try {
                // Save to database
                const response = await fetch(`/api/prompt/sections/${this.currentEditingKey}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        prompt_text: newText
                    })
                });
                
                if (response.ok) {
                    const data = await response.json();
                    if (data.success) {
                        // Update local cache
                        this.promptTexts[this.currentEditingKey] = newText;
                        this.saveToStorage();
                        
                        if (typeof Utils !== 'undefined') {
                            Utils.showNotification('Prompt metni güncellendi ve kaydedildi', 'success', 2000);
                        }
                    } else {
                        throw new Error(data.error || 'Failed to save');
                    }
                } else {
                    throw new Error('Network error');
                }
            } catch (error) {
                console.error('Failed to save prompt text:', error);
                if (typeof Utils !== 'undefined') {
                    Utils.showNotification('Prompt metni kaydedilemedi: ' + error.message, 'danger', 3000);
                }
                return; // Don't close modal on error
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
            gorev_tanimi: 'AI Editör Görev Tanımı',
            ozgunluk: 'Özgünlük ve İçerik Koruma Kuralları',
            kurumsal_dil: 'Yazım Stili ve Dil Kuralları',
            ciktinin_formati: 'Çıktı Formatı ve Yapı Kuralları',
            etkili_baslik: 'Başlık Oluşturma Kuralları',
            haber_ozeti: 'Özet Oluşturma Kuralları',
            ozgun_haber_metni: 'Haber Metni Yeniden Yazma Kuralları',
            muhtemel_kategori: 'Kategori Belirleme Kuralları',
            etiketler: 'Etiket Oluşturma ve SEO Kuralları'
        };
        return titles[key] || 'Prompt Bölümü';
    },

    // Get current setting value for display in modal
    getCurrentSettingValue: function(tooltipKey) {
        // Get current settings from MainContentComponent if available
        if (typeof window.MainContentComponent !== 'undefined') {
            const settings = window.MainContentComponent.getCurrentSettings();
            
            switch(tooltipKey) {
                case 'gorev_tanimi':
                    return 'AI Editör Aktif';
                case 'ozgunluk':
                    return 'İçerik Koruma Aktif';
                case 'kurumsal_dil':
                    const styleMap = {
                        'formal': 'Resmi',
                        'semiformal': 'Yarı Resmi',
                        'neutral': 'Nötr'
                    };
                    return styleMap[settings.writingStyle] || settings.writingStyle;
                case 'ciktinin_formati':
                    const formatMap = {
                        'json': 'JSON Formatı',
                        'text': 'Metin Formatı',
                        'html': 'HTML Formatı'
                    };
                    return formatMap[settings.outputFormat] || settings.outputFormat;
                case 'etkili_baslik':
                    const titleCityMap = {
                        'exclude': 'Şehir Bilgisi Hariç',
                        'include': 'Şehir Bilgisi Dahil'
                    };
                    return titleCityMap[settings.titleCityInfo] || settings.titleCityInfo;
                case 'haber_ozeti':
                    return 'Şehir Bilgisi Her Zaman Dahil';
                case 'ozgun_haber_metni':
                    const censorshipMap = {
                        'initials': 'G.K. (İlk Harfler)',
                        'partial': 'Göktuğ K. (Kısmi)',
                        'none': 'Sansürsüz'
                    };
                    return censorshipMap[settings.nameCensorship] || settings.nameCensorship;
                case 'muhtemel_kategori':
                    return settings.targetCategory === 'auto' ? 'Otomatik Belirleme' : settings.targetCategory;
                case 'etiketler':
                    return `${settings.tagCount} Etiket`;
                default:
                    return null;
            }
        }
        return null;
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

    // Create setting edit modal
    createSettingEditModal: function() {
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = 'settingEditModal';
        modal.setAttribute('tabindex', '-1');
        modal.setAttribute('aria-labelledby', 'settingEditModalLabel');
        modal.setAttribute('aria-hidden', 'true');
        
        modal.innerHTML = `
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="settingEditModalLabel">Ayar Düzenle</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <div id="settingEditContent">
                            <!-- Dynamic content will be inserted here -->
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">İptal</button>
                        <button type="button" class="btn btn-primary" id="saveSettingBtn">Kaydet</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Bind save button event
        document.getElementById('saveSettingBtn').addEventListener('click', () => {
            this.saveSetting();
        });
    },

    // Show setting edit modal
    showSettingEditModal: function(settingKey, settingLabel) {
        const modal = document.getElementById('settingEditModal');
        const modalTitle = document.getElementById('settingEditModalLabel');
        const modalContent = document.getElementById('settingEditContent');
        
        modalTitle.textContent = `${settingLabel} Düzenle`;
        
        // Get current setting value
        const currentValue = this.getCurrentSettingValue(settingKey);
        
        // Generate appropriate input based on setting type
        const inputHtml = this.generateSettingInput(settingKey, currentValue);
        modalContent.innerHTML = inputHtml;
        
        // Store current setting key for saving
        modal.setAttribute('data-setting-key', settingKey);
        
        // Show modal
        const bootstrapModal = new bootstrap.Modal(modal);
        bootstrapModal.show();
    },

    // Generate setting input based on type
    generateSettingInput: function(settingKey, currentValue) {
        const settingConfigs = {
            'title_include_city': {
                type: 'checkbox',
                label: 'Başlıkta şehir bilgisi dahil edilsin',
                description: 'Haber başlığında şehir bilgisinin yer alıp almayacağını belirler'
            },
            'name_censorship': {
                type: 'select',
                label: 'İsim sansür formatı',
                description: 'Kişi isimlerinin nasıl gösterileceğini belirler',
                options: [
                    { value: 'none', label: 'Sansür yok' },
                    { value: 'G.K.', label: 'G.K. formatında' },
                    { value: 'Göktuğ K.', label: 'Göktuğ K. formatında' }
                ]
            },
            'company_info_toggle': {
                type: 'checkbox',
                label: 'Şirket/plaka bilgileri dahil edilsin',
                description: 'Şirket ve plaka bilgilerinin haberde yer alıp almayacağını belirler'
            },
            'target_category': {
                type: 'select',
                label: 'Hedef kategori',
                description: 'Haberin hangi kategoriye ait olacağını belirler',
                options: [
                    { value: 'auto', label: 'Otomatik belirle' },
                    { value: 'politics', label: 'Siyaset' },
                    { value: 'economy', label: 'Ekonomi' },
                    { value: 'sports', label: 'Spor' },
                    { value: 'technology', label: 'Teknoloji' },
                    { value: 'health', label: 'Sağlık' },
                    { value: 'culture', label: 'Kültür' }
                ]
            },
            'tag_count': {
                type: 'number',
                label: 'Etiket sayısı',
                description: 'Haber için oluşturulacak etiket sayısını belirler',
                min: 1,
                max: 10
            },
            'output_format': {
                type: 'select',
                label: 'Çıktı formatı',
                description: 'İşlenmiş haberin hangi formatta döneceğini belirler',
                options: [
                    { value: 'professional', label: 'Profesyonel' },
                    { value: 'json', label: 'JSON' },
                    { value: 'text', label: 'Metin' },
                    { value: 'html', label: 'HTML' }
                ]
            }
        };
        
        const config = settingConfigs[settingKey];
        if (!config) {
            return `<p>Bu ayar için düzenleme modu henüz desteklenmiyor.</p>`;
        }
        
        let html = `
            <div class="mb-3">
                <label class="form-label fw-bold">${config.label}</label>
                <p class="text-muted small">${config.description}</p>
        `;
        
        switch (config.type) {
            case 'checkbox':
                html += `
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" id="settingInput" ${currentValue ? 'checked' : ''}>
                        <label class="form-check-label" for="settingInput">
                            ${config.label}
                        </label>
                    </div>
                `;
                break;
                
            case 'select':
                html += `<select class="form-select" id="settingInput">`;
                config.options.forEach(option => {
                    const selected = currentValue === option.value ? 'selected' : '';
                    html += `<option value="${option.value}" ${selected}>${option.label}</option>`;
                });
                html += `</select>`;
                break;
                
            case 'number':
                html += `
                    <input type="number" class="form-control" id="settingInput" 
                           value="${currentValue || config.min || 1}" 
                           min="${config.min || 1}" 
                           max="${config.max || 100}">
                `;
                break;
                
            default:
                html += `<input type="text" class="form-control" id="settingInput" value="${currentValue || ''}">`;
        }
        
        html += `
            </div>
            <div class="alert alert-info">
                <small><strong>Not:</strong> Bu ayar değişikliği anında kaydedilecek ve tüm gelecekteki haber işlemlerinde kullanılacaktır.</small>
            </div>
        `;
        
        return html;
    },

    // Save setting from modal
    saveSetting: function() {
        const modal = document.getElementById('settingEditModal');
        const settingKey = modal.getAttribute('data-setting-key');
        const input = document.getElementById('settingInput');
        
        if (!input || !settingKey) {
            console.error('Setting input or key not found');
            return;
        }
        
        // Get value based on input type
        let value;
        if (input.type === 'checkbox') {
            value = input.checked;
        } else if (input.type === 'number') {
            value = parseInt(input.value) || 1;
        } else {
            value = input.value;
        }
        
        // Update the actual form element
        const formElement = document.querySelector(`[data-setting="${settingKey}"]`);
        if (formElement) {
            if (formElement.type === 'checkbox') {
                formElement.checked = value;
            } else {
                formElement.value = value;
            }
            
            // Trigger change event to save to database
            formElement.dispatchEvent(new Event('change'));
        }
        
        // Hide modal
        const bootstrapModal = bootstrap.Modal.getInstance(modal);
        bootstrapModal.hide();
        
        // Show success message
        this.showSaveMessage(`${this.getSettingLabel(settingKey)} başarıyla güncellendi`);
    },

    // Get setting label for display
    getSettingLabel: function(settingKey) {
        const labels = {
            'title_include_city': 'Başlık şehir bilgisi',
            'name_censorship': 'İsim sansürü',
            'company_info_toggle': 'Şirket bilgileri',
            'target_category': 'Hedef kategori',
            'tag_count': 'Etiket sayısı',
            'output_format': 'Çıktı formatı'
        };
        return labels[settingKey] || settingKey;
    },

    // Show save success message
    showSaveMessage: function(message) {
        // Create or update save indicator
        let indicator = document.querySelector('.modal-save-indicator');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.className = 'modal-save-indicator';
            indicator.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: #28a745;
                color: white;
                padding: 8px 16px;
                border-radius: 4px;
                font-size: 14px;
                z-index: 2000;
                opacity: 0;
                transition: opacity 0.3s ease;
            `;
            document.body.appendChild(indicator);
        }
        
        indicator.textContent = message + ' ✓';
        indicator.style.opacity = '1';
        
        // Hide after 3 seconds
        setTimeout(() => {
            indicator.style.opacity = '0';
        }, 3000);
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
