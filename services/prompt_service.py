# -*- coding: utf-8 -*-
#
#Bu dosya, AI prompt'larının (komut metinleri) yapılandırılması ve yönetimi
#için servis mantığını içerir. Veritabanından prompt konfigürasyonlarını,
#bölümlerini, kurallarını ve kullanıcı ayarlarını okur. Bu bilgilere dayanarak
#AI modeline gönderilecek olan nihai prompt'u oluşturur.
#
#İçindekiler:
#1.0 Başlatma ve Yardımcı Metotlar
#    - __init__, __del__: Sınıfın başlatılması ve sonlandırılması.
#    - _load_prompt_templates: Şablonları JSON dosyasından yükler.
#    - _get_default_templates: Varsayılan şablonları döndürür.
#    - _get_category_display_name: Kategori anahtarına karşılık gelen görünen adı döndürür.
#2.0 Konfigürasyon Getirme Metotları
#    - get_active_config: Aktif prompt konfigürasyonunu getirir.
#    - get_config_sections, get_config_rules, get_rule_options: Konfigürasyonun parçalarını getirir.
#    - get_full_config_data: Arayüz için tüm konfigürasyon verisini toplar.
#    - export_config: Konfigürasyonu JSON olarak dışa aktarır.
#3.0 Kullanıcı Ayar Metotları
#    - get_user_settings: Kullanıcının ayarlarını veritabanından okur.
#    - save_user_setting, save_user_settings: Kullanıcı ayarlarını kaydeder.
#4.0 Prompt Oluşturma Metotları
#    - build_complete_prompt: Tüm parçaları birleştirerek nihai prompt'u oluşturur.
#    - _build_...: Prompt'un her bir bölümünü (görev tanımı, kurallar vb.) oluşturan yardımcı metotlar.
#5.0 Veritabanı İşlem Metotları
#    - update_prompt_section: Bir prompt bölümünü günceller.
#    - create_processing_record, update_processing_record: İşlem geçmişi kayıtlarını yönetir.
#    - get_user_history: Kullanıcının işlem geçmişini alır.

import json
import os
from datetime import datetime
from database.connection import DatabaseConnection

class PromptService:
    """
    Prompt yapılandırma ve oluşturma işlemlerini yöneten servis sınıfı.
    """
    # --- 1.0 Başlatma ve Yardımcı Metotlar ---

    def __init__(self):
        """Servisi başlatır, veritabanı bağlantısı kurar ve prompt şablonlarını yükler."""
        self.db = DatabaseConnection()
        self.prompt_templates = self._load_prompt_templates()

    def __del__(self):
        """Nesne silinirken veritabanı bağlantısını temizler."""
        if hasattr(self, 'db'):
            self.db.disconnect()

    def _load_prompt_templates(self):
        """Prompt şablonlarını 'config/prompt_templates.json' dosyasından yükler."""
        try:
            # Dosya yolunu dinamik olarak belirle
            config_path = os.path.join(os.path.dirname(__file__), '..', 'config', 'prompt_templates.json')
            with open(config_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            print(f"Hata: Prompt şablonları yüklenemedi: {e}")
            return self._get_default_templates()

    def _get_default_templates(self):
        """Yapılandırma dosyası bulunamazsa kullanılacak varsayılan şablonları sağlar."""
        return {
            "task_definition": {"text": "Sen profesyonel bir AI editörsün."},
            "final_instruction": {"text": "Bu kurallara göre metni işle ve JSON çıktısı ver."}
        }

    def _get_category_display_name(self, category_key):
        """Kategori anahtarını (örn: 'asayis') alıp görünen adını (örn: 'Asayiş') döndürür."""
        category_map = {
            'asayis': 'Asayiş', 'gundem': 'Gündem', 'ekonomi': 'Ekonomi',
            'siyaset': 'Siyaset', 'spor': 'Spor', 'teknoloji': 'Teknoloji',
            'saglik': 'Sağlık', 'yasam': 'Yaşam', 'egitim': 'Eğitim',
            'dunya': 'Dünya', 'kultur': 'Kültür & Sanat', 'magazin': 'Magazin',
            'genel': 'Genel'
        }
        return category_map.get(category_key, category_key)

    # --- 2.0 Konfigürasyon Getirme Metotları ---

    def get_active_config(self):
        """Veritabanından 'is_active' olarak işaretlenmiş prompt konfigürasyonunu getirir."""
        query = "SELECT * FROM prompt_configs WHERE is_active = TRUE LIMIT 1"
        return self.db.execute_query(query, fetch_one=True)

    def get_config_sections(self, config_id):
        """Belirli bir konfigürasyona ait tüm prompt bölümlerini getirir."""
        query = "SELECT * FROM prompt_sections WHERE config_id = %s AND is_active = TRUE ORDER BY display_order"
        results = self.db.execute_query(query, (config_id,), fetch_all=True)
        return {row['section_key']: row for row in results} if results else {}

    def get_config_rules(self, config_id):
        """Belirli bir konfigürasyona ait tüm kuralları getirir."""
        query = "SELECT * FROM prompt_rules WHERE config_id = %s AND is_active = TRUE ORDER BY display_order"
        results = self.db.execute_query(query, (config_id,), fetch_all=True)
        return {row['rule_key']: row for row in results} if results else {}

    def get_rule_options(self, config_id, rule_key):
        """Belirli bir kurala ait (örn: 'newsType') seçenekleri (örn: 'social', 'comprehensive') getirir."""
        query = """
            SELECT o.* FROM prompt_rule_options o
            JOIN prompt_rules r ON o.rule_id = r.id
            WHERE r.config_id = %s AND r.rule_key = %s AND o.is_active = TRUE
            ORDER BY o.display_order
        """
        return self.db.execute_query(query, (config_id, rule_key), fetch_all=True)

    def get_full_config_data(self, config_id=None):
        """Arayüzde (frontend) kullanılmak üzere tüm konfigürasyon verilerini bir araya getirir."""
        if not config_id:
            active_config = self.get_active_config()
            if not active_config: return None
            config_id = active_config['id']
        
        rules = self.get_config_rules(config_id)
        rule_options = {key: self.get_rule_options(config_id, key) for key in rules}
        
        return {
            'config': self.get_active_config(),
            'sections': self.get_config_sections(config_id),
            'rules': rules,
            'rule_options': rule_options
        }

    def export_config(self, config_id):
        """Belirtilen konfigürasyonu JSON formatında dışa aktarmak için veriyi hazırlar."""
        config_data = self.get_full_config_data(config_id)
        return {'export_date': datetime.now().isoformat(), 'config_data': config_data} if config_data else None

    # --- 3.0 Kullanıcı Ayar Metotları ---

    def get_user_settings(self, user_id, config_id):
        """Kullanıcının belirli bir konfigürasyon için kaydettiği ayarları veritabanından okur."""
        query = "SELECT rule_key, setting_value FROM user_prompt_settings WHERE user_id = %s AND config_id = %s"
        results = self.db.execute_query(query, (user_id, config_id), fetch_all=True)
        return {row['rule_key']: row['setting_value'] for row in results} if results else {}

    def save_user_setting(self, user_id, config_id, rule_key, setting_value):
        """Kullanıcının tek bir ayarını veritabanına kaydeder veya günceller."""
        query = """
            INSERT INTO user_prompt_settings (user_id, config_id, rule_key, setting_value)
            VALUES (%s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)
        """
        self.db.execute_query(query, (user_id, config_id, rule_key, setting_value))
        return True

    def save_user_settings(self, user_id, config_id, settings_dict):
        """Kullanıcının birden çok ayarını tek seferde kaydeder."""
        for rule_key, setting_value in settings_dict.items():
            self.save_user_setting(user_id, config_id, rule_key, str(setting_value))
        return True

    # --- 4.0 Prompt Oluşturma Metotları ---

    def build_complete_prompt(self, config_id, user_settings, news_text=''):
        """
        Tüm şablonları, kuralları ve kullanıcı ayarlarını birleştirerek
        AI modeline gönderilecek olan nihai, tam prompt metnini oluşturur.
        """
        try:
            prompt_parts = [
                self._build_task_definition(),
                self._build_writing_rules(user_settings),
                self._build_output_requirements_modular(user_settings),
                self._build_category_list(user_settings),
                self._build_output_format(user_settings),
                self._build_custom_instructions(user_settings),
                self._build_news_content(news_text),
                self._build_final_instruction()
            ]
            # Sadece dolu olan kısımları birleştir
            return '\n\n'.join(filter(None, (part.strip() for part in prompt_parts)))
        except Exception as e:
            print(f"Hata: Prompt oluşturulamadı: {e}")
            return None

    def _build_task_definition(self):
        return f"GÖREV TANIMI:\n{self.prompt_templates.get('task_definition', {}).get('text', '')}"

    def _build_writing_rules(self, user_settings):
        rules_config = self.prompt_templates.get('writing_rules', {})
        rules = "\n".join(rules_config.values())
        return f"KURALLAR:\n{rules}" if rules else ""

    def _build_output_requirements_modular(self, user_settings):
        reqs = [
            self._build_title_requirements(user_settings),
            self._build_summary_requirements(user_settings),
            self._build_content_requirements(user_settings),
            self._build_category_requirements(user_settings),
            self._build_tags_requirements(user_settings)
        ]
        return f"İSTENEN ÇIKTILAR:\n" + "".join(filter(None, reqs))

    def _build_title_requirements(self, user_settings):
        templates = self.prompt_templates.get('title_requirements', {})
        use_city = str(user_settings.get('titleCityInfo', 'False')).lower() == 'true'
        key = 'with_city' if use_city else 'without_city'
        return templates.get(key, "") + "\n"

    def _build_summary_requirements(self, user_settings):
        return self.prompt_templates.get('summary_requirements', {}).get('default', "") + "\n"

    def _build_content_requirements(self, user_settings):
        templates = self.prompt_templates.get('content_requirements', {})
        news_type = user_settings.get('newsType', 'comprehensive')
        content_req = templates.get(news_type, "")
        
        if str(user_settings.get('removeCompanyInfo', 'True')).lower() == 'true':
            content_req += templates.get('company_removal', '')
        if str(user_settings.get('removePlateInfo', 'True')).lower() == 'true':
            content_req += templates.get('plate_removal', '')
            
        return content_req + ".\n" if content_req else ""

    def _build_category_requirements(self, user_settings):
        templates = self.prompt_templates.get('category_requirements', {})
        category = user_settings.get('targetCategory')
        if category and category != 'auto':
            name = self._get_category_display_name(category)
            return templates.get('specific', '').format(category_name=name) + "\n"
        return templates.get('automatic', '') + "\n"

    def _build_tags_requirements(self, user_settings):
        template = self.prompt_templates.get('tags_requirements', {}).get('template', '')
        count = user_settings.get('tagCount', 5)
        return template.format(tag_count=count) + "\n"

    def _build_category_list(self, user_settings):
        categories = ["Asayiş", "Gündem", "Ekonomi", "Siyaset", "Spor", "Teknoloji", "Sağlık", "Yaşam", "Eğitim", "Dünya", "Kültür & Sanat", "Magazin", "Genel"]
        return f"KATEGORİ LİSTESİ:\n{categories}"

    def _build_output_format(self, user_settings):
        format_key = user_settings.get('outputFormat', 'json')
        format_str = self.prompt_templates.get('output_formats', {}).get(format_key, "")
        return f"[ÇIKTI FORMATI: {format_key.upper()}]\n{format_str}"

    def _build_custom_instructions(self, user_settings):
        instructions = user_settings.get('customInstructions', '').strip()
        return f"ÖZEL TALİMATLAR:\n{instructions}" if instructions else ""

    def _build_news_content(self, news_text):
        return f"ORİJİNAL HABER METNİ:\n{news_text.strip()}" if news_text.strip() else ""

    def _build_final_instruction(self):
        return self.prompt_templates.get('final_instruction', {}).get('text', '')

    # --- 5.0 Veritabanı İşlem Metotları ---

    def update_prompt_section(self, config_id, section_key, prompt_text):
        """Bir prompt bölümünün metnini günceller."""
        query = "UPDATE prompt_sections SET prompt_text = %s WHERE config_id = %s AND section_key = %s"
        result = self.db.execute_query(query, (prompt_text, config_id, section_key))
        return result is not None

    def create_processing_record(self, user_id, config_id, original_text, settings_used):
        """Veritabanında yeni bir işlem geçmişi kaydı oluşturur."""
        query = """
            INSERT INTO processing_history (user_id, config_id, original_text, settings_used, processing_status)
            VALUES (%s, %s, %s, %s, 'pending')
        """
        settings_json = json.dumps(settings_used, ensure_ascii=False)
        self.db.execute_query(query, (user_id, config_id, original_text, settings_json))
        id_result = self.db.execute_query("SELECT LAST_INSERT_ID() as id", fetch_one=True)
        return id_result['id'] if id_result else None

    def update_processing_record(self, record_id, **kwargs):
        """Bir işlem geçmişi kaydını günceller. (status, processed_text vb.)"""
        fields = [f"{key} = %s" for key in kwargs]
        query = f"UPDATE processing_history SET {', '.join(fields)}, completed_at = CURRENT_TIMESTAMP WHERE id = %s"
        values = list(kwargs.values()) + [record_id]
        result = self.db.execute_query(query, tuple(values))
        return result is not None

    def get_user_history(self, user_id, limit=20, offset=0):
        """Kullanıcının işlem geçmişini veritabanından alır."""
        query = """
            SELECT h.*, c.name as config_name FROM processing_history h
            LEFT JOIN prompt_configs c ON h.config_id = c.id
            WHERE h.user_id = %s ORDER BY h.created_at DESC LIMIT %s OFFSET %s
        """
        results = self.db.execute_query(query, (user_id, limit, offset), fetch_all=True)
        if results:
            for row in results:
                if row.get('settings_used'):
                    try: row['settings_used'] = json.loads(row['settings_used'])
                    except: row['settings_used'] = {}
        return results if results else []
