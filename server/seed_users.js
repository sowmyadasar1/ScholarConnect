const { pool } = require('./config/db');

const users = [
  {
    email: "sarah.dev@university.edu",
    name: "Sarah Chen",
    bio: "Full-stack developer interested in AI and distributed systems. Researching federated learning.",
    academic_level: "postgraduate",
    preferred_role: "Developer",
    skills: [
      { name: "Python", proficiency: 5 },
      { name: "React", proficiency: 4 },
      { name: "Docker", proficiency: 3 }
    ],
    is_mentor: true,
    mentor_bio: "Experienced developer with 4 years in industry before returning for my Masters. Happy to help with system design and React.",
    expertise: "Web Development, System Design"
  },
  {
    email: "marcus.research@mit.edu",
    name: "Marcus Miller",
    bio: "PhD candidate focusing on Quantum Computing and Cryptography.",
    academic_level: "phd",
    preferred_role: "Researcher",
    skills: [
      { name: "Qiskit", proficiency: 5 },
      { name: "Python", proficiency: 5 },
      { name: "Mathematics", proficiency: 5 }
    ],
    is_mentor: true,
    mentor_bio: "Specializing in quantum algorithms. Looking to mentor students interested in deep physics and math.",
    expertise: "Quantum Computing, Math"
  },
  {
    email: "elena.ux@design.edu",
    name: "Elena Rodriguez",
    bio: "Undergraduate student passionate about accessible UI/UX design and HCI.",
    academic_level: "undergraduate",
    preferred_role: "Designer",
    skills: [
      { name: "Figma", proficiency: 5 },
      { name: "CSS", proficiency: 4 },
      { name: "React", proficiency: 2 }
    ],
    is_mentor: false
  }
];

async function seed() {
  try {
    console.log('Seeding mock users and mentors...');
    
    for (const u of users) {
      // 1. Create User
      const [uResult] = await pool.query(
        `INSERT INTO users (email, name, bio, academic_level, preferred_role) 
         VALUES (?, ?, ?, ?, ?)`,
        [u.email, u.name, u.bio, u.academic_level, u.preferred_role]
      );
      const userId = uResult.insertId;

      // 2. Add Skills
      for (const s of u.skills) {
        let skillId;
        const [existing] = await pool.query('SELECT id FROM skills WHERE name = ?', [s.name]);
        if (existing[0]) {
          skillId = existing[0].id;
        } else {
          const [sResult] = await pool.query('INSERT INTO skills (name, category) VALUES (?, ?)', [s.name, 'language']);
          skillId = sResult.insertId;
        }
        await pool.query(
          'INSERT INTO user_skills (user_id, skill_id, proficiency, source) VALUES (?, ?, ?, ?)',
          [userId, skillId, s.proficiency, 'manual']
        );
      }

      // 3. Add Mentor if applicable
      if (u.is_mentor) {
        await pool.query(
          'INSERT INTO mentors (user_id, bio, expertise) VALUES (?, ?, ?)',
          [userId, u.mentor_bio, u.expertise]
        );
      }
    }
    
    console.log('Successfully seeded mock users and mentors.');
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  }
}

seed();
