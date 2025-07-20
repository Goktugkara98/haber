#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Türkçe karakter testleri
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database.connection import DatabaseConnection

def test_turkish_characters():
    """Tests Turkish characters"""
    
    print("Starting Turkish character test...")
    
    # Test verileri
    test_data = [
        "Göktuğ Kara",
        "İstanbul'da güzel bir haber",
        "Çünkü şöyle böyle öyle",
        "ĞÜŞIÖÇ ğüşıöç",
        "Türkiye'de çok güzel haberler var"
    ]
    
    try:
        # Veritabanı bağlantısı
        db = DatabaseConnection()
        
        # Test tablosu oluştur
        create_test_table = """
        CREATE TABLE IF NOT EXISTS test_turkish (
            id INT AUTO_INCREMENT PRIMARY KEY,
            test_text TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        """
        
        db.execute_query(create_test_table)
        print("Test table created")
        
        # Test verilerini ekle
        for i, text in enumerate(test_data, 1):
            insert_query = "INSERT INTO test_turkish (test_text) VALUES (%s)"
            db.execute_query(insert_query, (text,))
            print(f"Test data {i} inserted: {text}")
        
        # Verileri geri oku
        print("\n--- Data retrieved from database ---")
        select_query = "SELECT id, test_text FROM test_turkish ORDER BY id"
        results = db.execute_query(select_query, fetch_all=True)
        
        if results:
            for row in results:
                print(f"ID: {row['id']}, Metin: {row['test_text']}")
                
            # Karşılaştırma yap
            print("\n--- Comparison ---")
            for i, row in enumerate(results):
                original = test_data[i]
                retrieved = row['test_text']
                if original == retrieved:
                    print(f"✓ Test {i+1}: SUCCESS")
                else:
                    print(f"✗ Test {i+1}: FAILED")
                    print(f"  Original: {original}")
                    print(f"  Retrieved: {retrieved}")
        else:
            print("No data found!")
        
        # Test tablosunu temizle
        db.execute_query("DROP TABLE IF EXISTS test_turkish")
        print("\nTest table cleaned up")
        
        db.disconnect()
        print("Test completed!")
        
    except Exception as e:
        print(f"Test error: {e}")

if __name__ == "__main__":
    test_turkish_characters()
