const socket = io();

// --- DOM Elements ---
const form = document.getElementById('form');
const input = document.getElementById('input');
const messages = document.getElementById('messages');
const videoContainer = document.getElementById('video-container');
const video = document.getElementById('psychologist-video');
const voiceSelect = document.getElementById('voice-select');
const videoUpload = document.getElementById('video-upload');
const videoThumbnails = document.querySelectorAll('.video-thumbnail');
const stopTtsBtn = document.getElementById('stop-tts-btn');

// --- TTS State ---
let voices = [];

// --- Functions ---

/**
 * Populates the voice select dropdown with all available Russian voices.
 */
function populateVoiceList() {
    // Filter for Russian voices
    voices = window.speechSynthesis.getVoices().filter(voice => voice.lang === 'ru-RU');
    
    voiceSelect.innerHTML = ''; // Clear existing options

    if (voices.length > 0) {
        voices.forEach(voice => {
            const option = document.createElement('option');
            option.textContent = `${voice.name}`; // Display just the name
            option.setAttribute('data-name', voice.name);
            voiceSelect.appendChild(option);
        });
    } else {
        const option = document.createElement('option');
        option.textContent = 'Русские голоса не найдены';
        voiceSelect.appendChild(option);
    }
}

/**
 * Speaks the given text using the selected voice.
 */
function speak(text) {
    // Forcefully stop any previous speech.
    speechSynthesis.cancel();
    if (!text) return; // Do nothing if text is empty

    const utterance = new SpeechSynthesisUtterance(text);
    const selectedVoiceName = voiceSelect.selectedOptions[0]?.getAttribute('data-name');
    const selectedVoice = voices.find(voice => voice.name === selectedVoiceName);

    // ONLY speak if we found a valid, selected voice.
    if (selectedVoice) {
        utterance.voice = selectedVoice;
        console.log('Attempting to speak with selected voice:', selectedVoice.name);
        speechSynthesis.speak(utterance);
    } else {
        console.log('No specific voice selected or found. Not speaking.');
        // Intentionally do nothing if no voice is selected
    }
}


// --- Event Listeners ---

// Form submission
form.addEventListener('submit', function(e) {
    e.preventDefault();
    if (input.value) {
        socket.emit('chat message', input.value);
        input.value = '';

        // Show and play video
        videoContainer.style.display = 'block';
        video.play();

        // Pause video after 5 seconds
        setTimeout(() => {
            video.pause();
        }, 5000);
    }
});

// Receiving chat messages
socket.on('chat message', function(msg) {
    const item = document.createElement('li');
    item.textContent = msg.text;

    if (msg.user === 'AI') {
        item.classList.add('ai-message');
        // Speak the AI's message
        speak(msg.text);
    }

    messages.appendChild(item);
    messages.scrollTop = messages.scrollHeight; // Auto-scroll to the bottom
});

// Video upload listener
videoUpload.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const videoURL = URL.createObjectURL(file);
        video.src = videoURL;
        videoContainer.style.display = 'block'; // Show for preview
    }
});

// Video gallery listeners
videoThumbnails.forEach(thumbnail => {
    thumbnail.addEventListener('click', function() {
        const newSrc = thumbnail.src;
        video.src = newSrc;
        videoContainer.style.display = 'block'; // Show the main video player with the new source
    });
});

// --- TTS Event Listeners ---

// Stop TTS button
stopTtsBtn.addEventListener('click', () => {
    speechSynthesis.cancel();
});

// Voices are loaded asynchronously, so we must listen for the 'voiceschanged' event.
speechSynthesis.onvoiceschanged = populateVoiceList;

// Also call it once initially in case the voices are already loaded.
populateVoiceList();
