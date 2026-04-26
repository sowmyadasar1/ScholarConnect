const { pool } = require('./config/db');

async function seed() {
  try {
    console.log('🚀 Starting comprehensive relational seeding (Realistic Data Version)...');

    // 0. Disable foreign keys temporarily for cleanup
    await pool.query('PRAGMA foreign_keys = OFF');
    await pool.query('DELETE FROM teammate_suggestions');
    await pool.query('DELETE FROM project_recommendations');
    await pool.query('DELETE FROM mentor_matches');
    await pool.query('DELETE FROM mentor_skills');
    await pool.query('DELETE FROM mentors');
    await pool.query('DELETE FROM team_members');
    await pool.query('DELETE FROM teams');
    await pool.query('DELETE FROM project_skills');
    await pool.query('DELETE FROM project_tech_stack');
    await pool.query('DELETE FROM skills');
    await pool.query('DELETE FROM user_skills');
    await pool.query('DELETE FROM user_interests');
    await pool.query('DELETE FROM interests');
    await pool.query('DELETE FROM projects');
    await pool.query('DELETE FROM users');

    // 1. Seed Skills
    const skillList = [
      { name: 'Python', category: 'language' },
      { name: 'React', category: 'framework' },
      { name: 'Node.js', category: 'runtime' },
      { name: 'PyTorch', category: 'framework' },
      { name: 'Machine Learning', category: 'domain' },
      { name: 'Blockchain', category: 'domain' },
      { name: 'Solidity', category: 'language' },
      { name: 'UI/UX Design', category: 'design' },
      { name: 'Docker', category: 'tool' },
      { name: 'TypeScript', category: 'language' },
      { name: 'PostgreSQL', category: 'database' },
      { name: 'Kubernetes', category: 'tool' },
      { name: 'System Design', category: 'skill' },
      { name: 'AWS', category: 'tool' },
      { name: 'Firebase', category: 'tool' }
    ];

    for (const s of skillList) {
      await pool.query('INSERT OR IGNORE INTO skills (name, category) VALUES (?, ?)', [s.name, s.category]);
    }

    // 1.5 Seed Interests
    const interestList = ['Web Development', 'Artificial Intelligence', 'Cybersecurity', 'Data Science', 'Cloud Computing', 'Web3', 'Mobile Apps', 'Open Source'];
    for (const name of interestList) {
      await pool.query('INSERT OR IGNORE INTO interests (name) VALUES (?)', [name]);
    }

    // 2. Seed Mentors (Faculty)
    const mentors = [
      {
        email: 'prof.sharma@iitd.ac.in',
        name: 'Prof. Ananya Sharma',
        bio: 'Senior Faculty at IIT Delhi. Researching LLMs and RL. Former researcher at Google AI.',
        domain: 'Artificial Intelligence',
        experience_years: 15,
        skills: ['Python', 'PyTorch', 'Machine Learning', 'System Design'],
        interests: ['Artificial Intelligence', 'Open Source'],
        is_admin: 1
      },
      {
        email: 'vikram.singh@bits.edu',
        name: 'Dr. Vikram Singh',
        bio: 'Associate Professor at BITS Pilani. Expert in DLT and Smart Contract Security.',
        domain: 'Web3 & Blockchain',
        experience_years: 9,
        skills: ['Solidity', 'Blockchain', 'Node.js', 'TypeScript'],
        interests: ['Web3', 'Cybersecurity']
      },
      {
        email: 'priya.desai@nitk.ac.in',
        name: 'Dr. Priya Desai',
        bio: 'Infrastructure specialist focusing on Cloud-Native apps. PhD from IISc Bangalore.',
        domain: 'Cloud Infrastructure',
        experience_years: 12,
        skills: ['Node.js', 'Docker', 'Kubernetes', 'AWS', 'PostgreSQL'],
        interests: ['Cloud Computing', 'System Design']
      }
    ];

    for (const m of mentors) {
      const [uResult] = await pool.query(
        'INSERT INTO users (email, name, bio, academic_level, is_admin) VALUES (?, ?, ?, ?, ?)',
        [m.email, m.name, m.bio, 'faculty', m.is_admin || 0]
      );
      const userId = uResult.insertId;

      await pool.query(
        'INSERT INTO mentors (user_id, bio, domain, experience_years, is_approved) VALUES (?, ?, ?, ?, ?)',
        [userId, m.bio, m.domain, m.experience_years, 1]
      );

      for (const sName of m.skills) {
        const [sRows] = await pool.query('SELECT id FROM skills WHERE name = ?', [sName]);
        if (sRows[0]) {
          await pool.query('INSERT INTO user_skills (user_id, skill_id, proficiency, source) VALUES (?, ?, ?, ?)', [userId, sRows[0].id, 5, 'manual']);
        }
      }
      
      for (const iName of m.interests) {
        const [iRows] = await pool.query('SELECT id FROM interests WHERE name = ?', [iName]);
        if (iRows[0]) {
          await pool.query('INSERT INTO user_interests (user_id, interest_id) VALUES (?, ?)', [userId, iRows[0].id]);
        }
      }
    }

    // 3. Seed Projects
    const projects = [
      {
        title: "Medical Imaging with GANs",
        description: "Synthesizing realistic MRI scans for rare neurological disorders.",
        difficulty_level: 4,
        domain: "Healthcare AI",
        skills: ["Python", "PyTorch", "Machine Learning"]
      },
      {
        title: "Interoperable Identity Protocol",
        description: "Building a cross-chain decentralized identity standard for academic credentialing.",
        difficulty_level: 5,
        domain: "Web3",
        skills: ["Solidity", "Blockchain", "TypeScript"]
      },
      {
        title: "High-Throughput Logistics Engine",
        description: "Real-time route optimization using Graph Theory and Node.js.",
        difficulty_level: 3,
        domain: "Logistics",
        skills: ["Node.js", "PostgreSQL", "Docker", "AWS"]
      }
    ];

    for (const p of projects) {
      const [pResult] = await pool.query(
        'INSERT INTO projects (title, description, difficulty_level, domain, is_active) VALUES (?, ?, ?, ?, ?)',
        [p.title, p.description, p.difficulty_level, p.domain, 1]
      );
      const projectId = pResult.insertId;

      for (const sName of p.skills) {
        const [sRows] = await pool.query('SELECT id FROM skills WHERE name = ?', [sName]);
        if (sRows[0]) {
          await pool.query('INSERT INTO project_skills (project_id, skill_id, importance) VALUES (?, ?, ?)', [projectId, sRows[0].id, 'required']);
        }
      }
    }

    // 4. Seed Teammates (Students)
    const teammates = [
      { email: 'rahul.kumar@srm.edu', name: 'Rahul Kumar', bio: 'Frontend Lead at SRM Coding Club.', academic_level: 'B.Tech 1st Year', preferred_role: 'Frontend Developer', skills: ['React', 'TypeScript', 'UI/UX Design'], interests: ['Web Development', 'Mobile Apps'] },
      { email: 'neha.gupta@pes.edu', name: 'Neha Gupta', bio: 'M.Tech student researching NLP.', academic_level: 'M.Tech / Masters', preferred_role: 'Data Scientist', skills: ['Python', 'Machine Learning', 'PyTorch'], interests: ['Artificial Intelligence', 'Data Science'] },
      { email: 'aditya.patel@manipal.edu', name: 'Aditya Patel', bio: 'Fullstack developer and Open Source contributor.', academic_level: 'B.Tech 4th Year', preferred_role: 'Blockchain Engineer', skills: ['React', 'Node.js', 'Solidity', 'PostgreSQL', 'TypeScript'], interests: ['Web3', 'Open Source'] },
      { email: 'arjun.reddy@iiit.ac.in', name: 'Arjun Reddy', bio: 'DevOps enthusiast. Focused on CI/CD pipelines.', academic_level: 'B.Tech 3rd Year', preferred_role: 'DevOps Engineer', skills: ['Docker', 'Kubernetes', 'Python', 'Node.js'], interests: ['Cloud Computing', 'System Design'] },
      { email: 'ishita.v@vit.ac.in', name: 'Ishita Verma', bio: 'UI/UX Designer and Frontend developer.', academic_level: 'B.Tech 4th Year', preferred_role: 'UI/UX Designer', skills: ['UI/UX Design', 'React', 'TypeScript', 'Node.js'], interests: ['Web Development', 'Mobile Apps'] },
      { email: 'sanjay.rao@rvce.edu.in', name: 'Sanjay Rao', bio: 'Backend developer interested in Distributed Systems.', academic_level: 'B.Tech 1st Year', preferred_role: 'Backend Developer', skills: ['Node.js', 'PostgreSQL', 'Docker', 'Python', 'AWS'], interests: ['System Design', 'Cloud Computing'] },
      { email: 'kavya.nair@iitm.ac.in', name: 'Kavya Nair', bio: 'B.Tech student with a focus on statistical modeling.', academic_level: 'B.Tech 3rd Year', preferred_role: 'ML Researcher', skills: ['Python', 'Machine Learning', 'PostgreSQL', 'PyTorch'], interests: ['Data Science', 'Artificial Intelligence'] }
    ];

    for (const t of teammates) {
      const [uResult] = await pool.query(
        'INSERT INTO users (email, name, bio, academic_level, preferred_role, is_admin) VALUES (?, ?, ?, ?, ?, ?)',
        [t.email, t.name, t.bio, t.academic_level, t.preferred_role, 0]
      );
      const userId = uResult.insertId;
      for (const sName of t.skills) {
        const [sRows] = await pool.query('SELECT id FROM skills WHERE name = ?', [sName]);
        if (sRows[0]) {
          await pool.query('INSERT INTO user_skills (user_id, skill_id, proficiency, source) VALUES (?, ?, ?, ?)', [userId, sRows[0].id, 4, 'manual']);
        }
      }
      for (const iName of t.interests) {
        const [iRows] = await pool.query('SELECT id FROM interests WHERE name = ?', [iName]);
        if (iRows[0]) {
          await pool.query('INSERT INTO user_interests (user_id, interest_id) VALUES (?, ?)', [userId, iRows[0].id]);
        }
      }
    }

    await pool.query('PRAGMA foreign_keys = ON');
    console.log('✅ Realistic relational seeding complete.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
}

seed();
