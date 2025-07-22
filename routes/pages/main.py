# -*- coding: utf-8 -*-
#
# Bu dosya, Flask uygulamasının sayfa yönlendirmelerini içerir.
# Kullanıcının etkileşimde bulunduğu temel sayfaları yönetir.
#
# İçindekiler:
# - home: Ana sayfayı render eder.
# - news: Haber işleme sayfasını render eder.
# - history: Geçmiş işlemler sayfasını render eder.

from flask import Blueprint, render_template

# Create a Blueprint for page routes
bp = Blueprint('pages', __name__, template_folder='../../../templates')

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
