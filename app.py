import os, json, requests, memory_manager, GLOBAL, prompts
from flask import Flask, render_template, request, jsonify
from google import genai

app = Flask(__name__)

# Attempt to load environment variables from a local .env if python-dotenv is available
try:
    from dotenv import load_dotenv  # type: ignore
    load_dotenv()
except Exception:
    # If dotenv isn't installed, we simply rely on system environment variables
    pass

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/chat", methods=["post"])
def chat():
    data = request.get_json()
    user_message = data.get("message", "")
    client_api_key = data.get("apiKey")  # optional, per-user key from UI

    # New: use rolling conversation memory instead of local AI extraction
    memory_block = memory_manager.get_recent_memory()
    prompt_for_model = prompts.core_personality + "\n\n" + prompts.memory_attachment_prompt.format(
        memory_block=memory_block,
        user_prompt=user_message,
    )

    reply = gemini_ai_callback(prompt_for_model, api_key=client_api_key)

    # New: record the exchange so we keep only the last N conversation pairs
    memory_manager.record_exchange(user_message, reply)

    # Legacy approach (commented):
    # memory_manager.memory_finder(user_message)
    # with open(GLOBAL.PRIMARY_MEMORY, "r") as file:
    #     prompt_legacy = prompts.core_personality + "\n\n" + prompts.memory_attachment_prompt.format(memory_block=file.read(), user_prompt=user_message)
    #     file.close()
    # return jsonify({"reply": gemini_ai_callback(prompt_legacy)})

    return jsonify({"reply": reply})



def gemini_ai_callback(_prompt: str, _model: str= "gemini-2.5-pro", api_key: str | None = None) -> str:
    key = api_key or os.getenv("GOOGLE_GENAI_API_KEY")
    if not key:
        # Fail fast with a clear message (returned to the client). You may prefer to log this instead.
        return "Server configuration error: missing GOOGLE_GENAI_API_KEY."

    client = genai.Client(api_key=key)
    response = client.models.generate_content(model=_model, contents= _prompt + "Keep it short")
    return response.text

@app.route("/instructions")
def instructions():
    return render_template("instructions.html")