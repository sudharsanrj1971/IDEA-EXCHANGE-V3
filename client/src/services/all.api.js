import api from './api';

export const authApi = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (data) => api.post('/auth/register', data),
  googleLogin: (credential) => api.post('/auth/google', { credential }),
  getConfig: () => api.get('/auth/config'),
  logout: () => api.post('/auth/logout'),
  refresh: () => api.post('/auth/refresh'),
  getMe: () => api.get('/users/me'),
};

export const projectApi = {
  createProject: (data) => api.post('/projects', data),
  getProjects: (page, limit, state) => api.get('/projects', { params: { page, limit, state } }),
  getProject: (id) => api.get(`/projects/${id}`),
  updateProject: (id, data) => api.patch(`/projects/${id}`, data),
  transitionState: (id, targetState) => api.patch(`/projects/${id}/state`, { targetState }),
  addCollaborator: (id, institutionalEmail) => api.post(`/projects/${id}/collaborators`, { institutionalEmail }),
};

export const contributionApi = {
  addContribution: (projectId, data) => api.post(`/contributions/projects/${projectId}/contributions`, data),
  getContributions: (projectId) => api.get(`/contributions/projects/${projectId}/contributions`),
  getBlock: (projectId, blockIndex) => api.get(`/contributions/projects/${projectId}/contributions/${blockIndex}`),
  upvoteBlock: (projectId, blockIndex) => api.post(`/scoring/projects/${projectId}/contributions/${blockIndex}/upvote`),
  reviewBlock: (projectId, blockIndex, data) => api.post(`/scoring/projects/${projectId}/contributions/${blockIndex}/review`, data),
};

export const ledgerApi = {
  getChain: (projectId) => api.get(`/ledger/${projectId}`),
  verifyChain: (projectId) => api.get(`/ledger/${projectId}/verify`),
  exportPDF: (projectId) => api.get(`/ledger/${projectId}/export-pdf`, { responseType: 'blob' }),
};

export const governanceApi = {
  proposeAction: (projectId, data) => api.post(`/governance/projects/${projectId}/propose`, data),
  approveAction: (projectId, actionId) => api.post(`/governance/projects/${projectId}/actions/${actionId}/approve`),
  rejectAction: (projectId, actionId) => api.post(`/governance/projects/${projectId}/actions/${actionId}/reject`),
  getPending: (projectId) => api.get(`/governance/projects/${projectId}/pending`),
};

export const fundingApi = {
  getCertified: () => api.get('/funding/projects'),
  expressInterest: (projectId, data) => api.post(`/funding/projects/${projectId}/interest`, data),
  getInterests: (projectId) => api.get(`/funding/projects/${projectId}/interests`),
};

export const adminApi = {
  getAnalytics: () => api.get('/admin/analytics'),
  getRaftStatus: () => api.get('/admin/raft/status'),
  simulateCrash: (nodeId) => api.post('/admin/raft/simulate-crash', { nodeId }),
  getFlags: () => api.get('/admin/flags'),
  resolveFlag: (id) => api.patch(`/admin/flags/${id}`),
  banUser: (id) => api.patch(`/admin/users/${id}/ban`),
  changeRole: (id, role) => api.patch(`/admin/users/${id}/role`, { role }),
  getSecurityLogs: (severity, event) => api.get('/admin/security-logs', { params: { severity, event } }),
};
