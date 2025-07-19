// Base JavaScript - Global utilities, configurations, and common functions

// Global configuration
const AppConfig = {
    apiEndpoints: {
        processNews: '/api/process-news',
        saveNews: '/api/save-news',
        getNews: '/api/get-news'
    },
    
    settings: {
        maxTextLength: 10000,
        minTextLength: 10,
        autoSaveInterval: 30000, // 30 seconds
        animationDuration: 300
    },
    
    messages: {
        tr: {
            textTooShort: 'Metin çok kısa, en az 10 karakter olmalı.',
            textTooLong: 'Metin çok uzun, maksimum 10.000 karakter olmalı.',
            processingError: 'İşlem sırasında bir hata oluştu.',
            copySuccess: 'Metin panoya kopyalandı!',
            downloadSuccess: 'Dosya indirildi!',
            saveSuccess: 'Kayıt başarılı!',
            loadingText: 'İşleniyor, lütfen bekleyin...',
            networkError: 'Ağ bağlantısı hatası.'
        }
    }
};

// Global utility functions
const Utils = {
    // Text validation
    validateText: function(text, minLength = AppConfig.settings.minTextLength, maxLength = AppConfig.settings.maxTextLength) {
        if (!text || text.trim().length < minLength) {
            return { valid: false, message: AppConfig.messages.tr.textTooShort };
        }
        if (text.length > maxLength) {
            return { valid: false, message: AppConfig.messages.tr.textTooLong };
        }
        return { valid: true };
    },

    // Show notification
    showNotification: function(message, type = 'info', duration = 5000) {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
        alertDiv.style.cssText = 'top: 20px; right: 20px; z-index: 1050; min-width: 300px;';
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(alertDiv);
        
        // Auto remove
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.remove();
            }
        }, duration);
        
        // Animate in with GSAP if available
        if (typeof gsap !== 'undefined') {
            gsap.from(alertDiv, {
                duration: 0.5,
                x: 100,
                opacity: 0,
                ease: 'power2.out'
            });
        }
    },

    // Copy to clipboard
    copyToClipboard: async function(text) {
        try {
            if (navigator.clipboard) {
                await navigator.clipboard.writeText(text);
            } else {
                // Fallback for older browsers
                const textArea = document.createElement('textarea');
                textArea.value = text;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
            }
            this.showNotification(AppConfig.messages.tr.copySuccess, 'success');
            return true;
        } catch (error) {
            console.error('Copy failed:', error);
            this.showNotification('Kopyalama başarısız!', 'danger');
            return false;
        }
    },

    // Download text as file
    downloadText: function(text, filename = 'islenmis_haber.txt') {
        try {
            const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            
            this.showNotification(AppConfig.messages.tr.downloadSuccess, 'success');
            return true;
        } catch (error) {
            console.error('Download failed:', error);
            this.showNotification('İndirme başarısız!', 'danger');
            return false;
        }
    },

    // Format date
    formatDate: function(date) {
        if (!date) return '';
        const d = new Date(date);
        return d.toLocaleDateString('tr-TR') + ' ' + d.toLocaleTimeString('tr-TR');
    },

    // Debounce function
    debounce: function(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // API request helper
    apiRequest: async function(url, options = {}) {
        try {
            const defaultOptions = {
                headers: {
                    'Content-Type': 'application/json',
                },
            };
            
            const response = await fetch(url, { ...defaultOptions, ...options });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('API request failed:', error);
            this.showNotification(AppConfig.messages.tr.networkError, 'danger');
            throw error;
        }
    },

    // Local storage helpers
    storage: {
        set: function(key, value) {
            try {
                localStorage.setItem(key, JSON.stringify(value));
                return true;
            } catch (error) {
                console.error('Storage set failed:', error);
                return false;
            }
        },
        
        get: function(key, defaultValue = null) {
            try {
                const item = localStorage.getItem(key);
                return item ? JSON.parse(item) : defaultValue;
            } catch (error) {
                console.error('Storage get failed:', error);
                return defaultValue;
            }
        },
        
        remove: function(key) {
            try {
                localStorage.removeItem(key);
                return true;
            } catch (error) {
                console.error('Storage remove failed:', error);
                return false;
            }
        }
    }
};

// Global event handlers
document.addEventListener('DOMContentLoaded', function() {
    console.log('Haber Uygulaması başlatıldı');
    
    // Initialize tooltips if Bootstrap is available
    if (typeof bootstrap !== 'undefined') {
        const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl);
        });
    }
});

// Export for use in other modules
window.AppConfig = AppConfig;
window.Utils = Utils;
