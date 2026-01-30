# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**jsonHandle** is a Safari browser extension that automatically detects, formats, and displays JSON data with syntax highlighting, collapsible tree views, and search functionality.

## Build & Run

```bash
# Open in Xcode
open jsonHandle.xcodeproj

# Build from command line
xcodebuild -project jsonHandle.xcodeproj -scheme jsonHandle -configuration Debug build
```

## Architecture

```
jsonHandle/              # Host macOS app (Swift/Cocoa)
  ├── AppDelegate.swift
  ├── ViewController.swift
  └── Resources/         # UI assets (HTML/CSS)

jsonHandle Extension/    # Safari Web Extension
  ├── SafariWebExtensionHandler.swift
  └── Resources/
      ├── content.js     # Core: JSON detection, formatting, UI rendering
      ├── background.js  # HTTP request monitoring
      ├── popup.js/html/css
      └── manifest.json

jsonHandleTests/         # Unit tests (Swift Testing)
jsonHandleUITests/       # UI tests
```

**Core functionality** is in `content.js` (2000+ lines) - handles JSON parsing, tree rendering, search, and node interactions.

## Key Technologies

- Swift + SafariServices/WebKit for native app
- Safari Web Extensions API for browser integration
- Vanilla JavaScript, HTML5, CSS3 for extension UI
- No external dependencies

## Development Notes

- Extension permissions configured in `manifest.json` and `Info.plist`
- JavaScript code has extensive Chinese comments
- Test coverage is minimal (placeholders)
- macOS 11.0+, Safari 14.0+ required

## Debugging

- Enable Safari Develop menu > Show Extension Console
- Use `console.log` extensively in JavaScript
- Test with various JSON formats and edge cases
