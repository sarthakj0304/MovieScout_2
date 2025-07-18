# blueprints/recommendations.py
from flask import Blueprint, request, jsonify
from extensions import db # Import shared db instance
from models import UserInteraction # Import shared models
from flask_login import login_required, current_user # For accessing logged-in user
import os
import time
import pandas as pd
import requests
import numpy as np
import joblib
from datetime import datetime
recommendations_bp = Blueprint('recommendations_bp', __name__)

# --- Model Loading and Global Variables ---
# Global variables to hold loaded models and data
svd_model = None

content_sim_matrix = None
movies_data_df = None
movie_ids_list = None
movie_id_to_index_map = None
blending_alpha = None
recommendation_top_n = None
movie_popularity_counts = None # For initial recommendations

# Paths to your saved model components
current_file_dir = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(current_file_dir, '..', '..', '..'))
PROJECT_ROOT=os.path.join(PROJECT_ROOT, 'movie recommendation')
# --- Construct Paths to your data and models ---
MODELS_DIR = os.path.join(PROJECT_ROOT, 'model')
DATASET_DIR = os.path.join(MODELS_DIR, 'dataset')
TRAINED_MODELS_DIR = os.path.join(MODELS_DIR, 'trained_models')

LINKS_DATASET_PATH = os.path.join(DATASET_DIR, 'links.csv')
SVD_MODEL_PATH = os.path.join(TRAINED_MODELS_DIR, 'trained_svd.joblib')
CONTENT_SIM_PATH = os.path.join(TRAINED_MODELS_DIR, 'trained_content_model.npy')
MOVIES_DATA_PATH = os.path.join(DATASET_DIR, 'movies.csv')
MAPPING_DATA_PATH = os.path.join(TRAINED_MODELS_DIR, 'recommender_mappings.joblib')
COMBINED_DATA_PATH = os.path.join(DATASET_DIR, 'combined_data.csv')
POPULAR_MOVIES_DATA_PATH = os.path.join(DATASET_DIR, 'popular_movies.csv')
DEFAULT_POSTER_URL = "https://critics.io/img/movies/poster-placeholder.png"


def load_recommender_assets():
    """Loads all pre-trained model components and data into global variables."""
    global svd_model, tfidf_vectorizer, content_sim_matrix, movies_data_df, combined_data, \
           movie_ids_list, movie_id_to_index_map, blending_alpha, popular_movies_data, \
           recommendation_top_n

    try:
        print("Loading recommender assets...")
        svd_model = joblib.load(SVD_MODEL_PATH)
        content_sim_matrix = np.load(CONTENT_SIM_PATH)
        movies_data_df = pd.read_csv(MOVIES_DATA_PATH)
        mapping_data = joblib.load(MAPPING_DATA_PATH)
        combined_data = pd.read_csv(COMBINED_DATA_PATH)
        popular_movies_data = pd.read_csv(POPULAR_MOVIES_DATA_PATH)

        movie_ids_list = mapping_data['Movie_ids']
        movie_id_to_index_map = mapping_data['Movie_id_to_idx']
        blending_alpha = mapping_data['ALPHA']
        recommendation_top_n = mapping_data['TOP_N']
        print("Recommender assets loaded successfully!")
    except FileNotFoundError as e:
        print(f"Error loading model assets: {e}")
        print("Please ensure you have run your training script to create the 'trained_models' directory and its contents.")
        # In a production environment, you might want to log this and potentially stop the app.
        raise RuntimeError("Recommender assets not found. Cannot start application.") from e
    except Exception as e:
        print(f"An unexpected error occurred during asset loading: {e}")
        raise RuntimeError("Failed to load recommender assets.") from e
    

def get_svd_scores(user_id):
    """Calculates SVD-based prediction scores for all movies for a given user."""
    scores = np.zeros(len(movie_ids_list))
    for idx, movie_id in enumerate(movie_ids_list):
        try:
            # Attempt to convert user_id to int for SVD if possible, otherwise SVD will handle cold-start
            user_id_for_svd = int(user_id) # SVD expects integer user IDs
        except ValueError:
            user_id_for_svd = user_id # Keep as string if it's a UUID, SVD will treat as cold-start

        scores[idx] = svd_model.predict(user_id_for_svd, movie_id).est
    return scores

def get_content_scores(user_liked_movie_ids):
    """Calculates content-based similarity scores for all movies based on user's liked movies."""
    scores = np.zeros(len(movie_ids_list))
    valid_liked_count = 0
    for liked_id in user_liked_movie_ids:
        # movie_id_to_index_map and content_sim_matrix are loaded globally
        if liked_id in movie_id_to_index_map:
            idx = movie_id_to_index_map[liked_id]
            scores += content_sim_matrix[idx]
            valid_liked_count += 1
    return scores / max(1, valid_liked_count) # Avoid division by zero


 
def save_interaction(user_id, movie_id, r):#save a new interaction in the database
    
    new_interaction = UserInteraction(
        user_id=int(user_id),  # Ensure user_id is a string
        movie_id=int(movie_id), # Ensure movie_id is an integer
        rating=float(r),  # Ensure rating is a float
        timestamp=datetime.now()
    )
    
    db.session.add(new_interaction)
    db.session.commit()
    
def generate_recommendations_from_user_history(user_id):
    
    user_history = UserInteraction.query.filter_by(user_id=user_id).order_by(UserInteraction.timestamp.desc()).all()
    all_interacted_movie_ids = {interaction.movie_id for interaction in user_history}

    liked_movies = [i.movie_id for i in user_history if i.rating == 5.0]
    disliked_movies = [i.movie_id for i in user_history if i.rating == 1.0]

    # Take latest 5 liked or fill with disliked
    selected_movie_ids = liked_movies[:5]
    if len(selected_movie_ids) < 5:
        selected_movie_ids += disliked_movies[:5 - len(selected_movie_ids)]

    if not selected_movie_ids:
        return [], all_interacted_movie_ids

    # Generate content + SVD hybrid scores
    content_scores = get_content_scores(selected_movie_ids)
    svd_scores = get_svd_scores(user_id)
    final_scores = blending_alpha * svd_scores + (1 - blending_alpha) * content_scores

    # Filter out already interacted movies
    filtered_indices = [
        i for i in range(len(movie_ids_list))
        if movie_ids_list[i] not in all_interacted_movie_ids
    ]
    
    if not filtered_indices:
        return [], all_interacted_movie_ids

    top_indices = sorted(filtered_indices, key=lambda i: final_scores[i], reverse=True)[:recommendation_top_n]
    recommended_movie_ids = [movie_ids_list[i] for i in top_indices]

    return recommended_movie_ids, all_interacted_movie_ids

TMDB_API_KEY = os.environ.get("TMDB_API_KEY") 

TMDB_IMAGES_BASE_URL=os.environ.get('TMDB_IMAGES_BASE_URL')

TMDB_IMAGE_CDN_BASE_URL =  os.environ.get('TMDB_IMAGE_CDN_BASE_URL')

_tmdb_image_url_cache={}

def get_movie_image_url_from_tmdb(tmdb_id):
    
    if not TMDB_API_KEY or pd.isna(tmdb_id):
        return DEFAULT_POSTER_URL

    tmdb_id = int(tmdb_id) # Ensure it's an integer for the URL

    if tmdb_id in _tmdb_image_url_cache:
        return _tmdb_image_url_cache[tmdb_id]

    # Construct the API URL for images using the API Key in the query parameter
    url = f"{TMDB_IMAGES_BASE_URL}{tmdb_id}/images?api_key={TMDB_API_KEY}"

    try:
        response = requests.get(url, timeout=3) 
        response.raise_for_status() # Raise an exception for HTTP errors (4xx or 5xx)
        data = response.json()

        file_path = None
        # Prioritize posters
        if 'posters' in data and data['posters']:
            # You can add logic here to pick the best poster (e.g., by vote_average, or with 'en' ISO code)
            # For simplicity, we'll take the first one.
            file_path = data['posters'][0].get('file_path')
        # If no posters, try backdrops
        elif 'backdrops' in data and data['backdrops']:
            file_path = data['backdrops'][0].get('file_path')
        # If no backdrops, try logos
        elif 'logos' in data and data['logos']:
            file_path = data['logos'][0].get('file_path')

        if file_path:
            full_url = f"{TMDB_IMAGE_CDN_BASE_URL}{file_path}"
            _tmdb_image_url_cache[tmdb_id] = full_url # Store in cache
            return full_url
        else:
            # print(f"No suitable image found for TMDB ID: {tmdb_id}")
            return DEFAULT_POSTER_URL

    except requests.exceptions.RequestException as e:
        print(f"Error fetching TMDb image for TMDB ID {tmdb_id}: {e}")
        return DEFAULT_POSTER_URL
    except ValueError:
        print(f"Invalid TMDB ID format: {tmdb_id}")
        return DEFAULT_POSTER_URL
    except Exception as e:
        print(f"An unexpected error occurred while fetching TMDB image for {tmdb_id}: {e}")
        return DEFAULT_POSTER_URL
# Routes 

@recommendations_bp.route('/recommend/initial', methods=['GET'])
@login_required
def recommend_initial_movies(): 
    user_id = current_user.id
    user_history = UserInteraction.query.filter_by(user_id=user_id).all()
    if user_history:
        recs_ids, all_interacted_movie_ids = generate_recommendations_from_user_history(user_id)
    else:
        recs_ids = []
        all_interacted_movie_ids = set()
    
    popular_movie_ids_to_recommend = popular_movies_data['movieId']
    
    
    
    if not recs_ids:
        recs_ids = []
        for movie_id in popular_movie_ids_to_recommend :
            if movie_id not in all_interacted_movie_ids:
                recs_ids.append(movie_id)
            if len(recs_ids) == recommendation_top_n:
                break
    
    recommended_movies_data = []# If user interaction exists
    for movie_id in recs_ids:
        movie_info=combined_data[combined_data['movieId']==movie_id].iloc[0]
        tmdb_id = movie_info['tmdbId']
        # Get ONLY the image URL from TMDb
        poster_url = get_movie_image_url_from_tmdb(tmdb_id)
        genres_string = movie_info['content']
        genres_list = genres_string.split(' ')
        title=movie_info['title']
        
        recommended_movies_data.append({
            "movieId": movie_id,
            "title": title,
            "genres": genres_list, # Use genres from your local data, converted to list
            "poster_url": poster_url
            })

    return jsonify({
        "userId": user_id, # Frontend still needs the userId for subsequent POSTs
        "recommendations": recommended_movies_data
    })


@recommendations_bp.route('/recommend', methods=['POST'])
@login_required
def give_recommendations():
    
    data = request.get_json()
    user_id = current_user.id
    liked_movie_ids = data.get('likedMovieIds', [])
    disliked_movie_ids = data.get('dislikedMovieIds', [])
    recs_ids=[]

    if not user_id:
        return jsonify({"error": "User ID is required."}), 400
    
    
    # --- 1. Save User Interactions to DB ---
    try:
        for movie_id in liked_movie_ids:
            # Check for existing interaction to prevent duplicates on multiple submits
            # Query if a specific movie_id, user_id, and rating (5.0 for liked) exists
            existing_interaction = UserInteraction.query.filter_by(
                user_id=user_id, movie_id=movie_id, rating=5.0
            ).first()
            if not existing_interaction:
                save_interaction(user_id, movie_id, 5.0) # Calls the helper function
        for movie_id in disliked_movie_ids:
            # Check for existing interaction (1.0 for disliked)
            existing_interaction = UserInteraction.query.filter_by(
                user_id=user_id, movie_id=movie_id, rating=1.0
            ).first()
            if not existing_interaction:
                save_interaction(user_id, movie_id, 1.0) # Calls the helper function
        db.session.commit() # Commit all changes at once
    except Exception as e:
        db.session.rollback() # Rollback if any error occurs during commit
        print(f"Error storing user interactions: {e}")
        return jsonify({"message": "Error storing interactions", "error_details": str(e)}), 500
    
     # --- 2. Get ALL User's Past Interactions from DB ---
    user_history = UserInteraction.query.filter_by(user_id=user_id).all()
    all_interacted_movie_ids = {interaction.movie_id for interaction in user_history}
    
    user_current_liked_movie_ids = [
        interaction.movie_id for interaction in user_history if interaction.rating == 5.0
    ]
        

    # --- 3. Generate Hybrid Recommendations ---
    if not user_current_liked_movie_ids and not liked_movie_ids:
        # If user has no likes yet (but has dislikes), or just started, fall back to popular
        for movie_id in popular_movies_data['movieId'].tolist():
            if movie_id not in all_interacted_movie_ids:
                recs_ids.append(movie_id)
            if len(recs_ids) == recommendation_top_n:
                break
        
        if not recs_ids: # Fallback if even popular ones are all interacted
             # As a last resort, just provide random movies not seen, if any
            all_movie_ids_set = set(movie_ids_list)
            unseen_movie_ids = list(all_movie_ids_set - all_interacted_movie_ids)
            if unseen_movie_ids:
                recs_ids = np.random.choice(unseen_movie_ids, min(recommendation_top_n, len(unseen_movie_ids)), replace=False).tolist()
            else:
                return jsonify({"message": "No new movies available to recommend."}), 200

    else:
        
        content_scores = get_content_scores(user_current_liked_movie_ids) # Content based filtering
        svd_scores = get_svd_scores(user_id) # SVD handles cold start users gracefully

        final_scores = blending_alpha * svd_scores + (1 - blending_alpha) * content_scores
        
        # Filter out movies the user has already interacted with (liked or disliked)
        # Convert to set for efficient lookup
        filtered_indices = [
            i for i in range(len(movie_ids_list))
            if movie_ids_list[i] not in all_interacted_movie_ids
        ]

        if not filtered_indices:
            return jsonify({"message": "No new movies left to recommend."}), 200

        # Sort and get top_n recommendations
        top_indices = sorted(filtered_indices, key=lambda i: final_scores[i], reverse=True)[:recommendation_top_n]
        recs_ids = [movie_ids_list[i] for i in top_indices]
        

    # --- 4. Prepare Response ---
    
    recommended_movies_data=[]
    for movie_id in recs_ids:
        
        movie_info=combined_data[combined_data['movieId']==movie_id].iloc[0]
        #print(movie_info)
        tmdb_id = movie_info['tmdbId']
        # Get ONLY the image URL from TMDb
        poster_url = get_movie_image_url_from_tmdb(tmdb_id)
        genres_string = movie_info['content']
        genres_list = genres_string.split(' ')
        title=movie_info['title']
        
        recommended_movies_data.append({
            "movieId": movie_id,
            "title": title,
            "genres": genres_list, # Use genres from your local data, converted to list
            "poster_url": poster_url
            })
    return jsonify({"recommendations": recommended_movies_data})