const Workspace = require('../models/Workspace');
const Activity = require('../models/Activity');

// @desc    Create a new workspace
// @route   POST /api/workspaces
// @access  Private
exports.createWorkspace = async (req, res) => {
  const { name, description } = req.body;

  try {
    const newWorkspace = new Workspace({
      name,
      description,
      owner: req.user.id,
      members: [{ user: req.user.id, role: 'admin' }]
    });

    const workspace = await newWorkspace.save();

    // Log activity
    const activity = new Activity({
      user: req.user.id,
      action: 'created',
      entityType: 'workspace',
      entityId: workspace._id,
      workspace: workspace._id
    });
    await activity.save();

    res.json(workspace);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @desc    Get all workspaces for user
// @route   GET /api/workspaces
// @access  Private
exports.getWorkspaces = async (req, res) => {
  try {
    const workspaces = await Workspace.find({
      'members.user': req.user.id
    }).sort({ createdAt: -1 });

    res.json(workspaces);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @desc    Get single workspace by ID
// @route   GET /api/workspaces/:id
// @access  Private
exports.getWorkspaceById = async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.id);

    if (!workspace) {
      return res.status(404).json({ msg: 'Workspace not found' });
    }

    // Check if user is a member of the workspace
    const isMember = workspace.members.some(
      member => member.user.toString() === req.user.id
    );

    if (!isMember) {
      return res.status(403).json({ msg: 'Access denied' });
    }

    res.json(workspace);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Workspace not found' });
    }
    res.status(500).send('Server error');
  }
};

// @desc    Update workspace
// @route   PUT /api/workspaces/:id
// @access  Private
exports.updateWorkspace = async (req, res) => {
  const { name, description } = req.body;

  try {
    let workspace = await Workspace.findById(req.params.id);

    if (!workspace) {
      return res.status(404).json({ msg: 'Workspace not found' });
    }

    // Check user is admin of workspace
    const member = workspace.members.find(
      member => member.user.toString() === req.user.id
    );

    if (!member || member.role !== 'admin') {
      return res.status(403).json({ msg: 'Not authorized to update workspace' });
    }

    // Update fields
    if (name) workspace.name = name;
    if (description) workspace.description = description;
    workspace.updatedAt = Date.now();

    await workspace.save();

    // Log activity
    const activity = new Activity({
      user: req.user.id,
      action: 'updated',
      entityType: 'workspace',
      entityId: workspace._id,
      workspace: workspace._id
    });
    await activity.save();

    res.json(workspace);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Workspace not found' });
    }
    res.status(500).send('Server error');
  }
};

// @desc    Delete workspace
// @route   DELETE /api/workspaces/:id
// @access  Private
exports.deleteWorkspace = async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.id);

    if (!workspace) {
      return res.status(404).json({ msg: 'Workspace not found' });
    }

    // Check user is owner of workspace
    if (workspace.owner.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Not authorized to delete workspace' });
    }

    await workspace.remove();

    // Log activity
    const activity = new Activity({
      user: req.user.id,
      action: 'deleted',
      entityType: 'workspace',
      entityId: req.params.id
    });
    await activity.save();

    res.json({ msg: 'Workspace deleted' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Workspace not found' });
    }
    res.status(500).send('Server error');
  }
}; 