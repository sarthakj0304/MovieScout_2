# models.py
from extensions import db, login_manager
from flask_login import UserMixin
from datetime import datetime

class User(UserMixin, db.Model):
    __tablename__ = "users"
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(128), nullable=False) # Store bcrypt hash

    # Relationship for user interactions
    # 'UserInteraction' is the class name of the other model
    # backref='user' creates a .user attribute on UserInteraction instances
    # lazy=True means interactions are loaded when accessed
    interactions = db.relationship('UserInteraction', backref='user', lazy=True)

    def get_id(self):
        return str(self.id)

    def __repr__(self):
        return f'<User {self.username}>'

# User loader for Flask-Login (should be defined where db is available)
@login_manager.user_loader # From extensions.py
def load_user(user_id):
    return db.session.get(User, int(user_id))


class UserInteraction(db.Model):
    __tablename__ = 'user_interactions'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False) # Foreign key!
    movie_id = db.Column(db.Integer, nullable=False)
    rating = db.Column(db.Float, nullable=False) # 5.0 for like, 1.0 for dislike
    timestamp = db.Column(db.DateTime, default=datetime.now, nullable=True)


    def __repr__(self):
        return f'<UserInteraction User:{self.user_id} Movie:{self.movie_id} Rating:{self.rating}>'