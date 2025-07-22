/**
 * @file statistics.js
 * @description Bu dosya, uygulama genelindeki işlem istatistiklerini
 * (bekleyen, tamamlanan, hatalı) ve işlem geçmişini yöneten sınıfı içerir.
 * API'den periyodik olarak veri çeker ve arayüzü günceller.
 *
 * İçindekiler:
 * 1.0 - Sınıf Başlatma ve Yapılandırma
 * 2.0 - İstatistik Yönetimi
 * 3.0 - Geçmiş Paneli Yönetimi
 * 4.0 - Geçmiş Öğesi Eylemleri ve Modal
 * 5.0 - Yardımcı Fonksiyonlar ve Bildirimler
 */

class StatisticsManager {
    // 1.0 - Sınıf Başlatma ve Yapılandırma

    /**
     * StatisticsManager sınıfının yapıcı metodu.
     */
    constructor() {
        this.isHistoryPanelOpen = false;
        this.statsUpdateInterval = null;
        this.init();
    }

    /**
     * Sınıfı başlatır, ilk istatistikleri yükler ve periyodik güncellemeyi ayarlar.
     */
    init() {
        this.loadStatistics();
        
        // İstatistikleri her 30 saniyede bir otomatik olarak güncelle
        this.statsUpdateInterval = setInterval(() => this.loadStatistics(), 30000);
        
        this.initializeTooltips();
        console.log('İstatistik Yöneticisi (StatisticsManager) başlatıldı.');
    }

    /**
     * Sınıf yok edildiğinde periyodik güncellemeyi temizler.
     */
    destroy() {
        if (this.statsUpdateInterval) {
            clearInterval(this.statsUpdateInterval);
            console.log('İstatistik Yöneticisi periyodik güncellemesi durduruldu.');
        }
    }

    // 2.0 - İstatistik Yönetimi

    /**
     * API'den genel işlem istatistiklerini asenkron olarak çeker.
     */
    async loadStatistics() {
        try {
            const response = await fetch(AppConfig.apiEndpoints.getStatistics);
            const data = await response.json();
            
            if (data.success) {
                this.updateStatisticsDisplay(data.statistics);
            } else {
                console.error('İstatistikler yüklenemedi:', data.error);
            }
        } catch (error) {
            console.error('İstatistikler çekilirken ağ hatası oluştu:', error);
        }
    }

    /**
     * Çekilen istatistik verileriyle arayüzdeki sayıları günceller.
     * @param {Object} stats - API'den gelen istatistik nesnesi.
     */
    updateStatisticsDisplay(stats) {
        const elements = {
            pending: document.getElementById('pendingCount'),
            completed: document.getElementById('completedCount'),
            failed: document.getElementById('failedCount'),
            total: document.getElementById('totalCount')
        };

        Object.keys(elements).forEach(key => {
            const element = elements[key];
            const newValue = stats[key] || 0;
            
            if (element && element.textContent !== newValue.toString()) {
                element.textContent = newValue;
                // Değişikliği vurgulamak için kısa bir animasyon sınıfı ekle
                element.classList.add('updated');
                setTimeout(() => element.classList.remove('updated'), 500);
            }
        });
    }

    // 3.0 - Geçmiş Paneli Yönetimi

    /**
     * Geçmiş panelini açar veya kapatır.
     */
    async toggleHistoryPanel() {
        const panel = document.getElementById('historyPanel');
        if (!panel) return;

        this.isHistoryPanelOpen = !this.isHistoryPanelOpen;
        panel.classList.toggle('open', this.isHistoryPanelOpen);

        if (this.isHistoryPanelOpen) {
            console.log('Geçmiş paneli açıldı.');
            await this.loadHistory();
        } else {
            console.log('Geçmiş paneli kapatıldı.');
        }
    }

    /**
     * API'den işlem geçmişini çeker ve ekrana render eder.
     */
    async loadHistory() {
        const historyList = document.getElementById('history-list');
        if (!historyList) return;
        historyList.innerHTML = '<div class="history-loading">Geçmiş yükleniyor...</div>';

        try {
            const response = await fetch(AppConfig.apiEndpoints.getHistory);
            const data = await response.json();
            
            if (data.success) {
                this.renderHistory(data.history);
            } else {
                this.showHistoryError(data.error || 'Geçmiş yüklenemedi.');
            }
        } catch (error) {
            console.error('Geçmiş yüklenirken hata oluştu:', error);
            this.showHistoryError('Ağ hatası oluştu. Lütfen tekrar deneyin.');
        }
    }

    /**
     * Geçmiş verisini HTML formatında ekrana basar.
     * @param {Array<Object>} history - Geçmiş işlemlerini içeren dizi.
     */
    renderHistory(history) {
        const historyList = document.getElementById('history-list');
        if (!historyList) return;
        
        if (history.length === 0) {
            historyList.innerHTML = '<div class="no-history">Henüz işlenmiş bir haber bulunmuyor.</div>';
            return;
        }
        
        historyList.innerHTML = history.map(item => this.createHistoryItemHTML(item)).join('');
    }

    /**
     * Tek bir geçmiş öğesi için HTML oluşturur.
     * @param {Object} item - Geçmiş öğesi verisi.
     * @returns {string} - Oluşturulan HTML.
     */
    createHistoryItemHTML(item) {
        const isUnread = item.read_status === 'unread';
        return `
            <div class="history-item ${isUnread ? 'unread' : 'read'}" data-id="${item.id}">
                <div class="history-content" onclick="statisticsManager.showMessageModal(${item.id})">
                    <div class="history-text">${this.truncateText(item.original_text, 80)}</div>
                    <div class="history-meta">
                        <span class="history-status status-${item.status}">${this.getStatusText(item.status)}</span>
                        <span class="history-date">${this.formatDate(item.created_at)}</span>
                        ${isUnread ? '<span class="unread-indicator" title="Okunmadı">●</span>' : ''}
                    </div>
                </div>
                <div class="history-actions">
                    <button class="btn-action" onclick="event.stopPropagation(); statisticsManager.refreshStatus(${item.id})" title="Yenile"><i class="fas fa-sync-alt"></i></button>
                    ${item.processed_text ? `<button class="btn-action" onclick="event.stopPropagation(); statisticsManager.copyText('${this.escapeText(item.processed_text)}')" title="Kopyala"><i class="fas fa-copy"></i></button>` : ''}
                </div>
            </div>
        `;
    }

    // 4.0 - Geçmiş Öğesi Eylemleri ve Modal

    /**
     * Belirli bir geçmiş öğesinin detaylarını gösteren bir modal açar.
     * @param {number} messageId - Gösterilecek mesajın ID'si.
     */
    async showMessageModal(messageId) {
        try {
            // Not: Normalde tek bir öğe çekmek daha verimli olurdu. API varsayımı ile devam ediliyor.
            const response = await fetch(`/api/history`);
            const data = await response.json();
            
            if (data.success) {
                const message = data.history.find(item => item.id === messageId);
                if (message) {
                    this.openMessageModal(message);
                    if (message.read_status === 'unread') {
                        await this.markAsRead(messageId);
                    }
                }
            }
        } catch (error) {
            console.error('Mesaj detayı yüklenirken hata:', error);
            this.showNotification('Mesaj detayı yüklenemedi.', 'error');
        }
    }
    
    /**
     * Mesaj detay modalını oluşturur ve ekrana ekler.
     * @param {Object} message - Gösterilecek mesaj verisi.
     */
    openMessageModal(message) {
        this.closeMessageModal(); // Önceki modalı kapat
        const modalHtml = `
            <div class="message-modal-overlay" onclick="statisticsManager.closeMessageModal()">
                <div class="message-modal" onclick="event.stopPropagation()">
                    <div class="modal-header">
                        <h3>Haber İşlem Detayı</h3>
                        <button class="modal-close" onclick="statisticsManager.closeMessageModal()">×</button>
                    </div>
                    <div class="modal-body">
                        <div class="message-section"><h4>Orijinal Metin:</h4><div class="message-text">${message.original_text}</div></div>
                        ${message.prompt_text ? `<div class="message-section"><h4>Gönderilen Prompt:</h4><div class="message-text prompt">${message.prompt_text}</div></div>` : ''}
                        ${message.processed_text ? `<div class="message-section"><h4>AI Cevabı:</h4><div class="message-text response">${message.processed_text}</div></div>` : '<div class="message-section"><p>AI cevabı henüz hazır değil veya bir hata oluştu.</p></div>'}
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }
    
    /**
     * Açık olan mesaj detay modalını kapatır.
     */
    closeMessageModal() {
        const modal = document.querySelector('.message-modal-overlay');
        if (modal) {
            modal.remove();
            // Okundu durumunu yansıtmak için listeyi ve istatistikleri yenile
            this.loadHistory();
            this.loadStatistics();
        }
    }
    
    /**
     * Bir mesajı "okundu" olarak işaretlemek için API'ye istek gönderir.
     * @param {number} messageId - Okundu olarak işaretlenecek mesajın ID'si.
     */
    async markAsRead(messageId) {
        try {
            await fetch(`${AppConfig.apiEndpoints.markAsRead}/${messageId}`, { method: 'POST' });
            console.log(`Mesaj #${messageId} okundu olarak işaretlendi.`);
        } catch (error) {
            console.error('Mesaj okundu olarak işaretlenirken hata:', error);
        }
    }

    /**
     * Bir işlemin durumunu manuel olarak yenilemek için API'ye istek gönderir.
     * @param {number} itemId - Yenilenecek işlemin ID'si.
     */
    async refreshStatus(itemId) {
        this.showNotification(`İşlem #${itemId} durumu yenileniyor...`, 'info');
        await this.checkProcessingStatus(itemId);
    }
    
    // 5.0 - Yardımcı Fonksiyonlar ve Bildirimler

    /**
     * Bir metni panoya kopyalar.
     * @param {string} text - Kopyalanacak metin.
     */
    copyText(text) {
        navigator.clipboard.writeText(text).then(() => {
            this.showNotification('Metin başarıyla panoya kopyalandı.', 'success');
        }).catch(err => {
            this.showNotification('Kopyalama başarısız oldu.', 'error');
            console.error('Kopyalama hatası:', err);
        });
    }

    /**
     * Verilen metni .txt olarak indirir.
     * @param {string} text - İndirilecek metin.
     */
    downloadText(text) {
        const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `islenmis_metin_${Date.now()}.txt`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
        this.showNotification('Dosya indiriliyor...', 'success');
    }

    /**
     * Geçmiş listesinde bir hata mesajı gösterir.
     * @param {string} message - Gösterilecek hata mesajı.
     */
    showHistoryError(message) {
        const listElement = document.getElementById('history-list');
        if(listElement) {
            listElement.innerHTML = `<div class="no-history error">${message}</div>`;
        }
    }
    
    /**
     * Ekranda geçici bir bildirim mesajı gösterir.
     * @param {string} message - Bildirim metni.
     * @param {string} type - Bildirim tipi ('info', 'success', 'error').
     */
    showNotification(message, type = 'info') {
        // Bu fonksiyonun global bir Utils nesnesinde olması daha iyi olabilir.
        // Şimdilik burada bırakıyorum.
        if(window.Utils && window.Utils.showNotification) {
            window.Utils.showNotification(message, type);
        } else {
            alert(message); // Fallback
        }
    }

    /**
     * Bootstrap tooltip'lerini başlatır.
     */
    initializeTooltips() {
        const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
        if (typeof bootstrap !== 'undefined' && bootstrap.Tooltip) {
            [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));
        }
    }

    // Yardımcı metin ve formatlama fonksiyonları
    getStatusText = (status) => ({ 'processing': 'İşleniyor', 'completed': 'Tamamlandı', 'failed': 'Hata', 'pending': 'Bekliyor' }[status] || status);
    formatDate = (dateStr) => new Date(dateStr).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
    truncateText = (text, len) => text.length > len ? text.substring(0, len) + '...' : text;
    escapeText = (text) => text ? text.replace(/'/g, "\\'").replace(/"/g, '\\"').replace(/\n/g, '\\n') : '';
}

// Global erişim için bir örnek oluşturma
document.addEventListener('DOMContentLoaded', function() {
    window.statisticsManager = new StatisticsManager();
});
