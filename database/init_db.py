#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Veritabanı Başlatma Betiği
===========================
Bu betik, veritabanını (eğer mevcut değilse) oluşturur, 'schema.sql' dosyasını
çalıştırarak tablo yapılarını kurar ve varsayılan verileri ekler.

İçindekiler:
-------------
1.0 Veritabanı Bağlantısı
    1.1 get_db_connection(): Belirtilen veritabanına bağlantı oluşturur.

2.0 Veritabanı ve Şema Kurulumu
    2.1 create_database_if_not_exists(): Veritabanını, eğer yoksa, oluşturur.
    2.2 execute_sql_file(): Bir SQL dosyasındaki komutları çalıştırır.

3.0 Doğrulama
    3.1 verify_installation(): Kurulumun doğruluğunu kontrol eder.

4.0 Ana Yürütme
    4.1 main(): Betiğin ana başlatma işlevini yerine getirir.
"""

# --- Gerekli Kütüphaneler ---
import mysql.connector
import os
from dotenv import load_dotenv

# --- Ortam Değişkenleri ---
load_dotenv()

# ==============================================================================
# 1.0 VERİTABANI BAĞLANTISI
# ==============================================================================

def get_db_connection():
    """
    1.1 Veritabanı Bağlantısı Oluşturma
    ------------------------------------
    Ortam değişkenlerinde tanımlı olan veritabanına bir bağlantı nesnesi oluşturur
    ve Türkçe karakter desteği için karakter setini ayarlar.
    """
    try:
        connection = mysql.connector.connect(
            host=os.getenv('DB_HOST', 'localhost'),
            user=os.getenv('DB_USER', 'root'),
            password=os.getenv('DB_PASSWORD', ''),
            database=os.getenv('DB_NAME', 'haber_editor'),
            charset='utf8mb4',
            collation='utf8mb4_unicode_ci',
            use_unicode=True
        )
        cursor = connection.cursor()
        cursor.execute("SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci")
        cursor.execute("SET CHARACTER SET utf8mb4")
        cursor.close()
        return connection
    except mysql.connector.Error as err:
        print(f"HATA: Veritabanı bağlantısı kurulamadı: {err}")
        return None

# ==============================================================================
# 2.0 VERİTABANI VE ŞEMA KURULUMU
# ==============================================================================

def create_database_if_not_exists():
    """
    2.1 Veritabanı Oluşturma
    -------------------------
    Veritabanı sunucusuna bağlanır ve 'DB_NAME' ile belirtilen veritabanını,
    eğer mevcut değilse, doğru karakter setiyle oluşturur.
    """
    try:
        # Veritabanı adı belirtmeden sunucuya bağlan
        connection = mysql.connector.connect(
            host=os.getenv('DB_HOST', 'localhost'),
            user=os.getenv('DB_USER', 'root'),
            password=os.getenv('DB_PASSWORD', ''),
            charset='utf8mb4'
        )
        cursor = connection.cursor()
        db_name = os.getenv('DB_NAME', 'haber_editor')
        cursor.execute(f"CREATE DATABASE IF NOT EXISTS {db_name} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
        print(f"Başarılı: Veritabanı '{db_name}' oluşturuldu veya zaten mevcut.")
        cursor.close()
        connection.close()
        return True
    except mysql.connector.Error as err:
        print(f"HATA: Veritabanı oluşturulurken bir sorun oluştu: {err}")
        return False

def execute_sql_file(connection, file_path):
    """
    2.2 SQL Dosyasını Çalıştırma
    ----------------------------
    Verilen yoldaki bir SQL dosyasını okur ve içindeki komutları
    noktalı virgüle (;) göre ayırarak tek tek çalıştırır.
    """
    print(f"SQL dosyası çalıştırılıyor: {os.path.basename(file_path)}")
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            sql_content = file.read()
        
        cursor = connection.cursor()
        statements = sql_content.split(';')
        
        for statement in statements:
            if statement.strip():
                cursor.execute(statement)
        
        connection.commit()
        cursor.close()
        print(f"Başarılı: SQL dosyası '{file_path}' başarıyla çalıştırıldı.")
        return True
    except Exception as e:
        print(f"HATA: SQL dosyası '{file_path}' çalıştırılırken bir sorun oluştu: {e}")
        return False

# ==============================================================================
# 3.0 DOĞRULAMA
# ==============================================================================

def verify_installation():
    """
    3.1 Kurulum Doğrulaması
    -----------------------
    Gerekli tabloların oluşturulup oluşturulmadığını ve varsayılan
    verilerin eklenip eklenmediğini kontrol eder.
    """
    print("Kurulum doğrulanıyor...")
    connection = get_db_connection()
    if not connection:
        return False
    
    try:
        cursor = connection.cursor(dictionary=True)
        
        # 1. Tabloların varlığını kontrol et
        expected_tables = ['users', 'prompt_configs', 'prompt_sections', 'prompt_rules', 
                           'prompt_rule_options', 'user_prompt_settings', 'processing_history']
        cursor.execute("SHOW TABLES")
        tables = [row[f'Tables_in_{os.getenv("DB_NAME", "haber_editor")}'] for row in cursor.fetchall()]
        missing_tables = [table for table in expected_tables if table not in tables]
        
        if missing_tables:
            print(f"HATA: Eksik tablolar var: {missing_tables}")
            return False
        print(f"Doğrulandı: Tüm beklenen {len(expected_tables)} tablo mevcut.")

        # 2. Varsayılan konfigürasyonun varlığını kontrol et
        cursor.execute("SELECT COUNT(*) as count FROM prompt_configs WHERE is_default = TRUE")
        if cursor.fetchone()['count'] == 0:
            print("HATA: Varsayılan prompt konfigürasyonu bulunamadı.")
            return False
        print("Doğrulandı: Varsayılan konfigürasyon mevcut.")
        
        cursor.close()
        return True
    except Exception as e:
        print(f"HATA: Doğrulama sırasında bir sorun oluştu: {e}")
        return False
    finally:
        if connection:
            connection.close()

# ==============================================================================
# 4.0 ANA YÜRÜTME
# ==============================================================================

def main():
    """
    4.1 Ana Fonksiyon
    -----------------
    Veritabanı başlatma sürecini adım adım yönetir.
    """
    # 1. Adım: Veritabanını oluştur (eğer yoksa)
    if not create_database_if_not_exists():
        return False
    
    # 2. Adım: Veritabanına bağlan
    connection = get_db_connection()
    if not connection:
        return False
    
    try:
        # 3. Adım: Şema dosyasını çalıştır
        schema_path = os.path.join(os.path.dirname(__file__), 'schema.sql')
        if not os.path.exists(schema_path):
            print(f"KRİTİK HATA: Şema dosyası bulunamadı: {schema_path}")
            return False
        
        if not execute_sql_file(connection, schema_path):
            return False
        
        # 4. Adım: Kurulumu doğrula
        if verify_installation():
            print("\nSONUÇ: Veritabanı başlatma işlemi başarıyla tamamlandı!")
            return True
        else:
            print("\nSONUÇ: Veritabanı doğrulaması BAŞARISIZ OLDU.")
            return False
            
    finally:
        if connection:
            connection.close()

if __name__ == "__main__":
    print("-----------------------------------------")
    print("--- Veritabanı Başlatma Betiği ---")
    print("-----------------------------------------")
    success = main()
    if not success:
        print("\nSorun Giderme İpuçları:")
        print("   1. MySQL sunucusunun çalıştığından emin olun.")
        print("   2. '.env' dosyasındaki veritabanı bilgilerinizi kontrol edin.")
        print("   3. Veritabanı kullanıcısının CREATE ve diğer yetkilere sahip olduğundan emin olun.")
        exit(1)
    else:
        print("\nUygulamanızı şimdi başlatabilirsiniz!")
        exit(0)
