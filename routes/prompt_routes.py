# -*- coding: utf-8 -*-
#
#Bu dosya, AI'a gönderilecek olan "prompt"ların (komut metinleri) yönetimiyle
#ilgili API yönlendirmelerini içerir. Prompt konfigürasyonları, bölümleri ve
#kullanıcıya özel ayarlar bu dosya üzerinden yönetilir.
#
#İçindekiler:
#1.0 Yardımcı Fonksiyonlar
#    - get_user_id: Kullanıcı için eşsiz bir oturum kimliği oluşturur veya mevcut olanı döndürür.
#2.0 Prompt Konfigürasyon API'leri
#    - get_prompt_config: Mevcut aktif prompt konfigürasyonunu getirir.
#    - export_configuration: Mevcut aktif konfigürasyonu dışa aktarır (JSON formatında).
#3.0 Kullanıcı Ayarları API'leri
#    - get_user_settings: Kullanıcının mevcut prompt ayarlarını getirir.
#    - save_user_settings: Kullanıcının prompt ayarlarını kaydeder.
#4.0 Prompt Bölüm API'leri
#    - get_prompt_section: Belirli bir prompt bölümünün metnini getirir.
#    - update_prompt_section: Belirli bir prompt bölümünün metnini günceller.
#5.0 Prompt İşlem API'leri
#    - build_complete_prompt: Kullanıcı ayarlarına göre tam bir prompt metni oluşturur.
#    - process_news_with_prompt: Haber metnini mevcut prompt ayarlarıyla işler.

from flask import Blueprint, request, jsonify, session
from services.prompt_service import PromptService
from utils.helpers import get_user_id
import time

bp = Blueprint('prompt', __name__)


# --- 1.0 Yardımcı Fonksiyonlar ---
# get_user_id artık utils.helpers modülünden içe aktarılıyor

# --- 2.0 Prompt Konfigürasyon API'leri ---

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


# --- 3.0 Kullanıcı Ayarları API'leri ---

@bp.route('/user-settings', methods=['GET'])
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

@bp.route('/user-settings', methods=['POST'])
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


# --- 4.0 Prompt Bölüm API'leri ---

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


# --- 5.0 Prompt İşlem API'leri ---

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
    İşlem kaydı oluşturur, AI servisini çağırır (simüle eder) ve sonucu günceller.
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
        
        start_time = time.time()
        record_id = prompt_service.create_processing_record(user_id, active_config['id'], news_text, user_settings)
        if not record_id:
            return jsonify({'success': False, 'error': 'İşlem kaydı oluşturulamadı'}), 500
        
        try:
            complete_prompt = prompt_service.build_complete_prompt(active_config['id'], user_settings)
            if not complete_prompt:
                prompt_service.update_processing_record(record_id, status='failed', error_message='Prompt oluşturulamadı')
                return jsonify({'success': False, 'error': 'Prompt oluşturulamadı'}), 500
            
            # TODO: Bu kısımda AI servisi ile entegrasyon yapılacak.
            # Şimdilik yer tutucu (placeholder) bir yanıt döndürülüyor.
            processing_time = int((time.time() - start_time) * 1000)
            
            processed_result = {
                'baslik': 'AI İşleme Henüz Aktif Değil',
                'ozet': 'Bu bir test çıktısıdır. AI entegrasyonu tamamlandığında gerçek sonuçlar görünecek.',
                'haber_metni': news_text,
                'kategori': user_settings.get('targetCategory', 'Genel'),
                'etiketler': ['test', 'placeholder', 'ai-integration']
            }
            
            prompt_service.update_processing_record(
                record_id,
                processed_text=str(processed_result),
                status='completed',
                processing_time_ms=processing_time
            )
            
            return jsonify({
                'success': True,
                'data': {
                    'result': processed_result,
                    'processing_time_ms': processing_time,
                    'record_id': record_id,
                    'prompt_used': complete_prompt,
                    'settings_used': user_settings
                }
            })
            
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
