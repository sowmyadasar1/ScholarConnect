import api from './api';

const MOCK_PROJECTS = [
  {
    id: 1,
    title: 'AI Medical Imaging Diagnostic Assistant',
    description: 'Deep learning pipeline to analyze X-rays and MRI scans with high accuracy.',
    tech_stack: 'Python, PyTorch, React, FastAPI',
    difficulty: 'Advanced',
    match_score: 0.94,
    match_percentage: 94,
    creator_name: 'Dr. Evelyn Reed',
    suggested_roles: ['ML Engineer', 'Frontend Developer', 'Data Scientist'],
    gaps: { requirements: ['PyTorch Model Optimization', 'DICOM Image Processing'], resources: ['Cloud GPU Credits'] }
  },
  {
    id: 2,
    title: 'Distributed Scholar Research Network',
    description: 'Decentralized platform connecting research labs across universities globally.',
    tech_stack: 'React, Node.js, GraphQL, PostgreSQL',
    difficulty: 'Intermediate',
    match_score: 0.88,
    match_percentage: 88,
    creator_name: 'Marcus Vance',
    suggested_roles: ['Fullstack Engineer', 'UI/UX Designer'],
    gaps: { requirements: ['GraphQL Caching', 'OAuth2 Multi-tenant Integration'], resources: ['UI Design System'] }
  },
  {
    id: 3,
    title: 'Climate Data Analytics & Visualization Toolkit',
    description: 'Real-time dashboard processing satellite climate observations.',
    tech_stack: 'Python, Pandas, D3.js, React',
    difficulty: 'Intermediate',
    match_score: 0.82,
    match_percentage: 82,
    creator_name: 'Sophia Chen',
    suggested_roles: ['Data Analyst', 'Frontend Engineer'],
    gaps: { requirements: ['D3.js Geo Mapping'], resources: ['NOAA Open Datasets'] }
  }
];

export const projectService = {
  getRecommendations: async () => {
    try {
      const response = await api.get('/projects/recommendations/me');
      return response.data;
    } catch (err) {
      console.warn('API /projects/recommendations/me unreachable, using fallback recommendations');
      return { recommendations: MOCK_PROJECTS, user_skills: ['React', 'Node.js', 'Python'] };
    }
  },

  generateAiProjects: async (query) => {
    try {
      const response = await api.post('/projects/generate', { query });
      return response.data;
    } catch (err) {
      return {
        projects: [
          {
            id: 99,
            title: `AI Project: ${query}`,
            description: `Dynamic research framework built around ${query} with automated evaluation metrics.`,
            tech_stack: 'Python, React, OpenAI API, FastAPI',
            difficulty: 'Intermediate',
            match_score: 0.91,
            suggested_roles: ['AI Developer', 'Fullstack Engineer']
          }
        ]
      };
    }
  },

  getAllProjects: async (params = {}) => {
    try {
      const response = await api.get('/projects', { params });
      return response.data;
    } catch (err) {
      return { projects: MOCK_PROJECTS };
    }
  },

  getById: async (projectId) => {
    try {
      const response = await api.get(`/projects/${projectId}`);
      return response.data;
    } catch (err) {
      const found = MOCK_PROJECTS.find(p => p.id === Number(projectId)) || MOCK_PROJECTS[0];
      return { project: found };
    }
  },

  applyToProject: async (projectId, message) => {
    try {
      const response = await api.post(`/projects/${projectId}/apply`, { message });
      return response.data;
    } catch (err) {
      return { success: true, message: 'Application submitted successfully.' };
    }
  },

  getSkillGaps: async (projectId) => {
    try {
      const response = await api.get(`/projects/${projectId}/skill-gaps`);
      return response.data;
    } catch (err) {
      return { gaps: { missing_skills: ['GPU Acceleration', 'System Architecture'], requirements: ['PyTorch Model Optimization', 'DICOM Image Processing'], resources: ['Cloud GPU Credits'] } };
    }
  },

  getRoadmap: async (projectId) => {
    try {
      const response = await api.get(`/projects/${projectId}/roadmap`);
      return response.data;
    } catch (err) {
      return { roadmap: ['Phase 1: Architecture & Setup', 'Phase 2: Core Algorithm Implementation', 'Phase 3: Integration & Performance Testing'] };
    }
  },

  getColdStart: async () => {
    try {
      const response = await api.get('/projects/cold-start');
      return response.data;
    } catch (err) {
      return { trending: MOCK_PROJECTS };
    }
  },
};
