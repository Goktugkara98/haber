/**
 * @file settings-ui.js
 * @description Ayar Arayüzü Oluşturucu Modülü
 * * Bu dosya, `SettingsUI` sınıfını içerir ve ayarların kullanıcı arayüzünde
 * (yan menü, modal pencere vb.) gösterilmesinden sorumludur. `SettingsManager`'dan
 * gelen verileri ve `SettingsConfig`'deki yapılandırmayı kullanarak dinamik
 * olarak HTML elemanları oluşturur.
 *
 * İçindekiler:
 * 1.0 SettingsUI Sınıfı
 * 1.1 constructor() - Sınıfın başlangıç durumu.
 * 1.2 init() - Arayüzü başlatır ve dinleyicileri kaydeder.
 * 1.3 onSettingsChange() - Ayar değişikliklerini dinler ve arayüzü günceller.
 * 1.4 renderSidebar() - Ayarları yan menüde (sidebar) gösterir.
 * 1.5 renderModal() - Ayarları düzenleme modalı içinde form olarak gösterir.
 * 1.6 getPreviewText() - Ayarların bir özet metnini oluşturur.
 * 1.7 groupSettingsByCategory() - Ayarları kategorilere göre gruplar ve sıralar.
 * 1.8 bindModalEvents() - Modal içindeki kaydetme ve düzenleme butonlarının olaylarını bağlar.
 * 1.9 showModal() - Ayar modalını gösterir.
 * 1.10 saveSettings() - Modaldaki formdan ayarları toplar ve kaydeder.
 * 1.11 showSaveLoading() - Kaydetme butonu için yüklenme durumunu yönetir.
 * 1.12 showUpdateNotification() - Başarılı güncelleme bildirimi gösterir.
 * 1.13 showErrorNotification() - Hata bildirimi gösterir.
 * 2.0 Global Başlatma
 * 2.1 Global `settingsUI` nesnesinin oluşturulması.
 */

// =================================================================================================
// 1.0 SettingsUI Sınıfı
// =================================================================================================

class SettingsUI {
    /**
     * 1.1 constructor()
     * SettingsUI sınıfının yapıcı metodu.
     */
    constructor() {
        this.isInitialized = false;
        this.modal = null; // Store the modal instance
        console.log('Bilgi: SettingsUI örneği oluşturuldu.');
    }

    /**
     * 1.2 init()
     * Arayüz oluşturucuyu başlatır. `SettingsManager`'a dinleyici olarak kaydolur
     * ve modal olaylarını bağlar.
     */
    init() {
        if (this.isInitialized) return;

        if (window.settingsManager) {
            window.settingsManager.addListener(this.onSettingsChange.bind(this));
        }
        this.bindModalEvents();
        this.isInitialized = true;
        console.log('Bilgi: SettingsUI başarıyla başlatıldı ve dinlemeye hazır.');
    }

    /**
     * 1.3 onSettingsChange()
     * `SettingsManager` tarafından tetiklenen olayları yakalar. Ayarlar yüklendiğinde
     * veya güncellendiğinde arayüzü yeniden çizer.
     * @param {string} event - Olay türü ('loaded', 'updated').
     * @param {object} settings - Güncel ayarlar.
     */
    onSettingsChange(event, settings) {
        console.log(`Bilgi: SettingsUI "${event}" olayını işliyor.`);
        if (event === 'loaded' || event === 'updated') {
            this.renderSidebar(settings);
            this.renderModal(settings);
            if (event === 'updated') {
                this.showUpdateNotification();
            }
        }
    }

    /**
     * 1.4 renderSidebar()
     * Ayarları kategorize edilmiş bir şekilde yan menüde görüntüler.
     * @param {object} settings - Görüntülenecek ayarlar.
     */
    renderSidebar(settings) {
        const container = document.getElementById('allSettingsDisplay');
        if (!container) return;

        try {
            const categorizedSettings = this.groupSettingsByCategory(settings);
            let html = '';

            Object.entries(categorizedSettings).forEach(([categoryKey, categorySettings]) => {
                const categoryInfo = window.Categories[categoryKey];
                if (!categoryInfo || Object.keys(categorySettings).length === 0) return;

                html += `
                    <div class="settings-category mb-3">
                        <h6 class="category-title"><i class="${categoryInfo.icon} me-2"></i>${categoryInfo.name}</h6>
                        <div class="settings-list">`;
                
                Object.entries(categorySettings).forEach(([key, value]) => {
                    const config = window.SettingsUtils.getConfig(key);
                    if (!config) return;
                    html += `
                        <div class="setting-item">
                            <span class="setting-name">${config.displayName}:</span>
                            <span class="setting-value">${window.SettingsUtils.getDisplayLabel(key, value)}</span>
                        </div>`;
                });

                html += `</div></div>`;
            });

            container.innerHTML = html || '<div class="text-muted">Ayar bulunamadı.</div>';
        } catch (error) {
            console.error('Hata: Ayar yan menüsü oluşturulurken bir sorun oluştu.', error);
            container.innerHTML = '<div class="text-danger">Ayarlar yüklenemedi.</div>';
        }
    }

    /**
     * 1.5 renderModal()
     * Ayarları, düzenlenebilir bir form olarak modal penceresi içinde oluşturur.
     * @param {object} settings - Formda gösterilecek ayarlar.
     */
    renderModal(settings) {
        const modalBody = document.querySelector('#settingsModal .modal-body');
        if (!modalBody) return;

        try {
            const categorizedSettings = this.groupSettingsByCategory(settings);
            let html = '<form id="settingsForm">';

            Object.entries(categorizedSettings).forEach(([categoryKey, categorySettings]) => {
                const categoryInfo = window.Categories[categoryKey];
                if (!categoryInfo || Object.keys(categorySettings).length === 0) return;

                html += `
                    <div class="settings-category mb-4">
                        <h6 class="category-title text-primary mb-3"><i class="${categoryInfo.icon} me-2"></i>${categoryInfo.name}</h6>
                        <p class="text-muted small mb-3">${categoryInfo.description}</p>`;
                
                Object.entries(categorySettings).forEach(([key, value]) => {
                    const config = window.SettingsUtils.getConfig(key);
                    if (!config) return;

                    html += `<div class="mb-3"><label for="${key}" class="form-label">${config.displayName}</label>`;
                    if (config.type === 'textarea') {
                        html += `<textarea class="form-control" id="${key}" name="${key}" rows="3" placeholder="${config.placeholder || ''}">${value || ''}</textarea>`;
                    } else if (config.options) {
                        html += `<select class="form-select" id="${key}" name="${key}">`;
                        config.options.forEach(option => {
                            html += `<option value="${option.value}" ${option.value == value ? 'selected' : ''}>${option.label}</option>`;
                        });
                        html += `</select>`;
                    } else {
                        html += `<input type="text" class="form-control" id="${key}" name="${key}" value="${value || ''}" placeholder="${config.displayName}">`;
                    }
                    html += `</div>`;
                });
                html += `</div>`;
            });

            modalBody.innerHTML = html + '</form>';
        } catch (error) {
            console.error('Hata: Ayar modalı oluşturulurken bir sorun oluştu.', error);
            modalBody.innerHTML = '<div class="text-danger">Ayarlar yüklenemedi.</div>';
        }
    }

    /**
     * 1.6 getPreviewText()
     * Ayarların kısa bir özetini (preview) oluşturur. Prompt'larda kullanılır.
     * @param {object} settings - Özetlenecek ayarlar.
     * @returns {string} - Virgülle ayrılmış özet metni.
     */
    getPreviewText(settings) {
        return Object.entries(settings).map(([key, value]) => {
            const config = window.SettingsUtils.getConfig(key);
            return config ? `${config.previewText}: ${window.SettingsUtils.getDisplayLabel(key, value)}` : '';
        }).filter(Boolean).join(', ');
    }

    /**
     * 1.7 groupSettingsByCategory()
     * Ayarları `SettingsConfig` içinde tanımlanan kategori ve sıraya göre
     * gruplandırır ve sıralar.
     * @param {object} settings - Gruplandırılacak ayarlar.
     * @returns {object} - Kategorize edilmiş ve sıralanmış ayarlar.
     */
    groupSettingsByCategory(settings) {
        const grouped = {};
        const orderedSettings = Object.entries(settings).map(([key, value]) => {
            const config = window.SettingsUtils.getConfig(key);
            return { key, value, config, category: config?.category, order: config?.order ?? 999 };
        }).filter(item => item.config).sort((a, b) => a.order - b.order);

        orderedSettings.forEach(item => {
            if (!grouped[item.category]) grouped[item.category] = {};
            grouped[item.category][item.key] = item.value;
        });

        return Object.fromEntries(
            Object.entries(grouped).sort(([catA], [catB]) => {
                const orderA = window.Categories[catA]?.order ?? 999;
                const orderB = window.Categories[catB]?.order ?? 999;
                return orderA - orderB;
            })
        );
    }

    /**
     * 1.8 bindModalEvents()
     * Ayar modalındaki "Kaydet" ve "Düzenle" butonlarına tıklama olaylarını bağlar.
     */
    bindModalEvents() {
        document.addEventListener('click', (e) => {
            if (e.target.closest('#saveSettingsBtn')) {
                e.preventDefault();
                this.saveSettings();
            }
            if (e.target.closest('#editSettingsBtn')) {
                e.preventDefault();
                this.showModal();
            }
        });
    }

    /**
     * 1.9 showModal()
     * Bootstrap modalını tetikleyerek ayar penceresini gösterir.
     */
    showModal() {
        const modalEl = document.getElementById('settingsModal');
        if (!modalEl) return;
        
        // First, completely remove any existing modal instances and backdrops
        const existingModal = bootstrap.Modal.getInstance(modalEl);
        if (existingModal) {
            existingModal.dispose();
        }
        
        // Remove any existing backdrops manually
        const existingBackdrops = document.querySelectorAll('.modal-backdrop');
        existingBackdrops.forEach(backdrop => {
            backdrop.parentNode?.removeChild(backdrop);
        });
        
        // Reset body classes and styles
        document.body.classList.remove('modal-open');
        document.body.style.paddingRight = '';
        document.body.style.overflow = '';
        
        // Create new modal instance with explicit options
        this.modal = new bootstrap.Modal(modalEl, {
            backdrop: 'static', // Use 'static' to prevent closing when clicking outside
            keyboard: true,     // Allow closing with ESC key
            focus: true        // Focus the modal when shown
        });
        
        // Remove any existing event listeners to prevent duplicates
        const modalElement = modalEl;
        const clonedModalElement = modalElement.cloneNode(true);
        modalElement.parentNode?.replaceChild(clonedModalElement, modalElement);
        
        // Store reference to the new element
        const newModalEl = document.getElementById('settingsModal');
        if (!newModalEl) return;
        
        // Add new event listener for when the modal is hidden
        newModalEl.addEventListener('hidden.bs.modal', () => {
            // Clean up the modal instance
            if (this.modal) {
                this.modal.dispose();
                this.modal = null;
            }
            
            // Force remove any remaining backdrops
            document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
                backdrop.parentNode?.removeChild(backdrop);
            });
            
            // Reset body classes and styles
            document.body.classList.remove('modal-open');
            document.body.style.paddingRight = '';
            document.body.style.overflow = '';
        });
        
        // Show the modal
        this.modal.show();
        
        // Force backdrop creation if it doesn't exist
        if (!document.querySelector('.modal-backdrop')) {
            const backdrop = document.createElement('div');
            backdrop.className = 'modal-backdrop fade show';
            document.body.appendChild(backdrop);
            document.body.classList.add('modal-open');
        }
    }

    /**
     * 1.10 saveSettings()
     * Modaldaki formdan verileri toplar ve `settingsManager` aracılığıyla kaydeder.
     */
    async saveSettings() {
        const form = document.getElementById('settingsForm');
        if (!form) return;

        try {
            this.showSaveLoading(true);
            const newSettings = {};
            const formElements = form.querySelectorAll('input, select, textarea');
            
            // First, collect all form values
            const formValues = {};
            formElements.forEach(element => {
                if (element.name) {
                    formValues[element.name] = element.value;
                }
            });
            
            // Map form values to canonical keys from settings-config.js
            for (const [key, value] of Object.entries(formValues)) {
                // Try to find the canonical key in settings config
                const config = window.SettingsUtils.getConfig(key);
                if (config) {
                    // Use the canonical key from the config
                    newSettings[config.dbKey] = value;
                } else {
                    // If no config found, use the original key (for backward compatibility)
                    console.warn(`Warning: No config found for setting key: ${key}. Using as-is.`);
                    newSettings[key] = value;
                }
            }
            
            await window.settingsManager.updateSettings(newSettings);

            const modal = bootstrap.Modal.getInstance(document.getElementById('settingsModal'));
            modal?.hide();
        } catch (error) {
            console.error('Hata: Ayarlar kaydedilemedi.', error);
            this.showErrorNotification('Ayarlar kaydedilirken bir hata oluştu.');
        } finally {
            this.showSaveLoading(false);
        }
    }

    /**
     * 1.11 showSaveLoading()
     * Kaydet butonunun görünümünü yüklenme durumuna göre (aktif/pasif) değiştirir.
     * @param {boolean} loading - Yüklenme durumu.
     */
    showSaveLoading(loading) {
        const saveBtn = document.getElementById('saveSettingsBtn');
        if (!saveBtn) return;
        saveBtn.disabled = loading;
        saveBtn.innerHTML = loading 
            ? '<i class="fas fa-spinner fa-spin me-2"></i>Kaydediliyor...' 
            : '<i class="fas fa-save me-2"></i>Değişiklikleri Kaydet';
    }

    /**
     * 1.12 showUpdateNotification()
     * Ayarların başarıyla güncellendiğini belirten bir bildirim gösterir.
     */
    showUpdateNotification() {
        window.Utils?.showNotification('Ayarlar başarıyla güncellendi.', 'success');
    }

    /**
     * 1.13 showErrorNotification()
     * Bir hata oluştuğunda kullanıcıya bildirim gösterir.
     * @param {string} message - Gösterilecek hata mesajı.
     */
    showErrorNotification(message) {
        window.Utils?.showNotification(message, 'danger');
    }
}

// =================================================================================================
// 2.0 Global Başlatma
// =================================================================================================

/**
 * Uygulamanın her yerinden erişilebilmesi için `SettingsUI` sınıfından
 * global bir örnek oluşturur.
 */
window.settingsUI = new SettingsUI();