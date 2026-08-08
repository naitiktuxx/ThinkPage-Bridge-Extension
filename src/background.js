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
        },
        storage: c.storage ? {
            local: {
                get: promisify(c.storage.local.get, c.storage.local),
                set: promisify(c.storage.local.set, c.storage.local)
            },
            onChanged: c.storage.onChanged
        } : undefined,
        history: c.history ? {
            search: promisify(c.history.search, c.history),
            deleteUrl: promisify(c.history.deleteUrl, c.history),
            deleteAll: promisify(c.history.deleteAll, c.history),
            addUrl: promisify(c.history.addUrl, c.history),
            onVisitRemoved: c.history.onVisitRemoved,
            onVisited: c.history.onVisited,
            onTitleChanged: c.history.onTitleChanged
        } : undefined,
        tabs: c.tabs ? {
            query: promisify(c.tabs.query, c.tabs),
            sendMessage: promisify(c.tabs.sendMessage, c.tabs),
            update: promisify(c.tabs.update, c.tabs),
            reload: promisify(c.tabs.reload, c.tabs),
            getCurrent: promisify(c.tabs.getCurrent, c.tabs),
            create: promisify(c.tabs.create, c.tabs),
            remove: promisify(c.tabs.remove, c.tabs),
            TAB_ID_NONE: c.tabs.TAB_ID_NONE || -1
        } : undefined,
        windows: c.windows ? {
            update: promisify(c.windows.update, c.windows)
        } : undefined
    };
})();

// ── EXTENSION STATE ────────────────────────────────────────────────
let isExtensionEnabled = true;
let isStateLoaded = false;
let stateLoadPromise = null;

function ensureStateLoaded() {
    if (isStateLoaded) return Promise.resolve(isExtensionEnabled);
    if (!stateLoadPromise) {
        stateLoadPromise = (async () => {
            if (browserAPI.storage && browserAPI.storage.local) {
                try {
                    const data = await browserAPI.storage.local.get("enabled");
                    if (data && typeof data.enabled === "boolean") {
                        isExtensionEnabled = data.enabled;
                    }
                } catch (e) {}
            }
            isStateLoaded = true;
            return isExtensionEnabled;
        })();
    }
    return stateLoadPromise;
}

// Start loading persistent state immediately on startup
ensureStateLoaded();

const TP_MATCHES = [
    "https://thinkpage.vercel.app/*",
    "file:///*",
    "http://localhost/*",
    "http://127.0.0.1/*"
];

// ── DYNAMIC NEW TAB REDIRECT ────────────────────────────────────────
const TP_REDIRECT_TARGET = "https://thinkpage.vercel.app";
const redirectedTabs = new Set();

if (browserAPI.tabs) {
    const rawTabs = (globalThis.chrome && globalThis.chrome.tabs) || (globalThis.browser && globalThis.browser.tabs);
    if (rawTabs) {
        const isNewTabUrl = (urlStr) => {
            if (!urlStr) return false;
            const u = urlStr.trim().toLowerCase();
            return u === "about:newtab" || u === "about:home";
        };

        const handleNewTab = async (tabId, url, tabIndex) => {
            if (!isStateLoaded) {
                await ensureStateLoaded();
            }
            if (!isExtensionEnabled || !tabId || redirectedTabs.has(tabId)) return;
            if (isNewTabUrl(url)) {
                redirectedTabs.add(tabId);
                browserAPI.tabs.create({ url: TP_REDIRECT_TARGET, active: true, index: typeof tabIndex === "number" ? tabIndex : undefined })
                    .then((createdTab) => {
                        if (createdTab && createdTab.id) {
                            redirectedTabs.add(createdTab.id);
                        }
                        if (tabId) {
                            browserAPI.tabs.remove(tabId).catch(() => {});
                        }
                    })
                    .catch(() => {
                        browserAPI.tabs.update(tabId, { url: TP_REDIRECT_TARGET, active: true }).catch(() => {
                            redirectedTabs.delete(tabId);
                        });
                    });
            }
        };

        if (rawTabs.onCreated) {
            rawTabs.onCreated.addListener((tab) => {
                const url = tab.pendingUrl || tab.url || "";
                handleNewTab(tab.id, url, tab.index);
            });
        }
        if (rawTabs.onUpdated) {
            rawTabs.onUpdated.addListener((tabId, changeInfo, tab) => {
                if (changeInfo.url) {
                    handleNewTab(tabId, changeInfo.url, tab.index);
                }
                if (changeInfo.status === "complete" && tab.url && (tab.url.startsWith("https://thinkpage.vercel.app") || tab.url.startsWith("http://localhost") || tab.url.startsWith("http://127.0.0.1"))) {
                    browserAPI.tabs.sendMessage(tabId, { action: "focus_input" }).catch(() => {});
                }
            });
        }
        if (rawTabs.onRemoved) {
            rawTabs.onRemoved.addListener((tabId) => {
                redirectedTabs.delete(tabId);
            });
        }
    }
}

function notifyStatusChange(enabled) {
    if (!browserAPI.tabs || !browserAPI.tabs.query) return;

    // 1. Notify ThinkPage tabs about status change
    browserAPI.tabs.query({ url: TP_MATCHES }).then((tabs) => {
        if (!tabs) return;
        for (const tab of tabs) {
            if (tab && tab.id && tab.id !== (browserAPI.tabs.TAB_ID_NONE || -1)) {
                browserAPI.tabs.sendMessage(tab.id, {
                    action: "extension_status_changed",
                    enabled: enabled
                }).catch(() => {});
            }
        }
    }).catch(() => {});

    // 2. If extension was disabled, reload open newtab.html tabs so they trigger revertDefault()
    if (!enabled) {
        const newtabUrl = browserAPI.runtime && browserAPI.runtime.getURL ? browserAPI.runtime.getURL("newtab.html") : null;
        browserAPI.tabs.query({}).then((tabs) => {
            if (!tabs) return;
            for (const tab of tabs) {
                if (tab && tab.id && tab.url && (tab.url.includes("newtab.html") || (newtabUrl && tab.url === newtabUrl))) {
                    if (browserAPI.tabs.reload) {
                        browserAPI.tabs.reload(tab.id).catch(() => {});
                    } else {
                        browserAPI.tabs.update(tab.id, { url: tab.url }).catch(() => {});
                    }
                }
            }
        }).catch(() => {});
    }
}

// Listen for storage changes to keep state in sync
if (browserAPI.storage && browserAPI.storage.onChanged) {
    const storageOnChanged = browserAPI.storage.onChanged.addListener || browserAPI.storage.onChanged;
    if (typeof storageOnChanged === "function") {
        try {
            browserAPI.storage.onChanged.addListener((changes, areaName) => {
                if (areaName === "local" && changes.enabled && typeof changes.enabled.newValue === "boolean") {
                    isExtensionEnabled = changes.enabled.newValue;
                    isStateLoaded = true;
                    notifyStatusChange(isExtensionEnabled);
                }
            });
        } catch (e) {}
    }
}

// ── MESSAGE HANDLERS ────────────────────────────────────────────────
if (browserAPI.runtime && browserAPI.runtime.onMessage) {
    browserAPI.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (!message) return false;

        // 1. Get status for GUI popup
        if (message.action === "get_status") {
            ensureStateLoaded().then(() => {
                if (!browserAPI.tabs || !browserAPI.tabs.query) {
                    sendResponse({ enabled: isExtensionEnabled, connected: false, connectedCount: 0 });
                    return;
                }
                browserAPI.tabs.query({ url: TP_MATCHES }).then((tabs) => {
                    const count = tabs ? tabs.length : 0;
                    sendResponse({
                        enabled: isExtensionEnabled,
                        connected: isExtensionEnabled && count > 0,
                        connectedCount: count,
                        activeTabUrl: count > 0 ? tabs[0].url : null
                    });
                }).catch(() => {
                    sendResponse({ enabled: isExtensionEnabled, connected: false, connectedCount: 0 });
                });
            });
            return true;
        }

        // 2. Set enabled state from GUI popup toggle
        if (message.action === "set_enabled") {
            isExtensionEnabled = Boolean(message.enabled);
            if (browserAPI.storage && browserAPI.storage.local) {
                browserAPI.storage.local.set({ enabled: isExtensionEnabled }).catch(() => {});
            }
            notifyStatusChange(isExtensionEnabled);
            sendResponse({ ok: true, enabled: isExtensionEnabled });
            return true;
        }

        // Check if extension is disabled before handling bridge operations
        if (!isExtensionEnabled) {
            sendResponse({ disabled: true });
            return true;
        }

        if (message.action === "get_history") {
            browserAPI.history.search({ text: "", startTime: 0, maxResults: 5000 })
                .then((historyItems) => {
                    sendResponse(historyItems || []);
                })
                .catch((err) => {
                    console.error("[ThinkPage Bridge] Error searching history:", err);
                    sendResponse([]);
                });
            return true; // Keep message channel open for async response
        }

        if (message.action === "delete_url" && message.url) {
            browserAPI.history.deleteUrl({ url: message.url })
                .then(() => {
                    sendResponse({ ok: true });
                })
                .catch((err) => {
                    console.error("[ThinkPage Bridge] Error deleting URL:", err);
                    sendResponse({ ok: false });
                });
            return true; // Keep message channel open for async response
        }

        if (message.action === "delete_all_history") {
            browserAPI.history.deleteAll()
                .then(() => {
                    sendResponse({ ok: true });
                })
                .catch((err) => {
                    console.error("[ThinkPage Bridge] Error clearing all history:", err);
                    sendResponse({ ok: false });
                });
            return true;
        }

        if (message.action === "add_url" && message.url) {
            const details = { url: message.url };
            if (typeof message.title === "string" && message.title.trim().length > 0) {
                details.title = message.title.trim();
            }
            browserAPI.history.addUrl(details)
                .then(() => {
                    sendResponse({ ok: true });
                })
                .catch((err) => {
                    console.error("[ThinkPage Bridge] Error adding URL:", err);
                    sendResponse({ ok: false });
                });
            return true;
        }

        if (message.action === "focus_tab" && sender.tab) {
            browserAPI.windows.update(sender.tab.windowId, { focused: true })
                .then(() => {
                    return browserAPI.tabs.update(sender.tab.id, { active: true });
                })
                .then(() => {
                    sendResponse({ ok: true });
                })
                .catch((err) => {
                    console.error("[ThinkPage Bridge] Error focusing tab:", err);
                    sendResponse({ ok: false });
                });
            return true;
        }

        return false;
    });
}

// ── LIVE HISTORY SYNC ───────────────────────────────────────────────

function broadcastToThinkPageTabs(payload) {
    if (!isExtensionEnabled) return;
    if (!browserAPI.tabs || !browserAPI.tabs.query) return;
    browserAPI.tabs.query({ url: TP_MATCHES }).then((tabs) => {
        if (!tabs) return;
        for (const tab of tabs) {
            if (tab && tab.id && tab.id !== (browserAPI.tabs.TAB_ID_NONE || -1)) {
                browserAPI.tabs.sendMessage(tab.id, payload).catch(() => {});
            }
        }
    }).catch(() => {});
}

// 1. When history is removed externally, notify all ThinkPage tabs
if (browserAPI.history && browserAPI.history.onVisitRemoved) {
    browserAPI.history.onVisitRemoved.addListener((removed) => {
        broadcastToThinkPageTabs({
            action: "history_removed",
            allHistory: Boolean(removed && removed.allHistory),
            urls: (removed && removed.urls) || []
        });
    });
}

// 2. When a new page is visited externally, notify all ThinkPage tabs
if (browserAPI.history && browserAPI.history.onVisited) {
    browserAPI.history.onVisited.addListener((item) => {
        if (item) {
            broadcastToThinkPageTabs({
                action: "history_added",
                item: item
            });
        }
    });
}

// 3. When a page title is updated (e.g. after finish loading), notify all ThinkPage tabs
if (browserAPI.history && browserAPI.history.onTitleChanged) {
    browserAPI.history.onTitleChanged.addListener((changed) => {
        if (changed) {
            broadcastToThinkPageTabs({
                action: "history_title_changed",
                url: changed.url,
                title: changed.title
            });
        }
    });
}


