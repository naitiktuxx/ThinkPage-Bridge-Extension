let historyAlreadySent = false;
let focusAlreadySent = false;

function sendHistoryToPage() {
    if (historyAlreadySent) return;
    historyAlreadySent = true;
    browser.runtime.sendMessage({ action: "get_history" }).then((history) => {
        window.postMessage({
            type: "THINKPAGE_BRIDGE_HISTORY",
            history: history || []
        }, "*");
    }).catch((err) => {
        console.error("[ThinkPage Bridge] Error getting history from background:", err);
    });
}

function focusWebpage() {
    if (focusAlreadySent) return;
    focusAlreadySent = true;
    browser.runtime.sendMessage({ action: "focus_tab" }).catch(() => {});
    try {
        window.focus();
    } catch (e) {}
    // Explicitly target the search input on the webpage after a tiny delay to ensure DOM is ready
    setTimeout(() => {
        try {
            const inp = document.getElementById('search-input');
            if (inp) {
                inp.focus({ preventScroll: true });
            }
        } catch (e) {}
    }, 100);
}

// Listen for requests from the webpage
window.addEventListener("message", (event) => {
    if (event.source !== window || !event.data) return;

    if (event.data.type === "THINKPAGE_READY_FOR_HISTORY") {
        historyAlreadySent = false; // Allow re-fetch on explicit request
        sendHistoryToPage();
        focusWebpage();
    }

    if (event.data.type === "THINKPAGE_DELETE_URL" && event.data.url) {
        browser.runtime.sendMessage({ action: "delete_url", url: event.data.url })
            .then((resp) => {
                if (!resp || !resp.ok) {
                    window.postMessage({ type: "THINKPAGE_DELETE_URL_FAILED", url: event.data.url }, "*");
                }
            })
            .catch(() => {
                window.postMessage({ type: "THINKPAGE_DELETE_URL_FAILED", url: event.data.url }, "*");
            });
    }

    if (event.data.type === "THINKPAGE_DELETE_ALL_HISTORY") {
        browser.runtime.sendMessage({ action: "delete_all_history" }).catch(() => {});
    }

    if (event.data.type === "THINKPAGE_ADD_URL" && event.data.url) {
        browser.runtime.sendMessage({
            action: "add_url",
            url: event.data.url,
            title: event.data.title || ""
        }).catch(() => {});
    }
});

// Listen for live notifications from background
browser.runtime.onMessage.addListener((message) => {
    if (message.action === "history_removed") {
        window.postMessage({
            type: "THINKPAGE_BRIDGE_HISTORY_REMOVED",
            allHistory: message.allHistory,
            urls: message.urls || []
        }, "*");
    } else if (message.action === "history_added" && message.item) {
        window.postMessage({
            type: "THINKPAGE_BRIDGE_HISTORY_ADDED",
            item: message.item
        }, "*");
    } else if (message.action === "history_title_changed") {
        window.postMessage({
            type: "THINKPAGE_BRIDGE_HISTORY_TITLE_CHANGED",
            url: message.url,
            title: message.title
        }, "*");
    }
});

// Send history and focus on DOMContentLoaded as a fallback
document.addEventListener("DOMContentLoaded", () => {
    sendHistoryToPage();
    focusWebpage();
});
