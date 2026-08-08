# ThinkPage Bridge — Firefox Extension

<p align="center">
  <img src="src/icon128.png" alt="ThinkPage Bridge Icon" width="96" height="96">
</p>

<h3 align="center">ThinkPage Bridge</h3>

<p align="center">
  Seamlessly bridge your <b><a href="https://github.com/naitiktuxx/ThinkPage">ThinkPage</a></b> new-tab dashboard with Firefox history and search bar auto-focus.
</p>

<p align="center">
  <a href="https://github.com/naitiktuxx/ThinkPage-Bridge-Extension/releases"><img src="https://img.shields.io/github/v/release/naitiktuxx/ThinkPage-Bridge-Extension?label=Latest%20Release&color=blue" alt="GitHub Release"></a>
  <a href="https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json"><img src="https://img.shields.io/badge/Manifest-v2-orange?logo=firefox" alt="Manifest V2"></a>
  <a href="./LICENSE.md"><img src="https://img.shields.io/badge/License-MIT-green.svg" alt="License: MIT"></a>
</p>

---

## **Repository Structure**

```
ThinkPage-Bridge-Extension/
├── src/                    # Extension source code
│   ├── manifest.json       # WebExtension manifest (Manifest v2, Firefox / Gecko)
│   ├── background.js       # Background service worker & tab router
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

## **Overview**

**ThinkPage Bridge** is a lightweight Firefox browser extension engineered specifically for **[ThinkPage](https://thinkpage.vercel.app)**. When enabled, it connects your Firefox browser with your ThinkPage dashboard, places instant keyboard focus into ThinkPage's search input, and safely proxies browser history operations without exposing privileged browser APIs to web scripts.

When paused from the extension popup, it **reverts instantly to Firefox's native default home page** (`about:home` / `about:newtab`) without altering your browser preferences.

---

## **Key Features**

- **Instant Search Bar Auto-Focus**: Pre-focuses keyboard cursor directly inside ThinkPage's search input on new tab load.
- **In-Place Tab Navigation**: Redirects new tabs dynamically without duplicate tab creation, tab shuffling, or browser flickering.
- **Real-Time History Synchronization**: Automatically syncs page visits, title updates, and deletions between Firefox and ThinkPage in real-time.
- **Secure History Proxying**: Proxies history operations via scoped `postMessage` window events rather than exposing privileged APIs.
- **Instant Extension Toggle**: Toggle the extension on or off anytime via the clean extension popup menu.
- **Native Firefox Revert**: Disabling the toggle instantly reverts new tabs to Firefox's default native homepage (`about:home`).

---

## **Installation Guide (GitHub Releases)**

You can download and install the extension directly from the **[GitHub Releases](https://github.com/naitiktuxx/ThinkPage-Bridge-Extension/releases)** tab.

### **Method 1: Install `.xpi` Add-on (Recommended)**

1. Go to the **[Releases Page](https://github.com/naitiktuxx/ThinkPage-Bridge-Extension/releases)**.
2. Under **Assets**, download `thinkpage-bridge-v1.4.0.xpi`.
3. Open Firefox and navigate to `about:addons` (or press `Cmd+Shift+A` / `Ctrl+Shift+A`).
4. Click the **Gear icon ⚙️** near the top right and select **Install Add-on From File…**.
5. Select the downloaded `thinkpage-bridge-v1.4.0.xpi` file and click **Add**.

### **Method 2: Install via `.zip` Package**

1. Go to the **[Releases Page](https://github.com/naitiktuxx/ThinkPage-Bridge-Extension/releases)** and download `thinkpage-bridge-v1.4.0.zip`.
2. Extract the `.zip` archive to a folder on your computer.
3. Open Firefox and navigate to `about:debugging#/runtime/this-firefox`.
4. Click **Load Temporary Add-on…**.
5. Select `manifest.json` inside the extracted folder.

<details>
<summary><b>Method 3: Build Release Packages from Source (Developer Mode)</b></summary>

<br>

#### **Automatically via GitHub Actions (Public Mozilla Add-ons Store & GitHub Releases)**

Pushing any version tag (`v*`) to GitHub automatically syncs `src/manifest.json`, builds the extension, submits it for public listing on the **Mozilla Add-ons (AMO) Store** (`--channel=listed`), and generates `.zip` / `.xpi` release assets on GitHub Releases:

```bash
git tag v1.4.0
git push origin v1.4.0
```

#### **Manually on Local Machine**

```bash
npm run build
```

Or using zip directly:

```bash
cd src && zip -r ../dist/thinkpage-bridge-v1.4.0.zip *
cd .. && cp dist/thinkpage-bridge-v1.4.0.zip dist/thinkpage-bridge-v1.4.0.xpi
```

</details>

---

## **Related Projects**

- **[ThinkPage Web App](https://github.com/naitiktuxx/ThinkPage)** — The modern start page dashboard powered by this bridge extension.

---

## **License**

Distributed under the **MIT License**. See [`LICENSE.md`](./LICENSE.md) for details.
