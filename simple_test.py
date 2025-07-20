#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database.connection import DatabaseConnection

def simple_test():
    try:
        db = DatabaseConnection()
        
        # Create test table
        db.execute_query("""
        CREATE TABLE IF NOT EXISTS simple_test (
            id INT AUTO_INCREMENT PRIMARY KEY,
            test_text TEXT NOT NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        """)
        
        # Insert Turkish text
        turkish_text = "Göktuğ İstanbul'da güzel haberler yazıyor"
        db.execute_query("INSERT INTO simple_test (test_text) VALUES (%s)", (turkish_text,))
        
        # Retrieve and check
        result = db.execute_query("SELECT test_text FROM simple_test ORDER BY id DESC LIMIT 1", fetch_one=True)
        
        if result:
            retrieved = result['test_text']
            if turkish_text == retrieved:
                print("SUCCESS: Turkish characters work correctly!")
                print("Original: " + repr(turkish_text))
                print("Retrieved: " + repr(retrieved))
            else:
                print("FAILED: Characters don't match")
                print("Original: " + repr(turkish_text))
                print("Retrieved: " + repr(retrieved))
        else:
            print("FAILED: No data retrieved")
        
        # Clean up
        db.execute_query("DROP TABLE IF EXISTS simple_test")
        db.disconnect()
        
    except Exception as e:
        print("Error: " + str(e))

if __name__ == "__main__":
    simple_test()
