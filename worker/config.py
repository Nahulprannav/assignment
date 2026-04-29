import os
from dotenv import load_dotenv

load_dotenv()

config = {
    'redis_host': os.getenv('REDIS_HOST', 'localhost'),
    'redis_port': int(os.getenv('REDIS_PORT', 6379)),
    'mongodb_uri': os.getenv('MONGODB_URI', 'mongodb://localhost:27017/ai-task-platform'),
    'worker_queue': os.getenv('WORKER_QUEUE', 'task-processing')
}
