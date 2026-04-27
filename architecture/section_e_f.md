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
