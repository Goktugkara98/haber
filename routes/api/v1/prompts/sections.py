# -*- coding: utf-8 -*-
#
# Bu dosya, prompt bölümleri ile ilgili API endpoint'lerini içerir.
#
# İçindekiler:
# - get_prompt_section: Belirli bir prompt bölümünün metnini getirir.
# - update_prompt_section: Belirli bir prompt bölümünün metnini günceller.

from flask import Blueprint, request, jsonify
from services.prompt_service import PromptService

# Create a Blueprint for prompt section endpoints
bp = Blueprint('sections', __name__)

@bp.route('/sections/<section_key>', methods=['GET'])
def get_prompt_section(section_key):
    """Aktif konfigürasyondaki belirli bir prompt bölümünü (örn: 'ozet_stili') getirir."""
    try:
        prompt_service = PromptService()
        active_config = prompt_service.get_active_config()
        if not active_config:
            return jsonify({'success': False, 'error': 'Aktif konfigürasyon bulunamadı'}), 404
        
        sections = prompt_service.get_config_sections(active_config['id'])
        if section_key not in sections:
            return jsonify({'success': False, 'error': 'Bölüm bulunamadı'}), 404
        
        return jsonify({'success': True, 'data': sections[section_key]})
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@bp.route('/sections/<section_key>', methods=['PUT'])
def update_prompt_section(section_key):
    """Aktif konfigürasyondaki belirli bir prompt bölümünün metnini günceller."""
    try:
        data = request.get_json()
        if not data or 'prompt_text' not in data:
            return jsonify({'success': False, 'error': 'Prompt metni gerekli'}), 400
        
        prompt_service = PromptService()
        active_config = prompt_service.get_active_config()
        if not active_config:
            return jsonify({'success': False, 'error': 'Aktif konfigürasyon bulunamadı'}), 404
        
        success = prompt_service.update_prompt_section(active_config['id'], section_key, data['prompt_text'])
        
        if success:
            return jsonify({'success': True, 'message': 'Bölüm başarıyla güncellendi'})
        else:
            return jsonify({'success': False, 'error': 'Bölüm güncellenemedi'}), 500
            
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
