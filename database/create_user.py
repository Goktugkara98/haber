#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Kullanıcı profili oluşturma ve ayarları kaydetme scripti
"""

import os
import sys
import json
from datetime import datetime

# Add the parent directory to the path to import our modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.connection import DatabaseConnection
from services.prompt_service import PromptService

def create_user_profile():
    """Göktuğ için özel kullanıcı profili oluşturur"""
    
    # Kullanıcı bilgileri
    user_data = {
        'user_id': 'goktug_user_2025',
        'username': 'Göktuğ',
        'email': 'goktug@habereditoru.com',
        'display_name': 'Göktuğ Kullanıcısı',
        'created_at': datetime.now(),
        'is_active': True
    }
    
    # Varsayılan kullanıcı ayarları
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
    
    print("Kullanıcı profili oluşturuluyor...")
    
    try:
        # Veritabanı bağlantısı
        db = DatabaseConnection()
        
        # Önce users tablosunu oluştur (eğer yoksa)
        create_users_table_query = """
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id VARCHAR(100) UNIQUE NOT NULL,
            username VARCHAR(100) NOT NULL,
            email VARCHAR(255),
            display_name VARCHAR(150),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            is_active BOOLEAN DEFAULT TRUE,
            
            INDEX idx_user_id (user_id),
            INDEX idx_username (username),
            INDEX idx_active (is_active)
        )
        """
        
        db.execute_query(create_users_table_query)
        print("Users tablosu hazır")
        
        # Kullanıcıyı ekle (eğer yoksa)
        insert_user_query = """
        INSERT INTO users (user_id, username, email, display_name, is_active)
        VALUES (%s, %s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE
        username = VALUES(username),
        display_name = VALUES(display_name),
        updated_at = CURRENT_TIMESTAMP
        """
        
        db.execute_query(insert_user_query, (
            user_data['user_id'],
            user_data['username'],
            user_data['email'],
            user_data['display_name'],
            user_data['is_active']
        ))
        print(f"Kullanıcı '{user_data['username']}' oluşturuldu/güncellendi")
        
        # Prompt service ile varsayılan ayarları kaydet
        prompt_service = PromptService()
        
        # Aktif konfigürasyonu al
        active_config = prompt_service.get_active_config()
        if not active_config:
            print("Hata: Aktif prompt konfigürasyonu bulunamadı")
            return False
            
        config_id = active_config['id']
        
        # Kullanıcı ayarlarını kaydet
        for setting_key, setting_value in default_settings.items():
            prompt_service.save_user_setting(
                user_data['user_id'], 
                config_id, 
                setting_key, 
                setting_value
            )
        
        print(f"Varsayılan ayarlar kaydedildi: {len(default_settings)} ayar")
        
        # Kullanıcı ayarlarını doğrula
        saved_settings = prompt_service.get_user_settings(user_data['user_id'], config_id)
        print(f"Kaydedilen ayarlar doğrulandı: {len(saved_settings)} ayar bulundu")
        
        print("\nKullanıcı profili başarıyla oluşturuldu!")
        print(f"   Kullanıcı ID: {user_data['user_id']}")
        print(f"   Kullanıcı Adı: {user_data['username']}")
        print(f"   Kayıtlı Ayarlar: {len(saved_settings)}")
        
        # Ayarları göster
        print("\nVarsayılan Ayarlar:")
        for key, value in default_settings.items():
            print(f"   - {key}: {value}")
            
        return True
        
    except Exception as e:
        print(f"Hata oluştu: {e}")
        return False
    finally:
        if 'db' in locals():
            db.disconnect()

def main():
    """Ana fonksiyon"""
    print("Göktuğ için kullanıcı profili oluşturuluyor...")
    
    success = create_user_profile()
    
    if success:
        print("\nKullanıcı profili hazır!")
        print("Artık tüm ayarlarınız veritabanında saklanacak ve dinamik olarak yüklenecek.")
        print("\nSonraki adımlar:")
        print("   1. Flask uygulamasını yeniden başlatın")
        print("   2. Ayarlarınızı değiştirin - otomatik olarak kaydedilecek")
        print("   3. Sayfayı yenileyin - ayarlarınız korunacak")
    else:
        print("\nKullanıcı profili oluşturulamadı")
        print("Lütfen veritabanı bağlantınızı kontrol edin")
    
    return success

if __name__ == "__main__":
    main()
