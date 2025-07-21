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

from flask import Flask, session
from routes.main_routes import bp as main_bp
from routes.prompt_routes import bp as prompt_bp

# 1.0 Uygulama Yapılandırması
# ---
app = Flask(__name__)
# Session verilerini güvende tutmak için kullanılan gizli anahtar.
# Production ortamında bu anahtar daha güvenli bir şekilde yönetilmelidir.
app.secret_key = 'haber-editor-secret-key-2025'

# Test ve geliştirme için sabit bir kullanıcı ID'si tanımlanıyor.
GOKTUG_USER_ID = 'goktug_user_2025'


# 2.0 Kullanıcı Session Yönetimi
# ---
@app.before_request
def set_user_session():
    """
    Her HTTP isteği işlenmeden önce çalışır.
    Bu fonksiyon, test amacıyla "Göktuğ" adlı kullanıcıyı ve ID'sini
    session'a sabit olarak atar. Bu sayede uygulama genelinde
    kullanıcı bilgisine erişim sağlanır.
    """
    session['user_id'] = GOKTUG_USER_ID
    session['username'] = 'Göktuğ'


# 3.0 Rota (Blueprint) Kayıtları
# ---
# Ana sayfalar ve genel işlemler için rota grubunu kaydet
app.register_blueprint(main_bp)
# Prompt işlemleriyle ilgili API rotalarını '/api/prompt' ön ekiyle kaydet
app.register_blueprint(prompt_bp, url_prefix='/api/prompt')


# 4.0 Uygulamayı Başlatma
# ---
# Bu betik doğrudan çalıştırıldığında Flask geliştirme sunucusunu başlatır.
if __name__ == '__main__':
    # debug=True: Kodda değişiklik yapıldığında sunucunun otomatik yeniden başlamasını sağlar.
    # host='0.0.0.0': Sunucunun ağdaki diğer cihazlardan erişilebilir olmasını sağlar.
    app.run(debug=True, host='0.0.0.0', port=5000)
