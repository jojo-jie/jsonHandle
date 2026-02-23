const SETTINGS_API = globalThis.JsonHandleSettings;

const defaultSettings = () => {
    if (SETTINGS_API && SETTINGS_API.DEFAULTS) {
        return { ...SETTINGS_API.DEFAULTS };
    }
    return {
        theme: 'auto',
        collapseThreshold: 50,
        maxJsonSizeMB: 10,
        showStats: true
    };
};

class PopupApp {
    constructor() {
        this.currentTab = null;
        this.tabAccessible = false;
        this.feedbackTimer = null;

        this.ui = {
            status: document.getElementById('extensionStatus'),
            statusDot: document.querySelector('.status-dot'),
            activeHost: document.getElementById('activeHost'),
            checkNowBtn: document.getElementById('checkNowBtn'),
            refreshBtn: document.getElementById('refreshBtn'),
            applySettingsBtn: document.getElementById('applySettingsBtn'),
            resetSettingsBtn: document.getElementById('resetSettingsBtn'),
            copyUrlBtn: document.getElementById('copyUrlBtn'),
            feedbackBar: document.getElementById('feedbackBar'),
            debugUrl: document.getElementById('debugUrl'),
            debugExtension: document.getElementById('debugExtension'),
            debugAccess: document.getElementById('debugAccess'),
            theme: document.getElementById('settingTheme'),
            collapse: document.getElementById('settingCollapse'),
            maxSize: document.getElementById('settingMaxSize'),
            showStats: document.getElementById('settingShowStats')
        };
    }

    init() {
        this.bindEvents();
        this.loadSettings();
        this.loadDebugInfo();
    }

    bindEvents() {
        this.ui.refreshBtn?.addEventListener('click', () => {
            this.loadDebugInfo();
        });

        this.ui.checkNowBtn?.addEventListener('click', () => {
            this.checkNow();
        });

        this.ui.applySettingsBtn?.addEventListener('click', async () => {
            const settings = this.readSettingsFromUI();
            await this.saveSettings(settings);
            await this.applySettingsToActiveTab(settings, true);
        });

        this.ui.resetSettingsBtn?.addEventListener('click', async () => {
            const settings = defaultSettings();
            this.applySettingsToUI(settings);
            await this.saveSettings(settings);
            await this.applySettingsToActiveTab(settings, true);
            this.showFeedback('已恢复默认设置。', 'success');
        });

        this.ui.copyUrlBtn?.addEventListener('click', async () => {
            const url = this.currentTab?.url || this.ui.debugUrl?.textContent || '';
            if (!url || url === '加载中...') {
                this.showFeedback('当前没有可复制的 URL。', 'warning');
                return;
            }
            try {
                await navigator.clipboard.writeText(url);
                this.showFeedback('已复制当前 URL。', 'success');
            } catch (err) {
                console.error('Failed to copy URL:', err);
                this.showFeedback('复制 URL 失败，请检查剪贴板权限。', 'error');
            }
        });

        [this.ui.theme, this.ui.collapse, this.ui.maxSize, this.ui.showStats].forEach((el) => {
            if (!el) return;
            el.addEventListener('change', async () => {
                const settings = this.readSettingsFromUI();
                await this.saveSettings(settings);
            });
        });
    }

    normalizeSettings(settings) {
        if (SETTINGS_API && typeof SETTINGS_API.merge === 'function') {
            return SETTINGS_API.merge(settings);
        }
        return { ...defaultSettings(), ...(settings || {}) };
    }

    readSettingsFromUI() {
        return this.normalizeSettings({
            theme: this.ui.theme ? this.ui.theme.value : 'auto',
            collapseThreshold: this.ui.collapse ? Number(this.ui.collapse.value) : 50,
            maxJsonSizeMB: this.ui.maxSize ? Number(this.ui.maxSize.value) : 10,
            showStats: this.ui.showStats ? Boolean(this.ui.showStats.checked) : true
        });
    }

    applySettingsToUI(settings) {
        if (this.ui.theme) this.ui.theme.value = settings.theme;
        if (this.ui.collapse) this.ui.collapse.value = settings.collapseThreshold;
        if (this.ui.maxSize) this.ui.maxSize.value = settings.maxJsonSizeMB;
        if (this.ui.showStats) this.ui.showStats.checked = settings.showStats !== false;
    }

    async loadSettings() {
        try {
            const result = await browser.storage.local.get('settings');
            const settings = this.normalizeSettings(result.settings || {});
            this.applySettingsToUI(settings);
        } catch (err) {
            console.error('Failed to load settings', err);
            this.applySettingsToUI(defaultSettings());
            this.showFeedback('读取设置失败，已使用默认配置。', 'warning');
        }
    }

    async saveSettings(settings) {
        const normalized = this.normalizeSettings(settings);
        try {
            await browser.storage.local.set({ settings: normalized });
        } catch (err) {
            console.error('Failed to save settings', err);
            this.showFeedback('保存设置失败。', 'error');
        }
    }

    async loadDebugInfo() {
        try {
            const tabs = await browser.tabs.query({ active: true, currentWindow: true });
            this.currentTab = tabs[0] || null;

            if (!this.currentTab) {
                this.setDebugInfo({
                    url: '未检测到活动标签页',
                    extension: '未知',
                    access: '不可用'
                });
                this.updateExtensionStatus('不可用', 'warning');
                this.updateActionAvailability();
                return;
            }

            const url = this.currentTab.url || 'N/A';
            this.ui.debugUrl.textContent = url;
            this.ui.activeHost.textContent = this.getHostLabel(url);

            await this.checkExtensionAccess(this.currentTab);
            this.updateActionAvailability();
        } catch (err) {
            console.error('Error loading debug info:', err);
            this.updateExtensionStatus('错误', 'error');
            this.setDebugInfo({ extension: '错误', access: '不可用' });
            this.updateActionAvailability();
        }
    }

    async checkExtensionAccess(tab) {
        try {
            await browser.tabs.sendMessage(tab.id, { action: 'ping' });
            this.tabAccessible = true;
            this.updateExtensionStatus('已连接', 'success');
            this.setDebugInfo({ extension: '已连接', access: '已注入' });
        } catch (err) {
            this.tabAccessible = false;
            this.updateExtensionStatus('受限', 'warning');
            this.setDebugInfo({ extension: '受限', access: '未注入' });
        }
    }

    updateActionAvailability() {
        const disabled = !this.currentTab;
        const messageDisabled = !this.currentTab || !this.tabAccessible;

        if (this.ui.refreshBtn) this.ui.refreshBtn.disabled = disabled;
        if (this.ui.copyUrlBtn) this.ui.copyUrlBtn.disabled = disabled;
        if (this.ui.applySettingsBtn) this.ui.applySettingsBtn.disabled = messageDisabled;
        if (this.ui.checkNowBtn) this.ui.checkNowBtn.disabled = messageDisabled;

        if (messageDisabled && this.currentTab) {
            this.showFeedback('当前页面受限，无法注入内容脚本。请在普通网页中使用。', 'warning', 2600);
        }
    }

    async checkNow() {
        if (!this.currentTab || !this.tabAccessible) {
            this.showFeedback('当前页面不可检测。', 'warning');
            return;
        }

        try {
            const res = await browser.tabs.sendMessage(this.currentTab.id, {
                action: 'checkForJSON',
                force: true,
                url: this.currentTab.url
            });

            if (res?.status === 'processed') {
                this.showFeedback('已触发 JSON 检测与渲染。', 'success');
            } else {
                this.showFeedback('当前页面未识别到可处理 JSON。', 'warning');
            }
        } catch (err) {
            console.error('Failed to check JSON now:', err);
            this.showFeedback('触发检测失败，页面可能受限。', 'error');
        }
    }

    async applySettingsToActiveTab(settings, showMessage = false) {
        if (!this.currentTab || !this.tabAccessible) {
            if (showMessage) {
                this.showFeedback('当前页面不可应用设置。', 'warning');
            }
            return;
        }

        try {
            await browser.tabs.sendMessage(this.currentTab.id, {
                action: 'applySettings',
                settings: this.normalizeSettings(settings)
            });
            if (showMessage) {
                this.showFeedback('设置已应用到当前页面。', 'success');
            }
        } catch (err) {
            console.error('Failed to apply settings to tab:', err);
            if (showMessage) {
                this.showFeedback('应用失败，页面可能受限。', 'error');
            }
        }
    }

    updateExtensionStatus(status, tone = 'success') {
        if (this.ui.status) this.ui.status.textContent = status;
        if (!this.ui.statusDot) return;

        let color = 'var(--ok)';
        if (tone === 'warning') color = 'var(--warn)';
        if (tone === 'error') color = 'var(--danger)';

        this.ui.statusDot.style.background = color;
    }

    setDebugInfo({ url, extension, access }) {
        if (url !== undefined && this.ui.debugUrl) this.ui.debugUrl.textContent = url;
        if (extension !== undefined && this.ui.debugExtension) this.ui.debugExtension.textContent = extension;
        if (access !== undefined && this.ui.debugAccess) this.ui.debugAccess.textContent = access;
    }

    getHostLabel(url) {
        try {
            const parsed = new URL(url);
            return `${parsed.hostname}${parsed.pathname}`;
        } catch {
            return url;
        }
    }

    showFeedback(message, type = 'success', duration = 2200) {
        if (!this.ui.feedbackBar) return;

        this.ui.feedbackBar.className = `feedback ${type}`;
        this.ui.feedbackBar.textContent = message;

        if (this.feedbackTimer) {
            clearTimeout(this.feedbackTimer);
        }

        this.feedbackTimer = setTimeout(() => {
            if (!this.ui.feedbackBar) return;
            this.ui.feedbackBar.className = 'feedback';
            this.ui.feedbackBar.textContent = '';
        }, duration);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const app = new PopupApp();
    app.init();
});
