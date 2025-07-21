# -*- coding: utf-8 -*-
"""
Yardımcı Fonksiyonlar Modülü

Bu modül, proje genelinde kullanılan çeşitli yardımcı fonksiyonları içerir.
Metin temizleme, formatlama ve doğrulama gibi işlemler burada toplanmıştır.

İçindekiler:
1.0 clean_text: Metindeki fazla boşlukları temizler.
2.0 validate_email: E-posta adresinin formatını doğrular.
3.0 format_date: Tarih nesnesini standart bir metin formatına çevirir.
4.0 truncate_text: Metni belirtilen uzunlukta kısaltır.
"""

import re
from datetime import datetime

# 1.0 Metin Temizleme
# ---
def clean_text(text):
    """
    Verilen metnin başındaki ve sonundaki boşlukları kaldırır,
    içindeki çoklu boşlukları tek boşluğa indirir.
    
    Args:
        text (str): Temizlenecek metin.
        
    Returns:
        str: Temizlenmiş metin. Metin boş ise boş string döner.
    """
    if not text:
        return ""
    
    # Regex kullanarak birden fazla boşluğu tek boşluğa indirge
    text = re.sub(r'\s+', ' ', text.strip())
    return text

# 2.0 E-posta Doğrulama
# ---
def validate_email(email):
    """
    Verilen metnin geçerli bir e-posta formatında olup olmadığını kontrol eder.
    
    Args:
        email (str): Doğrulanacak e-posta adresi.
        
    Returns:
        bool: E-posta geçerli ise True, değilse False döner.
    """
    # Standart e-posta formatını kontrol eden regex deseni
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

# 3.0 Tarih Formatlama
# ---
def format_date(date_obj):
    """
    Datetime nesnesini "GG.AA.YYYY SS:DD" formatında Türkçe bir string'e çevirir.
    Eğer zaten bir string ise, olduğu gibi döndürür.
    
    Args:
        date_obj (datetime or str): Formatlanacak tarih nesnesi veya string.
        
    Returns:
        str: Formatlanmış tarih metni.
    """
    if isinstance(date_obj, str):
        return date_obj
    return date_obj.strftime("%d.%m.%Y %H:%M")

# 4.0 Metin Kısaltma
# ---
def truncate_text(text, max_length=100):
    """
    Metni, belirtilen maksimum uzunluktan fazlaysa kısaltır ve sonuna "..." ekler.
    
    Args:
        text (str): Kısaltılacak metin.
        max_length (int): Metnin olabileceği maksimum karakter sayısı.
        
    Returns:
        str: Kısaltılmış metin.
    """
    if len(text) <= max_length:
        return text
    return text[:max_length-3] + "..."
