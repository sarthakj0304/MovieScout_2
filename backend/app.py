from flask import Flask
from config import Config
from extensions import db, login_manager, cors, migrate, init_app_extensions
from blueprints.auth import auth_bp
from blueprints.recommendations import recommendations_bp, load_recommender_assets 
from models import User # Import User model to be known by login_manager, also for db.create_all()

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Initialize extensions with the app
    init_app_extensions(app)
    
    # Register Blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(recommendations_bp)

    # --- Load Recommender Assets HERE ---
    # This ensures models and data are loaded once when the app starts

    load_recommender_assets()
    return app

app = create_app()

with app.app_context():
    db.create_all()
    

# --- Main execution block ---
if __name__ == '__main__':
    # Run the Flask app
    # host='0.0.0.0' makes it accessible externally (e.g., from your frontend development server)
    app.run(debug=True, host='0.0.0.0', port=5001)
