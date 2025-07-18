# extensions.py
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
from flask_cors import CORS
from flask_migrate import Migrate
from flask import jsonify

db = SQLAlchemy()
login_manager = LoginManager()
cors = CORS()
migrate = Migrate()
@login_manager.unauthorized_handler
def unauthorized():
    return jsonify({'error': 'Authentication required'}), 401


def init_app_extensions(app):
    db.init_app(app)
    login_manager.init_app(app)
    login_manager.login_view = 'auth_bp.show_login' # 'blueprint_name.view_function_name'
    cors.init_app(app, supports_credentials=True, origins=["http://localhost:5173"]) # Crucial for cookies/sessions
    migrate.init_app(app, db)