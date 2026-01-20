# Bundled Libraries

This directory contains bundled JavaScript libraries required for offline operation.

## pdf-lib.esm.js
- **Version**: 1.17.1
- **Size**: ~1.5 MB (ES Module version)
- **Source**: https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.esm.js
- **License**: MIT
- **Purpose**: PDF manipulation (create, modify, merge, split PDFs)

### Why bundled?
Chrome extensions with strict Content Security Policy (CSP) cannot load scripts from CDNs. All dependencies must be bundled with the extension for:
1. **CSP Compliance**: `script-src 'self'` requires local files only
2. **True Offline**: No external requests, works without internet
3. **Privacy**: Zero data leaving the browser
4. **Reliability**: No dependency on external CDN availability

### Updating the Library
If a new version is needed:

```bash
cd lib/
curl -L -o pdf-lib.esm.js "https://unpkg.com/pdf-lib@VERSION/dist/pdf-lib.esm.js"
```

Replace `VERSION` with the desired version number (e.g., `1.17.1`).
