from flask import Flask, render_template
from routes import main_routes

app = Flask(__name__)

# Register blueprints
app.register_blueprint(main_routes.bp)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
