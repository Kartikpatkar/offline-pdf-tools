# Architecture Documentation

## Offline PDF Tools - Technical Architecture

### 🎯 Design Principles

1. **Privacy First**: All processing happens client-side, zero network calls
2. **Modularity**: Clean separation of concerns (UI, services, utilities)
3. **Performance**: In-memory operations, no persistent storage
4. **Maintainability**: Clear code structure, extensive documentation
5. **Compliance**: Chrome Web Store and Manifest V3 compliant

---

## 📁 Project Structure

```
offline-pdf-tools/
│
├── manifest.json           # Chrome Extension configuration (Manifest V3)
├── background.js           # Service worker (opens app in new tab)
│
├── app/                    # Full-page UI
│   ├── index.html         # Main application interface
│   ├── index.css          # Styling and responsive design
│   └── index.js           # UI logic and event handling
│
├── services/               # Business logic layer
│   └── pdfService.js      # All PDF operations (pdf-lib wrapper)
│
├── utils/                  # Utility functions
│   ├── rangeParser.js     # Page range parsing (e.g., "1-3,5,7-10")
│   └── fileUtils.js       # File validation, download, formatting
│
├── assets/                 # Static resources
│   └── icons/             # Extension icons (16x16, 48x48, 128x128)
│
└── docs/                   # Documentation
    ├── ARCHITECTURE.md    # This file
    ├── ROADMAP.md         # Feature roadmap
    └── CHROME_STORE.md    # Chrome Web Store checklist
```

---

## 🔧 Technology Stack

### Core Libraries
- **pdf-lib** (v1.17.1): PDF manipulation (merge, split, rotate, etc.)
  - Pure JavaScript, works offline
  - Supports all required operations
  - No dependencies on external services

### Chrome Extension APIs
- **chrome.downloads**: Download modified PDFs
- **chrome.tabs**: Open full-page app
- **chrome.runtime**: Extension lifecycle management

### Architecture Pattern
- **ES6 Modules**: Modern JavaScript module system
- **Singleton Services**: Single instance of pdfService
- **Event-Driven UI**: Reactive updates based on user actions

---

## 🔄 Data Flow

### 1. User Interaction Flow
```
User clicks extension icon
  ↓
background.js opens app/index.html
  ↓
User selects tool (merge/split/etc.)
  ↓
User uploads PDF files
  ↓
Files loaded into memory (ArrayBuffer)
  ↓
User configures options
  ↓
User clicks "Process"
  ↓
pdfService processes in-memory
  ↓
chrome.downloads saves result
  ↓
Memory cleared (no persistence)
```

### 2. PDF Processing Pipeline
```
File Input (File API)
  ↓
Validation (fileUtils.isPDF)
  ↓
ArrayBuffer conversion
  ↓
pdf-lib processing (pdfService)
  ↓
Uint8Array output
  ↓
Blob creation
  ↓
chrome.downloads.download
  ↓
Cleanup (URL.revokeObjectURL)
```

---

## 🛡️ Security & Privacy

### Data Handling
- **No Network Calls**: 100% offline, no API requests
- **No Storage**: Files never saved to disk or localStorage
- **No Tracking**: No analytics, no telemetry
- **In-Memory Only**: All operations use ArrayBuffer/Uint8Array
- **Immediate Cleanup**: Object URLs revoked after download

### Permissions (Minimal)
```json
{
  "permissions": ["downloads"]
}
```
- **downloads**: Required to save processed PDFs
- **No host permissions**: No access to websites
- **No storage permissions**: No persistent data

### Content Security Policy
```json
{
  "extension_pages": "script-src 'self' 'wasm-unsafe-eval'; object-src 'self'"
}
```
- Allows pdf-lib's WebAssembly modules
- Blocks external scripts
- Prevents XSS attacks

---

## 📦 Component Details

### 1. pdfService.js
**Responsibility**: All PDF manipulation operations

**Methods**:
- `mergePDFs(files)`: Combine multiple PDFs
- `splitPDF(file, rangeString)`: Extract page ranges
- `extractPages(file, pageNumbers)`: Extract specific pages
- `rotatePages(file, pageNumbers, rotation)`: Rotate pages
- `deletePages(file, pageNumbers)`: Remove pages
- `reorderPages(file, newOrder)`: Rearrange pages
- `getPageCount(file)`: Count pages

**Error Handling**: All methods throw descriptive errors

**Performance**: 
- Async/await for non-blocking operations
- Minimal memory copies
- Efficient page copying with pdf-lib

---

### 2. rangeParser.js
**Responsibility**: Parse and validate page range strings

**Functions**:
- `parsePageRange(rangeString, totalPages)`: Convert "1-3,5" to [0,1,2,4]
- `isValidRangeSyntax(rangeString)`: Syntax validation
- `formatPageRange(indices)`: Convert array back to range string

**Edge Cases**:
- Empty ranges
- Overlapping ranges
- Out-of-bounds pages
- Invalid syntax

---

### 3. fileUtils.js
**Responsibility**: File operations and helpers

**Functions**:
- `isPDF(file)`: Validate PDF file
- `areAllPDFs(files)`: Validate multiple files
- `formatFileSize(bytes)`: Human-readable sizes
- `downloadPDF(pdfBytes, filename)`: Save using chrome.downloads
- `generateTimestampedFilename(prefix)`: Unique filenames
- `sanitizeFilename(filename)`: Remove unsafe characters

---

### 4. index.js (UI Controller)
**Responsibility**: UI logic and state management

**State Management**:
```javascript
state = {
  currentTool: null,
  selectedFiles: [],
  pageCount: 0,
  selectedPages: Set,
  pageOrder: []
}
```

**Event Handlers**:
- Tool selection
- File upload (click + drag-drop)
- Page selection
- Drag-and-drop reordering
- Process/reset actions

---

## 🚀 Performance Considerations

### Memory Management
- **Streaming**: Not used (pdf-lib requires full document in memory)
- **Limits**: Recommended max file size: 50MB per PDF
- **Cleanup**: Object URLs revoked, variables cleared after operations

### Optimization Strategies
1. **Lazy Loading**: Tool options loaded only when needed
2. **Debouncing**: File validation runs once per batch
3. **Efficient DOM**: Minimal re-renders, event delegation
4. **Web Workers**: Not needed (pdf-lib is already async)

### Browser Compatibility
- **Target**: Chrome 88+ (Manifest V3 requirement)
- **Features Used**: ES6 modules, async/await, File API
- **Tested On**: Chrome 88+, Edge 88+

---

## 🧪 Testing Strategy

### Manual Testing Checklist
- [ ] Upload valid PDFs
- [ ] Upload non-PDF files (should reject)
- [ ] Merge 2+ PDFs
- [ ] Split with various ranges
- [ ] Extract pages
- [ ] Rotate pages (90°, 180°, 270°)
- [ ] Delete pages
- [ ] Reorder pages (drag-drop)
- [ ] Large files (10MB+)
- [ ] Error handling (invalid ranges, corrupted PDFs)

### Edge Cases
- Empty files
- Encrypted PDFs
- PDFs with embedded media
- Very large PDFs (100MB+)
- Unicode filenames
- Special characters in ranges

---

## 📊 Error Handling

### Error Types
1. **Validation Errors**: Invalid file types, empty selections
2. **Processing Errors**: Corrupted PDFs, pdf-lib failures
3. **Browser Errors**: Storage limits, download failures

### Error Display
- User-friendly messages in status bar
- Color-coded (error=red, warning=yellow, success=green)
- Console logging for debugging

### Recovery
- Reset button clears all state
- No persistent errors (fresh state on reload)

---

## 🔐 Chrome Web Store Compliance

### Manifest V3 Requirements
✅ Uses service worker (background.js)
✅ Minimal permissions
✅ Content Security Policy defined
✅ No remote code execution

### Privacy Policy
✅ No data collection
✅ No network requests
✅ No third-party services

### User Data Handling
✅ Files processed in-memory only
✅ No persistent storage
✅ Clear privacy messaging in UI

---

## 🔮 Future Enhancements

### Phase 2 Features (Post-MVP)
- PDF compression
- Add watermarks
- Add page numbers
- Extract images
- Convert to/from images

### Technical Improvements
- WebAssembly optimization
- Worker threads for large files
- PDF preview thumbnails (using pdfjs-dist)
- Dark mode

### User Experience
- Keyboard shortcuts
- Undo/redo
- Batch processing
- Templates/presets

---

## 📝 Maintenance Notes

### Dependencies
- **pdf-lib**: Pin to v1.17.1 (stable, tested)
- **CDN**: jsdelivr (fallback: unpkg)

### Version Control
- Semantic versioning (MAJOR.MINOR.PATCH)
- Tag releases in git
- Maintain CHANGELOG.md

### Code Quality
- ESLint for JavaScript linting
- Prettier for code formatting
- JSDoc comments for all functions

---

## 🆘 Troubleshooting

### Common Issues

**Issue**: Extension doesn't load
- **Solution**: Check manifest.json syntax, reload extension

**Issue**: PDFs won't download
- **Solution**: Verify chrome.downloads permission, check browser settings

**Issue**: Large files crash
- **Solution**: Implement file size warnings, suggest splitting

**Issue**: Merge fails with encrypted PDFs
- **Solution**: pdf-lib limitation, inform user to decrypt first

---

## 📞 Support & Contact

For issues, feature requests, or contributions:
- GitHub Issues: [repository]/issues
- Documentation: README.md, ROADMAP.md
- License: See LICENSE file

---

**Last Updated**: January 20, 2026  
**Version**: 1.0.0  
**Author**: Offline PDF Tools Team
