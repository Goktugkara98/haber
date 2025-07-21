#!/usr/bin/env python3
"""
Database Structure Test Script
Verifies the database structure and content after recreation
"""

import mysql.connector
from dotenv import load_dotenv
import os
import sys
import io

# Set console output encoding for Windows
if sys.platform.startswith('win'):
    import codecs
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

# Load environment variables
load_dotenv()

def get_db_connection():
    """Create and return a database connection"""
    conn = mysql.connector.connect(
        host=os.getenv('DB_HOST', 'localhost'),
        user=os.getenv('DB_USER', 'root'),
        password=os.getenv('DB_PASSWORD', ''),
        database=os.getenv('DB_NAME', 'haber_editor'),
        charset='utf8mb4',
        use_unicode=True
    )
    # Set character set for the connection
    cursor = conn.cursor()
    cursor.execute('SET NAMES utf8mb4')
    cursor.execute('SET CHARACTER SET utf8mb4')
    cursor.execute('SET character_set_connection=utf8mb4')
    cursor.close()
    return conn

def test_database_structure():
    """Test the database structure and content"""
    print("Testing database structure...\n")
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Check tables
        cursor.execute("SHOW TABLES")
        tables = [row['Tables_in_haber_editor'] for row in cursor.fetchall()]
        print("Tables in database:", ", ".join(tables))
        
        # Check prompt_rules
        cursor.execute("""
            SELECT r.rule_key, r.rule_name, r.rule_category, r.default_value, r.display_order,
                   GROUP_CONCAT(o.option_key, ':', o.option_label ORDER BY o.display_order SEPARATOR ' | ') as options
            FROM prompt_rules r
            LEFT JOIN prompt_rule_options o ON r.id = o.rule_id
            GROUP BY r.id
            ORDER BY r.display_order
        """)
        
        print("\nPrompt Rules:")
        print("-" * 80)
        for rule in cursor.fetchall():
            print(f"{rule['display_order']}. {rule['rule_key']} ({rule['rule_category']})")
            print(f"   Name: {rule['rule_name']}")
            print(f"   Default: {rule['default_value']}")
            if rule['options']:
                print(f"   Options: {rule['options']}")
            print()
        
        # Check prompt_sections
        cursor.execute("""
            SELECT section_key, section_name, display_order
            FROM prompt_sections
            WHERE is_active = TRUE
            ORDER BY display_order
        """)
        
        print("\nPrompt Sections:")
        print("-" * 80)
        for section in cursor.fetchall():
            print(f"{section['display_order']}. {section['section_key']}: {section['section_name']}")
        
        cursor.close()
        conn.close()
        
        print("\nDatabase structure test completed successfully!")
        return True
        
    except Exception as e:
        print(f"\nError testing database structure: {e}")
        return False

if __name__ == "__main__":
    test_database_structure()
