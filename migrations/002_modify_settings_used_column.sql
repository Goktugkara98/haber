-- =============================================================================
-- MIGRATION: 002 - `settings_used` Sütununu Değiştir
-- AÇIKLAMA: Bu betik, `processing_history` tablosundaki `settings_used`
--           sütununu, `NULL` değerlere izin verecek şekilde günceller.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- İçindekiler
-- -----------------------------------------------------------------------------
-- 1.0 Sütun Değişikliği (`settings_used`)
-- -----------------------------------------------------------------------------


-- 1.0 SÜTUN DEĞİŞİKLİĞİ (`settings_used`)
-- -----------------------------------------------------------------------------
-- `settings_used` sütununu `longtext` tipinde ve varsayılan olarak `NULL`
-- olacak şekilde değiştirir.
ALTER TABLE `processing_history` 
MODIFY COLUMN `settings_used` LONGTEXT NULL DEFAULT NULL;
