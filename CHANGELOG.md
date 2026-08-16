# Changelog

All notable changes to the **ThinkPage Bridge** extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.6.1] - 2026-08-16

### Added
- Submitted extension for public listing on the **Mozilla Add-ons (AMO) Store** (`--channel=listed`) with `amo-metadata.json`.
- Automated public distribution and store listing on `addons.mozilla.org`.

## [1.6.0] - 2026-08-16

### Changed
- Enforced strict Mozilla Add-ons (AMO) signing pipeline for GitHub releases.
- Removed fallback to unsigned archives to guarantee that only cryptographically verified `.xpi` add-ons are published.
- Added automated post-build signature verification step inspecting `META-INF` and `cose.sig` archives.
- Streamlined release assets to strictly publish verified `.xpi` packages.

## [1.5.0] - 2026-08-13

### Changed
- Prepared public release version 1.5.0.

## [1.4.0] - 2026-08-09

### Fixed
- Added `amo-metadata.json` with MIT license specification to satisfy Mozilla API requirements for public listed add-on submissions.

## [1.3.9] - 2026-08-09

### Added
- Submitted extension for public listing on Mozilla Add-ons (AMO) store (`--channel=listed`).

## [1.3.8] - 2026-08-09

### Changed
- Synchronized package version metadata across `package.json`, `src/manifest.json`, and release build scripts.

## [1.3.7] - 2026-08-08

### Fixed
- Fixed background service worker startup race condition where initial browser startup tab opened ThinkPage even when extension was disabled in storage.

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
