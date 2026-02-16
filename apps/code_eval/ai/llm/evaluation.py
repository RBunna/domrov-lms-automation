from ai.llm.base import MAX_TOKENS, AIModel
from ai.llm.evaluate_with_llm import get_evaluator
from ai.llm.extract_output import extract_scores_and_feedback_robust
from ai.prompt.prompt import generate_prompt
from utils.custom_exception import InputTokenLimited
from utils.download_file_r2 import downloadFiles
from utils.read_file import process_path
from utils.token_handler import estimate_tokens
import requests


def evaluate(
    submission_id: str,
    resource_url: str,
    rubrics: list[dict],
    user_exclude_files: list[str] = None,
    user_include_files: list[str] = None,
    ai_model: AIModel = AIModel.GEMINI_2_5,
    api_key: str = None,
    api_endpoint: str = None,
    provider: str = None,
):
    """
    Evaluate submission using either system AI or user-provided AI key.

    - SYSTEM AI → get_evaluator
    - USER AI → curl / requests to user's endpoint
    """

    # 1. Download submission files
    filePath = downloadFiles(resource_url, submission_id)
    tree_str, content_str = process_path(
        filePath, user_exclude_files, user_include_files
    )

    # 2. Generate prompt
    final_prompt = generate_prompt(
        rubric=rubrics, tree_view=tree_str, file_contents=content_str
    )

    # 3. Token check
    input_tokens = estimate_tokens(final_prompt, ai_model)
    output_tokens = 0

    if input_tokens >= MAX_TOKENS:
        raise InputTokenLimited("Input tokens exceed maximum allowed limit")

    # 4. SYSTEM AI
    if api_key is None:
        evaluator = get_evaluator(ai_model)
        result = evaluator.evaluate(final_prompt)
        output_tokens = estimate_tokens(result, ai_model)

    # 5. USER AI
    else:
        if not api_endpoint or not provider:
            raise ValueError("User AI requires api_endpoint and provider")

        # Example using requests to call user's AI endpoint
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "prompt": final_prompt,
            "model": ai_model.value if hasattr(ai_model, "value") else str(ai_model),
        }

        response = requests.post(
            api_endpoint, headers=headers, json=payload, timeout=60
        )

        if response.status_code != 200:
            raise RuntimeError(
                f"User AI request failed [{response.status_code}]: {response.text}"
            )

        result = response.json().get("result", "")
        output_tokens = estimate_tokens(result, ai_model)

    # 6. Extract scores & feedback
    return {
        "result": extract_scores_and_feedback_robust(result),
        "input_tokens": input_tokens,
        "output_tokens": output_tokens,
    }
