console.log("Hello World!", browser);

document.addEventListener('DOMContentLoaded', function() {
    // 不需要添加图标到标题，因为已经在HTML中添加了
    
    // 添加调试信息区域
    const debugInfo = document.createElement('div');
    debugInfo.className = 'debug-info';
    
    // 检查当前页面是否可能包含JSON
    browser.tabs.query({active: true, currentWindow: true})
        .then(tabs => {
            if (tabs[0]) {
                const url = tabs[0].url.toLowerCase();
                // 修改URL显示方式，不再截断，让CSS处理换行
                debugInfo.textContent = `URL: ${url}`;
                console.log("当前页面URL:", url);
                
                // 检查页面是否已经格式化
                browser.tabs.sendMessage(tabs[0].id, { action: "checkStatus" })
                    .then(response => {
                        console.log("页面状态检查结果:", response);
                        
                        if (response) {
                            debugInfo.textContent += `\n\n状态信息:`;
                            debugInfo.textContent += `\n• 页面状态: ${response.isFormatted ? '已格式化' : '未格式化'}`;
                            debugInfo.textContent += `\n• 工具栏: ${response.hasToolbar ? '存在' : '不存在'}`;
                            debugInfo.textContent += `\n• JSON容器: ${response.hasJsonContainer ? '存在' : '不存在'}`;
                            debugInfo.textContent += `\n• JSON数据: ${response.hasJSON ? '存在' : '不存在'}`;
                        }
                    })
                    .catch(error => {
                        console.log("检查状态失败:", error);
                        debugInfo.textContent += `\n\n状态检查失败: ${error.message}`;
                    });
            }
        });
    
    // 将调试信息添加到content-wrapper中
    const contentWrapper = document.querySelector('.content-wrapper');
    
    // 创建一个卡片容器来包装调试信息，使其与其他栏目UI一致
    const debugCard = document.createElement('div');
    debugCard.className = 'card debug-card';
    
    // 添加标题
    const debugTitle = document.createElement('h2');
    debugTitle.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 8h-2.81c-.45-.78-1.07-1.45-1.82-1.96L17 4.41 15.59 3l-2.17 2.17C12.96 5.06 12.49 5 12 5c-.49 0-.96.06-1.41.17L8.41 3 7 4.41l1.62 1.63C7.88 6.55 7.26 7.22 6.81 8H4v2h2.09c-.05.33-.09.66-.09 1v1H4v2h2v1c0 .34.04.67.09 1H4v2h2.81c1.04 1.79 2.97 3 5.19 3s4.15-1.21 5.19-3H20v-2h-2.09c.05-.33.09-.66.09-1v-1h2v-2h-2v-1c0-.34-.04-.67-.09-1H20V8zm-6 8h-4v-2h4v2zm0-4h-4v-2h4v2z"/></svg>调试信息';
    debugCard.appendChild(debugTitle);
    
    // 添加调试信息到卡片
    debugCard.appendChild(debugInfo);
    
    // 获取所有现有的卡片
    const existingCards = contentWrapper.querySelectorAll('.card');
    
    // 如果有现有卡片，在第一个卡片之前插入调试信息卡片
    if (existingCards.length > 0) {
        contentWrapper.insertBefore(debugCard, existingCards[0]);
    } else {
        // 否则直接添加到内容区域的开头
        contentWrapper.prepend(debugCard);
    }
    
    // 显示消息
    function showMessage(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'status error';
        messageDiv.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h2v2h-2v-2zm0-8h2v6h-2V7z"/></svg>' + message;
        
        // 移除之前的消息
        const oldMessage = document.querySelector('.message');
        if (oldMessage) {
            oldMessage.remove();
        }
        
        // 将消息添加到content-wrapper中
        contentWrapper.appendChild(messageDiv);
    }
});
