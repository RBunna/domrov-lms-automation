import os
import sys
from time import sleep

import grpc
from rq import Queue, get_current_job
from rq.registry import ScheduledJobRegistry

from ai.llm.base import AIModel
from ai.llm.evaluation import evaluate
from utils.normalize_ai_scores_auto import normalize_ai_scores_auto
from utils.custom_exception import InputTokenLimited
from config.grpc_config import EvaluateClient
from config.redis_connection import RedisSingleton


def process_submission(submission_id: str):
    client = EvaluateClient()
    print(f"Processing submission {submission_id} in PID {os.getpid()}")

    q = Queue("submission_queue", connection=RedisSingleton.get_instance())
    job = get_current_job(connection=RedisSingleton.get_instance())
    registry = ScheduledJobRegistry(queue=q)

    try:
        # ---- gRPC fetch ----
        submission = client.get_submission_content(submission_id)
        print(f"Fetched submission: {submission}")
        if submission is None:
            print(
                f"Submission {submission_id} not found or AI not enabled, removing job"
            )
            job = get_current_job(connection=RedisSingleton.get_instance())
            job.delete()
            return  # <-- stop execution early

        submission_url = submission["resource_url"]
        submission_rubric = submission["rubric"]
        ai_info = submission["ai"]  # Always present in new NestJS mock

        # ---- Handle SYSTEM mode (provider=domrov) ----
        if ai_info.get("provider") == "domrov":
            print("⚙️ SYSTEM mode detected, using default AI model")
            ai_info=None
            api_key = None
            api_endpoint = None
            provider = None
            ai_model = AIModel.OLLAMA_GPT_OSS  # fallback system AI
        else:
            # USER mode
            api_key = ai_info.get("api_key")
            api_endpoint = ai_info.get("api_endpoint")
            provider = ai_info.get("provider")
            ai_model = ai_info.get("model")

        # ---- Evaluation ----
        raw_response = evaluate(
            submission_id=submission_id,
            resource_url=submission_url,
            rubrics=submission_rubric,
            ai_model=ai_model,
            api_key=api_key,
            api_endpoint=api_endpoint,
            provider=provider,
        )

        print(f"Raw evaluation response: {raw_response}")

        evaluation_data = raw_response.get("result", {})
        ai_scores = evaluation_data.get("scores", [])
        ai_feedback = evaluation_data.get("feedback", "")

        actual_scores = normalize_ai_scores_auto(submission_rubric, ai_scores)

        response = client.evaluate_submission(
            submission_id=submission_id,
            scores=actual_scores,
            feedback=ai_feedback,
            input_token=raw_response.get("input_tokens", 0),
            output_token=raw_response.get("output_tokens", 0),
        )

        print(f"Evaluation response: {response}")
        sleep(30)

    except grpc.RpcError as e:
        registry.remove(job)
        print(f"Submission {submission_id} gRPC failed [{e.code()}]: {e.details()}")

    except InputTokenLimited as itl:
        registry.remove(job)
        print(f"Submission {submission_id} failed: {itl}")

    except Exception as e:
        # Only retry transient errors
        code = getattr(e, "code", None) or getattr(
            getattr(e, "error", {}), "code", None
        )
        if code is not None and int(code) >= 400:
            registry.remove(job)
            print(f"Job {submission_id} failed with code {code}, no retry: {e}")
        else:
            raise
