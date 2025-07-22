# -*- coding: utf-8 -*-
#
# Bu dosya, prompt konfigürasyonu ile ilgili API endpoint'lerini içerir.
#
# İçindekiler:
# - get_prompt_config: Mevcut aktif prompt konfigürasyonunu getirir.
# - export_configuration: Mevcut aktif konfigürasyonu dışa aktarır.

from flask import Blueprint, jsonify, request
from services.prompt_service import PromptService
from utils.helpers import get_user_id

# Create a Blueprint for prompt configuration endpoints
bp = Blueprint('config', __name__)

@bp.route('/config', methods=['GET'])
def get_prompt_config():
    """Mevcut aktif prompt konfigürasyonunun tüm verilerini getirir."""
    try:
        prompt_service = PromptService()
        config_data = prompt_service.get_full_config_data()
        
        if not config_data:
            return jsonify({'success': False, 'error': 'Aktif konfigürasyon bulunamadı'}), 404
        
        return jsonify({'success': True, 'data': config_data})
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@bp.route('/export', methods=['GET'])
def export_configuration():
    """Mevcut aktif prompt konfigürasyonunu JSON formatında dışa aktarır."""
    try:
        prompt_service = PromptService()
        active_config = prompt_service.get_active_config()
        
        if not active_config:
            return jsonify({'success': False, 'error': 'Aktif konfigürasyon bulunamadı'}), 404
        
        export_data = prompt_service.export_config(active_config['id'])
        
        if export_data:
            return jsonify({'success': True, 'data': export_data})
        else:
            return jsonify({'success': False, 'error': 'Konfigürasyon dışa aktarılamadı'}), 500
            
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
