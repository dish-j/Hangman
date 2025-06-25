# app.py - Python Flask Backend for Hangman Words

from flask import Flask, jsonify
from flask_cors import CORS
import random
import requests # Required for making HTTP requests to external APIs

app = Flask(__name__)
CORS(app) # Enable CORS (Cross-Origin Resource Sharing) for all routes.
          # This is crucial for local development where your HTML file (frontend)
          # might be opened directly in the browser (file:// protocol) or served
          # from a different port/origin than your Flask backend.

# --- External Word API Configuration ---
# This API provides a single random word.
# We choose one that is generally available and doesn't require an API key for basic use.
EXTERNAL_WORD_API_URL = "https://random-word-api.herokuapp.com/word?number=1"
# For more options, you could explore:
# - https://api.api-ninjas.com/v1/randomword (requires API key)
# - https://random-word-api.vercel.app/api?words_count=1 (another simple option)

# --- Fallback words ---
# This list is used if the external API call fails for any reason (e.g., network issues, API downtime).
FALLBACK_WORDS = [
    "RONALD", "DUMBLEDORE", "HERMIONE", "ELENA", "FLABBERGASTED",
    "PYTHON", "FLASK", "JAVASCRIPT", "HTML", "CSS", "API",
    "FINTECH", "BANKING", "ANALYST", "AUTOMATION", "RESEARCH",
    "COLLABORATE", "INNOVATE", "SOLUTION", "JPMORGAN", "INTEGRATE",
    "ENTERPRISE", "DATABASE", "ALGORITHM", "SECURITY", "DIGITAL"
]

@app.route('/api/random_word')
def get_random_word():
    """
    API endpoint that returns a random word.
    This function attempts to fetch a word from an external API.
    If the external API call fails, it falls back to a locally defined list.
    """
    try:
        # Attempt to fetch a word from the external API
        # Using a timeout prevents the server from hanging indefinitely
        response = requests.get(EXTERNAL_WORD_API_URL, timeout=5)
        # Raise an exception for bad HTTP status codes (4xx or 5xx)
        response.raise_for_status()

        # Parse the JSON response
        data = response.json()
        if data and isinstance(data, list) and len(data) > 0:
            # The API returns a list, so we take the first word and convert it to uppercase
            word = data[0].upper()
            print(f"Serving word from external API: {word}") # Log for debugging
            return jsonify({'word': word})
        else:
            # If the external API returns empty or malformed data, treat it as a failure
            print("External API returned empty or unexpected data. Falling back.")
            raise ValueError("Empty or malformed response from external API.")

    except requests.exceptions.RequestException as e:
        # Catch any request-related errors (e.g., network issues, timeouts)
        print(f"Error fetching word from external API: {e}. Falling back to local list.")
    except (ValueError, IndexError) as e:
        # Catch errors related to processing the API response (e.g., JSON parsing issues)
        print(f"Error processing external API response: {e}. Falling back to local list.")
    except Exception as e:
        # Catch any other unexpected errors
        print(f"An unexpected error occurred: {e}. Falling back to local list.")
    
    # If any error occurs during the external API call, or if the response is bad,
    # fall back to choosing a random word from the locally defined list.
    word = random.choice(FALLBACK_WORDS).upper()
    print(f"Serving fallback word: {word}") # Log for debugging
    return jsonify({'word': word})

if __name__ == '__main__':
    # Run the Flask development server.
    # It will be accessible at http://127.0.0.1:5000/ by default.
    # debug=True enables auto-reloading and better error messages during development.
    # port=5000 explicitly sets the port, making it clear for the frontend.
    app.run(debug=True, port=5000)
