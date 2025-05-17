const Project = require('../models/Project');
const Workspace = require('../models/Workspace');
const Activity = require('../models/Activity');

// @desc    Create a new project
// @route   POST /api/projects
// @access  Private
exports.createProject = async (req, res) => {
  const { name, description, workspace, status, startDate, endDate } = req.body;

  try {
    // Check if workspace exists and user has access
    const workspaceDoc = await Workspace.findById(workspace);
    
    if (!workspaceDoc) {
      return res.status(404).json({ msg: 'Workspace not found' });
    }

    // Check if user is a member of the workspace
    const isMember = workspaceDoc.members.some(
      member => member.user.toString() === req.user.id
    );

    if (!isMember) {
      return res.status(403).json({ msg: 'Access denied to this workspace' });
    }

    const newProject = new Project({
      name,
      description,
      workspace,
      owner: req.user.id,
      members: [{ user: req.user.id, role: 'lead' }],
      status: status || 'planning',
      startDate,
      endDate
    });

    const project = await newProject.save();

    // Log activity
    const activity = new Activity({
      user: req.user.id,
      action: 'created',
      entityType: 'project',
      entityId: project._id,
      workspace: workspace
    });
    await activity.save();

    res.json(project);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @desc    Get all projects for user
// @route   GET /api/projects
// @access  Private
exports.getProjects = async (req, res) => {
  try {
    const projects = await Project.find({
      'members.user': req.user.id
    }).sort({ updatedAt: -1 });

    res.json(projects);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @desc    Get all projects in a workspace
// @route   GET /api/projects/workspace/:workspaceId
// @access  Private
exports.getProjectsByWorkspace = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    
    // Verify workspace exists and user has access
    const workspace = await Workspace.findById(workspaceId);
    
    if (!workspace) {
      return res.status(404).json({ msg: 'Workspace not found' });
    }

    // Check if user is a member of the workspace
    const isMember = workspace.members.some(
      member => member.user.toString() === req.user.id
    );

    if (!isMember) {
      return res.status(403).json({ msg: 'Access denied to this workspace' });
    }
    
    const projects = await Project.find({
      workspace: workspaceId
    }).sort({ updatedAt: -1 });

    res.json(projects);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @desc    Get single project by ID
// @route   GET /api/projects/:id
// @access  Private
exports.getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('workspace', 'name')
      .populate('members.user', 'name email');

    if (!project) {
      return res.status(404).json({ msg: 'Project not found' });
    }

    // Check if user is a member of the project
    const isMember = project.members.some(
      member => member.user._id.toString() === req.user.id
    );

    if (!isMember) {
      return res.status(403).json({ msg: 'Access denied to this project' });
    }

    res.json(project);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Project not found' });
    }
    res.status(500).send('Server error');
  }
};

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private
exports.updateProject = async (req, res) => {
  const { name, description, status, startDate, endDate } = req.body;

  try {
    let project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ msg: 'Project not found' });
    }

    // Check user is lead of project or workspace admin
    const isLead = project.members.some(
      member => member.user.toString() === req.user.id && (member.role === 'lead')
    );
    
    const workspace = await Workspace.findById(project.workspace);
    const isWorkspaceAdmin = workspace.members.some(
      member => member.user.toString() === req.user.id && member.role === 'admin'
    );

    if (!isLead && !isWorkspaceAdmin) {
      return res.status(403).json({ msg: 'Not authorized to update project' });
    }

    // Update fields
    if (name) project.name = name;
    if (description !== undefined) project.description = description;
    if (status) project.status = status;
    if (startDate) project.startDate = startDate;
    if (endDate) project.endDate = endDate;
    project.updatedAt = Date.now();

    await project.save();

    // Log activity
    const activity = new Activity({
      user: req.user.id,
      action: 'updated',
      entityType: 'project',
      entityId: project._id,
      workspace: project.workspace
    });
    await activity.save();

    res.json(project);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Project not found' });
    }
    res.status(500).send('Server error');
  }
};

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private
exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ msg: 'Project not found' });
    }

    // Check user is lead of project or workspace admin
    const isLead = project.members.some(
      member => member.user.toString() === req.user.id && member.role === 'lead'
    );
    
    const workspace = await Workspace.findById(project.workspace);
    const isWorkspaceAdmin = workspace.members.some(
      member => member.user.toString() === req.user.id && member.role === 'admin'
    );

    if (!isLead && !isWorkspaceAdmin) {
      return res.status(403).json({ msg: 'Not authorized to delete project' });
    }

    await project.remove();

    // Log activity
    const activity = new Activity({
      user: req.user.id,
      action: 'deleted',
      entityType: 'project',
      entityId: req.params.id,
      workspace: project.workspace
    });
    await activity.save();

    res.json({ msg: 'Project deleted' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Project not found' });
    }
    res.status(500).send('Server error');
  }
};

// @desc    Add member to project
// @route   POST /api/projects/:id/members
// @access  Private
exports.addProjectMember = async (req, res) => {
  const { userId, role } = req.body;

  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ msg: 'Project not found' });
    }

    // Check if user is project lead
    const isLead = project.members.some(
      member => member.user.toString() === req.user.id && member.role === 'lead'
    );
    
    // Or check if user is workspace admin
    const workspace = await Workspace.findById(project.workspace);
    const isWorkspaceAdmin = workspace.members.some(
      member => member.user.toString() === req.user.id && member.role === 'admin'
    );

    if (!isLead && !isWorkspaceAdmin) {
      return res.status(403).json({ msg: 'Not authorized to add members' });
    }

    // Check if user is a member of the workspace
    const isWorkspaceMember = workspace.members.some(
      member => member.user.toString() === userId
    );

    if (!isWorkspaceMember) {
      return res.status(400).json({ msg: 'User must be a workspace member first' });
    }

    // Check if user is already a member of the project
    const alreadyMember = project.members.some(
      member => member.user.toString() === userId
    );

    if (alreadyMember) {
      return res.status(400).json({ msg: 'User is already a member of this project' });
    }

    project.members.push({ user: userId, role: role || 'member' });
    await project.save();

    // Log activity
    const activity = new Activity({
      user: req.user.id,
      action: 'added_member',
      entityType: 'project',
      entityId: project._id,
      affectedUser: userId,
      workspace: project.workspace
    });
    await activity.save();

    res.json(project);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @desc    Remove member from project
// @route   DELETE /api/projects/:id/members/:userId
// @access  Private
exports.removeProjectMember = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ msg: 'Project not found' });
    }

    // Check if user is project lead
    const isLead = project.members.some(
      member => member.user.toString() === req.user.id && member.role === 'lead'
    );
    
    // Or check if user is workspace admin
    const workspace = await Workspace.findById(project.workspace);
    const isWorkspaceAdmin = workspace.members.some(
      member => member.user.toString() === req.user.id && member.role === 'admin'
    );

    if (!isLead && !isWorkspaceAdmin) {
      return res.status(403).json({ msg: 'Not authorized to remove members' });
    }

    // Prevent removal of the last project lead
    const isTargetLead = project.members.some(
      member => member.user.toString() === req.params.userId && member.role === 'lead'
    );

    const leadCount = project.members.filter(member => member.role === 'lead').length;

    if (isTargetLead && leadCount <= 1) {
      return res.status(400).json({ msg: 'Cannot remove the only project lead' });
    }

    // Remove the member
    project.members = project.members.filter(
      member => member.user.toString() !== req.params.userId
    );

    await project.save();

    // Log activity
    const activity = new Activity({
      user: req.user.id,
      action: 'removed_member',
      entityType: 'project',
      entityId: project._id,
      affectedUser: req.params.userId,
      workspace: project.workspace
    });
    await activity.save();

    res.json(project);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
}; 