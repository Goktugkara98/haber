-- Set character set and collation for the database
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- AI Prompt Settings Database Schema
-- Extensible structure for managing AI prompt rules and configurations

-- Set default character set and collation for the database
CREATE DATABASE IF NOT EXISTS haber_editor CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE haber_editor;

-- Main prompt configurations table
CREATE TABLE IF NOT EXISTS prompt_configs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT FALSE,
    is_default BOOLEAN DEFAULT FALSE,
    version VARCHAR(50) DEFAULT '1.0',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    
    INDEX idx_active (is_active),
    INDEX idx_default (is_default),
    INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Prompt sections (gorev_tanimi, ozgunluk, etc.)
CREATE TABLE IF NOT EXISTS prompt_sections (
    id INT AUTO_INCREMENT PRIMARY KEY,
    config_id INT NOT NULL,
    section_key VARCHAR(100) NOT NULL,
    section_name VARCHAR(255) NOT NULL,
    section_description TEXT,
    prompt_text TEXT NOT NULL,
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (config_id) REFERENCES prompt_configs(id) ON DELETE CASCADE,
    UNIQUE KEY unique_section_per_config (config_id, section_key),
    INDEX idx_config_section (config_id, section_key),
    INDEX idx_active (is_active),
    INDEX idx_order (display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dynamic prompt rules/settings
CREATE TABLE IF NOT EXISTS prompt_rules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    config_id INT NOT NULL,
    rule_key VARCHAR(100) NOT NULL,
    rule_name VARCHAR(255) NOT NULL,
    rule_type ENUM('select', 'toggle', 'range', 'text', 'multiselect') NOT NULL,
    rule_category VARCHAR(100) NOT NULL, -- 'general', 'content', 'output'
    default_value TEXT,
    validation_rules JSON, -- For validation constraints
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (config_id) REFERENCES prompt_configs(id) ON DELETE CASCADE,
    UNIQUE KEY unique_rule_per_config (config_id, rule_key),
    INDEX idx_config_rule (config_id, rule_key),
    INDEX idx_category (rule_category),
    INDEX idx_active (is_active),
    INDEX idx_order (display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Rule options for select/multiselect rules
CREATE TABLE IF NOT EXISTS prompt_rule_options (
    id INT AUTO_INCREMENT PRIMARY KEY,
    rule_id INT NOT NULL,
    option_key VARCHAR(100) NOT NULL,
    option_label VARCHAR(255) NOT NULL,
    option_description TEXT,
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (rule_id) REFERENCES prompt_rules(id) ON DELETE CASCADE,
    UNIQUE KEY unique_option_per_rule (rule_id, option_key),
    INDEX idx_rule_option (rule_id, option_key),
    INDEX idx_active (is_active),
    INDEX idx_order (display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User prompt preferences/settings
CREATE TABLE IF NOT EXISTS user_prompt_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL, -- Can be session ID or user ID
    config_id INT NOT NULL,
    rule_key VARCHAR(100) NOT NULL,
    setting_value TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (config_id) REFERENCES prompt_configs(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_setting (user_id, config_id, rule_key),
    INDEX idx_user_config (user_id, config_id),
    INDEX idx_user_rule (user_id, rule_key)
);

-- Processing history
CREATE TABLE IF NOT EXISTS processing_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL,
    config_id INT NULL,
    original_text TEXT NOT NULL,
    processed_text TEXT,
    settings_used JSON NOT NULL, -- Snapshot of settings used
    processing_status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
    processing_time_ms INT DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    
    FOREIGN KEY (config_id) REFERENCES prompt_configs(id) ON DELETE SET NULL,
    INDEX idx_user_history (user_id, created_at DESC),
    INDEX idx_status (processing_status),
    INDEX idx_config (config_id),
    INDEX idx_created (created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- Insert default prompt configuration
INSERT INTO prompt_configs (name, description, is_active, is_default, version, created_by) 
VALUES ('Default News Editor', 'Varsayılan haber editörü AI prompt konfigürasyonu', TRUE, TRUE, '1.0', 'system');

-- Get the config ID for default configuration
SET @default_config_id = LAST_INSERT_ID();

-- Insert default prompt sections
INSERT INTO prompt_sections (config_id, section_key, section_name, section_description, prompt_text, display_order) VALUES
(@default_config_id, 'gorev_tanimi', 'AI Editör Görev Tanımı', 'Ana görev tanımı ve editör rolü', 'Sen, kurumsal bir gazetenin web sitesi için içerik üreten profesyonel bir yapay zeka editörüsün. Görevin, sana verilen orijinal haber metnini ve kuralları kullanarak, belirtilen JSON formatında profesyonel ve özgün bir haber içeriği oluşturmaktır.', 1),
(@default_config_id, 'ozgunluk', 'Özgünlük ve İçerik Koruma Kuralları', 'Özgünlük ve bilgi koruma kuralları', 'Metin tamamen yeniden yazılmalı, kopya olmamalıdır. Ancak orijinal haberdeki tüm temel bilgiler, veriler, isimler ve tarihler korunmalıdır.', 2),
(@default_config_id, 'kurumsal_dil', 'Yazım Stili ve Dil Kuralları', 'Kurumsal dil ve yazım stili kuralları', 'Kullanılacak dil resmi, profesyonel ve bilgilendirici olmalıdır. Argo veya clickbait ifadelerden kaçınılmalıdır.', 3),
(@default_config_id, 'ciktinin_formati', 'Çıktı Formatı ve Yapı Kuralları', 'Çıktı formatı ve yapı gereksinimleri', 'Çıktı, yalnızca ve yalnızca ''cikti_formati_json'' içinde belirtilen yapıya uygun, geçerli bir JSON nesnesi olmalıdır. Cevabına asla açıklama veya ek metin ekleme, sadece JSON çıktısı ver.', 4),
(@default_config_id, 'etkili_baslik', 'Başlık Oluşturma Kuralları', 'Etkili başlık oluşturma kuralları', 'Haberi net yansıtan, profesyonel, dikkat çekici, yanıltıcı olmayan, şehir bilgisi içermeyen bir başlık.', 5),
(@default_config_id, 'haber_ozeti', 'Özet Oluşturma Kuralları', 'Haber özeti oluşturma kuralları', 'Haberin en önemli noktalarını içeren, 2-3 cümlelik, şehir bilgisi içeren kısa bir özet.', 6),
(@default_config_id, 'ozgun_haber_metni', 'Haber Metni Yeniden Yazma Kuralları', 'Özgün haber metni yazma kuralları', 'Tüm bilgileri koruyarak, metni özgün cümlelerle baştan yaz. İsimleri sansürle (örn: A.B.), özel şirket ve plaka bilgisi verme.', 7),
(@default_config_id, 'muhtemel_kategori', 'Kategori Belirleme Kuralları', 'Kategori seçimi ve belirleme kuralları', 'Verilen kategori listesinden en uygun olanı seç: Asayiş, Gündem, Ekonomi, Siyaset, Spor, Teknoloji, Sağlık, Yaşam, Eğitim, Dünya, Kültür & Sanat, Magazin, Genel', 8),
(@default_config_id, 'etiketler', 'Etiket Oluşturma ve SEO Kuralları', 'Etiket oluşturma ve SEO kuralları', 'Haberle ilgili, SEO uyumlu 5 adet etiket oluştur ve bunları bir dizi (array) olarak listele.', 9);

-- Insert default prompt rules
INSERT INTO prompt_rules (config_id, rule_key, rule_name, rule_type, rule_category, default_value, validation_rules, display_order) VALUES
(@default_config_id, 'targetCategory', 'Hedef Kategori', 'select', 'general', 'auto', '{"required": true}', 1),
(@default_config_id, 'writingStyle', 'Yazım Stili', 'select', 'general', 'formal', '{"required": true}', 2),
(@default_config_id, 'titleCityInfo', 'Başlıkta Şehir Bilgisi', 'select', 'content', 'exclude', '{"required": true}', 3),
(@default_config_id, 'nameCensorship', 'İsim Sansürleme', 'select', 'content', 'initials', '{"required": true}', 4),
(@default_config_id, 'removeCompanyInfo', 'Şirket Bilgilerini Kaldır', 'toggle', 'content', 'false', '{}', 5),
(@default_config_id, 'removePlateInfo', 'Plaka Bilgilerini Kaldır', 'toggle', 'content', 'false', '{}', 6),
(@default_config_id, 'outputFormat', 'Çıktı Formatı', 'select', 'output', 'json', '{"required": true}', 7),
(@default_config_id, 'tagCount', 'Etiket Sayısı', 'select', 'output', '5', '{"required": true, "min": 1, "max": 10}', 8),
(@default_config_id, 'customInstructions', 'Özel Talimatlar', 'text', 'output', '', '{"maxLength": 500}', 9);

-- Insert rule options
INSERT INTO prompt_rule_options (rule_id, option_key, option_label, option_description, display_order) VALUES
-- Target Category options
((SELECT id FROM prompt_rules WHERE rule_key = 'targetCategory' AND config_id = @default_config_id), 'auto', 'Otomatik Belirleme', 'AI otomatik olarak kategori belirler', 1),
((SELECT id FROM prompt_rules WHERE rule_key = 'targetCategory' AND config_id = @default_config_id), 'Asayiş', 'Asayiş', 'Güvenlik ve asayiş haberleri', 2),
((SELECT id FROM prompt_rules WHERE rule_key = 'targetCategory' AND config_id = @default_config_id), 'Gündem', 'Gündem', 'Güncel olaylar ve haberler', 3),
((SELECT id FROM prompt_rules WHERE rule_key = 'targetCategory' AND config_id = @default_config_id), 'Ekonomi', 'Ekonomi', 'Ekonomi ve finans haberleri', 4),
((SELECT id FROM prompt_rules WHERE rule_key = 'targetCategory' AND config_id = @default_config_id), 'Siyaset', 'Siyaset', 'Siyasi haberler ve gelişmeler', 5),
((SELECT id FROM prompt_rules WHERE rule_key = 'targetCategory' AND config_id = @default_config_id), 'Spor', 'Spor', 'Spor haberleri ve sonuçları', 6),
((SELECT id FROM prompt_rules WHERE rule_key = 'targetCategory' AND config_id = @default_config_id), 'Teknoloji', 'Teknoloji', 'Teknoloji ve inovasyon haberleri', 7),
((SELECT id FROM prompt_rules WHERE rule_key = 'targetCategory' AND config_id = @default_config_id), 'Sağlık', 'Sağlık', 'Sağlık ve tıp haberleri', 8),
((SELECT id FROM prompt_rules WHERE rule_key = 'targetCategory' AND config_id = @default_config_id), 'Yaşam', 'Yaşam', 'Yaşam tarzı ve sosyal haberler', 9),
((SELECT id FROM prompt_rules WHERE rule_key = 'targetCategory' AND config_id = @default_config_id), 'Eğitim', 'Eğitim', 'Eğitim ve öğretim haberleri', 10),
((SELECT id FROM prompt_rules WHERE rule_key = 'targetCategory' AND config_id = @default_config_id), 'Dünya', 'Dünya', 'Uluslararası haberler', 11),
((SELECT id FROM prompt_rules WHERE rule_key = 'targetCategory' AND config_id = @default_config_id), 'Kültür & Sanat', 'Kültür & Sanat', 'Kültür ve sanat haberleri', 12),
((SELECT id FROM prompt_rules WHERE rule_key = 'targetCategory' AND config_id = @default_config_id), 'Magazin', 'Magazin', 'Magazin ve eğlence haberleri', 13),
((SELECT id FROM prompt_rules WHERE rule_key = 'targetCategory' AND config_id = @default_config_id), 'Genel', 'Genel', 'Genel kategoriye giren haberler', 14),

-- Writing Style options
((SELECT id FROM prompt_rules WHERE rule_key = 'writingStyle' AND config_id = @default_config_id), 'formal', 'Resmi', 'Resmi ve kurumsal dil', 1),
((SELECT id FROM prompt_rules WHERE rule_key = 'writingStyle' AND config_id = @default_config_id), 'semiformal', 'Yarı Resmi', 'Yarı resmi ve erişilebilir dil', 2),
((SELECT id FROM prompt_rules WHERE rule_key = 'writingStyle' AND config_id = @default_config_id), 'neutral', 'Nötr', 'Nötr ve objektif dil', 3),

-- Title City Info options
((SELECT id FROM prompt_rules WHERE rule_key = 'titleCityInfo' AND config_id = @default_config_id), 'exclude', 'İçermesin', 'Başlıkta şehir bilgisi yer almasın', 1),
((SELECT id FROM prompt_rules WHERE rule_key = 'titleCityInfo' AND config_id = @default_config_id), 'include', 'İçersin', 'Başlıkta şehir bilgisi yer alsın', 2),

-- Name Censorship options
((SELECT id FROM prompt_rules WHERE rule_key = 'nameCensorship' AND config_id = @default_config_id), 'initials', 'G.K. (İlk harfler)', 'Sadece ilk harfler gösterilsin', 1),
((SELECT id FROM prompt_rules WHERE rule_key = 'nameCensorship' AND config_id = @default_config_id), 'partial', 'Göktuğ K. (İsim + Soyisim baş harfi)', 'İsim tam, soyisim baş harfi', 2),
((SELECT id FROM prompt_rules WHERE rule_key = 'nameCensorship' AND config_id = @default_config_id), 'none', 'Sansürsüz', 'İsimler tam olarak gösterilsin', 3),

-- Output Format options
((SELECT id FROM prompt_rules WHERE rule_key = 'outputFormat' AND config_id = @default_config_id), 'json', 'JSON', 'JSON formatında çıktı', 1),
((SELECT id FROM prompt_rules WHERE rule_key = 'outputFormat' AND config_id = @default_config_id), 'text', 'Metin', 'Düz metin formatında çıktı', 2),
((SELECT id FROM prompt_rules WHERE rule_key = 'outputFormat' AND config_id = @default_config_id), 'html', 'HTML', 'HTML formatında çıktı', 3),

-- Tag Count options
((SELECT id FROM prompt_rules WHERE rule_key = 'tagCount' AND config_id = @default_config_id), '3', '3 Etiket', '3 adet etiket oluştur', 1),
((SELECT id FROM prompt_rules WHERE rule_key = 'tagCount' AND config_id = @default_config_id), '5', '5 Etiket', '5 adet etiket oluştur', 2),
((SELECT id FROM prompt_rules WHERE rule_key = 'tagCount' AND config_id = @default_config_id), '7', '7 Etiket', '7 adet etiket oluştur', 3),
((SELECT id FROM prompt_rules WHERE rule_key = 'tagCount' AND config_id = @default_config_id), '10', '10 Etiket', '10 adet etiket oluştur', 4);
