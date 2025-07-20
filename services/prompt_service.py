"""
AI Prompt Configuration Service
Handles database operations for prompt settings and configurations
"""

import json
from datetime import datetime
from database.connection import DatabaseConnection


class PromptService:
    def __init__(self):
        self.db = DatabaseConnection()
    
    def get_active_config(self):
        """Get the active prompt configuration"""
        try:
            query = """
            SELECT id, name, description, version, created_at, updated_at
            FROM prompt_configs 
            WHERE is_active = TRUE 
            ORDER BY is_default DESC, updated_at DESC 
            LIMIT 1
            """
            result = self.db.execute_query(query, fetch_one=True)
            return result
        except Exception as e:
            print(f"Error getting active config: {e}")
            return None
    
    def get_config_sections(self, config_id):
        """Get all prompt sections for a configuration"""
        try:
            query = """
            SELECT section_key, section_name, section_description, prompt_text, display_order
            FROM prompt_sections 
            WHERE config_id = %s AND is_active = TRUE
            ORDER BY display_order ASC
            """
            results = self.db.execute_query(query, (config_id,), fetch_all=True)
            return {row['section_key']: row for row in results} if results else {}
        except Exception as e:
            print(f"Error getting config sections: {e}")
            return {}
    
    def get_config_rules(self, config_id):
        """Get all prompt rules for a configuration"""
        try:
            query = """
            SELECT r.rule_key, r.rule_name, r.rule_type, r.rule_category, 
                   r.default_value, r.validation_rules, r.display_order
            FROM prompt_rules r
            WHERE r.config_id = %s AND r.is_active = TRUE
            ORDER BY r.rule_category, r.display_order ASC
            """
            results = self.db.execute_query(query, (config_id,), fetch_all=True)
            return {row['rule_key']: row for row in results} if results else {}
        except Exception as e:
            print(f"Error getting config rules: {e}")
            return {}
    
    def get_rule_options(self, config_id, rule_key):
        """Get options for a specific rule"""
        try:
            query = """
            SELECT o.option_key, o.option_label, o.option_description, o.display_order
            FROM prompt_rule_options o
            JOIN prompt_rules r ON o.rule_id = r.id
            WHERE r.config_id = %s AND r.rule_key = %s AND o.is_active = TRUE
            ORDER BY o.display_order ASC
            """
            results = self.db.execute_query(query, (config_id, rule_key), fetch_all=True)
            return results if results else []
        except Exception as e:
            print(f"Error getting rule options: {e}")
            return []
    
    def get_user_settings(self, user_id, config_id=None):
        """Get user's prompt settings"""
        try:
            if not config_id:
                active_config = self.get_active_config()
                if not active_config:
                    return {}
                config_id = active_config['id']
            
            query = """
            SELECT rule_key, setting_value
            FROM user_prompt_settings
            WHERE user_id = %s AND config_id = %s
            """
            results = self.db.execute_query(query, (user_id, config_id), fetch_all=True)
            return {row['rule_key']: row['setting_value'] for row in results} if results else {}
        except Exception as e:
            print(f"Error getting user settings: {e}")
            return {}
    
    def save_user_setting(self, user_id, config_id, rule_key, setting_value):
        """Save a user's prompt setting"""
        try:
            query = """
            INSERT INTO user_prompt_settings (user_id, config_id, rule_key, setting_value)
            VALUES (%s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE 
                setting_value = VALUES(setting_value),
                updated_at = CURRENT_TIMESTAMP
            """
            self.db.execute_query(query, (user_id, config_id, rule_key, setting_value))
            return True
        except Exception as e:
            print(f"Error saving user setting: {e}")
            return False
    
    def save_user_settings(self, user_id, config_id, settings_dict):
        """Save multiple user settings at once"""
        try:
            success_count = 0
            for rule_key, setting_value in settings_dict.items():
                if self.save_user_setting(user_id, config_id, rule_key, str(setting_value)):
                    success_count += 1
            return success_count == len(settings_dict)
        except Exception as e:
            print(f"Error saving user settings: {e}")
            return False
    
    def update_prompt_section(self, config_id, section_key, prompt_text):
        """Update a prompt section text"""
        try:
            query = """
            UPDATE prompt_sections 
            SET prompt_text = %s, updated_at = CURRENT_TIMESTAMP
            WHERE config_id = %s AND section_key = %s
            """
            result = self.db.execute_query(query, (prompt_text, config_id, section_key))
            return result is not None
        except Exception as e:
            print(f"Error updating prompt section: {e}")
            return False
    
    def create_processing_record(self, user_id, config_id, original_text, settings_used):
        """Create a new processing history record"""
        try:
            query = """
            INSERT INTO processing_history 
            (user_id, config_id, original_text, settings_used, processing_status)
            VALUES (%s, %s, %s, %s, 'pending')
            """
            settings_json = json.dumps(settings_used, ensure_ascii=False)
            result = self.db.execute_query(query, (user_id, config_id, original_text, settings_json))
            
            # Get the inserted ID
            if result is not None:
                query_id = "SELECT LAST_INSERT_ID() as id"
                id_result = self.db.execute_query(query_id, fetch_one=True)
                return id_result['id'] if id_result else None
            return None
        except Exception as e:
            print(f"Error creating processing record: {e}")
            return None
    
    def update_processing_record(self, record_id, processed_text=None, status='completed', 
                               processing_time_ms=0, error_message=None):
        """Update a processing history record"""
        try:
            query = """
            UPDATE processing_history 
            SET processed_text = %s, processing_status = %s, processing_time_ms = %s,
                error_message = %s, completed_at = CURRENT_TIMESTAMP
            WHERE id = %s
            """
            result = self.db.execute_query(query, (processed_text, status, processing_time_ms, 
                                                 error_message, record_id))
            return result is not None
        except Exception as e:
            print(f"Error updating processing record: {e}")
            return False
    
    def get_user_history(self, user_id, limit=20, offset=0):
        """Get user's processing history"""
        try:
            query = """
            SELECT h.id, h.original_text, h.processed_text, h.settings_used,
                   h.processing_status, h.processing_time_ms, h.created_at, h.completed_at,
                   c.name as config_name
            FROM processing_history h
            LEFT JOIN prompt_configs c ON h.config_id = c.id
            WHERE h.user_id = %s
            ORDER BY h.created_at DESC
            LIMIT %s OFFSET %s
            """
            results = self.db.execute_query(query, (user_id, limit, offset), fetch_all=True)
            
            # Parse settings_used JSON
            if results:
                for row in results:
                    if row['settings_used']:
                        try:
                            row['settings_used'] = json.loads(row['settings_used'])
                        except:
                            row['settings_used'] = {}
            
            return results if results else []
        except Exception as e:
            print(f"Error getting user history: {e}")
            return []
    
    def build_complete_prompt(self, config_id, user_settings, news_text=''):
        """Build complete prompt with user settings and news text - Fully Modular System"""
        try:
            print(f"DEBUG: Building prompt with settings: {user_settings}")
            
            # Build each section modularly
            task_definition = self._build_task_definition()
            writing_rules = self._build_writing_rules(user_settings)
            output_requirements = self._build_output_requirements_modular(user_settings)
            category_list = self._build_category_list(user_settings)
            output_format = self._build_output_format(user_settings)
            custom_instructions = self._build_custom_instructions(user_settings)
            news_content = self._build_news_content(news_text)
            final_instruction = self._build_final_instruction()
            
            # Filter out empty parts and join
            prompt = '\n\n'.join([part for part in prompt_parts if part.strip()])
            
            print(f"DEBUG: Generated prompt length: {len(prompt)} characters")
            return prompt
            
        except Exception as e:
            print(f"Error building complete prompt: {e}")
            return None
    
    def _build_task_definition(self):
        """Build task definition section"""
        return """GÖREV TANIMI:
Sen, kurumsal bir gazetenin web sitesi için içerik üreten profesyonel bir yapay zeka editörüsün. Görevin, sana verilen orijinal haber metnini aşağıdaki kurallara göre işleyerek, belirtilen JSON formatında profesyonel ve özgün bir haber içeriği oluşturmaktır."""
    
    def _build_writing_rules(self, user_settings):
        """Build writing rules section based on user settings"""
        writing_style = user_settings.get('writingStyle', 'formal')
        
        rules = "KURALLAR:\n"
        rules += "• ÖZGÜNLÜK: Metin tamamen yeniden yazılmalı, kopya olmamalıdır. Ancak orijinal haberdeki tüm temel bilgiler, veriler, isimler ve tarihler korunmalıdır.\n"
        rules += f"• KURUMSAL DİL: {self._get_writing_style_rule(writing_style)}\n"
        rules += "• ÇIKTININ FORMATI: Çıktı, yalnızca ve yalnızca aşağıda belirtilen JSON yapısına uygun olmalıdır. Cevabına asla açıklama veya ek metin ekleme, sadece JSON çıktısı ver.\n"
        
        return rules
    
    def _build_output_requirements_modular(self, user_settings):
        """Build output requirements section - fully modular"""
        requirements = "İSTENEN ÇIKTILAR:\n"
        
        # Title requirements - dynamic based on city info setting
        requirements += self._build_title_requirements(user_settings)
        
        # Summary requirements
        requirements += self._build_summary_requirements(user_settings)
        
        # Content requirements - dynamic based on multiple settings
        requirements += self._build_content_requirements(user_settings)
        
        # Category requirements - dynamic based on target category
        requirements += self._build_category_requirements(user_settings)
        
        # Tags requirements - dynamic based on tag count
        requirements += self._build_tags_requirements(user_settings)
        
        return requirements
    
    def _build_title_requirements(self, user_settings):
        """Build title requirements based on city info setting"""
        title_city_info = user_settings.get('titleCityInfo', 'exclude')
        
        title_req = "• ETKİLİ BAŞLIK: Haberi net yansıtan, profesyonel, dikkat çekici, yanıltıcı olmayan"
        
        if title_city_info == 'exclude':
            title_req += ", şehir bilgisi içermeyen"
            print("DEBUG: Title will exclude city info")
        elif title_city_info == 'include':
            title_req += ", şehir bilgisi içeren"
            print("DEBUG: Title will include city info")
        else:
            print("DEBUG: Title city info setting is auto/default")
        
        title_req += " bir başlık.\n"
        return title_req
    
    def _build_summary_requirements(self, user_settings):
        """Build summary requirements"""
        return "• HABER ÖZETİ: Haberin en önemli noktalarını içeren, 2-3 cümlelik, şehir bilgisi içeren kısa bir özet.\n"
    
    def _build_content_requirements(self, user_settings):
        """Build content requirements based on multiple settings"""
        content_req = "• ÖZGÜN HABER METNİ: Tüm bilgileri koruyarak, metni özgün cümlelerle baştan yaz"
        
        # Name censorship rule - modular
        name_censorship = user_settings.get('nameCensorship', 'partial')
        name_censorship_text = self._get_name_censorship_text(name_censorship)
        if name_censorship_text:
            content_req += f". {name_censorship_text}"
            print(f"DEBUG: Name censorship rule applied: {name_censorship}")
        
        # Company info removal - modular
        remove_company_info = user_settings.get('removeCompanyInfo', True)
        if remove_company_info:
            content_req += ". Özel şirket bilgilerini metinden çıkar"
            print("DEBUG: Company info removal enabled")
        
        # Plate info removal - modular
        remove_plate_info = user_settings.get('removePlateInfo', True)
        if remove_plate_info:
            content_req += ". Plaka bilgilerini metinden çıkar"
            print("DEBUG: Plate info removal enabled")
        
        content_req += ".\n"
        return content_req
    
    def _build_category_requirements(self, user_settings):
        """Build category requirements - fully modular"""
        target_category = user_settings.get('targetCategory')
        print(f"DEBUG: target_category from settings: {target_category}")
        
        if target_category and target_category != 'auto' and target_category.strip():
            # User has selected a specific category
            category_name = self._get_category_display_name(target_category)
            category_req = f"• MUHTEMEL KATEGORİ: Mümkünse \"{category_name}\" kategorisini tercih et, uygun değilse en uygun kategoriyi seç.\n"
            print(f"DEBUG: Using specific category preference: {category_name}")
        else:
            # User wants automatic category selection
            category_req = "• MUHTEMEL KATEGORİ: Verilen kategori listesinden en uygun olanı seç.\n"
            print("DEBUG: Using automatic category selection")
        
        return category_req
    
    def _build_tags_requirements(self, user_settings):
        """Build tags requirements based on tag count"""
        tag_count = user_settings.get('tagCount', 5)
        print(f"DEBUG: Tag count setting: {tag_count}")
        
        return f"• ETİKETLER: Haberle ilgili, SEO uyumlu {tag_count} adet etiket oluştur ve bunları bir dizi (array) olarak listele.\n"
    
    def _build_category_list(self, user_settings=None):
        """Build category list section - dynamic based on selection"""
        full_categories = ["Asayiş", "Gündem", "Ekonomi", "Siyaset", "Spor", "Teknoloji", "Sağlık", "Yaşam", "Eğitim", "Dünya", "Kültür & Sanat", "Magazin", "Genel"]
        
        if user_settings:
            target_category = user_settings.get('targetCategory')
            if target_category and target_category != 'auto' and target_category.strip():
                # User has selected a specific category - highlight it in the list
                category_name = self._get_category_display_name(target_category)
                if category_name in full_categories:
                    print(f"DEBUG: Highlighting selected category in list: {category_name}")
                    return f"""KATEGORİ LİSTESİ (SEÇİLİ: {category_name}):
{full_categories}

ÖNEM: Yukarıdaki listeden "{category_name}" kategorisi tercih edilmektedir."""
        
        # Default: show full list without preference
        print("DEBUG: Showing full category list without preference")
        return f"""KATEGORİ LİSTESİ:
{full_categories}"""
    
    def _build_output_format(self, user_settings):
        """Build output format section - dynamic and visible"""
        output_format = user_settings.get('outputFormat', 'json')
        print(f"DEBUG: Output format setting: {output_format}")
        
        if output_format == 'json':
            print("DEBUG: Using JSON output format")
            return """[ÇIKTI FORMATI: JSON]
Çıktı formatı JSON olarak ayarlanmıştır. Aşağıdaki yapıya uygun olarak çıktı ver:
{
  "baslik": "",
  "ozet": "",
  "haber_metni": "",
  "kategori": "",
  "etiketler": []
}"""
        elif output_format == 'xml':
            print("DEBUG: Using XML output format")
            return """[ÇIKTI FORMATI: XML]
Çıktı formatı XML olarak ayarlanmıştır. Aşağıdaki yapıya uygun olarak çıktı ver:
<haber>
  <baslik></baslik>
  <ozet></ozet>
  <haber_metni></haber_metni>
  <kategori></kategori>
  <etiketler></etiketler>
</haber>"""
        elif output_format == 'plain':
            print("DEBUG: Using PLAIN TEXT output format")
            return """[ÇIKTI FORMATI: DÜZ METİN]
Çıktı formatı düz metin olarak ayarlanmıştır. Aşağıdaki yapıya uygun olarak çıktı ver:
BAŞLIK: [başlık]
ÖZET: [özet]
HABER METNİ: [haber metni]
KATEGORİ: [kategori]
ETİKETLER: [etiketler]"""
        else:
            print(f"DEBUG: Unknown output format '{output_format}', using default JSON")
            return """[VARSAYILAN ÇIKTI FORMATI: JSON]
Çıktı formatı JSON olarak ayarlanmıştır. Aşağıdaki yapıya uygun olarak çıktı ver:
{
  "baslik": "",
  "ozet": "",
  "haber_metni": "",
  "kategori": "",
  "etiketler": []
}"""
    
    def _build_custom_instructions(self, user_settings):
        """Build custom instructions section if provided"""
        custom_instructions = user_settings.get('customInstructions', '').strip()
        
        if custom_instructions:
            print(f"DEBUG: Custom instructions provided: {len(custom_instructions)} characters")
            return f"ÖZEL TALİMATLAR:\n{custom_instructions}"
        
        return ""
    
    def _build_news_content(self, news_text):
        """Build news content section"""
        if news_text and news_text.strip():
            print(f"DEBUG: News text provided: {len(news_text)} characters")
            return f"ORİJİNAL HABER METNİ:\n{news_text}"
        
        return ""
    
    def _build_final_instruction(self):
        """Build final instruction section"""
        return "Yukarıdaki kurallara göre bu haber metnini işle ve sadece JSON formatında çıktı ver:"
    
    def _get_writing_style_rule(self, writing_style):
        """Get writing style rule text - modular and distinctive"""
        print(f"DEBUG: Writing style setting: {writing_style}")
        
        if writing_style == 'formal':
            print("DEBUG: Using FORMAL writing style")
            return '[FORMAL YAZIM STİLİ] Kullanılacak dil resmi, profesyonel ve bilgilendirici olmalıdır. Argo veya clickbait ifadelerden kaçınılmalıdır.'
        elif writing_style == 'informal':
            print("DEBUG: Using INFORMAL writing style")
            return '[SAMIMİ YAZIM STİLİ] Kullanılacak dil samimi, sıcak ve anlaşılır olmalıdır. Okuyucuyla yakın bir bağ kurmalı, ancak yine de profesyonel kalmalıdır.'
        elif writing_style == 'neutral':
            print("DEBUG: Using NEUTRAL writing style")
            return '[NÖTR YAZIM STİLİ] Kullanılacak dil tamamen nötr, objektif ve duygusal yüklenmeden uzak bilgilendirici olmalıdır. Sadece gerçekleri aktarmalıdır.'
        else:
            print(f"DEBUG: Unknown writing style '{writing_style}', using default FORMAL")
            return '[VARSAYILAN FORMAL YAZIM STİLİ] Kullanılacak dil resmi, profesyonel ve bilgilendirici olmalıdır. Argo veya clickbait ifadelerden kaçınılmalıdır.'
    
    def _build_output_requirements(self, user_settings):
        """Build dynamic output requirements based on user settings"""
        requirements = 'İSTENEN ÇIKTILAR:\n'
        
        # Title requirements
        title_req = '• ETKİLİ BAŞLIK: Haberi net yansıtan, profesyonel, dikkat çekici, yanıltıcı olmayan'
        if user_settings.get('titleCityInfo') == 'exclude':
            title_req += ', şehir bilgisi içermeyen'
        elif user_settings.get('titleCityInfo') == 'include':
            title_req += ', şehir bilgisi içeren'
        title_req += ' bir başlık.\n'
        requirements += title_req
        
        # Summary requirements
        requirements += '• HABER ÖZETİ: Haberin en önemli noktalarını içeren, 2-3 cümlelik, şehir bilgisi içeren kısa bir özet.\n'
        
        # Content requirements
        content_req = '• ÖZGÜN HABER METNİ: Tüm bilgileri koruyarak, metni özgün cümlelerle baştan yaz'
        
        # Add name censorship rule
        name_censorship_text = self._get_name_censorship_text(user_settings.get('nameCensorship', 'partial'))
        if name_censorship_text:
            content_req += '. ' + name_censorship_text
        
        # Add company info rule
        if user_settings.get('removeCompanyInfo'):
            content_req += '. Özel şirket bilgilerini metinden çıkar'
        
        # Add plate info rule
        if user_settings.get('removePlateInfo'):
            content_req += '. Plaka bilgilerini metinden çıkar'
        
        content_req += '.\n'
        requirements += content_req
        
        # Category requirements - modular and precise
        target_category = user_settings.get('targetCategory')
        print(f"DEBUG: target_category from settings: {target_category}")
        
        if target_category and target_category != 'auto' and target_category.strip():
            # User has selected a specific category
            category_name = self._get_category_display_name(target_category)
            requirements += f'• MUHTEMEL KATEGORİ: Mümkünse "{category_name}" kategorisini tercih et, uygun değilse en uygun kategoriyi seç.\n'
            print(f"DEBUG: Using specific category preference: {category_name}")
        else:
            # User wants automatic category selection
            requirements += '• MUHTEMEL KATEGORİ: Verilen kategori listesinden en uygun olanı seç.\n'
            print("DEBUG: Using automatic category selection")
        
        # Tags requirements
        tag_count = user_settings.get('tagCount', 5)
        requirements += f'• ETİKETLER: Haberle ilgili, SEO uyumlu {tag_count} adet etiket oluştur ve bunları bir dizi (array) olarak listele.\n'
        
        return requirements
    
    def _get_name_censorship_text(self, name_censorship):
        """Get name censorship rule text"""
        if name_censorship == 'full':
            return 'İsimleri tamamen sansürle (örn: A.B.)'
        elif name_censorship == 'partial':
            return 'İsimleri kısmi sansürle (örn: Ahmet K.)'
        elif name_censorship == 'none':
            return ''
        else:
            return 'İsimleri sansürle (örn: A.B.)'
    
    def _get_category_display_name(self, category):
        """Get display name for category"""
        category_map = {
            'asayis': 'Asayiş',
            'gundem': 'Gündem',
            'ekonomi': 'Ekonomi',
            'siyaset': 'Siyaset',
            'spor': 'Spor',
            'teknoloji': 'Teknoloji',
            'saglik': 'Sağlık',
            'yasam': 'Yaşam',
            'egitim': 'Eğitim',
            'dunya': 'Dünya',
            'kultur': 'Kültür & Sanat',
            'magazin': 'Magazin',
            'genel': 'Genel'
        }
        return category_map.get(category, category)
    
    def get_full_config_data(self, config_id=None):
        """Get complete configuration data for frontend"""
        try:
            if not config_id:
                active_config = self.get_active_config()
                if not active_config:
                    return None
                config_id = active_config['id']
            else:
                active_config = {'id': config_id}
            
            # Get all data
            sections = self.get_config_sections(config_id)
            rules = self.get_config_rules(config_id)
            
            # Get options for each rule and structure them properly
            rule_options = {}
            for rule_key, rule_data in rules.items():
                options = self.get_rule_options(config_id, rule_key)
                rule_options[rule_key] = options
            
            return {
                'config': active_config,
                'sections': sections,
                'rules': rules,
                'rule_options': rule_options
            }
            
        except Exception as e:
            print(f"Error getting full config data: {e}")
            return None
    
    def export_config(self, config_id):
        """Export configuration to JSON format"""
        try:
            config_data = self.get_full_config_data(config_id)
            if config_data:
                return {
                    'export_date': datetime.now().isoformat(),
                    'config_data': config_data
                }
            return None
        except Exception as e:
            print(f"Error exporting config: {e}")
            return None
    
    def __del__(self):
        """Cleanup database connection"""
        if hasattr(self, 'db'):
            self.db.disconnect()
