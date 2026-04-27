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
