// 全局变量，用于跟踪是否已经处理过
let hasProcessed = false;
// 全局变量，保存最后一次成功解析的JSON对象
let lastParsedJSON = null;

// 主要处理函数
function processPage() {
    console.log("开始处理页面...");
    
    // 检查页面内容是否为JSON
    function checkAndFormatJSON() {
        // 如果页面已经处理过，并且有保存的JSON对象，直接使用它
        if (hasProcessed && lastParsedJSON) {
            console.log("页面已经格式化过，使用缓存的JSON数据重新格式化");
            createJSONView(lastParsedJSON);
            return true;
        }
        
        // 获取页面内容，尝试多种方式获取原始内容
        let bodyText = '';
        
        console.log("页面结构:", document.body.children.length, "个子元素");
        
        // 如果页面内容很简单（只有pre标签或纯文本），直接获取
        if (document.body.children.length <= 1 && 
            (document.body.children.length === 0 || 
             document.body.children[0].tagName === 'PRE')) {
            bodyText = document.body.textContent.trim();
            console.log("从简单页面结构获取内容");
        } 
        // 如果页面已经被处理过（比如浏览器自动格式化了JSON）
        else if (document.querySelector('pre')) {
            const preElement = document.querySelector('pre');
            bodyText = preElement.textContent.trim();
            console.log("从pre标签获取内容");
        } 
        // 最后尝试获取整个body内容
        else {
            bodyText = document.body.textContent.trim();
            console.log("从body获取内容");
        }
        
        // 检查是否为空
        if (!bodyText) {
            console.log("页面内容为空");
            return false;
        }
        
        console.log("获取到的内容长度:", bodyText.length, "字符");
        console.log("内容前30个字符:", bodyText.substring(0, 30));
        
        // 尝试检测是否为JSON格式
        try {
            // 尝试解析JSON
            const jsonObj = JSON.parse(bodyText);
            
            // 确保解析结果是对象或数组
            if (typeof jsonObj !== 'object' || jsonObj === null) {
                console.log("解析结果不是有效的JSON对象或数组");
                return false;
            }
            
            // 如果成功解析，则创建美化的JSON视图
            console.log("成功解析JSON数据:", typeof jsonObj, Array.isArray(jsonObj) ? "数组" : "对象");
            lastParsedJSON = jsonObj; // 保存解析成功的JSON对象
            createJSONView(jsonObj);
            hasProcessed = true;
            return true;
        } catch (e) {
            // 不是有效的JSON，尝试修复
            console.log("解析JSON失败:", e.message);
            
            // 尝试修复常见问题并重新解析
            try {
                // 有些API返回的JSON前后可能有额外字符
                const trimmedText = bodyText.replace(/^[^{\[]+/, '').replace(/[^}\]]+$/, '');
                if (trimmedText !== bodyText) {
                    console.log("尝试修复JSON，移除额外字符");
                    const jsonObj = JSON.parse(trimmedText);
                    console.log("修复后成功解析JSON数据");
                    lastParsedJSON = jsonObj; // 保存解析成功的JSON对象
                    createJSONView(jsonObj);
                    hasProcessed = true;
                    return true;
                }
            } catch (e2) {
                console.log("修复后仍然无法解析JSON:", e2.message);
            }
            
            // 尝试查找页面中的JSON字符串
            try {
                console.log("尝试在页面中查找JSON字符串");
                const jsonMatch = bodyText.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
                if (jsonMatch) {
                    const potentialJson = jsonMatch[0];
                    console.log("找到潜在JSON字符串，长度:", potentialJson.length);
                    const jsonObj = JSON.parse(potentialJson);
                    console.log("成功从页面中提取并解析JSON");
                    lastParsedJSON = jsonObj; // 保存解析成功的JSON对象
                    createJSONView(jsonObj);
                    hasProcessed = true;
                    return true;
                }
            } catch (e3) {
                console.log("从页面提取JSON失败:", e3.message);
            }
            
            return false;
        }
    }
    
    // 创建美化的JSON视图
    function createJSONView(jsonObj) {
        // 清空原有内容
        document.body.innerHTML = '';
        
        // 创建样式
        const style = document.createElement('style');
        style.textContent = `
            body {
                font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', monospace;
                background-color: #f8f9fa;
                padding: 20px;
                margin: 0;
                line-height: 1.5;
                padding-top: 56px; /* 为固定的路径信息留出空间 */
            }
            .json-container {
                background-color: white;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                padding: 20px;
                overflow: auto;
                margin-bottom: 20px;
            }
            .toolbar {
                display: flex;
                justify-content: space-between;
                margin-bottom: 15px;
                position: sticky;
                top: 0;
                background-color: #f8f9fa;
                padding: 10px 0;
                z-index: 100;
                border-radius: 8px;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
            }
            .toolbar-left, .toolbar-right {
                display: flex;
                align-items: center;
            }
            .toolbar-title {
                font-weight: bold;
                margin-right: 15px;
                font-size: 16px;
                color: #4285f4;
            }
            .usage-tip {
                display: flex;
                align-items: center;
                font-size: 12px;
                color: #666;
                background-color: rgba(66, 133, 244, 0.1);
                padding: 4px 8px;
                border-radius: 4px;
            }
            .usage-tip svg {
                width: 14px;
                height: 14px;
                margin-right: 4px;
                fill: #4285f4;
            }
            .toolbar button {
                margin-left: 10px;
                padding: 6px 12px;
                background-color: #4285f4;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
                transition: all 0.2s ease;
                display: flex;
                align-items: center;
            }
            .toolbar button:hover {
                background-color: #3367d6;
                box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
            }
            .toolbar button:active {
                transform: translateY(1px);
            }
            .toolbar button svg {
                margin-right: 5px;
                width: 16px;
                height: 16px;
            }
            .json-key {
                color: #881391;
                font-weight: 500;
            }
            .json-string {
                color: #1a1aa6;
            }
            .json-number {
                color: #1c00cf;
            }
            .json-boolean {
                color: #0d904f;
            }
            .json-null {
                color: #808080;
            }
            .collapsible {
                cursor: pointer;
                user-select: none;
                display: flex;
                align-items: center;
            }
            .collapsible:hover {
                text-decoration: underline;
                color: #4285f4;
            }
            .collapsed {
                display: none;
            }
            .expand-marker {
                color: #777;
                margin-right: 5px;
                display: inline-block;
                width: 16px;
                height: 16px;
                text-align: center;
                line-height: 16px;
                transition: transform 0.2s ease;
            }
            .collapsed-marker {
                transform: rotate(-90deg);
            }
            .json-row {
                padding: 2px 0;
                transition: background-color 0.1s ease;
                cursor: pointer;
            }
            .json-row:hover {
                background-color: rgba(66, 133, 244, 0.1);
                border-radius: 4px;
            }
            .json-row.active {
                background-color: rgba(66, 133, 244, 0.15);
                border-radius: 4px;
            }
            .path-info {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                background-color: #2c3e50;
                padding: 8px 20px;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                font-size: 12px;
                color: #ecf0f1;
                z-index: 101;
                transition: all 0.3s ease;
                display: flex;
                justify-content: space-between;
                align-items: center;
                height: 40px;
                box-sizing: border-box;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            }
            .path-info.updated {
                background-color: #34495e;
            }
            .path-info-left {
                display: flex;
                align-items: center;
                flex-grow: 1;
                overflow: hidden;
            }
            .path-icon {
                display: flex;
                align-items: center;
                margin-right: 12px;
                flex-shrink: 0;
            }
            .path-icon svg {
                width: 18px;
                height: 18px;
                fill: #3498db;
            }
            .path-text {
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                margin-right: 15px;
                font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', monospace;
                padding: 4px 8px;
                background-color: rgba(255, 255, 255, 0.1);
                border-radius: 4px;
                border-left: 3px solid #3498db;
            }
            .toolbar-title {
                margin-left: 20px;
                font-weight: bold;
                font-size: 16px;
                color: #3498db;
                white-space: nowrap;
                flex-shrink: 0;
                text-transform: uppercase;
                letter-spacing: 1px;
            }
            .path-info .toolbar-right {
                display: flex;
                align-items: center;
                flex-shrink: 0;
                gap: 8px;
            }
            .toolbar-btn {
                background: rgba(255, 255, 255, 0.1);
                border: none;
                color: #ecf0f1;
                cursor: pointer;
                padding: 6px 10px;
                font-size: 12px;
                display: flex;
                align-items: center;
                border-radius: 4px;
                transition: all 0.2s ease;
            }
            .toolbar-btn:hover {
                background-color: rgba(255, 255, 255, 0.2);
                transform: translateY(-1px);
            }
            .toolbar-btn:active {
                transform: translateY(1px);
            }
            .toolbar-btn svg {
                width: 14px;
                height: 14px;
                margin-right: 6px;
            }
            .copy-path-btn {
                background: transparent;
                border: 1px solid rgba(255, 255, 255, 0.2);
                color: #3498db;
                cursor: pointer;
                padding: 4px 10px;
                font-size: 12px;
                display: flex;
                align-items: center;
                border-radius: 4px;
                transition: all 0.2s ease;
            }
            .copy-path-btn:hover {
                background-color: rgba(52, 152, 219, 0.1);
                border-color: #3498db;
            }
            .copy-path-btn svg {
                width: 14px;
                height: 14px;
                margin-right: 6px;
                fill: #3498db;
            }
            .level-0 {
                margin-left: 0;
            }
            .level-1 {
                margin-left: 20px;
            }
            .level-2 {
                margin-left: 40px;
            }
            .level-3 {
                margin-left: 60px;
            }
            .level-4 {
                margin-left: 80px;
            }
            .level-5 {
                margin-left: 100px;
            }
            .search-container {
                position: fixed;
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: var(--card-bg, #ffffff);
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                z-index: 200;
                display: none;
                width: 350px;
                max-width: 90%;
                animation: fadeIn 0.2s ease;
                border: 1px solid rgba(0, 0, 0, 0.1);
                overflow: hidden;
            }
            .search-container input {
                padding: 12px 40px 12px 16px;
                border: none;
                width: 100%;
                font-size: 14px;
                background: transparent;
                color: var(--text-color, #333);
                transition: all 0.2s ease;
            }
            .search-container input:focus {
                outline: none;
            }
            .search-container input::placeholder {
                color: rgba(0, 0, 0, 0.4);
            }
            .search-container .search-controls {
                display: flex;
                align-items: center;
                padding: 8px 12px;
                border-top: 1px solid rgba(0, 0, 0, 0.05);
                background: rgba(0, 0, 0, 0.02);
            }
            .search-container .search-info {
                font-size: 12px;
                color: rgba(0, 0, 0, 0.6);
                flex: 1;
            }
            .search-container .search-nav {
                display: flex;
                gap: 8px;
            }
            .search-container .search-nav-btn {
                background: transparent;
                border: none;
                cursor: pointer;
                padding: 4px;
                border-radius: 4px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: var(--primary-color, #4285f4);
            }
            .search-container .search-nav-btn:hover {
                background: rgba(0, 0, 0, 0.05);
            }
            .search-container .search-nav-btn svg {
                width: 16px;
                height: 16px;
                fill: currentColor;
            }
            .search-container .search-close {
                position: absolute;
                top: 12px;
                right: 12px;
                background: transparent;
                border: none;
                cursor: pointer;
                padding: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                width: 20px;
                height: 20px;
                opacity: 0.5;
                transition: opacity 0.2s;
            }
            .search-container .search-close:hover {
                opacity: 0.8;
            }
            .search-container .search-close svg {
                width: 16px;
                height: 16px;
                fill: currentColor;
            }
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(-10px) translateX(-50%); }
                to { opacity: 1; transform: translateY(0) translateX(-50%); }
            }
            .search-result {
                background-color: rgba(66, 133, 244, 0.2) !important;
                border-radius: 2px;
                box-shadow: 0 0 0 1px rgba(66, 133, 244, 0.3);
            }
            .search-active {
                background-color: rgba(66, 133, 244, 0.4) !important;
                box-shadow: 0 0 0 2px rgba(66, 133, 244, 0.5);
            }
            .copy-tooltip {
                position: fixed;
                background-color: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 6px 12px;
                border-radius: 4px;
                font-size: 12px;
                transform: translate(-50%, -100%);
                opacity: 0;
                transition: opacity 0.3s ease;
                z-index: 1000;
                pointer-events: none;
                white-space: nowrap;
            }
            .copy-tooltip.show {
                opacity: 1;
            }
            .copy-tooltip:after {
                content: '';
                position: absolute;
                top: 100%;
                left: 50%;
                margin-left: -5px;
                border-width: 5px;
                border-style: solid;
                border-color: rgba(0, 0, 0, 0.8) transparent transparent transparent;
            }
            @media (prefers-color-scheme: dark) {
                body {
                    background-color: #202124;
                    color: #e8eaed;
                }
                .json-container {
                    background-color: #292a2d;
                    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
                }
                .toolbar {
                    background-color: #202124;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
                }
                .toolbar-title {
                    color: #8ab4f8;
                }
                .usage-tip {
                    color: #9aa0a6;
                    background-color: rgba(138, 180, 248, 0.1);
                }
                .usage-tip svg {
                    fill: #8ab4f8;
                }
                .json-key {
                    color: #c792ea;
                }
                .json-string {
                    color: #89ddff;
                }
                .json-number {
                    color: #f78c6c;
                }
                .json-boolean {
                    color: #c3e88d;
                }
                .json-null {
                    color: #bdbdbd;
                }
                .json-row:hover {
                    background-color: rgba(138, 180, 248, 0.1);
                }
                .json-row.active {
                    background-color: rgba(138, 180, 248, 0.15);
                }
                .path-info {
                    background-color: #1a1a1a;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
                }
                .path-info.updated {
                    background-color: #2c2c2c;
                }
                .path-text {
                    background-color: rgba(255, 255, 255, 0.05);
                    border-left: 3px solid #8ab4f8;
                }
                .toolbar-title {
                    color: #8ab4f8;
                }
                .toolbar-btn {
                    background: rgba(255, 255, 255, 0.05);
                    color: #e8eaed;
                }
                .toolbar-btn:hover {
                    background-color: rgba(255, 255, 255, 0.1);
                }
                .copy-path-btn {
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    color: #8ab4f8;
                }
                .copy-path-btn:hover {
                    background-color: rgba(138, 180, 248, 0.1);
                    border-color: #8ab4f8;
                }
                .copy-path-btn svg {
                    fill: #8ab4f8;
                }
                .search-container {
                    background: var(--card-bg-dark, #292a2d);
                    border-color: rgba(255, 255, 255, 0.1);
                }
                .search-container input {
                    color: var(--text-dark, #e8eaed);
                }
                .search-container input::placeholder {
                    color: rgba(255, 255, 255, 0.4);
                }
                .search-container .search-controls {
                    border-top-color: rgba(255, 255, 255, 0.05);
                    background: rgba(0, 0, 0, 0.2);
                }
                .search-container .search-info {
                    color: rgba(255, 255, 255, 0.6);
                }
                .search-container .search-nav-btn {
                    color: var(--primary-dark, #8ab4f8);
                }
                .search-container .search-nav-btn:hover {
                    background: rgba(255, 255, 255, 0.05);
                }
                .search-container .search-close svg {
                    fill: rgba(255, 255, 255, 0.7);
                }
                .search-result {
                    background-color: rgba(138, 180, 248, 0.2) !important;
                    box-shadow: 0 0 0 1px rgba(138, 180, 248, 0.3);
                }
                .search-active {
                    background-color: rgba(138, 180, 248, 0.4) !important;
                    box-shadow: 0 0 0 2px rgba(138, 180, 248, 0.5);
                }
            }

            /* 节点信息弹窗样式 */
            .node-info-popup {
                position: fixed;
                background-color: #ffffff;
                border: 1px solid rgba(0, 0, 0, 0.1);
                border-radius: 8px;
                padding: 20px;
                box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
                z-index: 1000;
                cursor: default;
                min-width: 480px;
                max-width: min(1000px, 90vw);
                width: auto;
            }

            .node-info-popup.popup-above {
                animation: fadeInScaleFromBottom 0.2s ease;
            }

            .node-info-popup.popup-below {
                animation: fadeInScaleFromTop 0.2s ease;
            }

            @keyframes fadeInScaleFromBottom {
                from {
                    opacity: 0;
                    transform: scale(0.95) translateY(10px);
                }
                to {
                    opacity: 1;
                    transform: scale(1) translateY(0);
                }
            }

            @keyframes fadeInScaleFromTop {
                from {
                    opacity: 0;
                    transform: scale(0.95) translateY(-10px);
                }
                to {
                    opacity: 1;
                    transform: scale(1) translateY(0);
                }
            }

            .node-info-popup .info-header {
                font-size: 14px;
                font-weight: 500;
                color: var(--text-color, #333);
                margin-bottom: 12px;
                padding-bottom: 8px;
                border-bottom: 1px solid rgba(0, 0, 0, 0.1);
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .node-info-popup .info-close {
                background: transparent;
                border: none;
                cursor: pointer;
                padding: 4px;
                opacity: 0.6;
                transition: opacity 0.2s;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .node-info-popup .info-close:hover {
                opacity: 1;
            }

            .node-info-popup .info-close svg {
                width: 16px;
                height: 16px;
                fill: currentColor;
            }

            .node-info-popup .info-content {
                font-size: 13px;
                line-height: 1.6;
            }

            .node-info-popup .info-row {
                margin-bottom: 8px;
                display: flex;
                flex-direction: column;
                gap: 4px;
            }

            .node-info-popup .info-row-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .node-info-popup .info-label {
                color: var(--text-color, #666);
                font-weight: 500;
            }

            .node-info-popup .info-value,
            .node-info-popup .formatted-json-text {
                background-color: var(--info-value-bg);
                border: 1px solid var(--info-value-border);
                border-radius: 4px;
                padding: 12px;
                margin-top: 8px;
                max-height: 400px;
                min-width: 360px;
                overflow: auto;
                white-space: pre;
                font-family: monospace;
                font-size: 13px;
                line-height: 1.5;
            }

            .node-info-popup .copy-btn {
                background: transparent;
                border: none;
                cursor: pointer;
                padding: 4px 8px;
                font-size: 12px;
                color: var(--primary-color, #4285f4);
                display: flex;
                align-items: center;
                gap: 4px;
                border-radius: 4px;
                transition: all 0.2s ease;
                position: relative;
            }

            .node-info-popup .copy-btn:hover {
                background: rgba(66, 133, 244, 0.1);
            }

            .node-info-popup .copy-btn.copied {
                background: #4caf50;
                color: white;
            }

            .node-info-popup .copy-btn .copy-feedback {
                position: absolute;
                bottom: 100%;
                left: 50%;
                transform: translateX(-50%) translateY(-8px);
                background: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 12px;
                white-space: nowrap;
                pointer-events: none;
                opacity: 0;
                transition: all 0.2s ease;
            }

            .node-info-popup .copy-btn .copy-feedback.show {
                opacity: 1;
                transform: translateX(-50%) translateY(-4px);
            }

            .node-info-popup .copy-btn .copy-feedback:after {
                content: '';
                position: absolute;
                top: 100%;
                left: 50%;
                margin-left: -4px;
                border-width: 4px;
                border-style: solid;
                border-color: rgba(0, 0, 0, 0.8) transparent transparent transparent;
            }

            @media (prefers-color-scheme: dark) {
                .node-info-popup {
                    background: var(--card-bg-dark, #2c2c2c);
                    border-color: rgba(255, 255, 255, 0.1);
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
                }

                .node-info-popup .info-header {
                    color: var(--text-dark, #e8eaed);
                    border-bottom-color: rgba(255, 255, 255, 0.1);
                }

                .node-info-popup .info-close {
                    color: rgba(255, 255, 255, 0.7);
                }

                .node-info-popup .info-close:hover {
                    color: rgba(255, 255, 255, 0.9);
                    background: rgba(255, 255, 255, 0.1);
                }

                .node-info-popup .info-label {
                    color: var(--text-dark, #9aa0a6);
                }

                .node-info-popup .info-value {
                    background: rgba(255, 255, 255, 0.05);
                    color: var(--text-dark, #e8eaed);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                }

                .node-info-popup .copy-btn {
                    color: var(--primary-dark, #8ab4f8);
                    background: rgba(255, 255, 255, 0.05);
                }

                .node-info-popup .copy-btn:hover {
                    background: rgba(138, 180, 248, 0.15);
                }

                .node-info-popup .copy-btn.copied {
                    background: #43a047;
                    color: #ffffff;
                }

                .node-info-popup .copy-btn svg {
                    fill: currentColor;
                }

                .node-info-popup .copy-feedback {
                    background: rgba(0, 0, 0, 0.8);
                    color: #ffffff;
                }

                .node-info-popup::-webkit-scrollbar {
                    width: 8px;
                }

                .node-info-popup::-webkit-scrollbar-track {
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 4px;
                }

                .node-info-popup::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.2);
                    border-radius: 4px;
                }

                .node-info-popup::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.3);
                }
            }

            .node-info-popup .info-value {
                background-color: var(--info-value-bg);
                border: 1px solid var(--info-value-border);
                border-radius: 4px;
                padding: 8px;
                margin-top: 4px;
                max-height: 200px;
                overflow: auto;
                white-space: pre;
                font-family: monospace;
            }

            .node-info-popup .formatted-json-text {
                background-color: var(--info-value-bg);
                border: 1px solid var(--info-value-border);
                border-radius: 4px;
                padding: 8px;
                margin-top: 4px;
                max-height: 200px;
                overflow: auto;
                white-space: pre;
                font-family: monospace;
            }
        `;
        document.head.appendChild(style);
        
        // 先添加路径信息
        document.body.appendChild(createPathInfo());
        
        // 创建工具栏
        const toolbar = document.createElement('div');
        toolbar.className = 'toolbar';
        
        // 工具栏右侧
        const toolbarRight = document.createElement('div');
        toolbarRight.className = 'toolbar-right';
        
        // 搜索按钮
        const searchBtn = document.createElement('button');
        searchBtn.className = 'toolbar-btn';
        searchBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>搜索 (⌘K)';
        searchBtn.onclick = function() {
            toggleSearch();
        };
        
        // 添加全局键盘快捷键监听器
        document.addEventListener('keydown', function(e) {
            // Command+K (Mac) 或 Ctrl+K (其他平台)
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault(); // 阻止浏览器默认行为
                toggleSearch();
            }
        });
        
        // 切换搜索面板显示/隐藏
        function toggleSearch() {
            const searchContainer = document.querySelector('.search-container');
            if (searchContainer.style.display === 'none' || !searchContainer.style.display) {
                searchContainer.style.display = 'block';
                const searchInput = document.querySelector('.search-input');
                searchInput.value = ''; // 清空搜索框
                searchInput.focus();
                
                // 重置搜索信息
                const searchInfo = document.querySelector('.search-info');
                if (searchInfo) {
                    searchInfo.textContent = '输入关键词并按回车搜索';
                }
                
                // 隐藏导航按钮
                const navButtons = document.querySelectorAll('.search-nav-btn');
                navButtons.forEach(btn => {
                    btn.style.display = 'none';
                });
            } else {
                searchContainer.style.display = 'none';
                clearSearch();
            }
        }
        
        // 格式化/原始JSON切换按钮
        const toggleViewBtn = document.createElement('button');
        toggleViewBtn.className = 'toolbar-btn';
        toggleViewBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/></svg>原始JSON';
        toggleViewBtn.dataset.mode = 'formatted'; // 初始模式为格式化视图
        
        toggleViewBtn.onclick = function() {
            document.body.innerHTML = '';
            
            // 先添加路径信息
            document.body.appendChild(createPathInfo());
            
            if (toggleViewBtn.dataset.mode === 'formatted') {
                // 切换到原始JSON视图
                const pre = document.createElement('pre');
                pre.className = 'json-container';
                pre.textContent = JSON.stringify(jsonObj, null, 2);
                document.body.appendChild(pre);
                
                toggleViewBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>格式化';
                toggleViewBtn.dataset.mode = 'raw';
            } else {
                // 切换到格式化视图
                document.body.appendChild(renderJSON(jsonObj));
                
                toggleViewBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/></svg>原始JSON';
                toggleViewBtn.dataset.mode = 'formatted';
            }
            
            document.body.appendChild(createSearchContainer());
            
            // 更新路径信息栏中的按钮
            const pathInfo = document.querySelector('.path-info');
            if (pathInfo) {
                const toolbarRight = pathInfo.querySelector('.toolbar-right');
                if (toolbarRight) {
                    // 添加功能按钮到路径信息栏
                    toolbarRight.appendChild(searchBtn);
                    toolbarRight.appendChild(toggleViewBtn);
                    toolbarRight.appendChild(editBtn);
                    toolbarRight.appendChild(copyBtn);
                }
            }
        };
        
        // 复制按钮
        const copyBtn = document.createElement('button');
        copyBtn.className = 'toolbar-btn';
        copyBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>复制';
        copyBtn.onclick = function() {
            const jsonString = JSON.stringify(jsonObj);
            navigator.clipboard.writeText(jsonString)
                .then(() => {
                    copyBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>已复制!';
                    setTimeout(() => {
                        copyBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>复制';
                    }, 2000);
                })
                .catch(err => {
                    console.error('复制失败: ', err);
                });
        };
        
        // 编辑按钮
        const editBtn = document.createElement('button');
        editBtn.className = 'toolbar-btn';
        editBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>编辑';
        editBtn.onclick = function() {
            // 这里不需要实现功能，只是UI展示
            console.log('编辑按钮被点击');
        };
        
        // 添加功能按钮到路径信息栏
        const pathInfo = document.querySelector('.path-info');
        if (pathInfo) {
            const toolbarRight = pathInfo.querySelector('.toolbar-right');
            if (toolbarRight) {
                toolbarRight.appendChild(searchBtn);
                toolbarRight.appendChild(toggleViewBtn);
                toolbarRight.appendChild(editBtn);
                toolbarRight.appendChild(copyBtn);
            }
        }
        
        // 渲染JSON
        const jsonContainer = renderJSON(jsonObj);
        document.body.appendChild(jsonContainer);
        
        // 添加搜索容器
        document.body.appendChild(createSearchContainer());
    }
    
    // 递归渲染JSON对象
    function renderJSON(obj, level = 0, path = '') {
        const container = document.createElement('div');
        container.className = 'json-container';
        
        if (typeof obj === 'object' && obj !== null) {
            const isArray = Array.isArray(obj);
            const keys = Object.keys(obj);
            
            if (keys.length === 0) {
                container.innerHTML = isArray ? '[]' : '{}';
                return container;
            }
            
            const openBracket = document.createElement('span');
            openBracket.textContent = isArray ? '[' : '{';
            container.appendChild(openBracket);
            
            const contentContainer = document.createElement('div');
            contentContainer.className = `level-${Math.min(level, 5)}`;
            
            keys.forEach((key, index) => {
                const row = document.createElement('div');
                row.className = 'json-row';
                
                // 为每一行添加点击事件，显示路径
                const currentPath = isArray ? 
                    (path ? `${path}[${index}]` : `[${index}]`) : 
                    (path ? `${path}.${key}` : key);
                
                row.addEventListener('click', function(e) {
                    e.stopPropagation();
                    
                    // 移除已存在的弹窗
                    const existingPopup = document.querySelector('.node-info-popup');
                    if (existingPopup) {
                        existingPopup.remove();
                    }

                    // 创建弹窗
                    const popup = document.createElement('div');
                    popup.className = 'node-info-popup';

                    // 阻止滚动传播
                    popup.addEventListener('wheel', (e) => {
                        const scrollContent = e.target.closest('.info-value, .formatted-json-text');
                        if (!scrollContent) {
                            e.preventDefault();
                            return;
                        }

                        const delta = e.deltaY;
                        const scrollTop = scrollContent.scrollTop;
                        const maxScroll = scrollContent.scrollHeight - scrollContent.clientHeight;

                        // 如果内容不需要滚动，阻止事件
                        if (scrollContent.scrollHeight <= scrollContent.clientHeight) {
                            e.preventDefault();
                            return;
                        }

                        // 在到达边界时阻止滚动
                        if ((scrollTop <= 0 && delta < 0) || (scrollTop >= maxScroll && delta > 0)) {
                            e.preventDefault();
                        }
                    }, { passive: false });

                    // 添加样式
                    const style = document.createElement('style');
                    style.textContent = `
                        .node-info-popup {
                            cursor: default;
                        }
                        .node-info-popup .info-header {
                            cursor: move;
                            user-select: none;
                        }
                        .node-info-popup .info-close {
                            cursor: pointer;
                            user-select: none;
                        }
                        .node-info-popup .info-content {
                            cursor: default;
                        }
                        .node-info-popup .info-label {
                            user-select: none;
                        }
                        .node-info-popup .info-value {
                            cursor: text;
                            user-select: text;
                            -webkit-user-select: text;
                            -moz-user-select: text;
                            -ms-user-select: text;
                        }
                        .node-info-popup .copy-btn {
                            cursor: pointer;
                            user-select: none;
                        }
                        .node-info-popup.dragging {
                            cursor: move !important;
                        }
                        .node-info-popup.dragging * {
                            cursor: move !important;
                            user-select: none !important;
                        }
                        .node-info-popup .preview-json {
                            cursor: default;
                        }
                        .node-info-popup .preview-json .collapsible {
                            cursor: pointer;
                            user-select: none;
                        }
                        .node-info-popup .preview-json .json-row {
                            cursor: default;
                        }
                        .node-info-popup .preview-json .json-string,
                        .node-info-popup .preview-json .json-number,
                        .node-info-popup .preview-json .json-boolean,
                        .node-info-popup .preview-json .json-null {
                            cursor: text;
                            user-select: text;
                            -webkit-user-select: text;
                            -moz-user-select: text;
                            -ms-user-select: text;
                        }
                        .node-info-popup .info-value {
                            padding: 8px 12px;
                            background: var(--card-bg, rgba(0, 0, 0, 0.02));
                            border-radius: 4px;
                            line-height: 1.5;
                            white-space: pre-wrap;
                            word-break: break-all;
                            font-family: monospace;
                        }
                        @media (prefers-color-scheme: dark) {
                            .node-info-popup .info-value {
                                background: var(--card-bg-dark, rgba(255, 255, 255, 0.05));
                            }
                        }
                    `;
                    document.head.appendChild(style);

                    // 添加拖拽功能
                    let isDragging = false;
                    let currentX;
                    let currentY;
                    let initialX;
                    let initialY;
                    let xOffset = 0;
                    let yOffset = 0;

                    function dragStart(e) {
                        // 如果点击的是文本区域或其子元素，允许文本选择
                        if (e.target.closest('.info-value') || 
                            e.target.closest('.json-string') ||
                            e.target.closest('.json-number') ||
                            e.target.closest('.json-boolean') ||
                            e.target.closest('.json-null')) {
                            return;
                        }

                        // 如果是可点击的元素，不启动拖拽
                        if (e.target.closest('.info-close') || 
                            e.target.closest('.copy-btn') || 
                            e.target.closest('.collapsible')) {
                            return;
                        }

                        // 只允许从标题栏或弹窗空白区域拖动
                        if (e.target.closest('.info-header') || e.target === popup) {
                            e.preventDefault();
                            initialX = e.clientX - xOffset;
                            initialY = e.clientY - yOffset;
                            isDragging = true;
                            popup.classList.add('dragging');
                        }
                    }

                    function dragEnd() {
                        if (!isDragging) return;
                        initialX = currentX;
                        initialY = currentY;
                        isDragging = false;
                        popup.classList.remove('dragging');
                    }

                    function drag(e) {
                        if (isDragging) {
                            e.preventDefault();
                            currentX = e.clientX - initialX;
                            currentY = e.clientY - initialY;
                            xOffset = currentX;
                            yOffset = currentY;
                            popup.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
                        }
                    }

                    popup.addEventListener('mousedown', dragStart, { passive: false });
                    document.addEventListener('mousemove', drag, { passive: false });
                    document.addEventListener('mouseup', dragEnd);

                    // 先添加到文档中以获取实际高度
                    popup.style.visibility = 'hidden';
                    document.body.appendChild(popup);

                    // 创建弹窗内容
                    const header = document.createElement('div');
                    header.className = 'info-header';
                    header.textContent = '节点信息';

                    // 关闭按钮
                    const closeBtn = document.createElement('button');
                    closeBtn.className = 'info-close';
                    closeBtn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>';
                    closeBtn.onclick = () => popup.remove();
                    header.appendChild(closeBtn);

                    const content = document.createElement('div');
                    content.className = 'info-content';

                    // 创建复制按钮函数
                    function createCopyButton(text, label) {
                        const button = document.createElement('button');
                        button.className = 'copy-btn';
                        button.innerHTML = `
                            <svg viewBox="0 0 24 24"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
                            复制${label}
                            <span class="copy-feedback">已复制${label}</span>
                        `;
                        
                        button.addEventListener('click', async (e) => {
                            e.stopPropagation();
                            try {
                                await navigator.clipboard.writeText(text);
                                
                                // 添加复制成功的视觉反馈
                                button.classList.add('copied');
                                const feedback = button.querySelector('.copy-feedback');
                                feedback.classList.add('show');
                                
                                // 2秒后恢复按钮状态
                        setTimeout(() => {
                                    button.classList.remove('copied');
                                    feedback.classList.remove('show');
                                }, 2000);
                            } catch (err) {
                                console.error('复制失败:', err);
                                // 显示错误提示
                                const feedback = button.querySelector('.copy-feedback');
                                feedback.textContent = '复制失败';
                                feedback.classList.add('show');
                                
                                setTimeout(() => {
                                    feedback.classList.remove('show');
                                    feedback.textContent = `已复制${label}`;
                                }, 2000);
                            }
                        });
                        
                        return button;
                    }

                    // 路径信息
                    const pathRow = document.createElement('div');
                    pathRow.className = 'info-row';
                    const pathHeader = document.createElement('div');
                    pathHeader.className = 'info-row-header';
                    const pathLabel = document.createElement('span');
                    pathLabel.className = 'info-label';
                    pathLabel.textContent = '路径';
                    pathHeader.appendChild(pathLabel);
                    pathHeader.appendChild(createCopyButton(currentPath || '根节点', '路径'));
                    pathRow.appendChild(pathHeader);
                    const pathValue = document.createElement('div');
                    pathValue.className = 'info-value';
                    pathValue.textContent = currentPath || '根节点';
                    pathRow.appendChild(pathValue);

                    // 键信息
                    if (!isArray) {
                        const keyRow = document.createElement('div');
                        keyRow.className = 'info-row';
                        const keyHeader = document.createElement('div');
                        keyHeader.className = 'info-row-header';
                        const keyLabel = document.createElement('span');
                        keyLabel.className = 'info-label';
                        keyLabel.textContent = '键';
                        keyHeader.appendChild(keyLabel);
                        keyHeader.appendChild(createCopyButton(key, '键'));
                        keyRow.appendChild(keyHeader);
                        const keyValue = document.createElement('div');
                        keyValue.className = 'info-value';
                        keyValue.textContent = key;
                        keyRow.appendChild(keyValue);
                        content.appendChild(keyRow);
                    }

                    // 值信息
                    const valueRow = document.createElement('div');
                    valueRow.className = 'info-row';
                    const valueHeader = document.createElement('div');
                    valueHeader.className = 'info-row-header';
                    const valueLabel = document.createElement('span');
                    valueLabel.className = 'info-label';
                    valueLabel.textContent = '值';
                    valueHeader.appendChild(valueLabel);

                    // 获取格式化的值
                    let valueStr;
                    let isJsonValue = false;
                    let parsedJson;

                    if (typeof value === 'string') {
                        try {
                            parsedJson = JSON.parse(value);
                            if (typeof parsedJson === 'object' && parsedJson !== null) {
                                isJsonValue = true;
                                valueStr = JSON.stringify(parsedJson, null, 2);
                    } else {
                                valueStr = value;
                            }
                        } catch (e) {
                            valueStr = value;
                        }
                    } else if (typeof value === 'object' && value !== null) {
                        isJsonValue = true;
                        parsedJson = value;
                        valueStr = JSON.stringify(value, null, 2);
                    } else {
                        valueStr = String(value);
                    }

                    valueHeader.appendChild(createCopyButton(valueStr, '值'));
                    valueRow.appendChild(valueHeader);
                    const valueContent = document.createElement('div');
                    valueContent.className = 'info-value';

                    if (isJsonValue) {
                        // 创建简单的格式化文本显示
                        const formattedContainer = document.createElement('div');
                        formattedContainer.className = 'formatted-json-text';
                        
                        // 格式化 JSON 文本
                        const formattedText = JSON.stringify(parsedJson, null, 4);
                        formattedContainer.textContent = formattedText;
                        
                        // 添加样式
                        const style = document.createElement('style');
                        style.textContent = `
                            .formatted-json-text {
                                white-space: pre;
                                font-family: monospace;
                                font-size: 13px;
                                line-height: 1.5;
                                padding: 8px 12px;
                                background: var(--card-bg, rgba(0, 0, 0, 0.02));
                                border-radius: 4px;
                                overflow-x: auto;
                                cursor: text;
                                user-select: text;
                                -webkit-user-select: text;
                                -moz-user-select: text;
                                -ms-user-select: text;
                            }
                            @media (prefers-color-scheme: dark) {
                                .formatted-json-text {
                                    background: var(--card-bg-dark, rgba(255, 255, 255, 0.05));
                                }
                            }
                        `;
                        document.head.appendChild(style);
                        
                        valueContent.appendChild(formattedContainer);
                    } else {
                        valueContent.textContent = valueStr;
                    }

                    valueRow.appendChild(valueContent);

                    content.appendChild(pathRow);
                    content.appendChild(valueRow);

                    popup.appendChild(header);
                    popup.appendChild(content);

                    // 获取点击位置和窗口尺寸
                    const rect = this.getBoundingClientRect();
                    const windowHeight = window.innerHeight;
                    const popupHeight = popup.offsetHeight;
                    const windowWidth = window.innerWidth;
                    const MARGIN = 20; // 边距

                    // 计算垂直位置
                    const spaceBelow = windowHeight - rect.bottom;
                    const spaceAbove = rect.top;

                    // 决定弹窗显示在上方还是下方
                    if (spaceBelow < popupHeight && spaceAbove > spaceBelow) {
                        // 如果下方空间不足且上方空间较大，显示在上方
                        popup.style.top = `${Math.max(MARGIN, rect.top - popupHeight - 10)}px`;
                        popup.classList.add('popup-above');
                    } else {
                        // 显示在下方，但确保不超出窗口底部
                        const topPosition = Math.min(rect.bottom + 10, windowHeight - popupHeight - MARGIN);
                        popup.style.top = `${topPosition}px`;
                        popup.classList.add('popup-below');
                    }

                    // 计算水平位置
                    const popupWidth = popup.offsetWidth;
                    let leftPosition = rect.left + (rect.width - popupWidth) / 2; // 默认居中对齐

                    // 确保不超出左右边界
                    leftPosition = Math.max(MARGIN, Math.min(leftPosition, windowWidth - popupWidth - MARGIN));
                    popup.style.left = `${leftPosition}px`;

                    // 显示弹窗
                    popup.style.visibility = 'visible';

                    // 在创建弹窗后添加 ESC 键监听
                    document.addEventListener('keydown', function closePopupOnEsc(e) {
                        if (e.key === 'Escape') {
                            const popup = document.querySelector('.node-info-popup');
                            if (popup) {
                                popup.remove();
                                // 移除监听器
                                document.removeEventListener('keydown', closePopupOnEsc);
                            }
                        }
                    });

                    // 点击其他地方关闭弹窗
                    document.addEventListener('click', function closePopup(e) {
                        if (!popup.contains(e.target) && e.target !== row) {
                            popup.remove();
                            document.removeEventListener('click', closePopup);
                            // 同时移除 ESC 键监听器
                            document.removeEventListener('keydown', closePopupOnEsc);
                        }
                    });

                    // 更新路径信息栏
                    const pathInfo = document.querySelector('.path-info');
                    if (pathInfo) {
                        const pathText = pathInfo.querySelector('.path-text');
                        if (pathText) {
                            pathText.textContent = `路径: ${currentPath || '根节点'}`;
                        }
                    }
                });
                
                
                if (!isArray) {
                    const keySpan = document.createElement('span');
                    keySpan.className = 'json-key';
                    keySpan.textContent = `"${key}"`;
                    row.appendChild(keySpan);
                    
                    const colon = document.createElement('span');
                    colon.textContent = ': ';
                    row.appendChild(colon);
                }
                
                const value = obj[key];
                
                if (typeof value === 'object' && value !== null && Object.keys(value).length > 0) {
                    // 创建可折叠的对象/数组
                    const collapsibleHeader = document.createElement('span');
                    collapsibleHeader.className = 'collapsible';
                    
                    const expandMarker = document.createElement('span');
                    expandMarker.className = 'expand-marker';
                    expandMarker.textContent = '▼';
                    collapsibleHeader.appendChild(expandMarker);
                    
                    const preview = document.createElement('span');
                    preview.textContent = Array.isArray(value) ? 
                        `Array(${value.length})` : 
                        `Object{${Object.keys(value).length}}`;
                    collapsibleHeader.appendChild(preview);
                    
                    collapsibleHeader.onclick = function(e) {
                        e.stopPropagation();
                        const content = this.nextElementSibling;
                        content.classList.toggle('collapsed');
                        
                        const marker = this.querySelector('.expand-marker');
                        marker.classList.toggle('collapsed-marker');
                        marker.textContent = '▼';
                        
                        // 点击折叠/展开按钮时也更新路径信息
                        const pathInfo = document.querySelector('.path-info');
                        if (pathInfo) {
                            // 更新路径文本
                            const pathText = pathInfo.querySelector('.path-text');
                            if (pathText) {
                                pathText.textContent = `路径: ${currentPath || '根节点'}`;
                            } else {
                                const pathInfoLeft = pathInfo.querySelector('.path-info-left');
                                if (pathInfoLeft) {
                                    const newPathText = document.createElement('span');
                                    newPathText.className = 'path-text';
                                    newPathText.textContent = `路径: ${currentPath || '根节点'}`;
                                    pathInfoLeft.insertBefore(newPathText, pathInfoLeft.querySelector('.toolbar-title'));
                                }
                            }
                            
                            // 添加高亮效果
                            document.querySelectorAll('.json-row.active').forEach(el => {
                                el.classList.remove('active');
                            });
                            row.classList.add('active');
                            
                            // 添加路径更新动画
                            pathInfo.classList.add('updated');
                            setTimeout(() => {
                                pathInfo.classList.remove('updated');
                            }, 500);
                        }
                    };
                    
                    row.appendChild(collapsibleHeader);
                    
                    const valueContainer = document.createElement('div');
                    if (isArray) {
                        valueContainer.className = 'array-item';
                    }
                    valueContainer.appendChild(renderJSON(value, level + 1, currentPath));
                    row.appendChild(valueContainer);
                } else {
                    // 简单值
                    const valueSpan = document.createElement('span');
                    
                    if (typeof value === 'string') {
                        valueSpan.className = 'json-string';
                        valueSpan.textContent = `"${value}"`;
                    } else if (typeof value === 'number') {
                        valueSpan.className = 'json-number';
                        valueSpan.textContent = value;
                    } else if (typeof value === 'boolean') {
                        valueSpan.className = 'json-boolean';
                        valueSpan.textContent = value;
                    } else if (value === null) {
                        valueSpan.className = 'json-null';
                        valueSpan.textContent = 'null';
                    } else {
                        valueSpan.textContent = JSON.stringify(value);
                    }
                    
                    
                    row.appendChild(valueSpan);
                }
                
                if (index < keys.length - 1) {
                    const comma = document.createElement('span');
                    comma.textContent = ',';
                    row.appendChild(comma);
                }
                
                contentContainer.appendChild(row);
            });
            
            container.appendChild(contentContainer);
            
            const closeBracket = document.createElement('span');
            closeBracket.textContent = isArray ? ']' : '}';
            container.appendChild(closeBracket);
        } else {
            // 简单值
            const valueSpan = document.createElement('span');
            
            if (typeof obj === 'string') {
                valueSpan.className = 'json-string';
                valueSpan.textContent = `"${obj}"`;
            } else if (typeof obj === 'number') {
                valueSpan.className = 'json-number';
                valueSpan.textContent = obj;
            } else if (typeof obj === 'boolean') {
                valueSpan.className = 'json-boolean';
                valueSpan.textContent = obj;
            } else if (obj === null) {
                valueSpan.className = 'json-null';
                valueSpan.textContent = 'null';
            } else {
                valueSpan.textContent = JSON.stringify(obj);
            }
            
            
            container.appendChild(valueSpan);
        }
        
        return container;
    }
    
    // 显示复制成功提示
    function showCopyTooltip(element, message) {
        // 移除已有的提示
        const existingTooltips = document.querySelectorAll('.copy-tooltip');
        existingTooltips.forEach(tooltip => tooltip.remove());
        
        // 创建新提示
        const tooltip = document.createElement('div');
        tooltip.className = 'copy-tooltip';
        tooltip.textContent = message;
        
        // 计算位置
        const rect = element.getBoundingClientRect();
        tooltip.style.top = `${rect.top - 30}px`;
        tooltip.style.left = `${rect.left + rect.width / 2}px`;
        
        // 添加到文档
        document.body.appendChild(tooltip);
        
        // 添加动画类
        setTimeout(() => {
            tooltip.classList.add('show');
        }, 10);
        
        // 自动移除
        setTimeout(() => {
            tooltip.classList.remove('show');
            setTimeout(() => {
                tooltip.remove();
            }, 300);
        }, 2000);
    }
    
    // 检测Content-Type是否为JSON
    function isJSONContentType() {
        const contentType = document.contentType;
        console.log("页面Content-Type:", contentType);
        return contentType && (
            contentType.includes('application/json') || 
            contentType.includes('text/json') ||
            contentType.includes('application/javascript') ||
            contentType.includes('text/javascript') ||
            // 有些API返回JSON但Content-Type设置不正确
            contentType.includes('text/plain')
        );
    }
    
    // 检查URL是否可能是JSON
    function isJSONUrl() {
        const url = window.location.href.toLowerCase();
        console.log("检查URL:", url);
        return url.includes('.json') || 
               url.includes('/json') || 
               url.includes('/api/') || 
               url.includes('format=json');
    }
    
    // 检查页面内容是否看起来像JSON
    function looksLikeJSON() {
        const bodyText = document.body.textContent.trim();
        if (!bodyText) return false;
        
        // 检查是否以{ 或 [ 开头，以} 或 ]结尾
        const firstChar = bodyText.charAt(0);
        const lastChar = bodyText.charAt(bodyText.length - 1);
        
        const startsWithBrace = firstChar === '{' || firstChar === '[';
        const endsWithBrace = lastChar === '}' || lastChar === ']';
        
        console.log("页面内容首尾字符:", firstChar, lastChar);
        
        // 检查是否包含常见的JSON模式
        const hasJsonPattern = bodyText.includes('":"') || 
                              bodyText.includes('":') || 
                              bodyText.includes(',[') || 
                              bodyText.includes(',{');
        
        return (startsWithBrace && endsWithBrace) || hasJsonPattern;
    }
    
    // 检查页面是否已经被我们的扩展格式化过
    function isAlreadyFormatted() {
        // 检查是否有我们添加的工具栏
        const hasToolbar = document.querySelector('.toolbar') !== null;
        const hasJsonContainer = document.querySelector('.json-container') !== null;
        const hasPathInfo = document.querySelector('.path-info') !== null;
        
        console.log("检查页面是否已格式化: 工具栏存在 =", hasToolbar);
        console.log("检查页面是否已格式化: JSON容器存在 =", hasJsonContainer);
        console.log("检查页面是否已格式化: 路径信息存在 =", hasPathInfo);
        
        // 只有当这些元素都存在时，才认为页面已经被格式化过
        const isFormatted = hasToolbar && hasJsonContainer;
        console.log("页面格式化状态:", isFormatted);
        
        return isFormatted;
    }
    
    // 自动检测并格式化JSON
    if (isAlreadyFormatted() && lastParsedJSON) {
        console.log("页面已经被格式化过，使用缓存的JSON数据");
        return function() {
            console.log("返回缓存的成功结果");
            return true; // 直接返回成功，不需要再次格式化
        };
    } else if (isAlreadyFormatted()) {
        console.log("页面已经被格式化过，但没有缓存的JSON数据");
        return function() {
            console.log("页面已格式化，返回成功");
            return true;
        };
    } else if (isJSONContentType() || isJSONUrl() || looksLikeJSON()) {
        console.log("检测到可能的JSON内容，尝试格式化...");
        const result = checkAndFormatJSON();
        console.log("格式化结果:", result);
        
        // 如果格式化成功，返回一个函数
        if (result) {
            return function() {
                console.log("返回格式化成功结果");
                return true;
            };
        }
    } else {
        console.log("页面内容不符合JSON格式化条件");
    }
    
    // 默认返回检查函数
    return checkAndFormatJSON;
}

// 在页面加载完成后执行
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        console.log("DOMContentLoaded事件触发");
        // 延迟执行，确保页面内容已完全加载
        setTimeout(processPage, 300);
    });
} else {
    // 如果页面已经加载完成，直接执行
    console.log("页面已加载，直接执行处理");
    setTimeout(processPage, 300);
}

// 监听来自扩展的消息
browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("Content script received message:", request);
    
    try {
        // 检查页面状态
        if (request.action === "checkStatus") {
            const hasToolbar = document.querySelector('.toolbar') !== null;
            const hasJsonContainer = document.querySelector('.json-container') !== null;
            const isFormatted = hasToolbar && hasJsonContainer;
            
            console.log("检查页面状态: 是否已格式化 =", isFormatted);
            console.log("检查页面状态: 工具栏存在 =", hasToolbar);
            console.log("检查页面状态: JSON容器存在 =", hasJsonContainer);
            console.log("检查页面状态: 是否有JSON数据 =", lastParsedJSON !== null);
            
            return Promise.resolve({ 
                isFormatted: isFormatted,
                hasToolbar: hasToolbar,
                hasJsonContainer: hasJsonContainer,
                hasJSON: lastParsedJSON !== null
            });
        }
        
        if (request.action === "checkForJSON") {
            console.log("收到格式化请求:", request.action);
            
            try {
            // 检查页面是否已经格式化过
            const hasToolbar = document.querySelector('.toolbar') !== null;
            const hasJsonContainer = document.querySelector('.json-container') !== null;
            const isFormatted = hasToolbar && hasJsonContainer;
            
            console.log("页面是否已格式化:", isFormatted, "工具栏存在:", hasToolbar, "JSON容器存在:", hasJsonContainer);
            
            // 如果页面已经格式化过，直接返回成功
            if (isFormatted) {
                console.log("页面已经格式化过，直接返回成功");
                return Promise.resolve({ success: true, message: "页面已格式化" });
            }
            
            // 检查页面类型，如果是明显的非JSON页面，直接返回
            const isHtmlPage = document.doctype !== null || 
                              document.querySelector('html') !== null || 
                              document.querySelector('head') !== null || 
                              document.querySelector('body').children.length > 5;
            
            if (isHtmlPage && document.body.textContent.trim().length > 1000) {
                console.log("页面看起来是HTML页面，不是JSON");
                return Promise.resolve({ 
                    success: false, 
                    message: "页面是HTML页面，不是JSON",
                    isHtmlPage: true
                });
            }
            
            // 执行处理并返回结果
            console.log("开始执行processPage()");
                const checkFunction = processPage();
                if (checkFunction) {
                    console.log("processPage()返回了检查函数，执行它");
                    const result = checkFunction();
                    console.log("检查函数执行结果:", result);
                    return Promise.resolve({ 
                        success: result,
                        message: result ? "格式化成功" : "格式化失败" 
                    });
                }
                
                    // 再次检查页面是否已经格式化过
                const nowFormatted = document.querySelector('.toolbar') !== null && 
                                   document.querySelector('.json-container') !== null;
                    console.log("processPage()执行后，页面是否已格式化:", nowFormatted);
                    
                    if (nowFormatted) {
                        console.log("页面已经格式化过(processPage后检查)，返回成功");
                        return Promise.resolve({ 
                            success: true,
                            message: "页面已格式化(processPage后检查)" 
                        });
                    }
                
                    console.log("格式化失败");
                    return Promise.resolve({ 
                        success: false,
                        message: "格式化失败，页面可能不包含有效JSON" 
                    });
            } catch (processError) {
                console.error("处理页面时出错:", processError);
                return Promise.resolve({ 
                    success: false, 
                    error: processError.message,
                    message: "处理页面时出错" 
                });
            }
        }
        
        return Promise.resolve({ 
            success: false,
            message: "未知操作",
            action: request.action 
        });
    } catch (error) {
        console.error("处理消息时出错:", error);
        return Promise.resolve({ 
            success: false, 
            error: error.message,
            message: "处理消息时出错" 
        });
    }
});

// 保留原有的消息监听功能
browser.runtime.sendMessage({ greeting: "hello" }).then((response) => {
    console.log("Received response: ", response);
});

// 创建路径信息显示
function createPathInfo() {
    const pathInfo = document.createElement('div');
    pathInfo.className = 'path-info';
    
    // 左侧部分 - 路径信息和标题
    const pathLeft = document.createElement('div');
    pathLeft.className = 'path-info-left';
    // 添加工具栏标题
    const title = document.createElement('div');
    title.className = 'toolbar-title';
    title.textContent = 'JSON格式化工具';
    pathLeft.appendChild(title);
    
    
    
    pathInfo.appendChild(pathLeft);
    
    // 右侧部分 - 按钮
    const toolbarRight = document.createElement('div');
    toolbarRight.className = 'toolbar-right';
    
    pathInfo.appendChild(toolbarRight);
    
    return pathInfo;
}

// 创建搜索容器
function createSearchContainer() {
    const searchContainer = document.createElement('div');
    searchContainer.className = 'search-container';
    
    // 搜索输入框
    const searchInput = document.createElement('input');
    searchInput.className = 'search-input';
    searchInput.placeholder = '搜索...';
    searchInput.addEventListener('keyup', function(e) {
        if (e.key === 'Enter') {
            searchJSON(this.value);
        }
        if (e.key === 'Escape') {
            searchContainer.style.display = 'none';
            clearSearch();
        }
    });
    
    // 关闭按钮
    const closeButton = document.createElement('button');
    closeButton.className = 'search-close';
    closeButton.innerHTML = '<svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>';
    closeButton.addEventListener('click', function() {
        searchContainer.style.display = 'none';
        clearSearch();
    });
    
    // 搜索控制区域
    const searchControls = document.createElement('div');
    searchControls.className = 'search-controls';
    
    // 搜索信息
    const searchInfo = document.createElement('div');
    searchInfo.className = 'search-info';
    searchInfo.textContent = '输入关键词并按回车搜索';
    
    // 导航按钮区域
    const searchNav = document.createElement('div');
    searchNav.className = 'search-nav';
    
    // 上一个结果按钮
    const prevButton = document.createElement('button');
    prevButton.className = 'search-nav-btn prev-btn';
    prevButton.innerHTML = '<svg viewBox="0 0 24 24"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12l4.58-4.59z"/></svg>';
    prevButton.title = '上一个结果 (Shift+F3)';
    prevButton.addEventListener('click', function() {
        navigateSearchResults({ key: 'F3', shiftKey: true, preventDefault: () => {} });
    });
    
    // 下一个结果按钮
    const nextButton = document.createElement('button');
    nextButton.className = 'search-nav-btn next-btn';
    nextButton.innerHTML = '<svg viewBox="0 0 24 24"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6-6-6z"/></svg>';
    nextButton.title = '下一个结果 (F3)';
    nextButton.addEventListener('click', function() {
        navigateSearchResults({ key: 'F3', shiftKey: false, preventDefault: () => {} });
    });
    
    // 添加元素到容器
    searchNav.appendChild(prevButton);
    searchNav.appendChild(nextButton);
    
    searchControls.appendChild(searchInfo);
    searchControls.appendChild(searchNav);
    
    searchContainer.appendChild(searchInput);
    searchContainer.appendChild(closeButton);
    searchContainer.appendChild(searchControls);
    
    return searchContainer;
}

// 搜索JSON
function searchJSON(query) {
    if (!query) return;
    
    clearSearch();
    
    const searchResults = [];
    const allElements = document.querySelectorAll('.json-key, .json-string, .json-number, .json-boolean, .json-null');
    
    allElements.forEach(el => {
        if (el.textContent.toLowerCase().includes(query.toLowerCase())) {
            el.classList.add('search-result');
            searchResults.push(el);
            
            // 确保父元素展开
            let parent = el.parentElement;
            while (parent) {
                if (parent.classList && parent.classList.contains('collapsed')) {
                    parent.classList.remove('collapsed');
                    const collapsible = parent.previousElementSibling;
                    if (collapsible && collapsible.classList.contains('collapsible')) {
                        const marker = collapsible.querySelector('.expand-marker');
                        if (marker) {
                            marker.classList.remove('collapsed-marker');
                            marker.textContent = '▼';
                        }
                    }
                }
                parent = parent.parentElement;
            }
        }
    });
    
    // 更新搜索结果信息
    const searchInfo = document.querySelector('.search-info');
    if (searchInfo) {
        if (searchResults.length > 0) {
            searchInfo.textContent = `找到 ${searchResults.length} 个结果`;
        } else {
            searchInfo.textContent = '未找到匹配结果';
        }
    }
    
    // 显示/隐藏导航按钮
    const navButtons = document.querySelectorAll('.search-nav-btn');
    navButtons.forEach(btn => {
        btn.style.display = searchResults.length > 0 ? 'flex' : 'none';
    });
    
    if (searchResults.length > 0) {
        searchResults[0].classList.add('search-active');
        searchResults[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // 更新路径信息
        updatePathInfo(searchResults[0]);
        
        // 添加键盘导航
        document.addEventListener('keydown', navigateSearchResults);
    }
}

// 清除搜索结果
function clearSearch() {
    const searchResults = document.querySelectorAll('.search-result');
    searchResults.forEach(el => {
        el.classList.remove('search-result');
        el.classList.remove('search-active');
    });
    
    document.removeEventListener('keydown', navigateSearchResults);
}

// 搜索结果导航
function navigateSearchResults(e) {
    const searchResults = document.querySelectorAll('.search-result');
    if (searchResults.length === 0) return;
    
    const activeIndex = Array.from(searchResults).findIndex(el => el.classList.contains('search-active'));
    
    if (e.key === 'F3' && !e.shiftKey) {
        e.preventDefault();
        
        let nextIndex = activeIndex + 1;
        if (nextIndex >= searchResults.length) nextIndex = 0;
        
        searchResults.forEach(el => el.classList.remove('search-active'));
        searchResults[nextIndex].classList.add('search-active');
        searchResults[nextIndex].scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // 更新路径信息
        updatePathInfo(searchResults[nextIndex]);
    } else if ((e.key === 'F3' && e.shiftKey) || (e.key === 'N' && e.ctrlKey && e.shiftKey)) {
        e.preventDefault();
        
        let prevIndex = activeIndex - 1;
        if (prevIndex < 0) prevIndex = searchResults.length - 1;
        
        searchResults.forEach(el => el.classList.remove('search-active'));
        searchResults[prevIndex].classList.add('search-active');
        searchResults[prevIndex].scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // 更新路径信息
        updatePathInfo(searchResults[prevIndex]);
    }
}

// 更新路径信息
function updatePathInfo(element) {
    const pathInfo = document.querySelector('.path-info');
    if (!pathInfo) return;
    
    let path = '根节点';
    let current = element;
    const pathParts = [];
    
    while (current && current !== document.body) {
        // 如果是键
        if (current.classList && current.classList.contains('json-key')) {
            pathParts.unshift(current.textContent.replace(/"/g, ''));
        }
        // 如果是数组项
        else if (current.parentElement && current.parentElement.parentElement && 
                 current.parentElement.parentElement.classList && 
                 current.parentElement.parentElement.classList.contains('array-item')) {
            const index = Array.from(current.parentElement.parentElement.parentElement.children).indexOf(current.parentElement.parentElement);
            if (index !== -1) {
                pathParts.unshift(`[${index}]`);
            }
        }
        
        current = current.parentElement;
    }
    
    if (pathParts.length > 0) {
        path = pathParts.join('.');
    }
    
    // 更新路径文本
    const pathText = pathInfo.querySelector('.path-text');
    if (pathText) {
        pathText.textContent = `路径: ${path}`;
    } else {
        const pathInfoLeft = pathInfo.querySelector('.path-info-left');
        if (pathInfoLeft) {
            const newPathText = document.createElement('span');
            newPathText.className = 'path-text';
            newPathText.textContent = `路径: ${path}`;
            pathInfoLeft.insertBefore(newPathText, pathInfoLeft.querySelector('.toolbar-title'));
        }
    }
    
    // 添加高亮效果
    document.querySelectorAll('.json-row.active').forEach(el => {
        el.classList.remove('active');
    });
    
    // 查找并高亮包含该元素的行
    let rowElement = element;
    while (rowElement && !rowElement.classList.contains('json-row')) {
        rowElement = rowElement.parentElement;
    }
    
    if (rowElement) {
        rowElement.classList.add('active');
    }
    
    // 添加路径更新动画
    pathInfo.classList.add('updated');
    setTimeout(() => {
        pathInfo.classList.remove('updated');
    }, 500);
}
