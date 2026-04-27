import api from './api';

export const copilotService = {
  /**
   * Generate AI analysis for a project.
   * @param {number} projectId
   * @param {'architecture'|'tech_stack'|'readme'|'milestones'|'risks'|'roles'} action
   */
  generate: async (projectId, action, projectData = null) => {
    const { data } = await api.post(`/copilot/${projectId}`, { action, projectData });
    return data;
  }
};
