from llama_cpp import Llama
from threading import Lock
from typing import Optional

_model: Optional[Llama] = None
_lock = Lock()

def init():
    global _model
    with _lock:
        if _model is None:
            _model = Llama(
                model_path="llama.cpp/models/tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf",  # update with actual path
                n_ctx=2048,
                n_threads=2,  # Tune based on your CPU
                verbose=False
            )

def call(prompt: str) -> str:
    init()
    output = _model(prompt, max_tokens=100, stop=["</s>"])
    return output["choices"][0]["text"].strip()
