/**
 * AI Copilot Controller
 *
 * Generates contextual project analysis: architecture, tech stack,
 * README, milestones, risks, and role breakdowns.
 *
 * Uses template-based generation with project metadata — no external API needed.
 */

const { pool } = require('../config/db');
const { AppError } = require('../middleware/errorHandler');

// ─── Template Engine ──────────────────────────────────────

function parseTechStack(project) {
  let techs = [];
  if (project.tech_stack) {
    if (Array.isArray(project.tech_stack)) {
      techs = project.tech_stack;
    } else {
      try { techs = JSON.parse(project.tech_stack); } catch { techs = project.tech_stack.split(',').map(s => s.trim()); }
    }
  }
  if (project.topics) {
    if (Array.isArray(project.topics)) {
      techs = [...new Set([...techs, ...project.topics])];
    } else {
      try { const t = JSON.parse(project.topics); techs = [...new Set([...techs, ...t])]; } catch {}
    }
  }
  return techs.filter(Boolean);
}

function parseSkills(project) {
  return project.skills ? project.skills.split(',').map(s => s.trim()) : [];
}

// ─── Generators ───────────────────────────────────────────

function generateArchitecture(project, techs) {
  const layers = [];
  const hasBackend = techs.some(t => /node|express|django|flask|spring|fastapi/i.test(t));
  const hasFrontend = techs.some(t => /react|vue|angular|next|svelte/i.test(t));
  const hasML = techs.some(t => /python|tensorflow|pytorch|ml|ai|scikit/i.test(t));
  const hasDB = techs.some(t => /sql|mongo|postgres|redis|firebase/i.test(t));
  const hasCloud = techs.some(t => /aws|gcp|azure|docker|kubernetes/i.test(t));

  layers.push({ name: 'Presentation Layer', components: hasFrontend ? ['React/Next.js SPA', 'Component Library (MUI/Tailwind)', 'State Management (Context/Redux)', 'API Client (Axios)'] : ['REST API Interface', 'CLI/SDK'] });
  if (hasBackend) layers.push({ name: 'Application Layer', components: ['Express.js/FastAPI Server', 'Authentication Middleware (JWT)', 'Rate Limiting & CORS', 'Business Logic Controllers', 'Input Validation Layer'] });
  if (hasML) layers.push({ name: 'Intelligence Layer', components: ['ML Model Pipeline', 'Feature Engineering Module', 'Model Training/Inference', 'Data Preprocessing', 'Results Cache'] });
  layers.push({ name: 'Data Layer', components: hasDB ? ['Primary Database (SQL/NoSQL)', 'ORM/Query Builder', 'Migration System', 'Seed Data'] : ['File-based Storage', 'JSON/CSV Data'] });
  if (hasCloud) layers.push({ name: 'Infrastructure Layer', components: ['Docker Containers', 'CI/CD Pipeline', 'Cloud Hosting', 'Monitoring & Logging'] });

  return {
    title: `Architecture for ${project.title}`,
    pattern: hasML ? 'Microservices (ML + API + Frontend)' : hasBackend && hasFrontend ? 'Monolithic MVC' : 'Single-Tier',
    layers,
    communication: hasML ? 'REST APIs between services, message queue for async ML tasks' : 'Direct function calls within monolith',
    deployment: hasCloud ? 'Containerized deployment via Docker Compose' : 'Single-server deployment'
  };
}

function suggestTechStack(project, existingTechs) {
  const categories = {
    frontend: { recommended: [], reason: '' },
    backend: { recommended: [], reason: '' },
    database: { recommended: [], reason: '' },
    devops: { recommended: [], reason: '' },
    testing: { recommended: [], reason: '' }
  };

  const diff = project.difficulty_level || 3;
  const desc = (project.description || '').toLowerCase();

  // Frontend
  if (desc.includes('dashboard') || desc.includes('ui') || desc.includes('visualization')) {
    categories.frontend = { recommended: ['React 18', 'MUI v5', 'Chart.js/D3.js', 'Vite'], reason: 'Data-heavy UI benefits from React ecosystem' };
  } else {
    categories.frontend = { recommended: ['React 18', 'Tailwind CSS', 'Vite'], reason: 'Modern, lightweight frontend stack' };
  }

  // Backend
  if (desc.includes('ml') || desc.includes('machine learning') || desc.includes('ai')) {
    categories.backend = { recommended: ['Python (FastAPI)', 'Node.js (Express)', 'Celery (task queue)'], reason: 'Python for ML, Node for API gateway' };
  } else {
    categories.backend = { recommended: ['Node.js (Express)', 'JWT Auth', 'Helmet.js'], reason: 'Fast API development with robust middleware' };
  }

  // Database
  if (diff >= 4) {
    categories.database = { recommended: ['PostgreSQL', 'Redis (cache)', 'Prisma ORM'], reason: 'Production-grade relational DB with caching' };
  } else {
    categories.database = { recommended: ['SQLite/PostgreSQL', 'Knex.js'], reason: 'Lightweight for development, upgradeable for production' };
  }

  // DevOps
  categories.devops = { recommended: ['Docker', 'GitHub Actions CI', diff >= 4 ? 'Kubernetes' : 'Railway/Render'], reason: 'Containerized for consistency across environments' };

  // Testing
  categories.testing = { recommended: ['Jest', 'Supertest', diff >= 3 ? 'Cypress' : 'React Testing Library'], reason: 'Unit + integration + E2E coverage' };

  return { title: `Tech Stack for ${project.title}`, categories, existing: existingTechs };
}

function generateREADME(project, techs) {
  const weeks = project.estimated_weeks || 6;
  return {
    title: project.title,
    content: `# ${project.title}

${project.description || 'A capstone project.'}

## 🚀 Quick Start

\`\`\`bash
# Clone the repository
git clone <repo-url>
cd ${(project.title || 'project').toLowerCase().replace(/\s+/g, '-')}

# Install dependencies
npm install

# Set up environment
cp .env.example .env

# Run development server
npm run dev
\`\`\`

## 🛠️ Tech Stack

${techs.map(t => `- **${t}**`).join('\n')}

## 📋 Project Structure

\`\`\`
├── client/          # Frontend (React)
├── server/          # Backend (Express)
├── database/        # Schema & migrations
├── tests/           # Test suites
├── docs/            # Documentation
└── docker-compose.yml
\`\`\`

## 📅 Timeline

This project is designed for a **${weeks}-week** development cycle.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (\`git checkout -b feature/amazing-feature\`)
3. Commit your changes (\`git commit -m 'Add amazing feature'\`)
4. Push to the branch (\`git push origin feature/amazing-feature\`)
5. Open a Pull Request

## 📄 License

Distributed under the MIT License.`
  };
}

function suggestMilestones(project) {
  const weeks = project.estimated_weeks || 6;
  const diff = project.difficulty_level || 3;
  const desc = (project.description || '').toLowerCase();
  const hasML = desc.includes('ml') || desc.includes('ai') || desc.includes('learning');

  const milestones = [];

  // Week 1: Always setup
  milestones.push({
    week: 1,
    title: 'Project Setup & Planning',
    tasks: ['Initialize repository & project structure', 'Set up development environment', 'Define database schema', 'Create wireframes/mockups', 'Set up CI/CD pipeline'],
    deliverable: 'Working dev environment with base project skeleton'
  });

  if (hasML) {
    milestones.push({ week: 2, title: 'Data Pipeline & Exploration', tasks: ['Data collection & cleaning', 'Exploratory data analysis', 'Feature engineering', 'Dataset splitting (train/test/val)'], deliverable: 'Clean dataset ready for model training' });
    milestones.push({ week: 3, title: 'Model Development', tasks: ['Baseline model implementation', 'Hyperparameter tuning', 'Model evaluation metrics', 'API endpoint for inference'], deliverable: 'Trained model with benchmark scores' });
    milestones.push({ week: 4, title: 'Backend & Integration', tasks: ['REST API development', 'Authentication system', 'Model serving integration', 'Database CRUD operations'], deliverable: 'API serving model predictions' });
  } else {
    milestones.push({ week: 2, title: 'Core Backend Development', tasks: ['Database setup & ORM', 'Authentication (JWT/OAuth)', 'Core API endpoints', 'Input validation & error handling'], deliverable: 'Functional API with auth' });
    milestones.push({ week: 3, title: 'Feature Implementation', tasks: ['Primary feature development', 'Business logic implementation', 'Third-party integrations', 'Background jobs (if any)'], deliverable: 'Core features working end-to-end' });
    milestones.push({ week: 4, title: 'Frontend Development', tasks: ['UI component library setup', 'Page layouts & routing', 'API integration', 'State management'], deliverable: 'Functional UI connected to API' });
  }

  milestones.push({ week: weeks - 1, title: 'Testing & Polish', tasks: ['Unit & integration tests', 'UI/UX refinements', 'Performance optimization', 'Security review', 'Bug fixes'], deliverable: 'Stable, tested application' });
  milestones.push({ week: weeks, title: 'Deployment & Documentation', tasks: ['Production deployment', 'Documentation (README, API docs)', 'Demo preparation', 'Final presentation'], deliverable: 'Deployed, documented project' });

  return { title: `${weeks}-Week Milestone Plan`, milestones };
}

function analyzeRisks(project, techs) {
  const risks = [];
  const diff = project.difficulty_level || 3;
  const desc = (project.description || '').toLowerCase();

  if (diff >= 4) risks.push({ severity: 'high', category: 'Scope', description: 'High difficulty may lead to scope creep. Define MVP early and defer stretch goals.', mitigation: 'Create a priority matrix (MoSCoW) in week 1.' });
  if (techs.length > 6) risks.push({ severity: 'medium', category: 'Complexity', description: `Stack includes ${techs.length} technologies — integration overhead is significant.`, mitigation: 'Use proven boilerplate/starter templates to reduce setup time.' });
  if (desc.includes('real-time') || desc.includes('websocket')) risks.push({ severity: 'medium', category: 'Technical', description: 'Real-time features add deployment and scaling complexity.', mitigation: 'Use managed WebSocket services or polling-based MVP first.' });
  if (desc.includes('ml') || desc.includes('ai')) risks.push({ severity: 'high', category: 'Data', description: 'ML projects depend on data quality and availability.', mitigation: 'Start with synthetic/public datasets. Validate data pipeline before model work.' });
  if (desc.includes('blockchain') || desc.includes('distributed')) risks.push({ severity: 'high', category: 'Technical', description: 'Distributed systems introduce consensus, latency, and debugging challenges.', mitigation: 'Use testnets and simulation environments.' });

  // Generic risks
  risks.push({ severity: 'low', category: 'Timeline', description: 'Last-mile integration often takes longer than expected.', mitigation: 'Reserve 20% buffer time. Integrate continuously, not at the end.' });
  risks.push({ severity: 'low', category: 'Team', description: 'Communication gaps between team members.', mitigation: 'Daily async standups, shared Kanban board, weekly sync calls.' });

  return { title: `Risk Assessment for ${project.title}`, risks };
}

function suggestRoles(project, techs) {
  const roles = [];
  const desc = (project.description || '').toLowerCase();
  const hasML = desc.includes('ml') || desc.includes('ai') || desc.includes('learning');
  const hasFrontend = techs.some(t => /react|vue|angular|next/i.test(t));

  if (hasFrontend) roles.push({ role: 'Frontend Developer', skills: ['React', 'CSS/Tailwind', 'State Management'], responsibilities: 'UI/UX implementation, component development, API integration', hours_per_week: 8 });
  roles.push({ role: 'Backend Developer', skills: ['Node.js/Python', 'REST APIs', 'Database Design'], responsibilities: 'API development, authentication, business logic', hours_per_week: 10 });
  if (hasML) roles.push({ role: 'ML Engineer', skills: ['Python', 'TensorFlow/PyTorch', 'Data Analysis'], responsibilities: 'Model development, training pipeline, feature engineering', hours_per_week: 10 });
  roles.push({ role: 'DevOps/QA', skills: ['Docker', 'CI/CD', 'Testing'], responsibilities: 'Deployment, testing infrastructure, monitoring', hours_per_week: 4 });
  roles.push({ role: 'Project Lead', skills: ['Communication', 'Planning', 'Code Review'], responsibilities: 'Sprint planning, task assignment, PR reviews, stakeholder updates', hours_per_week: 5 });

  return { title: `Suggested Roles for ${project.title}`, roles, team_size: roles.length };
}

// ─── Controller ───────────────────────────────────────────

const CopilotController = {
  async generate(req, res, next) {
    try {
      const { projectId } = req.params;
      const { action } = req.body; // 'architecture' | 'tech_stack' | 'readme' | 'milestones' | 'risks' | 'roles'

      const validActions = ['architecture', 'tech_stack', 'readme', 'milestones', 'risks', 'roles'];
      if (!validActions.includes(action)) throw new AppError(`Action must be one of: ${validActions.join(', ')}`, 400);

      // Fetch project data
      let project;
      
      if (req.body.projectData) {
        project = req.body.projectData;
      } else {
        const [projRows] = await pool.query('SELECT * FROM projects WHERE id = ?', [projectId]);
        project = projRows[0];

        // If not in catalog, try collaboration_projects
        if (!project) {
          const [collabRows] = await pool.query('SELECT * FROM collaboration_projects WHERE id = ?', [projectId]);
          if (!collabRows[0]) throw new AppError('Project not found', 404);
          project = collabRows[0];
          project.title = project.repo_name;
        }
      }

      const techs = parseTechStack(project);

      let result;
      switch (action) {
        case 'architecture': result = generateArchitecture(project, techs); break;
        case 'tech_stack': result = suggestTechStack(project, techs); break;
        case 'readme': result = generateREADME(project, techs); break;
        case 'milestones': result = suggestMilestones(project); break;
        case 'risks': result = analyzeRisks(project, techs); break;
        case 'roles': result = suggestRoles(project, techs); break;
      }

      res.json({ action, project_id: projectId, result });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = CopilotController;
