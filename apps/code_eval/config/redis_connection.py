# redis_connection.py
import os
from redis import Redis


class RedisSingleton:
    _instance = None

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = Redis(
                host=os.getenv("REDIS_HOST"), port=int(os.getenv("REDIS_PORT")), db=0
            )
        return cls._instance
