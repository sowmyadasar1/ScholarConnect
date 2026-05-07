-- Final Demo Setup for ScholarConnect
-- Ensures Sowmya Dasari has a rich network and mentors have diverse skills

-- 1. Ensure Sowmya Dasari exists
INSERT OR IGNORE INTO users (name, email, bio, academic_level, preferred_role, availability)
VALUES ('Sowmya Dasari', 'sowmya@github.com', 'Final year student passionate about scalable web systems and AI integration.', 'B.Tech 4th Year', 'Fullstack Developer', 'flexible');

-- 2. Add diverse skills to mentors (fixing the "General Academic Mentorship" issue)
-- Dr. Aris Thorne
INSERT OR IGNORE INTO mentor_skills (mentor_id, skill_id, proficiency)
SELECT m.id, s.id, 5 FROM mentors m, skills s WHERE m.user_id = (SELECT id FROM users WHERE name = 'Dr. Aris Thorne') AND s.name = 'Distributed Systems';
INSERT OR IGNORE INTO mentor_skills (mentor_id, skill_id, proficiency)
SELECT m.id, s.id, 4 FROM mentors m, skills s WHERE m.user_id = (SELECT id FROM users WHERE name = 'Dr. Aris Thorne') AND s.name = 'Go';

-- Dr. Elena Vance
INSERT OR IGNORE INTO mentor_skills (mentor_id, skill_id, proficiency)
SELECT m.id, s.id, 5 FROM mentors m, skills s WHERE m.user_id = (SELECT id FROM users WHERE name = 'Dr. Elena Vance') AND s.name = 'Cryptography';
INSERT OR IGNORE INTO mentor_skills (mentor_id, skill_id, proficiency)
SELECT m.id, s.id, 5 FROM mentors m, skills s WHERE m.user_id = (SELECT id FROM users WHERE name = 'Dr. Elena Vance') AND s.name = 'Solidity';

-- Dr. Julian Marsh
INSERT OR IGNORE INTO mentor_skills (mentor_id, skill_id, proficiency)
SELECT m.id, s.id, 5 FROM mentors m, skills s WHERE m.user_id = (SELECT id FROM users WHERE name = 'Dr. Julian Marsh') AND s.name = 'Python';
INSERT OR IGNORE INTO mentor_skills (mentor_id, skill_id, proficiency)
SELECT m.id, s.id, 5 FROM mentors m, skills s WHERE m.user_id = (SELECT id FROM users WHERE name = 'Dr. Julian Marsh') AND s.name = 'Reinforcement Learning';

-- Dr. Kavita Rao
INSERT OR IGNORE INTO mentor_skills (mentor_id, skill_id, proficiency)
SELECT m.id, s.id, 5 FROM mentors m, skills s WHERE m.user_id = (SELECT id FROM users WHERE name = 'Dr. Kavita Rao') AND s.name = 'Computer Vision';
INSERT OR IGNORE INTO mentor_skills (mentor_id, skill_id, proficiency)
SELECT m.id, s.id, 4 FROM mentors m, skills s WHERE m.user_id = (SELECT id FROM users WHERE name = 'Dr. Kavita Rao') AND s.name = 'PyTorch';

-- 3. Populate Sowmya's Network (Connections)
-- Collaborators
INSERT OR IGNORE INTO connections (user_id_1, user_id_2, type, status)
SELECT MIN(u1.id, u2.id), MAX(u1.id, u2.id), 'teammate', 'active'
FROM users u1, users u2 WHERE u1.name = 'Sowmya Dasari' AND u2.name IN ('Arjun Reddy', 'Deepak Verma', 'Isha Gupta', 'Karan Malhotra', 'Meera Nair');

-- Mentors
INSERT OR IGNORE INTO connections (user_id_1, user_id_2, type, status)
SELECT MIN(u1.id, u2.id), MAX(u1.id, u2.id), 'mentor', 'active'
FROM users u1, users u2 WHERE u1.name = 'Sowmya Dasari' AND u2.name IN ('Dr. Aris Thorne', 'Dr. Elena Vance', 'Dr. Kavita Rao');

-- 4. Add Collaboration History (dummy data for the History tab)
-- We use a connection with status 'completed' (if supported) or just more active ones
UPDATE connections SET status = 'completed' WHERE user_id_1 = (SELECT id FROM users WHERE name = 'Sowmya Dasari') AND user_id_2 = (SELECT id FROM users WHERE name = 'Arjun Reddy');

-- 5. Add more variety to teammate profiles (Complementary Skills)
UPDATE users SET preferred_role = 'AI Engineer' WHERE name = 'Deepak Verma';
INSERT OR IGNORE INTO user_skills (user_id, skill_id, proficiency) 
SELECT u.id, s.id, 'Advanced' FROM users u, skills s WHERE u.name = 'Deepak Verma' AND s.name IN ('PyTorch', 'TensorFlow');

UPDATE users SET preferred_role = 'Security Specialist' WHERE name = 'Karan Malhotra';
INSERT OR IGNORE INTO user_skills (user_id, skill_id, proficiency) 
SELECT u.id, s.id, 'Advanced' FROM users u, skills s WHERE u.name = 'Karan Malhotra' AND s.name IN ('Solidity', 'Cryptography');

UPDATE users SET preferred_role = 'UI/UX Lead' WHERE name = 'Tanvi Hegde';
INSERT OR IGNORE INTO user_skills (user_id, skill_id, proficiency) 
SELECT u.id, s.id, 'Advanced' FROM users u, skills s WHERE u.name = 'Tanvi Hegde' AND s.name IN ('Figma', 'React');
