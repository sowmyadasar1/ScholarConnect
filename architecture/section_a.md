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
