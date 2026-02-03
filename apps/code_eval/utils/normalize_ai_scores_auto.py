def normalize_ai_scores_auto(rubric, ai_scores):
    if len(rubric) != len(ai_scores):
        raise ValueError("Rubric and AI scores length mismatch")
    any_percent = any(ai > max_score for ai, max_score in zip(ai_scores, rubric))

    final_scores = []
    for max_score, ai_score in zip(rubric, ai_scores):
        if any_percent:
            score = (ai_score / 100) * max_score
        else:
            score = ai_score
        final_scores.append(round(score, 2))

    return final_scores
