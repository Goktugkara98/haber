-- =============================================================================
-- MIGRATION: 003 - `processing_history` Tablosuna Yeni Alanlar Ekle
-- AÇIKLAMA: Bu betik, `processing_history` tablosuna `prompt_text` ve
--           `read_status` adında iki yeni sütun ekler.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- İçindekiler
-- -----------------------------------------------------------------------------
-- 1.0 Yeni Sütunları Ekleme
-- -----------------------------------------------------------------------------


-- 1.0 YENİ SÜTUNLARI EKLEME
-- -----------------------------------------------------------------------------
-- `processing_history` tablosuna iki yeni sütun ekler:
--   - prompt_text: İşlem sırasında AI'a gönderilen prompt metnini saklar.
--   - read_status: Kaydın kullanıcı tarafından okunup okunmadığını izler.
ALTER TABLE `processing_history` 
ADD COLUMN `prompt_text` TEXT NULL DEFAULT NULL AFTER `original_text`,
ADD COLUMN `read_status` ENUM('unread', 'read') DEFAULT 'unread' AFTER `processing_status`;
