const express = require('express');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');
const { Task, Project, ProjectMember, User } = require('../models');
const auth = require('../middleware/auth');
const { requireProjectMember, requireProjectAdmin } = require('../middleware/roleCheck');
const { taskValidation, taskUpdateValidation } = require('../validators');

const router = express.Router({ mergeParams: true });

// GET /api/projects/:id/tasks — list tasks with filters
router.get('/', auth, requireProjectMember, async (req, res) => {
  try {
    const { status, priority, assigned_to, search } = req.query;
    const where = { project_id: req.params.id };

    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (assigned_to) where.assigned_to = assigned_to;
    if (search) {
      where[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } }
      ];
    }

    const tasks = await Task.findAll({
      where,
      include: [
        { model: User, as: 'assignee', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'taskCreator', attributes: ['id', 'name', 'email'] }
      ],
      order: [
        ['status', 'ASC'],
        ['priority', 'DESC'],
        ['created_at', 'DESC']
      ]
    });

    res.json({ tasks });
  } catch (error) {
    console.error('List tasks error:', error);
    res.status(500).json({ error: 'Failed to fetch tasks.' });
  }
});

// POST /api/projects/:id/tasks — create task
router.post('/', auth, requireProjectMember, taskValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, status, priority, due_date, assigned_to } = req.body;

    // Validate assigned_to is a project member
    if (assigned_to) {
      const isMember = await ProjectMember.findOne({
        where: { project_id: req.params.id, user_id: assigned_to }
      });
      if (!isMember) {
        return res.status(400).json({ error: 'Assigned user is not a member of this project.' });
      }
    }

    const task = await Task.create({
      title,
      description: description || '',
      project_id: req.params.id,
      assigned_to: assigned_to || null,
      created_by: req.user.id,
      status: status || 'todo',
      priority: priority || 'medium',
      due_date: due_date || null
    });

    // Fetch with associations
    const fullTask = await Task.findByPk(task.id, {
      include: [
        { model: User, as: 'assignee', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'taskCreator', attributes: ['id', 'name', 'email'] }
      ]
    });

    res.status(201).json({
      message: 'Task created successfully',
      task: fullTask
    });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ error: 'Failed to create task.' });
  }
});

// GET /api/tasks/:taskId — get task detail
router.get('/:taskId', auth, async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.taskId, {
      include: [
        { model: User, as: 'assignee', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'taskCreator', attributes: ['id', 'name', 'email'] },
        { model: Project, as: 'project', attributes: ['id', 'name'] }
      ]
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    // Check membership
    const isMember = await ProjectMember.findOne({
      where: { project_id: task.project_id, user_id: req.user.id }
    });
    if (!isMember) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    res.json({ task });
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({ error: 'Failed to fetch task.' });
  }
});

// PUT /api/tasks/:taskId — update task
router.put('/:taskId', auth, taskUpdateValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const task = await Task.findByPk(req.params.taskId);
    if (!task) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    // Check membership
    const isMember = await ProjectMember.findOne({
      where: { project_id: task.project_id, user_id: req.user.id }
    });
    if (!isMember) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    const { title, description, status, priority, due_date, assigned_to } = req.body;

    // Validate assigned_to
    if (assigned_to) {
      const assigneeMember = await ProjectMember.findOne({
        where: { project_id: task.project_id, user_id: assigned_to }
      });
      if (!assigneeMember) {
        return res.status(400).json({ error: 'Assigned user is not a member of this project.' });
      }
    }

    const updates = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (status !== undefined) updates.status = status;
    if (priority !== undefined) updates.priority = priority;
    if (due_date !== undefined) updates.due_date = due_date;
    if (assigned_to !== undefined) updates.assigned_to = assigned_to;

    await task.update(updates);

    const fullTask = await Task.findByPk(task.id, {
      include: [
        { model: User, as: 'assignee', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'taskCreator', attributes: ['id', 'name', 'email'] }
      ]
    });

    res.json({
      message: 'Task updated successfully',
      task: fullTask
    });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ error: 'Failed to update task.' });
  }
});

// DELETE /api/tasks/:taskId — delete task (admin only)
router.delete('/:taskId', auth, async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.taskId);
    if (!task) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    // Check admin role
    const membership = await ProjectMember.findOne({
      where: { project_id: task.project_id, user_id: req.user.id }
    });
    if (!membership || membership.role !== 'admin') {
      return res.status(403).json({ error: 'Only project admins can delete tasks.' });
    }

    await task.destroy();
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ error: 'Failed to delete task.' });
  }
});

module.exports = router;
