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
            sendMessage: c.runtime ? promisify(c.runtime.sendMessage, c.runtime) : undefined
        },
        storage: c.storage ? {
            local: {
                get: promisify(c.storage.local.get, c.storage.local),
                set: promisify(c.storage.local.set, c.storage.local)
            }
        } : undefined,
        tabs: c.tabs ? {
            create: promisify(c.tabs.create, c.tabs),
            query: promisify(c.tabs.query, c.tabs),
            update: promisify(c.tabs.update, c.tabs)
        } : undefined,
        windows: c.windows ? {
            update: promisify(c.windows.update, c.windows)
        } : undefined
    };
})();

document.addEventListener("DOMContentLoaded", async () => {
    const toggleInput = document.getElementById("extension-toggle");
    const toggleSubtext = document.getElementById("toggle-subtext");
    const statusBadge = document.getElementById("status-badge");
    const statusText = document.getElementById("status-text");
    const activeTabsCount = document.getElementById("active-tabs-count");
    const targetHost = document.getElementById("target-host");
    const openBtn = document.getElementById("open-thinkpage-btn");

    // 1. Fetch persistent enabled state and update toggle
    let isEnabled = true;
    try {
        if (browserAPI.storage && browserAPI.storage.local) {
            const data = await browserAPI.storage.local.get("enabled");
            if (typeof data.enabled === "boolean") {
                isEnabled = data.enabled;
            }
        }
    } catch (e) {
        console.error("[ThinkPage Bridge] Error loading storage state:", e);
    }
    toggleInput.checked = isEnabled;

    // 2. Fetch live connection status from background script
    async function updateStatusUI() {
        if (!toggleInput.checked) {
            toggleSubtext.textContent = "Bridge paused";
            statusBadge.className = "status-badge disabled";
            statusText.textContent = "Disabled";
            activeTabsCount.textContent = "0 tabs";
            return;
        }

        toggleSubtext.textContent = "Active and syncing";

        try {
            if (browserAPI.runtime && browserAPI.runtime.sendMessage) {
                const res = await browserAPI.runtime.sendMessage({ action: "get_status" });
                if (res) {
                    if (res.connected) {
                        statusBadge.className = "status-badge connected";
                        statusText.textContent = "Connected";
                    } else {
                        statusBadge.className = "status-badge";
                        statusText.textContent = "Disconnected";
                    }
                    const count = res.connectedCount || 0;
                    activeTabsCount.textContent = count === 1 ? "1 tab" : `${count} tabs`;
                    if (res.activeTabUrl) {
                        try {
                            const u = new URL(res.activeTabUrl);
                            targetHost.textContent = u.host;
                        } catch (e) {}
                    }
                    return;
                }
            }
        } catch (e) {
            console.error("[ThinkPage Bridge] Error getting status from background:", e);
        }

        // Fallback if background does not return status
        statusBadge.className = "status-badge";
        statusText.textContent = "Disconnected";
        activeTabsCount.textContent = "0 tabs";
    }

    await updateStatusUI();

    // 3. Handle toggle switch changes
    toggleInput.addEventListener("change", async () => {
        const enabled = toggleInput.checked;
        try {
            if (browserAPI.storage && browserAPI.storage.local) {
                await browserAPI.storage.local.set({ enabled });
            }
            if (browserAPI.runtime && browserAPI.runtime.sendMessage) {
                await browserAPI.runtime.sendMessage({ action: "set_enabled", enabled }).catch(() => {});
            }
        } catch (e) {
            console.error("[ThinkPage Bridge] Error saving state:", e);
        }
        await updateStatusUI();
    });

    // 4. Handle "Open ThinkPage" button click
    openBtn.addEventListener("click", async () => {
        const defaultUrl = "https://thinkpage.vercel.app";
        try {
            if (browserAPI.tabs && browserAPI.tabs.query) {
                const tabs = await browserAPI.tabs.query({
                    url: [
                        "https://thinkpage.vercel.app/*",
                        "file:///*",
                        "http://localhost/*",
                        "http://127.0.0.1/*"
                    ]
                });
                if (tabs && tabs.length > 0) {
                    const tab = tabs[0];
                    if (browserAPI.windows && browserAPI.windows.update) {
                        await browserAPI.windows.update(tab.windowId, { focused: true });
                    }
                    await browserAPI.tabs.update(tab.id, { active: true });
                    window.close();
                    return;
                }
            }
            if (browserAPI.tabs && browserAPI.tabs.create) {
                await browserAPI.tabs.create({ url: defaultUrl });
            } else {
                window.open(defaultUrl, "_blank");
            }
        } catch (e) {
            window.open(defaultUrl, "_blank");
        }
        window.close();
    });
});
