import os
import sys
import json
import logging
from datetime import datetime

import redis
from pymongo import MongoClient
from bson import ObjectId

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from config import config
from tasks import process_task

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class Worker:
    def __init__(self):
        self.redis_client = redis.Redis(
            host=config['redis_host'],
            port=config['redis_port'],
            decode_responses=True
        )
        self.mongo_client = MongoClient(config['mongodb_uri'])
        self.db = self.mongo_client.get_database()
        self.tasks_collection = self.db.tasks
        self.queue_name = config['worker_queue']
        logger.info("Worker initialized successfully")

    def update_task_status(self, task_id, status, result=None, logs='', error=None):
        update_data = {
            'status': status,
            'updatedAt': datetime.utcnow()
        }

        if status == 'running':
            update_data['startedAt'] = datetime.utcnow()
        elif status in ['success', 'failed']:
            update_data['completedAt'] = datetime.utcnow()

        if result is not None:
            update_data['result'] = result

        if logs:
            update_data['logs'] = logs

        if error is not None:
            update_data['error'] = error

        self.tasks_collection.update_one(
            {'_id': ObjectId(task_id)},
            {'$set': update_data}
        )

    def process_job(self, job_data):
        task_id = job_data['taskId']
        operation = job_data['operation']
        input_text = job_data['inputText']

        logger.info(f"Processing task {task_id} with operation {operation}")
        logs = []

        try:
            self.update_task_status(task_id, 'running', logs='Started processing...')

            result = process_task(operation, input_text)
            logs.append(f"Operation {operation} completed successfully")

            self.update_task_status(
                task_id,
                'success',
                result=result,
                logs='\n'.join(logs)
            )
            logger.info(f"Task {task_id} completed successfully")
            return True

        except Exception as e:
            error_msg = str(e)
            logs.append(f"Error: {error_msg}")
            logger.error(f"Task {task_id} failed: {error_msg}")

            self.update_task_status(
                task_id,
                'failed',
                logs='\n'.join(logs),
                error=error_msg
            )
            return False

    def run(self):
        logger.info(f"Worker started, listening on queue: {self.queue_name}")

        while True:
            try:
                result = self.redis_client.blpop(self.queue_name, timeout=5)

                if result:
                    _, raw_job = result
                    job_data = json.loads(raw_job)

                    self.process_job(job_data)

            except redis.ConnectionError as e:
                logger.error(f"Redis connection error: {e}")
                import time
                time.sleep(5)

            except Exception as e:
                logger.error(f"Unexpected error: {e}")
                import time
                time.sleep(1)


if __name__ == '__main__':
    worker = Worker()
    worker.run()
