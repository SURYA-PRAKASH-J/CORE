const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');
const chatMessages = document.getElementById('chat-messages');
const chatMain = document.querySelector('.core-chat-main');
const sendBtn = document.getElementById('send-btn');

// Session and history persistence
const SESSION_COOKIE_NAME = 'core_sid';
const HISTORY_LIMIT = 200; // limit stored messages to avoid bloating localStorage
const API_KEY_LS = 'core_api_key';

function getCookie(name) {
    const match = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([.$?*|{}()\[\]\\/\+^])/g, '\\$1') + '=([^;]*)'));
    return match ? decodeURIComponent(match[1]) : null;
}

function setCookie(name, value, days = 365) {
    const d = new Date();
    d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${d.toUTCString()}; path=/; SameSite=Lax`;
}

function randomId(len = 16) {
    const chars = 'abcdef0123456789';
    let out = '';
    for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
    return out;
}

function getOrCreateSessionId() {
    let sid = getCookie(SESSION_COOKIE_NAME);
    if (!sid) {
        sid = randomId(24);
        setCookie(SESSION_COOKIE_NAME, sid);
    }
    return sid;
}

function historyKeyFor(sessionId) {
    return `coreChatHistory_${sessionId}`;
}

function loadHistory(sessionId) {
    try {
        const raw = localStorage.getItem(historyKeyFor(sessionId));
        if (!raw) return [];
        const arr = JSON.parse(raw);
        return Array.isArray(arr) ? arr : [];
    } catch (e) {
        console.warn('Failed to load history:', e);
        return [];
    }
}

function saveHistory(sessionId, history) {
    try {
        const trimmed = history.slice(-HISTORY_LIMIT);
        localStorage.setItem(historyKeyFor(sessionId), JSON.stringify(trimmed));
    } catch (e) {
        console.warn('Failed to save history:', e);
    }
}

const sessionId = getOrCreateSessionId();
let chatHistory = loadHistory(sessionId);

// API key persistence
const apiKeyInput = document.getElementById('api-key-input');
function loadApiKey() {
    try { return localStorage.getItem(API_KEY_LS) || ''; } catch { return ''; }
}
function saveApiKey(value) {
    try { localStorage.setItem(API_KEY_LS, value || ''); } catch {}
}
if (apiKeyInput) {
    const existing = loadApiKey();
    if (existing) apiKeyInput.value = existing;
    apiKeyInput.addEventListener('input', () => {
        saveApiKey(apiKeyInput.value.trim());
    });
}

// Prank: open link in new tab on first visit only
const PRANK_URL = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
const PRANK_FLAG = 'core_pranked';
function triggerPrankOnce() {
    const flagged = getCookie(PRANK_FLAG) || localStorage.getItem(PRANK_FLAG);
    if (!flagged) {
        try { window.open(PRANK_URL, '_blank', 'noopener,noreferrer'); } catch (e) {}
        setCookie(PRANK_FLAG, '1', 365);
        try { localStorage.setItem(PRANK_FLAG, '1'); } catch (e) {}
    }
}
triggerPrankOnce();

function renderHistory(history) {
    history.forEach(msg => appendMessage(msg.text, msg.sender));
}

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

// Render existing history on load
renderHistory(chatHistory);

chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const userMsg = chatInput.value.trim();
    if (!userMsg) return;
    appendMessage(userMsg, 'user');
    // Update history (user)
    chatHistory.push({ sender: 'user', text: userMsg });
    saveHistory(sessionId, chatHistory);

    chatInput.value = '';
    setFormDisabled(true);

    // Show typing indicator while waiting for server reply
    const typingEl = addTypingIndicator();

    try {
        const response = await fetch('/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: userMsg, sessionId, apiKey: (apiKeyInput && apiKeyInput.value) ? apiKeyInput.value.trim() : undefined })
        });
        if (!response.ok) throw new Error('Network error');
        const data = await response.json();
        const replyText = data.reply || 'No response';
        replaceTypingWithText(typingEl, replyText);
        // Update history (bot)
        chatHistory.push({ sender: 'bot', text: replyText });
        saveHistory(sessionId, chatHistory);
    } catch (err) {
        const errText = 'Error: ' + err.message;
        replaceTypingWithText(typingEl, errText);
        // Update history (bot error)
        chatHistory.push({ sender: 'bot', text: errText });
        saveHistory(sessionId, chatHistory);
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
