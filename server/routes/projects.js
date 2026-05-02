const express = require('express');
const { validationResult } = require('express-validator');
const { Project, ProjectMember, User, Task } = require('../models');
const auth = require('../middleware/auth');
const { requireProjectMember, requireProjectAdmin } = require('../middleware/roleCheck');
const { projectValidation, uuidParam } = require('../validators');

const router = express.Router();

// GET /api/projects — list user's projects
router.get('/', auth, async (req, res) => {
  try {
    const memberships = await ProjectMember.findAll({
      where: { user_id: req.user.id },
      include: [{
        model: Project,
        as: 'project',
        include: [{
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email']
        }]
      }],
      order: [['joined_at', 'DESC']]
    });

    const projects = await Promise.all(memberships.map(async (m) => {
      const taskCount = await Task.count({ where: { project_id: m.project.id } });
      const memberCount = await ProjectMember.count({ where: { project_id: m.project.id } });
      const doneCount = await Task.count({ where: { project_id: m.project.id, status: 'done' } });
      
      return {
        ...m.project.toJSON(),
        myRole: m.role,
        taskCount,
        memberCount,
        doneCount,
        progress: taskCount > 0 ? Math.round((doneCount / taskCount) * 100) : 0
      };
    }));

    res.json({ projects });
  } catch (error) {
    console.error('List projects error:', error);
    res.status(500).json({ error: 'Failed to fetch projects.' });
  }
});

// POST /api/projects — create project
router.post('/', auth, projectValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description } = req.body;

    const project = await Project.create({
      name,
      description: description || '',
      created_by: req.user.id
    });

    // Auto-add creator as admin
    await ProjectMember.create({
      project_id: project.id,
      user_id: req.user.id,
      role: 'admin'
    });

    res.status(201).json({
      message: 'Project created successfully',
      project: {
        ...project.toJSON(),
        myRole: 'admin',
        taskCount: 0,
        memberCount: 1,
        doneCount: 0,
        progress: 0
      }
    });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ error: 'Failed to create project.' });
  }
});

// GET /api/projects/:id — get project detail
router.get('/:id', auth, requireProjectMember, async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id, {
      include: [{
        model: User,
        as: 'creator',
        attributes: ['id', 'name', 'email']
      }]
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found.' });
    }

    const taskCount = await Task.count({ where: { project_id: project.id } });
    const memberCount = await ProjectMember.count({ where: { project_id: project.id } });
    const doneCount = await Task.count({ where: { project_id: project.id, status: 'done' } });

    res.json({
      project: {
        ...project.toJSON(),
        myRole: req.membership.role,
        taskCount,
        memberCount,
        doneCount,
        progress: taskCount > 0 ? Math.round((doneCount / taskCount) * 100) : 0
      }
    });
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ error: 'Failed to fetch project.' });
  }
});

// PUT /api/projects/:id — update project
router.put('/:id', auth, requireProjectAdmin, projectValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const project = await Project.findByPk(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found.' });
    }

    const { name, description } = req.body;
    await project.update({ name, description });

    res.json({
      message: 'Project updated successfully',
      project: project.toJSON()
    });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ error: 'Failed to update project.' });
  }
});

// DELETE /api/projects/:id — delete project
router.delete('/:id', auth, requireProjectAdmin, async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found.' });
    }

    // Delete all tasks and members first
    await Task.destroy({ where: { project_id: project.id } });
    await ProjectMember.destroy({ where: { project_id: project.id } });
    await project.destroy();

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ error: 'Failed to delete project.' });
  }
});

module.exports = router;
