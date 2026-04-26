"""
Difficulty calibration logic.
Matches user's academic level and overall skill score with project difficulty.
"""

ACADEMIC_LEVEL_SCORES = {
    'freshman': 1,
    'sophomore': 2,
    'junior': 3,
    'senior': 4,
    'graduate': 5
}

def calculate_difficulty_match(user_level, user_skills, project_difficulty):
    """
    Computes how well a project's difficulty matches the user's level.
    Score: 0.0 to 1.0 (multiplied by 100 later)
    """
    level_score = ACADEMIC_LEVEL_SCORES.get(user_level, 1)
    
    # Calculate a simple "skill depth" score based on number of skills and proficiency
    skill_score = sum(s.get('proficiency', 1) for s in user_skills)
    
    # Base expected difficulty
    # e.g., A freshman with few skills -> expected difficulty 1 or 2
    # A senior with many skills -> expected difficulty 4 or 5
    expected_diff = level_score
    if skill_score > 15:
        expected_diff = min(5, expected_diff + 1)
    elif skill_score < 5:
        expected_diff = max(1, expected_diff - 1)
        
    diff_difference = abs(expected_diff - project_difficulty)
    
    # Max difference is 4. Map difference to a score (0 difference = 1.0)
    match_score = max(0.0, 1.0 - (diff_difference * 0.25))
    
    return match_score
