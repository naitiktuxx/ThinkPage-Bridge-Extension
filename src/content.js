// ── CROSS-BROWSER API POLYFILL ─────────────────────────────────────
const browserAPI = (function () {
    if (typeof globalThis.browser !== "undefined") {
        return globalThis.browser;
    }
    const c = globalThis.chrome;
    if (!c) return {};

    const promisify = (fn, ctx) => (...args) => {
        return new Promise((resolve, reject) => {
            fn.call(ctx, ...args, (result) => {
                if (c.runtime && c.runtime.lastError) {
                    reject(new Error(c.runtime.lastError.message));
                } else {
                    resolve(result);
                }
            });
        });
    };

    return {
        runtime: {
            onMessage: c.runtime ? c.runtime.onMessage : undefined,
            sendMessage: c.runtime ? promisify(c.runtime.sendMessage, c.runtime) : undefined
        }
    };
})();

let historyAlreadySent = false;
let focusAlreadySent = false;

function sendHistoryToPage() {
    if (historyAlreadySent) return;
    if (!browserAPI.runtime || !browserAPI.runtime.sendMessage) return;

    browserAPI.runtime.sendMessage({ action: "get_history" }).then((history) => {
        const targetOrigin = window.location.origin !== "null" ? window.location.origin : "*";
        if (history && history.disabled) {
            window.postMessage({
                type: "THINKPAGE_BRIDGE_STATUS_CHANGED",
                enabled: false
            }, targetOrigin);
            return;
        }
        if (!history || !Array.isArray(history)) return;
        historyAlreadySent = true;
        window.postMessage({
            type: "THINKPAGE_BRIDGE_HISTORY",
            history: history
        }, targetOrigin);
    }).catch((err) => {
        console.error("[ThinkPage Bridge] Error getting history from background:", err);
    });
}


function focusWebpage(force = false) {
    if (focusAlreadySent && !force) return;
    focusAlreadySent = true;
    if (browserAPI.runtime && browserAPI.runtime.sendMessage) {
        browserAPI.runtime.sendMessage({ action: "focus_tab" }).catch(() => {});
    }
    try {
        window.focus();
    } catch (e) {}

    const targetOrigin = window.location.origin !== "null" ? window.location.origin : "*";
    window.postMessage({ type: "THINKPAGE_BRIDGE_FOCUS_SEARCH" }, targetOrigin);

    // Explicitly target search input on the webpage with retries for SPA rendering
    const tryFocusInput = (retriesLeft) => {
        try {
            const inp = document.getElementById('search-input') || 
                        document.querySelector('input[type="search"]') ||
                        document.querySelector('input[type="text"]') ||
                        document.querySelector('textarea') ||
                        document.querySelector('input:not([type="hidden"])');
            if (inp) {
                inp.focus({ preventScroll: true });
                if (typeof inp.select === "function") {
                    try { inp.select(); } catch (e) {}
                }
            }
        } catch (e) {}
        if (retriesLeft > 0) {
            setTimeout(() => tryFocusInput(retriesLeft - 1), 100);
        }
    };

    tryFocusInput(30);
}

// Listen for requests from the webpage
window.addEventListener("message", (event) => {
    if (event.source !== window || !event.data) return;

    if (event.data.type === "THINKPAGE_READY_FOR_HISTORY") {
        historyAlreadySent = false; // Allow re-fetch on explicit request
        sendHistoryToPage();
        focusWebpage(true);
    }

    if (event.data.type === "THINKPAGE_DELETE_URL" && event.data.url) {
        if (!browserAPI.runtime || !browserAPI.runtime.sendMessage) return;
        browserAPI.runtime.sendMessage({ action: "delete_url", url: event.data.url })
            .then((resp) => {
                if (!resp || !resp.ok) {
                    const targetOrigin = window.location.origin !== "null" ? window.location.origin : "*";
                    window.postMessage({ type: "THINKPAGE_DELETE_URL_FAILED", url: event.data.url }, targetOrigin);
                }
            })
            .catch(() => {
                const targetOrigin = window.location.origin !== "null" ? window.location.origin : "*";
                window.postMessage({ type: "THINKPAGE_DELETE_URL_FAILED", url: event.data.url }, targetOrigin);
            });
    }

    if (event.data.type === "THINKPAGE_DELETE_ALL_HISTORY") {
        if (browserAPI.runtime && browserAPI.runtime.sendMessage) {
            browserAPI.runtime.sendMessage({ action: "delete_all_history" }).catch(() => {});
        }
    }

    if (event.data.type === "THINKPAGE_ADD_URL" && event.data.url) {
        if (browserAPI.runtime && browserAPI.runtime.sendMessage) {
            browserAPI.runtime.sendMessage({
                action: "add_url",
                url: event.data.url,
                title: event.data.title || ""
            }).catch(() => {});
        }
    }
});

// Listen for live notifications from background
if (browserAPI.runtime && browserAPI.runtime.onMessage) {
    browserAPI.runtime.onMessage.addListener((message) => {
        if (!message) return;
        const targetOrigin = window.location.origin !== "null" ? window.location.origin : "*";
        if (message.action === "focus_input") {
            focusWebpage(true);
        } else if (message.action === "extension_status_changed") {
            window.postMessage({
                type: "THINKPAGE_BRIDGE_STATUS_CHANGED",
                enabled: Boolean(message.enabled)
            }, targetOrigin);

            if (message.enabled) {
                historyAlreadySent = false;
                sendHistoryToPage();
                focusWebpage(true);
            }
        } else if (message.action === "history_removed") {
            window.postMessage({
                type: "THINKPAGE_BRIDGE_HISTORY_REMOVED",
                allHistory: Boolean(message.allHistory),
                urls: message.urls || []
            }, targetOrigin);
        } else if (message.action === "history_added" && message.item) {
            window.postMessage({
                type: "THINKPAGE_BRIDGE_HISTORY_ADDED",
                item: message.item
            }, targetOrigin);
        } else if (message.action === "history_title_changed") {
            window.postMessage({
                type: "THINKPAGE_BRIDGE_HISTORY_TITLE_CHANGED",
                url: message.url,
                title: message.title
            }, targetOrigin);
        }
    });
}

// Send history and focus on DOMContentLoaded as a fallback
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
        sendHistoryToPage();
        focusWebpage();
    });
} else {
    sendHistoryToPage();
    focusWebpage();
}

