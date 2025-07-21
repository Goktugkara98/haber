# -*- coding: utf-8 -*-
"""
Bu dosya, Flask uygulamasının ana yönlendirmelerini (routes) içerir.
Kullanıcının etkileşimde bulunduğu temel sayfaları ve ana API uç noktalarını yönetir.

İçindekiler:
1.0 Yardımcı Fonksiyonlar
    - get_user_id: Kullanıcı için eşsiz bir oturum kimliği oluşturur veya mevcut olanı döndürür.
2.0 Sayfa Yönlendirmeleri
    - home: Ana sayfayı render eder.
    - news: Haber işleme sayfasını render eder.
    - history: Geçmiş işlemler sayfasını render eder.
3.0 API Yönlendirmeleri
    - process_news: Gönderilen haber metnini AI servisi ile işler.
    - get_statistics: Kullanıcının işlem istatistiklerini getirir.
    - get_history: Kullanıcının geçmiş işlemlerini listeler.
    - get_processing_status: Belirli bir işlemin durumunu sorgular.
    - mark_as_read: Bir mesajı okundu olarak işaretler.
"""

from flask import Blueprint, render_template, request, jsonify, session
from services.prompt_service import PromptService
from services.ai_service import AIService
from database.connection import DatabaseConnection
import uuid
import time
import json

bp = Blueprint('main', __name__)


# --- 1.0 Yardımcı Fonksiyonlar ---

def get_user_id():
    """
    Kullanıcı için bir oturum (session) kimliği alır veya oluşturur.
    Oturumda 'user_id' yoksa, yeni bir UUID4 oluşturur ve atar.
    """
    if 'user_id' not in session:
        session['user_id'] = str(uuid.uuid4())
    return session['user_id']


# --- 2.0 Sayfa Yönlendirmeleri ---

@bp.route('/')
def home():
    """Ana sayfayı ('index.html') render eder."""
    return render_template('index.html')

@bp.route('/news', methods=['GET', 'POST'])
def news():
    """Haber işleme sayfasını ('news.html') render eder."""
    if request.method == 'POST':
        # Gelecekte AI ile haber işleme mantığı buraya eklenebilir.
        pass
    return render_template('news.html')

@bp.route('/history')
def history():
    """Geçmiş sayfasını ('history.html') render eder."""
    return render_template('history.html')


# --- 3.0 API Yönlendirmeleri ---

@bp.route('/api/process-news', methods=['POST'])
def process_news():
    """
    Haber metnini işlemek için kullanılan ana API endpoint'i.
    Gelen JSON verisinden haber metnini ve kullanıcı ayarlarını alır,
    AI servisi aracılığıyla işler ve sonucu döndürür.
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'error': 'Veri sağlanmadı'}), 400
        
        news_text = data.get('news_text', '').strip()
        user_settings = data.get('settings', {})
        
        if not news_text:
            return jsonify({'success': False, 'error': 'Haber metni gerekli'}), 400
        
        user_id = get_user_id()
        ai_service = AIService()
        
        # AI servisi metni işler (veritabanı kaydı dahil)
        result = ai_service.process_news(news_text, user_settings, user_id)
        
        if result.get('success'):
            return jsonify({
                'success': True,
                'original_text': result.get('original_text'),
                'processed_text': result.get('processed_text'),
                'processing_id': result.get('processing_id'),
                'timestamp': result.get('timestamp'),
                'status': result.get('status')
            })
        else:
            return jsonify({
                'success': False,
                'error': result.get('error'),
                'processing_id': result.get('processing_id'),
                'status': result.get('status')
            }), 400
            
    except Exception as e:
        print(f"Hata (process_news): {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@bp.route('/api/statistics', methods=['GET'])
def get_statistics():
    """Kullanıcının işlem istatistiklerini getirir."""
    try:
        user_id = get_user_id()
        ai_service = AIService()
        stats = ai_service.get_user_statistics(user_id)
        
        return jsonify({'success': True, 'statistics': stats})
        
    except Exception as e:
        print(f"Hata (get_statistics): {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@bp.route('/api/history', methods=['GET'])
def get_history():
    """
    Kullanıcının işleme geçmişini getirir.
    'limit' parametresi ile sonuç sayısı sınırlandırılabilir.
    """
    try:
        user_id = get_user_id()
        limit = request.args.get('limit', 50, type=int)
        
        ai_service = AIService()
        history = ai_service.get_processing_history(user_id, limit)
        
        return jsonify({'success': True, 'history': history})
        
    except Exception as e:
        print(f"Hata (get_history): {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@bp.route('/api/processing-status/<int:processing_id>', methods=['GET'])
def get_processing_status(processing_id):
    """
    Belirli bir işleme ait (processing_id) detayları ve durumu getirir.
    Sadece ilgili kullanıcı kendi işlem kaydını görebilir.
    """
    try:
        user_id = get_user_id()
        
        db = DatabaseConnection()
        cursor = db.connection.cursor(dictionary=True)
        
        query = """
        SELECT id, original_text, processed_text, status, created_at, completed_at
        FROM processing_history 
        WHERE id = %s AND user_id = %s
        """
        
        cursor.execute(query, (processing_id, user_id))
        result = cursor.fetchone()
        cursor.close()
        
        if not result:
            return jsonify({'success': False, 'error': 'İşlem kaydı bulunamadı'}), 404
        
        return jsonify({'success': True, 'processing': result})
        
    except Exception as e:
        print(f"Hata (get_processing_status): {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@bp.route('/api/mark-as-read/<int:processing_id>', methods=['POST'])
def mark_as_read(processing_id):
    """Bir işlem kaydını okundu olarak işaretler."""
    try:
        user_id = get_user_id()
        ai_service = AIService()
        success = ai_service.mark_as_read(processing_id, user_id)
        
        if success:
            return jsonify({'success': True})
        else:
            return jsonify({'success': False, 'error': 'Okundu olarak işaretlenemedi'}), 400
            
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
