const socket = io();
let username = localStorage.getItem('chat-username');
if (!username) {
  username = prompt('Enter your name') || `User${Math.floor(Math.random()*1000)}`;
  localStorage.setItem('chat-username', username);
}
const usersEl = document.getElementById('users');
const messagesEl = document.getElementById('messages');
const form = document.getElementById('messageForm');
const input = document.getElementById('messageInput');
const typingIndicator = document.getElementById('typingIndicator');
let typingTimeout = null;
let isTyping = false;
socket.emit('join', username);
function addMessage(item) {
  const li = document.createElement('li');
  if (item.system) {
    li.className = 'system';
    li.textContent = item.text;
  } else {
    const name = item.username === username ? 'You' : item.username;
    li.className = item.username === username ? 'me' : 'other';
    const meta = document.createElement('div');
    meta.className = 'message-meta';
    const time = new Date(item.timestamp || Date.now());
    meta.textContent = `${name} • ${time.toLocaleTimeString()}`;
    const body = document.createElement('div');
    body.textContent = item.text;
    li.appendChild(meta);
    li.appendChild(body);
  }
  messagesEl.appendChild(li);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}
socket.on('message', (msg) => addMessage(msg));
socket.on('user-list', (list) => {
  usersEl.innerHTML = '';
  list.forEach(u => {
    const li = document.createElement('li');
    li.textContent = u + (u === username ? ' (you)' : '');
    usersEl.appendChild(li);
  });
});
const typingUsers = new Set();
socket.on('typing', ({ username: who, isTyping: t }) => {
  if (who === username) return;
  if (t) typingUsers.add(who);
  else typingUsers.delete(who);
  if (typingUsers.size === 0) typingIndicator.textContent = '';
  else if (typingUsers.size === 1) typingIndicator.textContent = `${Array.from(typingUsers)[0]} is typing…`;
  else typingIndicator.textContent = 'Several people are typing…';
});
form.addEventListener('submit', (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;
  socket.emit('send-message', text);
  input.value = '';
  sendTyping(false);
});
input.addEventListener('input', () => {
  if (!isTyping) { sendTyping(true); isTyping = true; }
  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => { isTyping = false; sendTyping(false); }, 800);
});
function sendTyping(flag) { socket.emit('typing', flag); }
