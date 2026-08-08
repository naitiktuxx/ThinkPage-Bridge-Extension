# Changelog

All notable changes to the **ThinkPage Bridge** extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.3.6] - 2026-08-08

### Changed
- Refined extension description for browser `about:addons` page.
- Cleaned documentation typography in `README.md`.

## [1.3.4] - 2026-08-08

### Added
- Automated public Firefox Add-ons store publishing (`--channel=listed`).
- Integrated dynamic `manifest.json` version sync with release tags.
- Full release feature documentation for public store listing.

## [1.3.2] - 2026-08-08

### Added
- Native Firefox default home page restoration (`about:home` / `about:newtab`) when extension bridge is paused/disabled.
- Instant search bar auto-focus routine targeting `#search-input` / `input[type="search"]` / `input[type="text"]` / `textarea` on ThinkPage.
- Tab de-duplication Set (`redirectedTabs`) in background service worker to prevent race conditions and secondary tab spawns.

### Fixed
- Fixed URL bar focus trap when opening a new tab by programmatically shifting focus to webpage document via `tabs.create` and `tabs.remove`.
- Fixed accidental interception of `about:blank` and link clicks (`target="_blank"`).
- Removed legacy custom HTML template from `newtab.html`.

### Changed
- Reorganized codebase into standard repository structure with source code inside `src/`.

---

## [1.2.0] - 2026-08-01

### Added
- Extension popup UI with bridge toggle switch, status badge, and open ThinkPage shortcut.
- Synchronized `storage.local` persistent state.

---

## [1.0.0] - 2026-07-15

### Added
- Initial release of ThinkPage Bridge extension.
- Bidirectional `postMessage` protocol for reading, adding, and removing history entries.
- Real-time history visit sync listeners (`onVisited`, `onVisitRemoved`, `onTitleChanged`).
