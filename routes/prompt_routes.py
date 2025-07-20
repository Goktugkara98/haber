"""
Prompt Configuration API Routes
Handles API endpoints for prompt settings and configurations
"""

from flask import Blueprint, request, jsonify, session
from services.prompt_service import PromptService
import uuid
import time

bp = Blueprint('prompt', __name__)


def get_user_id():
    """Get or create user session ID"""
    if 'user_id' not in session:
        session['user_id'] = str(uuid.uuid4())
    return session['user_id']


@bp.route('/config', methods=['GET'])
def get_prompt_config():
    """Get current prompt configuration"""
    try:
        prompt_service = PromptService()
        config_data = prompt_service.get_full_config_data()
        
        if not config_data:
            return jsonify({
                'success': False,
                'error': 'No active configuration found'
            }), 404
        
        return jsonify({
            'success': True,
            'data': config_data
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@bp.route('/user-settings', methods=['GET'])
def get_user_settings():
    """Get user's current prompt settings"""
    try:
        user_id = get_user_id()
        prompt_service = PromptService()
        
        # Get active config
        active_config = prompt_service.get_active_config()
        if not active_config:
            return jsonify({
                'success': False,
                'error': 'No active configuration found'
            }), 404
        
        # Get user settings
        user_settings = prompt_service.get_user_settings(user_id, active_config['id'])
        
        # Get default values for missing settings
        rules = prompt_service.get_config_rules(active_config['id'])
        complete_settings = {}
        
        for rule_key, rule_data in rules.items():
            if rule_key in user_settings:
                complete_settings[rule_key] = user_settings[rule_key]
            else:
                complete_settings[rule_key] = rule_data['default_value']
        
        return jsonify({
            'success': True,
            'data': {
                'config_id': active_config['id'],
                'settings': complete_settings
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@bp.route('/user-settings', methods=['POST'])
def save_user_settings():
    """Save user's prompt settings"""
    try:
        user_id = get_user_id()
        data = request.get_json()
        
        if not data or 'settings' not in data:
            return jsonify({
                'success': False,
                'error': 'Settings data required'
            }), 400
        
        prompt_service = PromptService()
        
        # Get active config
        active_config = prompt_service.get_active_config()
        if not active_config:
            return jsonify({
                'success': False,
                'error': 'No active configuration found'
            }), 404
        
        # Save settings
        success = prompt_service.save_user_settings(
            user_id, 
            active_config['id'], 
            data['settings']
        )
        
        if success:
            return jsonify({
                'success': True,
                'message': 'Settings saved successfully'
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Failed to save settings'
            }), 500
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@bp.route('/sections/<section_key>', methods=['GET'])
def get_prompt_section(section_key):
    """Get a specific prompt section"""
    try:
        prompt_service = PromptService()
        active_config = prompt_service.get_active_config()
        
        if not active_config:
            return jsonify({
                'success': False,
                'error': 'No active configuration found'
            }), 404
        
        sections = prompt_service.get_config_sections(active_config['id'])
        
        if section_key not in sections:
            return jsonify({
                'success': False,
                'error': 'Section not found'
            }), 404
        
        return jsonify({
            'success': True,
            'data': sections[section_key]
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@bp.route('/sections/<section_key>', methods=['PUT'])
def update_prompt_section(section_key):
    """Update a prompt section"""
    try:
        data = request.get_json()
        
        if not data or 'prompt_text' not in data:
            return jsonify({
                'success': False,
                'error': 'Prompt text required'
            }), 400
        
        prompt_service = PromptService()
        active_config = prompt_service.get_active_config()
        
        if not active_config:
            return jsonify({
                'success': False,
                'error': 'No active configuration found'
            }), 404
        
        success = prompt_service.update_prompt_section(
            active_config['id'], 
            section_key, 
            data['prompt_text']
        )
        
        if success:
            return jsonify({
                'success': True,
                'message': 'Section updated successfully'
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Failed to update section'
            }), 500
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@bp.route('/build-complete-prompt', methods=['POST'])
def build_complete_prompt():
    """Build complete prompt with user settings"""
    try:
        user_id = get_user_id()
        data = request.get_json()
        
        prompt_service = PromptService()
        active_config = prompt_service.get_active_config()
        
        if not active_config:
            return jsonify({
                'success': False,
                'error': 'No active configuration found'
            }), 404
        
        # Get user settings (from request or database)
        if data and 'settings' in data:
            user_settings = data['settings']
        else:
            user_settings = prompt_service.get_user_settings(user_id, active_config['id'])
        
        # Get news text from request if provided
        news_text = data.get('news_text', '') if data else ''
        
        # Build complete prompt
        complete_prompt = prompt_service.build_complete_prompt(
            active_config['id'], 
            user_settings,
            news_text
        )
        
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
            return jsonify({
                'success': False,
                'error': 'Failed to build prompt'
            }), 500
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@bp.route('/history', methods=['GET'])
def get_processing_history():
    """Get user's processing history"""
    try:
        user_id = get_user_id()
        limit = request.args.get('limit', 20, type=int)
        offset = request.args.get('offset', 0, type=int)
        
        prompt_service = PromptService()
        history = prompt_service.get_user_history(user_id, limit, offset)
        
        return jsonify({
            'success': True,
            'data': {
                'history': history,
                'limit': limit,
                'offset': offset
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@bp.route('/process', methods=['POST'])
def process_news_with_prompt():
    """Process news with current prompt configuration"""
    try:
        user_id = get_user_id()
        data = request.get_json()
        
        if not data or 'news_text' not in data:
            return jsonify({
                'success': False,
                'error': 'News text required'
            }), 400
        
        news_text = data['news_text'].strip()
        if len(news_text) < 10:
            return jsonify({
                'success': False,
                'error': 'News text too short'
            }), 400
        
        prompt_service = PromptService()
        active_config = prompt_service.get_active_config()
        
        if not active_config:
            return jsonify({
                'success': False,
                'error': 'No active configuration found'
            }), 404
        
        # Get user settings
        user_settings = data.get('settings', {})
        if not user_settings:
            user_settings = prompt_service.get_user_settings(user_id, active_config['id'])
        
        # Create processing record
        start_time = time.time()
        record_id = prompt_service.create_processing_record(
            user_id, 
            active_config['id'], 
            news_text, 
            user_settings
        )
        
        if not record_id:
            return jsonify({
                'success': False,
                'error': 'Failed to create processing record'
            }), 500
        
        try:
            # Build complete prompt
            complete_prompt = prompt_service.build_complete_prompt(
                active_config['id'], 
                user_settings
            )
            
            if not complete_prompt:
                prompt_service.update_processing_record(
                    record_id, 
                    status='failed', 
                    error_message='Failed to build prompt'
                )
                return jsonify({
                    'success': False,
                    'error': 'Failed to build prompt'
                }), 500
            
            # TODO: Here you would integrate with your AI service
            # For now, return a placeholder response
            processing_time = int((time.time() - start_time) * 1000)
            
            # Placeholder processed result
            processed_result = {
                'baslik': 'AI İşleme Henüz Aktif Değil',
                'ozet': 'Bu bir test çıktısıdır. AI entegrasyonu tamamlandığında gerçek sonuçlar görünecek.',
                'haber_metni': news_text,
                'kategori': user_settings.get('targetCategory', 'Genel'),
                'etiketler': ['test', 'placeholder', 'ai-integration']
            }
            
            # Update processing record
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
            # Update record with error
            processing_time = int((time.time() - start_time) * 1000)
            prompt_service.update_processing_record(
                record_id,
                status='failed',
                processing_time_ms=processing_time,
                error_message=str(process_error)
            )
            raise process_error
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@bp.route('/export', methods=['GET'])
def export_configuration():
    """Export current prompt configuration"""
    try:
        prompt_service = PromptService()
        active_config = prompt_service.get_active_config()
        
        if not active_config:
            return jsonify({
                'success': False,
                'error': 'No active configuration found'
            }), 404
        
        export_data = prompt_service.export_config(active_config['id'])
        
        if export_data:
            return jsonify({
                'success': True,
                'data': export_data
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Failed to export configuration'
            }), 500
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
