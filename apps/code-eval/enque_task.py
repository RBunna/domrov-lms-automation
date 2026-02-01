from redis import Redis
from rq import Queue, Retry

from config.redis_connection import RedisSingleton

q = Queue("submission_queue", connection=RedisSingleton.get_instance())
q.delete()
if __name__ == "__main__":
    q.enqueue('job_handler.tasks.process_submission', args=(2,), retry=Retry(max=3))
    # for i in range(9):
    #     print(f"Enqueuing submission {i+1}")
    # print(q.count)

