"""
Teammate Matching Logic.
Match users based on complementary skills (not identical) and preferred roles.
"""

def match_teammates(user_profile, candidates):
    suggestions = []
    
    user_skills = {s['name'].lower() for s in user_profile.get('skills', [])}
    user_role = user_profile.get('preferred_role', '')
    user_interests = [i.lower() for i in user_profile.get('interests', [])]
    
    for cand in candidates:
        cand_skill_objs = cand.get('skills', [])
        cand_skills = {s['name'].lower() for s in cand_skill_objs}
        cand_role = cand.get('preferred_role', 'Researcher')
        cand_interests = [i.lower() for i in cand.get('interests', [])]
        
        # 1. Complementarity: We want different skills that are useful together
        unique_to_cand = cand_skills - user_skills
        unique_list = [s['name'] for s in cand_skill_objs if s['name'].lower() in unique_to_cand]
        
        if len(cand_skills) > 0:
            comp_score = min(1.0, len(unique_to_cand) / float(len(cand_skills)))
        else:
            comp_score = 0.0
            
        # 2. Role Fit
        if user_role and cand_role and user_role != cand_role:
            role_score = 1.0
        else:
            role_score = 0.5
            
        # 3. Domain/Interest Compatibility
        domain_score = 0.5
        if user_interests and cand_interests:
            overlap = set(user_interests).intersection(set(cand_interests))
            if overlap:
                domain_score = 1.0 + (len(overlap) * 0.1)
                domain_score = min(1.0, domain_score)
            
        total_score = (comp_score * 0.5) + (role_score * 0.3) + (domain_score * 0.2)
        total_score *= 100
        
        explanation = []
        if role_score == 1.0:
            if cand_role == 'Frontend Developer' and 'Backend' in user_role:
                explanation.append(f"Ideal frontend partner to bring your backend systems to life.")
            elif cand_role == 'Data Scientist' and 'Developer' in user_role:
                explanation.append(f"Provides the analytical depth needed for your implementation.")
            elif 'Designer' in cand_role:
                explanation.append(f"Can transform your technical logic into a beautiful user experience.")
            else:
                explanation.append(f"A perfect {cand_role} to balance your {user_role} expertise.")
        
        if unique_list:
            comp_skills_str = ", ".join(unique_list[:2])
            if comp_score > 0.8:
                explanation.append(f"Brings a completely fresh tech stack including {comp_skills_str}.")
            else:
                explanation.append(f"Can contribute expertise in {comp_skills_str} which complements your profile.")
                
        if domain_score > 0.8:
            explanation.append("Shares similar research interests and domain focus.")
            
        suggestions.append({
            "suggested_user_id": cand['id'],
            "name": cand.get('name', 'Scholar'),
            "avatar_url": cand.get('avatar_url', ''),
            "preferred_role": cand_role,
            "academic_level": cand.get('academic_level', 'Student'),
            "compatibility_score": round(total_score, 2),
            "expertise": ", ".join([s['name'] for s in cand_skill_objs[:3]]),
            "complementary_skills": unique_list[:3],
            "explanation": " ".join(explanation) if explanation else f"Strong potential collaborator with experience in {cand_role}."
        })
        
    suggestions.sort(key=lambda x: x['compatibility_score'], reverse=True)
    return suggestions
