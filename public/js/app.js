// Simple SPA Router
class Router {
  constructor() {
    this.routes = {};
    window.addEventListener('hashchange', this.handleRoute.bind(this));
  }

  add(path, handler) {
    this.routes[path] = handler;
  }

  handleRoute() {
    let hash = window.location.hash || '#/dashboard';
    const path = hash.split('?')[0];
    
    // Auth guard
    const isAuthRoute = path === '#/login' || path === '#/signup';
    const isAuthenticated = !!window.api.token;

    if (!isAuthenticated && !isAuthRoute) {
      window.location.hash = '#/login';
      return;
    }

    if (isAuthenticated && isAuthRoute) {
      window.location.hash = '#/dashboard';
      return;
    }

    // Toggle main app UI vs Auth UI
    document.getElementById('auth-container').classList.toggle('hidden', isAuthenticated);
    document.getElementById('app-container').classList.toggle('hidden', !isAuthenticated);

    // Update active nav
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    const baseRoute = path.split('/')[1];
    const navItem = document.getElementById(`nav-${baseRoute}`);
    if (navItem) navItem.classList.add('active');

    // Find and execute handler
    // Simple dynamic param matching for #/projects/:id
    let match = null;
    let handler = null;

    for (let route in this.routes) {
      const routeParts = route.split('/');
      const pathParts = path.split('/');

      if (routeParts.length === pathParts.length) {
        let isMatch = true;
        let params = {};

        for (let i = 0; i < routeParts.length; i++) {
          if (routeParts[i].startsWith(':')) {
            params[routeParts[i].substring(1)] = pathParts[i];
          } else if (routeParts[i] !== pathParts[i]) {
            isMatch = false;
            break;
          }
        }

        if (isMatch) {
          match = params;
          handler = this.routes[route];
          break;
        }
      }
    }

    if (handler) {
      handler(match);
    } else {
      // 404 fallback
      document.getElementById('content-area').innerHTML = '<h2>404 - Page Not Found</h2>';
    }
  }

  navigate(path) {
    window.location.hash = path;
  }
}

window.router = new Router();

// Init App
document.addEventListener('DOMContentLoaded', async () => {
  // Sidebar toggle
  const sidebar = document.getElementById('sidebar');
  document.getElementById('sidebar-toggle')?.addEventListener('click', () => {
    sidebar.classList.toggle('open');
  });

  // Logout
  document.getElementById('logout-btn')?.addEventListener('click', () => {
    window.api.setToken(null);
    window.location.hash = '#/login';
  });

  // Load user data if authenticated
  if (window.api.token) {
    try {
      const data = await window.api.getMe();
      document.getElementById('user-name').textContent = data.user.name;
      document.getElementById('user-role').textContent = data.user.email;
      document.getElementById('user-avatar').textContent = data.user.name.charAt(0).toUpperCase();
    } catch (e) {
      console.error('Failed to load user', e);
    }
  }

  // Define routes
  window.router.add('#/login', window.renderLogin);
  window.router.add('#/signup', window.renderSignup);
  window.router.add('#/dashboard', window.renderDashboard);
  window.router.add('#/projects', window.renderProjects);
  window.router.add('#/projects/:id', window.renderProjectDetail);

  // Trigger initial route
  window.router.handleRoute();
});
