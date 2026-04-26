const { pool } = require('./config/db');

const projects = [
  {
    title: "AI-Powered Academic Search Engine",
    description: "A semantic search engine for academic papers using NLP and vector embeddings to help researchers find relevant citations faster.",
    difficulty_level: 4,
    academic_level_min: "postgraduate",
    domain: "Computer Science",
    is_trending: 1,
    is_beginner_friendly: 0,
    skills: ["Python", "PyTorch", "ElasticSearch", "React"]
  },
  {
    title: "Blockchain for Credential Verification",
    description: "Developing a decentralized platform for universities to issue and verify academic certificates using Ethereum smart contracts.",
    difficulty_level: 3,
    academic_level_min: "undergraduate",
    domain: "Cybersecurity",
    is_trending: 0,
    is_beginner_friendly: 1,
    skills: ["Solidity", "Node.js", "Web3.js", "PostgreSQL"]
  },
  {
    title: "Autonomous Campus Delivery Robot",
    description: "Robotics project focusing on SLAM (Simultaneous Localization and Mapping) for small-scale autonomous navigation in campus environments.",
    difficulty_level: 5,
    academic_level_min: "postgraduate",
    domain: "Robotics",
    is_trending: 1,
    is_beginner_friendly: 0,
    skills: ["ROS", "C++", "Python", "Raspberry Pi"]
  },
  {
    title: "EcoTrack: Campus Sustainability Dashboard",
    description: "IoT and web platform to monitor and visualize energy consumption and waste management efficiency across campus buildings.",
    difficulty_level: 2,
    academic_level_min: "undergraduate",
    domain: "Sustainability",
    is_trending: 0,
    is_beginner_friendly: 1,
    skills: ["React", "MQTT", "Node.js", "InfluxDB"]
  },
  {
    title: "Quantum Algorithm Simulator",
    description: "A educational tool to visualize quantum gate operations and simulate basic algorithms like Shor's or Grover's.",
    difficulty_level: 5,
    academic_level_min: "phd",
    domain: "Physics",
    is_trending: 0,
    is_beginner_friendly: 0,
    skills: ["Python", "Qiskit", "React", "D3.js"]
  }
];

async function seed() {
  try {
    console.log('Seeding projects and skills...');
    
    for (const p of projects) {
      // 1. Insert Project
      const [result] = await pool.query(
        `INSERT INTO projects (title, description, difficulty_level, academic_level_min, domain, is_trending, is_beginner_friendly) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [p.title, p.description, p.difficulty_level, p.academic_level_min, p.domain, p.is_trending, p.is_beginner_friendly]
      );
      const projectId = result.insertId;

      // 2. Insert Skills and link them
      for (const sName of p.skills) {
        // Find or create skill
        let skillId;
        const [existing] = await pool.query('SELECT id FROM skills WHERE name = ?', [sName]);
        if (existing[0]) {
          skillId = existing[0].id;
        } else {
          const [sResult] = await pool.query('INSERT INTO skills (name, category) VALUES (?, ?)', [sName, 'language']);
          skillId = sResult.insertId;
        }

        // Link skill to project
        await pool.query(
          'INSERT INTO project_skills (project_id, skill_id, importance) VALUES (?, ?, ?)',
          [projectId, skillId, 'required']
        );
      }
    }
    
    console.log('Successfully seeded projects and linked skills.');
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  }
}

seed();
