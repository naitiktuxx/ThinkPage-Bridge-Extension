# ThinkPage Bridge — Firefox Extension

> A minimal Firefox extension that bridges **[ThinkPage](https://github.com/naitiktuxx/ThinkPage)** (a custom new-tab dashboard) with your browser's native history API and window focus controls.

[![Mozilla Add-ons](https://img.shields.io/badge/Firefox-Extension-orange?logo=firefox)](https://addons.mozilla.org)
[![Manifest v2](https://img.shields.io/badge/Manifest-v2-blue)](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json)
[![License: MIT](https://img.shields.io/badge/License-MIT-green)](./LICENSE)

---

## What it does

ThinkPage is a self-hosted / Vercel-hosted new-tab PWA. Because it runs in a web page context, it has **no direct access** to `browser.history.*` APIs. This extension acts as a secure bridge:

| Capability | How |
|---|---|
| **Read history** | Passes up to 5 000 recent history items into the page on load |
| **Live sync** | Pushes new visits, title changes, and removals in real-time |
| **Delete URL / all history** | Proxies deletion requests from the page to the browser |
| **Add URL** | Lets the page write entries back to browser history |
| **Window / tab focus** | Ensures ThinkPage's search bar gets focus when a new tab opens |
| **New-tab override** | Replaces Firefox's default new tab with the ThinkPage URL |

---

## Files

```
ThinkPage-Bridge-Extension/
├── manifest.json   — Extension manifest (Manifest v2, Firefox / Gecko)
├── background.js   — Message handler + live history listeners
├── content.js      — Injected into the ThinkPage origin; relays window↔extension messages
├── newtab.html     — Minimal new-tab redirect page
└── newtab.js       — Redirects the new-tab to the ThinkPage URL
```

---

## Installation (temporary / development)

1. Open Firefox and go to `about:debugging#/runtime/this-firefox`
2. Click **Load Temporary Add-on…**
3. Select the `manifest.json` file from this repo
4. Open a new tab — it will redirect to ThinkPage

To make it persistent, sign and install via **[about:addons](about:addons)** or submit to [addons.mozilla.org](https://addons.mozilla.org).

---

## Supported origins

The extension currently injects into and communicates with:

- `https://thinkpage.vercel.app/*`
- `http://localhost/*`
- `http://127.0.0.1/*`
- `file://*/*` (local file testing)

To point it at a different host, update the `matches` and `permissions` arrays in `manifest.json`.

---

## Message protocol

### Page → Extension (via `window.postMessage`)

| `event.data.type` | Payload | Effect |
|---|---|---|
| `THINKPAGE_READY_FOR_HISTORY` | — | Triggers full history fetch + focus |
| `THINKPAGE_DELETE_URL` | `{ url }` | Deletes one URL from browser history |
| `THINKPAGE_DELETE_ALL_HISTORY` | — | Clears all browser history |
| `THINKPAGE_ADD_URL` | `{ url, title }` | Adds a URL to browser history |

### Extension → Page (via `window.postMessage`)

| `event.data.type` | Payload | Meaning |
|---|---|---|
| `THINKPAGE_BRIDGE_HISTORY` | `{ history[] }` | Initial history dump |
| `THINKPAGE_BRIDGE_HISTORY_ADDED` | `{ item }` | New visit detected |
| `THINKPAGE_BRIDGE_HISTORY_REMOVED` | `{ allHistory, urls[] }` | Visit(s) removed |
| `THINKPAGE_BRIDGE_HISTORY_TITLE_CHANGED` | `{ url, title }` | Page title updated |
| `THINKPAGE_DELETE_URL_FAILED` | `{ url }` | Deletion failed |

---

## Building a distributable `.zip`

```bash
# Using web-ext (recommended)
npx web-ext build --source-dir . --artifacts-dir ./dist

# Or manually
zip -r ThinkPage-Bridge.zip manifest.json background.js content.js newtab.html newtab.js
```

---

## Related

- **[ThinkPage](https://github.com/naitiktuxx/ThinkPage)** — The main dashboard this extension powers

---

## License

MIT © [naitiktuxx](https://github.com/naitiktuxx)
