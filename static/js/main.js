// Main JavaScript - Imports and orchestrates all components
// This file serves as the entry point and imports all modular components

// Main Application Controller
const App = {
    // Initialize the application
    init: async function() {
        console.log('Haber Uygulaması başlatılıyor...');
        
        // Initialize base utilities first
        if (typeof Utils !== 'undefined') {
            console.log('Base utilities loaded');
        }
        
        // Initialize centralized settings manager first
        if (window.centralizedSettings) {
            try {
                await window.centralizedSettings.init();
                console.log('Centralized settings manager initialized');
            } catch (error) {
                console.error('Failed to initialize centralized settings:', error);
            }
        }
        
        // Note: SettingsListener auto-initializes itself via DOMContentLoaded
        
        // Initialize content controller
        if (typeof ContentController !== 'undefined') {
            ContentController.init();
        }
        
        // Initialize global animations
        this.initializeGlobalAnimations();
        
        // Initialize global event handlers
        this.initializeGlobalEvents();
        
        console.log('Uygulama başarıyla başlatıldı');
    },

    // Initialize global GSAP animations
    initializeGlobalAnimations: function() {
        if (typeof gsap === 'undefined') return;

        // Animate page entrance only if body exists
        const body = document.querySelector('body');
        if (body) {
            gsap.from(body, {
                duration: 0.5,
                opacity: 0,
                ease: 'power2.out'
            });
        }

        // Animate navbar if it exists
        const navbar = document.querySelector('.navbar');
        if (navbar) {
            gsap.from(navbar, {
                duration: 0.8,
                y: -50,
                opacity: 0,
                ease: 'power2.out',
                delay: 0.2
            });
        }

        // Animate main content if it exists
        const mainContent = document.querySelector('main');
        if (mainContent) {
            gsap.from(mainContent, {
                duration: 1,
                y: 30,
                opacity: 0,
                ease: 'power2.out',
                delay: 0.4
            });
        }

        // Button hover effects
        this.initializeButtonAnimations();
    },

    // Initialize button animations
    initializeButtonAnimations: function() {
        if (typeof gsap === 'undefined') return;

        document.addEventListener('mouseover', function(e) {
            if (e.target.classList.contains('btn')) {
                gsap.to(e.target, {
                    duration: 0.3,
                    scale: 1.05,
                    ease: 'power2.out'
                });
            }
        });

        document.addEventListener('mouseout', function(e) {
            if (e.target.classList.contains('btn')) {
                gsap.to(e.target, {
                    duration: 0.3,
                    scale: 1,
                    ease: 'power2.out'
                });
            }
        });
    },

    // Initialize global event handlers
    initializeGlobalEvents: function() {
        // Global keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // F1 for help
            if (e.key === 'F1') {
                e.preventDefault();
                this.showHelp();
            }
            
            // Alt+C to clear all
            if (e.altKey && e.key === 'c') {
                e.preventDefault();
                if (confirm('Tüm verileri temizlemek istediğinizden emin misiniz?')) {
                    this.clearAll();
                }
            }
        });

        // Handle page visibility changes
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                console.log('Sayfa gizlendi - otomatik kayıt yapılıyor');
                if (typeof ContentController !== 'undefined') {
                    ContentController.autoSave();
                }
            }
        });

        // Handle before unload
        window.addEventListener('beforeunload', (e) => {
            if (typeof ContentController !== 'undefined') {
                const formData = ContentController.collectFormData();
                if (formData.newsText.length > 0) {
                    ContentController.autoSave();
                }
            }
        });
    },

    // Show help modal/info
    showHelp: function() {
        const helpContent = `
            <h5>Klavye Kısayolları:</h5>
            <ul>
                <li><kbd>Ctrl + Enter</kbd> - Formu gönder</li>
                <li><kbd>Ctrl + S</kbd> - Manuel kayıt</li>
                <li><kbd>Esc</kbd> - Formu temizle</li>
                <li><kbd>Alt + C</kbd> - Tüm verileri temizle</li>
                <li><kbd>F1</kbd> - Bu yardım menüsü</li>
            </ul>
            <h5>Özellikler:</h5>
            <ul>
                <li>Otomatik kayıt (30 saniyede bir)</li>
                <li>Karakter sayısı takibi</li>
                <li>Metin doğrulama</li>
                <li>Sonuç kopyalama ve indirme</li>
            </ul>
        `;
        
        if (typeof Utils !== 'undefined') {
            Utils.showNotification(helpContent, 'info', 10000);
        }
    },

    // Clear all application data
    clearAll: function() {
        // Clear form
        if (typeof ContentController !== 'undefined') {
            ContentController.clearForm();
        }
        
        // Clear storage
        if (typeof Utils !== 'undefined') {
            Utils.storage.remove('autoSave');
            Utils.storage.remove('processingHistory');
            Utils.storage.remove('userSettings');
        }
        
        // Hide all components
        if (typeof ResultsComponent !== 'undefined') {
            ResultsComponent.hide();
        }
        
        if (typeof LoadingComponent !== 'undefined') {
            LoadingComponent.hide();
        }
        
        console.log('Tüm veriler temizlendi');
    },

    // Get application status
    getStatus: function() {
        return {
            baseLoaded: typeof Utils !== 'undefined',
            contentLoaded: typeof ContentController !== 'undefined',
            textInputLoaded: typeof TextInputComponent !== 'undefined',
            settingsLoaded: typeof SettingsComponent !== 'undefined',
            resultsLoaded: typeof ResultsComponent !== 'undefined',
            loadingLoaded: typeof LoadingComponent !== 'undefined',
            gsapLoaded: typeof gsap !== 'undefined'
        };
    }
};

// Global functions for backward compatibility
function copyToClipboard() {
    if (typeof ResultsComponent !== 'undefined') {
        ResultsComponent.copyResult();
    }
}

function downloadText() {
    if (typeof ResultsComponent !== 'undefined') {
        ResultsComponent.downloadResult();
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', async function() {
    await App.init();
});

// Export for global access
window.App = App;
