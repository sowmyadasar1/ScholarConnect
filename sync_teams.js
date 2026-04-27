const { pool } = require('./server/config/db');

async function syncTeams() {
  try {
    console.log('🔄 Syncing teams for collaboration projects...');
    
    // 1. Get all projects
    const [projects] = await pool.query('SELECT id, repo_name, owner_id FROM collaboration_projects');
    
    for (const project of projects) {
      // 2. Check if team exists
      const [teams] = await pool.query('SELECT id FROM teams WHERE collab_project_id = ?', [project.id]);
      
      let teamId;
      if (teams.length === 0) {
        console.log(`➕ Creating team for project: ${project.repo_name}`);
        const [result] = await pool.query(
          'INSERT INTO teams (name, collab_project_id, created_by) VALUES (?, ?, ?)',
          [project.repo_name, project.id, project.owner_id]
        );
        teamId = result.insertId;
      } else {
        teamId = teams[0].id;
      }
      
      // 3. Ensure owner is a member
      await pool.query(
        'INSERT OR IGNORE INTO team_members (team_id, user_id, role) VALUES (?, ?, ?)',
        [teamId, project.owner_id, 'Owner']
      );
      
      // 4. Also find accepted requests and add those members
      const [acceptedRequests] = await pool.query(
        'SELECT user_id, role FROM collaboration_requests WHERE collab_project_id = ? AND status = "accepted"',
        [project.id]
      );
      
      for (const req of acceptedRequests) {
        console.log(`👤 Adding member ${req.user_id} to team ${teamId}`);
        await pool.query(
          'INSERT OR IGNORE INTO team_members (team_id, user_id, role) VALUES (?, ?, ?)',
          [teamId, req.user_id, req.role || 'member']
        );
      }
    }
    
    console.log('✅ Team sync complete!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Team sync failed:', err);
    process.exit(1);
  }
}

syncTeams();
