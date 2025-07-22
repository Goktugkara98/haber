# -*- coding: utf-8 -*-
#
# Bu dosya, tüm route blueprint'lerini içe aktarır ve uygulamaya kaydeder.
# Ayrıca URL öneklerini de burada yapılandırır.

from flask import Blueprint, jsonify

# Ana blueprint'ler
from .pages.main import bp as pages_bp

# API v1 blueprint'leri
from .api.v1.news.routes import bp as news_api_bp
from .api.v1.prompts import bp as prompts_bp, init_app as init_prompts_app

# Prompt blueprint'lerini içe aktar
from .api.v1.prompts.config import bp as prompts_config_bp
from .api.v1.prompts.settings import bp as prompts_settings_bp
from .api.v1.prompts.sections import bp as prompts_sections_bp
from .api.v1.prompts.processing import bp as prompts_processing_bp

def init_app(app):
    """
    Uygulamaya tüm route'ları kaydeder.
    
    Args:
        app: Flask uygulama örneği
    """
    # Ana sayfa route'larını kaydet
    app.register_blueprint(pages_bp)
    
    # API v1 route'larını kaydet
    api_v1_prefix = '/api/v1'
    app.register_blueprint(news_api_bp, url_prefix=f"{api_v1_prefix}/news")
    
    # Prompt yönetimi route'larını kaydet
    app.register_blueprint(prompts_config_bp, url_prefix=f"{api_v1_prefix}/prompts")
    app.register_blueprint(prompts_settings_bp, url_prefix=f"{api_v1_prefix}/prompts")
    app.register_blueprint(prompts_sections_bp, url_prefix=f"{api_v1_prefix}/prompts")
    app.register_blueprint(prompts_processing_bp, url_prefix=f"{api_v1_prefix}/prompts")
    
    # Test endpoint'i
    @app.route(f"{api_v1_prefix}/test")
    def test_api():
        return jsonify({"success": True, "message": "API is working"})
    
    # Hata yönlendirmeleri
    @app.errorhandler(404)
    def not_found_error(error):
        return jsonify({"success": False, "error": "Sayfa bulunamadı"}), 404
    
    @app.errorhandler(500)
    def internal_error(error):
        return jsonify({"success": False, "error": "Sunucu hatası oluştu"}), 500