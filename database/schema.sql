-- =============================================================================
-- Veritabanı Şeması: AI Haber Editörü
-- Sürüm: 1.1
-- Son Güncelleme: 2025-07-21
-- Açıklama: AI prompt ayarları, kullanıcı yönetimi ve işlem geçmişi için
--           gerekli tüm tablo yapılarını ve varsayılan verileri içerir.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- İçindekiler
-- -----------------------------------------------------------------------------
-- 1.0 Genel Ayarlar ve Veritabanı Oluşturma
-- 2.0 Tablo Tanımları
--     2.1 users: Kullanıcı bilgileri tablosu.
--     2.2 prompt_configs: Ana prompt yapılandırmaları.
--     2.3 prompt_sections: Prompt'un bölümleri (görev tanımı, stil vb.).
--     2.4 prompt_rules: Dinamik ayarlar/kurallar (kategori seçimi, etiket sayısı vb.).
--     2.5 prompt_rule_options: Seçenekli kurallar için şıklar.
--     2.6 user_prompt_settings: Kullanıcıların kişisel ayarları.
--     2.7 processing_history: İşlem geçmişi kaydı.
-- 3.0 Varsayılan Veri Ekleme (INSERT)
--     3.1 Varsayılan Prompt Konfigürasyonu
--     3.2 Varsayılan Prompt Bölümleri
--     3.3 Varsayılan Prompt Kuralları
--     3.4 Varsayılan Kural Seçenekleri
-- -----------------------------------------------------------------------------


-- =============================================================================
-- 1.0 GENEL AYARLAR VE VERİTABANI OLUŞTURMA
-- =============================================================================
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;
SET FOREIGN_KEY_CHECKS = 0; -- Toplu tablo oluşturma sırasında kısıtlamaları devre dışı bırak

CREATE DATABASE IF NOT EXISTS haber_editor CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE haber_editor;


-- =============================================================================
-- 2.0 TABLO TANIMLARI
-- =============================================================================

-- 2.1 Kullanıcılar Tablosu (`users`)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(100) UNIQUE NOT NULL COMMENT 'Benzersiz kullanıcı kimliği (örn: goktug_user_2025)',
    username VARCHAR(100) NOT NULL COMMENT 'Kullanıcı adı',
    email VARCHAR(255) UNIQUE COMMENT 'E-posta adresi',
    display_name VARCHAR(150) COMMENT 'Görünen ad',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE COMMENT 'Kullanıcının aktif olup olmadığını belirtir',
    
    INDEX idx_user_id (user_id),
    INDEX idx_username (username),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- 2.2 Ana Prompt Konfigürasyonları (`prompt_configs`)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS prompt_configs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE COMMENT 'Konfigürasyonun adı (örn: Default News Editor)',
    description TEXT COMMENT 'Konfigürasyonun açıklaması',
    is_active BOOLEAN DEFAULT FALSE COMMENT 'Sistemde aktif olarak kullanılıp kullanılmadığı',
    is_default BOOLEAN DEFAULT FALSE COMMENT 'Varsayılan konfigürasyon olup olmadığı',
    version VARCHAR(50) DEFAULT '1.0',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_is_active (is_active),
    INDEX idx_is_default (is_default)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- 2.3 Prompt Bölümleri (`prompt_sections`)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS prompt_sections (
    id INT AUTO_INCREMENT PRIMARY KEY,
    config_id INT NOT NULL,
    section_key VARCHAR(100) NOT NULL COMMENT 'Bölümün anahtarı (örn: gorev_tanimi)',
    section_name VARCHAR(255) NOT NULL COMMENT 'Bölümün kullanıcı arayüzünde görünen adı',
    prompt_text TEXT NOT NULL COMMENT 'AI''a gönderilecek olan prompt metni',
    display_order INT DEFAULT 0 COMMENT 'Arayüzdeki sıralaması',
    is_active BOOLEAN DEFAULT TRUE,
    
    FOREIGN KEY (config_id) REFERENCES prompt_configs(id) ON DELETE CASCADE,
    UNIQUE KEY unique_section_per_config (config_id, section_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- 2.4 Dinamik Prompt Kuralları (`prompt_rules`)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS prompt_rules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    config_id INT NOT NULL,
    rule_key VARCHAR(100) NOT NULL COMMENT 'Kuralın anahtarı (örn: targetCategory)',
    rule_name VARCHAR(255) NOT NULL COMMENT 'Kuralın arayüzde görünen adı',
    rule_type ENUM('select', 'toggle', 'text', 'multiselect') NOT NULL COMMENT 'Ayarın türü',
    rule_category VARCHAR(100) NOT NULL COMMENT 'Kuralın kategorisi (örn: content, privacy)',
    default_value TEXT COMMENT 'Varsayılan değeri',
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    
    FOREIGN KEY (config_id) REFERENCES prompt_configs(id) ON DELETE CASCADE,
    UNIQUE KEY unique_rule_per_config (config_id, rule_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- 2.5 Kural Seçenekleri (`prompt_rule_options`)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS prompt_rule_options (
    id INT AUTO_INCREMENT PRIMARY KEY,
    rule_id INT NOT NULL,
    option_key VARCHAR(100) NOT NULL COMMENT 'Seçeneğin anahtarı (örn: auto, Asayis)',
    option_label VARCHAR(255) NOT NULL COMMENT 'Seçeneğin arayüzde görünen etiketi',
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    
    FOREIGN KEY (rule_id) REFERENCES prompt_rules(id) ON DELETE CASCADE,
    UNIQUE KEY unique_option_per_rule (rule_id, option_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- 2.6 Kullanıcı Ayarları (`user_prompt_settings`)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_prompt_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL,
    config_id INT NOT NULL,
    rule_key VARCHAR(100) NOT NULL,
    setting_value TEXT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (config_id) REFERENCES prompt_configs(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_setting (user_id, config_id, rule_key)
);


-- 2.7 İşlem Geçmişi (`processing_history`)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS processing_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL,
    config_id INT,
    original_text MEDIUMTEXT NOT NULL,
    processed_text MEDIUMTEXT,
    settings_used JSON NOT NULL COMMENT 'İşlem sırasında kullanılan ayarların anlık görüntüsü',
    processing_status ENUM('pending', 'completed', 'failed') DEFAULT 'pending',
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (config_id) REFERENCES prompt_configs(id) ON DELETE SET NULL,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_user_history (user_id, created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =============================================================================
-- 3.0 VARSAYILAN VERİ EKLEME (INSERT)
-- =============================================================================

-- 3.1 Varsayılan Prompt Konfigürasyonu
-- -----------------------------------------------------------------------------
INSERT INTO prompt_configs (name, description, is_active, is_default, version) 
SELECT 'Default News Editor', 'Varsayılan haber editörü AI prompt konfigürasyonu', TRUE, TRUE, '1.1'
WHERE NOT EXISTS (SELECT 1 FROM prompt_configs WHERE name = 'Default News Editor');

SET @default_config_id = (SELECT id FROM prompt_configs WHERE name = 'Default News Editor' LIMIT 1);


-- 3.2 Varsayılan Prompt Bölümleri
-- -----------------------------------------------------------------------------
INSERT INTO prompt_sections (config_id, section_key, section_name, prompt_text, display_order) VALUES
(@default_config_id, 'gorev_tanimi', 'AI Editör Görev Tanımı', 'Sen, kurumsal bir gazetenin web sitesi için içerik üreten profesyonel bir yapay zeka editörüsün. Görevin, sana verilen orijinal haber metnini ve kuralları kullanarak, belirtilen JSON formatında profesyonel ve özgün bir haber içeriği oluşturmaktır.', 1),
(@default_config_id, 'ozgunluk', 'Özgünlük ve İçerik Koruma Kuralları', 'Metin tamamen yeniden yazılmalı, kopya olmamalıdır. Ancak orijinal haberdeki tüm temel bilgiler, veriler, isimler ve tarihler korunmalıdır.', 2),
(@default_config_id, 'kurumsal_dil', 'Yazım Stili ve Dil Kuralları', 'Kullanılacak dil resmi, profesyonel ve bilgilendirici olmalıdır. Argo veya clickbait ifadelerden kaçınılmalıdır.', 3),
(@default_config_id, 'ciktinin_formati', 'Çıktı Formatı ve Yapı Kuralları', 'Çıktı, yalnızca ve yalnızca geçerli bir JSON nesnesi olmalıdır. Cevabına asla açıklama veya ek metin ekleme, sadece JSON çıktısı ver.', 4),
(@default_config_id, 'etkili_baslik', 'Başlık Oluşturma Kuralları', 'Haberi net yansıtan, profesyonel, dikkat çekici, yanıltıcı olmayan bir başlık oluştur.', 5),
(@default_config_id, 'haber_ozeti', 'Özet Oluşturma Kuralları', 'Haberin en önemli noktalarını içeren, 2-3 cümlelik kısa bir özet yaz.', 6),
(@default_config_id, 'ozgun_haber_metni', 'Haber Metni Yeniden Yazma Kuralları', 'Tüm bilgileri koruyarak, metni özgün cümlelerle baştan yaz. İsimleri sansürle (örn: A.B.), özel şirket ve plaka bilgisi verme.', 7),
(@default_config_id, 'muhtemel_kategori', 'Kategori Belirleme Kuralları', 'Verilen kategori listesinden en uygun olanı seç: Asayiş, Gündem, Ekonomi, Siyaset, Spor, Teknoloji, Sağlık, Yaşam, Eğitim, Dünya, Kültür & Sanat, Magazin, Genel', 8),
(@default_config_id, 'etiketler', 'Etiket Oluşturma ve SEO Kuralları', 'Haberle ilgili, SEO uyumlu, belirtilen sayıda etiket oluştur ve bunları bir dizi (array) olarak listele.', 9)
ON DUPLICATE KEY UPDATE prompt_text=VALUES(prompt_text), section_name=VALUES(section_name);


-- 3.3 Varsayılan Prompt Kuralları
-- -----------------------------------------------------------------------------
INSERT INTO prompt_rules (config_id, rule_key, rule_name, rule_type, rule_category, default_value, display_order) VALUES
(@default_config_id, 'targetCategory', 'Hedef Kategori', 'select', 'content', 'auto', 1),
(@default_config_id, 'titleCityInfo', 'Başlıkta Şehir Bilgisi', 'toggle', 'content', 'False', 2),
(@default_config_id, 'removeCompanyInfo', 'Şirket Bilgisi Kaldır', 'toggle', 'privacy', 'True', 3),
(@default_config_id, 'tagCount', 'Etiket Sayısı', 'select', 'content', '5', 4),
(@default_config_id, 'customInstructions', 'Özel Talimatlar', 'text', 'content', '', 5),
(@default_config_id, 'outputFormat', 'Çıktı Formatı', 'select', 'format', 'json', 6)
ON DUPLICATE KEY UPDATE rule_name=VALUES(rule_name), default_value=VALUES(default_value);


-- 3.4 Varsayılan Kural Seçenekleri
-- -----------------------------------------------------------------------------
-- Bu bölüm, seçeneklerin tekrar tekrar eklenmesini önlemek için daha karmaşık bir mantık gerektirir.
-- Genellikle bir betik içinde yapılır, ancak burada basit bir DELETE/INSERT yaklaşımı kullanılabilir.
DELETE FROM prompt_rule_options WHERE rule_id IN (SELECT id FROM prompt_rules WHERE config_id = @default_config_id);

INSERT INTO prompt_rule_options (rule_id, option_key, option_label, display_order) VALUES
-- Hedef Kategori seçenekleri
((SELECT id FROM prompt_rules WHERE rule_key = 'targetCategory' AND config_id = @default_config_id), 'auto', 'Otomatik Seç', 1),
((SELECT id FROM prompt_rules WHERE rule_key = 'targetCategory' AND config_id = @default_config_id), 'Asayiş', 'Asayiş', 2),
((SELECT id FROM prompt_rules WHERE rule_key = 'targetCategory' AND config_id = @default_config_id), 'Gündem', 'Gündem', 3),
((SELECT id FROM prompt_rules WHERE rule_key = 'targetCategory' AND config_id = @default_config_id), 'Ekonomi', 'Ekonomi', 4),
((SELECT id FROM prompt_rules WHERE rule_key = 'targetCategory' AND config_id = @default_config_id), 'Spor', 'Spor', 5),
-- Etiket Sayısı seçenekleri
((SELECT id FROM prompt_rules WHERE rule_key = 'tagCount' AND config_id = @default_config_id), '3', '3 Etiket', 1),
((SELECT id FROM prompt_rules WHERE rule_key = 'tagCount' AND config_id = @default_config_id), '5', '5 Etiket', 2),
((SELECT id FROM prompt_rules WHERE rule_key = 'tagCount' AND config_id = @default_config_id), '7', '7 Etiket', 3),
-- Çıktı Formatı seçenekleri
((SELECT id FROM prompt_rules WHERE rule_key = 'outputFormat' AND config_id = @default_config_id), 'json', 'JSON', 1),
((SELECT id FROM prompt_rules WHERE rule_key = 'outputFormat' AND config_id = @default_config_id), 'text', 'Düz Metin', 2);


-- =============================================================================
-- SON
-- =============================================================================
SET FOREIGN_KEY_CHECKS = 1; -- Kısıtlamaları yeniden etkinleştir
