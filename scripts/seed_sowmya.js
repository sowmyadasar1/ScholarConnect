const { pool } = require('../server/config/db');

async function populateSowmyaProfile() {
  try {
    const sowmyaId = 8;
    console.log(`Populating profile for ID: ${sowmyaId}`);

    // 1. Ensure some catalog projects exist to import
    const [projects] = await pool.query('SELECT * FROM projects LIMIT 5');
    if (projects.length < 3) {
      console.log("Not enough projects in catalog to seed. Run catalog seeds first.");
      return;
    }

    // 2. Create some collaboration projects for Sowmya (as owner)
    // Project 1: AI Research Assistant
    const cp1Id = await pool.query(
      `INSERT INTO collaboration_projects (owner_id, project_id, repo_name, description, is_open_for_collab)
       VALUES (?, ?, ?, ?, ?)`,
      [sowmyaId, projects[0].id, 'ai-research-agent', 'Advanced AI agent for academic paper summarization.', 1]
    ).then(r => r[0].insertId);

    // Project 2: Blockchain Voting
    const cp2Id = await pool.query(
      `INSERT INTO collaboration_projects (owner_id, project_id, repo_name, description, is_open_for_collab)
       VALUES (?, ?, ?, ?, ?)`,
      [sowmyaId, projects[1].id, 'secure-vote-chain', 'Decentralized voting system for university elections.', 1]
    ).then(r => r[0].insertId);

    // 3. Add some other users (we need candidates)
    const [otherUsers] = await pool.query('SELECT id, name FROM users WHERE id != ? LIMIT 10', [sowmyaId]);
    
    if (otherUsers.length > 0) {
      // 4. Add Team Members to Sowmya's projects
      // Create teams first
      const t1Id = await pool.query('INSERT INTO teams (collab_project_id, name) VALUES (?, ?)', [cp1Id, 'AI Core Team']).then(r => r[0].insertId);
      const t2Id = await pool.query('INSERT INTO teams (collab_project_id, name) VALUES (?, ?)', [cp2Id, 'Blockchain Squad']).then(r => r[0].insertId);

      // Add Sowmya as owner in teams
      await pool.query('INSERT INTO team_members (team_id, user_id, role) VALUES (?, ?, ?)', [t1Id, sowmyaId, 'Lead Developer']);
      await pool.query('INSERT INTO team_members (team_id, user_id, role) VALUES (?, ?, ?)', [t2Id, sowmyaId, 'Product Manager']);

      // Add some teammates
      for (let i = 0; i < 3 && i < otherUsers.length; i++) {
        await pool.query('INSERT INTO team_members (team_id, user_id, role) VALUES (?, ?, ?)', [t1Id, otherUsers[i].id, 'Researcher']);
      }

      // 5. Add incoming REQUESTS to Sowmya's projects
      for (let i = 3; i < 6 && i < otherUsers.length; i++) {
        await pool.query(
          `INSERT INTO collaboration_requests (collab_project_id, user_id, sender_id, type, role, message, status)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [cp1Id, otherUsers[i].id, otherUsers[i].id, 'request', 'Frontend Dev', 'Hi Sowmya, I love this AI project!', 'pending']
        );
      }

      // 6. Add some incoming INVITES for Sowmya to join other projects
      // First create a project owned by someone else
      const otherOwner = otherUsers[0].id;
      const cpOtherId = await pool.query(
        `INSERT INTO collaboration_projects (owner_id, repo_name, description, is_open_for_collab)
         VALUES (?, ?, ?, ?)`,
        [otherOwner, 'quantum-sim-v2', 'Quantum physics simulation tool.', 1]
      ).then(r => r[0].insertId);

      await pool.query(
        `INSERT INTO collaboration_requests (collab_project_id, user_id, sender_id, type, role, message, status)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [cpOtherId, sowmyaId, otherOwner, 'invite', 'Expert Advisor', 'Sowmya, your background in physics would be perfect here!', 'pending']
      );

      // 7. Add a MENTOR to Sowmya's project
      const [mentors] = await pool.query('SELECT id FROM mentors WHERE is_approved = 1 LIMIT 1');
      if (mentors.length > 0) {
        const mentorId = mentors[0].id;
        const [mentorUser] = await pool.query('SELECT user_id FROM mentors WHERE id = ?', [mentorId]);
        
        await pool.query(
          `INSERT INTO collaboration_requests (collab_project_id, user_id, sender_id, type, role, message, status)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [cp1Id, mentorUser[0].user_id, sowmyaId, 'mentor_invite', 'Research Mentor', 'Would you like to guide our AI project?', 'accepted']
        );

        // Add mentor to team as well
        await pool.query('INSERT INTO team_members (team_id, user_id, role) VALUES (?, ?, ?)', [t1Id, mentorUser[0].user_id, 'Mentor']);
      }
    }

    console.log("Successfully seeded Sowmya's profile activity!");
    process.exit(0);
  } catch (err) {
    console.error("Seeding failed:", err);
    process.exit(1);
  }
}

populateSowmyaProfile();
