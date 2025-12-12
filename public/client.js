const socket = io();

const form = document.getElementById('form');
const input = document.getElementById('input');
const messages = document.getElementById('messages');

form.addEventListener('submit', function(e) {
    e.preventDefault();
    if (input.value) {
        socket.emit('chat message', input.value);
        input.value = '';
    }
});

socket.on('chat message', function(msg) {
    const item = document.createElement('li');
    const userPrefix = msg.user === 'AI' ? 'AI: ' : 'You: ';
    
    item.textContent = msg.text;
    if(msg.user === 'AI') {
        item.classList.add('ai-message');
    }

    messages.appendChild(item);
    messages.scrollTop = messages.scrollHeight; // Auto-scroll to the bottom
});
