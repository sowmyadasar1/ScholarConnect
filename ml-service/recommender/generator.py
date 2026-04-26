import random
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from .engine import get_project_recommendations, clean_text

# Knowledge Base of Project Blueprints for "Generative" AI Search
PROJECT_TEMPLATES = [
    {
        "title": "Intelligent {domain} {system}",
        "description": "A {scale} application that uses {tech} to solve {problem}.",
        "domains": ["Healthcare", "Finance", "Education", "E-commerce", "Security"],
        "systems": ["Dashboard", "API", "Mobile App", "Bot", "Analysis Engine"],
        "scales": ["scalable", "real-time", "distributed", "privacy-preserving"],
        "problems": ["data accessibility", "performance bottlenecks", "user engagement", "predictive accuracy"]
    },
    {
        "title": "{tech} powered {domain} Hub",
        "description": "Building a centralized platform for {domain} professionals using {tech}.",
        "domains": ["Legal Tech", "Clean Energy", "Logistics", "Smart Home"],
        "techs": ["React & Node.js", "Python & PyTorch", "Solidity & Web3", "Go & Kubernetes"]
    }
]

def generate_ai_projects(query, user_skills, projects):
    """
    Intelligent AI Project Search & Generation.
    1. Search existing corpus semantically.
    2. If match is weak, synthesize a new project blueprint based on query intent.
    """
    if not projects:
        return []

    # 1. Semantic Retrieval from Corpus
    project_corpus = [
        clean_text(f"{p.get('title', '')} {p.get('description', '')} {p.get('domain', '')}")
        for p in projects
    ]
    
    clean_query = clean_text(query)
    
    try:
        vectorizer = TfidfVectorizer(stop_words='english', ngram_range=(1, 2))
        tfidf_matrix = vectorizer.fit_transform([clean_query] + project_corpus)
        similarities = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:])[0]
        
        best_idx = similarities.argsort()[-3:][::-1]
        best_score = similarities[best_idx[0]]
        
        results = []
        
        # If we have a good match (> 0.4 similarity), return existing projects
        if best_score > 0.4:
            for idx in best_idx:
                proj = projects[idx]
                results.append({
                    "id": proj['id'],
                    "title": proj['title'],
                    "description": proj['description'],
                    "match_score": round(float(similarities[idx]) * 100, 2),
                    "is_generated": False,
                    "explanation": f"Matched your query '{query}' in our database."
                })
        else:
            # 2. GENERATIVE PHASE: Use the tiered engine logic
            from .engine import generate_synthetic_projects
            results = generate_synthetic_projects(query, user_skills)
            
        return results
    except Exception as e:
        print(f"Generation error: {e}")
        return []
