"""
Hybrid Project Recommendation Engine.
Combines rule-based matching (skills, difficulty) and semantic similarity.
"""

from .difficulty import calculate_difficulty_match
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
import re

def clean_text(text):
    if not text: return ""
    return re.sub(r'[^a-zA-Z0-9\s]', ' ', text.lower())

def generate_resources(skills):
    return [{"skill": s.title(), "url": f"https://www.google.com/search?q={s.replace(' ', '+')}+documentation"} for s in skills]

def generate_requirements(domain, skills):
    return [
        f"Design the core {domain} architecture using {skills[0].title() if skills else 'Modern Stack'}",
        f"Implement robust data persistence with PostgreSQL and {skills[1].title() if len(skills) > 1 else 'Redis'}",
        "Configure automated testing and CI/CD for reliable deployment"
    ]

def get_project_recommendations(user_skills, user_interests, academic_level, preferred_role, projects):
    """
    Production-grade matching engine.
    Formula: 0.35 Skill + 0.25 Role + 0.20 Interest + 0.15 Exp + 0.05 Collab
    """
    if not projects:
        return []
        
    recommendations = []
    # Index user skills by name for fast lookup
    user_skill_dict = {s['name'].lower(): s.get('proficiency', 1) for s in user_skills}
    user_skill_names = set(user_skill_dict.keys())
    
    # 1. Semantic Profile for Interest Matching
    user_profile_str = clean_text(" ".join(user_interests))
    
    project_corpus = [
        clean_text(f"{p.get('title', '')} {p.get('description', '')} {p.get('domain', '')}")
        for p in projects
    ]
    
    interest_scores = [0.0] * len(projects)
    if user_profile_str and any(project_corpus):
        try:
            vectorizer = TfidfVectorizer(stop_words='english', ngram_range=(1, 2))
            tfidf_matrix = vectorizer.fit_transform([user_profile_str] + project_corpus)
            similarities = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:])[0]
            interest_scores = similarities
        except Exception as e:
            print(f"Semantic scoring error: {e}")

    for idx, proj in enumerate(projects):
        # A. Skill Match (35%) - Direct overlap of required skills
        proj_tech_stack = proj.get('tech_stack', [])
        if isinstance(proj_tech_stack, str):
            import json
            try: proj_tech_stack = json.loads(proj_tech_stack)
            except: proj_tech_stack = []
            
        required_skills = [s.lower() for s in proj_tech_stack]
        
        if not required_skills:
            skill_score = 0.5
        else:
            matches = [s for s in required_skills if s in user_skill_names]
            # Weigh by proficiency if available
            skill_score = sum([min(5, user_skill_dict.get(s, 1)) for s in matches]) / (len(required_skills) * 5)

        # B. Role Compatibility (25%) - Semantic match or direct match with preferred role
        role_score = 0.5
        if preferred_role:
            clean_role = clean_text(preferred_role)
            proj_text = clean_text(f"{proj.get('title', '')} {proj.get('description', '')}")
            if clean_role in proj_text:
                role_score = 1.0
            elif any(word in proj_text for word in clean_role.split()):
                role_score = 0.7

        # C. Interest/Domain Similarity (20%) - Semantic similarity to user interests
        interest_score = float(interest_scores[idx])
        
        # D. Experience Alignment (15%) - Academic level vs difficulty
        difficulty_level = proj.get('difficulty_level', 1)
        level_map = {
            'B.Tech 1st Year': 1, 'B.Tech 2nd Year': 2, 'B.Tech 3rd Year': 3, 
            'B.Tech 4th Year': 4, 'M.Tech / Masters': 5, 'PhD Scholar': 6, 'Faculty': 7
        }
        user_level_val = level_map.get(academic_level, 2)
        exp_diff = abs(user_level_val - difficulty_level)
        exp_score = max(0, 1 - (exp_diff / 5.0))
        
        # E. Collaboration Signals (5%) - Mocked boost for trending
        collab_score = 0.8 if proj.get('is_trending') else 0.5
        
        # Final Weighted Score
        total_score = (
            (skill_score * 0.35) + 
            (role_score * 0.25) + 
            (interest_score * 0.20) + 
            (exp_score * 0.15) + 
            (collab_score * 0.05)
        )
        total_score = round(total_score * 100, 2)

        # Dynamic Explanation & Gap Info
        explanations = []
        if skill_score > 0.7: explanations.append("Strong technical fit.")
        if role_score > 0.7: explanations.append(f"Matches your {preferred_role} role.")
        if interest_score > 0.5: explanations.append("Aligns with your interests.")
        if exp_score > 0.8: explanations.append("Perfect difficulty match.")
        
        missing = [s for s in required_skills if s not in user_skill_names]
        
        # Dynamic Suggested Roles Needed
        suggested_roles = ["Full Stack Engineer"]
        if "python" in required_skills or "tensorflow" in required_skills:
            suggested_roles.append("ML Engineer")
        if "react" in required_skills or "figma" in required_skills:
            suggested_roles.append("Frontend/UX Engineer")
        if "postgresql" in required_skills or "aws" in required_skills:
            suggested_roles.append("Backend/DevOps Engineer")
        
        recommendations.append({
            "id": proj['id'],
            "title": proj['title'],
            "description": proj['description'],
            "difficulty_level": difficulty_level,
            "tech_stack": proj_tech_stack,
            "match_score": total_score,
            "skill_match": round(skill_score * 100, 2),
            "role_match": round(role_score * 100, 2),
            "interest_match": round(interest_score * 100, 2),
            "explanation": " • ".join(explanations) if explanations else "Great foundation project for you.",
            "suggested_roles": list(set(suggested_roles)),
            "gap_info": {
                "missing_skills": [s.title() for s in missing],
                "requirements": generate_requirements(proj.get('domain', 'Project'), required_skills),
                "skill_analysis": f"Matches {round(skill_score*100)}% of the core technical requirements.",
                "resources": generate_resources(missing)
            },
            "roadmap": [
                {"phase": "Phase 1: Architecture", "task": f"Design system flow and setup {'/'.join(required_skills[:2])}." if required_skills else "Design initial architecture."},
                {"phase": "Phase 2: Core Dev", "task": f"Implement the primary features for {proj.get('domain', 'the project')}."},
                {"phase": "Phase 3: Integration", "task": "Connect services, refine APIs, and test edge cases."},
                {"phase": "Phase 4: Launch", "task": "Final performance tuning and deployment."}
            ]
        })

    # Sort and return top recommendations (minimum 3 if available)
    recommendations.sort(key=lambda x: x['match_score'], reverse=True)
    return recommendations[:15]

def generate_synthetic_projects(query, user_skills):
    """
    Creates a 3-tiered choice: Beginner, Intermediate, Advanced.
    """
    results = []
    clean_query = query.lower()
    possible_skills = ['react', 'node.js', 'python', 'solidity', 'blockchain', 'web3', 'ai', 'machine learning', 'pytorch', 'tensorflow', 'docker', 'kubernetes', 'aws', 'firebase', 'next.js', 'tailwind', 'postgresql']
    
    extracted = [s for s in possible_skills if s in clean_query]
    if not extracted: extracted = ['react', 'python']

    tiers = [
        {"level": "Beginner", "diff": 1, "scale": "Fundamentals"},
        {"level": "Intermediate", "diff": 3, "scale": "Professional"},
        {"level": "Advanced", "diff": 5, "scale": "Enterprise"}
    ]

    for t in tiers:
        title = f"{t['scale']} {query.title()}"
        # Dynamic Suggested Roles Needed for Synthetic Projects
        suggested_roles = ["Full Stack Engineer"]
        if "python" in extracted or "machine learning" in extracted or "ai" in extracted:
            suggested_roles.append("ML Engineer")
        if "react" in extracted or "tailwind" in extracted:
            suggested_roles.append("Frontend/UX Engineer")
        if "postgresql" in extracted or "aws" in extracted or "docker" in extracted:
            suggested_roles.append("Backend/DevOps Engineer")
        if "solidity" in extracted or "web3" in extracted:
            suggested_roles.append("Blockchain Engineer")

        results.append({
            "id": f"gen_{t['level'].lower()}_{int(np.random.rand()*1000)}",
            "title": title,
            "description": f"A {t['level'].lower()} level {query} project focusing on {t['scale'].lower()}. Built using {', '.join(extracted)}.",
            "difficulty_level": t['diff'],
            "domain": query.title(),
            "tech_stack": extracted,
            "estimated_weeks": 4 + (t['diff'] * 2),
            "is_generated": True,
            "match_score": round(75 + np.random.rand()*20, 2),
            "skill_match": 85.0,
            "interest_match": 100.0,
            "explanation": f"Tiered {t['level']} recommendation for your query.",
            "suggested_roles": list(set(suggested_roles)),
            "gap_info": {
                "missing_skills": ["Enterprise Architecture", "System Design"] if t['diff'] > 3 else ["Advanced " + extracted[0].title()] if t['diff'] > 1 else [],
                "requirements": [f"Develop core {query} logic", "Integrate scalable components", "Optimize for production"],
                "skill_analysis": f"Matches your interest in {query}. Ideal for {t['level'].lower()} skill building.",
                "resources": generate_resources(extracted)
            },
            "roadmap": [
                {"phase": "Phase 1: Setup", "task": f"Install dependencies and initialize {extracted[0]} repository." if t['diff'] == 1 else f"Architect the {query} microservices." if t['diff'] == 5 else f"Design {query} database schema."},
                {"phase": "Phase 2: Core", "task": f"Build basic UI/logic for {query}." if t['diff'] == 1 else f"Implement scalable data ingestion for {query}." if t['diff'] == 5 else f"Develop MVP features using {extracted[0]}."},
                {"phase": "Phase 3: Refine", "task": "Add basic error handling and styling." if t['diff'] == 1 else "Implement caching and message queues." if t['diff'] == 5 else "Add user authentication and API endpoints."},
                {"phase": "Phase 4: Launch", "task": "Deploy to Vercel/Netlify." if t['diff'] == 1 else "Deploy to AWS/GCP with Kubernetes." if t['diff'] == 5 else "Deploy using Docker containers."}
            ]
        })
    
    return results

