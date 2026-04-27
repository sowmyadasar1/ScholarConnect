import api from './api';

export const requestService = {
  /**
   * Get all sent requests (collab applications, mentor requests, team invites sent).
   * Route: GET /api/requests/sent
   */
  getSentRequests: async () => {
    const response = await api.get('/requests/sent');
    return response.data.requests || [];
  },

  /**
   * Get all received requests (collab join requests, mentor requests, team invites received).
   * Route: GET /api/requests/received
   */
  getReceivedRequests: async () => {
    const response = await api.get('/requests/received');
    return response.data.requests || [];
  },

  /**
   * Respond to a received request.
   * Route: PUT /api/requests/:id/respond
   */
  respondToRequest: async (requestId, requestType, status) => {
    const response = await api.put(`/requests/${requestId}/respond`, { request_type: requestType, status });
    return response.data;
  },
  
  /**
   * Cancel a sent request or invite.
   * Route: DELETE /api/requests/:id
   */
  cancelRequest: async (requestId, requestType) => {
    const response = await api.delete(`/requests/${requestId}?type=${requestType}`);
    return response.data;
  }
};
