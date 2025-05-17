const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const projectController = require('../controllers/projectController');

// @route   POST api/projects
// @desc    Create a new project
// @access  Private
router.post('/', auth, projectController.createProject);

// @route   GET api/projects
// @desc    Get all projects for user
// @access  Private
router.get('/', auth, projectController.getProjects);

// @route   GET api/projects/workspace/:workspaceId
// @desc    Get all projects in a workspace
// @access  Private
router.get('/workspace/:workspaceId', auth, projectController.getProjectsByWorkspace);

// @route   GET api/projects/:id
// @desc    Get project by ID
// @access  Private
router.get('/:id', auth, projectController.getProjectById);

// @route   PUT api/projects/:id
// @desc    Update a project
// @access  Private
router.put('/:id', auth, projectController.updateProject);

// @route   DELETE api/projects/:id
// @desc    Delete a project
// @access  Private
router.delete('/:id', auth, projectController.deleteProject);

// @route   POST api/projects/:id/members
// @desc    Add a member to a project
// @access  Private
router.post('/:id/members', auth, projectController.addProjectMember);

// @route   DELETE api/projects/:id/members/:userId
// @desc    Remove a member from a project
// @access  Private
router.delete('/:id/members/:userId', auth, projectController.removeProjectMember);

module.exports = router; 