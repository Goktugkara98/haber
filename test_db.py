#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Database Connection Test
Tests if database exists and has required tables
"""

from database.connection import DatabaseConnection

def test_database_connection():
    """Test database connection and table existence"""
    print("Testing database connection...")
    
    try:
        db = DatabaseConnection()
        
        # Test basic connection
        if not db.connection or not db.connection.is_connected():
            print("[ERROR] Database connection failed")
            return False
        
        print("[SUCCESS] Database connection successful")
        
        # Test if required tables exist
        required_tables = [
            'prompt_configs',
            'prompt_sections', 
            'prompt_rules',
            'prompt_rule_options',
            'user_prompt_settings',
            'processing_history'
        ]
        
        for table in required_tables:
            try:
                query = f"SELECT COUNT(*) as count FROM {table}"
                result = db.execute_query(query, fetch_one=True)
                print(f"[SUCCESS] Table '{table}' exists with {result['count']} records")
            except Exception as e:
                print(f"[ERROR] Table '{table}' error: {e}")
                return False
        
        # Test if there's an active config
        try:
            query = "SELECT * FROM prompt_configs WHERE is_active = TRUE LIMIT 1"
            result = db.execute_query(query, fetch_one=True)
            if result:
                print(f"[SUCCESS] Active config found: {result['name']}")
            else:
                print("[WARNING] No active configuration found")
        except Exception as e:
            print(f"[ERROR] Error checking active config: {e}")
        
        db.disconnect()
        return True
        
    except Exception as e:
        print(f"[ERROR] Database test failed: {e}")
        return False

if __name__ == "__main__":
    test_database_connection()
