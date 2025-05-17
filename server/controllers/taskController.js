const Task = require('../models/Task');
const Project = require('../models/Project');
const Activity = require('../models/Activity');

// @desc    Create a new task
// @route   POST /api/tasks
// @access  Private
exports.createTask = async (req, res) => {
  const { title, description, project, assignedTo, status, priority, dueDate, labels } = req.body;

  try {
    // Check if project exists and user has access
    const projectDoc = await Project.findById(project);
    
    if (!projectDoc) {
      return res.status(404).json({ msg: 'Project not found' });
    }

    // Check if user is a member of the project
    const isMember = projectDoc.members.some(
      member => member.user.toString() === req.user.id
    );

    if (!isMember) {
      return res.status(403).json({ msg: 'Access denied to this project' });
    }

    const newTask = new Task({
      title,
      description,
      project,
      assignedTo,
      createdBy: req.user.id,
      status: status || 'todo',
      priority: priority || 'medium',
      dueDate,
      labels: labels || []
    });

    const task = await newTask.save();

    // Log activity
    const activity = new Activity({
      user: req.user.id,
      action: 'created',
      entityType: 'task',
      entityId: task._id,
      project: project
    });
    await activity.save();

    res.json(task);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @desc    Get all tasks for a project
// @route   GET /api/tasks/project/:projectId
// @access  Private
exports.getTasksByProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    
    // Verify project exists and user has access
    const project = await Project.findById(projectId);
    
    if (!project) {
      return res.status(404).json({ msg: 'Project not found' });
    }

    // Check if user is a member of the project
    const isMember = project.members.some(
      member => member.user.toString() === req.user.id
    );

    if (!isMember) {
      return res.status(403).json({ msg: 'Access denied to this project' });
    }
    
    const tasks = await Task.find({
      project: projectId
    })
    .sort({ createdAt: -1 })
    .populate('assignedTo', 'name email');

    res.json(tasks);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @desc    Get all tasks assigned to user
// @route   GET /api/tasks/assigned
// @access  Private
exports.getAssignedTasks = async (req, res) => {
  try {
    const tasks = await Task.find({
      assignedTo: req.user.id
    })
    .sort({ updatedAt: -1 })
    .populate('project', 'name');

    res.json(tasks);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @desc    Get single task by ID
// @route   GET /api/tasks/:id
// @access  Private
exports.getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('project', 'name')
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .populate('comments.user', 'name email');

    if (!task) {
      return res.status(404).json({ msg: 'Task not found' });
    }

    // Check if user has access to the project
    const project = await Project.findById(task.project);
    const isMember = project.members.some(
      member => member.user.toString() === req.user.id
    );

    if (!isMember) {
      return res.status(403).json({ msg: 'Access denied to this task' });
    }

    res.json(task);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Task not found' });
    }
    res.status(500).send('Server error');
  }
};

// @desc    Update task
// @route   PUT /api/tasks/:id
// @access  Private
exports.updateTask = async (req, res) => {
  const { title, description, assignedTo, status, priority, dueDate, labels } = req.body;

  try {
    let task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ msg: 'Task not found' });
    }

    // Check if user has access to the project
    const project = await Project.findById(task.project);
    const isMember = project.members.some(
      member => member.user.toString() === req.user.id
    );

    if (!isMember) {
      return res.status(403).json({ msg: 'Access denied to this task' });
    }

    // Update fields
    if (title) task.title = title;
    if (description !== undefined) task.description = description;
    if (assignedTo !== undefined) task.assignedTo = assignedTo;
    if (status) task.status = status;
    if (priority) task.priority = priority;
    if (dueDate !== undefined) task.dueDate = dueDate;
    if (labels) task.labels = labels;
    task.updatedAt = Date.now();

    await task.save();

    // Log activity
    const activity = new Activity({
      user: req.user.id,
      action: 'updated',
      entityType: 'task',
      entityId: task._id,
      project: task.project
    });
    await activity.save();

    res.json(task);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Task not found' });
    }
    res.status(500).send('Server error');
  }
};

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private
exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ msg: 'Task not found' });
    }

    // Check if user has access to the project
    const project = await Project.findById(task.project);
    const isMember = project.members.some(
      member => member.user.toString() === req.user.id
    );

    // Only project leads or task creator can delete tasks
    const isLead = project.members.some(
      member => member.user.toString() === req.user.id && member.role === 'lead'
    );
    
    const isCreator = task.createdBy.toString() === req.user.id;

    if (!isMember || (!isLead && !isCreator)) {
      return res.status(403).json({ msg: 'Not authorized to delete this task' });
    }

    await task.remove();

    // Log activity
    const activity = new Activity({
      user: req.user.id,
      action: 'deleted',
      entityType: 'task',
      entityId: req.params.id,
      project: task.project
    });
    await activity.save();

    res.json({ msg: 'Task deleted' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Task not found' });
    }
    res.status(500).send('Server error');
  }
};

// @desc    Add comment to task
// @route   POST /api/tasks/:id/comments
// @access  Private
exports.addComment = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ msg: 'Comment text is required' });
    }

    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ msg: 'Task not found' });
    }

    // Check if user has access to the project
    const project = await Project.findById(task.project);
    const isMember = project.members.some(
      member => member.user.toString() === req.user.id
    );

    if (!isMember) {
      return res.status(403).json({ msg: 'Access denied to this task' });
    }

    // Add comment
    const newComment = {
      user: req.user.id,
      text,
      createdAt: Date.now()
    };

    task.comments.unshift(newComment);
    task.updatedAt = Date.now();

    await task.save();

    // Log activity
    const activity = new Activity({
      user: req.user.id,
      action: 'commented',
      entityType: 'task',
      entityId: task._id,
      project: task.project
    });
    await activity.save();

    res.json(task.comments);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @desc    Delete comment from task
// @route   DELETE /api/tasks/:id/comments/:commentId
// @access  Private
exports.deleteComment = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ msg: 'Task not found' });
    }

    // Check if comment exists
    const comment = task.comments.find(
      comment => comment._id.toString() === req.params.commentId
    );

    if (!comment) {
      return res.status(404).json({ msg: 'Comment not found' });
    }

    // Check if user is comment author or project lead
    const isAuthor = comment.user.toString() === req.user.id;
    
    if (!isAuthor) {
      const project = await Project.findById(task.project);
      const isLead = project.members.some(
        member => member.user.toString() === req.user.id && member.role === 'lead'
      );
      
      if (!isLead) {
        return res.status(403).json({ msg: 'Not authorized to delete this comment' });
      }
    }

    // Remove comment
    task.comments = task.comments.filter(
      comment => comment._id.toString() !== req.params.commentId
    );
    task.updatedAt = Date.now();

    await task.save();

    res.json(task.comments);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
}; 