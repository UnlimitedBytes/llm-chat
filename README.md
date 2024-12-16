# LLM Chat Application

A modern, feature-rich chat interface for Large Language Models (LLM) with support for multiple models, conversation modes, and file handling capabilities.

## Features

- 🎨 Dark/Light theme support
- 💬 Multiple conversation modes (Standard, Creative, Technical, Analytical)
- 📁 Drag & drop image upload
- 📋 Clipboard image paste support
- 🔧 Built-in tools support
- 📤 Chat export functionality
- ⌨️ Keyboard shortcuts
- 🎯 Code syntax highlighting
- 💾 Local storage for chat history

## Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/exceptioncoding/llm-chat.git
   ```
2. Navigate to the project directory:
   ```bash
   cd llm-chat
   ```
3. Install the dependencies:
   ```bash
   npm install
   ```
4. Configure the application:
   - Copy `example-config.js` to `js/config.js`
   ```bash
   cp example-config.js js/config.js
   ```
   - Edit `js/config.js` and add your OpenRouter API key

5. Build the CSS:
   ```bash
   npm run tailwindcss:build
   ```
6. Start the development server:
   ```bash
   npm start
   ```
7. Open your browser and go to `http://localhost:3000` to see the application in action.
