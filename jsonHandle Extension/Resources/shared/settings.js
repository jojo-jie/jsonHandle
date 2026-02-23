(function (global) {
    'use strict';

    const DEFAULTS = {
        theme: 'auto',
        collapseThreshold: 50,
        maxJsonSizeMB: 10,
        showStats: true
    };

    const THEME_OPTIONS = new Set(['auto', 'light', 'dark']);

    function clampNumber(value, min, max, fallback) {
        const num = Number(value);
        if (!Number.isFinite(num)) return fallback;
        return Math.min(Math.max(num, min), max);
    }

    function normalizeTheme(theme) {
        const candidate = String(theme || '').toLowerCase();
        return THEME_OPTIONS.has(candidate) ? candidate : DEFAULTS.theme;
    }

    function normalize(raw = {}) {
        return {
            theme: normalizeTheme(raw.theme),
            collapseThreshold: clampNumber(raw.collapseThreshold, 0, 10000, DEFAULTS.collapseThreshold),
            maxJsonSizeMB: clampNumber(raw.maxJsonSizeMB, 1, 100, DEFAULTS.maxJsonSizeMB),
            showStats: raw.showStats !== false
        };
    }

    function merge(raw = {}) {
        return normalize({ ...DEFAULTS, ...raw });
    }

    function toRuntimeConfig(settings) {
        const normalized = normalize(settings);
        return {
            collapseThreshold: normalized.collapseThreshold,
            maxJsonSize: normalized.maxJsonSizeMB * 1024 * 1024,
            showStats: normalized.showStats,
            theme: normalized.theme
        };
    }

    global.JsonHandleSettings = {
        DEFAULTS,
        normalize,
        merge,
        toRuntimeConfig
    };
})(typeof globalThis !== 'undefined' ? globalThis : window);
