/**
 * AI Service Integration Module
 * Connects the e-book reader frontend with the AI backend
 */

const AIService = {
    // Backend URL configuration - Unified backend on port 8000
    BACKEND_URL: 'http://localhost:8000',

    // Current book data
    currentBookData: null,

    // Conversation history for Reading Assistant
    chatHistory: [],

    /**
     * Initialize the AI service
     */
    init() {
        console.log('AI Service initialized');
        this.checkBackendHealth();
    },

    /**
     * Check if backend is running
     */
    async checkBackendHealth() {
        try {
            const response = await fetch(`${this.BACKEND_URL}/`);
            const data = await response.json();
            console.log('AI Backend status:', data);
            return data;
        } catch (error) {
            console.error('AI Backend not available:', error);
            this.showError('AI service is not available. Please ensure the backend is running.');
            return null;
        }
    },

    /**
     * Upload and process book for AI analysis
     */
    async uploadBook(file) {
        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch(`${this.BACKEND_URL}/api/upload-book`, {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                this.currentBookData = result.data;
                console.log('Book processed:', this.currentBookData.title);
                return result.data;
            } else {
                throw new Error(result.error || 'Failed to process book');
            }
        } catch (error) {
            console.error('Error uploading book:', error);
            this.showError('Failed to process book for AI analysis');
            return null;
        }
    },

    /**
     * Generate book summary with language support
     */
    async generateBookSummary(language = 'en') {
        if (!this.currentBookData) {
            this.showError('Please load a book first');
            return null;
        }

        try {
            this.showLoading(language === 'zh' ? '正在生成书籍摘要...' : 'Generating book summary...');

            const response = await fetch(`${this.BACKEND_URL}/api/book-summary`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    title: this.currentBookData.title,
                    author: this.currentBookData.author,
                    full_text: this.currentBookData.full_text,
                    language: language
                })
            });

            const result = await response.json();

            this.hideLoading();

            if (result.success) {
                return result.data.summary;
            } else {
                throw new Error(result.error || 'Failed to generate summary');
            }
        } catch (error) {
            console.error('Error generating book summary:', error);
            this.hideLoading();
            this.showError(language === 'zh' ? '生成书籍摘要失败' : 'Failed to generate book summary');
            return null;
        }
    },

    /**
     * Generate chapter summaries with language support
     */
    async generateChapterSummaries(language = 'en') {
        if (!this.currentBookData || !this.currentBookData.chapters) {
            this.showError(language === 'zh' ? '没有可用的章节' : 'No chapters available');
            return null;
        }

        try {
            this.showLoading(language === 'zh' ? '正在生成章节摘要...' : 'Generating chapter summaries...');

            console.log('Sending chapter summaries request with chapters:', this.currentBookData.chapters.length);

            const response = await fetch(`${this.BACKEND_URL}/api/chapter-summaries`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    book_title: this.currentBookData.title,
                    chapters: this.currentBookData.chapters,
                    language: language
                })
            });

            const result = await response.json();
            console.log('Chapter summaries response:', result);

            this.hideLoading();

            if (result.success) {
                // Return the chapter summaries in the expected format
                const summaries = result.data.chapter_summaries.map(s => ({
                    title: s.chapter_title,
                    summary: s.summary
                }));
                console.log('Formatted summaries:', summaries);
                return summaries;
            } else {
                throw new Error(result.error || 'Failed to generate summaries');
            }
        } catch (error) {
            console.error('Error generating chapter summaries:', error);
            this.hideLoading();
            this.showError(language === 'zh' ? '生成章节摘要失败' : 'Failed to generate chapter summaries');
            return null;
        }
    },

    /**
     * Analyze content with language support
     */
    async analyzeContent(analysisType = 'comprehensive', language = 'en') {
        if (!this.currentBookData) {
            this.showError(language === 'zh' ? '请先加载一本书' : 'Please load a book first');
            return null;
        }

        try {
            this.showLoading(language === 'zh' ? `正在进行${analysisType}分析...` : `Performing ${analysisType} analysis...`);

            const response = await fetch(`${this.BACKEND_URL}/api/content-analysis`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    book_title: this.currentBookData.title,
                    content: this.currentBookData.full_text,
                    analysis_type: analysisType,
                    language: language
                })
            });

            const result = await response.json();

            this.hideLoading();

            if (result.success) {
                return result.data.analysis;
            } else {
                throw new Error(result.error || 'Failed to analyze content');
            }
        } catch (error) {
            console.error('Error analyzing content:', error);
            this.hideLoading();
            this.showError(language === 'zh' ? '内容分析失败' : 'Failed to analyze content');
            return null;
        }
    },

    /**
     * Send chat message to Reading Assistant with language support
     */
    async sendChatMessage(message, chatHistory = [], language = 'en') {
        try {
            // Prepare conversation history
            const messages = chatHistory.slice(0, -1).map(msg => ({
                role: msg.role,
                content: msg.content
            }));

            // Add the new user message
            messages.push({
                role: 'user',
                content: message
            });

            // Include book context if available
            const bookContext = this.currentBookData ? {
                title: this.currentBookData.title,
                author: this.currentBookData.author,
                current_chapter: this.getCurrentChapterTitle(),
                language: language
            } : null;

            const response = await fetch(`${this.BACKEND_URL}/api/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    messages: messages,
                    book_context: bookContext,
                    language: language
                })
            });

            const result = await response.json();

            if (result.success) {
                return result.data.response;
            } else {
                throw new Error(result.error || 'Failed to get response');
            }
        } catch (error) {
            console.error('Error in chat:', error);
            this.showError(language === 'zh' ? '读书助手响应失败' : 'Failed to get response from Reading Assistant');
            return null;
        }
    },

    /**
     * Ask a single question (without conversation history)
     */
    async askQuestion(question) {
        if (!this.currentBookData) {
            this.showError('Please load a book first');
            return null;
        }

        try {
            const params = new URLSearchParams({
                book_title: this.currentBookData.title,
                question: question
            });

            const response = await fetch(`${this.BACKEND_URL}/api/ask-question?${params}`, {
                method: 'POST'
            });

            const result = await response.json();

            if (result.success) {
                return result.data.answer;
            } else {
                throw new Error(result.error || 'Failed to get answer');
            }
        } catch (error) {
            console.error('Error asking question:', error);
            this.showError('Failed to get answer');
            return null;
        }
    },

    /**
     * Clear chat history
     */
    clearChatHistory() {
        this.chatHistory = [];
        console.log('Chat history cleared');
    },

    /**
     * Helper function to get current chapter title
     */
    getCurrentChapterTitle() {
        // This should be integrated with your actual reader state
        // For now, returning a placeholder
        return 'Current Chapter';
    },

    /**
     * UI Helper: Show loading indicator
     */
    showLoading(message = 'Loading...') {
        // Create or update loading overlay
        let loadingEl = document.getElementById('ai-loading');
        if (!loadingEl) {
            loadingEl = document.createElement('div');
            loadingEl.id = 'ai-loading';
            loadingEl.className = 'ai-loading-overlay';
            document.body.appendChild(loadingEl);
        }

        loadingEl.innerHTML = `
            <div class="ai-loading-content">
                <div class="spinner-border text-primary" role="status">
                    <span class="sr-only">Loading...</span>
                </div>
                <div class="mt-3">${message}</div>
                <small class="text-muted mt-2">This may take 30-60 seconds with DeepSeek Reasoner model</small>
            </div>
        `;
        loadingEl.style.display = 'flex';
    },

    /**
     * UI Helper: Hide loading indicator
     */
    hideLoading() {
        const loadingEl = document.getElementById('ai-loading');
        if (loadingEl) {
            loadingEl.style.display = 'none';
        }
    },

    /**
     * UI Helper: Show error message
     */
    showError(message) {
        // Create or update error alert
        let errorEl = document.getElementById('ai-error');
        if (!errorEl) {
            errorEl = document.createElement('div');
            errorEl.id = 'ai-error';
            document.body.appendChild(errorEl);
        }

        errorEl.className = 'alert alert-danger ai-error-alert';
        errorEl.innerHTML = `
            <i class="bi bi-exclamation-triangle-fill me-2"></i>
            ${message}
            <button type="button" class="btn-close" onclick="this.parentElement.remove()"></button>
        `;

        // Auto-hide after 5 seconds
        setTimeout(() => {
            if (errorEl.parentElement) {
                errorEl.remove();
            }
        }, 5000);
    },

    /**
     * Format AI response with markdown support
     */
    formatResponse(text) {
        // Basic markdown to HTML conversion
        let formatted = text;

        // Headers
        formatted = formatted.replace(/^### (.*$)/gim, '<h5>$1</h5>');
        formatted = formatted.replace(/^## (.*$)/gim, '<h4>$1</h4>');
        formatted = formatted.replace(/^# (.*$)/gim, '<h3>$1</h3>');

        // Bold
        formatted = formatted.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

        // Italic
        formatted = formatted.replace(/\*(.+?)\*/g, '<em>$1</em>');

        // Lists
        formatted = formatted.replace(/^\* (.+)/gim, '<li>$1</li>');
        formatted = formatted.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');

        // Line breaks
        formatted = formatted.replace(/\n\n/g, '</p><p>');
        formatted = '<p>' + formatted + '</p>';

        return formatted;
    }
};

// Add required CSS for loading and error UI
const aiServiceStyles = `
<style>
.ai-loading-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    display: none;
    align-items: center;
    justify-content: center;
    z-index: 10000;
}

.ai-loading-content {
    background: white;
    padding: 2rem;
    border-radius: 8px;
    text-align: center;
    min-width: 300px;
}

.ai-error-alert {
    position: fixed;
    top: 20px;
    right: 20px;
    min-width: 300px;
    z-index: 10001;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}
</style>
`;

// Inject styles when script loads
document.head.insertAdjacentHTML('beforeend', aiServiceStyles);

// Initialize AI service when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => AIService.init());
} else {
    AIService.init();
}

// Export for use in other scripts
window.AIService = AIService;