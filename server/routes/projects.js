const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const {
  createProject,
  getProjects,
  getProject,
  updateProject,
  deleteProject,
  addMember,
  removeMember,
  updateMemberRole,
} = require('../controllers/projectController');
const { protect, projectAuth } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// Validation rules
const projectValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Project name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be 2-100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
];

// Project CRUD
router.post('/', projectValidation, createProject);
router.get('/', getProjects);
router.get('/:id', getProject);
router.put('/:id', projectAuth('admin'), projectValidation, updateProject);
router.delete('/:id', projectAuth('admin'), deleteProject);

// Member management (admin only)
router.post('/:id/members', projectAuth('admin'), addMember);
router.delete('/:id/members/:userId', projectAuth('admin'), removeMember);
router.put('/:id/members/:userId', projectAuth('admin'), updateMemberRole);

module.exports = router;
