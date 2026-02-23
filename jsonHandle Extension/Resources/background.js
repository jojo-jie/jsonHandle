// 跟踪已处理的请求，避免重复触发
const processedTabs = new Map();
const lastSendFailure = new Map();

const MAX_ENTRIES = 500;
const ENTRY_TTL_MS = 10 * 60 * 1000;
const RETRY_COOLDOWN_MS = 10 * 1000;
const SEND_DELAY_MS = 500;

const JSON_ACTION = 'checkForJSON';
const JSON_URL_HINTS = ['.json', '/json', '/api/', 'format=json'];

function cleanupProcessed() {
    const now = Date.now();

    for (const [tabId, urlMap] of processedTabs.entries()) {
        for (const [url, ts] of urlMap.entries()) {
            if (now - ts > ENTRY_TTL_MS) {
                urlMap.delete(url);
            }
        }

        if (urlMap.size === 0) {
            processedTabs.delete(tabId);
        }
    }

    if (processedTabs.size > MAX_ENTRIES) {
        for (const tabId of processedTabs.keys()) {
            processedTabs.delete(tabId);
            if (processedTabs.size <= MAX_ENTRIES) break;
        }
    }
}

function hasProcessed(tabId, url) {
    return processedTabs.get(tabId)?.has(url) || false;
}

function markProcessed(tabId, url) {
    if (!url) return;
    const urlMap = processedTabs.get(tabId) || new Map();
    urlMap.set(url, Date.now());
    processedTabs.set(tabId, urlMap);
}

function shouldRetry(tabId) {
    const last = lastSendFailure.get(tabId);
    return !last || Date.now() - last > RETRY_COOLDOWN_MS;
}

function recordFailure(tabId) {
    lastSendFailure.set(tabId, Date.now());
}

function isLikelyJsonUrl(url = '') {
    const lowerUrl = url.toLowerCase();
    return JSON_URL_HINTS.some((hint) => lowerUrl.includes(hint));
}

function isLikelyJsonContentType(contentType = '', url = '') {
    const normalized = contentType.toLowerCase();

    if (normalized.includes('json')) return true;
    if (normalized.includes('application/javascript')) return true;
    if (normalized.includes('text/javascript')) return true;

    // 有些接口返回 JSON 但 Content-Type 标为 text/plain
    if (normalized.includes('text/plain') && isLikelyJsonUrl(url)) return true;

    return false;
}

function extractContentType(headers = []) {
    for (const header of headers) {
        if ((header.name || '').toLowerCase() === 'content-type') {
            return (header.value || '').toLowerCase();
        }
    }
    return '';
}

function scheduleJsonCheck(tabId, payload, markUrl) {
    setTimeout(async () => {
        if (!shouldRetry(tabId)) return;

        try {
            await browser.tabs.sendMessage(tabId, payload);
            markProcessed(tabId, markUrl || payload.url || '');
        } catch (error) {
            console.log('Error sending message to content script:', error);
            recordFailure(tabId);
        }
    }, SEND_DELAY_MS);
}

function tryDispatchJsonCheck(tabId, payload, markUrl) {
    if (tabId === -1) return;

    cleanupProcessed();
    const identityUrl = markUrl || payload.url || '';
    if (identityUrl && hasProcessed(tabId, identityUrl)) return;

    scheduleJsonCheck(tabId, payload, identityUrl);
}

// 监听来自 content script 的消息
browser.runtime.onMessage.addListener((request) => {
    console.log('Received request: ', request);

    if (request.greeting === 'hello') {
        return Promise.resolve({ farewell: 'goodbye' });
    }

    if (request.action === 'formatJSON') {
        return Promise.resolve({ success: true });
    }

    return undefined;
});

// 监听网络响应头，优先基于 Content-Type 判定
browser.webRequest.onHeadersReceived.addListener(
    (details) => {
        if (details.tabId === -1) return;

        const responseHeaders = details.responseHeaders || [];
        const contentType = extractContentType(responseHeaders);

        let isJson = isLikelyJsonContentType(contentType, details.url);
        if (!isJson) {
            isJson = isLikelyJsonUrl(details.url);
            if (isJson) {
                console.log('基于 URL 判断可能是 JSON:', details.url);
            }
        }

        if (!isJson) return;

        console.log('检测到 JSON 响应:', details.url, 'Content-Type:', contentType || '(unknown)');
        tryDispatchJsonCheck(
            details.tabId,
            {
                action: JSON_ACTION,
                url: details.url,
                contentType
            },
            details.url
        );
    },
    { urls: ['<all_urls>'] },
    ['responseHeaders']
);

// 监听标签页完成加载时的 URL 兜底检测
browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status !== 'complete' || !tab.url || tabId === -1) return;
    if (!isLikelyJsonUrl(tab.url)) return;

    console.log('检测到可能的 JSON URL:', tab.url.toLowerCase());
    tryDispatchJsonCheck(
        tabId,
        {
            action: JSON_ACTION,
            url: tab.url
        },
        tab.url
    );
});

// 标签页切换时重检（避免错过已加载页面）
browser.tabs.onActivated.addListener(async (activeInfo) => {
    try {
        const tab = await browser.tabs.get(activeInfo.tabId);
        if (!tab.url || tab.status !== 'complete') return;
        if (!isLikelyJsonUrl(tab.url)) return;

        cleanupProcessed();
        if (hasProcessed(activeInfo.tabId, tab.url)) return;

        console.log('标签页激活，检测到可能的 JSON URL:', tab.url.toLowerCase());
        tryDispatchJsonCheck(
            activeInfo.tabId,
            {
                action: JSON_ACTION,
                url: tab.url
            },
            tab.url
        );
    } catch (error) {
        console.log('Error reading active tab:', error);
    }
});

browser.tabs.onRemoved.addListener((tabId) => {
    processedTabs.delete(tabId);
    lastSendFailure.delete(tabId);
});
