window.renderDashboard = async () => {
  const container = document.getElementById('content-area');
  container.innerHTML = `<div style="text-align:center; padding: 40px; color: var(--text-secondary);">Loading dashboard...</div>`;

  try {
    const data = await window.api.getDashboard();
    const { stats, recentTasks, overdueTasks, projectBreakdown } = data;

    let html = `
      <div class="page-header">
        <h1 class="page-title">Dashboard</h1>
      </div>

      <div class="dashboard-grid">
        <div class="stat-card glass-panel">
          <div class="stat-header">
            <span>Total Projects</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" stroke-width="2"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>
          </div>
          <div class="stat-value">${stats.totalProjects}</div>
        </div>
        <div class="stat-card glass-panel">
          <div class="stat-header">
            <span>Total Tasks</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-secondary)" stroke-width="2"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          </div>
          <div class="stat-value">${stats.totalTasks}</div>
        </div>
        <div class="stat-card glass-panel" style="border-left: 4px solid var(--success);">
          <div class="stat-header">
            <span>Completed</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--success)" stroke-width="2"><path d="M5 13l4 4L19 7"/></svg>
          </div>
          <div class="stat-value">${stats.doneCount}</div>
        </div>
        <div class="stat-card glass-panel" style="border-left: 4px solid var(--danger);">
          <div class="stat-header">
            <span>Overdue</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
          </div>
          <div class="stat-value">${stats.overdueCount}</div>
        </div>
      </div>
    `;

    // Overdue Tasks section (if any)
    if (overdueTasks.length > 0) {
      html += `
        <h2 style="font-size: 18px; margin: 32px 0 16px; color: var(--danger);">Overdue Tasks (${overdueTasks.length})</h2>
        <div style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 32px;">
          ${overdueTasks.map(t => `
            <div class="glass-panel" style="padding: 16px; display: flex; justify-content: space-between; align-items: center; border-left: 4px solid var(--danger);">
              <div>
                <div style="font-weight: 500; margin-bottom: 4px;">${t.title}</div>
                <div style="font-size: 12px; color: var(--text-secondary);">Project: ${t.project.name} • Due: <span style="color: var(--danger); font-weight: 600;">${t.due_date}</span></div>
              </div>
              <a href="#/projects/${t.project_id}" class="btn btn-outline" style="padding: 6px 12px; font-size: 12px;">View</a>
            </div>
          `).join('')}
        </div>
      `;
    }

    // Projects breakdown
    if (projectBreakdown.length > 0) {
      html += `
        <h2 style="font-size: 18px; margin: 32px 0 16px;">Project Progress</h2>
        <div class="project-grid">
          ${projectBreakdown.map(p => `
            <div class="project-card glass-panel" onclick="window.location.hash='#/projects/${p.project.id}'">
              <div class="project-title">${p.project.name}</div>
              <div style="display: flex; justify-content: space-between; font-size: 12px; color: var(--text-secondary); margin-top: 12px;">
                <span>${p.done}/${p.total} Tasks</span>
                <span>${p.progress}%</span>
              </div>
              <div class="progress-bar-container">
                <div class="progress-bar" style="width: ${p.progress}%"></div>
              </div>
              ${p.overdue > 0 ? `<div style="color: var(--danger); font-size: 12px; margin-top: 8px;">${p.overdue} tasks overdue</div>` : ''}
            </div>
          `).join('')}
        </div>
      `;
    }

    container.innerHTML = html;
  } catch (error) {
    container.innerHTML = `<div style="text-align:center; padding: 40px; color: var(--danger);">Failed to load dashboard: ${error.message}</div>`;
  }
};
