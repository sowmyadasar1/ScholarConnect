"""
Teammate Matching Logic.
Match users based on complementary skills (not identical) and preferred roles.
"""

def match_teammates(user_profile, candidates):
    suggestions = []
    
    user_skills = {s['name'].lower() for s in user_profile.get('skills', [])}
    user_role = user_profile.get('preferred_role', '').lower()
    user_interests = [i.lower() for i in user_profile.get('interests', [])]
    user_availability = user_profile.get('availability', '').lower()
    
    for cand in candidates:
        cand_skill_objs = cand.get('skills', [])
        cand_skills = {s['name'].lower() for s in cand_skill_objs}
        cand_role = cand.get('preferred_role', '').lower()
        cand_interests = [i.lower() for i in cand.get('interests', [])]
        cand_level = cand.get('academic_level', 'B.Tech 1st Year')
        
        # 1. Skill Overlap (35%)
        overlap_skills = cand_skills.intersection(user_skills)
        overlap_score = (len(overlap_skills) / max(len(user_skills), 1)) if user_skills else 0.5
        
        # 2. Complementary Skills (25%)
        # Skills candidate has that user doesn't
        unique_to_cand = cand_skills - user_skills
        complementary_score = (len(unique_to_cand) / max(len(cand_skills), 1)) if cand_skills else 0.4
        
        # 3. Role Fit (20%)
        # Different roles complement each other
        role_score = 0.5
        if user_role and cand_role and user_role != cand_role:
            role_score = 1.0
        elif not user_role or not cand_role:
            role_score = 0.7
            
        # 4. Shared Interests (10%)
        shared_interests = set(user_interests).intersection(set(cand_interests))
        interest_score = (len(shared_interests) / max(len(user_interests), 1)) if user_interests else 0.5
        
        # 5. Experience/Academic Level Compatibility (10%)
        level_map = {
            'B.Tech 1st Year': 1, 'B.Tech 2nd Year': 2, 'B.Tech 3rd Year': 3, 
            'B.Tech 4th Year': 4, 'M.Tech / Masters': 5, 'PhD Scholar': 6, 'Faculty': 7
        }
        user_level_val = level_map.get(user_profile.get('academic_level', 'B.Tech 1st Year'), 2)
        cand_level_val = level_map.get(cand_level, 2)
        exp_score = max(0, 1 - (abs(user_level_val - cand_level_val) / 5.0))

        # Final Formula: 35% Overlap + 25% Complementary + 20% Role + 10% Interest + 10% Experience
        total_score = round(((overlap_score * 0.35) + (complementary_score * 0.25) + (role_score * 0.20) + (interest_score * 0.10) + (exp_score * 0.10)) * 100, 2)
        
        # Build Explanation
        reasons = []
        if overlap_skills:
            reasons.append(f"shared foundation in {list(overlap_skills)[0].title()}")
        if unique_to_cand:
            reasons.append(f"brings expertise in {list(unique_to_cand)[0].title()} to your stack")
        if role_score > 0.8:
            reasons.append(f"balances your {user_role} experience with {cand_role} skills")
        else:
            reasons.append("synergistic team profile")
            
        final_explanation = f"{total_score}% Match — " + " and ".join(reasons[:2]) + "."

        suggestions.append({
            "suggested_user_id": cand['id'],
            "name": cand.get('name', 'Scholar'),
            "avatar_url": cand.get('avatar_url', ''),
            "preferred_role": cand.get('preferred_role', 'Researcher'),
            "academic_level": cand_level,
            "compatibility_score": total_score,
            "expertise": ", ".join([s['name'] for s in cand_skill_objs[:3]]),
            "complementary_skills": list(unique_to_cand)[:3],
            "overlap_skills": list(overlap_skills)[:3],
            "explanation": final_explanation
        })
        
    suggestions.sort(key=lambda x: x['compatibility_score'], reverse=True)
    return suggestions
