import api from './axios';

// Create a new team
export const createTeam = async (teamData) => {
  const response = await api.post('/teams/create', teamData);
  return response.data;
};

// Join team via invite code
export const joinTeam = async (inviteCode) => {
  const response = await api.post('/teams/join', { inviteCode });
  return response.data;
};

// Leave team
export const leaveTeam = async (teamId) => {
  const response = await api.post(`/teams/${teamId}/leave`);
  return response.data;
};

// Cancel team (leader only)
export const cancelTeam = async (teamId) => {
  const response = await api.delete(`/teams/${teamId}/cancel`);
  return response.data;
};

// Get my teams
export const getMyTeams = async () => {
  const response = await api.get('/teams/my-teams');
  return response.data;
};

// Get team by ID
export const getTeamById = async (teamId) => {
  const response = await api.get(`/teams/${teamId}`);
  return response.data;
};

// Get team by invite code (for preview)
export const getTeamByInviteCode = async (inviteCode) => {
  const response = await api.get(`/teams/invite/${inviteCode}`);
  return response.data;
};
