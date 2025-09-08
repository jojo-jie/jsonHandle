console.log("JSON Handler Popup Initialized", browser);

document.addEventListener('DOMContentLoaded', function() {
    initializePopup();
    setupEventListeners();
    loadDebugInfo();
});

function initializePopup() {
    // Initialize extension status
    updateExtensionStatus('Active');
    
    // Add smooth animations
    document.querySelectorAll('.feature-item').forEach((item, index) => {
        item.style.opacity = '0';
        item.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            item.style.transition = 'all 0.5s ease';
            item.style.opacity = '1';
            item.style.transform = 'translateY(0)';
        }, index * 100);
    });
}

function setupEventListeners() {
    // Settings button
    const settingsBtn = document.getElementById('settingsBtn');
    if (settingsBtn) {
        settingsBtn.addEventListener('click', () => {
            console.log('Settings clicked');
            // Future: Open settings
        });
    }
    
    // Refresh button
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            refreshBtn.style.transform = 'rotate(360deg)';
            refreshBtn.style.transition = 'transform 0.5s ease';
            
            setTimeout(() => {
                refreshBtn.style.transform = 'rotate(0deg)';
                loadDebugInfo();
            }, 500);
        });
    }
    
    // Optimize scrolling
    document.addEventListener('wheel', function(e) {
        e.stopPropagation();
    }, { passive: true });
    
    // iOS scroll fix
    document.body.addEventListener('touchstart', function() {
        // Touch start for iOS scroll activation
    }, { passive: true });
}

function updateExtensionStatus(status) {
    const statusElement = document.getElementById('extensionStatus');
    if (statusElement) {
        statusElement.textContent = status;
        
        // Update status dot color
        const statusDot = document.querySelector('.status-dot');
        if (statusDot) {
            if (status.toLowerCase().includes('active') || status.toLowerCase().includes('enabled')) {
                statusDot.style.background = 'var(--success-color)';
            } else if (status.toLowerCase().includes('error') || status.toLowerCase().includes('disabled')) {
                statusDot.style.background = 'var(--error-color)';
            } else {
                statusDot.style.background = 'var(--warning-color)';
            }
        }
    }
}

function loadDebugInfo() {
    // Load current tab info
    browser.tabs.query({active: true, currentWindow: true})
        .then(tabs => {
            if (tabs[0]) {
                const url = tabs[0].url;
                const urlElement = document.getElementById('debugUrl');
                if (urlElement) {
                    urlElement.textContent = url;
                }
                
                // Check if extension has access to this tab
                checkExtensionAccess(tabs[0]);
            }
        })
        .catch(err => {
            console.error('Error loading debug info:', err);
            updateExtensionStatus('Error');
        });
}

function checkExtensionAccess(tab) {
    // Check if we can access the tab content
    browser.tabs.sendMessage(tab.id, {action: 'ping'})
        .then(response => {
            updateExtensionStatus('Active');
            const extensionElement = document.getElementById('debugExtension');
            if (extensionElement) {
                extensionElement.textContent = 'Connected';
                extensionElement.style.color = 'var(--success-color)';
            }
        })
        .catch(err => {
            updateExtensionStatus('Limited Access');
            const extensionElement = document.getElementById('debugExtension');
            if (extensionElement) {
                extensionElement.textContent = 'Restricted';
                extensionElement.style.color = 'var(--warning-color)';
            }
        });
}
