const { pool } = require('./config/db');

const mentors = [
  {
    name: 'Arjun Desai',
    email: 'arjun.desai@example.com',
    bio: 'Former Distributed Systems Engineer at Gojek. Scaling high-throughput systems.',
    domain: 'Systems Architecture',
    experience: 8,
    skills: ['Go', 'Kubernetes', 'Kafka', 'Rust']
  },
  {
    name: 'Priya Sharma',
    email: 'priya.sharma@example.com',
    bio: 'Lead NLP Researcher at IIT Bombay. Building vernacular language models.',
    domain: 'Machine Learning',
    experience: 6,
    skills: ['PyTorch', 'Python', 'NLP', 'Transformers']
  },
  {
    name: 'Rohan Gupta',
    email: 'rohan.gupta@example.com',
    bio: 'Staff Security Engineer at Zerodha. Specializing in zero-trust architecture.',
    domain: 'Cybersecurity',
    experience: 10,
    skills: ['Cryptography', 'Network Security', 'Python', 'Go']
  },
  {
    name: 'Neha Verma',
    email: 'neha.verma@example.com',
    bio: 'Data Engineering Lead. Managing petabyte-scale data pipelines.',
    domain: 'Data Engineering',
    experience: 7,
    skills: ['Apache Spark', 'Airflow', 'Snowflake', 'Python']
  },
  {
    name: 'Vikram Singh',
    email: 'vikram.singh@example.com',
    bio: 'Core Contributor to React Native. Passionate about mobile performance.',
    domain: 'Mobile Development',
    experience: 5,
    skills: ['React Native', 'TypeScript', 'Swift', 'Kotlin']
  },
  {
    name: 'Ananya Reddy',
    email: 'ananya.reddy@example.com',
    bio: 'Product Engineer at Postman. Focuses on developer tooling and APIs.',
    domain: 'Developer Tools',
    experience: 4,
    skills: ['Node.js', 'TypeScript', 'GraphQL', 'Docker']
  },
  {
    name: 'Rahul Kumar',
    email: 'rahul.kumar@example.com',
    bio: 'IoT and Robotics Engineer at Ather Energy. Bridging hardware and software.',
    domain: 'Internet of Things',
    experience: 6,
    skills: ['C++', 'Embedded Systems', 'Python', 'ROS']
  },
  {
    name: 'Sneha Patil',
    email: 'sneha.patil@example.com',
    bio: 'Genomic Data Scientist at Strand Life Sciences. AI in healthcare.',
    domain: 'Bioinformatics',
    experience: 9,
    skills: ['R', 'Python', 'TensorFlow', 'Data Science']
  },
  {
    name: 'Karan Mehta',
    email: 'karan.mehta@example.com',
    bio: 'Blockchain Architect at Polygon. Building scalable L2 solutions.',
    domain: 'Web3 & Blockchain',
    experience: 5,
    skills: ['Solidity', 'Rust', 'Ethereum', 'Smart Contracts']
  },
  {
    name: 'Isha Joshi',
    email: 'isha.joshi@example.com',
    bio: 'Senior Frontend Engineer at Flipkart. Web performance obsessed.',
    domain: 'Frontend Engineering',
    experience: 7,
    skills: ['React', 'Next.js', 'CSS', 'JavaScript']
  },
  {
    name: 'Amit Patel',
    email: 'amit.patel@example.com',
    bio: 'Cloud Infrastructure Architect at AWS India. Designing robust enterprise systems.',
    domain: 'Cloud Computing',
    experience: 12,
    skills: ['AWS', 'Terraform', 'Linux', 'Docker']
  },
  {
    name: 'Meera Menon',
    email: 'meera.menon@example.com',
    bio: 'Game Engine Developer. Specializing in computer graphics and rendering.',
    domain: 'Game Development',
    experience: 6,
    skills: ['C++', 'OpenGL', 'Vulkan', 'Math']
  },
  {
    name: 'Siddharth Bose',
    email: 'siddharth.bose@example.com',
    bio: 'Computer Vision Researcher. Improving real-time object tracking algorithms.',
    domain: 'Computer Vision',
    experience: 5,
    skills: ['OpenCV', 'PyTorch', 'C++', 'Python']
  },
  {
    name: 'Divya Iyer',
    email: 'divya.iyer@example.com',
    bio: 'Fintech Backend Lead at Razorpay. Designing high-availability payment systems.',
    domain: 'Backend Engineering',
    experience: 8,
    skills: ['Go', 'PostgreSQL', 'Redis', 'Microservices']
  },
  {
    name: 'Varun Nair',
    email: 'varun.nair@example.com',
    bio: 'UX/UI Designer and Front-end Dev. Creating accessible, beautiful interfaces.',
    domain: 'Human-Computer Interaction',
    experience: 4,
    skills: ['Figma', 'React', 'CSS', 'Accessibility']
  }
];

const runQuery = async (query, params) => {
  const [result] = await pool.query(query, params);
  return result.insertId;
};

const getRow = async (query, params) => {
  const [rows] = await pool.query(query, params);
  return rows[0];
};

async function seedMentors() {
  console.log('Seeding mentors...');

  for (const m of mentors) {
    try {
      // Create User
      const userId = await runQuery(
        'INSERT INTO users (email, name, password_hash, bio) VALUES (?, ?, ?, ?)',
        [m.email, m.name, 'mockhash', m.bio]
      );

      // Create Mentor
      const mentorId = await runQuery(
        'INSERT INTO mentors (user_id, bio, domain, experience_years, is_approved, max_mentees) VALUES (?, ?, ?, ?, 1, 5)',
        [userId, m.bio, m.domain, m.experience]
      );

      // Create Skills
      for (const s of m.skills) {
        let skillRow = await getRow('SELECT id FROM skills WHERE name = ?', [s]);
        let skillId;
        
        if (!skillRow) {
          skillId = await runQuery('INSERT INTO skills (name, category) VALUES (?, ?)', [s, 'technology']);
        } else {
          skillId = skillRow.id;
        }

        await runQuery(
          'INSERT INTO mentor_skills (mentor_id, skill_id, proficiency) VALUES (?, ?, ?)',
          [mentorId, skillId, 5]
        );
      }
      
      console.log(`Created mentor: ${m.name}`);
    } catch (e) {
      if (e.message.includes('UNIQUE constraint failed')) {
        console.log(`Mentor ${m.email} already exists, skipping.`);
      } else {
        console.error(`Error creating mentor ${m.name}:`, e);
      }
    }
  }

  console.log('Done.');
  db.close();
}

seedMentors();
