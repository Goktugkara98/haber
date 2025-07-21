/**
 * @file navbar.js
 * @description Bu dosya, uygulamanın üst navigasyon çubuğu (navbar) bileşenini yönetir.
 * Sayfa gezintisi, tema değiştirme, yardım ve ayarlar gibi eylemleri içerir.
 *
 * İçindekiler:
 * 1.0 - Bileşen Başlatma ve Olay Yönetimi
 * 2.0 - Navigasyon ve Etkileşimler
 * 3.0 - Görsel Efektler ve Animasyonlar
 * 4.0 - Yardımcı Fonksiyonlar ve Modallar
 * 5.0 - Tema ve Durum Yönetimi
 */

const NavbarComponent = {
    elements: {}, // DOM elementleri için cache nesnesi

    // 1.0 - Bileşen Başlatma ve Olay Yönetimi

    /**
     * Bileşeni başlatır, DOM elementlerini cache'ler ve olayları bağlar.
     */
    init: function() {
        this.cacheElements();
        this.bindEvents();
        this.setupScrollEffect();
        this.setupActiveNavigation();
        console.log('Navigasyon Çubuğu (NavbarComponent) bileşeni başlatıldı.');
    },

    /**
     * Gerekli DOM elementlerini seçer ve `elements` nesnesinde saklar.
     */
    cacheElements: function() {
        this.elements = {
            navbar: document.querySelector('.custom-navbar'),
            navLinks: document.querySelectorAll('.navbar-nav-link'),
            actionBtns: document.querySelectorAll('.navbar-action-btn'),
            helpBtn: document.querySelector('.navbar-action-btn[title="Yardım"]'),
            settingsBtn: document.querySelector('.navbar-action-btn[title="Ayarlar"]'),
            themeBtn: document.querySelector('.navbar-action-btn.theme-btn'),
            mobileToggle: document.querySelector('.mobile-menu-toggle'),
            brandIcon: document.querySelector('.navbar-brand-icon')
        };
    },

    /**
     * Gerekli olay dinleyicilerini (event listeners) bağlar.
     */
    bindEvents: function() {
        this.elements.navLinks.forEach(link => {
            link.addEventListener('click', this.handleNavClick.bind(this));
        });

        if (this.elements.helpBtn) {
            this.elements.helpBtn.addEventListener('click', this.showHelp.bind(this));
        }

        if (this.elements.settingsBtn) {
            this.elements.settingsBtn.addEventListener('click', this.openSettings.bind(this));
        }

        if (this.elements.themeBtn) {
            this.elements.themeBtn.addEventListener('click', this.toggleTheme.bind(this));
        }

        if (this.elements.mobileToggle) {
            this.elements.mobileToggle.addEventListener('click', this.toggleMobileMenu.bind(this));
        }
    },

    // 2.0 - Navigasyon ve Etkileşimler

    /**
     * Navigasyon linklerine tıklandığında çalışır.
     */
    handleNavClick: function(e) {
        // Eğer link sadece bir placeholder ise (href="#"), varsayılan davranışı engelle
        if (e.target.closest('a').getAttribute('href') === '#') {
            e.preventDefault();
            this.showComingSoon(e.target.textContent.trim());
        }
        
        this.setActiveNavItem(e.target.closest('a'));
    },

    /**
     * Tıklanan navigasyon öğesini "aktif" olarak işaretler.
     * @param {HTMLElement} activeLink - Aktif hale getirilecek link elementi.
     */
    setActiveNavItem: function(activeLink) {
        this.elements.navLinks.forEach(link => {
            link.classList.remove('active');
        });
        
        if (activeLink) {
            activeLink.classList.add('active');
        }
    },

    /**
     * Sayfa yüklendiğinde mevcut URL'e göre doğru navigasyon öğesini aktif hale getirir.
     */
    setupActiveNavigation: function() {
        const currentPath = window.location.pathname;
        
        this.elements.navLinks.forEach(link => {
            const href = link.getAttribute('href');
            
            if (href === currentPath || (currentPath === '/' && href === '/')) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    },

    /**
     * Mobil menüyü açar veya kapatır.
     */
    toggleMobileMenu: function() {
        const navSection = document.querySelector('.navbar-nav-section');
        
        if (navSection) {
            navSection.classList.toggle('mobile-active');
        }
        
        this.animateActionButton(this.elements.mobileToggle);
    },

    // 3.0 - Görsel Efektler ve Animasyonlar

    /**
     * Sayfa kaydırıldığında navbar'a gölge efekti ekler.
     */
    setupScrollEffect: function() {
        window.addEventListener('scroll', () => {
            if (this.elements.navbar) {
                if (window.scrollY > 50) {
                    this.elements.navbar.classList.add('scrolled');
                } else {
                    this.elements.navbar.classList.remove('scrolled');
                }
            }
        });
    },

    /**
     * Tıklanan bir eylem butonuna (yardım, ayarlar vb.) animasyon uygular.
     * @param {HTMLElement} button - Animasyon uygulanacak buton elementi.
     */
    animateActionButton: function(button) {
        if (!button || typeof gsap === 'undefined') return;
        
        gsap.fromTo(button, 
            { scale: 1 },
            { 
                scale: 1.2,
                duration: 0.1,
                yoyo: true,
                repeat: 1,
                ease: 'power2.inOut'
            }
        );
    },

    // 4.0 - Yardımcı Fonksiyonlar ve Modallar

    /**
     * Yardım içeriğini bir bildirim olarak gösterir.
     */
    showHelp: function() {
        const helpContent = `
            <div class="help-content">
                <h5><i class="fas fa-question-circle me-2"></i>Yardım Menüsü</h5>
                <div class="help-section">
                    <h6>Klavye Kısayolları:</h6>
                    <ul>
                        <li><kbd>Ctrl + Enter</kbd> - Metni İşle</li>
                        <li><kbd>Ctrl + S</kbd> - Ayarları Kaydet</li>
                    </ul>
                </div>
            </div>
        `;
        
        if (typeof Utils !== 'undefined') {
            Utils.showNotification(helpContent, 'info', 8000);
        }
        
        this.animateActionButton(this.elements.helpBtn);
    },

    /**
     * Ayarlar panelini açar (gelecekte eklenecek).
     */
    openSettings: function() {
        if (typeof Utils !== 'undefined') {
            Utils.showNotification('Ayarlar paneli yakında eklenecektir.', 'info', 3000);
        }
        
        this.animateActionButton(this.elements.settingsBtn);
    },

    /**
     * Henüz tamamlanmamış özellikler için bir bildirim gösterir.
     * @param {string} feature - Özelliğin adı.
     */
    showComingSoon: function(feature) {
        if (typeof Utils !== 'undefined') {
            Utils.showNotification(`'${feature}' özelliği yakında eklenecektir.`, 'info', 3000);
        }
    },

    // 5.0 - Tema ve Durum Yönetimi

    /**
     * Açık ve koyu tema arasında geçiş yapar.
     */
    toggleTheme: function() {
        const currentTheme = document.body.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        document.body.setAttribute('data-theme', newTheme);
        
        // Tema butonu ikonunu güncelle
        if (this.elements.themeBtn) {
            this.elements.themeBtn.classList.toggle('active', newTheme === 'dark');
        }
        
        // Tema tercihini kaydet
        if (typeof Utils !== 'undefined') {
            Utils.storage.set('theme', newTheme);
            Utils.showNotification(`${newTheme === 'dark' ? 'Karanlık' : 'Aydınlık'} tema etkinleştirildi.`, 'success', 2000);
        }
        
        this.animateActionButton(this.elements.themeBtn);
    },

    /**
     * Kaydedilmiş tema tercihini yükler ve uygular.
     */
    loadSavedTheme: function() {
        if (typeof Utils !== 'undefined') {
            const savedTheme = Utils.storage.get('theme', 'light');
            document.body.setAttribute('data-theme', savedTheme);
            
            if (savedTheme === 'dark' && this.elements.themeBtn) {
                this.elements.themeBtn.classList.add('active');
            }
        }
    },

    /**
     * Bir eylem butonunun üzerine bildirim rozeti (badge) ekler.
     * @param {string} buttonType - Butonun tipi ('help', 'settings' vb.).
     * @param {number} count - Rozette gösterilecek sayı.
     */
    showNotificationBadge: function(buttonType, count = 1) {
        const button = this.elements[buttonType + 'Btn'];
        if (!button) return;
        
        let badge = button.querySelector('.notification-badge');
        if (!badge) {
            badge = document.createElement('span');
            badge.className = 'notification-badge';
            button.appendChild(badge);
        }
        
        badge.textContent = count > 9 ? '9+' : count;
        
        // GSAP ile animasyon
        if (typeof gsap !== 'undefined') {
            gsap.from(badge, { scale: 0, duration: 0.3, ease: 'back.out(1.7)' });
        }
    },

    /**
     * Bir butondaki bildirim rozetini kaldırır.
     * @param {string} buttonType - Butonun tipi.
     */
    hideNotificationBadge: function(buttonType) {
        const button = this.elements[buttonType + 'Btn'];
        if (!button) return;
        
        const badge = button.querySelector('.notification-badge');
        if (badge) {
            if (typeof gsap !== 'undefined') {
                gsap.to(badge, { scale: 0, duration: 0.2, ease: 'power2.in', onComplete: () => badge.remove() });
            } else {
                badge.remove();
            }
        }
    }
};

// DOM yüklendiğinde bileşeni başlat ve temayı yükle
document.addEventListener('DOMContentLoaded', function() {
    NavbarComponent.init();
    NavbarComponent.loadSavedTheme();
});

// Bileşeni global `window` nesnesine ekle
window.NavbarComponent = NavbarComponent;
