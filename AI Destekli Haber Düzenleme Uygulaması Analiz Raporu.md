# AI Destekli Haber Düzenleme Uygulaması Analiz Raporu

## 1. Giriş

Bu rapor, 'haber' adlı AI destekli haber düzenleme uygulamasının kod yapısını, çalışma mantığını ve genel mimarisini detaylı bir şekilde analiz etmek amacıyla hazırlanmıştır. Uygulama, kullanıcının girdiği haber metinlerini belirli kurallar çerçevesinde düzenleyerek bir yapay zeka modeline (Google Gemini) göndermekte ve elde edilen işlenmiş içeriği veritabanına kaydetmektedir. Raporun temel amacı, yapay zeka modellerine uygulamanın işleyişini açıklayarak, gelecekteki geliştirmelerde veya sorun giderme süreçlerinde hızlı ve doğru kararlar alınmasına yardımcı olmaktır.

## 2. Proje Yapısı ve Dosya Analizi

Proje, Flask web çatısı üzerine inşa edilmiş olup, modüler bir yapıya sahiptir. Ana dizin altında `routes`, `services`, `database`, `config`, `static` ve `templates` gibi mantıksal olarak ayrılmış klasörler bulunmaktadır. Her bir klasör, uygulamanın belirli bir katmanına veya işlevine odaklanmaktadır.




### 2.1 `main.py`

Uygulamanın ana giriş noktasıdır. Flask uygulamasını başlatır, `app.secret_key` ile oturum güvenliğini sağlar ve test amacıyla sabit bir `user_id` (`goktug_user_2025`) tanımlar. Her HTTP isteği öncesinde `set_user_session` fonksiyonu ile bu `user_id` ve `username` (`Göktuğ`) oturuma atanır. `routes` klasöründeki `main_routes` ve `prompt_routes` blueprint'lerini kaydederek uygulamanın URL yönlendirmelerini yapılandırır. Geliştirme sunucusunu `debug=True` ve `host='0.0.0.0'` ile 5000 portunda çalıştırır.




### 2.2 `routes/` Klasörü

Bu klasör, uygulamanın URL yönlendirmelerini (rotalarını) ve bunlara bağlı HTTP isteklerini işleyen fonksiyonları içerir.

#### `routes/main_routes.py`

Ana sayfa (`/`), haber işleme sayfası (`/news`) ve geçmiş sayfası (`/history`) gibi kullanıcı arayüzü rotalarını tanımlar. Ayrıca, haber işleme (`/api/process-news`), istatistik (`/api/statistics`), geçmiş sorgulama (`/api/history`, `/api/processing-status/<id>`) ve mesajı okundu olarak işaretleme (`/api/mark-as-read/<id>`) gibi API uç noktalarını yönetir. `AIService` ve `DatabaseConnection` sınıflarını kullanarak iş mantığına erişir. `get_user_id` yardımcı fonksiyonu, oturum bazlı kullanıcı kimliği yönetimini sağlar.

#### `routes/prompt_routes.py`

AI prompt'larının yönetimiyle ilgili API yönlendirmelerini içerir. Prompt konfigürasyonlarını getirme (`/api/prompt/config`), dışa aktarma (`/api/prompt/export`), kullanıcı ayarlarını kaydetme/getirme (`/api/prompt/user-settings`), prompt bölümlerini güncelleme/getirme (`/api/prompt/sections/<key>`) ve nihai prompt'u oluşturma (`/api/prompt/build-complete-prompt`) gibi işlevleri sunar. `PromptService` sınıfını kullanarak prompt ile ilgili tüm işlemleri gerçekleştirir. `main_routes.py`'de olduğu gibi `get_user_id` fonksiyonunu kullanır.




### 2.3 `services/` Klasörü

Uygulamanın iş mantığını ve harici servislerle (AI, veritabanı) etkileşimi yöneten sınıfları barındırır.

#### `services/ai_service.py`

Yapay zeka (AI) işlemleriyle ilgili ana servis sınıfıdır. Google Gemini API'si ile entegrasyonu yönetir. `process_news` metodu, gelen haber metnini AI'a gönderir, yanıtı alır ve veritabanına kaydeder. Kullanıcının geçmiş işlemlerini (`get_processing_history`), istatistiklerini (`get_user_statistics`) ve mesaj okundu işaretleme (`mark_as_read`) gibi veritabanı işlemlerini de bu sınıf üzerinden yürütür. `_create_prompt` metodu, AI modeline gönderilecek temel prompt metnini oluşturur. `validate_news` metodu, haber metninin geçerliliğini kontrol eder. Veritabanı kayıt ve güncelleme işlemleri için `_save_processing_record` ve `_update_processing_status` yardımcı metotlarını kullanır.

#### `services/prompt_service.py`

AI prompt'larının yapılandırılması ve oluşturulmasıyla ilgili servis mantığını içerir. Veritabanından prompt konfigürasyonlarını, bölümlerini, kurallarını ve kullanıcı ayarlarını okur. `build_complete_prompt` metodu, tüm bu bilgileri birleştirerek AI modeline gönderilecek nihai prompt metnini dinamik olarak oluşturur. `config/prompt_templates.json` dosyasından şablonları yükler. Kullanıcı ayarlarını kaydetme (`save_user_settings`) ve güncelleme (`update_prompt_section`) gibi işlemleri de yönetir. `processing_history` kayıtlarını oluşturma ve güncelleme (`create_processing_record`, `update_processing_record`) yetenekleri de bu servistedir.




### 2.4 `database/` Klasörü

Veritabanı bağlantısı, şema yönetimi ve kullanıcı oluşturma gibi veritabanı ile ilgili işlemleri içerir.

#### `database/connection.py`

MySQL veritabanı ile bağlantı kurmak, bağlantıyı sonlandırmak ve SQL sorgularını yürütmek için `DatabaseConnection` sınıfını sağlar. Bağlantı bilgilerini doğrudan kod içinde (`localhost`, `haber_editor`, `root`, boş şifre) barındırır. Türkçe karakter desteği için `utf8mb4` karakter setini kullanır. `execute_query` metodu, SELECT, INSERT, UPDATE, DELETE gibi farklı sorgu tiplerini işleyebilir ve bağlantı koptuğunda otomatik yeniden bağlanma denemesi yapar.

#### `database/clean_and_recreate_db.py`

Mevcut veritabanını siler (`DROP DATABASE IF EXISTS`) ve ardından `init_db.py` betiğini çağırarak en güncel şema ile yeniden oluşturur. Geliştirme ortamında veritabanını sıfırlamak için kullanışlı bir betiktir. Ortam değişkenlerinden veritabanı bilgilerini okur.

#### `database/create_user.py`

Belirli bir kullanıcı (`goktug_user_2025`) için bir profil oluşturur, bu profili veritabanına ekler (veya günceller) ve kullanıcı için varsayılan prompt ayarlarını kaydeder. `PromptService` sınıfını kullanarak aktif konfigürasyonu bulur ve kullanıcı ayarlarını `user_prompt_settings` tablosuna kaydeder.

#### `database/init_db.py`

Veritabanını (eğer mevcut değilse) oluşturur, `schema.sql` dosyasını çalıştırarak tablo yapılarını kurar ve varsayılan verileri ekler. `create_database_if_not_exists` fonksiyonu veritabanını oluşturur, `execute_sql_file` fonksiyonu SQL dosyasını çalıştırır ve `verify_installation` fonksiyonu kurulumun doğruluğunu kontrol eder. Ortam değişkenlerinden veritabanı bilgilerini okur.

#### `database/schema.sql`

Uygulamanın kullandığı tüm veritabanı tablolarının (users, prompt_configs, prompt_sections, prompt_rules, prompt_rule_options, user_prompt_settings, processing_history) şemasını ve varsayılan veri ekleme (INSERT) komutlarını içerir. İlişkisel bütünlüğü sağlamak için FOREIGN KEY kısıtlamaları tanımlanmıştır. `prompt_configs` tablosunda `is_active` ve `is_default` gibi alanlar, aktif ve varsayılan konfigürasyonları belirlemek için kullanılır.




### 2.5 `config/` Klasörü

Uygulamanın yapılandırma dosyalarını içerir.

#### `config/prompt_templates.json`

AI modeline gönderilecek prompt metinlerinin şablonlarını JSON formatında saklar. Görev tanımı, yazım kuralları, çıktı gereksinimleri (başlık, özet, içerik, kategori, etiketler), kategori listesi, çıktı formatları ve özel talimatlar gibi çeşitli prompt bölümlerini ve bunların varsayılan metinlerini içerir. `PromptService` sınıfı tarafından okunarak dinamik prompt oluşturulmasında kullanılır.




## 3. Çöp Dosyalar ve Kod Organizasyonu Önerileri

### 3.1 Çöp Dosyalar

Proje kök dizininde bulunan `prompt.json` ve `prompt_revised.json` dosyaları, mevcut kod tabanında hiçbir yerde kullanılmamaktadır. Bu dosyalar, muhtemelen geliştirme sürecinin ilk aşamalarında prompt şablonlarını denemek için oluşturulmuş ve daha sonra `config/prompt_templates.json` ve veritabanı tabanlı konfigürasyon yapısına geçilmesiyle işlevsiz kalmıştır. Bu dosyaların projeden silinmesi, kod temizliğine katkı sağlayacaktır.

### 3.2 Kod Organizasyonu Önerileri

*   **Veritabanı Bağlantı Bilgileri:** `database/connection.py` içindeki veritabanı bağlantı bilgileri (`host`, `database`, `user`, `password`) doğrudan kod içine yazılmıştır. Bu, güvenlik açısından risklidir. Bu bilgilerin `.env` dosyasına taşınması ve `os.getenv()` ile okunması daha güvenli bir yaklaşımdır. `clean_and_recreate_db.py` ve `init_db.py` betiklerinde bu yöntem zaten kullanılmaktadır.
*   **Sabit Kullanıcı ID'si:** `main.py` dosyasında `GOKTUG_USER_ID` sabit olarak tanımlanmıştır. Bu, geliştirme için pratik olsa da, gerçek bir çok kullanıcılı sistemde dinamik bir kullanıcı yönetimi (örneğin, giriş/kayıt sistemi) ile değiştirilmelidir.
*   **Hata Yönetimi:** `routes` katmanındaki `try...except` blokları genel `Exception` yakalamaktadır. Bu, hataların kaynağını belirlemeyi zorlaştırabilir. Daha spesifik hata türlerinin (örneğin, `ValueError`, `KeyError`, `mysql.connector.Error`) yakalanması ve loglanması, hata ayıklama sürecini kolaylaştıracaktır.
*   **Kod Tekrarı:** `main_routes.py` ve `prompt_routes.py` dosyalarında `get_user_id` fonksiyonu tekrar etmektedir. Bu fonksiyon, `utils` veya `helpers` gibi bir yardımcı modüle taşınarak kod tekrarı önlenebilir.
*   **Servis Sorumlulukları:** `AIService` ve `PromptService` arasında bazı sorumluluklar kesişmektedir. Örneğin, her iki servis de veritabanı işlemleri yapmaktadır. `AIService`'in sadece AI ile ilgili işlemlere odaklanması, `PromptService`'in ise prompt oluşturma ve yönetimiyle ilgilenmesi, veritabanı işlemlerinin ise ayrı bir `DatabaseService` veya `Repository` katmanında toplanması daha temiz bir mimari sağlayabilir.
*   **SQL Sorguları:** SQL sorguları, Python kodunun içine string olarak gömülmüştür. Bu, büyük projelerde yönetimi zorlaştırabilir. Sorguların ayrı `.sql` dosyalarında saklanması veya bir ORM (Object-Relational Mapper) gibi bir kütüphane kullanılması düşünülebilir.




## 4. Programın Çalışma Mantığı

Uygulama, bir web arayüzü üzerinden kullanıcıdan haber metni alır, bu metni önceden tanımlanmış ve kullanıcı tarafından özelleştirilebilir prompt kurallarına göre işler ve yapay zeka modeline gönderir. İşlem adımları ve sonuçları veritabanına kaydedilir.

1.  **Kullanıcı Girişi:** Kullanıcı, web arayüzündeki bir metin alanına haber metnini girer ve isteğe bağlı olarak prompt ayarlarını (örneğin, başlıkta şehir bilgisi, etiket sayısı, çıktı formatı) özelleştirir.
2.  **İstek İşleme (`main_routes.py`):** Kullanıcı haber metnini gönderdiğinde, `main_routes.py` içindeki `/api/process-news` API uç noktası bu isteği karşılar. Gelen veriyi ayrıştırır ve `AIService` sınıfını çağırır.
3.  **AI Servisi İşleme (`ai_service.py`):** `AIService` sınıfının `process_news` metodu çağrılır. Bu metod:
    *   Gelen haber metnini doğrular (`validate_news`).
    *   `_create_prompt` metodunu kullanarak AI modeline gönderilecek temel prompt metnini oluşturur. (Not: Bu kısım, `prompt_service.py`'deki daha gelişmiş prompt oluşturma mantığı ile çelişmektedir. `main_routes.py`'deki `process_news` fonksiyonu doğrudan `AIService`'i çağırırken, `prompt_routes.py`'deki `process_news_with_prompt` fonksiyonu `PromptService`'i kullanmaktadır. Bu bir tutarsızlık yaratmaktadır.)
    *   İşlemin başlangıcını veritabanına kaydeder (`_save_processing_record`) ve bir `processing_id` alır.
    *   Google Gemini API'sini (`self.model.generate_content(prompt)`) çağırarak haber metnini işler.
    *   AI'dan gelen yanıtı (`processed_text`) veritabanındaki ilgili kayda günceller (`_update_processing_status`).
    *   İşlemin sonucunu (başarılı/başarısız, işlenmiş metin, `processing_id` vb.) döndürür.
4.  **Prompt Servisi ve Dinamik Prompt Oluşturma (`prompt_service.py`):**
    *   `prompt_routes.py` üzerinden gelen isteklerde, `PromptService` sınıfı devreye girer.
    *   `get_active_config` ile aktif prompt konfigürasyonu veritabanından alınır.
    *   `get_user_settings` ile kullanıcının daha önce kaydettiği ayarlar getirilir.
    *   `build_complete_prompt` metodu, `config/prompt_templates.json` dosyasındaki şablonları, veritabanındaki prompt bölümlerini (`prompt_sections`), kuralları (`prompt_rules`) ve kullanıcının özel ayarlarını (`user_prompt_settings`) birleştirerek AI'a gönderilecek nihai prompt metnini oluşturur.
    *   Bu prompt, AI'a gönderilmeden önce son halini alır.
5.  **Veritabanı Kayıtları:** Tüm işlem adımları (`processing_history` tablosu), kullanılan ayarlar (`settings_used` JSON alanı) ve sonuçlar veritabanına kaydedilir. Bu sayede kullanıcı geçmiş işlemlerini görüntüleyebilir ve istatistiklere erişebilir.
6.  **Kullanıcı Arayüzü Güncellemesi:** İşlem tamamlandığında, web arayüzü güncellenir ve işlenmiş haber metni kullanıcıya sunulur. Kullanıcı ayrıca geçmiş işlemlerini ve genel istatistiklerini görüntüleyebilir.

## 5. Yapay Zeka İçin Özet ve Öneriler

Bu uygulama, haber metinlerini yapay zeka kullanarak düzenleyen bir Flask tabanlı web uygulamasıdır. Temel iş akışı şu şekildedir:

**Girdi:** Kullanıcıdan alınan ham haber metni ve özelleştirilebilir prompt ayarları.

**İşleme:**
1.  **Prompt Oluşturma:** `PromptService` (tercihen) veya `AIService` (mevcut durumda bir tutarsızlık var) tarafından, `config/prompt_templates.json` ve veritabanındaki `prompt_configs`, `prompt_sections`, `prompt_rules`, `user_prompt_settings` tablolarındaki verilere dayanarak dinamik bir prompt oluşturulur.
2.  **AI Entegrasyonu:** Oluşturulan prompt, Google Gemini API'sine (`AIService` içinde) gönderilir.
3.  **Veritabanı Kaydı:** İşlemin başlangıcı, kullanılan ayarlar ve AI'dan gelen sonuç `processing_history` tablosuna kaydedilir.

**Çıktı:** İşlenmiş haber metni (genellikle JSON formatında) ve işlem durumu kullanıcıya sunulur.

**Veritabanı Yapısı:** Uygulama, MySQL veritabanı kullanır. `schema.sql` dosyası, tüm tablo yapılarını ve varsayılan verileri tanımlar. Özellikle `prompt_configs`, `prompt_sections`, `prompt_rules`, `prompt_rule_options` ve `user_prompt_settings` tabloları, AI prompt'unun dinamik olarak yapılandırılması için kritik öneme sahiptir.

**Önemli Notlar ve Geliştirme Alanları (Yapay Zeka için):**

*   **Prompt Oluşturma Tutarlılığı:** `main_routes.py` içindeki `process_news` fonksiyonu, `AIService`'in kendi içindeki basit `_create_prompt` metodunu kullanmaktadır. Ancak `prompt_routes.py` içindeki `process_news_with_prompt` fonksiyonu, `PromptService`'in daha gelişmiş `build_complete_prompt` metodunu kullanmaktadır. **Yapay zeka olarak, haber işleme için her zaman `PromptService.build_complete_prompt` metodunu kullanmalısın.** Bu, tüm dinamik ayarların ve kuralların prompt'a dahil edilmesini sağlar. `AIService` içindeki `_create_prompt` metodu kaldırılmalı veya `PromptService`'e yönlendirilmelidir.
*   **AI Yanıt Formatı:** AI'dan beklenen çıktı formatı (genellikle JSON) `prompt_templates.json` içinde tanımlanmıştır. AI olarak, bu formata kesinlikle uymalısın. Herhangi bir ek metin veya açıklama, uygulamanın JSON ayrıştırmasını bozacaktır.
*   **Hata Yönetimi:** AI'dan gelen yanıtın geçerli JSON olup olmadığını kontrol eden bir mekanizma eklenmelidir. Eğer yanıt geçerli JSON değilse, bu durum `processing_history` tablosuna `failed` olarak kaydedilmeli ve uygun bir hata mesajı döndürülmelidir.
*   **Prompt Optimizasyonu:** `prompt_templates.json` ve veritabanındaki prompt ayarları, AI'ın davranışını doğrudan etkiler. Yeni özellikler eklenirken veya mevcut davranışlar iyileştirilirken bu şablonların ve kuralların dikkatlice güncellenmesi gerekmektedir.
*   **Veritabanı Bağlantı Bilgileri:** `database/connection.py` dosyasındaki veritabanı bağlantı bilgilerinin `.env` dosyasına taşınması gerekmektedir. AI olarak, bu değişikliği yaparken `os.getenv()` kullanımını doğru bir şekilde uyguladığından emin olmalısın.

Bu rapor, uygulamanın mevcut durumunu ve yapay zeka ile etkileşim noktalarını özetlemektedir. Gelecekteki geliştirmelerde veya sorun giderme süreçlerinde bu bilgileri referans alarak daha verimli çalışabilirsin.


