-- ScholarConnect - Comprehensive Dataset Seed
-- 30+ users across AI/ML, Systems, Security, Cloud, HCI, Data Engineering, Distributed Systems, Web

-- 1. Users (Faculty + PhD + Masters + Undergrad)
INSERT OR IGNORE INTO users (name, email, bio, academic_level, preferred_role, availability, is_admin) VALUES
('Dr. Aris Thorne', 'aris.thorne@univ.edu', 'Senior Professor focusing on Distributed Systems and High-Performance Computing.', 'Faculty', 'mentor', 'limited', 1),
('Dr. Elena Vance', 'elena.vance@univ.edu', 'Associate Professor in Cryptography and Blockchain Security.', 'Faculty', 'mentor', 'flexible', 1),
('Dr. Julian Marsh', 'julian.marsh@univ.edu', 'Professor of Artificial Intelligence. Researching RL and Neural Architecture Search.', 'Faculty', 'mentor', 'moderate', 1),
('Dr. Sarah Jenkins', 'sarah.j@univ.edu', 'Director of the HCI Lab. Focused on accessible interfaces.', 'Faculty', 'mentor', 'limited', 1),
('Dr. Raj Patel', 'raj.patel@univ.edu', 'Professor of Cloud Computing and Serverless Architectures.', 'Faculty', 'mentor', 'moderate', 0),
('Dr. Yuki Tanaka', 'yuki.tanaka@univ.edu', 'Associate Professor in Natural Language Processing and Information Retrieval.', 'Faculty', 'mentor', 'flexible', 0),
('Sarah Chen', 'sarah.chen@student.edu', 'Final year student interested in Scalable Web Systems and Cloud Native Architecture.', 'B.Tech 4th Year', 'fullstack', 'flexible', 0),
('Marcus Wright', 'marcus.wright@student.edu', 'M.Tech scholar exploring Applied ML in Healthcare.', 'M.Tech / Masters', 'ml', 'moderate', 0),
('Anya Petrov', 'anya.p@student.edu', 'PhD candidate specializing in DeFi and Smart Contract Security.', 'PhD Scholar', 'blockchain', 'limited', 0),
('Leo Kim', 'leo.kim@student.edu', '3rd year student focused on HCI and Frontend Engineering.', 'B.Tech 3rd Year', 'design', 'flexible', 0),
('Sofia Rossi', 'sofia.r@student.edu', 'Interested in SRE and Infrastructure as Code.', 'B.Tech 2nd Year', 'devops', 'flexible', 0),
('David Kumar', 'david.k@student.edu', 'Cybersecurity student focused on penetration testing.', 'B.Tech 3rd Year', 'backend', 'moderate', 0),
('Emily Zhao', 'emily.z@student.edu', 'Data Science enthusiast with expertise in large-scale data pipelines.', 'M.Tech / Masters', 'ml', 'flexible', 0),
('Aiden Clarke', 'aiden.c@student.edu', 'Full-stack developer with React and Node.js expertise. Building SaaS tools.', 'B.Tech 3rd Year', 'fullstack', 'flexible', 0),
('Priya Sharma', 'priya.s@student.edu', 'PhD student in Computer Vision and Medical Image Analysis.', 'PhD Scholar', 'ml', 'moderate', 0),
('Tomás Rivera', 'tomas.r@student.edu', 'Backend engineer passionate about microservices and event-driven architecture.', 'B.Tech 4th Year', 'backend', 'flexible', 0),
('Mei Lin', 'mei.lin@student.edu', 'Interested in graph neural networks and knowledge graphs.', 'M.Tech / Masters', 'ml', 'moderate', 0),
('Noah Fischer', 'noah.f@student.edu', 'DevOps and cloud infrastructure. AWS and Terraform certified.', 'B.Tech 4th Year', 'devops', 'flexible', 0),
('Zara Hassan', 'zara.h@student.edu', 'UI/UX designer with strong Figma and React skills.', 'B.Tech 2nd Year', 'design', 'flexible', 0),
('James Park', 'james.p@student.edu', 'Systems programmer interested in OS kernels and embedded systems.', 'B.Tech 3rd Year', 'backend', 'moderate', 0),
('Lena Volkov', 'lena.v@student.edu', 'Security researcher focused on binary exploitation and malware analysis.', 'M.Tech / Masters', 'backend', 'limited', 0),
('Carlos Mendez', 'carlos.m@student.edu', 'Mobile app developer specializing in React Native and Flutter.', 'B.Tech 2nd Year', 'frontend', 'flexible', 0),
('Olivia Wang', 'olivia.w@student.edu', 'Interested in data engineering with Spark and Kafka.', 'B.Tech 4th Year', 'backend', 'moderate', 0),
('Ravi Gupta', 'ravi.g@student.edu', 'PhD candidate in reinforcement learning and robotics.', 'PhD Scholar', 'ml', 'limited', 0),
('Hannah Brooks', 'hannah.b@student.edu', 'Blockchain developer working on L2 solutions and rollups.', 'M.Tech / Masters', 'blockchain', 'flexible', 0),
('Alex Turner', 'alex.t@student.edu', 'First year exploring web development and open source.', 'B.Tech 1st Year', 'frontend', 'flexible', 0),
('Isabella Cruz', 'isabella.c@student.edu', 'Interested in NLP and chatbot development with LLMs.', 'B.Tech 3rd Year', 'ml', 'flexible', 0);

-- 2. Skills
INSERT OR IGNORE INTO skills (name, category) VALUES
('Rust', 'language'), ('Go', 'language'), ('Solidity', 'language'),
('PyTorch', 'framework'), ('Kubernetes', 'tool'), ('Terraform', 'tool'),
('Distributed Systems', 'domain'), ('Cryptography', 'domain'), ('Reinforcement Learning', 'domain'),
('TensorFlow', 'framework'), ('AWS', 'tool'), ('Docker', 'tool'), ('GraphQL', 'language'),
('Flutter', 'framework'), ('Kafka', 'tool'), ('Spark', 'tool'),
('Figma', 'tool'), ('Next.js', 'framework'), ('Vue.js', 'framework'),
('Redis', 'tool'), ('MongoDB', 'tool'), ('C++', 'language'),
('Computer Vision', 'domain'), ('NLP', 'domain'), ('Embedded Systems', 'domain');

-- 3. Link skills to users
INSERT OR IGNORE INTO user_skills (user_id, skill_id, proficiency, source) VALUES
((SELECT id FROM users WHERE email='aris.thorne@univ.edu'), (SELECT id FROM skills WHERE name='Distributed Systems'), 'Advanced', 'manual'),
((SELECT id FROM users WHERE email='aris.thorne@univ.edu'), (SELECT id FROM skills WHERE name='Go'), 'Advanced', 'manual'),
((SELECT id FROM users WHERE email='aris.thorne@univ.edu'), (SELECT id FROM skills WHERE name='Kubernetes'), 'Intermediate', 'manual'),
((SELECT id FROM users WHERE email='elena.vance@univ.edu'), (SELECT id FROM skills WHERE name='Cryptography'), 'Advanced', 'manual'),
((SELECT id FROM users WHERE email='elena.vance@univ.edu'), (SELECT id FROM skills WHERE name='Solidity'), 'Advanced', 'manual'),
((SELECT id FROM users WHERE email='elena.vance@univ.edu'), (SELECT id FROM skills WHERE name='Rust'), 'Intermediate', 'manual'),
((SELECT id FROM users WHERE email='marcus.wright@student.edu'), (SELECT id FROM skills WHERE name='Python'), 'Advanced', 'manual'),
((SELECT id FROM users WHERE email='marcus.wright@student.edu'), (SELECT id FROM skills WHERE name='PyTorch'), 'Advanced', 'manual'),
((SELECT id FROM users WHERE email='marcus.wright@student.edu'), (SELECT id FROM skills WHERE name='TensorFlow'), 'Intermediate', 'manual'),
((SELECT id FROM users WHERE email='aiden.c@student.edu'), (SELECT id FROM skills WHERE name='React'), 'Advanced', 'manual'),
((SELECT id FROM users WHERE email='aiden.c@student.edu'), (SELECT id FROM skills WHERE name='Node.js'), 'Advanced', 'manual'),
((SELECT id FROM users WHERE email='aiden.c@student.edu'), (SELECT id FROM skills WHERE name='TypeScript'), 'Intermediate', 'manual'),
((SELECT id FROM users WHERE email='priya.s@student.edu'), (SELECT id FROM skills WHERE name='Python'), 'Advanced', 'manual'),
((SELECT id FROM users WHERE email='priya.s@student.edu'), (SELECT id FROM skills WHERE name='Computer Vision'), 'Advanced', 'manual'),
((SELECT id FROM users WHERE email='priya.s@student.edu'), (SELECT id FROM skills WHERE name='PyTorch'), 'Intermediate', 'manual'),
((SELECT id FROM users WHERE email='tomas.r@student.edu'), (SELECT id FROM skills WHERE name='Node.js'), 'Advanced', 'manual'),
((SELECT id FROM users WHERE email='tomas.r@student.edu'), (SELECT id FROM skills WHERE name='Docker'), 'Intermediate', 'manual'),
((SELECT id FROM users WHERE email='tomas.r@student.edu'), (SELECT id FROM skills WHERE name='Kafka'), 'Intermediate', 'manual'),
((SELECT id FROM users WHERE email='noah.f@student.edu'), (SELECT id FROM skills WHERE name='AWS'), 'Advanced', 'manual'),
((SELECT id FROM users WHERE email='noah.f@student.edu'), (SELECT id FROM skills WHERE name='Terraform'), 'Advanced', 'manual'),
((SELECT id FROM users WHERE email='noah.f@student.edu'), (SELECT id FROM skills WHERE name='Docker'), 'Intermediate', 'manual'),
((SELECT id FROM users WHERE email='zara.h@student.edu'), (SELECT id FROM skills WHERE name='React'), 'Advanced', 'manual'),
((SELECT id FROM users WHERE email='zara.h@student.edu'), (SELECT id FROM skills WHERE name='Figma'), 'Advanced', 'manual'),
((SELECT id FROM users WHERE email='mei.lin@student.edu'), (SELECT id FROM skills WHERE name='Python'), 'Advanced', 'manual'),
((SELECT id FROM users WHERE email='mei.lin@student.edu'), (SELECT id FROM skills WHERE name='NLP'), 'Intermediate', 'manual'),
((SELECT id FROM users WHERE email='olivia.w@student.edu'), (SELECT id FROM skills WHERE name='Spark'), 'Advanced', 'manual'),
((SELECT id FROM users WHERE email='olivia.w@student.edu'), (SELECT id FROM skills WHERE name='Kafka'), 'Intermediate', 'manual'),
((SELECT id FROM users WHERE email='ravi.g@student.edu'), (SELECT id FROM skills WHERE name='Reinforcement Learning'), 'Advanced', 'manual'),
((SELECT id FROM users WHERE email='ravi.g@student.edu'), (SELECT id FROM skills WHERE name='Python'), 'Advanced', 'manual'),
((SELECT id FROM users WHERE email='hannah.b@student.edu'), (SELECT id FROM skills WHERE name='Solidity'), 'Advanced', 'manual'),
((SELECT id FROM users WHERE email='hannah.b@student.edu'), (SELECT id FROM skills WHERE name='React'), 'Intermediate', 'manual'),
((SELECT id FROM users WHERE email='isabella.c@student.edu'), (SELECT id FROM skills WHERE name='Python'), 'Intermediate', 'manual'),
((SELECT id FROM users WHERE email='isabella.c@student.edu'), (SELECT id FROM skills WHERE name='NLP'), 'Intermediate', 'manual'),
((SELECT id FROM users WHERE email='carlos.m@student.edu'), (SELECT id FROM skills WHERE name='Flutter'), 'Advanced', 'manual'),
((SELECT id FROM users WHERE email='carlos.m@student.edu'), (SELECT id FROM skills WHERE name='React'), 'Intermediate', 'manual'),
((SELECT id FROM users WHERE email='james.p@student.edu'), (SELECT id FROM skills WHERE name='C++'), 'Advanced', 'manual'),
((SELECT id FROM users WHERE email='james.p@student.edu'), (SELECT id FROM skills WHERE name='Rust'), 'Intermediate', 'manual'),
((SELECT id FROM users WHERE email='lena.v@student.edu'), (SELECT id FROM skills WHERE name='Python'), 'Advanced', 'manual'),
((SELECT id FROM users WHERE email='lena.v@student.edu'), (SELECT id FROM skills WHERE name='C++'), 'Intermediate', 'manual');

-- 4. Register mentors
INSERT OR IGNORE INTO mentors (user_id, domain, experience_years, max_mentees, bio, is_approved) VALUES
((SELECT id FROM users WHERE email='aris.thorne@univ.edu'), 'Systems & Cloud', 15, 5, 'Guidance on distributed systems and cloud infrastructure.', 1),
((SELECT id FROM users WHERE email='elena.vance@univ.edu'), 'Blockchain & Security', 12, 3, 'Cryptography, smart contracts, and decentralized security.', 1),
((SELECT id FROM users WHERE email='julian.marsh@univ.edu'), 'Artificial Intelligence', 18, 4, 'RL and deep learning research.', 1),
((SELECT id FROM users WHERE email='sarah.j@univ.edu'), 'HCI & UX', 10, 4, 'User-centered design and accessible technology.', 1),
((SELECT id FROM users WHERE email='raj.patel@univ.edu'), 'Cloud Computing', 8, 3, 'Serverless, microservices, and AWS architecture.', 1),
((SELECT id FROM users WHERE email='yuki.tanaka@univ.edu'), 'NLP & Information Retrieval', 11, 3, 'Language models and search systems.', 1);

-- 5. Mentor skills
INSERT OR IGNORE INTO mentor_skills (mentor_id, skill_id, proficiency) VALUES
((SELECT id FROM mentors WHERE user_id=(SELECT id FROM users WHERE email='aris.thorne@univ.edu')), (SELECT id FROM skills WHERE name='Distributed Systems'), 5),
((SELECT id FROM mentors WHERE user_id=(SELECT id FROM users WHERE email='aris.thorne@univ.edu')), (SELECT id FROM skills WHERE name='Go'), 4),
((SELECT id FROM mentors WHERE user_id=(SELECT id FROM users WHERE email='aris.thorne@univ.edu')), (SELECT id FROM skills WHERE name='Kubernetes'), 4),
((SELECT id FROM mentors WHERE user_id=(SELECT id FROM users WHERE email='elena.vance@univ.edu')), (SELECT id FROM skills WHERE name='Cryptography'), 5),
((SELECT id FROM mentors WHERE user_id=(SELECT id FROM users WHERE email='elena.vance@univ.edu')), (SELECT id FROM skills WHERE name='Solidity'), 5),
((SELECT id FROM mentors WHERE user_id=(SELECT id FROM users WHERE email='elena.vance@univ.edu')), (SELECT id FROM skills WHERE name='Rust'), 4),
((SELECT id FROM mentors WHERE user_id=(SELECT id FROM users WHERE email='julian.marsh@univ.edu')), (SELECT id FROM skills WHERE name='Python'), 5),
((SELECT id FROM mentors WHERE user_id=(SELECT id FROM users WHERE email='julian.marsh@univ.edu')), (SELECT id FROM skills WHERE name='PyTorch'), 5),
((SELECT id FROM mentors WHERE user_id=(SELECT id FROM users WHERE email='julian.marsh@univ.edu')), (SELECT id FROM skills WHERE name='Reinforcement Learning'), 5),
((SELECT id FROM mentors WHERE user_id=(SELECT id FROM users WHERE email='sarah.j@univ.edu')), (SELECT id FROM skills WHERE name='React'), 4),
((SELECT id FROM mentors WHERE user_id=(SELECT id FROM users WHERE email='sarah.j@univ.edu')), (SELECT id FROM skills WHERE name='Figma'), 5),
((SELECT id FROM mentors WHERE user_id=(SELECT id FROM users WHERE email='raj.patel@univ.edu')), (SELECT id FROM skills WHERE name='AWS'), 5),
((SELECT id FROM mentors WHERE user_id=(SELECT id FROM users WHERE email='raj.patel@univ.edu')), (SELECT id FROM skills WHERE name='Docker'), 4),
((SELECT id FROM mentors WHERE user_id=(SELECT id FROM users WHERE email='raj.patel@univ.edu')), (SELECT id FROM skills WHERE name='Kubernetes'), 5),
((SELECT id FROM mentors WHERE user_id=(SELECT id FROM users WHERE email='yuki.tanaka@univ.edu')), (SELECT id FROM skills WHERE name='Python'), 5),
((SELECT id FROM mentors WHERE user_id=(SELECT id FROM users WHERE email='yuki.tanaka@univ.edu')), (SELECT id FROM skills WHERE name='NLP'), 5),
((SELECT id FROM mentors WHERE user_id=(SELECT id FROM users WHERE email='yuki.tanaka@univ.edu')), (SELECT id FROM skills WHERE name='TensorFlow'), 4);

-- 6. Projects Catalog
INSERT OR IGNORE INTO projects (title, description, difficulty_level, domain, tech_stack, is_active) VALUES
('Privacy-Preserving Federated Learning', 'Collaborative ML training without sharing raw data using secure multi-party computation.', 5, 'AI/ML', '["Python", "PyTorch", "MPC"]', 1),
('High-Throughput Distributed KV Store', 'A replicated, strongly consistent key-value store using Raft consensus.', 4, 'Systems', '["Go", "gRPC", "Docker"]', 1),
('DeFi Yield Optimizer', 'Automated liquidity management and yield farming on Ethereum.', 4, 'Blockchain', '["Solidity", "Hardhat", "React"]', 1),
('Cloud-Native Observability Dashboard', 'Real-time monitoring for Kubernetes clusters with Prometheus and Grafana.', 3, 'Cloud', '["Next.js", "Go", "Kubernetes"]', 1),
('Accessible Smart Home Hub', 'Privacy-first IoT management with voice control for accessibility.', 2, 'HCI', '["Node.js", "React Native", "MQTT"]', 1),
('Real-time Traffic Analysis with Edge AI', 'Urban traffic patterns using edge devices and distributed neural networks.', 4, 'AI/ML', '["Python", "TensorFlow", "C++"]', 1),
('Zero-Knowledge Identity Protocol', 'Decentralized identity system on ZK-SNARKs for private authentication.', 5, 'Cybersecurity', '["Rust", "Circom", "Web3.js"]', 1),
('Distributed Graph Database', 'Graph engine partitioning multi-billion node graphs across clusters.', 5, 'Systems', '["Rust", "Tokio", "Raft"]', 1),
('Generative UI for Research Portals', 'Automating dashboard layouts using small language models.', 3, 'HCI', '["React", "OpenAI", "Tailwind"]', 1),
('Real-Time Collaborative Code Editor', 'Browser-based code editor with CRDT-based real-time sync.', 4, 'Web', '["TypeScript", "WebSocket", "React"]', 1),
('Medical Image Segmentation Pipeline', 'Automated organ segmentation from CT/MRI scans using U-Net.', 4, 'AI/ML', '["Python", "PyTorch", "OpenCV"]', 1),
('Serverless Data Lake on AWS', 'Event-driven data ingestion and query engine using Lambda and Athena.', 3, 'Cloud', '["Python", "AWS", "Terraform"]', 1);
