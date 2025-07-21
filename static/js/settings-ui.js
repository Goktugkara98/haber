/**
 * Settings UI Renderer
 * Renders settings in sidebar, modal, and preview using config-driven data
 */

class SettingsUI {
    constructor() {
        this.isInitialized = false;
        console.log('Settings UI initialized');
    }

    /**
     * Initialize the UI renderer
     */
    init() {
        if (this.isInitialized) {
            console.log('Settings UI already initialized');
            return;
        }

        // Register as listener for settings changes
        if (window.settingsManager) {
            window.settingsManager.addListener((event, settings, changes) => {
                this.onSettingsChange(event, settings, changes);
            });
        }

        // Bind modal events
        this.bindModalEvents();

        this.isInitialized = true;
        console.log('Settings UI ready');
    }

    /**
     * Handle settings changes
     */
    onSettingsChange(event, settings, changes) {
        console.log(`Settings UI handling ${event} event`);
        
        if (event === 'loaded' || event === 'updated') {
            this.renderSidebar(settings);
            this.renderModal(settings);
            
            if (event === 'updated') {
                this.showUpdateNotification();
            }
        }
    }

    /**
     * Render settings sidebar
     */
    renderSidebar(settings) {
        const container = document.getElementById('allSettingsDisplay');
        if (!container) {
            console.warn('Settings sidebar container not found');
            return;
        }

        try {
            // Group settings by category
            const categorizedSettings = this.groupSettingsByCategory(settings);
            let html = '';

            // Render each category
            Object.entries(categorizedSettings).forEach(([categoryKey, categorySettings]) => {
                const categoryInfo = window.Categories[categoryKey];
                if (!categoryInfo || Object.keys(categorySettings).length === 0) return;

                html += `
                    <div class="settings-category mb-3">
                        <h6 class="category-title">
                            <i class="${categoryInfo.icon} me-2"></i>${categoryInfo.name}
                        </h6>
                        <div class="settings-list">
                `;

                // Render settings in this category
                Object.entries(categorySettings).forEach(([key, value]) => {
                    const config = window.SettingsUtils.getConfig(key);
                    if (!config) return;

                    const displayValue = window.SettingsUtils.getDisplayLabel(key, value);
                    html += `
                        <div class="setting-item">
                            <span class="setting-name">${config.displayName}:</span>
                            <span class="setting-value">${displayValue}</span>
                        </div>
                    `;
                });

                html += `
                        </div>
                    </div>
                `;
            });

            container.innerHTML = html || '<div class="text-muted">Ayar bulunamadı</div>';
            console.log('Settings sidebar rendered');

        } catch (error) {
            console.error('Error rendering settings sidebar:', error);
            container.innerHTML = '<div class="text-danger">Ayarlar yüklenirken hata oluştu</div>';
        }
    }

    /**
     * Render settings modal
     */
    renderModal(settings) {
        const modalBody = document.querySelector('#settingsModal .modal-body');
        if (!modalBody) {
            console.warn('Settings modal body not found');
            return;
        }

        try {
            // Group settings by category
            const categorizedSettings = this.groupSettingsByCategory(settings);
            let html = '<form id="settingsForm">';

            // Render each category
            Object.entries(categorizedSettings).forEach(([categoryKey, categorySettings]) => {
                const categoryInfo = window.Categories[categoryKey];
                if (!categoryInfo || Object.keys(categorySettings).length === 0) return;

                html += `
                    <div class="settings-category mb-4">
                        <h6 class="category-title text-primary mb-3">
                            <i class="${categoryInfo.icon} me-2"></i>${categoryInfo.name}
                        </h6>
                        <p class="text-muted small mb-3">${categoryInfo.description}</p>
                `;

                // Render form controls for settings in this category
                Object.entries(categorySettings).forEach(([key, value]) => {
                    const config = window.SettingsUtils.getConfig(key);
                    if (!config) return;

                    html += `<div class="mb-3">`;
                    html += `<label for="${key}" class="form-label">${config.displayName}</label>`;

                    // Handle different input types
                    if (config.type === 'text') {
                        // Text input for custom instructions
                        html += `
                            <textarea class="form-control" id="${key}" name="${key}" rows="3" 
                                      placeholder="${config.displayName} girin...">${value || ''}</textarea>
                        `;
                    } else if (config.options) {
                        // Select dropdown for options
                        html += `<select class="form-select" id="${key}" name="${key}">`;
                        
                        config.options.forEach(option => {
                            const selected = option.value === value ? 'selected' : '';
                            html += `<option value="${option.value}" ${selected}>${option.label}</option>`;
                        });
                        
                        html += `</select>`;
                    } else {
                        // Fallback to text input
                        html += `
                            <input type="text" class="form-control" id="${key}" name="${key}" 
                                   value="${value || ''}" placeholder="${config.displayName}">
                        `;
                    }

                    html += `</div>`;
                });

                html += `</div>`;
            });

            html += '</form>';
            modalBody.innerHTML = html;
            console.log('Settings modal rendered');

        } catch (error) {
            console.error('Error rendering settings modal:', error);
            modalBody.innerHTML = '<div class="text-danger">Ayarlar yüklenirken hata oluştu</div>';
        }
    }

    /**
     * Get preview text for settings
     */
    getPreviewText(settings) {
        const previewParts = [];

        // Get all settings and their preview text
        Object.entries(settings).forEach(([key, value]) => {
            const config = window.SettingsUtils.getConfig(key);
            if (!config) return;

            const displayValue = window.SettingsUtils.getDisplayLabel(key, value);
            previewParts.push(`${config.previewText}: ${displayValue}`);
        });

        return previewParts.join(', ');
    }

    /**
     * Group settings by category and sort by order
     */
    groupSettingsByCategory(settings) {
        const grouped = {};
        const orderedSettings = [];

        // First, collect all settings with their config
        Object.entries(settings).forEach(([key, value]) => {
            const config = window.SettingsUtils.getConfig(key);
            if (!config) return;

            // Ensure order property exists
            if (config.order === undefined) {
                console.warn(`No order defined for setting: ${key}, using default order`);
                config.order = 999; // Default to high number to sort last
            }

            orderedSettings.push({
                key,
                value,
                config,
                category: config.category
            });
        });

        // Sort settings by their order property
        orderedSettings.sort((a, b) => a.config.order - b.config.order);

        // Group by category
        orderedSettings.forEach(item => {
            if (!grouped[item.category]) {
                grouped[item.category] = {};
            }
            grouped[item.category][item.key] = item.value;
        });

        // Sort categories by their order
        const sortedCategories = {};
        Object.entries(grouped)
            .sort(([catA], [catB]) => {
                const orderA = window.Categories[catA]?.order || 999;
                const orderB = window.Categories[catB]?.order || 999;
                return orderA - orderB;
            })
            .forEach(([category, settings]) => {
                sortedCategories[category] = settings;
            });

        return sortedCategories;
    }

    /**
     * Bind modal form events
     */
    bindModalEvents() {
        // Handle save button click
        document.addEventListener('click', (e) => {
            if (e.target.id === 'saveSettingsBtn' || e.target.closest('#saveSettingsBtn')) {
                e.preventDefault();
                this.saveSettings();
            }
        });

        // Handle edit button click
        document.addEventListener('click', (e) => {
            if (e.target.id === 'editSettingsBtn' || e.target.closest('#editSettingsBtn')) {
                e.preventDefault();
                this.showModal();
            }
        });
    }

    /**
     * Show settings modal
     */
    showModal() {
        const modal = document.getElementById('settingsModal');
        if (modal) {
            const bootstrapModal = new bootstrap.Modal(modal);
            bootstrapModal.show();
        }
    }

    /**
     * Save settings from modal form
     */
    async saveSettings() {
        const form = document.getElementById('settingsForm');
        if (!form) {
            console.error('Settings form not found');
            return;
        }

        try {
            // Show loading state
            this.showSaveLoading(true);

            // Collect form data from all form elements
            const newSettings = {};
            
            // Get all form elements (inputs, selects, textareas)
            const formElements = form.querySelectorAll('input, select, textarea');
            
            formElements.forEach(element => {
                const key = element.name;
                if (key) {
                    newSettings[key] = element.value;
                }
            });
            
            console.log('Collected settings from form:', newSettings);

            // Update settings
            await window.settingsManager.updateSettings(newSettings);

            // Hide modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('settingsModal'));
            if (modal) {
                modal.hide();
            }

            console.log('Settings saved successfully');

        } catch (error) {
            console.error('Failed to save settings:', error);
            this.showErrorNotification('Ayarlar kaydedilirken hata oluştu');
        } finally {
            this.showSaveLoading(false);
        }
    }

    /**
     * Show/hide save loading state
     */
    showSaveLoading(loading) {
        const saveBtn = document.getElementById('saveSettingsBtn');
        if (!saveBtn) return;

        if (loading) {
            saveBtn.disabled = true;
            saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Kaydediliyor...';
        } else {
            saveBtn.disabled = false;
            saveBtn.innerHTML = '<i class="fas fa-save me-2"></i>Kaydet';
        }
    }

    /**
     * Show update notification
     */
    showUpdateNotification() {
        if (window.Utils && window.Utils.showNotification) {
            window.Utils.showNotification('Ayarlar başarıyla güncellendi', 'success');
        }
    }

    /**
     * Show error notification
     */
    showErrorNotification(message) {
        if (window.Utils && window.Utils.showNotification) {
            window.Utils.showNotification(message, 'error');
        }
    }
}

// Create global instance
window.settingsUI = new SettingsUI();
