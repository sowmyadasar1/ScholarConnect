-- ScholarConnect — Complete Relational Schema
-- Supports Authentication, ML Recommendations, Collaboration, and Request Management

DROP TABLE IF EXISTS user_interests;
DROP TABLE IF EXISTS interests;
DROP TABLE IF EXISTS feedback;
DROP TABLE IF EXISTS teammate_suggestions;
DROP TABLE IF EXISTS invites;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS mentor_matches;
DROP TABLE IF EXISTS mentor_skills;
DROP TABLE IF EXISTS mentors;
DROP TABLE IF EXISTS team_members;
DROP TABLE IF EXISTS teams;
DROP TABLE IF EXISTS collaboration_requests;
DROP TABLE IF EXISTS collaboration_projects;
DROP TABLE IF EXISTS project_roadmaps;
DROP TABLE IF EXISTS skill_gaps;
DROP TABLE IF EXISTS project_recommendations;
DROP TABLE IF EXISTS project_tech_stack;
DROP TABLE IF EXISTS project_skills;
DROP TABLE IF EXISTS user_skills;
DROP TABLE IF EXISTS skills;
DROP TABLE IF EXISTS projects;
DROP TABLE IF EXISTS users;

-- 1. Core Identity & Profile
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT,
    name TEXT,
    avatar_url TEXT,
    bio TEXT,
    github_id TEXT,
    google_id TEXT,
    github_access_token TEXT,
    academic_level TEXT DEFAULT 'B.Tech 1st Year',
    preferred_role TEXT DEFAULT 'contributor',
    availability TEXT DEFAULT 'flexible',
    is_admin INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Project Catalog
CREATE TABLE projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    difficulty_level INTEGER DEFAULT 1, -- 1-5
    academic_level_min TEXT DEFAULT 'B.Tech 1st Year',
    domain TEXT,
    tech_stack TEXT, -- JSON array of technologies
    estimated_weeks INTEGER DEFAULT 6,
    is_trending INTEGER DEFAULT 0,
    is_beginner_friendly INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- 3. Skills System
CREATE TABLE skills (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE,
    category TEXT -- 'language', 'framework', 'tool', etc.
);

CREATE TABLE user_skills (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    skill_id INTEGER,
    proficiency TEXT DEFAULT 'Intermediate', -- Beginner, Intermediate, Advanced
    source TEXT DEFAULT 'manual',
    UNIQUE(user_id, skill_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (skill_id) REFERENCES skills(id)
);

CREATE TABLE project_skills (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER,
    skill_id INTEGER,
    importance TEXT DEFAULT 'required', -- 'required', 'preferred'
    UNIQUE(project_id, skill_id),
    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (skill_id) REFERENCES skills(id)
);

CREATE TABLE project_tech_stack (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER,
    technology TEXT,
    role TEXT DEFAULT 'other',
    FOREIGN KEY (project_id) REFERENCES projects(id)
);

-- 4. ML Recommendations & Personalization
CREATE TABLE project_recommendations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    project_id INTEGER,
    match_score REAL,
    difficulty_match REAL DEFAULT 0,
    skill_match REAL DEFAULT 0,
    interest_match REAL DEFAULT 0,
    explanation TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (project_id) REFERENCES projects(id)
);

CREATE TABLE skill_gaps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    project_id INTEGER,
    skill_id INTEGER,
    suggested_path TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (skill_id) REFERENCES skills(id)
);

CREATE TABLE project_roadmaps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER,
    week_number INTEGER,
    title TEXT,
    description TEXT,
    deliverables TEXT,
    FOREIGN KEY (project_id) REFERENCES projects(id)
);

-- 5. Collaboration & Team Management
CREATE TABLE collaboration_projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    owner_id INTEGER,
    project_id INTEGER, -- Optional link to catalog project (if AI generated)
    repo_name TEXT,
    github_repo_url TEXT,
    description TEXT,
    languages TEXT, -- JSON
    topics TEXT, -- JSON
    is_open_for_collab INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(id),
    FOREIGN KEY (project_id) REFERENCES projects(id)
);

CREATE TABLE collaboration_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    collab_project_id INTEGER,
    user_id INTEGER, -- The person requesting to join OR being invited
    type TEXT DEFAULT 'request', -- 'request' (user -> owner) or 'invite' (owner -> user)
    role TEXT,
    message TEXT,
    status TEXT DEFAULT 'pending', -- 'pending', 'accepted', 'rejected'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (collab_project_id) REFERENCES collaboration_projects(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE teams (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    project_id INTEGER, -- Links to projects OR collaboration_projects
    collab_project_id INTEGER,
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (collab_project_id) REFERENCES collaboration_projects(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE team_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    team_id INTEGER,
    user_id INTEGER,
    role TEXT DEFAULT 'member',
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(team_id, user_id),
    FOREIGN KEY (team_id) REFERENCES teams(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 6. Mentorship System
CREATE TABLE mentors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    bio TEXT,
    expertise TEXT,
    domain TEXT,
    experience_years INTEGER DEFAULT 0,
    max_mentees INTEGER DEFAULT 3,
    current_mentees INTEGER DEFAULT 0,
    is_approved INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE mentor_skills (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mentor_id INTEGER,
    skill_id INTEGER,
    proficiency INTEGER DEFAULT 3,
    UNIQUE(mentor_id, skill_id),
    FOREIGN KEY (mentor_id) REFERENCES mentors(id),
    FOREIGN KEY (skill_id) REFERENCES skills(id)
);

CREATE TABLE mentor_matches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mentor_id INTEGER,
    user_id INTEGER,
    status TEXT DEFAULT 'suggested', -- 'suggested', 'requested', 'accepted', 'declined'
    compatibility_score REAL,
    skill_match_score REAL DEFAULT 0,
    domain_match_score REAL DEFAULT 0,
    experience_score REAL DEFAULT 0,
    availability_score REAL DEFAULT 0,
    explanation TEXT,
    requested_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (mentor_id) REFERENCES mentors(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 7. Engagement & Social
CREATE TABLE notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    type TEXT,
    title TEXT,
    message TEXT,
    reference_type TEXT,
    reference_id INTEGER,
    is_read INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE teammate_suggestions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    suggested_user_id INTEGER,
    compatibility_score REAL,
    skill_complementarity REAL DEFAULT 0,
    role_fit_score REAL DEFAULT 0,
    availability_score REAL DEFAULT 0,
    explanation TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (suggested_user_id) REFERENCES users(id)
);

CREATE TABLE feedback (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    rating INTEGER,
    comment TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE interests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE,
    category TEXT
);

CREATE TABLE user_interests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    interest_id INTEGER,
    UNIQUE(user_id, interest_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (interest_id) REFERENCES interests(id)
);

-- 8. Performance Indices
CREATE INDEX idx_user_skills_user_id ON user_skills(user_id);
CREATE INDEX idx_user_skills_skill_id ON user_skills(skill_id);
CREATE INDEX idx_projects_created_by ON projects(created_by);
CREATE INDEX idx_collaboration_requests_collab_project_id ON collaboration_requests(collab_project_id);
CREATE INDEX idx_collaboration_requests_user_id ON collaboration_requests(user_id);
CREATE INDEX idx_collaboration_projects_owner_id ON collaboration_projects(owner_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_mentor_matches_user_id ON mentor_matches(user_id);
CREATE INDEX idx_mentor_matches_mentor_id ON mentor_matches(mentor_id);
