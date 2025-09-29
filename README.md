# CORE

A Flask-based AI assistant with a bold, opinionated personality. It integrates with Google's Generative AI and maintains a rolling conversation memory of the last 10 user/assistant exchanges.

## Features
- Gemini API integration for responses
- Rolling memory manager: stores only the last 10 user/assistant exchanges
- Clean environment variable handling (no secrets in the repository)
- Simple JSON API endpoint: POST /chat

## Architecture Overview
- `main.py` — Flask app and API endpoint. Builds prompts with personality and recent memory, then queries Gemini.
- `prompts.py` — Personality and prompt templates.
- `memory_manager.py` — Rolling window memory store (last 10 exchanges). Original local-AI approach preserved as comments.
- `GLOBAL.py` — Global constants (e.g., memory file path).
- `local_ai.py` — Legacy local model client (not used by the new memory manager, preserved for reference).

## Requirements
- Python 3.10+
- Packages:
  - Flask
  - google-genai (Google Generative AI SDK)
  - python-dotenv (optional, to load local `.env` automatically)

Install with pip:

```bash
pip install Flask google-genai python-dotenv
```

Note: `llama_cpp` is present for the legacy memory approach but is not required by the current rolling memory system.

## Environment Variables
Create a `.env` file (not committed) or export the variable in your shell:

- `GOOGLE_GENAI_API_KEY` — Your Google Generative AI API key

A sample file is provided: `.sample.env`.

Example `.env`:

```
GOOGLE_GENAI_API_KEY=your-real-key
```

## Running Locally
There is no `if __name__ == "__main__"` block; use Flask CLI.

Windows (PowerShell):

```powershell
$env:FLASK_APP = "main.py"
$env:FLASK_ENV = "development"  # optional auto-reload
flask run
```

macOS/Linux (bash):

```bash
export FLASK_APP=app.py
export FLASK_ENV=development  # optional auto-reload
flask run
```

The server will start at http://127.0.0.1:5000/ by default.

## API
- Endpoint: `POST /chat`
- Body (JSON):

```json
{
  "message": "Your prompt here"
}
```

- Response (JSON):

```json
{
  "reply": "Model response here"
}
```

## Memory Behavior (Rolling Window)
- The app persists a JSON Lines file (default: `memory.txt`) storing one object per exchange:

```json
{"user": "...", "assistant": "..."}
```

- Only the last 10 exchanges are kept. Older entries are truncated on write.
- The assistant reads this recent memory and composes the prompt alongside its personality text.
- The previous memory extraction via a local AI model is preserved in comments, but no longer used.

## Security & Git Hygiene
- `.env` and `memory.txt` are ignored by `.gitignore` and will not be committed.
- Use `.sample.env` as a template for teammates and deployments.
- Never hardcode API keys in source.

## Project Structure (simplified)
```
CORE/
├─ main.py
├─ GLOBAL.py
├─ prompts.py
├─ memory_manager.py
├─ local_ai.py           # legacy (unused by rolling memory)
├─ memory.txt            # runtime-only JSONL data (git-ignored)
├─ .gitignore
├─ .sample.env
└─ README.md
```

## Notes
- If you want to change the size of the rolling memory, update `MAX_EXCHANGES` in `memory_manager.py`.
- If you use a process manager or container, provide `GOOGLE_GENAI_API_KEY` via environment variables at runtime.

## License
This project currently has no explicit license. If you plan to open-source it, add a LICENSE file accordingly.
