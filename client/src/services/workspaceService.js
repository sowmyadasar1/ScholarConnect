import api from './api';

export const workspaceService = {
  /** Load full workspace */
  getWorkspace: async (teamId) => {
    const { data } = await api.get(`/workspace/${teamId}`);
    return data;
  },

  /** Create a Kanban task */
  createTask: async (teamId, task) => {
    const { data } = await api.post(`/workspace/${teamId}/tasks`, task);
    return data;
  },

  /** Update task (status, assignment, etc.) */
  updateTask: async (teamId, taskId, updates) => {
    const { data } = await api.put(`/workspace/${teamId}/tasks/${taskId}`, updates);
    return data;
  },

  /** Delete task */
  deleteTask: async (teamId, taskId) => {
    const { data } = await api.delete(`/workspace/${teamId}/tasks/${taskId}`);
    return data;
  },

  /** Send chat message */
  sendMessage: async (teamId, content, type = 'chat') => {
    const { data } = await api.post(`/workspace/${teamId}/messages`, { content, type });
    return data;
  },

  /** Get chat messages */
  getMessages: async (teamId, params = {}) => {
    const { data } = await api.get(`/workspace/${teamId}/messages`, { params });
    return data;
  },

  /** Create shared note */
  createNote: async (teamId, note) => {
    const { data } = await api.post(`/workspace/${teamId}/notes`, note);
    return data;
  },

  /** Update note */
  updateNote: async (teamId, noteId, updates) => {
    const { data } = await api.put(`/workspace/${teamId}/notes/${noteId}`, updates);
    return data;
  },

  /** Delete note */
  deleteNote: async (teamId, noteId) => {
    const { data } = await api.delete(`/workspace/${teamId}/notes/${noteId}`);
    return data;
  },

  /** Update Repo URL */
  updateRepo: async (teamId, github_repo_url) => {
    const { data } = await api.put(`/workspace/${teamId}/repo`, { github_repo_url });
    return data;
  },
};
