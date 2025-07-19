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
    
    def build_complete_prompt(self, config_id, user_settings=None):
        """Build complete prompt from configuration and user settings"""
        try:
            # Get sections
            sections = self.get_config_sections(config_id)
            if not sections:
                return None
            
            # Get rules and their current values
            rules = self.get_config_rules(config_id)
            
            # Build prompt with dynamic values
            prompt_parts = []
            
            # Add main sections in order
            section_order = ['gorev_tanimi', 'ozgunluk', 'kurumsal_dil', 'ciktinin_formati']
            for section_key in section_order:
                if section_key in sections:
                    prompt_parts.append(sections[section_key]['prompt_text'])
            
            # Add dynamic content based on user settings
            if user_settings:
                # Add specific instructions based on settings
                content_instructions = []
                
                # Title city info
                if user_settings.get('titleCityInfo') == 'include':
                    content_instructions.append("Başlıkta şehir bilgisi yer almalıdır.")
                else:
                    content_instructions.append("Başlıkta şehir bilgisi yer almamalıdır.")
                
                # Name censorship
                censorship = user_settings.get('nameCensorship', 'initials')
                if censorship == 'initials':
                    content_instructions.append("İsimleri sadece ilk harflerle göster (örn: G.K.)")
                elif censorship == 'partial':
                    content_instructions.append("İsim tam, soyisim baş harfi ile göster (örn: Göktuğ K.)")
                else:
                    content_instructions.append("İsimleri tam olarak göster.")
                
                # Company and plate info
                if user_settings.get('removeCompanyInfo'):
                    content_instructions.append("Özel şirket bilgilerini haberde gösterme.")
                
                if user_settings.get('removePlateInfo'):
                    content_instructions.append("Araç plaka bilgilerini haberde gösterme.")
                
                # Tag count
                tag_count = user_settings.get('tagCount', '5')
                content_instructions.append(f"Tam olarak {tag_count} adet etiket oluştur.")
                
                # Custom instructions
                custom = user_settings.get('customInstructions', '').strip()
                if custom:
                    content_instructions.append(f"Ek talimatlar: {custom}")
                
                if content_instructions:
                    prompt_parts.append("Özel Kurallar:\n" + "\n".join(f"- {inst}" for inst in content_instructions))
            
            # Add remaining sections
            remaining_sections = ['etkili_baslik', 'haber_ozeti', 'ozgun_haber_metni', 
                                'muhtemel_kategori', 'etiketler']
            for section_key in remaining_sections:
                if section_key in sections:
                    prompt_parts.append(f"{sections[section_key]['section_name']}: {sections[section_key]['prompt_text']}")
            
            return "\n\n".join(prompt_parts)
            
        except Exception as e:
            print(f"Error building complete prompt: {e}")
            return None
    
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
            
            # Get options for each rule
            for rule_key, rule_data in rules.items():
                rule_data['options'] = self.get_rule_options(config_id, rule_key)
            
            return {
                'config': active_config,
                'sections': sections,
                'rules': rules
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
