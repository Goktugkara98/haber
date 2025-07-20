import mysql.connector
from mysql.connector import Error
import os

class DatabaseConnection:
    def __init__(self):
        self.connection = None
        self.cursor = None
        self.connect()  # Auto-connect on initialization
    
    def connect(self):
        """Veritabanı bağlantısını kurar"""
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
                self.cursor.execute("SET character_set_connection = utf8mb4")
                self.cursor.execute("SET character_set_client = utf8mb4")
                self.cursor.execute("SET character_set_results = utf8mb4")
                print("MySQL database connected and character set configured")
                return True
        except Error as e:
            print(f"Database connection error: {e}")
            return False
    
    def disconnect(self):
        """Veritabanı bağlantısını kapatır"""
        if self.connection and self.connection.is_connected():
            self.cursor.close()
            self.connection.close()
            print("MySQL connection closed")
    
    def execute_query(self, query, params=None, fetch_one=False, fetch_all=False):
        """SQL sorgusu çalıştırır"""
        try:
            if params:
                self.cursor.execute(query, params)
            else:
                self.cursor.execute(query)
            
            # For SELECT queries, fetch results
            if query.strip().upper().startswith('SELECT'):
                if fetch_one:
                    return self.cursor.fetchone()
                elif fetch_all:
                    return self.cursor.fetchall()
                else:
                    return self.cursor.fetchall()  # Default behavior
            else:
                # For INSERT, UPDATE, DELETE queries
                self.connection.commit()
                return self.cursor.rowcount  # Return affected rows
                
        except Error as e:
            print(f"Sorgu çalıştırma hatası: {e}")
            return None
