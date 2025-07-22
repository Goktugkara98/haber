# -*- coding: utf-8 -*-
#
# Bu dosya, prompt yönetimi ile ilgili tüm blueprint'leri birleştirir.
# Tüm endpoint'ler /api/v1/prompts/ altında toplanır.

from flask import Blueprint, jsonify

# Ana blueprint oluştur (bu blueprint boş olacak, sadece alt blueprint'leri gruplamak için)
bp = Blueprint('prompts', __name__)

# Alt blueprint'leri içe aktar
from . import config, sections, settings, processing

def init_app(app):
    """Uygulamaya tüm prompt blueprint'lerini kaydeder."""
    # Ana blueprint'i kaydet (url_prefix ile)
    app.register_blueprint(bp, url_prefix='/api/v1/prompts')
    
    # Alt blueprint'leri doğrudan uygulamaya kaydet (url_prefix ile birlikte)
    app.register_blueprint(config.bp, url_prefix='/api/v1/prompts')
    app.register_blueprint(sections.bp, url_prefix='/api/v1/prompts')
    app.register_blueprint(settings.bp, url_prefix='/api/v1/prompts')
    app.register_blueprint(processing.bp, url_prefix='/api/v1/prompts')
    
    # Test endpoint'i ekle
    @bp.route('/test')
    def test():
        return jsonify({'success': True, 'message': 'Prompts API is working'})
