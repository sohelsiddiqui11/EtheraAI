const { ProjectMember } = require('../models');

/**
 * Middleware to check if the user is a member of the project.
 * Expects req.params.id or req.params.projectId to contain the project UUID.
 */
const requireProjectMember = async (req, res, next) => {
  try {
    const projectId = req.params.id || req.params.projectId;
    
    if (!projectId) {
      return res.status(400).json({ error: 'Project ID is required.' });
    }

    const membership = await ProjectMember.findOne({
      where: {
        project_id: projectId,
        user_id: req.user.id
      }
    });

    if (!membership) {
      return res.status(403).json({ error: 'Access denied. You are not a member of this project.' });
    }

    req.membership = membership;
    next();
  } catch (error) {
    console.error('Role check error:', error);
    res.status(500).json({ error: 'Authorization error.' });
  }
};

/**
 * Middleware to check if the user has an admin role in the project.
 * Must be used after requireProjectMember or separately.
 */
const requireProjectAdmin = async (req, res, next) => {
  try {
    const projectId = req.params.id || req.params.projectId;
    
    if (!projectId) {
      return res.status(400).json({ error: 'Project ID is required.' });
    }

    const membership = await ProjectMember.findOne({
      where: {
        project_id: projectId,
        user_id: req.user.id
      }
    });

    if (!membership) {
      return res.status(403).json({ error: 'Access denied. You are not a member of this project.' });
    }

    if (membership.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    }

    req.membership = membership;
    next();
  } catch (error) {
    console.error('Role check error:', error);
    res.status(500).json({ error: 'Authorization error.' });
  }
};

module.exports = { requireProjectMember, requireProjectAdmin };
