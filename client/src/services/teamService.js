import api from './api';

export const teamService = {
  /**
   * Create a new team.
   * Route: POST /api/teams
   */
  createTeam: async (data) => {
    const response = await api.post('/teams', data);
    return response.data;
  },

  /**
   * Get all teams the current user belongs to.
   * Route: GET /api/teams/my
   */
  myTeams: async () => {
    const response = await api.get('/teams/my');
    return response.data.teams || [];
  },

  /**
   * Get team details with members.
   * Route: GET /api/teams/:id
   */
  getById: async (teamId) => {
    const response = await api.get(`/teams/${teamId}`);
    return response.data;
  },

  /**
   * Get ML-scored teammate suggestions.
   * Route: GET /api/teams/suggestions/me
   */
  getSuggestions: async () => {
    const response = await api.get('/teams/suggestions/me');
    return response.data.suggestions || [];
  },

  /**
   * Add a member to a team.
   * Route: POST /api/teams/:id/members
   */
  addMember: async (teamId, userId) => {
    const response = await api.post(`/teams/${teamId}/members`, { user_id: userId });
    return response.data;
  },

  /**
   * Auto-assign roles in a team.
   * Route: POST /api/teams/:id/assign-roles
   */
  assignRoles: async (teamId) => {
    const response = await api.post(`/teams/${teamId}/assign-roles`);
    return response.data;
  },

  /**
   * Send an invite to a teammate.
   * Route: POST /api/teams/invite
   */
  sendInvite: async (data) => {
    const response = await api.post('/teams/invite', data);
    return response.data;
  },

  /**
   * Get pending invites for the current user.
   * Route: GET /api/teams/invites/me
   */
  myInvites: async () => {
    const response = await api.get('/teams/invites/me');
    return response.data.invites || [];
  },

  /**
   * Respond to an invite (accept/decline).
   * Route: PUT /api/teams/invites/:id/respond
   */
  respondToInvite: async (inviteId, status) => {
    const response = await api.put(`/teams/invites/${inviteId}/respond`, { status });
    return response.data;
  },
};
