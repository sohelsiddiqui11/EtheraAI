const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ProjectMember = sequelize.define('ProjectMember', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  project_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM('admin', 'member'),
    defaultValue: 'member',
    allowNull: false
  }
}, {
  tableName: 'project_members',
  timestamps: true,
  createdAt: 'joined_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['project_id', 'user_id']
    }
  ]
});

module.exports = ProjectMember;
