window.renderLogin = () => {
  const container = document.getElementById('auth-card');
  container.className = 'auth-card glass-panel';
  container.innerHTML = `
    <h2>Welcome Back</h2>
    <form id="login-form">
      <div class="form-group">
        <label>Email</label>
        <input type="email" id="login-email" class="form-control" required placeholder="name@company.com">
      </div>
      <div class="form-group">
        <label>Password</label>
        <input type="password" id="login-password" class="form-control" required placeholder="••••••••">
      </div>
      <button type="submit" class="btn btn-primary" id="login-btn">Log In</button>
    </form>
    <div class="auth-links">
      Don't have an account? <a href="#/signup">Sign up</a>
    </div>
  `;

  document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('login-btn');
    btn.textContent = 'Logging in...';
    btn.disabled = true;

    try {
      const email = document.getElementById('login-email').value;
      const password = document.getElementById('login-password').value;
      
      const res = await window.api.login(email, password);
      window.api.setToken(res.token);
      
      // Update user info
      document.getElementById('user-name').textContent = res.user.name;
      document.getElementById('user-role').textContent = res.user.email;
      document.getElementById('user-avatar').textContent = res.user.name.charAt(0).toUpperCase();
      
      window.showToast('Login successful', 'success');
      window.location.hash = '#/dashboard';
    } catch (error) {
      window.showToast(error.message, 'error');
      btn.textContent = 'Log In';
      btn.disabled = false;
    }
  });
};

window.renderSignup = () => {
  const container = document.getElementById('auth-card');
  container.className = 'auth-card glass-panel';
  container.innerHTML = `
    <h2>Create Account</h2>
    <form id="signup-form">
      <div class="form-group">
        <label>Full Name</label>
        <input type="text" id="signup-name" class="form-control" required placeholder="John Doe">
      </div>
      <div class="form-group">
        <label>Email</label>
        <input type="email" id="signup-email" class="form-control" required placeholder="name@company.com">
      </div>
      <div class="form-group">
        <label>Password</label>
        <input type="password" id="signup-password" class="form-control" required minlength="6" placeholder="••••••••">
      </div>
      <button type="submit" class="btn btn-primary" id="signup-btn">Sign Up</button>
    </form>
    <div class="auth-links">
      Already have an account? <a href="#/login">Log in</a>
    </div>
  `;

  document.getElementById('signup-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('signup-btn');
    btn.textContent = 'Creating account...';
    btn.disabled = true;

    try {
      const name = document.getElementById('signup-name').value;
      const email = document.getElementById('signup-email').value;
      const password = document.getElementById('signup-password').value;
      
      const res = await window.api.signup(name, email, password);
      window.api.setToken(res.token);
      
      // Update user info
      document.getElementById('user-name').textContent = res.user.name;
      document.getElementById('user-role').textContent = res.user.email;
      document.getElementById('user-avatar').textContent = res.user.name.charAt(0).toUpperCase();
      
      window.showToast('Account created successfully', 'success');
      window.location.hash = '#/dashboard';
    } catch (error) {
      window.showToast(error.message, 'error');
      btn.textContent = 'Sign Up';
      btn.disabled = false;
    }
  });
};
