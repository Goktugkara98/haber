#!/usr/bin/env python3
"""
Database Initialization Script
Creates the database schema and inserts default prompt configuration
"""

import mysql.connector
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def get_db_connection():
    """Create database connection"""
    try:
        connection = mysql.connector.connect(
            host=os.getenv('DB_HOST', 'localhost'),
            user=os.getenv('DB_USER', 'root'),
            password=os.getenv('DB_PASSWORD', ''),
            database=os.getenv('DB_NAME', 'haber_editor'),
            charset='utf8mb4',
            collation='utf8mb4_unicode_ci'
        )
        return connection
    except mysql.connector.Error as err:
        print(f"Database connection error: {err}")
        return None

def create_database_if_not_exists():
    """Create database if it doesn't exist"""
    try:
        connection = mysql.connector.connect(
            host=os.getenv('DB_HOST', 'localhost'),
            user=os.getenv('DB_USER', 'root'),
            password=os.getenv('DB_PASSWORD', ''),
            charset='utf8mb4',
            collation='utf8mb4_unicode_ci'
        )
        cursor = connection.cursor()
        
        db_name = os.getenv('DB_NAME', 'haber_editor')
        cursor.execute(f"CREATE DATABASE IF NOT EXISTS {db_name} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
        print(f"Database '{db_name}' created or already exists")
        
        cursor.close()
        connection.close()
        return True
    except mysql.connector.Error as err:
        print(f"Error creating database: {err}")
        return False

def execute_sql_file(connection, file_path):
    """Execute SQL commands from a file"""
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            sql_content = file.read()
        
        cursor = connection.cursor()
        
        # Split by semicolon and execute each statement
        statements = sql_content.split(';')
        
        for statement in statements:
            statement = statement.strip()
            if statement:  # Skip empty statements
                try:
                    cursor.execute(statement)
                    connection.commit()
                except mysql.connector.Error as err:
                    if "already exists" not in str(err).lower():
                        print(f"Warning executing statement: {err}")
                        print(f"Statement: {statement[:100]}...")
        
        cursor.close()
        print(f"Successfully executed SQL file: {file_path}")
        return True
        
    except Exception as e:
        print(f"Error executing SQL file {file_path}: {e}")
        return False

def verify_installation():
    """Verify that the database was set up correctly"""
    connection = get_db_connection()
    if not connection:
        return False
    
    try:
        cursor = connection.cursor(dictionary=True)
        
        # Check if tables exist
        cursor.execute("SHOW TABLES")
        tables = [row['Tables_in_haber_editor'] for row in cursor.fetchall()]
        
        expected_tables = ['prompt_configs', 'prompt_sections', 'prompt_rules', 
                          'prompt_rule_options', 'user_prompt_settings', 'processing_history']
        
        missing_tables = [table for table in expected_tables if table not in tables]
        
        if missing_tables:
            print(f"Missing tables: {missing_tables}")
            return False
        
        # Check if default config exists
        cursor.execute("SELECT COUNT(*) as count FROM prompt_configs WHERE is_default = TRUE")
        result = cursor.fetchone()
        
        if result['count'] == 0:
            print("No default configuration found")
            return False
        
        # Check if prompt sections exist
        cursor.execute("SELECT COUNT(*) as count FROM prompt_sections")
        result = cursor.fetchone()
        
        if result['count'] == 0:
            print("No prompt sections found")
            return False
        
        print("Database verification successful!")
        print(f"Found {len(tables)} tables")
        print(f"Default configuration exists")
        print(f"Prompt sections populated")
        
        cursor.close()
        connection.close()
        return True
        
    except Exception as e:
        print(f"Error during verification: {e}")
        return False

def main():
    """Main initialization function"""
    print("Starting database initialization...")
    
    # Create database if it doesn't exist
    if not create_database_if_not_exists():
        print("Failed to create database")
        return False
    
    # Get connection to the specific database
    connection = get_db_connection()
    if not connection:
        print("Failed to connect to database")
        return False
    
    try:
        # Execute schema file
        schema_path = os.path.join(os.path.dirname(__file__), 'schema.sql')
        if not os.path.exists(schema_path):
            print(f"Schema file not found: {schema_path}")
            return False
        
        print("Executing database schema...")
        if not execute_sql_file(connection, schema_path):
            print("Failed to execute schema")
            return False
        
        print("Database schema created successfully")
        
        # Verify installation
        if verify_installation():
            print("Database initialization completed successfully!")
            print("\nYour AI prompt system is now ready with:")
            print("   - Extensible prompt configurations")
            print("   - User settings management")
            print("   - Processing history tracking")
            print("   - Dynamic rule system")
            return True
        else:
            print("Database verification failed")
            return False
            
    finally:
        connection.close()

if __name__ == "__main__":
    success = main()
    if not success:
        print("\nTroubleshooting tips:")
        print("   1. Make sure MySQL is running")
        print("   2. Check your database credentials in .env file")
        print("   3. Ensure the database user has CREATE privileges")
        exit(1)
    else:
        print("\nYou can now start your Flask application!")
        exit(0)
