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
            this.showLoading();
            console.log('Bilgi: Geçmiş verileri API\'den yükleniyor...');
            
            const response = await fetch('/api/history?limit=1000');
            const data = await response.json();
            
            if (data.success) {
                this.allHistory = Array.isArray(data.history) ? data.history : [];
                this.filteredHistory = [...this.allHistory];
                this.totalItems = this.allHistory.length;
                console.log(`Bilgi: ${this.totalItems} adet geçmiş kaydı başarıyla yüklendi.`);
                this.renderHistory();
            } else {
                throw new Error(data.error || 'Bilinmeyen bir sunucu hatası oluştu.');
            }
        } catch (error) {
            console.error('Hata: Geçmiş verileri yüklenirken bir hata oluştu.', error);
            this.showError('Geçmiş yüklenirken bir hata oluştu. Lütfen bağlantınızı kontrol edin.');
        } finally {
            this.hideLoading();
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
        const historyList = document.getElementById('history-list');
        const noResults = document.getElementById('no-results');
        
        if (!historyList || !noResults) {
            console.error('Hata: Geçmiş listesi için gerekli DOM elemanları bulunamadı.');
            return;
        }
        
        if (this.filteredHistory.length === 0) {
            historyList.style.display = 'none';
            noResults.style.display = 'block';
            this.hidePagination();
            return;
        }
        
        historyList.style.display = 'block';
        noResults.style.display = 'none';
        
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const pageItems = this.filteredHistory.slice(startIndex, endIndex);
        
        historyList.innerHTML = pageItems.map(item => this.createHistoryItemHTML(item)).join('');
        this.renderPagination();
    }
    
    /**
     * 1.9 createHistoryItemHTML()
     * Tek bir geçmiş öğesi için HTML içeriğini oluşturur.
     * @param {object} item - Geçmiş öğesi verisi.
     * @returns {string} - Oluşturulan HTML metni.
     */
    createHistoryItemHTML(item) {
        if (!item) return '';
        
        const statusIcon = this.getStatusIcon(item.status);
        const statusText = this.getStatusText(item.status);
        const formattedDate = this.formatDate(item.created_at);
        const truncatedText = this.truncateText(item.original_text || '', 150);
        
        return `
            <div class="history-item ${item.read_status === 'unread' ? 'unread' : ''}" onclick="historyManager.showMessageModal(${item.id})">
                <div class="history-item-content">
                    <div class="history-item-icon ${item.status}"><i class="${statusIcon}"></i></div>
                    <div class="history-item-body">
                        <div class="history-item-header">
                            <h5 class="history-item-title">${truncatedText}</h5>
                            <div class="history-item-meta">
                                <span class="history-status ${item.status}">${statusText}</span>
                                <span class="history-date">${formattedDate}</span>
                                ${item.read_status === 'unread' ? '<div class="unread-indicator"></div>' : ''}
                            </div>
                        </div>
                        <div class="history-item-text">${truncatedText}</div>
                    </div>
                </div>
            </div>
        `;
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
            const message = this.allHistory.find(item => item.id === messageId);
            if (!message) return;
            
            this.currentModal = message;
            this.updateModalContent(message);
            
            new bootstrap.Modal(document.getElementById('messageModal')).show();
            
            if (message.read_status === 'unread') {
                await this.markAsRead(messageId);
                message.read_status = 'read';
                this.renderHistory();
                this.loadStatistics();
            }
        } catch (error) {
            console.error('Hata: Mesaj detayı modalı gösterilemedi.', error);
            this.showNotification('Mesaj yüklenirken hata oluştu', 'error');
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
    async markAsRead(messageId) {
        try {
            await fetch(`/api/mark-as-read/${messageId}`, { method: 'POST' });
        } catch (error) {
            console.error('Hata: Mesaj okundu olarak işaretlenemedi.', error);
        }
    }
    
    /**
     * 1.16 Yardımcı Metotlar
     * Durum, ikon, metin, tarih formatlama gibi küçük yardımcı fonksiyonlar.
     */
    getStatusIcon(status) {
        return {
            'processing': 'fas fa-spinner fa-spin',
            'pending': 'fas fa-clock',
            'completed': 'fas fa-check-circle',
            'failed': 'fas fa-exclamation-circle'
        }[status] || 'fas fa-question-circle';
    }
    
    getStatusText(status) {
        return {
            'processing': 'İşleniyor',
            'pending': 'İşleniyor',
            'completed': 'Cevap Geldi',
            'failed': 'Hata'
        }[status] || status;
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
