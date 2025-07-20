from flask import Blueprint, render_template, request, jsonify, session
from services.prompt_service import PromptService
from services.ai_service import AIService
import uuid
import time
import json

bp = Blueprint('main', __name__)

def get_user_id():
    """Get or create user session ID"""
    if 'user_id' not in session:
        session['user_id'] = str(uuid.uuid4())
    return session['user_id']

@bp.route('/')
def home():
    """Ana sayfa"""
    return render_template('index.html')

@bp.route('/news', methods=['GET', 'POST'])
def news():
    """Haber işleme sayfası"""
    if request.method == 'POST':
        # Gelecekte AI ile haber işleme buraya eklenecek
        pass
    return render_template('news.html')

@bp.route('/api/process-news', methods=['POST'])
def process_news():
    """Haber işleme API endpoint'i"""
    try:
        # Get request data
        data = request.get_json()
        if not data:
            return jsonify({
                'success': False,
                'error': 'No data provided'
            }), 400
        
        news_text = data.get('news_text', '').strip()
        user_settings = data.get('settings', {})
        
        if not news_text:
            return jsonify({
                'success': False,
                'error': 'News text is required'
            }), 400
        
        # Get user ID
        user_id = get_user_id()
        
        # Initialize services
        prompt_service = PromptService()
        ai_service = AIService()
        
        # Get active configuration
        active_config = prompt_service.get_active_config()
        if not active_config:
            return jsonify({
                'success': False,
                'error': 'No active configuration found'
            }), 404
        
        config_id = active_config['id']
        
        # Save user settings to database
        if user_settings:
            prompt_service.save_user_settings(user_id, config_id, user_settings)
        
        # Create processing record
        record_id = prompt_service.create_processing_record(
            user_id, config_id, news_text, user_settings
        )
        
        start_time = time.time()
        
        try:
            # Build complete prompt with user settings and news text
            complete_prompt = prompt_service.build_complete_prompt(config_id, user_settings, news_text)
            
            if not complete_prompt:
                raise Exception('Failed to build prompt')
            
            # Process with AI service
            result = ai_service.process_news(news_text, complete_prompt, user_settings)
            
            if not result or not result.get('success'):
                raise Exception(result.get('error', 'AI processing failed'))
            
            # Calculate processing time
            processing_time = int((time.time() - start_time) * 1000)
            
            # Update processing record with success
            if record_id:
                prompt_service.update_processing_record(
                    record_id, 
                    processed_text=json.dumps(result.get('data'), ensure_ascii=False),
                    status='completed',
                    processing_time_ms=processing_time
                )
            
            # Return successful result
            return jsonify({
                'success': True,
                'data': result.get('data'),
                'processing_time_ms': processing_time,
                'record_id': record_id,
                'settings_applied': user_settings
            })
            
        except Exception as processing_error:
            # Update processing record with error
            if record_id:
                prompt_service.update_processing_record(
                    record_id,
                    status='failed',
                    error_message=str(processing_error),
                    processing_time_ms=int((time.time() - start_time) * 1000)
                )
            
            raise processing_error
            
    except Exception as e:
        print(f"Error in process_news: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
