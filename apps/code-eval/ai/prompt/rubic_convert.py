def rubric_to_plain_text(rubric_input):
    lines = []
    
    # If input is exercise instruction make it  as a single criterion with 100%
    if isinstance(rubric_input, str):
        lines.append(f"- {rubric_input}: 100%")
    
    elif isinstance(rubric_input, list):
        for item in rubric_input:
            lines.append(f"- {item['criterion']}: {item['weight']}%")
    
    else:
        raise ValueError("Input must be a list of rubric items or a string.")
    
    return "\n".join(lines)
