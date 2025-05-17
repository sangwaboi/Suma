const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const auth = require('../middlewares/auth');

// @route   POST /api/tasks
// @desc    Create a new task
// @access  Private
router.post('/', auth, taskController.createTask);

// @route   GET /api/tasks/project/:projectId
// @desc    Get all tasks for a project
// @access  Private
router.get('/project/:projectId', auth, taskController.getTasksByProject);

// @route   GET /api/tasks/assigned
// @desc    Get all tasks assigned to the current user
// @access  Private
router.get('/assigned', auth, taskController.getAssignedTasks);

// @route   GET /api/tasks/:id
// @desc    Get task by ID
// @access  Private
router.get('/:id', auth, taskController.getTaskById);

// @route   PUT /api/tasks/:id
// @desc    Update task
// @access  Private
router.put('/:id', auth, taskController.updateTask);

// @route   DELETE /api/tasks/:id
// @desc    Delete task
// @access  Private
router.delete('/:id', auth, taskController.deleteTask);

// @route   POST /api/tasks/:id/comments
// @desc    Add comment to task
// @access  Private
router.post('/:id/comments', auth, taskController.addComment);

// @route   DELETE /api/tasks/:id/comments/:commentId
// @desc    Delete comment from task
// @access  Private
router.delete('/:id/comments/:commentId', auth, taskController.deleteComment);

module.exports = router; 