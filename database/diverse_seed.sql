-- Diversify users and fix sowmyadasari network
-- 1. Update academic levels for variety
UPDATE users SET academic_level = 'B.Tech 3rd Year' WHERE email LIKE '%example.com' AND id % 3 = 0;
UPDATE users SET academic_level = 'M.Tech / Masters' WHERE email LIKE '%example.com' AND id % 3 = 1;
UPDATE users SET academic_level = 'PhD Scholar' WHERE email LIKE '%example.com' AND id % 3 = 2;
UPDATE users SET academic_level = 'B.Tech 4th Year' WHERE email = 'arjun.desai@example.com';

-- 2. Update roles for variety
UPDATE users SET preferred_role = 'Frontend Lead' WHERE id % 4 = 0;
UPDATE users SET preferred_role = 'Backend Architect' WHERE id % 4 = 1;
UPDATE users SET preferred_role = 'ML Researcher' WHERE id % 4 = 2;
UPDATE users SET preferred_role = 'UI/UX Designer' WHERE id % 4 = 3;

-- 3. Ensure Sowmya Dasari exists and has a network
INSERT OR IGNORE INTO users (email, name, academic_level, preferred_role) 
VALUES ('sowmya@github.com', 'Sowmya Dasari', 'B.Tech 4th Year', 'Fullstack Developer');

-- Connect Sowmya with Arjun and some others (ensuring user_id_1 < user_id_2)
INSERT OR IGNORE INTO connections (user_id_1, user_id_2, type, status)
SELECT MIN(u1.id, u2.id), MAX(u1.id, u2.id), 'teammate', 'active'
FROM users u1, users u2
WHERE u1.name LIKE '%Sowmya%' AND u2.name = 'Arjun Desai';

INSERT OR IGNORE INTO connections (user_id_1, user_id_2, type, status)
SELECT MIN(u1.id, u2.id), MAX(u1.id, u2.id), 'mentor', 'active'
FROM users u1, users u2
WHERE u1.name LIKE '%Sowmya%' AND u2.name = 'Priya Sharma';

INSERT OR IGNORE INTO connections (user_id_1, user_id_2, type, status)
SELECT MIN(u1.id, u2.id), MAX(u1.id, u2.id), 'teammate', 'active'
FROM users u1, users u2
WHERE u1.name LIKE '%Sowmya%' AND u2.name = 'Rohan Gupta';

-- 4. Add more projects for variety in collaboration_projects
INSERT OR IGNORE INTO collaboration_projects (owner_id, repo_name, description, topics, is_open_for_collab)
SELECT id, 'Decentralized Identity', 'Self-sovereign identity using Hyperledger Fabric.', 'blockchain,fabric,go', 1
FROM users WHERE name = 'Rohan Gupta';

INSERT OR IGNORE INTO collaboration_projects (owner_id, repo_name, description, topics, is_open_for_collab)
SELECT id, 'Vernacular LLM', 'Fine-tuning Llama-3 on Indic languages.', 'nlp,python,pytorch', 1
FROM users WHERE name = 'Priya Sharma';

INSERT OR IGNORE INTO collaboration_projects (owner_id, repo_name, description, topics, is_open_for_collab)
SELECT id, 'Sustainable Logistics', 'Optimizing carbon footprint in supply chains.', 'iot,python,data-science', 1
FROM users WHERE name = 'Neha Verma';
