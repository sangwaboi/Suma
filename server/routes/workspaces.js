const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const workspaceController = require('../controllers/workspaceController');

// @route   POST api/workspaces
// @desc    Create a new workspace
// @access  Private
router.post('/', auth, workspaceController.createWorkspace);

// @route   GET api/workspaces
// @desc    Get all workspaces for user
// @access  Private
router.get('/', auth, workspaceController.getWorkspaces);

// @route   GET api/workspaces/:id
// @desc    Get workspace by ID
// @access  Private
router.get('/:id', auth, workspaceController.getWorkspaceById);

// @route   PUT api/workspaces/:id
// @desc    Update a workspace
// @access  Private
router.put('/:id', auth, workspaceController.updateWorkspace);

// @route   DELETE api/workspaces/:id
// @desc    Delete a workspace
// @access  Private
router.delete('/:id', auth, workspaceController.deleteWorkspace);

module.exports = router; 