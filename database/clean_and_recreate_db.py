#!/usr/bin/env python3
"""
Database Clean and Recreate Script
Drops and recreates the database with the latest schema
"""

import mysql.connector
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def drop_database():
    """Drop the database if it exists"""
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
        print(f"Dropped database: {db_name}")
        
        cursor.close()
        connection.close()
        return True
    except mysql.connector.Error as err:
        print(f"Error dropping database: {err}")
        return False

def main():
    """Main function to clean and recreate the database"""
    print("Starting database cleanup...")
    
    # Drop the existing database
    if not drop_database():
        print("Failed to drop the database")
        return False
    
    print("\nRecreating database with latest schema...")
    
    # Import and run the init_db script
    from init_db import main as init_db_main
    return init_db_main()

if __name__ == "__main__":
    success = main()
    if not success:
        print("\nDatabase recreation failed. Please check the error messages above.")
        exit(1)
    else:
        print("\nDatabase successfully cleaned and recreated with the latest schema!")
        exit(0)
