-- ScholarConnect — Advanced Research Projects Seed
-- 15 capstone-level projects with proper difficulty, domains, and tech stacks

INSERT OR IGNORE INTO projects (title, description, difficulty_level, academic_level_min, domain, tech_stack, estimated_weeks, is_trending, is_beginner_friendly) VALUES

-- Advanced (4-5)
('Federated Learning Healthcare Platform',
 'Build a privacy-preserving ML system where hospitals collaboratively train disease prediction models without sharing patient data. Implements federated averaging, differential privacy, and secure aggregation protocols.',
 5, 'M.Tech 1st Year', 'Machine Learning',
 '["Python","TensorFlow","PySyft","Flask","React","PostgreSQL","Docker"]',
 8, 1, 0),

('Privacy-Preserving AI Assistant',
 'Design an AI chatbot that runs inference locally on-device using quantized LLMs. Implements RAG (Retrieval-Augmented Generation) with a local vector database for document Q&A without sending data to cloud.',
 5, 'M.Tech 1st Year', 'Artificial Intelligence',
 '["Python","LangChain","Ollama","FAISS","FastAPI","React","SQLite"]',
 8, 1, 0),

('Multi-Agent LLM Workflow System',
 'Create an orchestration platform where multiple AI agents collaborate to solve complex tasks. Agents specialize in research, coding, testing, and documentation. Includes agent communication protocol and task decomposition.',
 5, 'M.Tech 1st Year', 'Artificial Intelligence',
 '["Python","LangChain","OpenAI","Redis","FastAPI","React","WebSocket"]',
 8, 1, 0),

('Blockchain Supply Chain Traceability',
 'Implement a decentralized supply chain tracking system using smart contracts. Each product gets an immutable history from manufacturer to consumer with QR-code verification and real-time tracking dashboard.',
 4, 'B.Tech 3rd Year', 'Blockchain',
 '["Solidity","Hardhat","React","Node.js","Express","MongoDB","IPFS"]',
 7, 1, 0),

('Autonomous Research Paper Recommender',
 'Build a scholarly recommendation engine that analyzes paper abstracts using transformer embeddings, citation graphs, and collaborative filtering. Includes a reading list manager and trend analysis dashboard.',
 4, 'B.Tech 3rd Year', 'Machine Learning',
 '["Python","PyTorch","Sentence-Transformers","Neo4j","FastAPI","React","PostgreSQL"]',
 7, 0, 0),

('Distributed Systems Failure Simulator',
 'Create a chaos engineering tool that simulates network partitions, node failures, and latency injection in distributed systems. Includes a visual topology editor and real-time monitoring dashboard.',
 5, 'M.Tech 1st Year', 'Distributed Systems',
 '["Go","gRPC","Docker","Kubernetes","React","D3.js","Prometheus"]',
 8, 0, 0),

('Secure Zero-Knowledge Voting Platform',
 'Implement an electronic voting system using zero-knowledge proofs (ZKPs) to ensure voter privacy while maintaining vote verifiability. Includes voter registration, ballot casting, and transparent tallying.',
 5, 'M.Tech 1st Year', 'Cryptography',
 '["Rust","circom","snarkjs","Node.js","React","PostgreSQL","Docker"]',
 8, 0, 0),

('Real-Time Anomaly Detection Pipeline',
 'Build a streaming data pipeline that detects anomalies in IoT sensor data using isolation forests and autoencoders. Includes real-time dashboard with alerting and historical trend analysis.',
 4, 'B.Tech 3rd Year', 'Data Engineering',
 '["Python","Apache Kafka","PySpark","TensorFlow","Grafana","InfluxDB","Docker"]',
 7, 1, 0),

('Edge Computing IoT Framework',
 'Design a framework for deploying ML models on edge devices (Raspberry Pi / Jetson Nano). Includes model compression, OTA updates, device fleet management, and centralized monitoring.',
 4, 'B.Tech 4th Year', 'IoT',
 '["Python","TensorFlow Lite","MQTT","Node.js","React","TimescaleDB","Docker"]',
 7, 0, 0),

-- Intermediate (2-3)
('AI-Powered Code Review Assistant',
 'Build a tool that automatically reviews pull requests, detects code smells, suggests improvements, and checks for security vulnerabilities. Integrates with GitHub webhooks for automated PR comments.',
 3, 'B.Tech 2nd Year', 'Software Engineering',
 '["Python","FastAPI","Tree-sitter","React","Node.js","PostgreSQL","GitHub API"]',
 6, 1, 0),

('Smart Campus Navigation System',
 'Create an indoor navigation app for university campuses using BLE beacons and floor plan mapping. Features include class schedule integration, shortest path finding, and accessibility routing.',
 3, 'B.Tech 2nd Year', 'Mobile Development',
 '["React Native","Node.js","Express","MongoDB","Mapbox","BLE","Firebase"]',
 6, 0, 1),

('Collaborative Whiteboard Platform',
 'Real-time collaborative drawing and diagramming tool with infinite canvas, shape recognition, sticky notes, and video call integration. Supports multiple concurrent users with conflict-free editing.',
 3, 'B.Tech 2nd Year', 'Web Development',
 '["React","Canvas API","Socket.IO","Node.js","Redis","PostgreSQL","WebRTC"]',
 6, 0, 0),

('Personal Finance Tracker with ML Insights',
 'Build a finance management app that categorizes expenses using NLP, predicts spending patterns, and provides personalized budgeting recommendations. Includes bank statement CSV/PDF parsing.',
 2, 'B.Tech 2nd Year', 'Full Stack',
 '["React","Node.js","Express","SQLite","Python","scikit-learn","Chart.js"]',
 6, 0, 1),

-- Beginner (1-2)
('Student Portfolio Builder',
 'Create a platform where students can build professional portfolios by importing GitHub projects, adding descriptions, and generating a shareable portfolio website. Includes resume PDF generation.',
 1, 'B.Tech 1st Year', 'Web Development',
 '["React","Node.js","Express","SQLite","Puppeteer","GitHub API"]',
 5, 0, 1),

('Campus Event Management System',
 'Build a full-stack event platform for college fests with event creation, registration, QR check-in, team formation, and real-time announcements. Includes an admin dashboard for organizers.',
 2, 'B.Tech 1st Year', 'Full Stack',
 '["React","Node.js","Express","PostgreSQL","Socket.IO","QRCode"]',
 6, 0, 1);
