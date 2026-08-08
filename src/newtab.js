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
            getCurrent: promisify(c.tabs.getCurrent, c.tabs),
            update: promisify(c.tabs.update, c.tabs),
            create: promisify(c.tabs.create, c.tabs),
            remove: promisify(c.tabs.remove, c.tabs)
        } : undefined
    };
})();

(async () => {
    const TARGET_URL = "https://thinkpage.vercel.app";

    function revertDefault() {
        try {
            window.location.replace("about:home");
        } catch (e1) {
            try {
                window.location.replace("about:newtab");
            } catch (e2) {
                window.location.replace("about:blank");
            }
        }
    }

    try {
        // Check if extension is enabled before overriding new tab
        if (browserAPI.storage && browserAPI.storage.local) {
            const data = await browserAPI.storage.local.get("enabled");
            if (data && data.enabled === false) {
                // Extension disabled: revert to Firefox default home page
                revertDefault();
                return;
            }
        }

        // Extension enabled: open target URL in a fresh tab and remove this override tab to shift focus away from address bar to web page
        if (browserAPI.tabs && browserAPI.tabs.create && browserAPI.tabs.getCurrent && browserAPI.tabs.remove) {
            try {
                const currentTab = await browserAPI.tabs.getCurrent();
                await browserAPI.tabs.create({ url: TARGET_URL, active: true });
                if (currentTab && currentTab.id) {
                    await browserAPI.tabs.remove(currentTab.id).catch(() => {});
                }
                return;
            } catch (err) {}
        }

        window.location.replace(TARGET_URL);
    } catch (e) {
        console.error("[ThinkPage Bridge] Error overriding new tab focus:", e);
        try {
            if (browserAPI.storage && browserAPI.storage.local) {
                const data = await browserAPI.storage.local.get("enabled").catch(() => ({}));
                if (data && data.enabled === false) {
                    revertDefault();
                    return;
                }
            }
        } catch (e2) {}
        window.location.replace(TARGET_URL);
    }
})();
