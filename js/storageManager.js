export class StorageManager {
    constructor() {
        this.STORAGE_KEY = 'ai_chat_history';
    }

    saveChat(messages) {
        try {
            const serializedMessages = messages.map(msg => ({
                type: msg.role === 'assistant' ? 'llm' : msg.role, // Convert 'assistant' role to 'llm' type
                content: msg.content,
                timestamp: new Date().toISOString()
            }));
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(serializedMessages));
        } catch (error) {
            console.error('Failed to save chat:', error);
        }
    }

    loadChat() {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            if (!stored) return [];

            const messages = JSON.parse(stored);
            // Ensure all messages have the correct type property
            return messages.map(msg => ({
                type: msg.type || (msg.role === 'assistant' ? 'llm' : msg.role),
                content: msg.content,
                timestamp: msg.timestamp || new Date().toISOString()
            }));
        } catch (error) {
            console.error('Failed to load chat:', error);
            return [];
        }
    }

    clearChat() {
        localStorage.removeItem(this.STORAGE_KEY);
    }

    exportChat(format = 'json') {
        const messages = this.loadChat();
        let content;

        if (format === 'markdown') {
            content = messages.map(msg =>
                `## ${msg.role.toUpperCase()} - ${msg.timestamp}\n\n${msg.content}\n\n---\n`
            ).join('\n');
        } else {
            content = JSON.stringify(messages, null, 2);
        }

        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `chat-export-${new Date().toISOString()}.${format}`;
        a.click();

        URL.revokeObjectURL(url);
    }
}
