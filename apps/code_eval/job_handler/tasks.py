import os
import sys
from time import sleep

from rq import Queue, get_current_job
from rq.registry import ScheduledJobRegistry

from ai.llm.base import AIModel
from ai.llm.evaluation import evaluate
from utils.custom_exception import InputTokenLimited
from job_handler.data import get_submission_by_id
from config.grpc_config import EvaluateClient
from config.redis_connection import RedisSingleton


def process_submission(submission_id: int):
    print(f"Processing submission {submission_id} in PID {os.getpid()}")
    submission = get_submission_by_id(submission_id)
    submission_url = submission["resouce_url"]
    submission_rubric = submission["rubric"]

    q = Queue("submission_queue", connection=RedisSingleton.get_instance())
    job = get_current_job(connection=RedisSingleton.get_instance())

    try:
        result = evaluate(
            resource_url=submission_url,
            rubrics=submission_rubric,
            ai_model=AIModel.GROK_CODE_FAST_1,
        )
        # result = {
        #     "scores": [10.0, 10.0, 56.0],
        #     "feedback": "Your code demonstrates a clear understanding of recursion and modular programming. The `factorial` function correctly calculates factorials for non-negative integers using a recursive approach, and variable names are meaningful.\n\nFor improvement, consider handling negative input in the `factorial` function. Currently, negative numbers lead to infinite recursion. Adding input validation or defining specific behavior for such cases would make the program more robust. Also, be mindful of potential `int` overflow for very large input numbers.",
        #     "input_token": 1234,
        #     "output_token": 5678,
        # }

        client = EvaluateClient() #have default already
        response = client.evaluate_submission(
            submission_id=submission_id,
            scores=result.get("scores", []),
            feedback=result.get("feedback", ""),
            input_token=result.get("input_token", 0),  
            output_token=result.get("output_token", 0),
        )

        print(f"Evaluation response: {response}")
        sleep(30)
    except InputTokenLimited as itl:
        registry = ScheduledJobRegistry(queue=q)
        registry.remove(job)
        print(f"Submission {submission_id} failed: {itl}")
    except Exception as e:
        code = getattr(e, "code", None) or getattr(
            getattr(e, "error", {}), "code", None
        )
        if code is not None and int(code) >= 400:
            # Remove from retries
            registry = ScheduledJobRegistry(queue=q)
            registry.remove(job)

            print(f"Job {submission_id} failed with code {code}, no retry: {e}")
        else:
            raise e


if __name__ == "__main__":
    process_submission(2)
