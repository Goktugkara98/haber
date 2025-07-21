/**
 * @file history.js
 * @description Geçmiş Yöneticisi
 * * Bu dosya, kullanıcıların geçmiş işlemlerini görüntülemesini, aramasını ve
 * filtrelemesini sağlayan `HistoryManager` sınıfını içerir. API'den geçmiş
 * verilerini yükler, sayfalamayı yönetir ve detayları bir modal pencerede gösterir.
 *
 * İçindekiler:
 * 1.0 HistoryManager Sınıfı
 * 1.1 constructor() - Sınıfın başlangıç durumu.
 * 1.2 init() - Olayları bağlar ve verileri yükler.
 * 1.3 bindEvents() - Arama, filtreleme ve modal olaylarını bağlar.
 * 1.4 loadHistory() - API'den tüm geçmiş verilerini yükler.
 * 1.5 loadStatistics() - İstatistik verilerini yükler.
 * 1.6 updateStatistics() - İstatistik arayüzünü günceller.
 * 1.7 filterHistory() - Geçmiş listesini arama ve filtre kriterlerine göre süzer.
 * 1.8 renderHistory() - Filtrelenmiş geçmiş verilerini ekrana çizer.
 * 1.9 createHistoryItemHTML() - Tek bir geçmiş öğesi için HTML oluşturur.
 * 1.10 renderPagination() - Sayfalama kontrollerini oluşturur.
 * 1.11 hidePagination() - Sayfalamayı gizler.
 * 1.12 goToPage() - Belirtilen sayfaya gider.
 * 1.13 showMessageModal() - Geçmiş öğesinin detaylarını modalda gösterir.
 * 1.14 updateModalContent() - Modal içeriğini günceller.
 * 1.15 markAsRead() - Bir mesajı okundu olarak işaretler.
 * 1.16 Yardımcı Metotlar (getStatusIcon, getStatusText, formatDate vb.)
 * 2.0 Global Başlatma
 * 2.1 DOM yüklendiğinde HistoryManager'ın otomatik başlatılması.
 */

// =================================================================================================
// 1.0 HistoryManager Sınıfı
// =================================================================================================

class HistoryManager {
    /**
     * 1.1 constructor()
     * HistoryManager sınıfının yapıcı metodu. Sayfalama, filtreleme ve veri
     * depolama için başlangıç değişkenlerini ayarlar.
     */
    constructor() {
        this.currentPage = 1;
        this.itemsPerPage = 20;
        this.totalItems = 0;
        this.allHistory = [];
        this.filteredHistory = [];
        this.currentModal = null;
        
        // Bind all methods to ensure 'this' context is maintained
        const methods = [
            'init', 'bindEvents', 'loadHistory', 'loadStatistics', 'renderHistory',
            'filterHistory', 'showMessageModal', 'markAsRead', 'renderPagination',
            'goToPage', 'createHistoryItemHTML', 'updateModalContent', 'getStatusIcon',
            'getStatusText', 'getStatusColor', 'formatDate', 'truncateText', 'escapeText',
            'copyToClipboard', 'downloadText', 'showLoading', 'hideLoading', 'showError',
            'showNotification', 'debounce', 'attachItemEventListeners', 'handleHistoryItemClick'
        ];
        
        // Bind each method to the instance
        methods.forEach(method => {
            if (typeof this[method] === 'function') {
                this[method] = this[method].bind(this);
            }
        });
        
        this.init();
    }
    
    /**
     * 1.2 init()
     * Yöneticiyi başlatır: olayları bağlar, geçmişi ve istatistikleri yükler.
     */
    init() {
        this.bindEvents();
        this.loadHistory();
        this.loadStatistics();
    }
    
    /**
     * 1.3 bindEvents()
     * Arama kutusu, filtreler ve modal pencere gibi arayüz elemanlarına
     * olay dinleyicileri ekler.
     */
    bindEvents() {
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', this.debounce(() => this.filterHistory(), 300));
        }
        
        document.getElementById('status-filter')?.addEventListener('change', () => this.filterHistory());
        document.getElementById('read-filter')?.addEventListener('change', () => this.filterHistory());
        
        const modal = document.getElementById('messageModal');
        if (modal) {
            modal.addEventListener('hidden.bs.modal', () => { this.currentModal = null; });
        }
        
        document.getElementById('copy-btn')?.addEventListener('click', () => {
            if (this.currentModal?.processed_text) {
                this.copyToClipboard(this.currentModal.processed_text);
            }
        });
        
        document.getElementById('download-btn')?.addEventListener('click', () => {
            if (this.currentModal?.processed_text) {
                this.downloadText(this.currentModal.processed_text, `haber_${this.currentModal.id}.txt`);
            }
        });
    }
    
    /**
     * 1.4 loadHistory()
     * API üzerinden tüm geçmiş kayıtlarını asenkron olarak yükler.
     */
    async loadHistory() {
        try {
            console.log('Bilgi: Geçmiş verileri API\'den yükleniyor...');
            this.showLoading();
            
            const response = await fetch('/api/history?limit=1000');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('API Yanıtı:', data); // Debug log
            
            if (data && data.success) {
                this.allHistory = Array.isArray(data.history) ? data.history : [];
                this.filteredHistory = [...this.allHistory];
                this.totalItems = this.allHistory.length;
                console.log(`Bilgi: ${this.totalItems} adet geçmiş kaydı başarıyla yüklendi.`);
                
                // Ensure UI is in a consistent state
                const historyList = document.getElementById('history-list');
                const noResults = document.getElementById('no-results');
                if (historyList) historyList.style.display = 'block';
                if (noResults) noResults.style.display = 'none';
                
                this.renderHistory();
            } else {
                const errorMsg = data?.error || 'Bilinmeyen bir sunucu hatası oluştu.';
                console.error('API Hatası:', errorMsg);
                throw new Error(errorMsg);
            }
        } catch (error) {
            console.error('Hata: Geçmiş verileri yüklenirken bir hata oluştu.', error);
            this.showError('Geçmiş yüklenirken bir hata oluştu. Lütfen bağlantınızı kontrol edin.');
            
            // Ensure UI is in a consistent state on error
            const historyList = document.getElementById('history-list');
            const noResults = document.getElementById('no-results');
            if (historyList) historyList.style.display = 'none';
            if (noResults) {
                noResults.style.display = 'block';
                noResults.innerHTML = `
                    <i class="fas fa-exclamation-triangle fa-3x text-warning mb-3"></i>
                    <h4>Veriler yüklenirken bir hata oluştu</h4>
                    <p class="text-muted">Lütfen sayfayı yenileyip tekrar deneyin.</p>
                    <button class="btn btn-warning mt-3" onclick="window.location.reload()">
                        <i class="fas fa-sync-alt me-2"></i>Sayfayı Yenile
                    </button>
                `;
            }
        } finally {
            this.hideLoading();
            
            // Add a small delay before checking if we need to show the no-results message
            setTimeout(() => {
                const historyList = document.getElementById('history-list');
                const noResults = document.getElementById('no-results');
                
                if (historyList && noResults) {
                    const hasVisibleItems = historyList.children.length > 0 && 
                                         window.getComputedStyle(historyList).display !== 'none';
                    
                    if (!hasVisibleItems && this.filteredHistory.length === 0) {
                        noResults.style.display = 'block';
                        historyList.style.display = 'none';
                    } else {
                        noResults.style.display = 'none';
                        historyList.style.display = 'block';
                    }
                }
            }, 100);
        }
    }
    
    /**
     * 1.5 loadStatistics()
     * API üzerinden istatistik verilerini (toplam, tamamlanan vb.) yükler.
     */
    async loadStatistics() {
        try {
            const response = await fetch('/api/statistics');
            const data = await response.json();
            if (data.success) {
                this.updateStatistics(data.statistics);
            }
        } catch (error) {
            console.error('Hata: İstatistik verileri yüklenirken bir hata oluştu.', error);
        }
    }
    
    /**
     * 1.6 updateStatistics()
     * Arayüzdeki istatistik alanlarını günceller.
     * @param {object} stats - Güncellenecek istatistik verileri.
     */
    updateStatistics(stats) {
        document.getElementById('total-count').textContent = stats.total || 0;
        document.getElementById('completed-count').textContent = stats.completed || 0;
    }
    
    /**
     * 1.7 filterHistory()
     * Arama ve filtreleme kriterlerine göre `allHistory` dizisini filtreleyerek
     * `filteredHistory` dizisini günceller ve arayüzü yeniden çizer.
     */
    filterHistory() {
        const searchTerm = document.getElementById('search-input')?.value.toLowerCase() || '';
        const statusFilter = document.getElementById('status-filter')?.value || '';
        const readFilter = document.getElementById('read-filter')?.value || '';
        
        this.filteredHistory = this.allHistory.filter(item => {
            const matchesSearch = !searchTerm || 
                item.original_text.toLowerCase().includes(searchTerm) ||
                (item.processed_text && item.processed_text.toLowerCase().includes(searchTerm));
            const matchesStatus = !statusFilter || item.status === statusFilter;
            const matchesRead = !readFilter || item.read_status === readFilter;
            return matchesSearch && matchesStatus && matchesRead;
        });
        
        this.currentPage = 1;
        this.renderHistory();
    }
    
    /**
     * 1.8 renderHistory()
     * `filteredHistory` dizisindeki mevcut sayfa verilerini ekrana yazar.
     * Eğer hiç sonuç yoksa "Sonuç bulunamadı" mesajını gösterir.
     */
    renderHistory() {
        try {
            const historyList = document.getElementById('history-list');
            const noResults = document.getElementById('no-results');
            
            if (!historyList || !noResults) {
                console.error('Hata: Geçmiş listesi için gerekli DOM elemanları bulunamadı.');
                return;
            }
            
            // Always ensure we have valid data
            if (!Array.isArray(this.filteredHistory)) {
                console.error('Hata: Geçersiz veri formatı - filteredHistory bir dizi değil');
                this.filteredHistory = [];
            }
            
            // Check if we have any items to display
            if (this.filteredHistory.length === 0) {
                console.log('Bilgi: Gösterilecek geçmiş kaydı bulunamadı.');
                historyList.style.display = 'none';
                noResults.style.display = 'block';
                this.hidePagination();
                return;
            }
            
            // Show the history list and hide no results message
            historyList.style.display = 'block';
            noResults.style.display = 'none';
            
            // Calculate pagination
            const startIndex = (this.currentPage - 1) * this.itemsPerPage;
            const endIndex = Math.min(startIndex + this.itemsPerPage, this.filteredHistory.length);
            const pageItems = this.filteredHistory.slice(startIndex, endIndex);
            
            // Safely generate HTML for each item
            let historyHTML = '';
            try {
                historyHTML = pageItems.map(item => {
                    try {
                        return this.createHistoryItemHTML(item);
                    } catch (itemError) {
                        console.error('Hata: Geçmiş öğesi oluşturulurken hata:', itemError, item);
                        return ''; // Skip problematic items
                    }
                }).join('');
            } catch (renderError) {
                console.error('Hata: Geçmiş listesi oluşturulurken hata:', renderError);
                historyHTML = '<div class="alert alert-warning">Geçmiş verileri yüklenirken bir hata oluştu.</div>';
            }
            
            // Safely update the DOM
            try {
                historyList.innerHTML = historyHTML || '<div class="alert alert-info">Gösterilecek içerik bulunamadı.</div>';
                historyList.style.display = 'block';
                noResults.style.display = 'none';
                
                // Re-attach event listeners after DOM update
                this.attachItemEventListeners();
                
                // Update pagination
                this.renderPagination();
                
            } catch (domError) {
                console.error('Hata: DOM güncellenirken hata oluştu:', domError);
                noResults.style.display = 'block';
                noResults.innerHTML = `
                    <i class="fas fa-exclamation-triangle fa-3x text-danger mb-3"></i>
                    <h4>Sayfa yüklenirken bir hata oluştu</h4>
                    <p class="text-muted">Lütfen sayfayı yenileyip tekrar deneyin.</p>
                    <button class="btn btn-danger mt-3" onclick="window.location.reload()">
                        <i class="fas fa-sync-alt me-2"></i>Sayfayı Yenile
                    </button>
                `;
                historyList.style.display = 'none';
            }
            
        } catch (error) {
            console.error('Kritik Hata: renderHistory sırasında beklenmeyen bir hata oluştu:', error);
            // Last resort - show error message
            const noResults = document.getElementById('no-results');
            if (noResults) {
                noResults.style.display = 'block';
                noResults.innerHTML = `
                    <i class="fas fa-bug fa-3x text-danger mb-3"></i>
                    <h4>Kritik Hata</h4>
                    <p class="text-muted">Sayfa yenilenmeli. Hata detayı: ${error.message || 'Bilinmeyen hata'}</p>
                    <button class="btn btn-danger mt-3" onclick="window.location.reload()">
                        <i class="fas fa-sync-alt me-2"></i>Sayfayı Yenile
                    </button>
                `;
            }
        }
    }
    
    /**
     * 1.9 createHistoryItemHTML()
     * Tek bir geçmiş öğesi için HTML içeriğini oluşturur.
     * @param {object} item - Geçmiş öğesi verisi.
     * @returns {string} - Oluşturulan HTML metni.
     */
    createHistoryItemHTML(item) {
        try {
            if (!item || typeof item !== 'object') {
                console.error('Hata: Geçersiz öğe verisi', item);
                return '';
            }
            
            const statusIcon = this.getStatusIcon(item.status || 'pending');
            const statusText = this.getStatusText(item.status || 'pending');
            const formattedDate = this.formatDate(item.created_at || new Date().toISOString());
            const truncatedText = this.truncateText(item.original_text || 'İçerik yok', 150);
            const isUnread = item.read_status === 'unread';
            const itemId = item.id || Date.now();
            
            // Escape HTML to prevent XSS
            const escapeHtml = (unsafe) => {
                if (!unsafe) return '';
                return unsafe
                    .toString()
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/"/g, '&quot;')
                    .replace(/'/g, '&#039;');
            };
            
            const safeTruncatedText = escapeHtml(truncatedText);
            
            return `
                <div class="history-item ${isUnread ? 'unread' : ''}" 
                     data-message-id="${itemId}"
                     data-status="${escapeHtml(item.status || 'pending')}"
                     data-read-status="${item.read_status || 'read'}">
                    <div class="history-item-content">
                        <div class="history-item-icon ${escapeHtml(item.status || 'pending')}">
                            <i class="${statusIcon}"></i>
                        </div>
                        <div class="history-item-body">
                            <div class="history-item-header">
                                <h5 class="history-item-title">${safeTruncatedText}</h5>
                                <div class="history-item-meta">
                                    <span class="history-status ${escapeHtml(item.status || 'pending')}">
                                        ${statusText}
                                    </span>
                                    <span class="history-date">${formattedDate}</span>
                                    ${isUnread ? '<div class="unread-indicator"></div>' : ''}
                                </div>
                            </div>
                            <div class="history-item-text">${safeTruncatedText}</div>
                        </div>
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('Hata: Geçmiş öğesi oluşturulurken hata oluştu:', error, item);
            return `
                <div class="alert alert-warning">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    Bu öğe yüklenirken bir hata oluştu.
                </div>
            `;
        }
    }
    
    /**
     * 1.10 renderPagination()
     * Sayfa numaralarını ve ileri/geri butonlarını içeren sayfalama
     * bileşenini oluşturur.
     */
    renderPagination() {
        const totalPages = Math.ceil(this.filteredHistory.length / this.itemsPerPage);
        const paginationContainer = document.getElementById('pagination');
        
        if (totalPages <= 1) {
            this.hidePagination();
            return;
        }
        
        paginationContainer.style.display = 'block';
        const pagination = paginationContainer.querySelector('.pagination');
        
        let paginationHTML = `<li class="page-item ${this.currentPage === 1 ? 'disabled' : ''}"><a class="page-link" href="#" onclick="historyManager.goToPage(${this.currentPage - 1}); return false;"><i class="fas fa-chevron-left"></i></a></li>`;
        
        const startPage = Math.max(1, this.currentPage - 2);
        const endPage = Math.min(totalPages, this.currentPage + 2);
        
        for (let i = startPage; i <= endPage; i++) {
            paginationHTML += `<li class="page-item ${i === this.currentPage ? 'active' : ''}"><a class="page-link" href="#" onclick="historyManager.goToPage(${i}); return false;">${i}</a></li>`;
        }
        
        paginationHTML += `<li class="page-item ${this.currentPage === totalPages ? 'disabled' : ''}"><a class="page-link" href="#" onclick="historyManager.goToPage(${this.currentPage + 1}); return false;"><i class="fas fa-chevron-right"></i></a></li>`;
        
        pagination.innerHTML = paginationHTML;
    }
    
    /**
     * 1.11 hidePagination()
     * Sayfalama bileşenini gizler.
     */
    hidePagination() {
        const paginationContainer = document.getElementById('pagination');
        if (paginationContainer) paginationContainer.style.display = 'none';
    }
    
    /**
     * 1.12 goToPage()
     * Belirtilen sayfaya gider ve içeriği yeniden yükler.
     * @param {number} page - Gidilecek sayfa numarası.
     */
    goToPage(page) {
        const totalPages = Math.ceil(this.filteredHistory.length / this.itemsPerPage);
        if (page >= 1 && page <= totalPages) {
            this.currentPage = page;
            this.renderHistory();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }
    
    /**
     * 1.13 showMessageModal()
     * Tıklanan geçmiş öğesinin detaylarını bir modal pencerede gösterir.
     * Mesaj okunmamışsa okundu olarak işaretler.
     * @param {number} messageId - Gösterilecek mesajın ID'si.
     */
    async showMessageModal(messageId) {
        try {
            // Find the message in the history
            const message = this.allHistory.find(item => item.id === messageId);
            if (!message) {
                console.error(`Hata: ${messageId} ID'li mesaj bulunamadı.`);
                this.showNotification('Mesaj bulunamadı', 'error');
                return;
            }
            
            // Store the current message
            this.currentModal = message;
            
            // Update the modal content
            this.updateModalContent(message);
            
            // Initialize and show the modal
            const modalElement = document.getElementById('messageModal');
            if (!modalElement) {
                throw new Error('Modal elementi bulunamadı');
            }
            
            // Initialize Bootstrap modal if not already done
            let modal = bootstrap.Modal.getInstance(modalElement);
            if (!modal) {
                modal = new bootstrap.Modal(modalElement, {
                    backdrop: 'static',
                    keyboard: true
                });
            }
            
            // Show the modal
            modal.show();
            
            // Mark as read if unread
            if (message.read_status === 'unread') {
                try {
                    await this.markAsRead(messageId);
                    message.read_status = 'read';
                    
                    // Update the UI to reflect the read status
                    const historyItems = document.querySelectorAll('.history-item');
                    const itemElement = Array.from(historyItems).find(item => 
                        item.getAttribute('data-message-id') === messageId.toString()
                    );
                    
                    if (itemElement) {
                        itemElement.classList.remove('unread');
                        const unreadIndicator = itemElement.querySelector('.unread-indicator');
                        if (unreadIndicator) {
                            unreadIndicator.remove();
                        }
                    }
                    
                    // Refresh statistics
                    this.loadStatistics();
                } catch (error) {
                    console.error('Hata: Mesaj okundu olarak işaretlenirken hata oluştu:', error);
                    // Continue showing the modal even if marking as read fails
                }
            }
        } catch (error) {
            console.error('Hata: Mesaj detayı modalı gösterilemedi.', error);
            this.showNotification('Mesaj yüklenirken hata oluştu: ' + (error.message || 'Bilinmeyen hata'), 'error');
        }
    }
    
    /**
     * 1.14 updateModalContent()
     * Modal penceresinin içeriğini (orijinal metin, prompt, AI cevabı) günceller.
     * @param {object} message - Modalda gösterilecek mesaj verisi.
     */
    updateModalContent(message) {
        let contentHTML = `<div class="message-section"><h6>Orijinal Haber</h6><div class="message-content original">${message.original_text}</div></div>`;
        if (message.prompt_text) {
            contentHTML += `<div class="message-section"><h6>Gönderilen Prompt</h6><div class="message-content prompt">${message.prompt_text}</div></div>`;
        }
        if (message.processed_text) {
            contentHTML += `<div class="message-section"><h6>AI Cevabı</h6><div class="message-content response">${message.processed_text}</div></div>`;
        } else {
            contentHTML += `<div class="message-section"><div class="alert alert-info"><i class="fas fa-info-circle"></i> AI cevabı henüz hazır değil.</div></div>`;
        }
        
        document.getElementById('modal-content').innerHTML = contentHTML;
        document.getElementById('modal-status').textContent = this.getStatusText(message.status);
        document.getElementById('modal-status').className = `badge bg-${this.getStatusColor(message.status)}`;
        document.getElementById('modal-date').textContent = this.formatDate(message.created_at);
        
        const displayActionButtons = message.processed_text ? 'inline-block' : 'none';
        document.getElementById('copy-btn').style.display = displayActionButtons;
        document.getElementById('download-btn').style.display = displayActionButtons;
    }
    
    /**
     * 1.15 markAsRead()
     * API üzerinden bir mesajı "okundu" olarak işaretler.
     * @param {number} messageId - Okundu olarak işaretlenecek mesajın ID'si.
     */
    /**
     * 1.15 markAsRead()
     * API üzerinden bir mesajı "okundu" olarak işaretler.
     * @param {number} messageId - Okundu olarak işaretlenecek mesajın ID'si.
     */
    async markAsRead(messageId) {
        try {
            const response = await fetch(`/api/mark-as-read/${messageId}`, { 
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Hata: Mesaj okundu olarak işaretlenemedi.', error);
            throw error; // Re-throw to allow caller to handle the error
        }
    }
    
    getStatusIcon(status) {
        const icons = {
            'processing': 'fas fa-spinner fa-spin',
            'pending': 'fas fa-clock',
            'completed': 'fas fa-check-circle',
            'failed': 'fas fa-exclamation-circle',
            'error': 'fas fa-times-circle',
            'success': 'fas fa-check-circle',
            'warning': 'fas fa-exclamation-triangle',
            'info': 'fas fa-info-circle'
        };
        return icons[status] || 'fas fa-question-circle';
    }
    
    getStatusText(status) {
        const statuses = {
            'processing': 'İşleniyor',
            'pending': 'Bekliyor',
            'completed': 'Tamamlandı',
            'failed': 'Başarısız',
            'error': 'Hata',
            'success': 'Başarılı',
            'warning': 'Uyarı',
            'info': 'Bilgi'
        };
        return statuses[status] || 'Bilinmeyen Durum';
    }
    
    getStatusColor(status) {
        return {
            'processing': 'warning',
            'pending': 'warning',
            'completed': 'success',
            'failed': 'danger'
        }[status] || 'secondary';
    }
    
    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        
        if (diff < 60000) return 'Az önce';
        if (diff < 3600000) return `${Math.floor(diff / 60000)} dakika önce`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)} saat önce`;
        if (diff < 604800000) return `${Math.floor(diff / 86400000)} gün önce`;
        
        return date.toLocaleDateString('tr-TR', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
    
    truncateText(text, maxLength) {
        if (!text || text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }
    
    escapeText(text) {
        if (!text) return '';
        return text.replace(/'/g, "\\'").replace(/"/g, '\\"').replace(/\n/g, '\\n');
    }
    
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            this.showNotification('Metin başarıyla kopyalandı', 'success');
        } catch (error) {
            this.showNotification('Kopyalama başarısız oldu', 'error');
        }
    }
    
    downloadText(text, filename) {
        const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        this.showNotification('Dosya başarıyla indirildi', 'success');
    }
    
    showLoading() {
        document.getElementById('loading-spinner').style.display = 'block';
        document.getElementById('history-list').style.display = 'none';
        document.getElementById('no-results').style.display = 'none';
    }
    
    hideLoading() {
        document.getElementById('loading-spinner').style.display = 'none';
    }
    
    showError(message) {
        this.showNotification(message, 'error');
    }
    
    /**
     * Attaches event listeners to history items for handling clicks
     * This uses event delegation for better performance with dynamic content
     */
    attachItemEventListeners() {
        const historyList = document.getElementById('history-list');
        if (!historyList) {
            console.warn('History list element not found for event delegation');
            return;
        }
        
        // Remove any existing click listeners to prevent duplicates
        historyList.removeEventListener('click', this.handleHistoryItemClick);
        
        // Add new click listener with event delegation
        historyList.addEventListener('click', this.handleHistoryItemClick);
    }
    
    /**
     * Handles click events on history items
     * @param {Event} event - The click event
     */
    handleHistoryItemClick(event) {
        // Find the closest history item element
        const historyItem = event.target.closest('.history-item');
        if (!historyItem) return;
        
        // Get the message ID from the data attribute
        const messageId = historyItem.getAttribute('data-message-id');
        if (!messageId) return;
        
        // Show the message modal
        this.showMessageModal(parseInt(messageId, 10));
    }
    
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `alert alert-${type === 'error' ? 'danger' : type} alert-dismissible fade show position-fixed`;
        notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
        notification.innerHTML = `${message}<button type="button" class="btn-close" data-bs-dismiss="alert"></button>`;
        document.body.appendChild(notification);
        setTimeout(() => { if (notification.parentNode) notification.remove(); }, 3000);
    }
    
    debounce(func, wait) {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }
}

// =================================================================================================
// 2.0 Global Başlatma
// =================================================================================================
document.addEventListener('DOMContentLoaded', () => {
    window.historyManager = new HistoryManager();
});
