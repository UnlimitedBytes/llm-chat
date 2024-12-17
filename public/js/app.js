import { ThemeManager } from './themeManager.js';
import { MessageHandler } from './messageHandler.js';
import { StorageManager } from './storageManager.js';
import { FileHandler } from './fileHandler.js';
import { ToolManager } from './tools.js';
import { config } from './config.js';

class ChatApp {
    constructor() {
        this.messageHandler = new MessageHandler();
        this.themeManager = new ThemeManager();
        this.storageManager = new StorageManager();
        this.fileHandler = new FileHandler();
        this.toolManager = new ToolManager();

        this.conversationMode = 'standard'; // 'standard', 'creative', 'technical'
        this.selectedModel = config.DEFAULT_MODEL; // Default model
        this.systemPrompts = {
            standard: "You are a helpful assistant.",
            creative: "You are a creative assistant focused on innovative and imaginative solutions.",
            technical: "You are a technical assistant focused on precise, detailed technical explanations.",
            analytical: "You are an analytical assistant focused on data-driven insights. You analyse any text and image and provide advanced insights."
        };
        this.setupTextAreaAutoResize();

        this.init();
        this.setupClearChat();
        this.messageHistory = [];
    }

    async init() {
        await this.fetchAvailableModels();
        this.setupEventListeners();
        this.loadPreviousChat();
        this.setupKeyboardShortcuts();
    }

    async fetchAvailableModels() {
        try {
            const response = await fetch(`${config.API_BASE_URL}/models`, {
                headers: {
                    'Authorization': `Bearer ${config.API_KEY}`
                }
            });

            if (!response.ok) throw new Error('Failed to fetch models');

            const data = await response.json();
            this.updateModelSelect(data.data);
        } catch (error) {
            console.error('Error fetching models:', error);
        }
    }

    updateModelSelect(models) {
        const modelSelect = document.getElementById('modelSelect');
        modelSelect.innerHTML = '';

        models.forEach(model => {
            const option = document.createElement('option');
            option.value = model.id;
            option.textContent = `${model.id} (${model.context_length} tokens)`;
            modelSelect.appendChild(option);
        });

        // Set default model
        modelSelect.value = this.selectedModel;
    }

    setupEventListeners() {
        const sendButton = document.getElementById('sendButton');
        const userInput = document.getElementById('userInput');
        const themeToggle = document.getElementById('themeToggle');

        sendButton.addEventListener('click', () => this.handleSend());
        userInput.addEventListener('keydown', (e) => this.handleInputKeydown(e));
        themeToggle.addEventListener('click', () => this.themeManager.toggle());

        // Setup drag and drop
        const dropZone = document.getElementById('messageList');
        this.fileHandler.setupDropZone(dropZone);

        // Add mode selector listener
        const modeSelect = document.getElementById('conversationMode');
        modeSelect.addEventListener('change', (e) => {
            this.conversationMode = e.target.value;
        });

        // Add export button listener
        const exportButton = document.getElementById('exportButton');
        exportButton.addEventListener('click', () => this.storageManager.exportChat());

        // Add model selector listener
        const modelSelect = document.getElementById('modelSelect');
        modelSelect.addEventListener('change', (e) => {
            this.selectedModel = e.target.value;
        });

        // Add tool toggle listeners
        document.querySelectorAll('.tool-toggle').forEach(toggle => {
            toggle.addEventListener('change', (e) => {
                const toolName = e.target.dataset.tool;
                if (e.target.checked) {
                    this.toolManager.enabledTools.add(toolName);
                } else {
                    this.toolManager.enabledTools.delete(toolName);
                }
            });
        });

        // Add upload button listener
        const uploadButton = document.getElementById('uploadButton');
        const fileInput = document.getElementById('fileInput');

        uploadButton.addEventListener('click', () => {
            fileInput.click();
        });

        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.fileHandler.handleDrop(e.target.files);
                e.target.value = ''; // Reset file input
            }
        });
    }

    setupClearChat() {
        const clearButton = document.getElementById('clearChat');
        clearButton.addEventListener('click', () => {
            if (confirm('Möchten Sie den gesamten Chat-Verlauf löschen?')) {
                this.messageHandler.clearChat();
                this.storageManager.clearChat();
                this.messageHistory = []; // Clear the message history array
                this.fileHandler.clearPendingImages(); // Also clear any pending images
                this.updateImagePreview(); // Update the UI
            }
        });
    }

    handleInputKeydown(e) {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            this.handleSend();
        }
    }

    async handleSend() {
        const userInput = document.getElementById('userInput');
        const message = userInput.value.trim();
        const pendingImages = this.fileHandler.getPendingImages();

        // Don't send if no message and no images
        if (!message && pendingImages.length === 0) return;

        let content;
        if (pendingImages.length > 0) {
            content = [
                {
                    type: "text",
                    text: message || "Here are some images:"
                },
                ...pendingImages
            ];
        } else {
            content = message;
        }

        // Add user message to UI and history
        this.messageHandler.addMessage(content, 'user');
        this.messageHistory.push({
            role: 'user',
            content: content
        });

        // Clear input and pending images
        userInput.value = '';
        this.fileHandler.clearPendingImages();
        this.updateImagePreview();

        // Create empty AI message right away
        this.messageHandler.addMessage('', 'llm');

        const systemPrompt = this.systemPrompts[this.conversationMode];
        const messages = [
            { role: 'system', content: systemPrompt },
            ...this.messageHistory
        ];

        let currentMessage = '';
        let currentToolCall = null;
        try {
            const enabledTools = this.toolManager.getEnabledTools();
            const requestBody = {
                model: this.selectedModel,
                messages: messages,
                stream: true
            };

            // Only include tools if there are enabled tools
            if (enabledTools.length > 0) {
                requestBody.tools = enabledTools;
            }

            let isComplete = false;
            let currentMessage = '';
            let currentToolCall = null;

            while (!isComplete) {
                const response = await fetch(`${config.API_BASE_URL}/chat/completions`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${config.API_KEY}`,
                        'HTTP-Referer': window.location.href,
                        'X-Title': 'AI Chat Interface'
                    },
                    body: JSON.stringify({
                        ...requestBody,
                        messages
                    })
                });

                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error?.message || 'API request failed');
                }

                const reader = response.body.getReader();
                const decoder = new TextDecoder();

                while (true) {
                    const { value, done } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value);
                    const lines = chunk.split('\n').filter(line => line.trim());

                    for (const line of lines) {
                        if (!line.startsWith('data: ')) continue;
                        if (line === 'data: [DONE]') {
                            if (!currentToolCall) isComplete = true;
                            break;
                        }
                        if (line === 'data: OPENROUTER PROCESSING') continue;

                        try {
                            const data = JSON.parse(line.slice(6));
                            if (!data?.choices?.[0]?.delta) continue;

                            const { delta } = data.choices[0];
                            const finishReason = data.choices[0].finish_reason;

                            if (delta.content) {
                                currentMessage += delta.content;
                                this.messageHandler.updateLastMessage(currentMessage, 'llm');
                            }

                            if (delta.tool_calls) {
                                const toolCallDelta = delta.tool_calls[0];
                                if (!currentToolCall) {
                                    currentToolCall = {
                                        id: toolCallDelta.id,
                                        function: {
                                            name: toolCallDelta.function?.name || '',
                                            arguments: toolCallDelta.function?.arguments || ''
                                        }
                                    };
                                } else {
                                    if (toolCallDelta.function?.name) {
                                        currentToolCall.function.name += toolCallDelta.function.name;
                                    }
                                    if (toolCallDelta.function?.arguments) {
                                        currentToolCall.function.arguments += toolCallDelta.function.arguments;
                                    }
                                }
                            }

                            // Handle tool call completion
                            if (finishReason === 'tool_calls' && currentToolCall) {
                                const toolResult = await this.handleToolCall(currentToolCall);

                                // Add tool interaction to messages
                                messages.push({
                                    role: 'assistant',
                                    content: null,
                                    tool_calls: [{
                                        id: currentToolCall.id,
                                        type: 'function',
                                        function: {
                                            name: currentToolCall.function.name,
                                            arguments: currentToolCall.function.arguments
                                        }
                                    }]
                                });

                                messages.push({
                                    role: 'tool',
                                    content: toolResult,
                                    name: currentToolCall.function.name,
                                    tool_call_id: currentToolCall.id
                                });

                                // Reset for next potential tool call
                                currentToolCall = null;
                                currentMessage = '';
                                this.messageHandler.addMessage('', 'llm');
                                break;
                            }

                            if (finishReason === 'stop') {
                                isComplete = true;
                                if (currentMessage) {
                                    this.messageHistory.push({
                                        role: 'assistant',
                                        content: currentMessage
                                    });
                                    this.storageManager.saveChat(this.messageHistory);
                                }
                                break;
                            }
                        } catch (e) {
                            console.debug('Skipping invalid SSE data:', e);
                            continue;
                        }
                    }

                    if (isComplete) break;
                }
            }
        } catch (error) {
            console.error('Chat completion error:', error);
            this.messageHandler.updateLastMessage(
                `Error: ${error.message || 'An error occurred while processing your request.'}`,
                'llm'
            );
        }
    }

    async handleSendWithContent(content) {
        // Add user message to UI and history with the content array
        this.messageHandler.addMessage(content, 'user');
        this.messageHistory.push({
            role: 'user',
            content: content
        });

        // Create empty AI message right away
        this.messageHandler.addMessage('', 'llm');

        const systemPrompt = this.systemPrompts[this.conversationMode];
        const messages = [
            { role: 'system', content: systemPrompt },
            ...this.messageHistory
        ];

        try {
            const enabledTools = this.toolManager.getEnabledTools();
            const requestBody = {
                model: this.selectedModel,
                messages: messages,
                stream: true
            };

            if (enabledTools.length > 0) {
                requestBody.tools = enabledTools;
            }

            const response = await fetch(`${config.API_BASE_URL}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${config.API_KEY}`,
                    'HTTP-Referer': window.location.href,
                    'X-Title': 'AI Chat Interface'
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error?.message || 'API request failed');
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let currentMessage = '';

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n').filter(line => line.trim());

                for (const line of lines) {
                    if (!line.startsWith('data: ')) continue;
                    if (line === 'data: [DONE]') break;
                    if (line === 'data: OPENROUTER PROCESSING') continue;

                    try {
                        const data = JSON.parse(line.slice(6));
                        if (data?.choices?.[0]?.delta?.content) {
                            currentMessage += data.choices[0].delta.content;
                            this.messageHandler.updateLastMessage(currentMessage, 'llm');
                        }
                    } catch (e) {
                        console.debug('Skipping invalid SSE data:', e);
                        continue;
                    }
                }
            }

            this.messageHistory.push({
                role: 'assistant',
                content: currentMessage
            });
            this.storageManager.saveChat(this.messageHistory);
        } catch (error) {
            console.error('Chat completion error:', error);
            this.messageHandler.updateLastMessage(
                `Error: ${error.message || 'An error occurred while processing your request.'}`,
                'llm'
            );
        }
    }

    async handleToolCall(toolCall) {
        // Show tool request to user
        const requestDiv = await this.messageHandler.addToolRequest(
            toolCall,
            async () => {
                try {
                    const result = await this.toolManager.executeTool(
                        toolCall.function.name,
                        toolCall.function.arguments
                    );
                    this.messageHandler.addToolResponse(toolCall, result);
                    return result;
                } catch (error) {
                    console.error('Tool execution failed:', error);
                    return `Error: ${error.message}`;
                }
            },
            () => {
                this.messageHandler.addToolResponse(toolCall, "Tool execution denied by user");
                return "Tool execution denied by user";
            }
        );

        return new Promise((resolve) => {
            requestDiv.querySelector('button')?.addEventListener('click', (e) => {
                const action = e.target.textContent.toLowerCase();
                if (action === 'accept') {
                    resolve(this.toolManager.executeTool(toolCall.function.name, toolCall.function.arguments));
                } else {
                    resolve("Tool execution denied by user");
                }
            });
        });
    }

    async* askAIStream(messages) {
        const response = await fetch(`${config.API_BASE_URL}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.API_KEY}`,
                'HTTP-Referer': window.location.href,
                'X-Title': 'AI Chat Interface'
            },
            body: JSON.stringify({
                model: this.selectedModel,
                stream: true,
                messages: messages
            }),
        });

        if (!response.ok) {
            throw new Error(`LLM request failed: ${response.status} ${response.statusText}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');

        while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n').filter(line => line.trim() !== '');

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const dataStr = line.replace('data: ', '');
                    if (dataStr === '[DONE]') return;

                    try {
                        const data = JSON.parse(dataStr);
                        if (data.choices?.[0]?.delta?.content) {
                            yield data.choices[0].delta.content;
                        }
                    } catch(e) {
                        continue;
                    }
                }
            }
        }
    }

    loadPreviousChat() {
        const messages = this.storageManager.loadChat();

        // Convert storage format to message history format
        this.messageHistory = messages.map(msg => ({
            role: msg.type === 'llm' ? 'assistant' : 'user',
            content: msg.content
        }));

        // Add messages to the UI
        messages.forEach(msg => {
            this.messageHandler.addMessage(msg.content, msg.type, false);
        });
    }

    setupTextAreaAutoResize() {
        const textarea = document.getElementById('userInput');
        textarea.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = (this.scrollHeight) + 'px';
        });
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Clear chat: Ctrl/Cmd + K
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                if (confirm('Chat-Verlauf löschen?')) {
                    this.messageHandler.clearChat();
                    this.storageManager.clearChat();
                }
            }
            // Switch modes: Ctrl/Cmd + 1/2/3
            if (e.ctrlKey || e.metaKey) {
                const modeMap = {
                    '1': 'standard',
                    '2': 'creative',
                    '3': 'technical',
                    '4': 'analytical'
                };
                if (modeMap[e.key]) {
                    e.preventDefault();
                    this.conversationMode = modeMap[e.key];
                    document.getElementById('conversationMode').value = modeMap[e.key];
                }
            }
        });
    }

    async regenerateResponse(messageElement) {
        // Find the user message that triggered this response
        const messageIndex = Array.from(this.messageList.children).indexOf(messageElement);
        const previousMessages = this.messageHistory.slice(0, messageIndex);

        // Remove the old response
        messageElement.remove();
        this.messageHistory.splice(messageIndex, 1);

        try {
            // Create new LLM message
            this.messageHandler.addMessage('', 'llm');

            const responseStream = this.askAIStream(previousMessages);
            let fullResponse = '';

            for await (const token of responseStream) {
                fullResponse += token;
                this.messageHandler.updateLastMessage(fullResponse, 'llm');
            }

            // Add assistant's message to history
            this.messageHistory.splice(messageIndex, 0, {
                role: 'assistant',
                content: fullResponse
            });

            this.storageManager.saveChat(this.messageHistory);
        } catch (error) {
            console.error('LLM request failed:', error);
            this.messageHandler.updateLastMessage('Sorry, there was an error processing your request.', 'llm');
        }
    }

    updateImagePreview() {
        const previewArea = document.getElementById('imagePreview');
        const pendingImages = this.fileHandler.getPendingImages();

        if (pendingImages.length > 0) {
            previewArea.innerHTML = pendingImages.map((img, index) => `
                <div class="relative">
                    <img src="${img.image_url.url}" class="h-16 w-16 object-cover rounded-md">
                    <button class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center"
                            onclick="window.chatApp.removeImage(${index})">×</button>
                </div>
            `).join('');
            previewArea.classList.remove('hidden');
        } else {
            previewArea.innerHTML = '';
            previewArea.classList.add('hidden');
        }
    }

    removeImage(index) {
        this.fileHandler.pendingImages.splice(index, 1);
        this.updateImagePreview();
    }
}

// Initialize app
window.addEventListener('DOMContentLoaded', () => {
    window.chatApp = new ChatApp();
});
