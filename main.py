# -*- coding: utf-8 -*-
"""
Ana Flask Uygulama Dosyası

Bu dosya, Flask web uygulamasını başlatır ve temel yapılandırmaları içerir.
Uygulamanın ana giriş noktasıdır. Blueprint'leri (rota grupları) kaydeder
ve her istek öncesi çalışacak olan session yönetimini ayarlar.

İçindekiler:
1.0 Uygulama Yapılandırması: Flask nesnesinin oluşturulması ve ayarlanması.
2.0 Kullanıcı Session Yönetimi: Her istekte kullanıcı bilgilerini session'a ekler.
3.0 Rota (Blueprint) Kayıtları: Uygulamadaki rota gruplarını kaydeder.
4.0 Uygulamayı Başlatma: Geliştirme sunucusunu çalıştırır.
"""

import os
from flask import Flask, session, jsonify
from dotenv import load_dotenv

# 1.0 Uygulama Yapılandırması
# ---
app = Flask(__name__)

# .env dosyasından ortam değişkenlerini yükle
load_dotenv()

# Session ve uygulama güvenliği için gizli anahtar
app.secret_key = os.getenv('SECRET_KEY', 'dev-secret-key-2025')

# Test ve geliştirme için sabit kullanıcı bilgileri
GOKTUG_USER_ID = os.getenv('DEFAULT_USER_ID', 'default_user_2025')
DEFAULT_USERNAME = os.getenv('DEFAULT_USERNAME', 'Kullanıcı')

# Veritabanı yapılandırması
app.config['MYSQL_HOST'] = os.getenv('MYSQL_HOST', 'localhost')
app.config['MYSQL_USER'] = os.getenv('MYSQL_USER', 'root')
app.config['MYSQL_PASSWORD'] = os.getenv('MYSQL_PASSWORD', '')
app.config['MYSQL_DB'] = os.getenv('MYSQL_DB', 'haber_editor')
app.config['MYSQL_CURSORCLASS'] = 'DictCursor'

# 2.0 Kullanıcı Session Yönetimi
# ---
@app.before_request
def set_user_session():
    """
    Her HTTP isteği işlenmeden önce çalışır.
    Geliştirme ortamında sabit bir kullanıcı ID'si atar.
    Production'da bu fonksiyon yerine gerçek bir kimlik doğrulama mekanizması kullanılmalıdır.
    """
    if 'user_id' not in session:
        session['user_id'] = GOKTUG_USER_ID
        session['username'] = DEFAULT_USERNAME

# 3.0 Hata Yönlendirmeleri
# ---
@app.errorhandler(404)
def not_found_error(error):
    return jsonify({"success": False, "error": "İstenen kaynak bulunamadı"}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({"success": False, "error": "Sunucu hatası oluştu"}), 500

# 4.0 Rota (Blueprint) Kayıtları
# ---
# Tüm route'ları içe aktar ve uygulamaya kaydet
from routes import init_app
init_app(app)

# 5.0 Uygulama Başlatma
# ---
if __name__ == '__main__':
    # Geliştirme sunucusunu başlat
    app.run(debug=True, host='0.0.0.0', port=5000)


# 4.0 Uygulamayı Başlatma
# ---
# Bu betik doğrudan çalıştırıldığında Flask geliştirme sunucusunu başlatır.
if __name__ == '__main__':
    # debug=True: Kodda değişiklik yapıldığında sunucunun otomatik yeniden başlamasını sağlar.
    # host='0.0.0.0': Sunucunun ağdaki diğer cihazlardan erişilebilir olmasını sağlar.
    app.run(debug=True, host='0.0.0.0', port=5000)
