# ThinkPage Bridge — Firefox Extension

<p align="center">
  <img src="src/icon128.png" alt="ThinkPage Bridge Icon" width="96" height="96">
</p>

<h3 align="center">ThinkPage Bridge</h3>

<p align="center">
  Seamlessly bridge your <b><a href="https://github.com/naitiktuxx/ThinkPage">ThinkPage</a></b> new-tab dashboard with Firefox history and auto-focus search.
</p>

<p align="center">
  <a href="https://github.com/naitiktuxx/ThinkPage-Bridge-Extension/releases"><img src="https://img.shields.io/github/v/release/naitiktuxx/ThinkPage-Bridge-Extension?label=Latest%20Release&color=blue" alt="GitHub Release"></a>
  <a href="https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json"><img src="https://img.shields.io/badge/Manifest-v2-orange?logo=firefox" alt="Manifest V2"></a>
  <a href="./LICENSE.md"><img src="https://img.shields.io/badge/License-MIT-green.svg" alt="License: MIT"></a>
</p>

---

## 📁 Repository Structure

```
ThinkPage-Bridge-Extension/
├── src/                    # Extension source code
│   ├── manifest.json       # Extension manifest (Manifest v2, Firefox / Gecko)
│   ├── background.js       # Background service worker & new tab focus router
│   ├── content.js          # Injected bridge script for ThinkPage origins
│   ├── newtab.html         # Minimal new-tab container page
│   ├── newtab.js           # Redirect & native home fallback handler
│   ├── popup.html          # Extension popup UI
│   ├── popup.js            # Extension popup logic & status toggle
│   ├── popup.css           # Modern dark-mode popup stylesheet
│   └── icon*.png           # Extension icons (16, 32, 48, 128, 512)
├── CHANGELOG.md            # Documented version history
├── LICENSE.md              # MIT License
└── README.md               # Main project documentation
```

---

## Overview

**ThinkPage Bridge** is a lightweight Firefox browser extension engineered specifically for **[ThinkPage](https://thinkpage.vercel.app)**. When enabled, it replaces your Firefox new tab with your ThinkPage dashboard, places instant keyboard focus into ThinkPage's search bar, and safely proxies browser history operations without exposing raw browser APIs to web scripts.

When paused from the popup menu, the extension **reverts instantly to Firefox's native built-in home page** (`about:home` / `about:newtab`) without altering your browser preferences.

---

## ✨ Features

- **🚀 Instant Search Bar Auto-Focus**: Opens new tabs with keyboard cursor pre-focused directly inside ThinkPage's search input (`Search Google or type a URL`).
- **⚡ In-Place Tab Navigation**: Redirects new tabs dynamically without duplicate tab creation, tab-bar shuffling, or browser flicker.
- **🔄 Real-Time History Syncing**: Automatically syncs page visits, title updates, and deletions between Firefox and ThinkPage in real-time.
- **🛡️ Secure History Proxying**: Proxies history operations via scoped `postMessage` window events rather than exposing privileged APIs.
- **🎛️ Instant Extension Toggle**: Toggle the extension on or off anytime via the clean extension popup menu.
- **🏠 Native Firefox Revert**: Disabling the toggle instantly reverts new tabs to Firefox's default native homepage (`about:home`).

---

## 📦 Direct Installation (GitHub Releases)

You can download and install the extension directly from the **[GitHub Releases](https://github.com/naitiktuxx/ThinkPage-Bridge-Extension/releases)** tab.

### Method 1: Install `.xpi` Add-on (Recommended)

1. Go to the **[Releases Page](https://github.com/naitiktuxx/ThinkPage-Bridge-Extension/releases)**.
2. Under **Assets**, download `thinkpage-bridge-v1.3.2.xpi` (or `thinkpage-bridge-v1.3.2.zip`).
3. Open Firefox and type `about:addons` in the address bar (or press `Cmd+Shift+A` / `Ctrl+Shift+A`).
4. Click the **Gear icon ⚙️** near the top right and select **Install Add-on From File…**.
5. Select the downloaded `.xpi` (or `.zip`) file.
6. Click **Add** when prompted by Firefox.

### Method 2: Temporary Add-on (Developer Mode)

1. Download or clone this repository:
   ```bash
   git clone https://github.com/naitiktuxx/ThinkPage-Bridge-Extension.git
   ```
2. Open Firefox and navigate to `about:debugging#/runtime/this-firefox`.
3. Click **Load Temporary Add-on…**.
4. Select `src/manifest.json` inside the cloned directory.

---

## 🎮 Extension Popup Interface

Click the ThinkPage icon in your Firefox toolbar to access the control panel:

- **Bridge Extension Switch**: Toggle connection between ThinkPage and Firefox ON or OFF.
- **Connection Status Indicator**: Displays live connection status (`Connected`, `Bridge paused`, or `Disabled`).
- **Active Tabs Counter**: Shows how many ThinkPage tabs are currently active.
- **Open ThinkPage ↗**: Quick shortcut button to launch ThinkPage in a new tab.

---

## 🛠 Protocol Specifications

ThinkPage communicates with the extension content script using bidirectional `window.postMessage` events.

### Webpage → Content Script Requests

| Event Type | Data Payload | Description |
|---|---|---|
| `THINKPAGE_READY_FOR_HISTORY` | — | Requests initial history dump and triggers search input focus |
| `THINKPAGE_DELETE_URL` | `{ url: string }` | Deletes a specific URL from browser history |
| `THINKPAGE_DELETE_ALL_HISTORY` | — | Clears browser history |
| `THINKPAGE_ADD_URL` | `{ url: string, title?: string }` | Adds a visit entry to browser history |

### Content Script → Webpage Responses & Notifications

| Event Type | Data Payload | Description |
|---|---|---|
| `THINKPAGE_BRIDGE_STATUS_CHANGED` | `{ enabled: boolean }` | Notifies webpage of extension toggle state changes |
| `THINKPAGE_BRIDGE_HISTORY` | `{ history: HistoryItem[] }` | Delivers initial history array to ThinkPage |
| `THINKPAGE_BRIDGE_HISTORY_ADDED` | `{ item: HistoryItem }` | Real-time notification when a new page is visited |
| `THINKPAGE_BRIDGE_HISTORY_REMOVED` | `{ allHistory: boolean, urls: string[] }` | Real-time notification when history items are deleted |
| `THINKPAGE_BRIDGE_HISTORY_TITLE_CHANGED` | `{ url: string, title: string }` | Real-time notification when a page title is updated |
| `THINKPAGE_BRIDGE_FOCUS_SEARCH` | — | Signal to trigger search input focus in the web page DOM |

---

## 🏗 Generating Release Packages

### Option 1: Automatically via GitHub Actions (Recommended)

Simply push a version tag to GitHub. GitHub Actions will automatically compile `src/`, generate `.zip` and `.xpi` Firefox release packages, and publish them to GitHub Releases under Assets:

```bash
git tag v1.3.2
git push origin v1.3.2
```

### Option 2: Manually on local machine

```bash
npm run build
```

Or using zip directly:

```bash
cd src && zip -r ../dist/thinkpage-bridge-v1.3.2.zip *
cd .. && cp dist/thinkpage-bridge-v1.3.2.zip dist/thinkpage-bridge-v1.3.2.xpi
```

---

## 🔗 Related Projects

- **[ThinkPage Web App](https://github.com/naitiktuxx/ThinkPage)** — The modern start page dashboard powered by this bridge extension.

---

## 📄 License

Distributed under the **MIT License**. See [`LICENSE.md`](./LICENSE.md) for details.
