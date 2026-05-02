const express = require('express');
const { validationResult } = require('express-validator');
const { ProjectMember, User, Project } = require('../models');
const auth = require('../middleware/auth');
const { requireProjectMember, requireProjectAdmin } = require('../middleware/roleCheck');
const { addMemberValidation } = require('../validators');

const router = express.Router({ mergeParams: true });

// GET /api/projects/:id/members — list members
router.get('/', auth, requireProjectMember, async (req, res) => {
  try {
    const members = await ProjectMember.findAll({
      where: { project_id: req.params.id },
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'email']
      }],
      order: [['joined_at', 'ASC']]
    });

    res.json({
      members: members.map(m => ({
        id: m.id,
        user: m.user,
        role: m.role,
        joined_at: m.joined_at
      }))
    });
  } catch (error) {
    console.error('List members error:', error);
    res.status(500).json({ error: 'Failed to fetch members.' });
  }
});

// POST /api/projects/:id/members — add member by email
router.post('/', auth, requireProjectAdmin, addMemberValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, role } = req.body;

    // Find user by email
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ error: 'No user found with this email. They must sign up first.' });
    }

    // Check if already a member
    const existing = await ProjectMember.findOne({
      where: { project_id: req.params.id, user_id: user.id }
    });
    if (existing) {
      return res.status(409).json({ error: 'This user is already a member of the project.' });
    }

    const member = await ProjectMember.create({
      project_id: req.params.id,
      user_id: user.id,
      role: role || 'member'
    });

    res.status(201).json({
      message: 'Member added successfully',
      member: {
        id: member.id,
        user: { id: user.id, name: user.name, email: user.email },
        role: member.role,
        joined_at: member.joined_at
      }
    });
  } catch (error) {
    console.error('Add member error:', error);
    res.status(500).json({ error: 'Failed to add member.' });
  }
});

// PUT /api/projects/:id/members/:userId — change member role
router.put('/:userId', auth, requireProjectAdmin, async (req, res) => {
  try {
    const { role } = req.body;
    if (!role || !['admin', 'member'].includes(role)) {
      return res.status(400).json({ error: 'Role must be admin or member.' });
    }

    const membership = await ProjectMember.findOne({
      where: { project_id: req.params.id, user_id: req.params.userId }
    });

    if (!membership) {
      return res.status(404).json({ error: 'Member not found in this project.' });
    }

    // Prevent demoting yourself if you're the last admin
    if (req.params.userId === req.user.id && role === 'member') {
      const adminCount = await ProjectMember.count({
        where: { project_id: req.params.id, role: 'admin' }
      });
      if (adminCount <= 1) {
        return res.status(400).json({ error: 'Cannot demote the last admin. Promote another member first.' });
      }
    }

    await membership.update({ role });

    res.json({
      message: 'Member role updated successfully',
      membership: { user_id: req.params.userId, role: membership.role }
    });
  } catch (error) {
    console.error('Update member role error:', error);
    res.status(500).json({ error: 'Failed to update member role.' });
  }
});

// DELETE /api/projects/:id/members/:userId — remove member
router.delete('/:userId', auth, requireProjectAdmin, async (req, res) => {
  try {
    // Cannot remove yourself if last admin
    if (req.params.userId === req.user.id) {
      const adminCount = await ProjectMember.count({
        where: { project_id: req.params.id, role: 'admin' }
      });
      if (adminCount <= 1) {
        return res.status(400).json({ error: 'Cannot remove the last admin from the project.' });
      }
    }

    const membership = await ProjectMember.findOne({
      where: { project_id: req.params.id, user_id: req.params.userId }
    });

    if (!membership) {
      return res.status(404).json({ error: 'Member not found in this project.' });
    }

    // Unassign tasks from the removed member
    const { Task } = require('../models');
    await Task.update(
      { assigned_to: null },
      { where: { project_id: req.params.id, assigned_to: req.params.userId } }
    );

    await membership.destroy();

    res.json({ message: 'Member removed successfully' });
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({ error: 'Failed to remove member.' });
  }
});

module.exports = router;
