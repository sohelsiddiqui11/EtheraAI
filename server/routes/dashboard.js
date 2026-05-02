const express = require('express');
const { Op } = require('sequelize');
const { Task, Project, ProjectMember, User } = require('../models');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const memberships = await ProjectMember.findAll({
      where: { user_id: req.user.id },
      attributes: ['project_id']
    });
    const projectIds = memberships.map(m => m.project_id);

    if (projectIds.length === 0) {
      return res.json({
        stats: { totalProjects: 0, totalTasks: 0, todoCount: 0, inProgressCount: 0, reviewCount: 0, doneCount: 0, overdueCount: 0, myTasks: 0, completionRate: 0 },
        recentTasks: [], overdueTasks: [], projectBreakdown: []
      });
    }

    const today = new Date().toISOString().split('T')[0];
    const inProjects = { [Op.in]: projectIds };

    const [totalTasks, todoCount, inProgressCount, reviewCount, doneCount, overdueCount, myTasks] = await Promise.all([
      Task.count({ where: { project_id: inProjects } }),
      Task.count({ where: { project_id: inProjects, status: 'todo' } }),
      Task.count({ where: { project_id: inProjects, status: 'in_progress' } }),
      Task.count({ where: { project_id: inProjects, status: 'review' } }),
      Task.count({ where: { project_id: inProjects, status: 'done' } }),
      Task.count({ where: { project_id: inProjects, due_date: { [Op.lt]: today }, status: { [Op.ne]: 'done' } } }),
      Task.count({ where: { assigned_to: req.user.id, status: { [Op.ne]: 'done' } } })
    ]);

    const recentTasks = await Task.findAll({
      where: { project_id: inProjects },
      include: [
        { model: User, as: 'assignee', attributes: ['id', 'name', 'email'] },
        { model: Project, as: 'project', attributes: ['id', 'name'] }
      ],
      order: [['updated_at', 'DESC']], limit: 10
    });

    const overdueTasks = await Task.findAll({
      where: { project_id: inProjects, due_date: { [Op.lt]: today }, status: { [Op.ne]: 'done' } },
      include: [
        { model: User, as: 'assignee', attributes: ['id', 'name', 'email'] },
        { model: Project, as: 'project', attributes: ['id', 'name'] }
      ],
      order: [['due_date', 'ASC']], limit: 20
    });

    const projectBreakdown = await Promise.all(projectIds.map(async (pid) => {
      const project = await Project.findByPk(pid, { attributes: ['id', 'name'] });
      const total = await Task.count({ where: { project_id: pid } });
      const done = await Task.count({ where: { project_id: pid, status: 'done' } });
      const overdue = await Task.count({ where: { project_id: pid, due_date: { [Op.lt]: today }, status: { [Op.ne]: 'done' } } });
      return { project: project ? project.toJSON() : { id: pid, name: 'Unknown' }, total, done, overdue, progress: total > 0 ? Math.round((done / total) * 100) : 0 };
    }));

    res.json({
      stats: { totalProjects: projectIds.length, totalTasks, todoCount, inProgressCount, reviewCount, doneCount, overdueCount, myTasks, completionRate: totalTasks > 0 ? Math.round((doneCount / totalTasks) * 100) : 0 },
      recentTasks, overdueTasks, projectBreakdown
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data.' });
  }
});

module.exports = router;
