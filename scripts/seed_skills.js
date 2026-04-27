const { pool } = require('../server/config/db');

async function seedSkillsAndGaps() {
  try {
    console.log("Seeding project skills and user skills...");

    const [projects] = await pool.query('SELECT id FROM projects');
    const [skills] = await pool.query('SELECT id FROM skills LIMIT 20');
    const sowmyaId = 8;

    if (projects.length === 0 || skills.length === 0) {
      console.log("Projects or skills missing. Seed them first.");
      return;
    }

    // 1. Add skills to projects
    for (const p of projects) {
      // Add 3 random skills to each project
      for (let i = 0; i < 3; i++) {
        const skill = skills[Math.floor(Math.random() * skills.length)];
        await pool.query(
          'INSERT OR IGNORE INTO project_skills (project_id, skill_id, importance) VALUES (?, ?, ?)',
          [p.id, skill.id, 'required']
        );
      }
    }

    // 2. Add some skills to Sowmya
    for (let i = 0; i < 5; i++) {
      const skill = skills[i];
      await pool.query(
        'INSERT OR IGNORE INTO user_skills (user_id, skill_id, proficiency) VALUES (?, ?, ?)',
        [sowmyaId, skill.id, 'Intermediate']
      );
    }

    console.log("Successfully seeded project/user skills!");
    process.exit(0);
  } catch (err) {
    console.error("Seeding failed:", err);
    process.exit(1);
  }
}

seedSkillsAndGaps();
