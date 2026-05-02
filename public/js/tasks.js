window.renderProjectDetail = async (params) => {
  const projectId = params.id;
  const container = document.getElementById('content-area');
  container.innerHTML = `<div style="text-align:center; padding: 40px; color: var(--text-secondary);">Loading project...</div>`;

  try {
    const [projectData, tasksData, membersData] = await Promise.all([
      window.api.getProject(projectId),
      window.api.getTasks(projectId),
      window.api.getMembers(projectId)
    ]);

    const project = projectData.project;
    const tasks = tasksData.tasks;
    const members = membersData.members;
    const isAdmin = project.myRole === 'admin';

    // Store in global for task creation/editing
    window.currentProjectId = projectId;
    window.currentProjectMembers = members;
    window.currentProjectIsAdmin = isAdmin;

    let html = `
      <div style="margin-bottom: 24px;">
        <a href="#/projects" style="color: var(--text-secondary); text-decoration: none; font-size: 14px; display: inline-flex; align-items: center; gap: 4px;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          Back to Projects
        </a>
      </div>

      <div class="page-header" style="align-items: flex-start;">
        <div>
          <h1 class="page-title">${project.name}</h1>
          <p style="color: var(--text-secondary); margin-top: 8px; font-size: 14px;">${project.description || 'No description'}</p>
        </div>
        <div style="display: flex; gap: 12px;">
          ${isAdmin ? `<button class="btn btn-outline" onclick="showMembersModal()">Manage Members</button>` : `<button class="btn btn-outline" onclick="showMembersModal()">View Members</button>`}
          <button class="btn btn-primary" onclick="showTaskModal()">+ New Task</button>
        </div>
      </div>

      <!-- Task Board -->
      <div class="task-board">
        ${renderTaskColumn('To Do', 'todo', tasks)}
        ${renderTaskColumn('In Progress', 'in_progress', tasks)}
        ${renderTaskColumn('Review', 'review', tasks)}
        ${renderTaskColumn('Done', 'done', tasks)}
      </div>

      <!-- Task Modal -->
      <div class="modal-overlay" id="task-modal">
        <div class="modal glass-panel">
          <div class="modal-header">
            <h3 style="font-size: 18px; font-weight: 600;" id="task-modal-title">New Task</h3>
            <button class="modal-close" onclick="hideTaskModal()">&times;</button>
          </div>
          <form id="task-form">
            <input type="hidden" id="task-id">
            <div class="form-group">
              <label>Title</label>
              <input type="text" id="task-title" class="form-control" required placeholder="What needs to be done?">
            </div>
            <div class="form-group">
              <label>Description</label>
              <textarea id="task-desc" class="form-control" placeholder="Add more details..."></textarea>
            </div>
            <div style="display: flex; gap: 16px;">
              <div class="form-group" style="flex: 1;">
                <label>Status</label>
                <select id="task-status" class="form-control">
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="review">Review</option>
                  <option value="done">Done</option>
                </select>
              </div>
              <div class="form-group" style="flex: 1;">
                <label>Priority</label>
                <select id="task-priority" class="form-control">
                  <option value="low">Low</option>
                  <option value="medium" selected>Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>
            <div style="display: flex; gap: 16px;">
              <div class="form-group" style="flex: 1;">
                <label>Assignee</label>
                <select id="task-assignee" class="form-control">
                  <option value="">Unassigned</option>
                  ${members.map(m => `<option value="${m.user.id}">${m.user.name}</option>`).join('')}
                </select>
              </div>
              <div class="form-group" style="flex: 1;">
                <label>Due Date</label>
                <input type="date" id="task-due-date" class="form-control">
              </div>
            </div>
            <div class="modal-actions" style="justify-content: space-between;">
              <button type="button" class="btn btn-outline" style="color: var(--danger); border-color: transparent; display: none;" id="delete-task-btn" onclick="deleteCurrentTask()">Delete Task</button>
              <div style="display: flex; gap: 12px; margin-left: auto;">
                <button type="button" class="btn btn-outline" onclick="hideTaskModal()">Cancel</button>
                <button type="submit" class="btn btn-primary" id="save-task-btn">Save Task</button>
              </div>
            </div>
          </form>
        </div>
      </div>

      <!-- Members Modal -->
      <div class="modal-overlay" id="members-modal">
        <div class="modal glass-panel" style="max-width: 600px;">
          <div class="modal-header">
            <h3 style="font-size: 18px; font-weight: 600;">Project Members</h3>
            <button class="modal-close" onclick="hideMembersModal()">&times;</button>
          </div>
          
          ${isAdmin ? `
            <form id="add-member-form" style="display: flex; gap: 12px; margin-bottom: 24px;">
              <input type="email" id="new-member-email" class="form-control" placeholder="User's email address" required style="flex: 1;">
              <select id="new-member-role" class="form-control" style="width: auto;">
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
              <button type="submit" class="btn btn-primary" id="add-member-btn">Add</button>
            </form>
          ` : ''}

          <div style="max-height: 400px; overflow-y: auto;">
            ${members.map(m => `
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid var(--border-color);">
                <div style="display: flex; align-items: center; gap: 12px;">
                  <div class="user-avatar" style="width: 32px; height: 32px; font-size: 12px;">${m.user.name.charAt(0).toUpperCase()}</div>
                  <div>
                    <div style="font-weight: 500; font-size: 14px;">${m.user.name}</div>
                    <div style="font-size: 12px; color: var(--text-secondary);">${m.user.email}</div>
                  </div>
                </div>
                <div style="display: flex; align-items: center; gap: 12px;">
                  ${isAdmin ? `
                    <select class="form-control" style="padding: 4px 8px; font-size: 12px; width: auto;" onchange="updateMemberRole('${m.user.id}', this.value)">
                      <option value="member" ${m.role === 'member' ? 'selected' : ''}>Member</option>
                      <option value="admin" ${m.role === 'admin' ? 'selected' : ''}>Admin</option>
                    </select>
                    <button class="btn btn-outline" style="padding: 4px 8px; font-size: 12px; color: var(--danger); border-color: transparent;" onclick="removeMember('${m.user.id}')">Remove</button>
                  ` : `
                    <span class="badge" style="background: rgba(255,255,255,0.1);">${m.role}</span>
                  `}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    container.innerHTML = html;

    // Attach form listeners
    document.getElementById('task-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('save-task-btn');
      btn.textContent = 'Saving...';
      btn.disabled = true;

      try {
        const taskId = document.getElementById('task-id').value;
        const taskData = {
          title: document.getElementById('task-title').value,
          description: document.getElementById('task-desc').value,
          status: document.getElementById('task-status').value,
          priority: document.getElementById('task-priority').value,
          assigned_to: document.getElementById('task-assignee').value || null,
          due_date: document.getElementById('task-due-date').value || null
        };

        if (taskId) {
          await window.api.updateTask(taskId, taskData);
          window.showToast('Task updated', 'success');
        } else {
          await window.api.createTask(window.currentProjectId, taskData);
          window.showToast('Task created', 'success');
        }
        
        hideTaskModal();
        window.renderProjectDetail({ id: window.currentProjectId }); // Refresh
      } catch (error) {
        window.showToast(error.message, 'error');
        btn.textContent = 'Save Task';
        btn.disabled = false;
      }
    });

    if (isAdmin) {
      document.getElementById('add-member-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('add-member-btn');
        btn.disabled = true;

        try {
          const email = document.getElementById('new-member-email').value;
          const role = document.getElementById('new-member-role').value;
          
          await window.api.addMember(window.currentProjectId, { email, role });
          window.showToast('Member added', 'success');
          hideMembersModal();
          window.renderProjectDetail({ id: window.currentProjectId }); // Refresh
        } catch (error) {
          window.showToast(error.message, 'error');
          btn.disabled = false;
        }
      });
    }

    // Drag and Drop Logic (Simple implementation)
    // In a real app, use a library like sortablejs, but for now we'll do simple HTML5 drag and drop
    const cards = document.querySelectorAll('.task-card');
    const columns = document.querySelectorAll('.task-column .task-list');

    cards.forEach(card => {
      card.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', card.dataset.id);
        card.style.opacity = '0.5';
      });
      card.addEventListener('dragend', () => {
        card.style.opacity = '1';
      });
    });

    columns.forEach(column => {
      column.addEventListener('dragover', (e) => {
        e.preventDefault();
        column.closest('.task-column').style.border = '1px solid var(--accent-primary)';
      });
      column.addEventListener('dragleave', () => {
        column.closest('.task-column').style.border = 'none';
      });
      column.addEventListener('drop', async (e) => {
        e.preventDefault();
        column.closest('.task-column').style.border = 'none';
        const taskId = e.dataTransfer.getData('text/plain');
        const newStatus = column.closest('.task-column').dataset.status;
        
        if (taskId) {
          try {
            await window.api.updateTask(taskId, { status: newStatus });
            window.renderProjectDetail({ id: window.currentProjectId });
          } catch (error) {
            window.showToast('Failed to move task: ' + error.message, 'error');
          }
        }
      });
    });

  } catch (error) {
    container.innerHTML = `<div style="text-align:center; padding: 40px; color: var(--danger);">Failed to load project: ${error.message}</div>`;
  }
};

function renderTaskColumn(title, status, tasks) {
  const columnTasks = tasks.filter(t => t.status === status);
  
  return `
    <div class="task-column" data-status="${status}">
      <div class="column-header">
        <span>${title}</span>
        <span style="background: rgba(255,255,255,0.1); padding: 2px 8px; border-radius: 12px; font-size: 12px;">${columnTasks.length}</span>
      </div>
      <div class="task-list">
        ${columnTasks.map(t => {
          const isOverdue = t.due_date && new Date(t.due_date) < new Date() && t.status !== 'done';
          return `
          <div class="task-card glass-panel" draggable="true" data-id="${t.id}" onclick='editTask(${JSON.stringify(t).replace(/'/g, "&#39;")})' style="${isOverdue ? 'border-color: var(--danger);' : ''}">
            <div class="badges">
              <span class="badge badge-priority-${t.priority}">${t.priority}</span>
              ${isOverdue ? `<span class="badge" style="background: var(--danger); color: white;">Overdue</span>` : ''}
            </div>
            <div class="task-card-title">${t.title}</div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 12px; font-size: 12px; color: var(--text-secondary);">
              ${t.assignee ? `<div style="display: flex; align-items: center; gap: 6px;"><div class="user-avatar" style="width: 20px; height: 20px; font-size: 10px;">${t.assignee.name.charAt(0).toUpperCase()}</div> ${t.assignee.name.split(' ')[0]}</div>` : '<span>Unassigned</span>'}
              ${t.due_date ? `<span style="${isOverdue ? 'color: var(--danger); font-weight: 500;' : ''}">${new Date(t.due_date).toLocaleDateString(undefined, {month:'short', day:'numeric'})}</span>` : ''}
            </div>
          </div>
        `}).join('')}
      </div>
    </div>
  `;
}

// Modal functions
window.showTaskModal = () => {
  document.getElementById('task-form').reset();
  document.getElementById('task-id').value = '';
  document.getElementById('task-modal-title').textContent = 'New Task';
  document.getElementById('delete-task-btn').style.display = 'none';
  document.getElementById('task-modal').classList.add('active');
};

window.hideTaskModal = () => {
  document.getElementById('task-modal').classList.remove('active');
};

window.editTask = (task) => {
  document.getElementById('task-modal-title').textContent = 'Edit Task';
  document.getElementById('task-id').value = task.id;
  document.getElementById('task-title').value = task.title;
  document.getElementById('task-desc').value = task.description || '';
  document.getElementById('task-status').value = task.status;
  document.getElementById('task-priority').value = task.priority;
  document.getElementById('task-assignee').value = task.assigned_to || '';
  document.getElementById('task-due-date').value = task.due_date || '';
  
  if (window.currentProjectIsAdmin) {
    document.getElementById('delete-task-btn').style.display = 'block';
  } else {
    document.getElementById('delete-task-btn').style.display = 'none';
  }
  
  document.getElementById('task-modal').classList.add('active');
};

window.deleteCurrentTask = async () => {
  if (!confirm('Are you sure you want to delete this task?')) return;
  
  const taskId = document.getElementById('task-id').value;
  try {
    await window.api.deleteTask(taskId);
    window.showToast('Task deleted', 'success');
    hideTaskModal();
    window.renderProjectDetail({ id: window.currentProjectId });
  } catch (error) {
    window.showToast(error.message, 'error');
  }
};

window.showMembersModal = () => {
  document.getElementById('members-modal').classList.add('active');
};

window.hideMembersModal = () => {
  document.getElementById('members-modal').classList.remove('active');
};

window.updateMemberRole = async (userId, role) => {
  try {
    await window.api.updateMemberRole(window.currentProjectId, userId, role);
    window.showToast('Role updated', 'success');
  } catch (error) {
    window.showToast(error.message, 'error');
    // Refresh to revert select element state
    window.renderProjectDetail({ id: window.currentProjectId });
  }
};

window.removeMember = async (userId) => {
  if (!confirm('Remove this member from the project?')) return;
  try {
    await window.api.removeMember(window.currentProjectId, userId);
    window.showToast('Member removed', 'success');
    hideMembersModal();
    window.renderProjectDetail({ id: window.currentProjectId });
  } catch (error) {
    window.showToast(error.message, 'error');
  }
};
