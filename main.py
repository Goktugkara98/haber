from flask import Flask, render_template, session
from routes.main_routes import bp as main_bp
from routes.prompt_routes import bp as prompt_bp
import uuid

app = Flask(__name__)
app.secret_key = 'haber-editor-secret-key-2025'  # Production'da değiştirin

# Göktuğ kullanıcısı için sabit kullanıcı ID'si
GOKTUG_USER_ID = 'goktug_user_2025'

@app.before_request
def set_user_session():
    """Her istekte Göktuğ kullanıcısını session'a ata"""
    session['user_id'] = GOKTUG_USER_ID
    session['username'] = 'Göktuğ'

# Blueprint'leri kaydet
app.register_blueprint(main_bp)
app.register_blueprint(prompt_bp, url_prefix='/api/prompt')

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
