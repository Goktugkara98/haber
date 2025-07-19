// Results Component JavaScript

const ResultsComponent = {
    elements: {},
    currentResult: null,
    
    // Initialize the component
    init: function() {
        this.cacheElements();
        this.bindEvents();
        console.log('Results Component initialized');
    },

    // Cache DOM elements
    cacheElements: function() {
        this.elements = {
            section: document.getElementById('resultSection'),
            content: document.getElementById('processedText'),
            copyBtn: document.querySelector('.btn-copy'),
            downloadBtn: document.querySelector('.btn-download'),
            shareBtn: document.querySelector('.btn-share'),
            stats: document.querySelector('.results-stats')
        };
    },

    // Bind events
    bindEvents: function() {
        if (this.elements.copyBtn) {
            this.elements.copyBtn.addEventListener('click', this.copyResult.bind(this));
        }

        if (this.elements.downloadBtn) {
            this.elements.downloadBtn.addEventListener('click', this.downloadResult.bind(this));
        }

        if (this.elements.shareBtn) {
            this.elements.shareBtn.addEventListener('click', this.shareResult.bind(this));
        }
    },

    // Show results
    show: function(result) {
        if (!this.elements.section || !result) return;

        this.currentResult = result;
        this.renderResult(result);
        this.updateStats(result);
        
        // Show the section
        this.elements.section.style.display = 'block';
        this.elements.section.classList.add('show');

        // Animate with GSAP if available
        if (typeof gsap !== 'undefined') {
            gsap.fromTo(this.elements.section, 
                { 
                    opacity: 0, 
                    y: 30 
                },
                { 
                    opacity: 1, 
                    y: 0, 
                    duration: 0.8,
                    ease: 'power2.out'
                }
            );
        }

        // Scroll to results
        setTimeout(() => {
            this.elements.section.scrollIntoView({ 
                behavior: 'smooth',
                block: 'start'
            });
        }, 300);
    },

    // Hide results
    hide: function() {
        if (!this.elements.section) return;

        this.elements.section.classList.remove('show');
        
        // Animate out with GSAP if available
        if (typeof gsap !== 'undefined') {
            gsap.to(this.elements.section, {
                opacity: 0,
                y: -20,
                duration: 0.5,
                ease: 'power2.in',
                onComplete: () => {
                    this.elements.section.style.display = 'none';
                }
            });
        } else {
            setTimeout(() => {
                this.elements.section.style.display = 'none';
            }, 300);
        }
    },

    // Render result content
    renderResult: function(result) {
        if (!this.elements.content) return;

        const originalText = result.original_text || result.input?.newsText || 'Orijinal metin bulunamadı';
        const processedText = result.processed_text || result.output || 'İşlenmiş metin henüz hazır değil';

        this.elements.content.innerHTML = `
            <div class="result-original mb-4">
                <h6 class="text-primary">
                    <i class="fas fa-file-text me-2"></i>Orijinal Metin
                </h6>
                <p class="text-muted">${this.truncateText(originalText, 200)}</p>
            </div>
            
            <hr>
            
            <div class="result-processed">
                <h6 class="text-success">
                    <i class="fas fa-magic me-2"></i>İşlenmiş Metin
                </h6>
                <div class="processed-content">
                    ${this.formatProcessedText(processedText)}
                </div>
            </div>
        `;

        // Add typing animation for processed text
        this.animateTyping();
    },

    // Format processed text
    formatProcessedText: function(text) {
        // Split into paragraphs and format
        const paragraphs = text.split('\n').filter(p => p.trim());
        return paragraphs.map(p => `<p>${p.trim()}</p>`).join('');
    },

    // Truncate text for display
    truncateText: function(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    },

    // Animate typing effect
    animateTyping: function() {
        const processedContent = this.elements.content.querySelector('.processed-content');
        if (!processedContent || typeof gsap === 'undefined') return;

        const text = processedContent.textContent;
        processedContent.textContent = '';

        // Animate each character
        gsap.to({}, {
            duration: Math.min(text.length * 0.03, 3), // Max 3 seconds
            ease: 'none',
            onUpdate: function() {
                const progress = this.progress();
                const currentLength = Math.floor(progress * text.length);
                processedContent.textContent = text.substring(0, currentLength);
            }
        });
    },

    // Update statistics
    updateStats: function(result) {
        if (!this.elements.stats) return;

        const originalLength = result.original_text?.length || 0;
        const processedLength = result.processed_text?.length || 0;
        const processingTime = result.processing_time || 0;
        const similarity = result.similarity || 0;

        const statsHTML = `
            <h6>
                <i class="fas fa-chart-bar me-2"></i>İstatistikler
            </h6>
            <div class="stats-grid">
                <div class="stat-item">
                    <span class="stat-value">${originalLength}</span>
                    <div class="stat-label">Orijinal Karakter</div>
                </div>
                <div class="stat-item">
                    <span class="stat-value">${processedLength}</span>
                    <div class="stat-label">İşlenmiş Karakter</div>
                </div>
                <div class="stat-item">
                    <span class="stat-value">${processingTime}s</span>
                    <div class="stat-label">İşlem Süresi</div>
                </div>
                <div class="stat-item">
                    <span class="stat-value">${similarity}%</span>
                    <div class="stat-label">Benzerlik</div>
                </div>
            </div>
        `;

        this.elements.stats.innerHTML = statsHTML;

        // Animate stats
        if (typeof gsap !== 'undefined') {
            gsap.from('.stat-item', {
                duration: 0.6,
                y: 20,
                opacity: 0,
                stagger: 0.1,
                ease: 'power2.out',
                delay: 0.5
            });
        }
    },

    // Copy result to clipboard
    copyResult: function() {
        if (!this.currentResult) return;

        const textToCopy = this.getFullResultText();
        Utils.copyToClipboard(textToCopy);

        // Visual feedback
        this.animateButton(this.elements.copyBtn, 'success');
    },

    // Download result as file
    downloadResult: function() {
        if (!this.currentResult) return;

        const textToDownload = this.getFullResultText();
        const filename = `haber_${new Date().toISOString().split('T')[0]}.txt`;
        
        Utils.downloadText(textToDownload, filename);

        // Visual feedback
        this.animateButton(this.elements.downloadBtn, 'success');
    },

    // Share result
    shareResult: function() {
        if (!this.currentResult) return;

        const textToShare = this.getFullResultText();
        
        if (navigator.share) {
            navigator.share({
                title: 'İşlenmiş Haber Metni',
                text: textToShare
            }).then(() => {
                Utils.showNotification('Paylaşım başarılı!', 'success');
            }).catch((error) => {
                console.log('Share failed:', error);
                this.fallbackShare(textToShare);
            });
        } else {
            this.fallbackShare(textToShare);
        }

        // Visual feedback
        this.animateButton(this.elements.shareBtn, 'info');
    },

    // Fallback share method
    fallbackShare: function(text) {
        // Copy to clipboard as fallback
        Utils.copyToClipboard(text);
        Utils.showNotification('Metin panoya kopyalandı - paylaşabilirsiniz!', 'info');
    },

    // Get full result text for copying/downloading
    getFullResultText: function() {
        if (!this.currentResult) return '';

        const originalText = this.currentResult.original_text || '';
        const processedText = this.currentResult.processed_text || '';
        const timestamp = new Date().toLocaleString('tr-TR');

        return `HABER METNİ İŞLEME SONUCU
=================================

Tarih: ${timestamp}

ORİJİNAL METİN:
${originalText}

İŞLENMİŞ METİN:
${processedText}

=================================
Haber Uygulaması ile oluşturulmuştur.`;
    },

    // Animate button feedback
    animateButton: function(button, type) {
        if (!button || typeof gsap === 'undefined') return;

        const originalText = button.innerHTML;
        const icons = {
            success: '<i class="fas fa-check me-2"></i>Tamamlandı!',
            info: '<i class="fas fa-share me-2"></i>Paylaşıldı!'
        };

        // Change button content
        button.innerHTML = icons[type] || icons.success;
        button.disabled = true;

        // Animate
        gsap.fromTo(button, 
            { scale: 1 },
            { 
                scale: 1.1,
                duration: 0.1,
                yoyo: true,
                repeat: 1,
                ease: 'power2.inOut',
                onComplete: () => {
                    // Restore original content after delay
                    setTimeout(() => {
                        button.innerHTML = originalText;
                        button.disabled = false;
                    }, 1500);
                }
            }
        );
    },

    // Clear results
    clear: function() {
        this.currentResult = null;
        this.hide();
    },

    // Get current result
    getCurrentResult: function() {
        return this.currentResult;
    },

    // Check if results are visible
    isVisible: function() {
        return this.elements.section && 
               this.elements.section.style.display !== 'none' &&
               this.elements.section.classList.contains('show');
    }
};

// Export for global access
window.ResultsComponent = ResultsComponent;
