import api from './api';

const feedbackService = {
  submit: async (feedbackData) => {
    try {
      const response = await api.post('/feedback', feedbackData);
      return response.data;
    } catch (error) {
      console.error('Error submitting feedback:', error);
      throw error;
    }
  }
};

export default feedbackService;
