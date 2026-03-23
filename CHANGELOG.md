# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-03-22

### Fixed

#### Cursor Trigger Reliability Issues
Resolved critical issues with GUI automation that caused the Cursor trigger to fail silently:

1. **Windows Focus Stealing Prevention**
   - Replaced blocked `Microsoft.VisualBasic.Interaction.AppActivate` with native Win32 API
   - Implemented `SetForegroundWindow` + `AttachThreadInput` + `keybd_event Alt` trick
   - Added `ShowWindow(SW_RESTORE)` to properly restore minimized windows
   - Added focus verification using `GetForegroundWindow()` with automatic retry
   - Maintained compatibility with older .NET Framework versions (`out pid` instead of `out _`)

2. **Terminal Capture Issue**
   - Fixed issue where `Ctrl+L` was captured by Cursor's integrated terminal instead of opening AI Chat
   - Added `ESC` key press before `Ctrl+L` to remove terminal focus
   - Implemented on all platforms (Windows, macOS, Linux)

3. **UI Response Timing**
   - Increased delays to allow Cursor UI to respond properly:
     - Windows: 400ms, 300ms, 2000ms, 600ms
     - macOS/Linux: 800ms, 2000ms, 600ms
   - Added 30-second timeout for all `execFile`/`exec` operations
   - Implemented retry mechanism with 2 attempts (2-second wait between retries)

### Changed

#### src/trigger.js Rewrite

**Windows (`triggerWindows`):**
- Native Win32 API implementation for window focusing
- Explicit error codes (`NO_WINDOW`, `NO_FOCUS`)
- ESC key before Ctrl+L to clear terminal focus
- Improved error handling and retry logic

**macOS (`triggerMacOS`):**
- Added key code 53 (ESC) before Cmd+L
- Extended delays for better reliability

**Linux (`triggerLinux`):**
- Added `xdotool key Escape` before Ctrl+L
- Extended delays for better reliability

**All Platforms:**
- Clearer fallback messages
- Consistent retry behavior across platforms

### Dependencies

#### Changed
- **Moved `@ngrok/ngrok` from `optionalDependencies` to `dependencies`**
  - ngrok is required for the tunnel functionality
  - Without it, Trello webhooks cannot reach the local server

#### Added
- **`@ngrok/ngrok-win32-x64-msvc`** to `optionalDependencies`
  - Platform-specific ngrok binary for Windows x64

---

## [1.0.0] - Initial Release

### Added
- Trello webhook integration
- Automatic Cursor AI agent triggering
- Local server with ngrok tunnel
- Cross-platform support (Windows, macOS, Linux)
- Label-based workflow automation
