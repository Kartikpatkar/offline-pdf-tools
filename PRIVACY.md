# Privacy Policy

## Offline PDF Tools - Privacy Policy

**Last Updated**: January 20, 2026  
**Effective Date**: January 20, 2026

---

## Our Privacy Commitment

**Offline PDF Tools** is built on a foundation of complete user privacy. We believe your documents are yours alone, and we've architected this extension to ensure your data never leaves your device.

---

## What Data We Collect

**None. Zero. Absolutely nothing.**

Offline PDF Tools does not collect, store, transmit, or process any personal information or file data beyond your local browser session.

---

## How Your Files Are Processed

### 100% Local Processing
- All PDF operations (merge, split, extract, rotate, delete, reorder) happen **entirely within your browser**
- Files are loaded into your browser's memory (RAM) temporarily
- No files are uploaded to servers
- No files are stored on disk (except when you explicitly download the result)
- No files are transmitted over the internet

### In-Memory Only
When you upload a PDF:
1. The file is read into browser memory (ArrayBuffer)
2. The pdf-lib JavaScript library processes it locally
3. The modified PDF is generated in memory
4. You download the result using Chrome's download API
5. All data is immediately cleared from memory

**Your files exist only in your browser's RAM while you're using the extension.**

---

## Data Transmission

### Network Activity
**This extension makes ZERO network requests** with the following exception:
- **pdf-lib library**: Loaded once from a CDN (jsdelivr.net) when you first open the extension
  - This is a publicly available JavaScript library for PDF manipulation
  - No personal data or files are transmitted during this load
  - After loading, all operations are 100% offline

### No Tracking
- No analytics (Google Analytics, Mixpanel, etc.)
- No telemetry
- No crash reporting services
- No advertising networks
- No cookies
- No fingerprinting

---

## Permissions

### What We Request
The extension requests only **one permission**:
- `downloads`: Required to save modified PDFs to your computer

### What We Don't Request
- ❌ No access to your browsing history
- ❌ No access to websites you visit
- ❌ No access to your cookies or passwords
- ❌ No storage permissions (we don't store anything)
- ❌ No microphone or camera access
- ❌ No location access

---

## Third-Party Services

### None
We do not use any third-party services, including:
- Cloud storage providers
- Analytics platforms
- Advertising networks
- Social media integrations
- Payment processors (extension is free)

### Open Source Libraries
The only external dependency is:
- **pdf-lib** (https://pdf-lib.js.org/): Open-source PDF manipulation library
  - Loaded from CDN: jsdelivr.net
  - No data sent to pdf-lib maintainers
  - Runs entirely in your browser

---

## Data Storage

### Local Storage
**We do not use browser storage APIs** (localStorage, sessionStorage, IndexedDB, or chrome.storage).

### Temporary Memory
Files are held in RAM only while you're actively using the extension. When you:
- Close the tab
- Navigate away
- Complete an operation
- Click "Start Over"

...all data is immediately discarded from memory.

---

## Data Security

Since we don't collect, store, or transmit data:
- There's nothing to encrypt
- There's nothing to breach
- There's nothing to sell
- There's nothing to lose

**Your privacy is protected by design, not just by policy.**

---

## Children's Privacy

We do not knowingly collect information from anyone, including children under 13. Since the extension doesn't collect any data, it is safe for users of all ages.

---

## International Users

This extension works identically for users worldwide:
- **GDPR (Europe)**: No personal data collected, no compliance concerns
- **CCPA (California)**: No personal information sold or shared
- **Other regulations**: Fully compliant due to zero data collection

---

## Your Rights

Since we don't collect data, you have nothing to:
- Request access to
- Request deletion of
- Request portability of
- Opt out of

Your files stay on your device, always.

---

## Changes to This Policy

If we ever change this privacy policy (e.g., adding optional features that involve data), we will:
1. Update the "Last Updated" date above
2. Notify users via extension update notes
3. Provide clear opt-in mechanisms for any new features

**Current policy version**: 1.0 (no data collection)

---

## Contact Us

If you have questions about this privacy policy or the extension:

- **Email**: [your-email@example.com]
- **GitHub**: [github.com/your-repo/offline-pdf-tools/issues]

We're committed to transparency and will respond to privacy inquiries within 48 hours.

---

## Open Source

This extension's source code is publicly available for audit:
- **Repository**: [github.com/your-repo/offline-pdf-tools]
- **License**: MIT License

Feel free to review the code to verify our privacy claims.

---

## Legal Disclaimer

**AS-IS WARRANTY**  
This extension is provided "as is" without warranty of any kind. Use at your own risk.

**NO LIABILITY**  
We are not responsible for any data loss, corruption, or issues arising from extension use. Always keep backups of important files.

---

## Summary

### In Plain English:

✅ **Your files never leave your computer**  
✅ **We don't collect any data**  
✅ **We don't track you**  
✅ **We don't sell anything**  
✅ **We don't use third-party services**  
✅ **Everything happens in your browser**  
✅ **Your privacy is guaranteed**

---

**If you have any doubts, review our source code. We have nothing to hide.**

---

**Offline PDF Tools Team**  
**Last Updated**: January 20, 2026
