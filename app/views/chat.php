<!DOCTYPE html>
<html lang="de" class="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Chat Interface</title>
    <link rel="stylesheet" href="css/main.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.8.0/styles/github-dark.min.css">
</head>
<body class="bg-white dark:bg-discord-600 text-discord-400 dark:text-discord-200">
    <div class="flex flex-col h-screen">
        <header class="bg-discord-50 dark:bg-discord-700 border-b border-discord-100 dark:border-discord-800 p-4">
            <div class="flex justify-between items-center">
                <div class="flex items-center gap-4">
                    <h1 class="text-xl font-bold">AI Chat</h1>
                    <select id="modelSelect" class="rounded-md border-discord-100 dark:border-discord-800 bg-white dark:bg-discord-600 px-3 py-1.5">
                        <option value="amazon/nova-pro-v1">Loading models...</option>
                    </select>
                    <select id="conversationMode" class="rounded-md border-discord-100 dark:border-discord-800 bg-white dark:bg-discord-600 px-3 py-1.5">
                        <option value="standard">Standard Mode</option>
                        <option value="creative">Creative Mode</option>
                        <option value="technical">Technical Mode</option>
                        <option value="analytical">Analytical Mode</option>
                        <option value="antispam">Anti-Spam Mode</option>
                        <option value="moderate">Moderate Mode</option>
                    </select>
                </div>
                <div class="flex items-center gap-4">
                    <div class="tool-toggles flex gap-2">
                        <label class="flex items-center gap-2">
                            <input type="checkbox" class="tool-toggle" data-tool="mathSolver">
                            <span>Math Solver</span>
                        </label>
                        <!-- Add more tool toggles here as needed -->
                    </div>
                    <select id="languageSelect" class="rounded-md border-discord-100 dark:border-discord-800 bg-white dark:bg-discord-600 px-3 py-1.5">
                        <option value="de">Deutsch</option>
                        <option value="en">English</option>
                    </select>
                    <button id="exportButton" class="p-2 hover:bg-discord-100 dark:hover:bg-discord-600 rounded-md">📥</button>
                    <button id="themeToggle" class="p-2 hover:bg-discord-100 dark:hover:bg-discord-600 rounded-md">🌓</button>
                    <button id="clearChat" class="flex items-center gap-2 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-md">
                        <span>🗑️</span> Clear Chat
                    </button>
                </div>
            </div>
        </header>

        <main class="flex-1 overflow-y-auto p-4" role="log" aria-label="Chat Verlauf">
            <div id="messageList" class="chat-container max-w-4xl mx-auto space-y-4"></div>
        </main>

        <footer class="bg-discord-50 dark:bg-discord-700 border-t border-discord-100 dark:border-discord-800 p-4">
            <div class="max-w-4xl mx-auto flex flex-col gap-2">
                <div id="imagePreview" class="hidden flex gap-2 flex-wrap"></div>
                <div class="flex gap-2">
                    <button
                        id="uploadButton"
                        class="px-4 bg-accent-secondary hover:bg-accent-secondary-hover text-white rounded-md"
                        title="Upload Image"
                    >
                        📷
                    </button>
                    <input type="file" id="fileInput" accept="image/*" multiple class="hidden">
                    <textarea
                        id="userInput"
                        class="flex-1 rounded-md border-discord-100 dark:border-discord-800 bg-white dark:bg-discord-600 resize-none"
                        rows="1"
                        placeholder="Nachricht eingeben... (Bilder per Drag & Drop oder Strg+V einfügen)"
                    ></textarea>
                    <button
                        id="sendButton"
                        class="px-4 bg-accent-primary hover:bg-accent-hover text-white rounded-md"
                    >
                        ➤
                    </button>
                </div>
            </div>
        </footer>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.8.0/highlight.min.js"></script>
    <script type="module" src="js/app.js"></script>
</body>
</html>
