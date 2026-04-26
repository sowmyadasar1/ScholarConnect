"""
ScholarConnect - ML Service
Provides endpoints for recommendations, matching, and NLP tasks.
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from recommender.engine import get_project_recommendations
from matcher.mentor import match_mentors
from matcher.teammate import match_teammates
from recommender.generator import generate_ai_projects
from nlp.skill_parser import parse_skills_from_text

app = Flask(__name__)
CORS(app)

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "ok"})

@app.route('/recommend', methods=['POST'])
def recommend():
    """
    POST /recommend
    Get project recommendations for a user.
    """
    data = request.json
    try:
        recommendations = get_project_recommendations(
            user_skills=data.get('user_skills', []),
            user_interests=data.get('user_interests', []),
            academic_level=data.get('academic_level', 'undergraduate'),
            preferred_role=data.get('preferred_role', ''),
            projects=data.get('projects', [])
        )
        return jsonify({"recommendations": recommendations, "fallback": False})
    except Exception as e:
        print(f"Error in recommendation: {e}")
        return jsonify({"recommendations": [], "fallback": True})

@app.route('/generate', methods=['POST'])
def generate():
    """
    POST /generate
    Generates synthetic projects or retrieves close matches based on natural language query.
    """
    data = request.json
    query = data.get('query', '')
    user_skills = data.get('user_skills', [])
    projects = data.get('projects', [])
    try:
        # Use the dedicated generator which handles retrieval + synthesis
        recommendations = generate_ai_projects(query, user_skills, projects)
        return jsonify({"recommendations": recommendations, "fallback": False})
    except Exception as e:
        print(f"Error in generation: {e}")
        return jsonify({"recommendations": [], "fallback": True})

@app.route('/match/mentors', methods=['POST'])
def match_mentors_endpoint():
    data = request.json
    try:
        matches = match_mentors(
            user_skills=data.get('userSkills', []),
            user_interests=data.get('userInterests', []),
            mentors=data.get('mentors', [])
        )
        return jsonify({"matches": matches})
    except Exception as e:
        print(f"Error in mentor match: {e}")
        return jsonify({"matches": []})

@app.route('/match/teammates', methods=['POST'])
def match_teammates_endpoint():
    data = request.json
    try:
        suggestions = match_teammates(
            user_profile=data.get('userProfile', {}),
            candidates=data.get('candidates', [])
        )
        return jsonify({"suggestions": suggestions})
    except Exception as e:
        print(f"Error in teammate match: {e}")
        return jsonify({"suggestions": []})

@app.route('/nlp/parse-skills', methods=['POST'])
def parse_skills():
    data = request.json
    try:
        skills = parse_skills_from_text(data.get('text', ''))
        return jsonify({"skills": skills})
    except Exception as e:
        print(f"Error in skill parser: {e}")
        return jsonify({"skills": []})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)
