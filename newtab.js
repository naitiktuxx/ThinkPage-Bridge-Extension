(async () => {
    try {
        const tab = await browser.tabs.getCurrent();
        if (tab) {
            const props = {
                url: "https://thinkpage.vercel.app",
                index: tab.index,
                windowId: tab.windowId
            };
            if (tab.cookieStoreId) {
                props.cookieStoreId = tab.cookieStoreId;
            }
            if (tab.openerTabId) {
                props.openerTabId = tab.openerTabId;
            }
            // Create the replacement tab in the foreground
            await browser.tabs.create(props);
            // Delete the temporary newtab extension page entry from history
            void browser.history.deleteUrl({ url: window.location.href });
            // Close the original tab that was overridden
            await browser.tabs.remove(tab.id);
        } else {
            // Fallback if getCurrent() is not available
            window.location.replace("https://thinkpage.vercel.app");
        }
    } catch (e) {
        console.error("[ThinkPage Bridge] Error overriding new tab focus:", e);
        window.location.replace("https://thinkpage.vercel.app");
    }
})();
