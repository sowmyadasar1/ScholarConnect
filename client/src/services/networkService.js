import axios from 'axios';

export const networkService = {
  getCollaborators: async () => {
    const res = await axios.get('/api/network/collaborators');
    return res.data.collaborators;
  },

  getMentors: async () => {
    const res = await axios.get('/api/network/mentors');
    return res.data.mentors;
  },

  getInviteSuggestions: async (projectId) => {
    const res = await axios.get(`/api/network/suggestions/${projectId}`);
    return res.data.suggestions;
  },

  inviteCollaborator: async (inviteData) => {
    const res = await axios.post('/api/network/invite-collaborator', inviteData);
    return res.data;
  },

  inviteMentor: async (inviteData) => {
    const res = await axios.post('/api/network/invite-mentor', inviteData);
    return res.data;
  }
};
