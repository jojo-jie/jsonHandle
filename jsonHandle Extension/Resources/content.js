// Optimized JSON Handler - Content Script
// Modern, performant JSON viewer with enhanced UX

const SETTINGS_API = globalThis.JsonHandleSettings;

// Global state management
const state = {
    processed: false,
    lastParsedJSON: null,
    searchResults: [],
    currentSearchIndex: 0,
    isSearchVisible: false,
    currentPath: '',
    currentPathTokens: encodeURIComponent('[]'),
    theme: 'light',
    viewMode: 'tree',
    showStats: true
};

// Performance optimizations
const config = {
    maxJsonSize: 10 * 1024 * 1024, // 10MB limit
    debounceDelay: 300,
    animationDuration: 200,
    maxSearchResults: 1000,
    collapseThreshold: 50 // Auto-collapse arrays/objects with more items
};

const defaultSettings = SETTINGS_API?.DEFAULTS ? { ...SETTINGS_API.DEFAULTS } : {
    theme: 'auto',
    collapseThreshold: 50,
    maxJsonSizeMB: 10,
    showStats: true
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
    },

    clamp: (value, min, max) => Math.min(Math.max(value, min), max),

    truncate: (text, maxLength) => {
        if (text.length <= maxLength) return text;
        return text.slice(0, maxLength) + '…';
    },

    encodePathTokens: (tokens = []) => encodeURIComponent(JSON.stringify(tokens)),

    decodePathTokens: (encodedTokens) => {
        if (!encodedTokens) return [];
        try {
            const parsed = JSON.parse(decodeURIComponent(encodedTokens));
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    },

    isIdentifierKey: (key) => /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(key),

    formatPathDisplay: (tokens = []) => {
        if (!tokens.length) return 'root';
        let result = 'root';
        for (const token of tokens) {
            if (typeof token === 'number') {
                result += `[${token}]`;
                continue;
            }
            if (utils.isIdentifierKey(token)) {
                result += `.${token}`;
            } else {
                result += `[${JSON.stringify(String(token))}]`;
            }
        }
        return result;
    }
};

// Settings manager
class SettingsManager {
    static async load() {
        try {
            const stored = await browser.storage.local.get('settings');
            const settings = SETTINGS_API?.merge
                ? SETTINGS_API.merge(stored.settings || {})
                : { ...defaultSettings, ...(stored.settings || {}) };
            this.apply(settings, false);
            return settings;
        } catch (err) {
            console.error('Failed to load settings:', err);
            this.apply(defaultSettings, false);
            return defaultSettings;
        }
    }

    static apply(settings, persist = true) {
        const normalized = SETTINGS_API?.normalize
            ? SETTINGS_API.normalize(settings || {})
            : {
                theme: settings?.theme || defaultSettings.theme,
                collapseThreshold: utils.clamp(Number(settings?.collapseThreshold) || 50, 0, 10000),
                maxJsonSizeMB: utils.clamp(Number(settings?.maxJsonSizeMB) || 10, 1, 100),
                showStats: settings?.showStats !== false
            };

        state.theme = normalized.theme;
        config.collapseThreshold = normalized.collapseThreshold;
        config.maxJsonSize = normalized.maxJsonSizeMB * 1024 * 1024;
        state.showStats = normalized.showStats;

        ThemeManager.applyTheme(state.theme);
        if (persist) {
            browser.storage.local.set({ settings: normalized }).catch(err => {
                console.error('Failed to persist settings:', err);
            });
        }
    }
}

class ThemeManager {
    static applyTheme(theme) {
        const root = document.documentElement;
        root.removeAttribute('data-theme');
        if (theme === 'light') {
            root.setAttribute('data-theme', 'light');
        } else if (theme === 'dark') {
            root.setAttribute('data-theme', 'dark');
        }
    }
}

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
        const styleId = 'json-handle-viewer-style';
        let style = document.getElementById(styleId);
        if (!style) {
            style = document.createElement('style');
            style.id = styleId;
            document.head.appendChild(style);
        }
        style.textContent = this.getStyles();
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
                --pathbar-height: 3.5rem;
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

            [data-theme="light"] {
                --bg-primary: #ffffff;
                --bg-secondary: #f8fafc;
                --bg-tertiary: #f1f5f9;
                --text-primary: #1e293b;
                --text-secondary: #64748b;
                --border: #e2e8f0;
            }

            [data-theme="dark"] {
                --bg-primary: #0f172a;
                --bg-secondary: #1e293b;
                --bg-tertiary: #334155;
                --text-primary: #f8fafc;
                --text-secondary: #cbd5e1;
                --border: #334155;
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
                top: var(--pathbar-height, 3.5rem);
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

            .collapsible-content.collapsed {
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

            .path-meta {
                display: flex;
                gap: 0.5rem;
                align-items: center;
                color: var(--text-secondary);
                flex-wrap: wrap;
            }

            .path-meta .meta-pill {
                padding: 0.125rem 0.5rem;
                border-radius: 999px;
                background: var(--bg-tertiary);
                border: 1px solid var(--border);
                font-size: 0.75rem;
            }

            .path-preview {
                color: var(--text-secondary);
                font-size: 0.75rem;
                margin-top: 0.25rem;
            }

            .raw-container {
                background: var(--bg-primary);
                border: 1px solid var(--border);
                border-radius: var(--radius);
                padding: 1.5rem;
                margin-top: 1rem;
                box-shadow: var(--shadow);
                font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
                font-size: 0.875rem;
                line-height: 1.5;
                white-space: pre;
                overflow: auto;
                display: none;
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
                    flex-wrap: wrap;
                }
            }
        `;
    }
}

// JSON rendering engine
class JsonRenderer {
    static render(jsonData, container, pathTokens = []) {
        const type = utils.getType(jsonData);
        
        switch (type) {
            case 'object':
                return this.renderObject(jsonData, container, pathTokens);
            case 'array':
                return this.renderArray(jsonData, container, pathTokens);
            default:
                return this.renderPrimitive(jsonData, type, container, pathTokens);
        }
    }

    static renderObject(obj, container, pathTokens) {
        const keys = Object.keys(obj);
        const isEmpty = keys.length === 0;
        
        if (isEmpty) {
            container.textContent = '{}';
            return container;
        }

        const shouldCollapse = keys.length > config.collapseThreshold;
        const { wrapper, content } = this.createCollapsibleContent('{', '}', shouldCollapse);
        
        keys.forEach((key, index) => {
            const row = document.createElement('div');
            row.className = 'json-row';
            const nextTokens = [...pathTokens, key];
            row.dataset.pathTokens = utils.encodePathTokens(nextTokens);
            row.dataset.path = utils.formatPathDisplay(nextTokens);
            
            const value = obj[key];
            const valueContainer = document.createElement('span');

            const keyElement = document.createElement('span');
            keyElement.className = 'json-key';
            keyElement.textContent = `"${key}"`;

            row.appendChild(keyElement);
            row.appendChild(document.createTextNode(': '));
            row.appendChild(valueContainer);
            
            this.render(value, valueContainer, nextTokens);
            
            if (index < keys.length - 1) {
                row.appendChild(document.createTextNode(','));
            }
            
            content.appendChild(row);
        });

        container.appendChild(wrapper);
        return container;
    }

    static renderArray(arr, container, pathTokens) {
        const isEmpty = arr.length === 0;
        
        if (isEmpty) {
            container.textContent = '[]';
            return container;
        }

        const shouldCollapse = arr.length > config.collapseThreshold;
        const { wrapper, content } = this.createCollapsibleContent('[', ']', shouldCollapse);
        
        arr.forEach((item, index) => {
            const row = document.createElement('div');
            row.className = 'json-row';
            const nextTokens = [...pathTokens, index];
            row.dataset.pathTokens = utils.encodePathTokens(nextTokens);
            row.dataset.path = utils.formatPathDisplay(nextTokens);
            
            const valueContainer = document.createElement('span');
            this.render(item, valueContainer, nextTokens);
            
            row.appendChild(valueContainer);
            
            if (index < arr.length - 1) {
                row.appendChild(document.createTextNode(','));
            }
            
            content.appendChild(row);
        });

        container.appendChild(wrapper);
        return container;
    }

    static renderPrimitive(value, type, container, pathTokens) {
        const span = document.createElement('span');
        span.className = `json-${type}`;
        span.dataset.pathTokens = utils.encodePathTokens(pathTokens);
        span.dataset.path = utils.formatPathDisplay(pathTokens);
        
        switch (type) {
            case 'string':
                span.textContent = `"${value}"`;
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
                if (results.length < config.maxSearchResults) {
                    results.push(row);
                    row.classList.add('search-result');
                }
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
            this.expandToRow(current);
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

    static expandToRow(row) {
        let parent = row.parentElement;
        while (parent) {
            if (parent.classList.contains('collapsible-content')) {
                parent.classList.remove('collapsed');
                const header = parent.previousElementSibling;
                if (header && header.classList.contains('collapsible')) {
                    const icon = header.querySelector('.expand-icon');
                    if (icon) icon.classList.remove('collapsed');
                }
            }
            parent = parent.parentElement;
        }
    }
}

// Main application
class JsonHandler {
    constructor() {
        this.jsonData = null;
        this.container = null;
        this.pathBar = null;
        this.keyboardBound = false;
        this.messageBound = false;
    }

    async init() {
        if (state.processed) return;

        await SettingsManager.load();
        this.detectAndProcessJson();
        if (!this.keyboardBound) {
            this.setupKeyboardShortcuts();
            this.keyboardBound = true;
        }
        if (!this.messageBound) {
            this.setupMessageListener();
            this.messageBound = true;
        }
    }

    detectAndProcessJson(force = false) {
        if (state.processed && !force) return;
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
        this.treeContainer = jsonContainer;

        const rawContainer = document.createElement('div');
        rawContainer.className = 'raw-container';
        this.rawContainer = rawContainer;
        
        JsonRenderer.render(this.jsonData, jsonContainer);
        this.container.appendChild(jsonContainer);
        this.container.appendChild(rawContainer);
        
        document.body.appendChild(this.container);
        
        // Initialize search
        SearchManager.init();
        
        // Add fade-in animation
        this.container.classList.add('fade-in');
        
        // Setup row interactions
        this.setupRowInteractions();

        this.applyStatsVisibility();
        this.updatePath(utils.encodePathTokens([]));
        this.updateViewMode();
        
        console.log('JSON viewer initialized successfully');
    }

    createPathBar() {
        this.pathBar = document.createElement('div');
        this.pathBar.className = 'path-bar';
        this.pathBar.innerHTML = `
            <div class="path-content">
                <div>
                    <span class="path-text">Path:</span>
                    <span class="path-value" id="pathValue">root</span>
                    <div class="path-meta">
                        <span class="meta-pill" id="pathType">object</span>
                        <span class="meta-pill" id="pathSize">0</span>
                    </div>
                    <div class="path-preview" id="pathPreview">-</div>
                </div>
                <div class="stats" id="statsPanel">
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
        const height = this.pathBar.getBoundingClientRect().height;
        document.documentElement.style.setProperty('--pathbar-height', `${height}px`);
    }

    createToolbar() {
        const toolbar = document.createElement('div');
        toolbar.className = 'toolbar';
        
        toolbar.innerHTML = `
            <div class="toolbar-content">
                <div class="toolbar-left">
                    <h2 style="margin: 0; color: var(--primary);">JSON Viewer</h2>
                    <button class="btn btn-secondary" id="viewToggleBtn">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z"/>
                        </svg>
                        <span class="btn-label">Raw View</span>
                    </button>
                </div>
                <div class="toolbar-right">
                    <button class="btn btn-secondary" id="expandAllBtn">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M7 10l5 5 5-5z"/>
                        </svg>
                        <span class="btn-label">Expand All</span>
                    </button>
                    <button class="btn btn-secondary" id="collapseAllBtn">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M7 14l5-5 5 5z"/>
                        </svg>
                        <span class="btn-label">Collapse All</span>
                    </button>
                    <button class="btn btn-secondary" id="copyPathBtn">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M3 5h8v2H5v12h12v-6h2v8H3z"/>
                            <path d="M21 3H9v12h12V3zm-2 10h-8V5h8v8z"/>
                        </svg>
                        <span class="btn-label">Copy Path</span>
                    </button>
                    <button class="btn btn-secondary" id="copyValueBtn">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                        </svg>
                        <span class="btn-label">Copy Value</span>
                    </button>
                    <button class="btn" id="searchBtn">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                        </svg>
                        <span class="btn-label">Search (⌘K)</span>
                    </button>
                    <button class="btn btn-secondary" id="copyBtn">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                        </svg>
                        <span class="btn-label">Copy</span>
                    </button>
                    <button class="btn btn-secondary" id="downloadBtn">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
                        </svg>
                        <span class="btn-label">Download</span>
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(toolbar);
        
        // Setup button events
        document.getElementById('searchBtn').addEventListener('click', () => {
            SearchManager.show();
        });

        document.getElementById('expandAllBtn').addEventListener('click', () => {
            this.expandAll();
        });

        document.getElementById('collapseAllBtn').addEventListener('click', () => {
            this.collapseAll();
        });

        document.getElementById('copyPathBtn').addEventListener('click', () => {
            this.copyPath();
        });

        document.getElementById('copyValueBtn').addEventListener('click', () => {
            this.copySelectedValue();
        });

        document.getElementById('viewToggleBtn').addEventListener('click', () => {
            this.toggleViewMode();
        });

        document.getElementById('copyBtn').addEventListener('click', () => {
            this.copyJson();
        });
        
        document.getElementById('downloadBtn').addEventListener('click', () => {
            this.downloadJson();
        });
    }

    setupRowInteractions() {
        if (!this.treeContainer) return;

        this.treeContainer.addEventListener('click', (e) => {
            const row = e.target.closest('.json-row');
            if (!row || !this.treeContainer.contains(row)) return;
            e.stopPropagation();
            this.selectRow(row);
        });
    }

    selectRow(row) {
        const currentSelected = this.treeContainer?.querySelector('.json-row.selected');
        if (currentSelected && currentSelected !== row) {
            currentSelected.classList.remove('selected');
        }
        row.classList.add('selected');

        const encodedTokens = row.dataset.pathTokens || utils.encodePathTokens([]);
        this.updatePath(encodedTokens);
        this.showValueInfo(row, row.dataset.path || 'root');
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

            if (request.action === 'checkForJSON') {
                this.detectAndProcessJson(Boolean(request.force));
                sendResponse({status: state.processed ? 'processed' : 'skipped'});
            }

            if (request.action === 'applySettings') {
                SettingsManager.apply(request.settings || defaultSettings, false);
                this.applyStatsVisibility();
                if (state.processed) {
                    this.renderInterface();
                }
                sendResponse({status: 'ok'});
            }

            if (request.action === 'getSettings') {
                sendResponse({settings: {
                    theme: state.theme,
                    collapseThreshold: config.collapseThreshold,
                    maxJsonSizeMB: Math.round(config.maxJsonSize / (1024 * 1024)),
                    showStats: state.showStats
                }});
            }
        });
    }

    updatePath(encodedTokens) {
        const tokens = utils.decodePathTokens(encodedTokens);
        const displayPath = utils.formatPathDisplay(tokens);
        state.currentPathTokens = utils.encodePathTokens(tokens);
        state.currentPath = displayPath;
        const pathElement = document.getElementById('pathValue');
        if (pathElement) pathElement.textContent = displayPath;

        const value = this.getValueByPath(tokens);
        const type = utils.getType(value);
        const typeElement = document.getElementById('pathType');
        const sizeElement = document.getElementById('pathSize');
        const previewElement = document.getElementById('pathPreview');

        if (typeElement) typeElement.textContent = type;

        if (sizeElement) {
            if (type === 'array') {
                sizeElement.textContent = `${value.length} items`;
            } else if (type === 'object') {
                sizeElement.textContent = `${Object.keys(value).length} keys`;
            } else if (type === 'undefined') {
                sizeElement.textContent = '0 value';
            } else {
                sizeElement.textContent = '1 value';
            }
        }

        if (previewElement) {
            let previewText = '';
            if (type === 'string') {
                previewText = utils.truncate(value, 120);
            } else if (type === 'number' || type === 'boolean' || type === 'null') {
                previewText = String(value);
            } else if (type === 'undefined') {
                previewText = 'undefined';
            } else if (type === 'array') {
                previewText = `Array(${value.length})`;
            } else if (type === 'object') {
                previewText = 'Object';
            }
            previewElement.textContent = previewText || '-';
        }
    }

    showValueInfo(row, displayPath) {
        // This could be enhanced to show a detailed tooltip with value information
        console.log(`Selected: ${displayPath}`);
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

    copySelectedValue(row = null) {
        try {
            const targetRow = row || document.querySelector('.json-row.selected');
            if (!targetRow) {
                this.showToast('No selected node', 'error');
                return;
            }
            const encodedTokens = targetRow.dataset.pathTokens || state.currentPathTokens;
            const value = this.getValueByPath(encodedTokens);
            const jsonString = value === undefined ? 'undefined' : JSON.stringify(value, null, 2);
            
            navigator.clipboard.writeText(jsonString).then(() => {
                this.showToast('Value copied to clipboard!');
            });
        } catch (err) {
            console.error('Failed to copy value:', err);
        }
    }

    copyPath() {
        const path = state.currentPath || 'root';
        navigator.clipboard.writeText(path).then(() => {
            this.showToast('Path copied to clipboard!');
        }).catch(err => {
            console.error('Failed to copy path:', err);
            this.showToast('Failed to copy path', 'error');
        });
    }

    expandAll() {
        document.querySelectorAll('.collapsible-content.collapsed').forEach(el => {
            el.classList.remove('collapsed');
            const header = el.previousElementSibling;
            if (header && header.classList.contains('collapsible')) {
                const icon = header.querySelector('.expand-icon');
                if (icon) icon.classList.remove('collapsed');
            }
        });
    }

    collapseAll() {
        document.querySelectorAll('.collapsible-content').forEach(el => {
            el.classList.add('collapsed');
            const header = el.previousElementSibling;
            if (header && header.classList.contains('collapsible')) {
                const icon = header.querySelector('.expand-icon');
                if (icon) icon.classList.add('collapsed');
            }
        });
    }

    toggleViewMode() {
        state.viewMode = state.viewMode === 'tree' ? 'raw' : 'tree';
        this.updateViewMode();
    }

    updateViewMode() {
        if (!this.treeContainer || !this.rawContainer) return;
        const viewToggleLabel = document.querySelector('#viewToggleBtn .btn-label');
        if (state.viewMode === 'raw') {
            this.treeContainer.style.display = 'none';
            this.rawContainer.style.display = 'block';
            this.rawContainer.textContent = JSON.stringify(this.jsonData, null, 2);
            if (viewToggleLabel) viewToggleLabel.textContent = 'Tree View';
        } else {
            this.treeContainer.style.display = 'block';
            this.rawContainer.style.display = 'none';
            if (viewToggleLabel) viewToggleLabel.textContent = 'Raw View';
        }
    }

    applyStatsVisibility() {
        const panel = document.getElementById('statsPanel');
        if (panel) {
            panel.style.display = state.showStats ? 'flex' : 'none';
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

    getValueByPath(pathOrTokens) {
        const parts = Array.isArray(pathOrTokens)
            ? pathOrTokens
            : utils.decodePathTokens(pathOrTokens);

        if (!parts.length) return this.jsonData;
        let value = this.jsonData;
        
        for (const part of parts) {
            if (value === null || value === undefined) return undefined;
            value = value[part];
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
