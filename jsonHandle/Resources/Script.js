const MESSAGE_ACTIONS = {
    OPEN_PREFERENCES: 'open-preferences',
    CHECK_STATUS: 'check-status',
    RELOAD_EXTENSION: 'reload-extension'
};

const ui = {
    stateOn: document.querySelector('.state-on'),
    stateOff: document.querySelector('.state-off'),
    stateUnknown: document.querySelector('.state-unknown'),
    openPreferences: document.querySelector('button.open-preferences'),
    refreshStatus: document.querySelector('button.refresh-status'),
    reloadExtension: document.querySelector('button.reload-extension')
};

function postToHost(action) {
    if (!webkit?.messageHandlers?.controller) return;
    webkit.messageHandlers.controller.postMessage(action);
}

function setupActions() {
    ui.openPreferences?.addEventListener('click', () => {
        postToHost(MESSAGE_ACTIONS.OPEN_PREFERENCES);
    });

    ui.refreshStatus?.addEventListener('click', () => {
        postToHost(MESSAGE_ACTIONS.CHECK_STATUS);
    });

    ui.reloadExtension?.addEventListener('click', () => {
        postToHost(MESSAGE_ACTIONS.RELOAD_EXTENSION);
    });
}

function updateVenturaCopy() {
    if (ui.stateOn) {
        ui.stateOn.innerText = 'jsonHandle 已启用，可在 Safari 设置的扩展中关闭。';
    }
    if (ui.stateOff) {
        ui.stateOff.innerText = 'jsonHandle 未启用，请在 Safari 设置的扩展中开启。';
    }
    if (ui.stateUnknown) {
        ui.stateUnknown.innerText = '你可以在 Safari 设置的扩展中开启 jsonHandle。';
    }
    if (ui.openPreferences) {
        ui.openPreferences.innerText = '退出并打开 Safari 设置…';
    }
}

function show(enabled, useSettingsInsteadOfPreferences) {
    if (useSettingsInsteadOfPreferences) {
        updateVenturaCopy();
    }

    if (typeof enabled === 'boolean') {
        document.body.classList.toggle('state-on', enabled);
        document.body.classList.toggle('state-off', !enabled);
        return;
    }

    document.body.classList.remove('state-on');
    document.body.classList.remove('state-off');
}

setupActions();
window.show = show;
