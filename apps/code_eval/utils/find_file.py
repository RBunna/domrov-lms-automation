from pathlib import Path

def read_file_to_json(file_path: str | Path) -> dict:
    file_path = Path(file_path)
    if not file_path.is_file():
        return {}

    # Read file content line by line
    try:
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            lines = [line.rstrip("\n") for line in f]
    except Exception:
        lines = []

    return {
        "type": "file",
        "name": file_path.name,
        "path": str(file_path).split("files_cache\\", 1)[-1],
        "content": lines
    }

def is_dir_cache(cache_dir: str | Path, target: str) -> bool:
    cache_dir = Path(cache_dir)
    if not cache_dir.is_dir():
        return False
    return any(item.name == target and item.is_dir() for item in cache_dir.iterdir())

