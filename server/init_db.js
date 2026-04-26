const fs = require('fs');
const path = require('path');
const { getDb } = require('./config/db');

async function initDb() {
  try {
    const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
    let schemaSql = fs.readFileSync(schemaPath, 'utf8');

    // Convert MySQL syntax to SQLite syntax
    schemaSql = schemaSql
      .replace(/AUTO_INCREMENT/g, '') // remove first, we'll add it back correctly
      .replace(/INT PRIMARY KEY/g, 'INTEGER PRIMARY KEY AUTOINCREMENT')
      .replace(/INT NOT NULL PRIMARY KEY/g, 'INTEGER PRIMARY KEY AUTOINCREMENT')
      .replace(/TINYINT\(1\)/g, 'INTEGER')
      .replace(/INT /g, 'INTEGER ')
      .replace(/INT,/g, 'INTEGER,')
      .replace(/VARCHAR\(\d+\)/g, 'TEXT')
      .replace(/ENUM\([^)]+\)/g, 'TEXT')
      .replace(/JSON/g, 'TEXT')
      .replace(/DECIMAL\(\d+,\d+\)/g, 'REAL')
      .replace(/ON UPDATE CURRENT_TIMESTAMP/g, '')
      .replace(/USE scholar_connect;/g, '')
      .replace(/CREATE DATABASE IF NOT EXISTS scholar_connect;/g, '')
      .replace(/CREATE TABLE /g, 'CREATE TABLE IF NOT EXISTS ')
      .replace(/UNIQUE KEY \w+ \(([^)]+)\)/g, 'UNIQUE ($1)')
      .replace(/,\s*INDEX \w+ \(([^)]+)\)/g, '')
      .replace(/INDEX \w+ \(([^)]+)\)/g, '')
      .replace(/,\s*\)/g, '\n)');

    const db = await getDb();

    // Split statements and execute individually
    const statements = schemaSql.split(';').map(s => s.trim()).filter(s => s.length > 0);

    for (const statement of statements) {
      try {
        await db.exec(statement + ';');
      } catch (e) {
        console.error('Failed to execute statement:', statement);
        console.error(e.message);
      }
    }

    console.log('✅ SQLite database initialized successfully from schema.sql');

    // Insert mock data if empty
    const userCount = await db.get('SELECT COUNT(*) as count FROM users');
    if (userCount.count === 0) {
      console.log('🌱 Seeding database with Indian Academic dataset...');
      
      // 1. Users
      const users = [
        ['admin@scholarconnect.io', 'Platform Admin', 'Faculty', 1, 'Mentor & Administrator at IIT Madras.'],
        ['arjun.mehta@iitb.ac.in', 'Arjun Mehta', 'B.Tech 3rd Year', 0, 'Full-stack developer at IIT Bombay. Passionate about Web3.'],
        ['priya.sharma@nitt.edu', 'Priya Sharma', 'M.Tech / Masters', 0, 'Research scholar at NIT Trichy specializing in AI/ML.'],
        ['rahul.nair@bits-pilani.ac.in', 'Rahul Nair', 'B.Tech 4th Year', 0, 'Embedded systems enthusiast from BITS Pilani.'],
        ['sowmya.d@vit.ac.in', 'Sowmya Dasari', 'B.Tech 2nd Year', 0, 'Frontend developer and UI designer from VIT. Interested in React.'],
        ['vikram.kumar@iitd.ac.in', 'Vikram Kumar', 'PhD Scholar', 0, 'Deep Learning researcher at IIT Delhi. Seeking collaborators for NLP projects.']
      ];

      for (const u of users) {
        await db.run(
          'INSERT INTO users (email, name, academic_level, is_admin, bio) VALUES (?, ?, ?, ?, ?)',
          u
        );
      }

      // 2. Skills
      const skills = [
        ['Python', 'language'], ['Javascript', 'language'], ['React', 'framework'], 
        ['Node.js', 'framework'], ['Machine Learning', 'domain'], ['Deep Learning', 'domain'],
        ['PostgreSQL', 'database'], ['Docker', 'devops'], ['Solidity', 'language']
      ];
      for (const s of skills) {
        await db.run('INSERT INTO skills (name, category) VALUES (?, ?)', s);
      }

      // 3. User Skills (Connect users to skills)
      // Arjun (IITB) - React, Javascript, Node.js
      await db.run('INSERT INTO user_skills (user_id, skill_id, proficiency, source) VALUES (2, 2, 5, "manual"), (2, 3, 4, "manual"), (2, 4, 3, "manual")');
      // Priya (NITT) - Python, Machine Learning, Deep Learning
      await db.run('INSERT INTO user_skills (user_id, skill_id, proficiency, source) VALUES (3, 1, 5, "manual"), (3, 5, 5, "manual"), (3, 6, 4, "manual")');
      // Rahul (BITS) - Python, Docker
      await db.run('INSERT INTO user_skills (user_id, skill_id, proficiency, source) VALUES (4, 1, 4, "manual"), (4, 8, 4, "manual")');

      // 4. Projects (Catalog)
      const projects = [
        ['Decentralized Academic Credentials', 'A blockchain-based system to verify degrees.', 4, 'blockchain', '["Solidity", "React", "Node.js"]'],
        ['Low-Resource Language NLP', 'Building LLMs for regional Indian languages.', 5, 'ai', '["Python", "Deep Learning", "NLP"]'],
        ['Smart Campus Energy Grid', 'IOT-based energy management for universities.', 3, 'iot', '["Python", "Docker", "PostgreSQL"]']
      ];
      for (const p of projects) {
        await db.run(
          'INSERT INTO projects (title, description, difficulty_level, domain, tech_stack) VALUES (?, ?, ?, ?, ?)',
          p
        );
      }

      // 5. Collaboration Hub (Active Projects)
      await db.run(`
        INSERT INTO collaboration_projects (owner_id, project_id, repo_name, description, languages, topics)
        VALUES (2, 1, 'iitb-blockchain-credentials', 'Active implementation of blockchain credentials.', '{"Solidity": 80, "Javascript": 20}', '["blockchain", "security"]')
      `);

      console.log('🌱 Database seeded with high-fidelity Indian dataset!');
    }

  } catch (err) {
    console.error('❌ Database initialization failed:', err);
  }
}

initDb();
