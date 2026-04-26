"""
NLP Skill Parser.
Uses scikit-learn TF-IDF vectorizer basics to extract recognized skills from free text.
(A simplified rule-based extraction for this prototype).
"""
import re

# In a real app, this would be a massive taxonomy loaded from a DB or JSON
KNOWN_SKILLS = [
    "python", "javascript", "java", "c++", "c#", "ruby", "go", "rust",
    "react", "angular", "vue", "node.js", "express", "django", "flask",
    "spring", "machine learning", "deep learning", "nlp", "ai", "data science",
    "sql", "mysql", "postgresql", "mongodb", "docker", "kubernetes", "aws"
]

def parse_skills_from_text(text):
    """
    Extracts known skills from text using simple regex boundaries.
    """
    if not text:
        return []
        
    text_lower = text.lower()
    extracted = []
    
    for skill in KNOWN_SKILLS:
        # Use regex word boundaries so 'c' doesn't match 'react'
        # Special handling for skills with symbols
        escaped_skill = re.escape(skill)
        pattern = r'\b' + escaped_skill + r'\b'
        
        # 'c++' and 'c#' need careful boundary checks since symbols aren't \w
        if '+' in skill or '#' in skill or '.' in skill:
            if skill in text_lower:
                 extracted.append({"name": skill, "category": "language", "proficiency": 1})
            continue
            
        if re.search(pattern, text_lower):
            extracted.append({"name": skill, "category": "concept" if len(skill.split()) > 1 else "language", "proficiency": 1})
            
    return extracted
 