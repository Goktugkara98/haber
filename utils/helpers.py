import re
from datetime import datetime

def clean_text(text):
    """Metni temizler ve formatlar"""
    if not text:
        return ""
    
    # Fazla boşlukları temizle
    text = re.sub(r'\s+', ' ', text.strip())
    return text

def validate_email(email):
    """Email formatını doğrular"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def format_date(date_obj):
    """Tarihi Türkçe formatla döndürür"""
    if isinstance(date_obj, str):
        return date_obj
    return date_obj.strftime("%d.%m.%Y %H:%M")

def truncate_text(text, max_length=100):
    """Metni belirtilen uzunlukta keser"""
    if len(text) <= max_length:
        return text
    return text[:max_length-3] + "..."
