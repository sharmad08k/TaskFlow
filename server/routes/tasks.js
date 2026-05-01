const express = require('express');
const { body } = require('express-validator');
const router = express.Router({ mergeParams: true });
const {
  createTask,
  getProjectTasks,
  getTask,
  updateTask,
  deleteTask,
  getDashboard,
} = require('../controllers/taskController');
const { protect, projectAuth } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// Validation rules
const taskValidation = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Task title is required')
    .isLength({ min: 2, max: 200 })
    .withMessage('Title must be 2-200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Invalid priority'),
  body('status')
    .optional()
    .isIn(['todo', 'in_progress', 'review', 'done'])
    .withMessage('Invalid status'),
];

// Task CRUD (within a project context)
router.post('/', projectAuth(), taskValidation, createTask);
router.get('/', projectAuth(), getProjectTasks);
router.get('/:taskId', projectAuth(), getTask);
router.put('/:taskId', projectAuth(), updateTask);
router.delete('/:taskId', projectAuth('admin'), deleteTask);

module.exports = router;
