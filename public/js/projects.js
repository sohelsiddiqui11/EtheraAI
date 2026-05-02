window.renderProjects = async () => {
  const container = document.getElementById('content-area');
  container.innerHTML = `<div style="text-align:center; padding: 40px; color: var(--text-secondary);">Loading projects...</div>`;

  try {
    const data = await window.api.getProjects();
    const projects = data.projects;

    let html = `
      <div class="page-header">
        <h1 class="page-title">Projects</h1>
        <button class="btn btn-primary" onclick="showCreateProjectModal()">+ New Project</button>
      </div>
    `;

    if (projects.length === 0) {
      html += `<div style="text-align:center; padding: 60px; background: rgba(255,255,255,0.05); border-radius: 16px; border: 1px dashed var(--border-color);">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" stroke-width="1.5" style="margin-bottom: 16px;"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>
        <h3 style="margin-bottom: 8px;">No projects yet</h3>
        <p style="color: var(--text-secondary); margin-bottom: 16px; font-size: 14px;">Create your first project to get started.</p>
        <button class="btn btn-primary" onclick="showCreateProjectModal()">Create Project</button>
      </div>`;
    } else {
      html += `<div class="project-grid">
        ${projects.map(p => `
          <div class="project-card glass-panel" onclick="window.location.hash='#/projects/${p.id}'">
            <div class="project-header">
              <div class="project-title">${p.name}</div>
              <span class="badge" style="background: ${p.myRole === 'admin' ? 'rgba(124, 58, 237, 0.2)' : 'rgba(255,255,255,0.1)'}; color: ${p.myRole === 'admin' ? 'var(--accent-primary)' : 'var(--text-secondary)'};">${p.myRole}</span>
            </div>
            <div class="project-desc">${p.description || 'No description provided.'}</div>
            
            <div style="margin-top: auto; padding-top: 16px;">
              <div style="display: flex; justify-content: space-between; font-size: 12px; color: var(--text-secondary); margin-bottom: 8px;">
                <span>${p.taskCount} Tasks</span>
                <span>${p.progress}%</span>
              </div>
              <div class="progress-bar-container">
                <div class="progress-bar" style="width: ${p.progress}%"></div>
              </div>
              <div class="project-meta" style="margin-top: 16px;">
                <span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg> ${p.memberCount} Members</span>
              </div>
            </div>
          </div>
        `).join('')}
      </div>`;
    }

    // Modal HTML
    html += `
      <div class="modal-overlay" id="project-modal">
        <div class="modal glass-panel">
          <div class="modal-header">
            <h3 style="font-size: 18px; font-weight: 600;">Create Project</h3>
            <button class="modal-close" onclick="hideCreateProjectModal()">&times;</button>
          </div>
          <form id="create-project-form">
            <div class="form-group">
              <label>Project Name</label>
              <input type="text" id="project-name" class="form-control" required placeholder="e.g. Website Redesign">
            </div>
            <div class="form-group">
              <label>Description (Optional)</label>
              <textarea id="project-desc" class="form-control" placeholder="What is this project about?"></textarea>
            </div>
            <div class="modal-actions">
              <button type="button" class="btn btn-outline" onclick="hideCreateProjectModal()">Cancel</button>
              <button type="submit" class="btn btn-primary" id="create-project-btn">Create</button>
            </div>
          </form>
        </div>
      </div>
    `;

    container.innerHTML = html;

    // Attach event listeners
    const form = document.getElementById('create-project-form');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('create-project-btn');
        btn.textContent = 'Creating...';
        btn.disabled = true;

        try {
          const name = document.getElementById('project-name').value;
          const description = document.getElementById('project-desc').value;
          
          await window.api.createProject({ name, description });
          window.showToast('Project created successfully', 'success');
          hideCreateProjectModal();
          window.renderProjects(); // Refresh list
        } catch (error) {
          window.showToast(error.message, 'error');
          btn.textContent = 'Create';
          btn.disabled = false;
        }
      });
    }
  } catch (error) {
    container.innerHTML = `<div style="text-align:center; padding: 40px; color: var(--danger);">Failed to load projects: ${error.message}</div>`;
  }
};

window.showCreateProjectModal = () => {
  document.getElementById('project-modal').classList.add('active');
};

window.hideCreateProjectModal = () => {
  document.getElementById('project-modal').classList.remove('active');
  document.getElementById('create-project-form')?.reset();
};
