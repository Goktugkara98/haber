# -*- coding: utf-8 -*-
#
#Bu dosya, yapay zeka (AI) işlemleriyle ilgili servis mantığını içerir.
#Google Gemini API'si ile entegrasyonu yönetir, haber metinlerini işler
#ve veritabanı ile ilgili işlemleri (kayıt, güncelleme, sorgulama) gerçekleştirir.
#
#İçindekiler:
#1.0 Ana Servis Metotları
#    - process_news: Bir haber metnini AI ile işler.
#    - get_processing_history: Kullanıcının geçmiş işlemlerini veritabanından alır.
#    - mark_as_read: Bir işlem kaydını okundu olarak işaretler.
#    - get_user_statistics: Kullanıcının işlem istatistiklerini hesaplar.
#2.0 Özel Yardımcı Metotlar
#    - _create_prompt: AI modeline gönderilecek komut metnini (prompt) oluşturur.
#    - validate_news: Gelen haber metninin geçerliliğini kontrol eder.
#3.0 Veritabanı İşlemleri
#    - _save_processing_record: Yeni bir işlem kaydını veritabanına ekler.
#    - _update_processing_status: Mevcut bir işlem kaydının durumunu günceller.

import os
import google.generativeai as genai
from datetime import datetime
import json
from database.connection import DatabaseConnection

class AIService:
    """
    Yapay zeka işlemlerini yöneten servis sınıfı.
    """
    def __init__(self):
        """
        AI servisini başlatır. Ortam değişkenlerinden (environment variables)
        GEMINI_API_KEY'i okuyarak Gemini modelini yapılandırır.
        """
        self.api_key = os.getenv('GEMINI_API_KEY')
        if self.api_key:
            genai.configure(api_key=self.api_key)
            self.model = genai.GenerativeModel('gemini-1.5-flash')
        else:
            self.model = None
            print("UYARI: GEMINI_API_KEY ortam değişkeni bulunamadı.")

    # --- 1.0 Ana Servis Metotları ---

    def process_news(self, news_text, rules=None, user_id=None):
        """
        Haber metnini AI ile işleyerek özgün bir haber metni üretir.
        İşlem adımlarını veritabanına kaydeder.

        Args:
            news_text (str): İşlenecek ham haber metni.
            rules (dict, optional): İşlem için kullanılacak ek kurallar.
            user_id (str, optional): İşlemi yapan kullanıcının kimliği.

        Returns:
            dict: İşlemin sonucunu içeren bir sözlük (success, status, data vb.).
        """
        processing_id = None  # Hata durumlarında da ID'ye erişebilmek için
        try:
            # Girdi metnini doğrula
            is_valid, validation_message = self.validate_news(news_text)
            if not is_valid:
                return {'success': False, 'error': validation_message, 'status': 'error'}

            # AI için prompt oluştur
            prompt = self._create_prompt(news_text, rules)

            # Veritabanına başlangıç kaydını at
            processing_id = self._save_processing_record(user_id, news_text, prompt, 'processing', settings_used=rules)

            if not self.model:
                error_msg = 'Gemini API anahtarı yapılandırılmamış.'
                self._update_processing_status(processing_id, 'error', error_msg)
                return {'success': False, 'error': error_msg, 'status': 'error', 'processing_id': processing_id}

            # Gemini API'sini çağır
            response = self.model.generate_content(prompt)
            processed_text = response.text if response.text else "AI işlemi başarısız oldu."

            # Veritabanındaki kaydı sonuç ile güncelle
            self._update_processing_status(processing_id, 'completed', processed_text)

            return {
                'success': True,
                'original_text': news_text,
                'processed_text': processed_text,
                'status': 'completed',
                'processing_id': processing_id,
                'timestamp': datetime.now().isoformat()
            }

        except Exception as e:
            error_msg = f"AI işleme hatası: {str(e)}"
            if processing_id:
                self._update_processing_status(processing_id, 'error', error_msg)
            
            return {
                'success': False,
                'error': error_msg,
                'status': 'error',
                'processing_id': processing_id
            }

    def get_processing_history(self, user_id, limit=50, offset=0):
        """Kullanıcının geçmiş işlemlerini veritabanından alır."""
        try:
            db = DatabaseConnection()
            # Sütun adları ile sonuç almak için dictionary=True kullanılır
            cursor = db.connection.cursor(dictionary=True)
            
            query = """
            SELECT id, original_text, processed_text, processing_status as status, 
                   read_status, created_at, completed_at
            FROM processing_history
            WHERE user_id = %s
            ORDER BY created_at DESC
            LIMIT %s OFFSET %s
            """
            cursor.execute(query, (user_id, limit, offset))
            results = cursor.fetchall()
            
            # Tarih alanlarını ISO formatına çevir
            for row in results:
                row['created_at'] = row['created_at'].isoformat() if row.get('created_at') else None
                row['completed_at'] = row['completed_at'].isoformat() if row.get('completed_at') else None

            cursor.close()
            return results
            
        except Exception as e:
            print(f"Veritabanı hatası (get_processing_history): {e}")
            return []

    def mark_as_read(self, processing_id, user_id):
        """Belirtilen işlem kaydını okundu olarak işaretler."""
        try:
            db = DatabaseConnection()
            cursor = db.cursor
            
            query = "UPDATE processing_history SET read_status = 'read' WHERE id = %s AND user_id = %s"
            cursor.execute(query, (processing_id, user_id))
            db.connection.commit()
            cursor.close()
            return True
            
        except Exception as e:
            print(f"Veritabanı hatası (mark_as_read): {e}")
            return False

    def get_user_statistics(self, user_id):
        """Kullanıcının işlem istatistiklerini (toplam, tamamlanan vb.) hesaplar."""
        try:
            db = DatabaseConnection()
            cursor = db.connection.cursor(dictionary=True)
            
            query = """
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN processing_status = 'completed' THEN 1 ELSE 0 END) as completed,
                SUM(CASE WHEN processing_status = 'failed' THEN 1 ELSE 0 END) as failed,
                SUM(CASE WHEN processing_status = 'processing' THEN 1 ELSE 0 END) as processing
            FROM processing_history
            WHERE user_id = %s
            """
            cursor.execute(query, (user_id,))
            stats = cursor.fetchone()
            cursor.close()
            
            # Sonuçları int'e çevir, None ise 0 ata
            return {key: int(value) if value else 0 for key, value in stats.items()}
            
        except Exception as e:
            print(f"Veritabanı hatası (get_user_statistics): {e}")
            return {'total': 0, 'completed': 0, 'failed': 0, 'processing': 0}

    # --- 2.0 Özel Yardımcı Metotlar ---

    def _create_prompt(self, news_text, rules=None):
        """AI modeli için temel bir komut metni (prompt) oluşturur."""
        # Not: Bu fonksiyon, prompt_service'teki daha gelişmiş yapı yerine
        # temel bir şablon kullanır. Gerekirse prompt_service'ten çağrı yapılabilir.
        base_prompt = """
Sen profesyonel bir haber editörüsün. Verilen haber metnini özgün, kaliteli ve etik kurallara uygun şekilde yeniden yazman gerekiyor.

Kurallar:
- Orijinal haberin ana mesajını koruyarak tamamen yeni bir metin oluştur.
- Türkçe dil kurallarına uygun, akıcı bir metin yaz.
- Objektif ve tarafsız bir dil kullan.
- Başlık ve içerik tutarlı olsun.

Orijinal Haber Metni:
{}

Lütfen bu haberi özgün şekilde yeniden yaz:"""
        return base_prompt.format(news_text)
        
    def validate_news(self, news_text):
        """Haber metninin uzunluk gibi temel kurallara uygunluğunu doğrular."""
        if not news_text or len(news_text.strip()) < 10:
            return False, "Haber metni çok kısa (minimum 10 karakter)."
        if len(news_text) > 10000:
            return False, "Haber metni çok uzun (maksimum 10,000 karakter)."
        return True, "Geçerli"

    # --- 3.0 Veritabanı İşlemleri ---

    def _save_processing_record(self, user_id, original_text, prompt_text, status, settings_used=None):
        """Yeni bir işlem kaydını veritabanına ekler ve ID'sini döndürür."""
        try:
            db = DatabaseConnection()
            cursor = db.cursor
            
            query = """
            INSERT INTO processing_history 
            (user_id, original_text, prompt_text, processing_status, settings_used, created_at) 
            VALUES (%s, %s, %s, %s, %s, %s)
            """
            settings_json = json.dumps(settings_used) if settings_used else None
            
            cursor.execute(query, (user_id, original_text, prompt_text, status, settings_json, datetime.now()))
            db.connection.commit()
            processing_id = cursor.lastrowid
            cursor.close()
            return processing_id
            
        except Exception as e:
            print(f"Veritabanı hatası (kayıt): {e}")
            return None

    def _update_processing_status(self, processing_id, status, processed_text=None):
        """Mevcut bir işlem kaydının durumunu ve işlenmiş metnini günceller."""
        try:
            db = DatabaseConnection()
            cursor = db.cursor
            
            query = """
            UPDATE processing_history 
            SET processing_status = %s, processed_text = %s, completed_at = %s
            WHERE id = %s
            """
            cursor.execute(query, (status, processed_text, datetime.now(), processing_id))
            db.connection.commit()
            cursor.close()
            
        except Exception as e:
            print(f"Veritabanı hatası (güncelleme): {e}")
