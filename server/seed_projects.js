const { pool } = require('./config/db');

const projects = [
  {
    title: "AI-Powered Academic Search Engine",
    description: "A semantic search engine for academic papers using NLP and vector embeddings to help researchers find relevant citations faster.",
    difficulty_level: 4, academic_level_min: "postgraduate", domain: "Computer Science",
    is_trending: 1, is_beginner_friendly: 0, estimated_weeks: 10,
    skills: ["Python", "PyTorch", "ElasticSearch", "React"]
  },
  {
    title: "Blockchain for Credential Verification",
    description: "Developing a decentralized platform for universities to issue and verify academic certificates using Ethereum smart contracts.",
    difficulty_level: 3, academic_level_min: "undergraduate", domain: "Cybersecurity",
    is_trending: 1, is_beginner_friendly: 1, estimated_weeks: 8,
    skills: ["Solidity", "Node.js", "Web3.js", "PostgreSQL"]
  },
  {
    title: "Autonomous Campus Delivery Robot",
    description: "Robotics project focusing on SLAM for small-scale autonomous navigation in campus environments.",
    difficulty_level: 5, academic_level_min: "postgraduate", domain: "Robotics",
    is_trending: 1, is_beginner_friendly: 0, estimated_weeks: 16,
    skills: ["ROS", "C++", "Python", "Raspberry Pi"]
  },
  {
    title: "EcoTrack: Campus Sustainability Dashboard",
    description: "IoT and web platform to monitor and visualize energy consumption and waste management efficiency across campus buildings.",
    difficulty_level: 2, academic_level_min: "undergraduate", domain: "Sustainability",
    is_trending: 0, is_beginner_friendly: 1, estimated_weeks: 6,
    skills: ["React", "MQTT", "Node.js", "InfluxDB"]
  },
  {
    title: "Quantum Algorithm Simulator",
    description: "An educational tool to visualize quantum gate operations and simulate basic algorithms like Shor's or Grover's.",
    difficulty_level: 5, academic_level_min: "phd", domain: "Physics",
    is_trending: 0, is_beginner_friendly: 0, estimated_weeks: 12,
    skills: ["Python", "Qiskit", "React", "D3.js"]
  },
  {
    title: "Smart Traffic Management System",
    description: "An AI-driven traffic signal optimization system using computer vision to reduce urban congestion and improve emergency vehicle routing.",
    difficulty_level: 4, academic_level_min: "undergraduate", domain: "Computer Science",
    is_trending: 1, is_beginner_friendly: 0, estimated_weeks: 12,
    skills: ["Python", "TensorFlow", "OpenCV", "React"]
  },
  {
    title: "Multilingual Chatbot for Student Services",
    description: "Build an NLP-powered chatbot that helps university students with admissions, course registration, and campus navigation in multiple Indian languages.",
    difficulty_level: 3, academic_level_min: "undergraduate", domain: "Natural Language Processing",
    is_trending: 1, is_beginner_friendly: 1, estimated_weeks: 8,
    skills: ["Python", "Transformers", "FastAPI", "React"]
  },
  {
    title: "Real-Time Collaborative Code Editor",
    description: "A Google Docs-like code editor with real-time collaboration, syntax highlighting, and integrated terminal for pair programming sessions.",
    difficulty_level: 4, academic_level_min: "undergraduate", domain: "Developer Tools",
    is_trending: 1, is_beginner_friendly: 0, estimated_weeks: 10,
    skills: ["TypeScript", "WebSockets", "React", "Node.js"]
  },
  {
    title: "Precision Agriculture Drone Platform",
    description: "Design a drone-based system for monitoring crop health using multispectral imaging and machine learning classification.",
    difficulty_level: 5, academic_level_min: "postgraduate", domain: "Agriculture Tech",
    is_trending: 0, is_beginner_friendly: 0, estimated_weeks: 14,
    skills: ["Python", "TensorFlow", "ROS", "OpenCV"]
  },
  {
    title: "Mental Health Companion App",
    description: "A mobile application providing mood tracking, guided meditation, journaling, and anonymous peer support for college students.",
    difficulty_level: 2, academic_level_min: "undergraduate", domain: "Healthcare",
    is_trending: 1, is_beginner_friendly: 1, estimated_weeks: 6,
    skills: ["React Native", "Node.js", "MongoDB", "Firebase"]
  },
  {
    title: "Open Source Learning Management System",
    description: "Build a modern, accessible LMS with live classes, auto-grading, plagiarism detection, and analytics dashboards for educators.",
    difficulty_level: 3, academic_level_min: "undergraduate", domain: "EdTech",
    is_trending: 1, is_beginner_friendly: 1, estimated_weeks: 10,
    skills: ["React", "Node.js", "PostgreSQL", "Docker"]
  },
  {
    title: "Federated Learning for Privacy-Preserving ML",
    description: "Implement a federated learning framework that trains models across distributed hospital datasets without sharing sensitive patient data.",
    difficulty_level: 5, academic_level_min: "phd", domain: "Machine Learning",
    is_trending: 1, is_beginner_friendly: 0, estimated_weeks: 16,
    skills: ["Python", "PyTorch", "gRPC", "Docker"]
  },
  {
    title: "AR Campus Navigator",
    description: "An augmented reality mobile app that overlays directions, building info, and event details onto the real-world campus view.",
    difficulty_level: 3, academic_level_min: "undergraduate", domain: "Mobile Development",
    is_trending: 0, is_beginner_friendly: 1, estimated_weeks: 8,
    skills: ["Unity", "ARCore", "C#", "Firebase"]
  },
  {
    title: "Automated Research Paper Summarizer",
    description: "A tool that uses large language models to generate concise summaries, key findings, and citation graphs from uploaded research papers.",
    difficulty_level: 3, academic_level_min: "undergraduate", domain: "Natural Language Processing",
    is_trending: 1, is_beginner_friendly: 0, estimated_weeks: 8,
    skills: ["Python", "Transformers", "FastAPI", "React"]
  },
  {
    title: "Decentralized Voting System",
    description: "A blockchain-based e-voting platform for student elections with verifiable, anonymous, and tamper-proof ballots.",
    difficulty_level: 4, academic_level_min: "undergraduate", domain: "Web3",
    is_trending: 0, is_beginner_friendly: 0, estimated_weeks: 10,
    skills: ["Solidity", "React", "Hardhat", "Node.js"]
  },
  {
    title: "Personal Finance Tracker for Students",
    description: "A mobile-first web app that helps students track expenses, set savings goals, split bills, and get spending insights with charts.",
    difficulty_level: 2, academic_level_min: "undergraduate", domain: "FinTech",
    is_trending: 0, is_beginner_friendly: 1, estimated_weeks: 6,
    skills: ["React", "Node.js", "SQLite", "Chart.js"]
  },
  {
    title: "Gesture-Controlled Music Synthesizer",
    description: "Use hand-tracking via MediaPipe to control a web-based music synthesizer, enabling touchless musical performance and composition.",
    difficulty_level: 3, academic_level_min: "undergraduate", domain: "Human-Computer Interaction",
    is_trending: 0, is_beginner_friendly: 1, estimated_weeks: 6,
    skills: ["JavaScript", "MediaPipe", "Web Audio API", "React"]
  },
  {
    title: "Distributed File Storage System",
    description: "Build a peer-to-peer distributed file storage system with erasure coding, deduplication, and end-to-end encryption.",
    difficulty_level: 5, academic_level_min: "postgraduate", domain: "Systems Architecture",
    is_trending: 0, is_beginner_friendly: 0, estimated_weeks: 14,
    skills: ["Go", "gRPC", "Docker", "Kubernetes"]
  },
  {
    title: "AI Study Buddy",
    description: "An intelligent tutoring system that generates practice questions, provides explanations, and adapts to the student's learning pace using spaced repetition.",
    difficulty_level: 3, academic_level_min: "undergraduate", domain: "EdTech",
    is_trending: 1, is_beginner_friendly: 1, estimated_weeks: 8,
    skills: ["Python", "React", "OpenAI API", "PostgreSQL"]
  },
  {
    title: "Earthquake Early Warning Network",
    description: "Deploy a network of low-cost seismic sensors with edge ML models for real-time earthquake detection and community alert broadcasting.",
    difficulty_level: 5, academic_level_min: "postgraduate", domain: "IoT",
    is_trending: 0, is_beginner_friendly: 0, estimated_weeks: 16,
    skills: ["Python", "TensorFlow Lite", "Raspberry Pi", "MQTT"]
  }
];

async function seed() {
  try {
    console.log('Seeding projects and skills...');
    
    for (const p of projects) {
      // Check if project already exists
      const [existing] = await pool.query('SELECT id FROM projects WHERE title = ?', [p.title]);
      if (existing[0]) {
        console.log(`  Project "${p.title}" already exists, skipping.`);
        continue;
      }

      // Insert Project
      const [result] = await pool.query(
        `INSERT INTO projects (title, description, difficulty_level, academic_level_min, domain, estimated_weeks, is_trending, is_beginner_friendly, is_active) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
        [p.title, p.description, p.difficulty_level, p.academic_level_min, p.domain, p.estimated_weeks || 6, p.is_trending, p.is_beginner_friendly]
      );
      const projectId = result.insertId;

      // Insert Skills and link them
      for (const sName of p.skills) {
        let skillId;
        const [existingSkill] = await pool.query('SELECT id FROM skills WHERE name = ?', [sName]);
        if (existingSkill[0]) {
          skillId = existingSkill[0].id;
        } else {
          const [sResult] = await pool.query('INSERT INTO skills (name, category) VALUES (?, ?)', [sName, 'technology']);
          skillId = sResult.insertId;
        }

        try {
          await pool.query(
            'INSERT INTO project_skills (project_id, skill_id, importance) VALUES (?, ?, ?)',
            [projectId, skillId, 'required']
          );
        } catch (e) {
          // Skip if already linked
        }
      }

      console.log(`  Created: ${p.title}`);
    }
    
    console.log(`Successfully seeded ${projects.length} projects.`);
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  }
}

seed();
