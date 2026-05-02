const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
  ? 'http://localhost:3000/api'
  : '/api';

class ApiClient {
  constructor() {
    this.token = localStorage.getItem('token');
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }

  async request(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const config = {
      ...options,
      headers
    };

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
      
      // Handle 401 Unauthorized globally
      if (response.status === 401 && endpoint !== '/auth/login') {
        this.setToken(null);
        window.location.hash = '#/login';
        throw new Error('Session expired');
      }

      const data = await response.json();
      
      if (!response.ok) {
        let errorMessage = data.error || 'An error occurred';
        if (data.errors && Array.isArray(data.errors)) {
          errorMessage = data.errors.map(e => e.msg).join(', ');
        }
        throw new Error(errorMessage);
      }

      return data;
    } catch (error) {
      console.error(`API Error (${endpoint}):`, error);
      throw error;
    }
  }

  // Auth
  login(email, password) { return this.request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }); }
  signup(name, email, password) { return this.request('/auth/signup', { method: 'POST', body: JSON.stringify({ name, email, password }) }); }
  getMe() { return this.request('/auth/me'); }

  // Projects
  getProjects() { return this.request('/projects'); }
  getProject(id) { return this.request(`/projects/${id}`); }
  createProject(data) { return this.request('/projects', { method: 'POST', body: JSON.stringify(data) }); }
  updateProject(id, data) { return this.request(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(data) }); }
  deleteProject(id) { return this.request(`/projects/${id}`, { method: 'DELETE' }); }

  // Project Members
  getMembers(projectId) { return this.request(`/projects/${projectId}/members`); }
  addMember(projectId, data) { return this.request(`/projects/${projectId}/members`, { method: 'POST', body: JSON.stringify(data) }); }
  updateMemberRole(projectId, userId, role) { return this.request(`/projects/${projectId}/members/${userId}`, { method: 'PUT', body: JSON.stringify({ role }) }); }
  removeMember(projectId, userId) { return this.request(`/projects/${projectId}/members/${userId}`, { method: 'DELETE' }); }

  // Tasks
  getTasks(projectId, params = {}) { 
    const query = new URLSearchParams(params).toString();
    return this.request(`/projects/${projectId}/tasks${query ? `?${query}` : ''}`); 
  }
  createTask(projectId, data) { return this.request(`/projects/${projectId}/tasks`, { method: 'POST', body: JSON.stringify(data) }); }
  getTask(taskId) { return this.request(`/tasks/${taskId}`); }
  updateTask(taskId, data) { return this.request(`/tasks/${taskId}`, { method: 'PUT', body: JSON.stringify(data) }); }
  deleteTask(taskId) { return this.request(`/tasks/${taskId}`, { method: 'DELETE' }); }

  // Dashboard
  getDashboard() { return this.request('/dashboard'); }
}

window.api = new ApiClient();

// Toast helper
window.showToast = (message, type = 'info') => {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 3500);
};
