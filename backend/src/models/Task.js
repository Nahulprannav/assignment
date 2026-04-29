const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  inputText: {
    type: String,
    required: [true, 'Input text is required'],
    maxlength: [10000, 'Input text cannot exceed 10000 characters']
  },
  operation: {
    type: String,
    required: [true, 'Operation is required'],
    enum: {
      values: ['uppercase', 'lowercase', 'reverse', 'word_count'],
      message: 'Operation must be one of: uppercase, lowercase, reverse, word_count'
    }
  },
  status: {
    type: String,
    enum: ['pending', 'running', 'success', 'failed'],
    default: 'pending',
    index: true
  },
  result: {
    type: String,
    default: null
  },
  logs: {
    type: String,
    default: ''
  },
  error: {
    type: String,
    default: null
  },
  startedAt: {
    type: Date,
    default: null
  },
  completedAt: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

taskSchema.index({ userId: 1, status: 1, createdAt: -1 });
taskSchema.index({ createdAt: -1 });

taskSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Task', taskSchema);
