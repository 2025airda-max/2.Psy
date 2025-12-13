const socket = io();

// --- DOM Elements ---
const form = document.getElementById('form');
const input = document.getElementById('input');
const messages = document.getElementById('messages');
const videoContainer = document.getElementById('video-container');
const video = document.getElementById('psychologist-video');
const genderSelect = document.getElementById('gender-select');
const voiceSelect = document.getElementById('voice-select');
const videoUpload = document.getElementById('video-upload');
const videoThumbnails = document.querySelectorAll('.video-thumbnail');

// --- TTS State ---
let voices = [];

// --- Functions ---

/**
 * Populates the voice select dropdown based on available Russian voices and selected gender.
 */
function populateVoiceList() {
    const selectedGender = genderSelect.value;
    // Voices load asynchronously, so we might need to wait for them
    voices = window.speechSynthesis.getVoices().filter(voice => voice.lang === 'ru-RU');
    
    voiceSelect.innerHTML = ''; // Clear existing options

    const filteredVoices = voices.filter(voice => {
        // A simple heuristic to determine gender from voice name
        const voiceNameLower = voice.name.toLowerCase();
        const isFemale = voiceNameLower.includes('female') || voiceNameLower.includes('женский') || voiceNameLower.includes('anna');
        const voiceGender = isFemale ? 'female' : 'male';
        return voiceGender === selectedGender;
    });

    if (filteredVoices.length > 0) {
        filteredVoices.forEach(voice => {
            const option = document.createElement('option');
            option.textContent = voice.name;
            option.setAttribute('data-name', voice.name);
            voiceSelect.appendChild(option);
        });
    } else {
        const option = document.createElement('option');
        option.textContent = 'Нет голосов для этого пола';
        voiceSelect.appendChild(option);
    }
}

/**
 * Speaks the given text using the selected voice.
 * @param {string} text The text to speak.
 */
function speak(text) {
    if (speechSynthesis.speaking) {
        // Optional: stop the current speech to start a new one
        speechSynthesis.cancel();
    }
    if (text !== '') {
        const utterance = new SpeechSynthesisUtterance(text);
        const selectedVoiceName = voiceSelect.selectedOptions[0]?.getAttribute('data-name');
        
        if (selectedVoiceName) {
            const selectedVoice = voices.find(voice => voice.name === selectedVoiceName);
            if (selectedVoice) {
                utterance.voice = selectedVoice;
            }
        }
        
        speechSynthesis.speak(utterance);
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

// TTS-related event listeners
genderSelect.addEventListener('change', populateVoiceList);

// Voices are loaded asynchronously, so we must listen for the 'voiceschanged' event.
speechSynthesis.onvoiceschanged = () => {
    populateVoiceList();
};

// Also call it once initially in case the voices are already loaded.
populateVoiceList();
