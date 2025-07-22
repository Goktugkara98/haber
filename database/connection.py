#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# Veritabanı Bağlantı Sınıfı
# ===========================
# Bu modül, MySQL veritabanı ile bağlantı kurmak, bağlantıyı sonlandırmak
# ve SQL sorgularını yürütmek için bir sınıf (`DatabaseConnection`) sağlar.
#
# İçindekiler:
# -------------
# 1.0 DatabaseConnection Sınıfı
#     1.1 __init__(): Sınıfın yapıcı metodu, otomatik bağlantı kurar.
#     1.2 connect(): Veritabanı bağlantısını kurar ve karakter setini ayarlar.
#     1.3 disconnect(): Veritabanı bağlantısını güvenli bir şekilde kapatır.
#     1.4 execute_query(): SQL sorgularını çalıştırır ve sonuçları döndürür.

# --- Gerekli Kütüphaneler ---
import mysql.connector
from mysql.connector import Error

# ==============================================================================
# 1.0 DATABASECONNECTION SINIFI
# ==============================================================================

class DatabaseConnection:
    """
    MySQL veritabanı işlemlerini yöneten sınıf.
    """
    
    # --------------------------------------------------------------------------
    # 1.1 Yapıcı Metot
    # --------------------------------------------------------------------------
    def __init__(self):
        """
        Sınıf başlatıldığında veritabanı bağlantısını otomatik olarak kurar.
        """
        self.connection = None
        self.cursor = None
        self.connect()

    # --------------------------------------------------------------------------
    # 1.2 Bağlantı Yönetimi: Kurma
    # --------------------------------------------------------------------------
    def connect(self):
        """
        Veritabanı bağlantısını kurar ve Türkçe karakter desteği için
        gerekli karakter seti (utf8mb4) ayarlarını yapar.
        """
        try:
            self.connection = mysql.connector.connect(
                host='localhost',
                database='haber_editor',
                user='root',
                password='',
                charset='utf8mb4',
                collation='utf8mb4_unicode_ci',
                use_unicode=True,
                connection_timeout=10
            )
            if self.connection.is_connected():
                self.cursor = self.connection.cursor(dictionary=True)
                # Karakter seti ayarlarını zorla uygula
                self.cursor.execute("SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci")
                self.cursor.execute("SET CHARACTER SET utf8mb4")
                print("Başarılı: MySQL veritabanına bağlanıldı ve karakter seti yapılandırıldı.")
                return True
        except Error as e:
            print(f"HATA: Veritabanı bağlantısı kurulamadı: {e}")
            self.connection = None
            self.cursor = None
            return False

    # --------------------------------------------------------------------------
    # 1.3 Bağlantı Yönetimi: Kapatma
    # --------------------------------------------------------------------------
    def disconnect(self):
        """
        Mevcut veritabanı bağlantısını ve imleci güvenli bir şekilde kapatır.
        """
        if self.connection and self.connection.is_connected():
            self.cursor.close()
            self.connection.close()
            print("Bilgi: MySQL bağlantısı kapatıldı.")

    # --------------------------------------------------------------------------
    # 1.4 Sorgu Yürütme
    # --------------------------------------------------------------------------
    def execute_query(self, query, params=None, fetch_one=False, fetch_all=False):
        """
        Verilen bir SQL sorgusunu parametrelerle birlikte güvenli bir şekilde çalıştırır.

        Args:
            query (str): Çalıştırılacak SQL sorgusu.
            params (tuple, optional): Sorgu için parametreler. Defaults to None.
            fetch_one (bool, optional): Sadece tek bir sonuç döndürmek için. Defaults to False.
            fetch_all (bool, optional): Tüm sonuçları döndürmek için. Defaults to False.

        Returns:
            - SELECT sorguları için: Sonuç listesi veya tek bir sonuç.
            - INSERT, UPDATE, DELETE sorguları için: Etkilenen satır sayısı.
            - Hata durumunda: None.
        """
        # Bağlantı koptuysa yeniden bağlanmayı dene
        if not self.connection or not self.connection.is_connected():
            print("Uyarı: Veritabanı bağlantısı kopmuş. Yeniden bağlanılıyor...")
            if not self.connect():
                return None

        try:
            # Sorguyu yürüt
            self.cursor.execute(query, params or ())
            
            # Sorgu tipine göre işlem yap
            query_type = query.strip().upper().split()[0]
            
            if query_type == 'SELECT':
                if fetch_one:
                    return self.cursor.fetchone()
                # fetch_all veya tanımsızsa tüm sonuçları döndür
                return self.cursor.fetchall()
            elif query_type in ('INSERT', 'UPDATE', 'DELETE'):
                self.connection.commit()
                return self.cursor.rowcount
            else: # CREATE, DROP, vb. için
                self.connection.commit()
                return True
                
        except Error as e:
            print(f"HATA: Sorgu çalıştırılırken bir sorun oluştu: {e}")
            print(f"Sorgu: {query}")
            return None
