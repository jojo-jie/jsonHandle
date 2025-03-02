// 跟踪已处理的请求，避免重复处理
const processedUrls = new Set();

// 监听来自content script的消息
browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("Received request: ", request);

    if (request.greeting === "hello") {
        return Promise.resolve({ farewell: "goodbye" });
    }
    
    if (request.action === "formatJSON") {
        return Promise.resolve({ success: true });
    }
});

// 使用webRequest API监听网络请求，检测JSON响应
browser.webRequest.onHeadersReceived.addListener(
    function(details) {
        // 避免重复处理同一URL
        if (processedUrls.has(details.url)) {
            return;
        }
        
        // 检查响应头中的Content-Type
        const headers = details.responseHeaders;
        if (!headers) return;
        
        let isJson = false;
        let contentType = "";
        
        // 查找Content-Type头
        for (let header of headers) {
            if (header.name.toLowerCase() === 'content-type') {
                contentType = header.value.toLowerCase();
                if (contentType.includes('json') || 
                    contentType.includes('application/javascript') ||
                    contentType.includes('text/javascript') ||
                    // 有些API返回JSON但Content-Type设置不正确
                    (contentType.includes('text/plain') && 
                     (details.url.includes('.json') || details.url.includes('/api/')))) {
                    isJson = true;
                    break;
                }
            }
        }
        
        // 如果Content-Type不是JSON，检查URL是否可能是JSON
        if (!isJson) {
            const url = details.url.toLowerCase();
            if (url.includes('.json') || 
                url.includes('/json') || 
                url.includes('/api/') || 
                url.includes('format=json')) {
                isJson = true;
                console.log("基于URL判断可能是JSON:", url);
            }
        }
        
        // 如果是JSON响应，通知content script
        if (isJson && details.tabId !== -1) {
            console.log("检测到JSON响应:", details.url, "Content-Type:", contentType);
            processedUrls.add(details.url);
            
            // 延迟发送消息，确保content script已加载
            setTimeout(() => {
                browser.tabs.sendMessage(details.tabId, { 
                    action: "checkForJSON",
                    url: details.url,
                    contentType: contentType
                }).catch(error => {
                    console.log("Error sending message to content script:", error);
                    // 如果发送失败，可能是content script还没准备好，再次尝试
                    setTimeout(() => {
                        browser.tabs.sendMessage(details.tabId, { 
                            action: "checkForJSON",
                            url: details.url,
                            contentType: contentType
                        }).catch(e => console.log("Second attempt failed:", e));
                    }, 1000);
                });
            }, 500);
        }
    },
    { urls: ["<all_urls>"] },
    ["responseHeaders"]
);

// 监听标签页更新事件，检测JSON响应
browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url) {
        // 避免重复处理同一URL
        if (processedUrls.has(tab.url)) {
            return;
        }
        
        // 检查URL是否可能是JSON响应
        const url = tab.url.toLowerCase();
        if (url.includes('.json') || 
            url.includes('/json') || 
            url.includes('/api/') || 
            url.includes('format=json')) {
            console.log("检测到可能的JSON URL:", url);
            processedUrls.add(tab.url);
            
            // 向content script发送消息，请求格式化JSON
            setTimeout(() => {
                browser.tabs.sendMessage(tabId, { 
                    action: "checkForJSON",
                    url: tab.url
                }).catch(error => {
                    console.log("Error sending message to content script:", error);
                    // 如果发送失败，可能是content script还没准备好，再次尝试
                    setTimeout(() => {
                        browser.tabs.sendMessage(tabId, { 
                            action: "checkForJSON",
                            url: tab.url
                        }).catch(e => console.log("Second attempt failed:", e));
                    }, 1000);
                });
            }, 500);
        }
    }
});

// 监听标签页激活事件，可能需要重新检查
browser.tabs.onActivated.addListener((activeInfo) => {
    browser.tabs.get(activeInfo.tabId).then(tab => {
        if (tab.url && tab.status === 'complete') {
            // 检查URL是否可能是JSON响应但尚未处理
            const url = tab.url.toLowerCase();
            if (!processedUrls.has(tab.url) && 
                (url.includes('.json') || 
                 url.includes('/json') || 
                 url.includes('/api/') || 
                 url.includes('format=json'))) {
                console.log("标签页激活，检测到可能的JSON URL:", url);
                
                // 向content script发送消息，请求格式化JSON
                setTimeout(() => {
                    browser.tabs.sendMessage(activeInfo.tabId, { 
                        action: "checkForJSON",
                        url: tab.url
                    }).catch(error => console.log("Error sending message to content script:", error));
                }, 500);
            }
        }
    });
});
