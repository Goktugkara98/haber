# -*- coding: utf-8 -*-
#
# Bu dosya, kullanıcı prompt ayarları ile ilgili API endpoint'lerini içerir.
#
# İçindekiler:
# - get_user_settings: Kullanıcının mevcut prompt ayarlarını getirir.
# - save_user_settings: Kullanıcının prompt ayarlarını kaydeder.

from flask import Blueprint, request, jsonify
from services.prompt_service import PromptService
from utils.helpers import get_user_id

# Create a Blueprint for user settings endpoints
bp = Blueprint('settings', __name__)

@bp.route('/settings', methods=['GET'])
def get_user_settings():
    """
    Kullanıcının aktif konfigürasyon için kaydettiği ayarları getirir.
    Eğer kullanıcı bir ayarı kaydetmemişse, o ayar için varsayılan değer kullanılır.
    """
    try:
        user_id = get_user_id()
        prompt_service = PromptService()
        
        active_config = prompt_service.get_active_config()
        if not active_config:
            return jsonify({'success': False, 'error': 'Aktif konfigürasyon bulunamadı'}), 404
        
        user_settings = prompt_service.get_user_settings(user_id, active_config['id'])
        rules = prompt_service.get_config_rules(active_config['id'])
        complete_settings = {}
        
        for rule_key, rule_data in rules.items():
            complete_settings[rule_key] = user_settings.get(rule_key, rule_data['default_value'])
        
        return jsonify({
            'success': True,
            'data': {'config_id': active_config['id'], 'settings': complete_settings}
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@bp.route('/settings', methods=['POST'])
def save_user_settings():
    """Kullanıcının prompt ayarlarını veritabanına kaydeder."""
    try:
        user_id = get_user_id()
        data = request.get_json()
        
        if not data or 'settings' not in data:
            return jsonify({'success': False, 'error': 'Ayarlar verisi gerekli'}), 400
        
        prompt_service = PromptService()
        active_config = prompt_service.get_active_config()
        if not active_config:
            return jsonify({'success': False, 'error': 'Aktif konfigürasyon bulunamadı'}), 404
        
        success = prompt_service.save_user_settings(user_id, active_config['id'], data['settings'])
        
        if success:
            return jsonify({'success': True, 'message': 'Ayarlar başarıyla kaydedildi'})
        else:
            return jsonify({'success': False, 'error': 'Ayarlar kaydedilemedi'}), 500
            
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
