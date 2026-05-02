const { body, param, query } = require('express-validator');

const signupValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Must be a valid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
];

const loginValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Must be a valid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required')
];

const projectValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Project name is required')
    .isLength({ min: 2, max: 200 }).withMessage('Project name must be between 2 and 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 }).withMessage('Description must be less than 2000 characters')
];

const taskValidation = [
  body('title')
    .trim()
    .notEmpty().withMessage('Task title is required')
    .isLength({ min: 2, max: 300 }).withMessage('Task title must be between 2 and 300 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 5000 }).withMessage('Description must be less than 5000 characters'),
  body('status')
    .optional()
    .isIn(['todo', 'in_progress', 'review', 'done']).withMessage('Status must be todo, in_progress, review, or done'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'critical']).withMessage('Priority must be low, medium, high, or critical'),
  body('due_date')
    .optional({ nullable: true })
    .isISO8601().withMessage('Due date must be a valid date'),
  body('assigned_to')
    .optional({ nullable: true })
    .isUUID().withMessage('Assigned to must be a valid user ID')
];

const taskUpdateValidation = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 2, max: 300 }).withMessage('Task title must be between 2 and 300 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 5000 }).withMessage('Description must be less than 5000 characters'),
  body('status')
    .optional()
    .isIn(['todo', 'in_progress', 'review', 'done']).withMessage('Status must be todo, in_progress, review, or done'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'critical']).withMessage('Priority must be low, medium, high, or critical'),
  body('due_date')
    .optional({ nullable: true })
    .isISO8601().withMessage('Due date must be a valid date'),
  body('assigned_to')
    .optional({ nullable: true })
    .isUUID().withMessage('Assigned to must be a valid user ID')
];

const addMemberValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Must be a valid email address')
    .normalizeEmail(),
  body('role')
    .optional()
    .isIn(['admin', 'member']).withMessage('Role must be admin or member')
];

const uuidParam = (paramName) => [
  param(paramName).isUUID().withMessage(`${paramName} must be a valid UUID`)
];

module.exports = {
  signupValidation,
  loginValidation,
  projectValidation,
  taskValidation,
  taskUpdateValidation,
  addMemberValidation,
  uuidParam
};
