import api from './api';

export const networkService = {
  getCollaborators: async () => {
    const res = await api.get('/network/collaborators');
    return res.data.collaborators || [];
  },

  getMentors: async () => {
    const res = await api.get('/network/mentors');
    return res.data.mentors || [];
  },

  getInviteSuggestions: async (projectId) => {
    const res = await api.get(`/network/suggestions/${projectId}`);
    return res.data.suggestions || [];
  },

  inviteCollaborator: async (inviteData) => {
    const res = await api.post('/network/invite-collaborator', inviteData);
    return res.data;
  },

  inviteMentor: async (inviteData) => {
    const res = await api.post('/network/invite-mentor', inviteData);
    return res.data;
  }
};
