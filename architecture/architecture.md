---
title: "ScholarConnect Architecture Documentation"
author: "Engineering Team"
date: "2026-04"
css: "styles.css"
---

# ScholarConnect — System Architecture Documentation

<div class="cover">
  <h1>ScholarConnect</h1>
  <div class="subtitle">Complete Architecture & Engineering Design Package</div>
  <div class="meta">Generated: April 2026</div>
</div>

<div class="page">
  <h2>Table of Contents</h2>
  <div class="toc">
    <div class="toc-section">Section A — System Architecture</div>
    <div class="toc-item">1. High-level system architecture</div>
    <div class="toc-item">2. Client-server communication</div>
    <div class="toc-item">3. Component architecture</div>
    <div class="toc-section">Section B — Data Flow Diagrams</div>
    <div class="toc-item">4. DFD Level 0 (Context)</div>
    <div class="toc-item">5. DFD Level 1</div>
    <div class="toc-item">6. DFD Level 2 (Critical Subsystems)</div>
    <div class="toc-section">Section C — Database / Data Model</div>
    <div class="toc-item">7. ER Diagram (Logical)</div>
    <div class="toc-item">8. Database Schema / Collections</div>
    <div class="toc-item">9. Schema Design Document</div>
    <div class="toc-section">Section D — Algorithm & Workflows</div>
    <div class="toc-item">10. Skill Selection Flow</div>
    <div class="toc-item">11. Project Recommendation Flow</div>
    <div class="toc-item">12. Mentor Matching Flow</div>
    <div class="toc-item">13. Smart Invite / Collab Matching</div>
    <div class="toc-item">14. AI Copilot / Generative Flow</div>
    <div class="toc-item">15. GitHub Import Pipeline</div>
    <div class="toc-item">16. Collaboration Lifecycle</div>
    <div class="toc-section">Section E — User Flows</div>
    <div class="toc-item">17. End-to-end User Journey</div>
    <div class="toc-item">18. Persona Flows (Mentee, Mentor, Admin)</div>
    <div class="toc-item">19. State Transitions</div>
    <div class="toc-section">Section F — Advanced Engineering Diagrams</div>
    <div class="toc-item">20. Advanced Diagrams</div>
    <div class="toc-section">Section G — Security & Scalability</div>
    <div class="toc-item">21. Security Architecture</div>
    <div class="toc-item">22. Scalability Architecture</div>
  </div>
</div>

<div class="page">

<div class="section-label">Section A</div>
<h2>System Architecture</h2>

<h3>1. High-Level System Architecture</h3>
<p>ScholarConnect is a distributed, service-oriented architecture comprised of a React frontend, Node.js/Express core backend, and a specialized Python machine-learning service. The entire platform is backed by a relational database (SQLite in development, configurable for PostgreSQL/MySQL in production).</p>

<div class="diagram-container">
```mermaid
graph TD
    subgraph Client Layer
        Web[React Web App]
        Mobile[Mobile Responsive View]
    end

    subgraph API Gateway & Core Backend
        Gateway[Express Server Node.js]
        AuthSvc[Auth & Identity Service]
        CollabSvc[Collaboration & Workspace Service]
        AdminSvc[Admin Services]
    end

    subgraph AI & ML Service Python
        RecEngine[Recommendation Engine]
        MatchEngine[Matching Engine Mentors/Teammates]
        NLP[NLP & Copilot Processing]
    end

    subgraph Data Persistence
        DB[(Relational DB\nSQLite/PostgreSQL)]
    end

    subgraph External Integrations
        GitHub[GitHub API]
        GoogleAuth[Google OAuth]
        GitHubAuth[GitHub OAuth]
    end

    Web -->|REST API| Gateway
    Mobile -->|REST API| Gateway
    
    Gateway --> AuthSvc
    Gateway --> CollabSvc
    Gateway --> AdminSvc
    
    AuthSvc --> GoogleAuth
    AuthSvc --> GitHubAuth
    CollabSvc --> GitHub
    
    Gateway -->|HTTP POST JSON| RecEngine
    Gateway -->|HTTP POST JSON| MatchEngine
    Gateway -->|HTTP POST JSON| NLP
    
    Gateway --> DB
    
    classDef client fill:#3b82f6,stroke:#2563eb,color:#fff;
    classDef backend fill:#10b981,stroke:#059669,color:#fff;
    classDef ml fill:#8b5cf6,stroke:#7c3aed,color:#fff;
    classDef data fill:#f59e0b,stroke:#d97706,color:#fff;
    classDef ext fill:#64748b,stroke:#475569,color:#fff;
    
    class Web,Mobile client;
    class Gateway,AuthSvc,CollabSvc,AdminSvc backend;
    class RecEngine,MatchEngine,NLP ml;
    class DB data;
    class GitHub,GoogleAuth,GitHubAuth ext;
```
<div class="diagram-caption">Figure 1: High-level System Architecture</div>
</div>

<h3>2. Client-Server Communication Architecture</h3>
<p>The communication between the client and server strictly follows RESTful principles over HTTP. Stateful communication (such as tracking real-time collaboration) relies on persistent polling or Server-Sent Events (SSE) depending on configuration, backed by stateless JWT authentication for every request.</p>

<div class="diagram-container">
```mermaid
sequenceDiagram
    participant C as Client (React)
    participant M as Auth Middleware
    participant B as Core Backend (Node)
    participant ML as ML Service (Python)
    participant D as Database

    C->>B: POST /api/auth/login
    B->>D: Verify Credentials
    D-->>B: User Record
    B-->>C: Returns JWT & User Data
    
    Note over C,D: Subsequent Requests
    C->>M: GET /api/projects/recommend (Bearer JWT)
    M->>M: Verify Token
    M->>B: Route to Controller
    B->>D: Fetch User Profile & Skills
    D-->>B: Profile Data
    B->>ML: POST /recommend (Profile)
    ML-->>B: Recommended Project Array
    B-->>C: Returns 200 OK (Projects)
```
<div class="diagram-caption">Figure 2: Request/Response Flow Diagram</div>
</div>

<h3>3. Component Architecture</h3>
<p>ScholarConnect follows a strict modular structure. Components are decoupled by domain.</p>

<div class="diagram-container">
```mermaid
graph LR
    subgraph Frontend Modules
        Dashboard[Dashboard]
        MentorMatchingUI[Mentor Matching]
        TeammateMatchingUI[Teammate Matching]
        WorkspaceUI[Collab Workspace]
        AdminUI[Admin Dashboard]
    end

    subgraph Backend Services Node.js
        CollabAPI[Collaboration API]
        AuthAPI[Auth Services]
        WorkspaceAPI[Workspace & Chat]
        AdminAPI[Admin Services]
    end
    
    subgraph ML Microservice Python
        RecEngine[Project Recommender]
        MentorMatch[Mentor Matcher]
        TeammateMatch[Teammate Matcher]
        GenAI[Generative Co-pilot]
    end

    Dashboard --> RecEngine
    MentorMatchingUI --> MentorMatch
    TeammateMatchingUI --> TeammateMatch
    WorkspaceUI --> WorkspaceAPI
    WorkspaceUI --> CollabAPI
    AdminUI --> AdminAPI
    
    WorkspaceAPI -.-> GenAI
    
    style Frontend Modules fill:#f8fafc,stroke:#e2e8f0
    style Backend Services Node.js fill:#f0fdf4,stroke:#bbf7d0
    style ML Microservice Python fill:#faf5ff,stroke:#e9d5ff
```
<div class="diagram-caption">Figure 3: Internal Component Service Boundaries</div>
</div>

</div>


<div class="page">

<div class="section-label">Section B</div>
<h2>Data Flow Diagrams (DFD)</h2>

<h3>4. DFD Level 0 (Context Diagram)</h3>
<p>The Level 0 Context Diagram establishes the boundaries of the ScholarConnect system, showing external entities and the major data flows into and out of the system.</p>

<div class="diagram-container">
```mermaid
graph TD
    User([Student / User])
    Mentor([Mentor / Faculty])
    Admin([Administrator])
    GitHub([GitHub Platform])
    OAuth([OAuth Provider])
    
    System[[ScholarConnect Platform]]
    
    User -- "Profile Data, Skill Input, Collab Requests" --> System
    System -- "Project Recommendations, Match Results" --> User
    
    Mentor -- "Mentor Profile, Mentee Acceptance" --> System
    System -- "Mentee Requests, Match Notifications" --> Mentor
    
    Admin -- "Moderation, User Approvals" --> System
    System -- "Analytics, Reports" --> Admin
    
    System -- "Repo Link Request" --> GitHub
    GitHub -- "Repo Metadata" --> System
    
    User -- "Auth Tokens" --> OAuth
    OAuth -- "Identity Verification" --> System
    
    classDef entity fill:#1e293b,stroke:#0f172a,color:#fff,shape:rect,rx:10;
    classDef system fill:#2563eb,stroke:#1d4ed8,color:#fff,shape:circle;
    
    class User,Mentor,Admin,GitHub,OAuth entity;
    class System system;
```
<div class="diagram-caption">Figure 4: Level 0 Context DFD</div>
</div>

<h3>5. DFD Level 1</h3>
<p>The Level 1 diagram breaks the main system down into major functional subsystems: Identity, Recommendation, Collaboration, and Mentorship.</p>

<div class="diagram-container">
```mermaid
graph LR
    User([User])
    
    subgraph System Processes
        P1(1.0 Identity Management)
        P2(2.0 ML Recommendations)
        P3(3.0 Workspace Engine)
        P4(4.0 Mentorship System)
    end
    
    D1[(Users DB)]
    D2[(Projects DB)]
    D3[(Workspace DB)]
    
    User -->|Credentials| P1
    P1 -->|Auth Token| User
    P1 -->|User Data| D1
    
    User -->|Skill Vector| P2
    D1 -->|Profile| P2
    D2 -->|Catalog Data| P2
    P2 -->|Recommendations| User
    
    User -->|Collab Actions| P3
    P3 <-->|CRUD Operations| D3
    
    User -->|Match Request| P4
    P4 <-->|Mentor Availabilities| D1
    P4 -->|Match Score| User
```
<div class="diagram-caption">Figure 5: Level 1 Functional DFD</div>
</div>

<h3>6. DFD Level 2 (Critical Subsystems)</h3>

<h4>6.1 Workspace & Collaboration Workflow (Level 2)</h4>
<div class="diagram-container">
```mermaid
graph TD
    User([User])
    P3_1(3.1 Task Management)
    P3_2(3.2 Real-time Chat)
    P3_3(3.3 Repo Integration)
    
    D3_1[(Tasks Table)]
    D3_2[(Messages Table)]
    D3_3[(Activity Log)]
    
    User -->|Create/Move Task| P3_1
    P3_1 -->|Update State| D3_1
    P3_1 -->|Log Event| D3_3
    
    User -->|Send Chat| P3_2
    P3_2 -->|Store Message| D3_2
    
    User -->|Link Repo URL| P3_3
    P3_3 -->|Update Team Config| D3_1
```
<div class="diagram-caption">Figure 6.1: Level 2 DFD - Workspace Engine</div>
</div>

<h4>6.2 Invite & Collaboration Request System (Level 2)</h4>
<div class="diagram-container">
```mermaid
graph LR
    Sender([Sender])
    Receiver([Receiver])
    
    P_Inv(1.0 Process Invite)
    P_Chk(2.0 Check Constraints)
    P_Notif(3.0 Dispatch Notification)
    
    D_Req[(Requests DB)]
    
    Sender -->|Send Request| P_Inv
    P_Inv -->|Check 409 Conflict| P_Chk
    P_Chk -->|Read Existing| D_Req
    P_Chk -->|Valid| P_Inv
    P_Inv -->|Store Pending| D_Req
    P_Inv -->|Trigger Alert| P_Notif
    P_Notif -->|Alert UI| Receiver
```
<div class="diagram-caption">Figure 6.2: Level 2 DFD - Smart Invites with 409 Constraint Guard</div>
</div>

</div>


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


<div class="page">

<div class="section-label">Section D</div>
<h2>Algorithm / Workflow Diagrams</h2>

<h3>10. Project Recommendation Workflow</h3>
<p>The ML Service handles real-time project recommendation. It processes user skills, academic level, and interests against 20+ diverse domain blueprints to synthesize highly personalized projects.</p>

<div class="diagram-container">
```mermaid
flowchart TD
    Start([Client Request]) --> API[Node.js API Gateway]
    API --> ML[ML Service POST /generate]
    ML --> Filter{Filter Blueprints by Domain}
    
    Filter -->|Match| BP_Match[Select Domain Blueprints]
    Filter -->|No Match| BP_Random[Select Random Diverse Blueprints]
    
    BP_Match --> Synth[Synthesis Engine]
    BP_Random --> Synth
    
    Synth --> Math[Calculate Base Score\nS = (W1 * Skill) + (W2 * Diff) + (W3 * Domain)]
    Math --> Randomize[Inject ±15% Random Variance for Diversity]
    Randomize --> Sort[Sort by Final Score Descending]
    
    Sort --> Format[Format JSON Response]
    Format --> API
    API --> UI([Display to User])
```
<div class="diagram-caption">Figure 8: Project Generation & Recommendation Logic</div>
</div>

<h3>11. Mentor Matching Workflow</h3>
<p>Matching users to mentors relies on a strictly weighted compatibility formula.</p>
<div class="formula">
Match Score = (0.40 × Skill Match) + (0.30 × Domain Match) + (0.20 × Exp Match) + (0.10 × Availability)
</div>

<div class="diagram-container">
```mermaid
sequenceDiagram
    participant User
    participant System
    participant Matcher Engine
    participant DB

    User->>System: Request Mentor Match
    System->>DB: Fetch User Profile
    System->>DB: Fetch Available Mentors
    DB-->>System: Mentor Candidates
    System->>Matcher Engine: POST /match/mentors (Profile + Candidates)
    
    loop Every Candidate
        Matcher Engine->>Matcher Engine: Compute Sub-scores (Skill, Domain, Exp)
        Matcher Engine->>Matcher Engine: Apply Weights & Sum
    end
    
    Matcher Engine->>Matcher Engine: Sort by Highest Score
    Matcher Engine-->>System: Ranked List
    System-->>User: Display Matches with Explanations
```
<div class="diagram-caption">Figure 9: Mentor Ranking & Matching Sequence</div>
</div>

<h3>12. Smart Invite / Collaboration Workflow</h3>
<p>This flow guarantees duplicate prevention via defensive database constraints.</p>

<div class="diagram-container">
```mermaid
stateDiagram-v2
    [*] --> Idle
    Idle --> SendingInvite : User Clicks 'Send Invite'
    SendingInvite --> API : POST /api/collab/requests
    API --> CheckDB : Check existing records
    
    state CheckDB {
        direction LR
        Query --> Valid : Not found
        Query --> Conflict : Found Pending/Accepted
    }
    
    Conflict --> HTTP409 : Reject Invite
    HTTP409 --> UIError : Display "Already Sent"
    
    Valid --> HTTP201 : Insert to DB
    HTTP201 --> UISuccess : Update Button State (Disabled)
```
<div class="diagram-caption">Figure 10: State Machine for Duplicate Invite Prevention</div>
</div>

<h3>13. GitHub Import Pipeline Workflow</h3>
<div class="diagram-container">
```mermaid
graph LR
    User([User]) -->|Inputs Repo URL| UI[Workspace UI]
    UI -->|PUT /api/workspace/:id/repo| API[Express API]
    API --> DB[(collaboration_projects)]
    API --> Log[(workspace_activity)]
    API --> UI
    UI -->|Render| External[Open GitHub URL in New Tab]
```
<div class="diagram-caption">Figure 11: GitHub Repo Linking Pipeline</div>
</div>

</div>


<div class="page">

<div class="section-label">Section E</div>
<h2>User Flows</h2>

<h3>14. End-to-End User Journey</h3>
<p>The standard user journey for a student moving from onboarding to active collaboration.</p>

<div class="diagram-container">
```mermaid
graph TD
    A([Sign Up / Google OAuth]) --> B[Complete Profile & Skills]
    B --> C[View Dashboard Recommendations]
    C --> D{Select Action}
    
    D -->|Find Project| E[Launch Project]
    D -->|Find Teammates| F[Send Invites]
    D -->|Find Mentor| G[Request Mentor Match]
    
    E --> H[Create Workspace Team]
    F -->|Accepted| H
    G -->|Accepted| H
    
    H --> I[Collab Workspace Hub]
    I --> J[Manage Kanban Tasks]
    I --> K[Real-time Chat & Notes]
    I --> L[Link GitHub Repo]
```
<div class="diagram-caption">Figure 12: End-to-end User Journey</div>
</div>

<h3>15. Persona-Specific Flows</h3>

<h4>Admin Flow</h4>
<div class="diagram-container">
```mermaid
graph LR
    Admin([Admin User]) -->|Login| Dashboard[Admin Dashboard]
    Dashboard -->|View Users| Users[User Management]
    Dashboard -->|Review Mentors| Mentors[Approve/Reject Mentors]
    Dashboard -->|System Logs| Logs[View Analytics]
```
<div class="diagram-caption">Figure 13: Administrator Flow</div>
</div>

<div class="section-label" style="margin-top: 40px;">Section F</div>
<h2>Advanced Engineering Diagrams</h2>

<h3>16. Collaboration Workspace State Machine</h3>
<p>The lifecycle of a workspace task through the Kanban system.</p>

<div class="diagram-container">
```mermaid
stateDiagram-v2
    [*] --> Todo : Task Created
    
    Todo --> InProgress : Start Work
    InProgress --> Todo : Blocked/Revert
    InProgress --> Done : Complete Task
    Done --> InProgress : Reopen Task
    
    Todo --> [*] : Delete
    InProgress --> [*] : Delete
    Done --> [*] : Delete
```
<div class="diagram-caption">Figure 14: Kanban Task State Machine</div>
</div>

<h3>17. Class Diagram: Core Services</h3>
<div class="diagram-container">
```mermaid
classDiagram
    class WorkspaceController {
        +getWorkspace(teamId)
        +createTask(teamId, taskData)
        +updateTask(teamId, taskId, updates)
        +deleteTask(teamId, taskId)
        +updateRepo(teamId, repoUrl)
    }
    
    class CollabController {
        +inviteUser(req, res)
        +getRequests(req, res)
        +updateRequestStatus(req, res)
    }
    
    class MLRecommender {
        +generate_synthetic_projects(query, skills)
        +calculate_match_score(weights)
    }
    
    WorkspaceController ..> CollabController : uses teams
    WorkspaceController --> Database
    CollabController --> Database
    MLRecommender --> API_Gateway
```
<div class="diagram-caption">Figure 15: Core Controller Class Diagram</div>
</div>

</div>


<div class="page">

<div class="section-label">Section G</div>
<h2>Security & Scalability</h2>

<h3>18. Security Architecture</h3>
<p>Security is enforced at multiple layers of the application.</p>

<div class="diagram-container">
```mermaid
graph TD
    subgraph Client Layer
        Sanitize[XSS Prevention - React]
        NoStore[No Sensitive Data in LocalStorage]
    end

    subgraph Transport Layer
        TLS[TLS/SSL Encryption]
        CORS[Strict CORS Policy]
    end

    subgraph API Gateway
        RateLimiter[express-rate-limit]
        Helmet[Helmet HTTP Headers]
        JWT[JWT Bearer Verification]
    end

    subgraph Data Layer
        BCrypt[Bcrypt Password Hashing]
        Params[Parameterized Queries / SQLi Prevention]
    end

    Client Layer --> Transport Layer --> API Gateway --> Data Layer
```
<div class="diagram-caption">Figure 16: Security Architecture</div>
</div>

<ul>
  <li><strong>Authentication Flow:</strong> JWTs are issued via AuthController and validated using the <code>authenticate</code> middleware on all protected routes.</li>
  <li><strong>Data Integrity:</strong> Defensive constraints in <code>schema.sql</code> prevent bad state (e.g., duplicated invites, orphaned tasks).</li>
</ul>

<h3>19. Scalability Architecture</h3>
<p>The system is designed to scale horizontally by decoupling the CPU-intensive Machine Learning operations from the I/O-intensive Express server.</p>

<div class="diagram-container">
```mermaid
graph TD
    LB[Load Balancer]
    
    subgraph Node.js Cluster
        Node1[Express Server 1]
        Node2[Express Server 2]
        NodeN[Express Server N]
    end
    
    subgraph Python ML Cluster
        ML1[Flask ML Worker 1]
        ML2[Flask ML Worker 2]
    end
    
    subgraph Database Tier
        Primary[(Primary DB - Writes)]
        Replica[(Read Replica)]
    end
    
    LB --> Node1 & Node2 & NodeN
    Node1 & Node2 & NodeN --> ML1 & ML2
    Node1 & Node2 & NodeN --> Primary
    Node1 & Node2 & NodeN --> Replica
    ML1 & ML2 --> Replica
```
<div class="diagram-caption">Figure 17: Future Scaling & Microservices Decomposition Diagram</div>
</div>

<h3>20. Deployment Architecture</h3>
<p>The development environment uses Docker Compose to orchestrate the Client, Server, and ML Service. Production deployments target managed container services (e.g., AWS ECS, Google Cloud Run) utilizing the same containerized footprints.</p>

</div>

<!-- End of Document -->


