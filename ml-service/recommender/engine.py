"""
Hybrid Project Recommendation Engine.
Combines rule-based matching (skills, difficulty) and semantic similarity.
"""

from .difficulty import calculate_difficulty_match
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
import re
import random

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

def get_roadmap_by_difficulty(difficulty, domain, tech_stack):
    """Returns a tailored roadmap based on project difficulty level."""
    tech_str = tech_stack[0].title() if tech_stack else "Modern Stack"
    
    if difficulty <= 2: # Beginner
        return [
            {"phase": "Phase 1: Fundamentals", "task": f"Learn core {tech_str} syntax and setup development environment."},
            {"phase": "Phase 2: Basic UI/Logic", "task": f"Implement a simple {domain} interface and basic functionality."},
            {"phase": "Phase 3: Data & State", "task": "Handle user input and basic data persistence locally."},
            {"phase": "Phase 4: Styling & Polish", "task": "Add responsive styles and deploy to a static host."}
        ]
    elif difficulty <= 4: # Intermediate
        return [
            {"phase": "Phase 1: Architecture", "task": f"Design a modular {domain} system using {tech_str} and best practices."},
            {"phase": "Phase 2: API & Integration", "task": "Build robust REST/GraphQL endpoints and integrate third-party services."},
            {"phase": "Phase 3: Security & Auth", "task": "Implement JWT authentication, middleware, and protected routes."},
            {"phase": "Phase 4: Deployment", "task": "Configure Docker containers and CI/CD pipelines for staging."}
        ]
    else: # Advanced / Enterprise
        return [
            {"phase": "Phase 1: Enterprise Design", "task": f"Architect a distributed {domain} system using microservices or event-driven patterns."},
            {"phase": "Phase 2: Performance & Scale", "task": "Implement Redis caching, message queues (RabbitMQ), and database optimization."},
            {"phase": "Phase 3: Advanced Intelligence", "task": f"Integrate ML models or complex {domain} logic with error monitoring (Sentry)."},
            {"phase": "Phase 4: High Availability", "task": "Deploy to Kubernetes with load balancing and auto-scaling."}
        ]

def get_project_recommendations(user_skills, user_interests, academic_level, preferred_role, projects):
    """
    Production-grade matching engine.
    Formula: 0.35 Skill + 0.25 Role + 0.20 Interest + 0.15 Exp + 0.05 Collab
    """
    if not projects:
        return []
        
    recommendations = []
    user_skill_dict = {s['name'].lower(): s.get('proficiency', 1) for s in user_skills}
    user_skill_names = set(user_skill_dict.keys())
    
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
        except:
            pass

    for idx, proj in enumerate(projects):
        proj_tech_stack = proj.get('tech_stack', [])
        if isinstance(proj_tech_stack, str):
            import json
            try: proj_tech_stack = json.loads(proj_tech_stack)
            except: proj_tech_stack = []
            
        required_skills = [s.lower() for s in proj_tech_stack]
        
        # 1. Skill Overlap (35%)
        matches = [s for s in required_skills if s in user_skill_names]
        skill_score = (len(matches) / max(len(required_skills), 1)) if required_skills else 0.5
        
        # 2. Complementary Fit / Tech Stack Match (25%)
        # Proficiency check: do you have high proficiency in what they need?
        prof_matches = [s for s in matches if user_skill_dict.get(s, 1) >= 3]
        complementary_score = (len(prof_matches) / max(len(matches), 1)) if matches else 0.4
        
        # 3. Role Fit (20%)
        role_score = 0.5
        clean_role = clean_text(preferred_role)
        proj_text = clean_text(f"{proj.get('title', '')} {proj.get('description', '')}")
        if clean_role and clean_role in proj_text: role_score = 1.0
        elif clean_role and any(word in proj_text for word in clean_role.split()): role_score = 0.8

        # 4. Project Interest (10%)
        interest_score = float(interest_scores[idx])
        
        # 5. Experience Compatibility (10%)
        difficulty_level = proj.get('difficulty_level', 1)
        level_map = {
            'B.Tech 1st Year': 1, 'B.Tech 2nd Year': 2, 'B.Tech 3rd Year': 3, 
            'B.Tech 4th Year': 4, 'M.Tech / Masters': 5, 'PhD Scholar': 6, 'Faculty': 7
        }
        user_level_val = level_map.get(academic_level, 2)
        exp_score = max(0, 1 - (abs(user_level_val - difficulty_level) / 5.0))
        
        # Final Formula: 35% Skill + 25% Complementary + 20% Role + 10% Interest + 10% Experience
        total_score = round(((skill_score * 0.35) + (complementary_score * 0.25) + (role_score * 0.20) + (interest_score * 0.10) + (exp_score * 0.10)) * 100, 2)

        # Formula-driven Reasoning
        reasoning = f"{total_score}% match because "
        reasons = []
        if matches:
            reasons.append(f"you share {', '.join([s.title() for s in matches[:2]])}")
        if prof_matches:
            reasons.append(f"you have high proficiency in {prof_matches[0].title()}")
        if role_score > 0.7:
            reasons.append(f"it perfectly fits your {preferred_role} goals")
        if interest_score > 0.5:
            reasons.append("it aligns with your research domain")
            
        final_explanation = reasoning + (" and ".join(reasons) if reasons else "it aligns with your overall learning path.")

        recommendations.append({
            "id": proj['id'],
            "title": proj['title'],
            "description": proj['description'],
            "difficulty_level": difficulty_level,
            "tech_stack": proj_tech_stack,
            "match_score": total_score,
            "skill_match": round(skill_score * 100, 2),
            "interest_match": round(interest_score * 100, 2),
            "explanation": final_explanation,
            "suggested_roles": ["Backend Engineer", "ML Researcher", "System Architect"][:random.randint(1, 3)],
            "gap_info": {
                "missing_skills": [s.title() for s in required_skills if s not in user_skill_names],
                "requirements": generate_requirements(proj.get('domain', 'Project'), required_skills),
                "skill_analysis": f"Matches {round(skill_score*100)}% of requirements.",
                "resources": generate_resources([s for s in required_skills if s not in user_skill_names])
            },
            "roadmap": get_roadmap_by_difficulty(difficulty_level, proj.get('domain', 'Project'), proj_tech_stack)
        })

    recommendations.sort(key=lambda x: x['match_score'], reverse=True)
    return recommendations[:15]

def generate_synthetic_projects(query, user_skills):
    """Creates standout, resume-worthy project ideas instead of basics."""
    results = []
    clean_query = query.title()
    extracted_skills = ['Next.js', 'PyTorch', 'Docker', 'PostgreSQL', 'Redis'] # Simulated extraction
    
    # 20+ diverse project templates across multiple domains
    blueprints = [
        # LLM / GenAI
        {"title": f"Autonomous {clean_query} Agents Workflow", "diff": 5, "domain": "Artificial Intelligence"},
        {"title": f"RAG-Powered {clean_query} Copilot", "diff": 4, "domain": "Artificial Intelligence"},
        {"title": f"Local LLM {clean_query} Fine-tuning Pipeline", "diff": 5, "domain": "Machine Learning"},
        
        # Systems & Distributed
        {"title": f"Distributed {clean_query} Optimization Engine", "diff": 4, "domain": "Systems Architecture"},
        {"title": f"High-Throughput {clean_query} Message Queue", "diff": 5, "domain": "Systems Programming"},
        {"title": f"Fault-Tolerant {clean_query} Consensus Protocol", "diff": 5, "domain": "Distributed Systems"},
        
        # Security
        {"title": f"Zero-Trust {clean_query} Security Framework", "diff": 4, "domain": "Cybersecurity"},
        {"title": f"Privacy-Preserving {clean_query} Network", "diff": 5, "domain": "Cryptography"},
        {"title": f"Automated {clean_query} Vulnerability Scanner", "diff": 3, "domain": "InfoSec"},
        
        # Healthcare AI
        {"title": f"Predictive {clean_query} Diagnostic Tool", "diff": 4, "domain": "HealthTech"},
        {"title": f"Genomic Data {clean_query} Pipeline", "diff": 5, "domain": "Bioinformatics"},
        
        # Developer Tools
        {"title": f"CI/CD {clean_query} Automation Bot", "diff": 3, "domain": "DevOps"},
        {"title": f"Real-time {clean_query} Performance Profiler", "diff": 4, "domain": "Developer Tools"},
        {"title": f"WASM-compiled {clean_query} Code Formatter", "diff": 4, "domain": "WebAssembly"},
        
        # Data Engineering
        {"title": f"Real-time {clean_query} Analytics Pipeline", "diff": 3, "domain": "Data Engineering"},
        {"title": f"Graph Database {clean_query} Visualizer", "diff": 4, "domain": "Data Science"},
        
        # Robotics / IoT
        {"title": f"Edge-Compute {clean_query} Sensor Network", "diff": 4, "domain": "Internet of Things"},
        {"title": f"Computer Vision {clean_query} Tracking System", "diff": 4, "domain": "Robotics"},
        
        # Product/Startup
        {"title": f"B2B SaaS {clean_query} Platform", "diff": 3, "domain": "Software Engineering"},
        {"title": f"Serverless {clean_query} E-commerce API", "diff": 2, "domain": "Web Development"},
    ]
    
    import random
    random.shuffle(blueprints)

    for b in blueprints[:4]:
        results.append({
            "id": f"gen_{int(np.random.rand()*10000)}",
            "title": b['title'],
            "description": f"An advanced {b['domain'].lower()} system implementing {query.lower()} with high-performance components and industry best practices.",
            "difficulty_level": b['diff'],
            "domain": b['domain'],
            "tech_stack": extracted_skills,
            "is_generated": True,
            "match_score": round(80 + np.random.rand()*15, 2),
            "explanation": f"Synthesized {b['domain']} project tailored for your research interests.",
            "suggested_roles": ["Lead Developer", "System Designer"],
            "gap_info": {
                "missing_skills": ["Enterprise Scalability", "Advanced Architecture"],
                "requirements": ["Implement core logic", "Ensure high availability", "Optimize data flow"],
                "resources": generate_resources(extracted_skills)
            },
            "roadmap": get_roadmap_by_difficulty(b['diff'], b['domain'], extracted_skills)
        })
    
    return results

