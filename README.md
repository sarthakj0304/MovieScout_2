# MovieScout
An online tinder like interface for movie recommendation. Uses Content based and collaborative filtering to generate recommendations on the go. Built with a React frontend and a Flask backend, MovieScout delivers a smooth, personalized experience for movie lovers.

# Features

-  User authentication (Flask backend)
-  Hybrid recommendation engine (collaborative + content-based)
-  Uses MovieLens for training, TMDB for metadata (poster, release date, etc.)
-  React frontend with Context API for state sharing
-  **Pages**: Login, Signup, Home, Liked Movies, and more
-  **Modern UI** — React + Context API for state management and routing

# Tech Stack

- **Frontend**: React, Context API
- **Backend**: Flask, Flask-JWT-Auth
- **ML Model**: Hybrid recommender using MovieLens data. SVD for collaborative filtering
- **Database/API**: TMDB API for movie metadata, Movie lens dataset for model training

## Installation and running
### Training model
run the file model_training.ipynb to train the models as the trained models could not be uploaded due to size issues
###  Backend
run this on your terminal
cd Backend
python app.py
### Frontend
cd Frontend
npm install
npm run dev

# How it works
MovieScout combines collaborative filtering and content-based filtering to provide personalized movie recommendations through a swipe-based interface. Here's how the system works end to end:
**Model Training** (model_training.ipynb)

- Datasets Used:

movies.csv, ratings.csv, links.csv, and tags.csv from the MovieLens dataset

- Preprocessing:
Basic cleaning, merging datasets, and filtering for useful fields.

- Content-Based Filtering:

 Uses TF-IDF vectorization on movie genres.

  Calculates cosine similarity between movies.

- Collaborative Filtering:

  Built using Surprise’s SVD algorithm.

  GridSearchCV is used to tune hyperparameters.

- Hybrid Recommendation:
Combines both methods using a weighted formula:
final_scores = ALPHA * svd_scores + (1 - ALPHA) * content_scores

- Cold Start:
A precomputed list of popular movies by genre is created for users with no prior interactions.

**Model Saving**

All trained models and scoring functions are saved (using Pickle or NumPy formats) in the model /trained_models/ directory to be loaded by the backend during inference.

**Backend (Flask)**

- Blueprint Structure:

  auth.py: Handles user signup, login, password hashing using Flask-Login and JWT.

  recommendation.py: Loads trained models and provides two main endpoints:

  GET /recommend/initial: Returns popular movies per genre (for new users).

  POST /recommend: Generates personalized recommendations using the hybrid model.

- Database:

  SQLite with SQLAlchemy ORM.

  User model stores user_id, username, and hashed password.

  UserInteraction model stores user_id, movie_id, rating, and timestamp.

**Frontend (React)**

  - Folder Structure:

    src/components/: Reusable UI components like Navbar, MovieCard, SwipeMovie.

    src/pages/: Pages like Login, Signup, Home, and LikedMovies.

    src/context/MovieContext.jsx:

    Central state and logic manager.

    Sends API requests to backend for recommendations.

    Maintains app-wide state: liked/disliked movies, current queue, load more, etc.

    src/styles/: Contains all CSS styling.

    Recommendation Interface:
    The SwipeMovie component handles the main "Tinder-like" swipe logic for movie recommendations.

# Known issues and Fixes
If you get API errors from TMDB while in India, change your DNS settings to: 1.1.1.1 in your network settings

# Acknowledgements
This project uses the MovieLens Dataset 
F. Maxwell Harper and Joseph A. Konstan. 2015. The MovieLens Datasets: History and Context. ACM Transactions on Interactive Intelligent Systems (TiiS) 5, 4: 19:1–19:19

# Licence
This project is for personal/educational use only.
All rights reserved. Commercial use is prohibited.




