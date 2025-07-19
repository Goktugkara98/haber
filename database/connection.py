import mysql.connector
from mysql.connector import Error
import os

class DatabaseConnection:
    def __init__(self):
        self.connection = None
        self.cursor = None
    
    def connect(self):
        """Veritabanı bağlantısını kurar"""
        try:
            self.connection = mysql.connector.connect(
                host=os.getenv('DB_HOST', 'localhost'),
                database=os.getenv('DB_NAME', 'news_app'),
                user=os.getenv('DB_USER', 'root'),
                password=os.getenv('DB_PASSWORD', '')
            )
            if self.connection.is_connected():
                self.cursor = self.connection.cursor()
                print("MySQL veritabanına başarıyla bağlandı")
                return True
        except Error as e:
            print(f"Veritabanı bağlantı hatası: {e}")
            return False
    
    def disconnect(self):
        """Veritabanı bağlantısını kapatır"""
        if self.connection and self.connection.is_connected():
            self.cursor.close()
            self.connection.close()
            print("MySQL bağlantısı kapatıldı")
    
    def execute_query(self, query, params=None):
        """SQL sorgusu çalıştırır"""
        try:
            if params:
                self.cursor.execute(query, params)
            else:
                self.cursor.execute(query)
            self.connection.commit()
            return self.cursor.fetchall()
        except Error as e:
            print(f"Sorgu çalıştırma hatası: {e}")
            return None
