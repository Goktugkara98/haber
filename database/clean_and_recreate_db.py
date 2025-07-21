#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Veritabanı Temizleme ve Yeniden Oluşturma Betiği
=================================================
Bu betik, mevcut veritabanını siler (DROP) ve 'init_db.py' betiğini
çağırarak en güncel şema ile yeniden oluşturur.

İçindekiler:
-------------
1.0 Veritabanı İşlemleri
    1.1 drop_database(): Veritabanını siler.

2.0 Ana Yürütme
    2.1 main(): Betiğin ana işlevini yerine getirir.
"""

# --- Gerekli Kütüphaneler ---
import mysql.connector
import os
from dotenv import load_dotenv

# --- Ortam Değişkenleri ---
load_dotenv()

# ==============================================================================
# 1.0 VERİTABANI İŞLEMLERİ
# ==============================================================================

def drop_database():
    """
    1.1 Veritabanını Silme
    ---------------------
    Ortam değişkenlerinden alınan veritabanı adını kullanarak,
    eğer varsa veritabanını siler.
    """
    try:
        connection = mysql.connector.connect(
            host=os.getenv('DB_HOST', 'localhost'),
            user=os.getenv('DB_USER', 'root'),
            password=os.getenv('DB_PASSWORD', ''),
            charset='utf8mb4'
        )
        cursor = connection.cursor()
        
        db_name = os.getenv('DB_NAME', 'haber_editor')
        cursor.execute(f"DROP DATABASE IF EXISTS {db_name}")
        print(f"Başarıyla silindi: Veritabanı '{db_name}'")
        
        cursor.close()
        connection.close()
        return True
    except mysql.connector.Error as err:
        print(f"HATA: Veritabanı silinirken bir sorun oluştu: {err}")
        return False

# ==============================================================================
# 2.0 ANA YÜRÜTME
# ==============================================================================

def main():
    """
    2.1 Ana Fonksiyon
    -----------------
    Veritabanını temizleme ve yeniden oluşturma sürecini yönetir.
    """
    print("Veritabanı temizleme işlemi başlatılıyor...")
    
    # 1. Adım: Mevcut veritabanını sil
    if not drop_database():
        print("KRİTİK HATA: Veritabanı silinemedi. İşlem durduruldu.")
        return False
    
    print("\nVeritabanı en güncel şema ile yeniden oluşturuluyor...")
    
    # 2. Adım: init_db.py betiğini çalıştırarak veritabanını yeniden oluştur
    try:
        from init_db import main as init_db_main
        return init_db_main()
    except ImportError:
        print("KRİTİK HATA: 'init_db.py' dosyası bulunamadı veya içe aktarılamadı.")
        return False

if __name__ == "__main__":
    print("--------------------------------------------------")
    print("--- Veritabanı Temizleme ve Yeniden Oluşturma ---")
    print("--------------------------------------------------")
    
    success = main()
    
    if not success:
        print("\nSONUÇ: Veritabanı yeniden oluşturma işlemi BAŞARISIZ OLDU.")
        print("Lütfen yukarıdaki hata mesajlarını kontrol edin.")
        exit(1)
    else:
        print("\nSONUÇ: Veritabanı başarıyla temizlendi ve yeniden oluşturuldu!")
        exit(0)
