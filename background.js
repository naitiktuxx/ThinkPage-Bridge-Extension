// ── MESSAGE HANDLERS ────────────────────────────────────────────────
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "get_history") {
        browser.history.search({ text: "", startTime: 0, maxResults: 5000 })
            .then((historyItems) => {
                sendResponse(historyItems);
            })
            .catch((err) => {
                console.error("[ThinkPage Bridge] Error searching history:", err);
                sendResponse([]);
            });
        return true; // Keep the message channel open for sendResponse
    }

    if (message.action === "delete_url" && message.url) {
        browser.history.deleteUrl({ url: message.url })
            .then(() => {
                sendResponse({ ok: true });
            })
            .catch((err) => {
                console.error("[ThinkPage Bridge] Error deleting URL:", err);
                sendResponse({ ok: false });
            });
        return true; // Keep the message channel open for sendResponse
    }

    if (message.action === "delete_all_history") {
        browser.history.deleteAll().catch((err) => {
            console.error("[ThinkPage Bridge] Error clearing all history:", err);
        });
    }

    if (message.action === "add_url" && message.url) {
        browser.history.addUrl({
            url: message.url,
            title: message.title || undefined
        }).catch((err) => {
            console.error("[ThinkPage Bridge] Error adding URL:", err);
        });
    }

    if (message.action === "focus_tab" && sender.tab) {
        browser.windows.update(sender.tab.windowId, { focused: true }).then(() => {
            browser.tabs.update(sender.tab.id, { active: true });
        }).catch((err) => {
            console.error("[ThinkPage Bridge] Error focusing tab:", err);
        });
    }
});

// ── LIVE HISTORY SYNC ───────────────────────────────────────────────

const TP_MATCHES = [
    "https://thinkpage.vercel.app/*",
    "file://*/*",
    "http://localhost/*",
    "http://127.0.0.1/*"
];

// 1. When history is removed externally, notify all ThinkPage tabs
browser.history.onVisitRemoved.addListener((removed) => {
    browser.tabs.query({ url: TP_MATCHES }).then((tabs) => {
        for (const tab of tabs) {
            browser.tabs.sendMessage(tab.id, {
                action: "history_removed",
                allHistory: removed.allHistory,
                urls: removed.urls || []
            }).catch(() => {});
        }
    }).catch(() => {});
});

// 2. When a new page is visited externally, notify all ThinkPage tabs
browser.history.onVisited.addListener((item) => {
    browser.tabs.query({ url: TP_MATCHES }).then((tabs) => {
        for (const tab of tabs) {
            browser.tabs.sendMessage(tab.id, {
                action: "history_added",
                item: item
            }).catch(() => {});
        }
    }).catch(() => {});
});

// 3. When a page title is updated (e.g. after finish loading), notify all ThinkPage tabs
browser.history.onTitleChanged.addListener((changed) => {
    browser.tabs.query({ url: TP_MATCHES }).then((tabs) => {
        for (const tab of tabs) {
            browser.tabs.sendMessage(tab.id, {
                action: "history_title_changed",
                url: changed.url,
                title: changed.title
            }).catch(() => {});
        }
    }).catch(() => {});
});
