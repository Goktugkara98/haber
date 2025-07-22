#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# Kullanıcı Profili Oluşturma ve Ayarları Kaydetme Betiği
# ========================================================
# Bu betik, belirli bir kullanıcı ('Göktuğ') için bir profil oluşturur,
# bu profili veritabanına ekler ve kullanıcı için varsayılan prompt
# ayarlarını kaydeder.
#
# İçindekiler:
# -------------
# 1.0 Kullanıcı Profili Yönetimi
#     1.1 create_user_profile(): Kullanıcıyı oluşturur ve ayarlarını kaydeder.
#
# 2.0 Ana Yürütme
#     2.1 main(): Betiğin ana işlevini yerine getirir.

# --- Gerekli Kütüphaneler ---
import os
import sys
from datetime import datetime

# --- Proje İçi Modüller ---
# Ana dizini path'e ekleyerek modüllerin içe aktarılmasını sağla
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.connection import DatabaseConnection
from services.prompt_service import PromptService # Bu servisin var olduğu varsayılıyor

# ==============================================================================
# 1.0 KULLANICI PROFİLİ YÖNETİMİ
# ==============================================================================

def create_user_profile():
    """
    1.1 Kullanıcı Profili Oluşturma ve Ayarları Kaydetme
    ---------------------------------------------------
    'Göktuğ' kullanıcısı için verileri tanımlar, veritabanına ekler
    (veya günceller) ve ardından varsayılan ayarlarını kaydeder.
    """
    # 1. Adım: Kullanıcı verilerini ve varsayılan ayarları tanımla
    user_data = {
        'user_id': 'goktug_user_2025',
        'username': 'Göktuğ',
        'email': 'goktug@habereditoru.com',
        'display_name': 'Göktuğ Kullanıcısı',
        'is_active': True
    }
    
    default_settings = {
        'title_include_city': True,
        'name_censorship': 'G.K.',
        'company_info_toggle': True,
        'target_category': 'auto',
        'tag_count': 5,
        'processing_language': 'turkish',
        'output_format': 'professional',
        'auto_save': True
    }
    
    print("Kullanıcı profili oluşturma işlemi başlatılıyor...")
    db = None
    try:
        # 2. Adım: Veritabanı bağlantısı kur
        db = DatabaseConnection()
        if not db.connection:
            raise ConnectionError("Veritabanı bağlantısı kurulamadı.")

        # 3. Adım: Kullanıcıyı veritabanına ekle veya güncelle
        # NOT: 'users' tablosunun 'schema.sql' içinde oluşturulduğu varsayılır.
        insert_user_query = """
        INSERT INTO users (user_id, username, email, display_name, is_active)
        VALUES (%s, %s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE
            username = VALUES(username),
            display_name = VALUES(display_name),
            is_active = VALUES(is_active),
            updated_at = CURRENT_TIMESTAMP
        """
        db.execute_query(insert_user_query, (
            user_data['user_id'], user_data['username'], user_data['email'],
            user_data['display_name'], user_data['is_active']
        ))
        print(f"Başarılı: Kullanıcı '{user_data['username']}' oluşturuldu/güncellendi.")
        
        # 4. Adım: Prompt servisi ile varsayılan ayarları kaydet
        prompt_service = PromptService()
        active_config = prompt_service.get_active_config()
        if not active_config:
            print("HATA: Aktif bir prompt konfigürasyonu bulunamadı. Ayarlar kaydedilemedi.")
            return False
            
        config_id = active_config['id']
        
        # Kullanıcı ayarlarını tek tek kaydet
        for key, value in default_settings.items():
            prompt_service.save_user_setting(user_data['user_id'], config_id, key, value)
        
        print(f"Başarılı: {len(default_settings)} adet varsayılan ayar kaydedildi.")
        
        # 5. Adım: Kaydedilen ayarları doğrula
        saved_settings = prompt_service.get_user_settings(user_data['user_id'], config_id)
        print(f"Doğrulama: {len(saved_settings)} adet ayar veritabanından okundu.")
        
        print("\n--- KULLANICI PROFİLİ ÖZETİ ---")
        print(f"   Kullanıcı ID:   {user_data['user_id']}")
        print(f"   Kullanıcı Adı:  {user_data['username']}")
        print(f"   Kayıtlı Ayarlar:")
        for key, value in saved_settings.items():
            print(f"     - {key}: {value}")
            
        return True
        
    except Exception as e:
        print(f"KRİTİK HATA: Kullanıcı profili oluşturulurken bir sorun oluştu: {e}")
        return False
    finally:
        if db:
            db.disconnect()

# ==============================================================================
# 2.0 ANA YÜRÜTME
# ==============================================================================

def main():
    """
    2.1 Ana Fonksiyon
    -----------------
    Kullanıcı oluşturma sürecini başlatır ve sonuç hakkında bilgi verir.
    """
    # Windows'ta konsol çıktısı için UTF-8 desteği
    if sys.platform == "win32" and sys.stdout.encoding != 'utf-8':
        import codecs
        sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
    
    print("--------------------------------------------------")
    print("--- Göktuğ için Kullanıcı Profili Oluşturma ---")
    print("--------------------------------------------------")
    
    success = create_user_profile()
    
    if success:
        print("\nSONUÇ: Kullanıcı profili başarıyla oluşturuldu ve ayarlar kaydedildi!")
    else:
        print("\nSONUÇ: Kullanıcı profili oluşturulamadı. Lütfen yukarıdaki hataları kontrol edin.")
    
    return success

if __name__ == "__main__":
    main()
