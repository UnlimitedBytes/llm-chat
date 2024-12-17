export class FileHandler {
    constructor() {
        this.supportedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        this.pendingImages = [];
        this.setupGlobalDropZone();
        this.setupClipboardPaste();
    }

    setupGlobalDropZone() {
        const dropHandlers = (e) => {
            e.preventDefault();
            e.stopPropagation();
        };

        // Make entire window a drop zone
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            window.addEventListener(eventName, dropHandlers, true);
        });

        window.addEventListener('drop', (e) => {
            e.preventDefault();
            this.handleDrop(e.dataTransfer.files);
        }, true);
    }

    setupDropZone(element) {
        if (!element) {
            console.warn('Drop zone element not found');
            return;
        }

        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            element.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
            }, true); // Added 'true' to ensure event capture
        });

        element.addEventListener('dragover', () => {
            element.classList.add('bg-discord-100', 'dark:bg-discord-700', 'border-2', 'border-dashed', 'border-discord-300');
        });

        element.addEventListener('dragleave', () => {
            element.classList.remove('bg-discord-100', 'dark:bg-discord-700', 'border-2', 'border-dashed', 'border-discord-300');
        });

        element.addEventListener('drop', (e) => {
            element.classList.remove('bg-discord-100', 'dark:bg-discord-700', 'border-2', 'border-dashed', 'border-discord-300');
            this.handleDrop(e.dataTransfer.files);
        });
    }

    async handleDrop(files) {
        for (const file of files) {
            if (!this.supportedTypes.includes(file.type)) {
                console.warn(`Unsupported file type: ${file.type}`);
                continue;
            }
            await this.addPendingImage(file);
        }
    }

    async addPendingImage(file) {
        try {
            const base64Data = await this.fileToBase64(file);
            this.pendingImages.push({
                type: "image_url",
                image_url: {
                    url: base64Data
                }
            });
            window.chatApp.updateImagePreview();
        } catch (error) {
            console.error('Error handling image:', error);
        }
    }

    clearPendingImages() {
        this.pendingImages = [];
    }

    getPendingImages() {
        return [...this.pendingImages];
    }

    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    setupClipboardPaste() {
        const userInput = document.getElementById('userInput');
        userInput.addEventListener('paste', async (e) => {
            const items = e.clipboardData.items;

            for (const item of items) {
                if (item.type.startsWith('image/')) {
                    const file = item.getAsFile();
                    if (file) {
                        await this.addPendingImage(file);
                    }
                }
            }
        });
    }
}
