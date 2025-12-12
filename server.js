const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const axios = require('axios');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

// Подача статических файлов из папки 'public'
app.use(express.static('public'));

// Обработка подключений Socket.IO
io.on('connection', (socket) => {
    console.log('A user connected');

    // Слушаем событие 'chat message' от клиента
    socket.on('chat message', async (msg) => {
        console.log('message: ' + msg);
        // Отправляем сообщение обратно всем клиентам
        io.emit('chat message', { user: 'You', text: msg });

        // Получаем ответ от Yandex GPT
        try {
            const yandexResponse = await getYaGPTResponse(msg);
            const botMessage = yandexResponse.result.alternatives[0].message.text;
            io.emit('chat message', { user: 'AI', text: botMessage });
        } catch (error) {
            console.error('Error getting response from Yandex GPT:', error.response ? error.response.data : error.message);
            io.emit('chat message', { user: 'AI', text: 'Произошла ошибка при обращении к AI.' });
        }
    });

    socket.on('disconnect', () => {
        console.log('user disconnected');
    });
});

async function getYaGPTResponse(userMessage) {
    const url = 'https://llm.api.cloud.yandex.net/foundationModels/v1/completion';
    const apiKey = process.env.YANDEX_API_KEY;
    const folderId = process.env.YANDEX_FOLDER_ID;

    if (!apiKey || !folderId || apiKey === 'YOUR_YANDEX_API_KEY' || folderId === 'YOUR_YANDEX_FOLDER_ID') {
        throw new Error('Yandex API Key or Folder ID are not configured in .env file');
    }

    const body = {
        modelUri: `gpt://${folderId}/yandexgpt-lite`,
        completionOptions: {
            stream: false,
            temperature: 0.6,
            maxTokens: "2000"
        },
        messages: [
            {
                role: "system",
                text: "Ты — добрый, умный и отзывчивый психолог, который всегда готов помочь."
            },
            {
                role: "user",
                text: userMessage
            }
        ]
    };

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Api-Key ${apiKey}`
    };

    const response = await axios.post(url, body, { headers });
    return response.data;
}

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
