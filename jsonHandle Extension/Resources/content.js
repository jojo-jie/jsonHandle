// Optimized JSON Handler - Content Script
// Modern, performant JSON viewer with enhanced UX

// Global state management
const state = {
    processed: false,
    lastParsedJSON: null,
    searchResults: [],
    currentSearchIndex: 0,
    isSearchVisible: false,
    currentPath: '',
    theme: 'light'
};

// Performance optimizations
const config = {
    maxJsonSize: 10 * 1024 * 1024, // 10MB limit
    debounceDelay: 300,
    animationDuration: 200,
    maxSearchResults: 1000,
    collapseThreshold: 50 // Auto-collapse arrays/objects with more items
};

// Utility functions
const utils = {
    debounce: (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    throttle: (func, limit) => {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    escapeHtml: (text) => {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    formatNumber: (num) => {
        return new Intl.NumberFormat().format(num);
    },

    getType: (value) => {
        if (value === null) return 'null';
        if (Array.isArray(value)) return 'array';
        return typeof value;
    },

    isValidJson: (text) => {
        try {
            JSON.parse(text);
            return true;
        } catch {
            return false;
        }
    }
};

// Enhanced JSON detection
class JsonDetector {
    static detectJson() {
        const content = this.extractContent();
        if (!content || content.length > config.maxJsonSize) return null;

        // Try direct parsing first
        if (utils.isValidJson(content)) {
            return JSON.parse(content);
        }

        // Try to extract JSON from mixed content
        const extracted = this.extractJsonFromString(content);
        if (extracted) {
            return extracted;
        }

        return null;
    }

    static extractContent() {
        // Try different extraction methods
        const methods = [
            () => document.body.textContent,
            () => document.querySelector('pre')?.textContent,
            () => document.querySelector('code')?.textContent,
            () => document.documentElement.innerText
        ];

        for (const method of methods) {
            const content = method();
            if (content && content.trim()) {
                return content.trim();
            }
        }
        return null;
    }

    static extractJsonFromString(text) {
        // Look for JSON objects or arrays
        const jsonPattern = /(\{[\s\S]*?\}|\[[\s\S]*?\])/g;
        const matches = text.match(jsonPattern);
        
        if (matches) {
            // Try the largest match first
            const sorted = matches.sort((a, b) => b.length - a.length);
            for (const match of sorted) {
                if (utils.isValidJson(match)) {
                    return JSON.parse(match);
                }
            }
        }
        return null;
    }
}

// Modern CSS-in-JS styling
class StyleManager {
    static injectStyles() {
        const style = document.createElement('style');
        style.textContent = this.getStyles();
        document.head.appendChild(style);
    }

    static getStyles() {
        return `
            :root {
                --primary: #6366f1;
                --primary-dark: #4f46e5;
                --secondary: #8b5cf6;
                --success: #10b981;
                --warning: #f59e0b;
                --error: #ef4444;
                --bg-primary: #ffffff;
                --bg-secondary: #f8fafc;
                --bg-tertiary: #f1f5f9;
                --text-primary: #1e293b;
                --text-secondary: #64748b;
                --border: #e2e8f0;
                --shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                --radius: 0.5rem;
                --transition: 0.2s ease;
            }

            @media (prefers-color-scheme: dark) {
                :root {
                    --bg-primary: #0f172a;
                    --bg-secondary: #1e293b;
                    --bg-tertiary: #334155;
                    --text-primary: #f8fafc;
                    --text-secondary: #cbd5e1;
                    --border: #334155;
                }
            }

            * {
                box-sizing: border-box;
            }

            body {
                margin: 0;
                padding: 0;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background: var(--bg-secondary);
                color: var(--text-primary);
                line-height: 1.6;
                overflow-x: hidden;
            }

            .json-viewer {
                padding: 2rem;
                max-width: 100%;
                overflow-x: auto;
            }

            .toolbar {
                position: sticky;
                top: 0;
                background: var(--bg-primary);
                border-bottom: 1px solid var(--border);
                padding: 1rem;
                z-index: 100;
                backdrop-filter: blur(10px);
                background: rgba(255, 255, 255, 0.9);
            }

            @media (prefers-color-scheme: dark) {
                .toolbar {
                    background: rgba(15, 23, 42, 0.9);
                }
            }

            .toolbar-content {
                display: flex;
                justify-content: space-between;
                align-items: center;
                gap: 1rem;
                flex-wrap: wrap;
            }

            .toolbar-left {
                display: flex;
                align-items: center;
                gap: 1rem;
            }

            .toolbar-right {
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }

            .btn {
                padding: 0.5rem 1rem;
                border: none;
                border-radius: var(--radius);
                background: var(--primary);
                color: white;
                cursor: pointer;
                font-size: 0.875rem;
                font-weight: 500;
                transition: var(--transition);
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }

            .btn:hover {
                background: var(--primary-dark);
                transform: translateY(-1px);
            }

            .btn:active {
                transform: translateY(0);
            }

            .btn-secondary {
                background: var(--bg-tertiary);
                color: var(--text-primary);
                border: 1px solid var(--border);
            }

            .btn-secondary:hover {
                background: var(--border);
            }

            .json-container {
                background: var(--bg-primary);
                border: 1px solid var(--border);
                border-radius: var(--radius);
                padding: 1.5rem;
                margin-top: 1rem;
                box-shadow: var(--shadow);
                font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
                font-size: 0.875rem;
                line-height: 1.5;
            }

            .json-row {
                padding: 0.25rem 0;
                border-radius: 0.25rem;
                transition: var(--transition);
                cursor: pointer;
            }

            .json-row:hover {
                background: var(--bg-tertiary);
            }

            .json-row.selected {
                background: rgba(99, 102, 241, 0.1);
                border-left: 3px solid var(--primary);
            }

            .json-key {
                color: var(--primary);
                font-weight: 600;
            }

            .json-string {
                color: #059669;
            }

            .json-number {
                color: #dc2626;
            }

            .json-boolean {
                color: #7c3aed;
            }

            .json-null {
                color: #6b7280;
            }

            .collapsible {
                cursor: pointer;
                user-select: none;
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }

            .collapsible:hover {
                color: var(--primary);
            }

            .expand-icon {
                width: 16px;
                height: 16px;
                transition: var(--transition);
                flex-shrink: 0;
            }

            .expand-icon.collapsed {
                transform: rotate(-90deg);
            }

            .collapsed-content {
                display: none;
            }

            .search-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.5);
                z-index: 200;
                display: none;
            }

            .search-container {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: var(--bg-primary);
                border: 1px solid var(--border);
                border-radius: var(--radius);
                padding: 1.5rem;
                box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
                z-index: 201;
                width: 90%;
                max-width: 500px;
                display: none;
            }

            .search-input {
                width: 100%;
                padding: 0.75rem;
                border: 1px solid var(--border);
                border-radius: var(--radius);
                font-size: 1rem;
                background: var(--bg-secondary);
                color: var(--text-primary);
                margin-bottom: 1rem;
            }

            .search-input:focus {
                outline: none;
                border-color: var(--primary);
            }

            .search-info {
                display: flex;
                justify-content: space-between;
                align-items: center;
                font-size: 0.875rem;
                color: var(--text-secondary);
                margin-bottom: 1rem;
            }

            .search-nav {
                display: flex;
                gap: 0.5rem;
            }

            .search-result {
                background: rgba(99, 102, 241, 0.2);
                border-radius: 0.25rem;
            }

            .search-result.active {
                background: rgba(99, 102, 241, 0.4);
            }

            .path-bar {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                background: var(--bg-primary);
                border-bottom: 1px solid var(--border);
                padding: 0.75rem 1rem;
                z-index: 99;
                font-family: monospace;
                font-size: 0.875rem;
                backdrop-filter: blur(10px);
            }

            .path-content {
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .path-text {
                color: var(--text-secondary);
            }

            .path-value {
                color: var(--primary);
                font-weight: 600;
            }

            .loading {
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 2rem;
                color: var(--text-secondary);
            }

            .spinner {
                width: 20px;
                height: 20px;
                border: 2px solid var(--border);
                border-top: 2px solid var(--primary);
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin-right: 0.5rem;
            }

            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }

            .fade-in {
                animation: fadeIn 0.3s ease-in;
            }

            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }

            .stats {
                display: flex;
                gap: 1rem;
                font-size: 0.875rem;
                color: var(--text-secondary);
            }

            .stat-item {
                display: flex;
                align-items: center;
                gap: 0.25rem;
            }

            @media (max-width: 768px) {
                .json-viewer {
                    padding: 1rem;
                }
                
                .toolbar-content {
                    flex-direction: column;
                    align-items: stretch;
                }
                
                .toolbar-left,
                .toolbar-right {
                    justify-content: center;
                }
            }
        `;
    }
}

// JSON rendering engine
class JsonRenderer {
    static render(jsonData, container, path = '') {
        const type = utils.getType(jsonData);
        
        switch (type) {
            case 'object':
                return this.renderObject(jsonData, container, path);
            case 'array':
                return this.renderArray(jsonData, container, path);
            default:
                return this.renderPrimitive(jsonData, type, container, path);
        }
    }

    static renderObject(obj, container, path) {
        const keys = Object.keys(obj);
        const isEmpty = keys.length === 0;
        
        if (isEmpty) {
            container.textContent = '{}';
            return container;
        }

        const shouldCollapse = keys.length > config.collapseThreshold;
        const content = this.createCollapsibleContent('{', '}', shouldCollapse);
        
        keys.forEach((key, index) => {
            const row = document.createElement('div');
            row.className = 'json-row';
            row.dataset.path = `${path}.${key}`;
            
            const value = obj[key];
            const valueContainer = document.createElement('span');
            
            row.innerHTML = `<span class="json-key">"${utils.escapeHtml(key)}"</span>: `;
            row.appendChild(valueContainer);
            
            this.render(value, valueContainer, `${path}.${key}`);
            
            if (index < keys.length - 1) {
                row.appendChild(document.createTextNode(','));
            }
            
            content.appendChild(row);
        });
        
        container.appendChild(content);
        return container;
    }

    static renderArray(arr, container, path) {
        const isEmpty = arr.length === 0;
        
        if (isEmpty) {
            container.textContent = '[]';
            return container;
        }

        const shouldCollapse = arr.length > config.collapseThreshold;
        const content = this.createCollapsibleContent('[', ']', shouldCollapse);
        
        arr.forEach((item, index) => {
            const row = document.createElement('div');
            row.className = 'json-row';
            row.dataset.path = `${path}[${index}]`;
            
            const valueContainer = document.createElement('span');
            this.render(item, valueContainer, `${path}[${index}]`);
            
            row.appendChild(valueContainer);
            
            if (index < arr.length - 1) {
                row.appendChild(document.createTextNode(','));
            }
            
            content.appendChild(row);
        });
        
        container.appendChild(content);
        return container;
    }

    static renderPrimitive(value, type, container, path) {
        const span = document.createElement('span');
        span.className = `json-${type}`;
        span.dataset.path = path;
        
        switch (type) {
            case 'string':
                span.textContent = `"${utils.escapeHtml(value)}"`;
                break;
            case 'number':
                span.textContent = value;
                break;
            case 'boolean':
                span.textContent = value;
                break;
            case 'null':
                span.textContent = 'null';
                break;
        }
        
        container.appendChild(span);
        return container;
    }

    static createCollapsibleContent(open, close, collapsed = false) {
        const wrapper = document.createElement('div');
        wrapper.className = 'json-collapsible';
        
        const header = document.createElement('div');
        header.className = 'collapsible';
        header.innerHTML = `
            <svg class="expand-icon ${collapsed ? 'collapsed' : ''}" viewBox="0 0 24 24" fill="currentColor">
                <path d="M7 10l5 5 5-5z"/>
            </svg>
            <span>${open}</span>
        `;
        
        const content = document.createElement('div');
        content.className = `collapsible-content ${collapsed ? 'collapsed' : ''}`;
        
        const footer = document.createElement('div');
        footer.textContent = close;
        footer.style.marginLeft = '1rem';
        
        header.addEventListener('click', () => {
            const icon = header.querySelector('.expand-icon');
            icon.classList.toggle('collapsed');
            content.classList.toggle('collapsed');
        });
        
        wrapper.appendChild(header);
        wrapper.appendChild(content);
        wrapper.appendChild(footer);
        
        return { header, content, wrapper };
    }
}

// Search functionality
class SearchManager {
    static init() {
        this.searchOverlay = document.createElement('div');
        this.searchOverlay.className = 'search-overlay';
        
        this.searchContainer = document.createElement('div');
        this.searchContainer.className = 'search-container';
        
        this.searchContainer.innerHTML = `
            <input type="text" class="search-input" placeholder="Search JSON...">
            <div class="search-info">
                <span class="search-count">0 results</span>
                <div class="search-nav">
                    <button class="btn btn-secondary" id="searchPrev">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
                        </svg>
                    </button>
                    <button class="btn btn-secondary" id="searchNext">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
                        </svg>
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(this.searchOverlay);
        document.body.appendChild(this.searchContainer);
        
        this.setupEventListeners();
    }

    static setupEventListeners() {
        const searchInput = this.searchContainer.querySelector('.search-input');
        const searchPrev = this.searchContainer.querySelector('#searchPrev');
        const searchNext = this.searchContainer.querySelector('#searchNext');
        
        searchInput.addEventListener('input', utils.debounce(() => {
            this.performSearch(searchInput.value);
        }, config.debounceDelay));
        
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.navigateResults(1);
            } else if (e.key === 'Escape') {
                this.hide();
            }
        });
        
        searchPrev.addEventListener('click', () => this.navigateResults(-1));
        searchNext.addEventListener('click', () => this.navigateResults(1));
        
        this.searchOverlay.addEventListener('click', () => this.hide());
    }

    static show() {
        this.searchOverlay.style.display = 'block';
        this.searchContainer.style.display = 'block';
        this.searchContainer.querySelector('.search-input').focus();
        state.isSearchVisible = true;
    }

    static hide() {
        this.searchOverlay.style.display = 'none';
        this.searchContainer.style.display = 'none';
        this.searchContainer.querySelector('.search-input').value = '';
        this.clearResults();
        state.isSearchVisible = false;
    }

    static performSearch(query) {
        this.clearResults();
        
        if (!query) return;
        
        const rows = document.querySelectorAll('.json-row');
        const results = [];
        
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            if (text.includes(query.toLowerCase())) {
                results.push(row);
                row.classList.add('search-result');
            }
        });
        
        state.searchResults = results;
        state.currentSearchIndex = 0;
        
        this.updateSearchCount();
        
        if (results.length > 0) {
            this.highlightCurrentResult();
        }
    }

    static navigateResults(direction) {
        if (state.searchResults.length === 0) return;
        
        state.currentSearchIndex += direction;
        
        if (state.currentSearchIndex < 0) {
            state.currentSearchIndex = state.searchResults.length - 1;
        } else if (state.currentSearchIndex >= state.searchResults.length) {
            state.currentSearchIndex = 0;
        }
        
        this.highlightCurrentResult();
    }

    static highlightCurrentResult() {
        state.searchResults.forEach((result, index) => {
            result.classList.toggle('active', index === state.currentSearchIndex);
        });
        
        const current = state.searchResults[state.currentSearchIndex];
        if (current) {
            current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        
        this.updateSearchCount();
    }

    static updateSearchCount() {
        const countElement = this.searchContainer.querySelector('.search-count');
        const count = state.searchResults.length;
        const current = count > 0 ? state.currentSearchIndex + 1 : 0;
        
        countElement.textContent = count > 0 ? `${current} / ${count} results` : '0 results';
    }

    static clearResults() {
        state.searchResults = [];
        state.currentSearchIndex = 0;
        
        document.querySelectorAll('.search-result').forEach(el => {
            el.classList.remove('search-result', 'active');
        });
        
        this.updateSearchCount();
    }
}

// Main application
class JsonHandler {
    constructor() {
        this.jsonData = null;
        this.container = null;
        this.pathBar = null;
    }

    init() {
        if (state.processed) return;
        
        this.detectAndProcessJson();
        this.setupKeyboardShortcuts();
        this.setupMessageListener();
    }

    detectAndProcessJson() {
        const jsonData = JsonDetector.detectJson();
        
        if (!jsonData) {
            console.log('No JSON detected on this page');
            return;
        }
        
        state.lastParsedJSON = jsonData;
        state.processed = true;
        this.jsonData = jsonData;
        
        this.renderInterface();
    }

    renderInterface() {
        // Clear existing content
        document.body.innerHTML = '';
        
        // Inject styles
        StyleManager.injectStyles();
        
        // Create path bar
        this.createPathBar();
        
        // Create toolbar
        this.createToolbar();
        
        // Create JSON container
        this.container = document.createElement('div');
        this.container.className = 'json-viewer';
        
        const jsonContainer = document.createElement('div');
        jsonContainer.className = 'json-container';
        
        JsonRenderer.render(this.jsonData, jsonContainer);
        this.container.appendChild(jsonContainer);
        
        document.body.appendChild(this.container);
        
        // Initialize search
        SearchManager.init();
        
        // Add fade-in animation
        this.container.classList.add('fade-in');
        
        // Setup row interactions
        this.setupRowInteractions();
        
        console.log('JSON viewer initialized successfully');
    }

    createPathBar() {
        this.pathBar = document.createElement('div');
        this.pathBar.className = 'path-bar';
        this.pathBar.innerHTML = `
            <div class="path-content">
                <span class="path-text">Path:</span>
                <span class="path-value" id="pathValue">root</span>
                <div class="stats">
                    <div class="stat-item">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z"/>
                        </svg>
                        <span id="jsonSize">${this.calculateSize()}</span>
                    </div>
                    <div class="stat-item">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M3 13h2v8H3zm4-8h2v16H7zm4-2h2v18h-2zm4 4h2v14h-2zm4-4h2v18h-2z"/>
                        </svg>
                        <span id="jsonComplexity">${this.calculateComplexity()}</span>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(this.pathBar);
    }

    createToolbar() {
        const toolbar = document.createElement('div');
        toolbar.className = 'toolbar';
        
        toolbar.innerHTML = `
            <div class="toolbar-content">
                <div class="toolbar-left">
                    <h2 style="margin: 0; color: var(--primary);">JSON Viewer</h2>
                </div>
                <div class="toolbar-right">
                    <button class="btn" id="searchBtn">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                        </svg>
                        Search (⌘K)
                    </button>
                    <button class="btn btn-secondary" id="copyBtn">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                        </svg>
                        Copy
                    </button>
                    <button class="btn btn-secondary" id="downloadBtn">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
                        </svg>
                        Download
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(toolbar);
        
        // Setup button events
        document.getElementById('searchBtn').addEventListener('click', () => {
            SearchManager.show();
        });
        
        document.getElementById('copyBtn').addEventListener('click', () => {
            this.copyJson();
        });
        
        document.getElementById('downloadBtn').addEventListener('click', () => {
            this.downloadJson();
        });
    }

    setupRowInteractions() {
        const rows = document.querySelectorAll('.json-row');
        
        rows.forEach(row => {
            row.addEventListener('click', (e) => {
                e.stopPropagation();
                
                // Remove previous selection
                document.querySelectorAll('.json-row.selected').forEach(r => {
                    r.classList.remove('selected');
                });
                
                // Add selection
                row.classList.add('selected');
                
                // Update path
                const path = row.dataset.path || 'root';
                this.updatePath(path);
                
                // Show value info (could be enhanced with a tooltip)
                this.showValueInfo(row, path);
            });
        });
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Command/Ctrl + K for search
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                SearchManager.show();
            }
            
            // Escape to close search
            if (e.key === 'Escape' && state.isSearchVisible) {
                SearchManager.hide();
            }
            
            // Copy with Command/Ctrl + C
            if ((e.metaKey || e.ctrlKey) && e.key === 'c') {
                const selectedRow = document.querySelector('.json-row.selected');
                if (selectedRow) {
                    e.preventDefault();
                    this.copySelectedValue(selectedRow);
                }
            }
        });
    }

    setupMessageListener() {
        browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
            if (request.action === 'ping') {
                sendResponse({status: 'ok'});
            }
            
            if (request.action === 'getJsonData') {
                sendResponse({data: this.jsonData});
            }
        });
    }

    updatePath(path) {
        state.currentPath = path;
        const pathElement = document.getElementById('pathValue');
        if (pathElement) {
            pathElement.textContent = path;
        }
    }

    showValueInfo(row, path) {
        // This could be enhanced to show a detailed tooltip with value information
        console.log(`Selected: ${path}`);
    }

    copyJson() {
        const jsonString = JSON.stringify(this.jsonData, null, 2);
        navigator.clipboard.writeText(jsonString).then(() => {
            this.showToast('JSON copied to clipboard!');
        }).catch(err => {
            console.error('Failed to copy JSON:', err);
            this.showToast('Failed to copy JSON', 'error');
        });
    }

    copySelectedValue(row) {
        try {
            const path = row.dataset.path;
            const value = this.getValueByPath(path);
            const jsonString = JSON.stringify(value, null, 2);
            
            navigator.clipboard.writeText(jsonString).then(() => {
                this.showToast('Value copied to clipboard!');
            });
        } catch (err) {
            console.error('Failed to copy value:', err);
        }
    }

    downloadJson() {
        const jsonString = JSON.stringify(this.jsonData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `data-${Date.now()}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
        this.showToast('JSON downloaded!');
    }

    getValueByPath(path) {
        if (!path || path === 'root') return this.jsonData;
        
        const parts = path.replace(/^\./, '').split(/\.|\[|\]/).filter(p => p);
        let value = this.jsonData;
        
        for (const part of parts) {
            if (part && /^\d+$/.test(part)) {
                value = value[parseInt(part)];
            } else if (part) {
                value = value[part];
            }
        }
        
        return value;
    }

    calculateSize() {
        const size = new Blob([JSON.stringify(this.jsonData)]).size;
        if (size < 1024) return `${size}B`;
        if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)}KB`;
        return `${(size / (1024 * 1024)).toFixed(1)}MB`;
    }

    calculateComplexity() {
        const count = (obj) => {
            if (typeof obj !== 'object' || obj === null) return 1;
            if (Array.isArray(obj)) return obj.reduce((sum, item) => sum + count(item), 1);
            return Object.values(obj).reduce((sum, value) => sum + count(value), 1);
        };
        
        return utils.formatNumber(count(this.jsonData)) + ' elements';
    }

    showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            background: ${type === 'success' ? 'var(--success)' : 'var(--error)'};
            color: white;
            border-radius: var(--radius);
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }
}

// Initialize the application
const jsonHandler = new JsonHandler();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => jsonHandler.init());
} else {
    jsonHandler.init();
}

// Handle page changes (for SPAs)
let lastUrl = location.href;
new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
        lastUrl = url;
        state.processed = false; // Reset state for new page
        setTimeout(() => jsonHandler.init(), 1000);
    }
}).observe(document, { subtree: true, childList: true });

// Export for debugging
window.jsonHandler = jsonHandler;