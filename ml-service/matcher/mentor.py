def match_mentors(user_skills, user_interests, mentors):
    """
    Enhanced mentor matcher with proficiency-weighted skill matching and semantic domain matching.
    """
    matches = []
    
    user_skill_dict = {s['name'].lower(): s.get('proficiency', 1) for s in user_skills}
    user_skill_names = set(user_skill_dict.keys())
    
    # Pre-process user interests for simple matching
    clean_user_interests = [i.lower() for i in user_interests]
    
    for mentor in mentors:
        # 1. Skill Depth Match (45%)
        mentor_skills = {s['name'].lower(): s.get('proficiency', 3) for s in mentor.get('skills', [])}
        
        if not mentor_skills:
            skill_score = 0.2
        else:
            overlap = [s for s in mentor_skills if s in user_skill_names]
            if not overlap:
                skill_score = 0.3
            else:
                growth_points = 0
                for s in overlap:
                    if mentor_skills[s] > user_skill_dict.get(s, 1):
                        growth_points += 1
                skill_score = (len(overlap) / len(mentor_skills)) * 0.7 + (growth_points / len(overlap)) * 0.3
            
        # 2. Domain Expert Match (35%)
        mentor_domain = mentor.get('domain', '').lower()
        domain_score = 0.5 # Default
        
        if mentor_domain:
            if mentor_domain in clean_user_interests or any(i in mentor_domain for i in clean_user_interests):
                domain_score = 1.0
            else:
                # Basic overlap check
                words1 = set(mentor_domain.split())
                words2 = set(" ".join(clean_user_interests).split())
                if words1.intersection(words2):
                    domain_score = 0.8
        
        # 3. Experience Seniority (20%)
        exp_years = mentor.get('experience_years', 0)
        exp_score = min(1.0, exp_years / 10.0) # 10+ years = max points
        
        total_score = (skill_score * 0.45) + (domain_score * 0.35) + (exp_score * 0.20)
        total_score *= 100
        
        explanation = []
        if skill_score > 0.7:
            high_skills = [s['name'] for s in mentor.get('skills', []) if s.get('proficiency', 0) >= 4]
            if high_skills:
                explanation.append(f"Exceptional guidance available in {', '.join(high_skills[:2])}.")
            else:
                explanation.append("Exceptional technical alignment with your stack.")
        if domain_score > 0.8:
            explanation.append(f"Domain expert in your interested field of {mentor.get('domain')}.")
        if exp_score > 0.5:
            explanation.append(f"Recognized industry expertise with {exp_years} years experience.")
            
        matches.append({
            "mentor_id": mentor['id'],
            "compatibility_score": round(total_score, 2),
            "skill_match_score": round(skill_score * 100, 2),
            "domain_match_score": round(domain_score * 100, 2),
            "experience_score": round(exp_score * 100, 2),
            "explanation": " ".join(explanation) if explanation else "A qualified mentor for your profile."
        })
        
    matches.sort(key=lambda x: x['compatibility_score'], reverse=True)
    return matches
