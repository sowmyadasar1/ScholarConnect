<div class="page">

<div class="section-label">Section C</div>
<h2>Database / Data Model</h2>

<h3>7. ER Diagram (Logical Data Model)</h3>
<p>ScholarConnect's database architecture is highly relational, utilizing strict foreign key constraints and optimized indexing strategies. The primary entities span across Users, Projects, Skills, Recommendations, and Collaborative Workspaces.</p>

<div class="diagram-container" style="max-height: 800px; overflow-y: auto;">
```mermaid
erDiagram
    USERS ||--o{ USER_SKILLS : possesses
    USERS ||--o{ COLLABORATION_PROJECTS : owns
    USERS ||--o{ WORKSPACE_TASKS : assigned
    USERS ||--o{ TEAM_MEMBERS : joins
    
    SKILLS ||--o{ USER_SKILLS : referenced_in
    SKILLS ||--o{ PROJECT_SKILLS : referenced_in
    
    PROJECTS ||--o{ PROJECT_SKILLS : requires
    PROJECTS ||--o{ PROJECT_TECH_STACK : utilizes
    PROJECTS ||--o{ PROJECT_RECOMMENDATIONS : generates
    
    COLLABORATION_PROJECTS ||--o{ COLLABORATION_REQUESTS : receives
    COLLABORATION_PROJECTS ||--o{ TEAMS : forms
    
    TEAMS ||--o{ TEAM_MEMBERS : contains
    TEAMS ||--o{ WORKSPACE_TASKS : manages
    TEAMS ||--o{ WORKSPACE_MESSAGES : holds
    TEAMS ||--o{ WORKSPACE_NOTES : contains
    TEAMS ||--o{ WORKSPACE_ACTIVITY : logs
    
    MENTORS ||--o{ MENTOR_MATCHES : evaluates
    USERS ||--o{ MENTOR_MATCHES : requests
    
    USERS {
        int id PK
        string email
        string name
        string github_access_token
        string preferred_role
    }
    
    PROJECTS {
        int id PK
        string title
        int difficulty_level
        string domain
    }
    
    TEAMS {
        int id PK
        string name
        int collab_project_id FK
        int mentor_match_id FK
    }
    
    WORKSPACE_TASKS {
        int id PK
        string title
        string status
        int assigned_to FK
        int team_id FK
    }
    
    MENTOR_MATCHES {
        int id PK
        int mentor_id FK
        int user_id FK
        float compatibility_score
        string status
    }
```
<div class="diagram-caption">Figure 7: Logical Entity-Relationship (ER) Diagram</div>
</div>

<h3>8. Schema / Collections Model</h3>
<p>The SQLite/MySQL schema uses normalized tables to prevent data anomalies. Key collections and their properties include:</p>

<table>
  <thead>
    <tr>
      <th>Table / Entity</th>
      <th>Primary Purpose</th>
      <th>Key Constraints & Relations</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><code>users</code></td>
      <td>Core identity, OAuth tokens, role preferences.</td>
      <td><code>email</code> is UNIQUE.</td>
    </tr>
    <tr>
      <td><code>projects</code></td>
      <td>Catalog of base projects from which recommendations are built.</td>
      <td>Links to <code>project_skills</code> (M:N).</td>
    </tr>
    <tr>
      <td><code>collaboration_projects</code></td>
      <td>User-instantiated projects that are open for teaming.</td>
      <td>1:1 with <code>teams</code>, stores <code>github_repo_url</code>.</td>
    </tr>
    <tr>
      <td><code>collaboration_requests</code></td>
      <td>Tracks invites and join requests (prevents duplication).</td>
      <td>UNIQUE constraints across sender and receiver states.</td>
    </tr>
    <tr>
      <td><code>mentor_matches</code></td>
      <td>Tracks the lifecycle of a mentorship request.</td>
      <td>UNIQUE(user_id, mentor_id) prevents duplicate requests.</td>
    </tr>
    <tr>
      <td><code>workspace_tasks</code></td>
      <td>Kanban board persistence.</td>
      <td>Tied strictly to <code>team_id</code>.</td>
    </tr>
  </tbody>
</table>

<h3>9. Schema Design Document</h3>
<p>Our schema design adheres to the following principles:</p>
<ul>
  <li><strong>Normalization:</strong> M:N relationships (like Users and Skills) are strictly broken down using associative tables (<code>user_skills</code>, <code>project_skills</code>).</li>
  <li><strong>Soft Constraints:</strong> Deletions in teams cascade carefully; activity logs maintain historical references.</li>
  <li><strong>Duplicate Prevention:</strong> The <code>collaboration_requests</code> and <code>mentor_matches</code> tables utilize composite UNIQUE constraints handled natively by the database engine to guarantee integrity against concurrent race conditions (throwing <code>409 Conflict</code>).</li>
</ul>

</div>
