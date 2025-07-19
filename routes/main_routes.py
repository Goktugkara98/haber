from flask import Blueprint, render_template, request, jsonify

bp = Blueprint('main', __name__)

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
    # Gelecekte AI servisi buraya entegre edilecek
    return jsonify({'status': 'success', 'message': 'API hazır'})
