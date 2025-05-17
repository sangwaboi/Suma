const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: ['created', 'updated', 'deleted', 'moved', 'assigned', 'commented', 'attached']
  },
  entityType: {
    type: String,
    required: true,
    enum: ['workspace', 'project', 'task', 'comment']
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  details: {
    type: mongoose.Schema.Types.Mixed
  },
  workspace: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace'
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Index for faster querying by workspace and project
activitySchema.index({ workspace: 1, timestamp: -1 });
activitySchema.index({ project: 1, timestamp: -1 });

module.exports = mongoose.model('Activity', activitySchema); 