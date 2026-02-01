# redis_connection.py
from redis import Redis

class RedisSingleton:
    _instance = None

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = Redis(host="localhost", port=6379, db=0)
        return cls._instance
