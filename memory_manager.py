"""
Refactored Memory Manager

Goal:
- Replace local-AI-driven memory extraction with a simple rolling window of the last N (default 10) conversation exchanges.
- Preserve the original implementation by commenting it out (for reference and potential rollback).
- Provide a clear API to record exchanges and fetch recent memory to be injected into prompts.

Storage format:
- memory.txt now stores JSON Lines (one JSON object per line) with keys: {"user": str, "assistant": str}.
- On write, the file is truncated to only keep the most recent MAX_EXCHANGES lines.

New API:
- record_exchange(user_input: str, assistant_output: str) -> None
- get_recent_memory() -> str (formatted as a readable block of the last N exchanges)
- memory_finder(user_input: str) -> str: kept as a backward-compatibility stub, returns "".
"""

from typing import List, Dict
import json
import GLOBAL

# =============================================================================
# Configuration for the new memory system
# =============================================================================
MAX_EXCHANGES = 10
MEMORY_FILE = GLOBAL.PRIMARY_MEMORY


# =============================================================================
# Public API (new)
# =============================================================================

def record_exchange(user_input: str, assistant_output: str, *, file_path: str = MEMORY_FILE, max_exchanges: int = MAX_EXCHANGES) -> None:
    """
    Append a new user/assistant exchange and keep only the most recent `max_exchanges`.
    Stored in JSONL format for robustness.
    """
    entries = _load_conversation_memory(file_path)
    entries.append({
        "user": (user_input or "").strip(),
        "assistant": (assistant_output or "").strip(),
    })
    # Keep only the last `max_exchanges` entries
    if len(entries) > max_exchanges:
        entries = entries[-max_exchanges:]
    _persist_conversation_memory(entries, file_path)


def get_recent_memory(*, file_path: str = MEMORY_FILE, max_exchanges: int = MAX_EXCHANGES) -> str:
    """
    Return a readable text block of the last `max_exchanges` exchanges.
    Format:
    User: ...
    Assistant: ...

    (blank line between exchanges)
    """
    entries = _load_conversation_memory(file_path)
    entries = entries[-max_exchanges:]
    blocks: List[str] = []
    for e in entries:
        user = e.get("user", "")
        assistant = e.get("assistant", "")
        blocks.append(f"User: {user}\nAssistant: {assistant}")
    return ("\n\n".join(blocks)).strip()


def memory_finder(user_input: str) -> str:
    """
    Backward-compatibility stub. This used to run a local AI to extract memory-worthy facts.
    With the refactor to a rolling conversation window, this function is deprecated and does nothing.

    Returns an empty string to maintain call-compatibility.
    """
    # Legacy implementation retained below (commented out).
    return ""


# =============================================================================
# Internal helpers
# =============================================================================

def _load_conversation_memory(file_path: str) -> List[Dict[str, str]]:
    entries: List[Dict[str, str]] = []
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                try:
                    obj = json.loads(line)
                except json.JSONDecodeError:
                    # Skip non-JSON legacy lines (from the old memory format)
                    # We intentionally ignore them to avoid mixing formats.
                    continue
                if isinstance(obj, dict) and "user" in obj and "assistant" in obj:
                    entries.append({
                        "user": str(obj.get("user", "")),
                        "assistant": str(obj.get("assistant", "")),
                    })
    except FileNotFoundError:
        pass
    return entries


def _persist_conversation_memory(entries: List[Dict[str, str]], file_path: str) -> None:
    with open(file_path, 'w', encoding='utf-8') as f:
        for e in entries:
            f.write(json.dumps({
                "user": e.get("user", ""),
                "assistant": e.get("assistant", ""),
            }, ensure_ascii=False) + "\n")


# =============================================================================
# ORIGINAL IMPLEMENTATION (COMMENTED OUT, PRESERVED FOR REFERENCE)
# =============================================================================
# import local_ai, prompts, GLOBAL
# from fuzzywuzzy import fuzz
#
# THRESHOLD = 90
#
# def memory_finder(user_input: str):
#     response = local_ai.call(f'{prompts.memory_manager_prompt + f"\"{user_input}\""}')
#     if not response or not response.strip():
#         return ""
#     try:
#         with open(GLOBAL.PRIMARY_MEMORY, 'r', encoding='utf-8') as file:
#             lst = file.readlines()
#     except FileNotFoundError:
#         lst = []
#     if is_duplicate(response, lst):
#         return ""
#     add_to_memory(response, GLOBAL.PRIMARY_MEMORY)
#     return response
#
# def is_duplicate(new_entry: str, memory_list: list[str]) -> bool:
#     """
#     Check if the new entry is too similar to anything in memory.
#     """
#     for old_entry in memory_list:
#         if fuzz.ratio(new_entry.lower(), old_entry.lower()) >= THRESHOLD:
#             return True
#     return False
#
# def add_to_memory(new_entry: str, memory_file: str):
#     with open(memory_file, "a", encoding="utf-8") as f:
#         f.write(new_entry.strip() + "\n")
