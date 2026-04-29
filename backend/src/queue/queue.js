const Queue = require('bull');
const config = require('../config');

const taskQueue = new Queue('task-processing', {
  redis: {
    host: config.redis.host,
    port: config.redis.port,
    maxRetriesPerRequest: null
  }
});

taskQueue.on('error', (error) => {
  console.error('Queue error:', error);
});

taskQueue.on('failed', (job, error) => {
  console.error(`Job ${job.id} failed:`, error.message);
});

const addTaskToQueue = async (taskId, operation, inputText) => {
  const job = await taskQueue.add(
    {
      taskId: taskId.toString(),
      operation,
      inputText
    },
    {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000
      },
      removeOnComplete: 100,
      removeOnFail: 1000
    }
  );

  return job.id;
};

const getQueue = () => taskQueue;

module.exports = {
  addTaskToQueue,
  getQueue
};
