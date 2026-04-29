const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Task = require('../models/Task');
const auth = require('../middleware/auth');
const { addTaskToQueue } = require('../queue/queue');

const router = express.Router();

router.use(auth);

const validOperations = ['uppercase', 'lowercase', 'reverse', 'word_count'];

router.post(
  '/',
  [
    body('title')
      .trim()
      .notEmpty()
      .withMessage('Title is required')
      .isLength({ max: 200 })
      .withMessage('Title cannot exceed 200 characters'),
    body('inputText')
      .notEmpty()
      .withMessage('Input text is required')
      .isLength({ max: 10000 })
      .withMessage('Input text cannot exceed 10000 characters'),
    body('operation')
      .isIn(validOperations)
      .withMessage(`Operation must be one of: ${validOperations.join(', ')}`)
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { title, inputText, operation } = req.body;

      const task = await Task.create({
        userId: req.userId,
        title,
        inputText,
        operation,
        status: 'pending'
      });

      await addTaskToQueue(task._id, operation, inputText);

      res.status(201).json({
        success: true,
        data: { task }
      });
    } catch (error) {
      console.error('Create task error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while creating task'
      });
    }
  }
);

router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const status = req.query.status;

    const queryFilter = { userId: req.userId };
    if (status && ['pending', 'running', 'success', 'failed'].includes(status)) {
      queryFilter.status = status;
    }

    const [tasks, total] = await Promise.all([
      Task.find(queryFilter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Task.countDocuments(queryFilter)
    ]);

    res.json({
      success: true,
      data: {
        tasks,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching tasks'
    });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, userId: req.userId });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    res.json({
      success: true,
      data: { task }
    });
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching task'
    });
  }
});

module.exports = router;
