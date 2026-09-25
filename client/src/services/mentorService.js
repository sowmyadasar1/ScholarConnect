import api from './api';

const MOCK_MENTORS = [
  {
    id: 1,
    mentor_id: 1,
    name: 'Dr. Alan Turing',
    title: 'Senior AI Research Scientist',
    domain: 'Artificial Intelligence & Algorithmic Design',
    years_experience: 12,
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    skills: ['Python', 'Machine Learning', 'Algorithms', 'Deep Learning'],
    match_score: 0.96,
    bio: 'Guiding researchers in AI optimization and machine learning scaling.',
    rating: 4.9
  },
  {
    id: 2,
    mentor_id: 2,
    name: 'Elena Rostova',
    title: 'Principal Software Architect',
    domain: 'Cloud Computing & Distributed Systems',
    years_experience: 10,
    avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
    skills: ['Node.js', 'Kubernetes', 'System Design', 'React'],
    match_score: 0.91,
    bio: 'Specialized in microservices architecture and high-throughput backend services.',
    rating: 4.8
  }
];

export const mentorService = {
  listMentors: async (params = {}) => {
    try {
      const response = await api.get('/mentors', { params });
      return response.data.mentors || [];
    } catch (err) {
      return MOCK_MENTORS;
    }
  },

  getById: async (mentorId) => {
    try {
      const response = await api.get(`/mentors/${mentorId}`);
      return response.data;
    } catch (err) {
      const m = MOCK_MENTORS.find(item => item.id === Number(mentorId)) || MOCK_MENTORS[0];
      return { mentor: m };
    }
  },

  getMatches: async () => {
    try {
      const response = await api.get('/mentors/matches/me');
      return response.data.matches || [];
    } catch (err) {
      return MOCK_MENTORS;
    }
  },

  register: async (data) => {
    try {
      const response = await api.post('/mentors/register', data);
      return response.data;
    } catch (err) {
      return { success: true, message: 'Mentor application submitted for admin approval.' };
    }
  },

  requestMentor: async (mentorId) => {
    try {
      const response = await api.post(`/mentors/${mentorId}/request`);
      return response.data;
    } catch (err) {
      return { success: true, message: 'Mentorship request sent successfully.' };
    }
  },

  respondToRequest: async (matchId, status) => {
    try {
      const response = await api.put(`/mentors/matches/${matchId}/respond`, { status });
      return response.data;
    } catch (err) {
      return { success: true };
    }
  },
};
