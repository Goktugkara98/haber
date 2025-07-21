-- =============================================================================
-- MIGRATION: 001 - `processing_history` Tablosunu Oluştur
-- AÇIKLAMA: Bu betik, sisteme yapılan metin işleme isteklerinin kaydını
--           tutmak için `processing_history` tablosunu oluşturur.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- İçindekiler
-- -----------------------------------------------------------------------------
-- 1.0 Tablo Oluşturma (`processing_history`)
-- 2.0 İndeks Ekleme (Performans için)
-- -----------------------------------------------------------------------------


-- 1.0 TABLO OLUŞTURMA (`processing_history`)
-- -----------------------------------------------------------------------------
-- Eğer mevcut değilse, `processing_history` tablosunu tanımlanan sütunlarla oluşturur.
CREATE TABLE IF NOT EXISTS `processing_history` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `user_id` VARCHAR(100) NOT NULL,
  `original_text` TEXT NOT NULL,
  `processed_text` TEXT DEFAULT NULL,
  `status` ENUM('processing','completed','error') NOT NULL DEFAULT 'processing',
  `error_message` TEXT DEFAULT NULL,
  `created_at` DATETIME NOT NULL,
  `completed_at` DATETIME DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_status` (`status`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- 2.0 İNDEKS EKLEME (Performans için)
-- -----------------------------------------------------------------------------
-- `original_text` sütununda tam metin araması yapabilmek için bir FULLTEXT indeksi ekler.
-- Not: Bu komut, tablonun zaten var olduğu durumlarda hata vermemesi için
--      ayrı bir ALTER TABLE ifadesi olarak yazılmıştır.
ALTER TABLE `processing_history` ADD FULLTEXT KEY `ft_original_text` (`original_text`);
