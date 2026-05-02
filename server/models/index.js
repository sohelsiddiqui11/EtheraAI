const sequelize = require('../config/database');
const User = require('./User');
const Project = require('./Project');
const ProjectMember = require('./ProjectMember');
const Task = require('./Task');

// User <-> Project (creator)
User.hasMany(Project, { foreignKey: 'created_by', as: 'createdProjects' });
Project.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

// Project <-> ProjectMember
Project.hasMany(ProjectMember, { foreignKey: 'project_id', as: 'members' });
ProjectMember.belongsTo(Project, { foreignKey: 'project_id', as: 'project' });

// User <-> ProjectMember
User.hasMany(ProjectMember, { foreignKey: 'user_id', as: 'memberships' });
ProjectMember.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Project <-> Task
Project.hasMany(Task, { foreignKey: 'project_id', as: 'tasks' });
Task.belongsTo(Project, { foreignKey: 'project_id', as: 'project' });

// User <-> Task (assigned_to)
User.hasMany(Task, { foreignKey: 'assigned_to', as: 'assignedTasks' });
Task.belongsTo(User, { foreignKey: 'assigned_to', as: 'assignee' });

// User <-> Task (created_by)
User.hasMany(Task, { foreignKey: 'created_by', as: 'createdTasks' });
Task.belongsTo(User, { foreignKey: 'created_by', as: 'taskCreator' });

// Many-to-Many: User <-> Project through ProjectMember
User.belongsToMany(Project, { through: ProjectMember, foreignKey: 'user_id', otherKey: 'project_id', as: 'projects' });
Project.belongsToMany(User, { through: ProjectMember, foreignKey: 'project_id', otherKey: 'user_id', as: 'teamMembers' });

module.exports = {
  sequelize,
  User,
  Project,
  ProjectMember,
  Task
};
