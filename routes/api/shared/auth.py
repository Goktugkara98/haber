# -*- coding: utf-8 -*-
#
# Bu dosya, kimlik doğrulama ile ilgili yardımcı fonksiyonlar içerir.
#
# İçindekiler:
# - get_user_id: Kullanıcı için benzersiz bir oturum kimliği oluşturur veya mevcut olanı döndürür.

from flask import session
import uuid

def get_user_id():
    """
    Kullanıcı için benzersiz bir oturum kimliği oluşturur veya mevcut olanı döndürür.
    
    Returns:
        str: Kullanıcıya özgü benzersiz bir kimlik
    """
    if 'user_id' not in session:
        # Yeni bir kullanıcı için benzersiz bir ID oluştur
        session['user_id'] = str(uuid.uuid4())
    return session['user_id']
