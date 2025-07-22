# Haber Düzenleme Uygulaması

Bu proje, yapay zeka destekli bir haber düzenleme uygulamasıdır.

## Kurulum

1. Gerekli bağımlılıkları yükleyin:
   ```bash
   pip install -r requirements.txt
   ```

2. `.env` dosyası oluşturun ve aşağıdaki değişkenleri ekleyin:

   ```env
   # Veritabanı Ayarları
   DB_HOST=localhost
   DB_NAME=haber_editor
   DB_USER=root
   DB_PASSWORD=
   
   # Google Gemini API Anahtarı
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

3. Uygulamayı başlatın:
   ```bash
   python main.py
   ```

## Gereksinimler

- Python 3.8+
- MySQL
- Google Gemini API anahtarı

## Kullanılan Teknolojiler

- Flask
- MySQL Connector/Python
- Google Generative AI
- python-dotenv
