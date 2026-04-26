"""
Skill Gap Detector.
Identifies missing skills required for a project.
Provides a simple, explainable learning path.
"""

# Simple mapping of skills to generic learning paths.
# In a real app, this would be a database table of courses/articles.
LEARNING_PATHS = {
    "react": "Learn basics of React components -> Understand Hooks -> Build a simple to-do app.",
    "python": "Learn basic syntax -> Understand data structures (lists, dicts) -> Write simple scripts.",
    "machine learning": "Understand basic statistics -> Learn Scikit-Learn basics -> Train a simple classifier.",
    "sql": "Learn basic SELECT queries -> Understand JOINs -> Practice on dummy databases.",
    "docker": "Understand container concepts -> Write a simple Dockerfile -> Run a local container."
}

def detect_skill_gaps(user_skills, project_skills):
    """
    Compares user skills against project required skills.
    Returns missing skills and a suggested learning path.
    """
    user_skill_names = {s['name'].lower() for s in user_skills}
    gaps = []
    
    for ps in project_skills:
        skill_name = ps.get('name', '').lower()
        if not skill_name:
            continue
            
        if skill_name not in user_skill_names:
            # We found a gap
            importance = ps.get('importance', 'required')
            path = LEARNING_PATHS.get(
                skill_name, 
                f"Search for '{skill_name} crash course' on YouTube -> Read official docs -> Build a small demo."
            )
            
            gaps.append({
                "skill_name": ps.get('name'),
                "importance": importance,
                "suggested_path": path
            })
            
    return gaps
