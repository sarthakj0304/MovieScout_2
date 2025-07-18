import os
from dotenv import load_dotenv
load_dotenv()  # Load environment variables from .env
class Config:
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') 
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'your_super_secret_key_for_development_change_in_prod'

