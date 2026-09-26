const fs = require('fs');
const path = require('path');
const { getDb } = require('./config/db');

async function initDb() {
  try {
    // Try multiple possible paths for schema.sql
    const possiblePaths = [
      path.join(__dirname, '..', '..', 'database', 'schema.sql'),
      path.join(__dirname, '..', 'database', 'schema.sql'),
      path.join(__dirname, 'database', 'schema.sql'),
      path.join(process.cwd(), 'database', 'schema.sql')
    ];

    let schemaPath = possiblePaths[0];
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        schemaPath = p;
        break;
      }
    }

    console.log(`📖 Loading schema from: ${schemaPath}`);
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

    // Disable foreign key constraints so tables can be dropped in any order
    await db.exec('PRAGMA foreign_keys = OFF;');

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

    // Re-enable foreign key constraints
    await db.exec('PRAGMA foreign_keys = ON;');

    console.log('✅ SQLite database initialized successfully from schema.sql');

    // Insert mock data if empty
    const userCount = await db.get('SELECT COUNT(*) as count FROM users');
    if (userCount.count === 0) {
      console.log('🌱 Seeding database with High-Fidelity Indian Academic dataset...');
      
      // 1. Users
      const users = [
        ['admin@scholarconnect.io', 'Platform Admin', 'Faculty', 1, 'Mentor & Administrator. Researching Distributed Systems at IIT Madras.'],
        ['arjun.mehta@iitb.ac.in', 'Arjun Mehta', 'B.Tech 4th Year', 0, 'Full-stack developer at IIT Bombay. Passionate about Blockchain and scalable web architectures.'],
        ['ananya.iyer@iisc.ac.in', 'Ananya Iyer', 'PhD Scholar', 0, 'Researching Privacy-Preserving ML at IISc Bangalore. Expert in PyTorch and Federated Learning.'],
        ['karthik.raja@annauniv.edu', 'Karthik Raja', 'B.Tech 3rd Year', 0, 'Frontend enthusiast from Anna University. Specialist in React, Three.js, and immersive UI.'],
        ['deepika.reddy@iith.ac.in', 'Deepika Reddy', 'M.Tech / Masters', 0, 'Data Scientist at IIT Hyderabad focusing on Healthcare Informatics and NLP.'],
        ['rohan.gupta@bits-pilani.ac.in', 'Rohan Gupta', 'B.Tech 4th Year', 0, 'Cloud Infrastructure and DevOps specialist from BITS Pilani. Docker and K8s expert.'],
        ['isha.sharma@nith.ac.in', 'Isha Sharma', 'B.Tech 2nd Year', 0, 'Aspiring UI/UX designer and Frontend developer from NIT Hamirpur. Love creating clean interfaces.']
      ];

      for (const u of users) {
        await db.run(
          'INSERT INTO users (email, name, academic_level, is_admin, bio) VALUES (?, ?, ?, ?, ?)',
          u
        );
      }

      // 2. Skills
      const skills = [
        ['Python', 'language'], ['Javascript', 'language'], ['TypeScript', 'language'],
        ['React', 'framework'], ['Next.js', 'framework'], ['Node.js', 'framework'], 
        ['PyTorch', 'framework'], ['TensorFlow', 'framework'],
        ['PostgreSQL', 'database'], ['MongoDB', 'database'], ['Redis', 'database'],
        ['Docker', 'devops'], ['Kubernetes', 'devops'], ['AWS', 'devops'],
        ['Solidity', 'language'], ['Blockchain', 'domain'], ['NLP', 'domain'],
        ['Federated Learning', 'domain'], ['Healthcare IT', 'domain']
      ];
      for (const s of skills) {
        await db.run('INSERT INTO skills (name, category) VALUES (?, ?)', s);
      }

      // 3. User Skills (Connect users to skills)
      // Arjun (IITB) - Blockchain, Node.js, React
      await db.run('INSERT INTO user_skills (user_id, skill_id, proficiency, source) VALUES (2, 16, "Advanced", "manual"), (2, 6, "Intermediate", "manual"), (2, 4, "Intermediate", "manual")');
      // Ananya (IISc) - PyTorch, Federated Learning, Python
      await db.run('INSERT INTO user_skills (user_id, skill_id, proficiency, source) VALUES (3, 7, "Advanced", "manual"), (3, 18, "Advanced", "manual"), (3, 1, "Advanced", "manual")');
      // Karthik (Anna Univ) - React, TypeScript, Next.js
      await db.run('INSERT INTO user_skills (user_id, skill_id, proficiency, source) VALUES (4, 4, "Advanced", "manual"), (4, 3, "Intermediate", "manual"), (4, 5, "Intermediate", "manual")');
      // Deepika (IITH) - NLP, Python, Healthcare IT
      await db.run('INSERT INTO user_skills (user_id, skill_id, proficiency, source) VALUES (5, 17, "Advanced", "manual"), (5, 1, "Advanced", "manual"), (5, 19, "Intermediate", "manual")');

      // 4. Projects (Catalog)
      const projects = [
        ['Decentralized Academic Credentials', 'A blockchain-based system to verify degrees securely across Indian universities.', 4, 'Blockchain', '["Solidity", "React", "Node.js"]'],
        ['Privacy-Preserving Healthcare AI', 'Using Federated Learning to train models on medical data without compromising patient privacy.', 5, 'Artificial Intelligence', '["Python", "PyTorch", "Federated Learning"]'],
        ['Smart Campus Energy Optimizer', 'IoT and ML based system for reducing carbon footprint in university hostels.', 3, 'IoT', '["Python", "Docker", "PostgreSQL"]'],
        ['Low-Resource NLP for Regional Dialects', 'Building LLMs specifically for less-documented Indian regional languages.', 5, 'NLP', '["Python", "PyTorch", "NLP"]'],
        ['Scalable E-Learning for Rural India', 'A high-performance offline-first learning platform for areas with low connectivity.', 3, 'Education', '["Next.js", "Redis", "Service Workers"]']
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
        VALUES (2, 1, 'iitb-blockchain-credentials', 'Implementing the secure credentialing protocol for IIT Bombay graduates.', '{"Solidity": 70, "TypeScript": 30}', '["blockchain", "security", "academia"]')
      `);

      console.log('🌱 Database seeded with high-fidelity, unique Indian dataset!');
    }

  } catch (err) {
    console.error('❌ Database initialization failed:', err);
  }
}

if (require.main === module) {
  initDb();
}

module.exports = { initDatabase: initDb };
