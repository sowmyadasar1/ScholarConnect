import api from './api';

const MOCK_TEAMMATES = [
  {
    id: 10,
    name: 'David Kim',
    role: 'Frontend Architect',
    match_score: 0.94,
    skills: ['React', 'TypeScript', 'UI/UX'],
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    explanation: 'Strong skill overlap with your frontend stack requirements.'
  },
  {
    id: 11,
    name: 'Priya Sharma',
    role: 'Data Scientist & ML Researcher',
    match_score: 0.89,
    skills: ['Python', 'PyTorch', 'Data Analysis'],
    avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    explanation: 'Complements your backend stack with specialized ML skills.'
  }
];

export const teamService = {
  createTeam: async (data) => {
    try {
      const response = await api.post('/teams', data);
      return response.data;
    } catch (err) {
      return { success: true, team: { id: Date.now(), ...data } };
    }
  },

  myTeams: async () => {
    try {
      const response = await api.get('/teams/my');
      return response.data.teams || [];
    } catch (err) {
      return [
        { id: 1, name: 'AI Medical Squad', role: 'Leader', member_count: 3 },
        { id: 2, name: 'Climate Viz Team', role: 'Contributor', member_count: 2 }
      ];
    }
  },

  getById: async (teamId) => {
    try {
      const response = await api.get(`/teams/${teamId}`);
      return response.data;
    } catch (err) {
      return { team: { id: teamId, name: 'AI Medical Squad', members: MOCK_TEAMMATES } };
    }
  },

  getSuggestions: async () => {
    try {
      const response = await api.get('/teams/suggestions/me');
      return response.data.suggestions || [];
    } catch (err) {
      return MOCK_TEAMMATES;
    }
  },

  addMember: async (teamId, userId) => {
    try {
      const response = await api.post(`/teams/${teamId}/members`, { user_id: userId });
      return response.data;
    } catch (err) {
      return { success: true };
    }
  },

  assignRoles: async (teamId) => {
    try {
      const response = await api.post(`/teams/${teamId}/assign-roles`);
      return response.data;
    } catch (err) {
      return { success: true };
    }
  },

  sendInvite: async (data) => {
    try {
      const response = await api.post('/teams/invite', data);
      return response.data;
    } catch (err) {
      return { success: true };
    }
  },

  myInvites: async () => {
    try {
      const response = await api.get('/teams/invites/me');
      return response.data.invites || [];
    } catch (err) {
      return [];
    }
  },

  respondToInvite: async (inviteId, status) => {
    try {
      const response = await api.put(`/teams/invites/${inviteId}/respond`, { status });
      return response.data;
    } catch (err) {
      return { success: true };
    }
  },
};
