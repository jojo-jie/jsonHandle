# jsonHandle - Safari Extension Project

## Project Overview

**jsonHandle** is a Safari browser extension designed to automatically detect, format, and display JSON data in a user-friendly way. It enhances the viewing experience of JSON responses from APIs and raw JSON files by providing syntax highlighting, collapsible/expandable nodes, search functionality, and a clean, modern interface.

## Architecture

### Main Components

1. **Host Application (`jsonHandle/`)**
   - Native macOS application (Swift/Cocoa)
   - Manages Safari extension state and preferences
   - Provides UI for enabling/disabling the extension
   - Simple wrapper around the Safari extension functionality

2. **Safari Extension (`jsonHandle Extension/`)**
   - Core functionality implemented in JavaScript
   - Content script for JSON detection and formatting
   - Background script for request monitoring
   - Popup interface for user interaction

3. **Testing Framework**
   - Unit tests (`jsonHandleTests/`)
   - UI tests (`jsonHandleUITests/`)

### Key Files and Their Purposes

#### Swift Files
- `/Users/walker/workspace/jsonHandle/jsonHandle/AppDelegate.swift` - Main application delegate
- `/Users/walker/workspace/jsonHandle/jsonHandle/ViewController.swift` - Extension management UI
- `/Users/walker/workspace/jsonHandle/jsonHandle Extension/SafariWebExtensionHandler.swift` - Extension message handler

#### JavaScript Files
- `/Users/walker/workspace/jsonHandle/jsonHandle Extension/Resources/content.js` - **Core functionality** (2171 lines)
  - JSON detection and parsing
  - UI rendering and styling
  - Search functionality
  - Node interaction and popup management
  - Path tracking and navigation
  
- `/Users/walker/workspace/jsonHandle/jsonHandle Extension/Resources/background.js` - Request monitoring
- `/Users/walker/workspace/jsonHandle/jsonHandle Extension/Resources/popup.js` - Extension popup UI

#### HTML/CSS Files
- `/Users/walker/workspace/jsonHandle/jsonHandle/Resources/Base.lproj/Main.html` - Host app UI
- `/Users/walker/workspace/jsonHandle/jsonHandle Extension/Resources/popup.html` - Extension popup
- `/Users/walker/workspace/jsonHandle/jsonHandle/Resources/Style.css` - Host app styles
- `/Users/walker/workspace/jsonHandle/jsonHandle Extension/Resources/popup.css` - Extension popup styles

## Technology Stack

- **Primary Language**: Swift (host application)
- **Extension Technologies**: Safari Web Extensions API
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Testing**: Swift Testing framework
- **Build System**: Xcode project
- **Platform**: macOS 11.0+ with Safari 14.0+

## Key Features

### Core Functionality
1. **Automatic JSON Detection**
   - Monitors HTTP response headers (Content-Type)
   - Analyzes URL patterns (.json, /api/, etc.)
   - Examines page content structure

2. **JSON Formatting**
   - Syntax highlighting for different data types
   - Collapsible/expandable tree structure
   - Path tracking and navigation
   - Copy-to-clipboard functionality

3. **User Interface**
   - Modern, responsive design
   - Dark mode support
   - Search with highlighting
   - Interactive node information popups

4. **Advanced Features**
   - Keyboard shortcuts (⌘K for search)
   - Real-time search with navigation
   - Path copying
   - Formatted vs raw JSON view toggle

## Development Workflow

### Building the Project
1. Open `jsonHandle.xcodeproj` in Xcode 13.0+
2. Select target device/simulator
3. Build and run (⌘R)

### Testing
- Unit tests located in `jsonHandleTests/`
- UI tests in `jsonHandleUITests/`
- Tests are minimal (currently just placeholder)

### Extension Installation
1. Build the project in Xcode
2. Enable extension in Safari > Settings > Extensions
3. Grant necessary permissions

## Code Style and Conventions

### Swift Code
- Follows standard Swift coding conventions
- Uses modern Swift syntax
- Minimal comments (needs improvement)

### JavaScript Code
- Comprehensive inline comments in Chinese
- Well-structured with clear function separation
- Extensive error handling and logging
- Uses modern ES6+ features

### CSS
- Uses CSS custom properties for theming
- Responsive design with media queries
- Dark mode support via `prefers-color-scheme`
- Animation and transition effects

## Configuration Files

- `/Users/walker/workspace/jsonHandle/jsonHandle Extension/Info.plist` - Extension configuration
- `/Users/walker/workspace/jsonHandle/.cursor/rules/base.mdc` - Cursor IDE rules
- `/Users/walker/workspace/jsonHandle/.gitignore` - Git ignore rules

## Dependencies

- **No external dependencies** - Uses only built-in Safari Extension APIs
- **No package managers** - Pure Xcode project structure
- **System frameworks**: SafariServices, Cocoa, WebKit

## Security Considerations

- Extension runs in Safari sandbox
- No external network requests
- All processing happens locally
- User data never leaves the browser

## Common Development Tasks

### Adding New Features
1. Modify `content.js` for core functionality
2. Update `popup.js` for UI changes
3. Add corresponding styles in `popup.css`
4. Test in Safari with extension enabled

### Debugging
1. Enable Safari Developer Tools
2. Use console logging (extensive in current code)
3. Test with various JSON formats and edge cases

### Building for Distribution
1. Archive project in Xcode
2. Export for Mac App Store or direct distribution
3. Test on different macOS versions

## Known Issues and Limitations

- Large JSON files may impact performance
- Some edge cases in JSON detection
- Minimal test coverage
- Chinese comments may need translation for international collaboration

## Future Enhancements

- JSON schema validation
- Export formatted JSON to file
- JSONPath support
- Performance optimization for large files
- Internationalization support

## Contact and Support

- **License**: MIT License (see LICENSE file)
- **Issues**: Report through GitHub repository
- **Version**: 1.0.0 (current)

---

**Note**: This project demonstrates a well-structured Safari extension with comprehensive JSON handling capabilities. The codebase is clean and well-documented, making it suitable for learning Safari extension development and JSON processing techniques.