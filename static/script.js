const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');
const chatMessages = document.getElementById('chat-messages');
const sendBtn = document.getElementById('send-btn');

function appendMessage(text, sender) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${sender}`;
    msgDiv.textContent = text;
    chatMessages.appendChild(msgDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function setFormDisabled(disabled) {
    chatInput.disabled = disabled;
    sendBtn.disabled = disabled;
}

chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const userMsg = chatInput.value.trim();
    if (!userMsg) return;
    appendMessage(userMsg, 'user');
    chatInput.value = '';
    setFormDisabled(true);

    try {
        const response = await fetch('/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: userMsg })
        });
        if (!response.ok) throw new Error('Network error');
        const data = await response.json();
        appendMessage(data.reply || 'No response', 'bot');
    } catch (err) {
        appendMessage('Error: ' + err.message, 'bot');
    } finally {
        setFormDisabled(false);
        chatInput.focus();
    }
});

// Optional: Enter key focuses input if not focused
window.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && document.activeElement !== chatInput) {
        chatInput.focus();
    }
});
