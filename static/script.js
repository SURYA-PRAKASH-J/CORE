const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');
const chatMessages = document.getElementById('chat-messages');
const chatMain = document.querySelector('.core-chat-main');
const sendBtn = document.getElementById('send-btn');

function appendMessage(text, sender) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${sender}`;
    msgDiv.textContent = text;
    chatMessages.appendChild(msgDiv);
    // Ensure the scroll happens on the scrollable container
    if (chatMain) {
        chatMain.scrollTop = chatMain.scrollHeight;
    }
}

function setFormDisabled(disabled) {
    chatInput.disabled = disabled;
    sendBtn.disabled = disabled;
}

function addTypingIndicator() {
    const typing = document.createElement('div');
    typing.className = 'message bot typing';
    const wrapper = document.createElement('div');
    wrapper.className = 'typing-indicator';
    for (let i = 0; i < 3; i++) {
        const dot = document.createElement('span');
        dot.className = 'dot';
        wrapper.appendChild(dot);
    }
    typing.appendChild(wrapper);
    chatMessages.appendChild(typing);
    if (chatMain) {
        chatMain.scrollTop = chatMain.scrollHeight;
    }
    return typing;
}

function replaceTypingWithText(typingEl, text) {
    if (!typingEl) return appendMessage(text, 'bot');
    typingEl.classList.remove('typing');
    typingEl.textContent = text;
    if (chatMain) {
        chatMain.scrollTop = chatMain.scrollHeight;
    }
}

chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const userMsg = chatInput.value.trim();
    if (!userMsg) return;
    appendMessage(userMsg, 'user');
    chatInput.value = '';
    setFormDisabled(true);

    // Show typing indicator while waiting for server reply
    const typingEl = addTypingIndicator();

    try {
        const response = await fetch('/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: userMsg })
        });
        if (!response.ok) throw new Error('Network error');
        const data = await response.json();
        replaceTypingWithText(typingEl, data.reply || 'No response');
    } catch (err) {
        replaceTypingWithText(typingEl, 'Error: ' + err.message);
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
