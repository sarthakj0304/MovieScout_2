# blueprints/auth.py
from flask import Blueprint, request, jsonify, session, render_template, redirect, url_for, flash
from extensions import db, login_manager # Import shared extensions
from models import User # Import shared User model
from flask_login import login_user, logout_user, login_required, current_user
import bcrypt

auth_bp = Blueprint('auth_bp', __name__)

@auth_bp.route('/login', methods=['GET'])
def show_login():
    return jsonify({"message": "Please log in"}), 401 


# Route to display the signup page
@auth_bp.route('/signup', methods=['GET'])
def show_signup():
    return render_template('signup.html')


@auth_bp.route('/signup', methods=['POST'])
def signup():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({"error": "Username and password are required."}), 400

    if User.query.filter_by(username=username).first():
        return jsonify({"error": "Username already exists. Please choose a different one."}), 409

    salt = bcrypt.gensalt()
    hashed_password = bcrypt.hashpw(password.encode('utf-8'), salt)
    
    new_user = User(
        username=username,
        password=hashed_password.decode('utf-8'),
    )
    
    try:
        db.session.add(new_user)
        db.session.commit()
        login_user(new_user) # Log the user in after signup
        return jsonify({"message": "Sign Up successful!", "user_id": new_user.id, "username": new_user.username}), 201
    except Exception as e:
        db.session.rollback()
        print(f"Error during signup: {e}")
        return jsonify({"error": "Internal server error"}), 500

@auth_bp.route('/login', methods=["POST"])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    if not username or not password:
        return jsonify({"error": "Username and password are required."}), 400
    
    user = User.query.filter_by(username=username).first()

    if user and bcrypt.checkpw(password.encode('utf-8'), user.password.encode('utf-8')):
        login_user(user) # Log the user in
        return jsonify({"message": "Login successful!", "user_id": user.id, "username": user.username}), 200
    else:
        return jsonify({"error": "Invalid username or password."}), 400
        
@auth_bp.route('/logout', methods=['POST'])
@login_required
def logout():
    logout_user()
    return jsonify({"message":"logged out successfully"}), 200


@auth_bp.route('/status', methods=['GET'])
def status():
    if current_user.is_authenticated:
        return jsonify({"is_logged_in": True, "user_id": current_user.id, "username": current_user.username}), 200
    return jsonify({"is_logged_in": False}), 200