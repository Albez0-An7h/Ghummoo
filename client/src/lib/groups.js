import api from './api';

// Groups the signed-in user can open, with unread counts (server checks membership).
export const getMyGroups = () => api.get('/groups/mine');
