export class MessageHandler {
    constructor() {
        this.messageList = document.getElementById('messageList');
        this.setupMarkdown();
    }

    addMessage(content, type, shouldScroll = true) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `p-4 rounded-lg ${type} ${
            type === 'user' ? 'bg-discord-100 dark:bg-discord-500' : 'bg-discord-50 dark:bg-discord-700'
        }`;

        // Add a loading indicator for empty AI messages
        if (type === 'llm' && !content) {
            content = '⌛ Thinking...';
            messageDiv.classList.add('loading');
        }

        const header = document.createElement('div');
        header.className = 'flex justify-between items-center mb-2';

        const leftHeader = document.createElement('div');
        leftHeader.className = 'flex items-center gap-2';

        const sender = document.createElement('span');
        sender.className = `font-medium ${
            type === 'user' ? 'text-accent-primary' : 'text-llm-light dark:text-llm-dark'
        }`;
        sender.textContent = type === 'user' ? 'You' : 'AI';

        leftHeader.appendChild(sender);

        // Add reload button for AI messages
        if (type === 'llm') {
            const reloadButton = document.createElement('button');
            reloadButton.className = 'p-1 hover:bg-discord-100 dark:hover:bg-discord-600 rounded-md';
            reloadButton.innerHTML = '🔄';
            reloadButton.title = 'Regenerate response';
            reloadButton.onclick = () => {
                // Store reference to current message for replacement
                const currentMessage = messageDiv;
                // Trigger regeneration through ChatApp
                window.chatApp.regenerateResponse(currentMessage);
            };
            leftHeader.appendChild(reloadButton);
        }

        const time = document.createElement('span');
        time.className = 'message-time text-sm text-discord-300';
        time.textContent = new Date().toLocaleTimeString();

        header.appendChild(leftHeader);
        header.appendChild(time);

        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content prose prose-sm dark:prose-invert';

        if (Array.isArray(content)) {
            // Handle content array for images
            content.forEach(item => {
                if (item.type === 'image_url') {
                    const img = document.createElement('img');
                    img.src = item.image_url.url;
                    img.className = 'max-w-full h-auto rounded-lg my-2';
                    contentDiv.appendChild(img);
                } else {
                    contentDiv.innerHTML += this.formatMessage(item.text);
                }
            });
        } else {
            contentDiv.innerHTML = this.formatMessage(content);
        }

        messageDiv.appendChild(header);
        messageDiv.appendChild(contentDiv);
        this.messageList.appendChild(messageDiv);

        if (shouldScroll) {
            messageDiv.scrollIntoView({ behavior: 'smooth' });
        }

        // Highlight code blocks
        messageDiv.querySelectorAll('pre code').forEach((block) => {
            hljs.highlightElement(block);
        });

        // Add click handlers for copy buttons
        messageDiv.querySelectorAll('.copy-button').forEach((button) => {
            button.addEventListener('click', () => {
                const codeBlock = button.parentElement.querySelector('code');
                navigator.clipboard.writeText(codeBlock.innerText);

                // Show feedback
                const originalText = button.textContent;
                button.textContent = 'Copied!';
                setTimeout(() => (button.textContent = originalText), 2000);
            });
        });
    }

    setupMarkdown() {
        marked.setOptions({
            gfm: true,
            breaks: true,
            headerIds: true,
            mangle: false,
            highlight: function (code, language) {
                const validLanguage = hljs.getLanguage(language) ? language : 'plaintext';
                try {
                    return hljs.highlight(code, { language: validLanguage }).value;
                } catch (err) {
                    console.error('Highlighting failed:', err);
                    return code;
                }
            },
        });

        // Create custom renderer
        const renderer = new marked.Renderer();

        renderer.code = (code, language) => {
            code = code || '';

            if(code.type === 'code') {
                language = language || code.raw.split('\n')[0].replace('```', '');
                code = code.text.trim();
            }

            // Remove surrounding whitespace from language
            language = (language || '').trim().toLowerCase();

            // Only use 'plaintext' if no language is specified
            const validLanguage = hljs.getLanguage(language) ? language : 'plaintext';

            let highlightedCode = '';
            try {
                highlightedCode = hljs.highlight(code, { language: validLanguage, ignoreIllegals: true }).value;
            } catch (error) {
                // If highlighting fails, try plaintext or just escape the code
                console.error('Highlighting failed:', error);
                highlightedCode = escapeHtml(code);
            }

            return `
                <div class="relative group">
                    <button class="copy-button absolute top-2 right-2 px-2 py-1 text-sm bg-discord-100 dark:bg-discord-700 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                        Copy
                    </button>
                    <pre class="rounded-lg"><code class="language-${validLanguage}">${highlightedCode}</code></pre>
                </div>`;
        };

        // Function to escape HTML characters
        function escapeHtml(html) {
            return html.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        }

        marked.use({ renderer });
    }

    updateLastMessage(content, type) {
        const lastMessage = this.messageList.lastElementChild;
        if (lastMessage && lastMessage.classList.contains(type)) {
            lastMessage.classList.remove('loading');
            const contentDiv = lastMessage.querySelector('.message-content');
            if (contentDiv) {
                contentDiv.innerHTML = this.formatMessage(content);
                lastMessage.scrollIntoView({ behavior: 'smooth' });

                // Highlight code blocks
                lastMessage.querySelectorAll('pre code').forEach((block) => {
                    hljs.highlightElement(block);
                });
            }
        }
    }

    showTypingIndicator() {
        const indicator = document.createElement('div');
        indicator.className = 'message llm typing-indicator';
        indicator.innerHTML = '<div class="dots"><span></span><span></span><span></span></div>';
        this.messageList.appendChild(indicator);
        this.scrollToBottom();
    }

    removeTypingIndicator() {
        const indicator = this.messageList.querySelector('.typing-indicator');
        if (indicator) {
            indicator.remove();
        }
    }

    scrollToBottom() {
        this.messageList.scrollTop = this.messageList.scrollHeight;
    }

    clearChat() {
        while (this.messageList.firstChild) {
            this.messageList.removeChild(this.messageList.firstChild);
        }
    }

    formatMessage(content) {
        // Convert HTML comments to visible text
        // content = content.replace(/<!--\s*(.*?)\s*-->/g, '_($1)_');

        // Remove 'markdown' from code blocks as it's not needed
        // content = content.replace(/```markdown\n/g, '```\n');

        // Parse markdown with our custom renderer
        const html = marked.parse(content);

        // Clean up any potential unsafe content
        return html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    }

    async addToolRequest(toolCall, onAccept, onDeny) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'p-4 rounded-lg llm bg-yellow-50 dark:bg-yellow-900';

        const header = document.createElement('div');
        header.className = 'flex justify-between items-center mb-2';

        const title = document.createElement('span');
        title.className = 'font-medium text-yellow-700 dark:text-yellow-300';
        title.textContent = `Tool Request: ${toolCall.function.name}`;

        const buttonGroup = document.createElement('div');
        buttonGroup.className = 'flex gap-2';

        const acceptButton = document.createElement('button');
        acceptButton.className = 'px-3 py-1 bg-green-500 text-white rounded-md hover:bg-green-600';
        acceptButton.textContent = 'Accept';
        acceptButton.onclick = () => onAccept(toolCall);

        const denyButton = document.createElement('button');
        denyButton.className = 'px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600';
        denyButton.textContent = 'Deny';
        denyButton.onclick = () => onDeny(toolCall);

        buttonGroup.appendChild(acceptButton);
        buttonGroup.appendChild(denyButton);

        header.appendChild(title);
        header.appendChild(buttonGroup);

        const args = document.createElement('pre');
        args.className = 'mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded';
        args.textContent = JSON.stringify(JSON.parse(toolCall.function.arguments), null, 2);

        messageDiv.appendChild(header);
        messageDiv.appendChild(args);
        this.messageList.appendChild(messageDiv);
        messageDiv.scrollIntoView({ behavior: 'smooth' });

        return messageDiv;
    }

    addToolResponse(toolCall, result) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'p-4 rounded-lg tool bg-blue-50 dark:bg-blue-900';

        const header = document.createElement('div');
        header.className = 'flex items-center mb-2';

        const title = document.createElement('span');
        title.className = 'font-medium text-blue-700 dark:text-blue-300';
        title.textContent = `Tool Response: ${toolCall.function.name}`;

        header.appendChild(title);

        const content = document.createElement('pre');
        content.className = 'mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded';
        content.textContent = result;

        messageDiv.appendChild(header);
        messageDiv.appendChild(content);
        this.messageList.appendChild(messageDiv);
        messageDiv.scrollIntoView({ behavior: 'smooth' });
    }
}
