# -*- coding: utf-8 -*-
#
# Bu dosya, prompt işleme ile ilgili API endpoint'lerini içerir.
#
# İçindekiler:
# - build_complete_prompt: Kullanıcı ayarlarına göre tam bir prompt metni oluşturur.
# - process_news_with_prompt: Haber metnini mevcut prompt ayarlarıyla işler.

from flask import Blueprint, request, jsonify
from services.prompt_service import PromptService
from utils.helpers import get_user_id
import time

# Create a Blueprint for prompt processing endpoints
bp = Blueprint('processing', __name__)

@bp.route('/build-complete-prompt', methods=['POST'])
def build_complete_prompt():
    """
    Kullanıcı ayarlarına ve sağlanan haber metnine göre nihai, tam bir prompt oluşturur.
    Bu, AI'a gönderilmeden önceki son adımdır.
    """
    try:
        user_id = get_user_id()
        data = request.get_json()
        
        prompt_service = PromptService()
        active_config = prompt_service.get_active_config()
        if not active_config:
            return jsonify({'success': False, 'error': 'Aktif konfigürasyon bulunamadı'}), 404
        
        user_settings = data.get('settings', {}) if data else {}
        if not user_settings:
            user_settings = prompt_service.get_user_settings(user_id, active_config['id'])
        
        news_text = data.get('news_text', '') if data else ''
        
        complete_prompt = prompt_service.build_complete_prompt(active_config['id'], user_settings, news_text)
        
        if complete_prompt:
            return jsonify({
                'success': True,
                'data': {
                    'prompt': complete_prompt,
                    'config_id': active_config['id'],
                    'settings_used': user_settings
                }
            })
        else:
            return jsonify({'success': False, 'error': 'Prompt oluşturulamadı'}), 500
            
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@bp.route('/process', methods=['POST'])
def process_news_with_prompt():
    """
    Bir haber metnini, mevcut prompt konfigürasyonu ve kullanıcı ayarlarına göre işler.
    İşlem kaydı oluşturur, AI servisini çağırır ve sonucu günceller.
    """
    try:
        user_id = get_user_id()
        data = request.get_json()
        
        if not data or 'news_text' not in data:
            return jsonify({'success': False, 'error': 'Haber metni gerekli'}), 400
        
        news_text = data['news_text'].strip()
        if len(news_text) < 10:
            return jsonify({'success': False, 'error': 'Haber metni çok kısa'}), 400
            
        prompt_service = PromptService()
        active_config = prompt_service.get_active_config()
        if not active_config:
            return jsonify({'success': False, 'error': 'Aktif konfigürasyon bulunamadı'}), 404
            
        user_settings = data.get('settings', {})
        if not user_settings:
            user_settings = prompt_service.get_user_settings(user_id, active_config['id'])
            
        # İşlem kaydı oluştur
        record_id = prompt_service.create_processing_record(
            user_id=user_id,
            config_id=active_config['id'],
            original_text=news_text,
            settings_used=user_settings
        )
        
        if not record_id:
            return jsonify({'success': False, 'error': 'İşlem kaydı oluşturulamadı'}), 500
            
        # İşlemi başlat
        start_time = time.time()
        
        try:
            # AI servisini başlat
            from services.ai_service import AIService
            ai_service = AIService(prompt_service=prompt_service)
            
            # Haber metnini işle
            result = ai_service.process_news(
                news_text=news_text,
                user_settings=user_settings,
                user_id=user_id
            )
            
            # İşlem süresini hesapla
            processing_time = int((time.time() - start_time) * 1000)  # milisaniye cinsinden
            
            if result.get('success'):
                # Başarılı işlem
                prompt_service.update_processing_record(
                    record_id,
                    status='completed',
                    processed_text=result.get('processed_text', ''),
                    processing_time_ms=processing_time,
                    processing_id=result.get('processing_id')
                )
                
                return jsonify({
                    'success': True,
                    'data': {
                        'processing_id': record_id,
                        'status': 'completed',
                        'processing_time_ms': processing_time,
                        'settings_used': user_settings,
                        'original_text': result.get('original_text', ''),
                        'processed_text': result.get('processed_text', '')
                    }
                })
            else:
                # Hata durumu
                error_msg = result.get('error', 'Bilinmeyen bir hata oluştu')
                prompt_service.update_processing_record(
                    record_id,
                    status='failed',
                    processing_time_ms=processing_time,
                    error_message=error_msg
                )
                return jsonify({
                    'success': False,
                    'error': error_msg
                }), 500
            
        except Exception as process_error:
            processing_time = int((time.time() - start_time) * 1000)
            prompt_service.update_processing_record(
                record_id,
                status='failed',
                processing_time_ms=processing_time,
                error_message=str(process_error)
            )
            raise process_error
            
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
