# 📄 Offline PDF Tools - Chrome Extension

[![Chrome Web Store](https://img.shields.io/badge/Chrome-Extension-blue?logo=google-chrome)](https://chrome.google.com/webstore)
[![Privacy](https://img.shields.io/badge/Privacy-100%25%20Offline-green)](#privacy)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Manifest](https://img.shields.io/badge/Manifest-V3-orange)](manifest.json)

**100% offline PDF modification tools** — merge, split, extract, rotate, delete, and reorder PDF pages entirely in your browser. No uploads, no servers, complete privacy.

---

## ✨ Features

### Core Tools (v1.0.0)
- **📑 Merge PDFs** - Combine multiple PDF files into one
- **✂️ Split PDF** - Split by page ranges (e.g., 1-3,5,7-10)
- **📋 Extract Pages** - Create new PDF from selected pages
- **🔄 Rotate Pages** - Rotate pages by 90°, 180°, or 270°
- **🗑️ Delete Pages** - Remove unwanted pages
- **🔀 Reorder Pages** - Drag-and-drop to rearrange pages

### Privacy Guarantee
- 🔒 **100% Offline** - All processing happens in your browser
- 🚫 **No Uploads** - Files never leave your computer
- 👁️ **No Tracking** - Zero analytics, zero data collection
- 🔐 **No Storage** - Files only in memory while you work
- ✅ **Open Source** - Audit the code yourself

---

## 🚀 Installation

### From Chrome Web Store (Recommended)
1. Visit [Chrome Web Store](#) (link pending publication)
2. Click "Add to Chrome"
3. Click the extension icon to open the tool

### Manual Installation (Development)
1. Clone this repository:
   ```bash
   git clone https://github.com/yourusername/offline-pdf-tools.git
   cd offline-pdf-tools
   ```

2. Open Chrome and navigate to `chrome://extensions/`

3. Enable "Developer mode" (toggle in top-right)

4. Click "Load unpacked"

5. Select the `offline-pdf-tools` folder

6. Click the extension icon to start using it

---

## 📖 How to Use

### Quick Start
1. Click the extension icon in Chrome toolbar
2. Select a tool (Merge, Split, Extract, etc.)
3. Upload your PDF file(s)
4. Configure options (if needed)
5. Click "Process PDF"
6. Download the result

### Tool-Specific Guides

#### Merge PDFs
1. Select "Merge PDFs"
2. Upload 2 or more PDF files
3. Files will be merged in upload order
4. Click "Merge PDFs"

#### Split PDF
1. Select "Split PDF"
2. Upload one PDF file
3. Enter page range (e.g., `1-3,5,7-10`)
4. Click "Split PDF"

#### Extract Pages
1. Select "Extract Pages"
2. Upload one PDF file
3. Click pages you want to extract
4. Click "Extract Pages"

#### Rotate Pages
1. Select "Rotate Pages"
2. Upload one PDF file
3. Select pages to rotate
4. Choose rotation angle (90°, 180°, 270°)
5. Click "Rotate Pages"

#### Delete Pages
1. Select "Delete Pages"
2. Upload one PDF file
3. Click pages you want to delete
4. Click "Delete Pages"

#### Reorder Pages
1. Select "Reorder Pages"
2. Upload one PDF file
3. Drag-and-drop page thumbnails to reorder
4. Click "Reorder & Export"

---

## 🏗️ Architecture

```
offline-pdf-tools/
├── manifest.json          # Chrome Extension config (Manifest V3)
├── background.js          # Service worker
├── app/                   # Full-page UI
│   ├── index.html        # Main interface
│   ├── index.css         # Styles
│   └── index.js          # UI logic
├── services/              # Business logic
│   └── pdfService.js     # PDF operations (pdf-lib)
├── utils/                 # Utilities
│   ├── rangeParser.js    # Page range parsing
│   └── fileUtils.js      # File helpers
└── assets/               # Icons and resources
```

**Tech Stack:**
- **pdf-lib** - PDF manipulation (pure JavaScript)
- **Chrome Extension Manifest V3**
- **Vanilla JavaScript** - No frameworks, fast loading
- **ES6 Modules** - Clean, modular code

See [ARCHITECTURE.md](ARCHITECTURE.md) for detailed technical documentation.

---

## 🔐 Privacy Policy

**We don't collect, store, or transmit ANY data. Period.**

- All PDF processing happens in your browser's memory
- No files uploaded to servers
- No analytics or tracking
- No third-party services
- Files deleted from memory when you're done

Read our full [Privacy Policy](PRIVACY.md).

---

## 🛠️ Development

### Prerequisites
- Chrome 88+ (for Manifest V3 support)
- Basic knowledge of JavaScript and Chrome Extensions

### Local Development
1. Clone the repository
2. Make changes to the code
3. Reload the extension in `chrome://extensions/`
4. Test your changes

### File Structure
- Modify UI: Edit `app/index.html`, `app/index.css`, `app/index.js`
- Modify PDF logic: Edit `services/pdfService.js`
- Add utilities: Create files in `utils/`

### Building for Production
```bash
# Package extension for Chrome Web Store
zip -r offline-pdf-tools.zip . \
  -x "*.git*" -x "*node_modules*" -x "*.DS_Store"
```

---

## 🗺️ Roadmap

### Phase 1: MVP (Current - v1.0.0)
- ✅ Core 6 features implemented
- ✅ Manifest V3 compliant
- ✅ 100% offline operation

### Phase 2: Enhanced Features (v1.1.0)
- [ ] PDF compression
- [ ] Add watermarks
- [ ] Add page numbers
- [ ] Password protection
- [ ] PDF preview thumbnails

### Phase 3: User Experience (v1.2.0)
- [ ] Dark mode
- [ ] Keyboard shortcuts
- [ ] Undo/Redo
- [ ] Batch processing

See [ROADMAP.md](ROADMAP.md) for detailed plans.

---

## 🐛 Troubleshooting

### Extension won't load
- Ensure you're using Chrome 88+
- Check `chrome://extensions/` for errors
- Reload the extension

### PDF won't process
- Ensure file is a valid PDF
- Check file isn't encrypted/password-protected
- Try a smaller file (recommended <50MB)

### Download doesn't start
- Check Chrome's download permissions
- Ensure pop-ups aren't blocked

---

## 🤝 Contributing

We welcome contributions! Here's how:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Contribution Guidelines
- Follow existing code style
- Add comments for complex logic
- Test all changes thoroughly
- Update documentation as needed

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

You are free to:
- Use commercially
- Modify
- Distribute
- Private use

---

## 🌟 Support

### Get Help
- 📧 Email: [your-email@example.com]
- 🐛 Report bugs: [GitHub Issues](https://github.com/yourusername/offline-pdf-tools/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/yourusername/offline-pdf-tools/discussions)

### Show Your Support
If you find this extension useful:
- ⭐ Star this repository
- 📝 Leave a review on Chrome Web Store
- 🔗 Share with others
- 🤝 Contribute code or documentation

---

## 📚 Resources

- [Chrome Extension Documentation](https://developer.chrome.com/docs/extensions/)
- [pdf-lib Documentation](https://pdf-lib.js.org/)
- [Manifest V3 Migration Guide](https://developer.chrome.com/docs/extensions/mv3/intro/)

---

## 🙏 Acknowledgments

- **pdf-lib** - For the excellent PDF manipulation library
- **Chrome Extensions** - For the robust extension platform
- **Open Source Community** - For inspiration and support

---

## 📊 Status

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Status](https://img.shields.io/badge/status-ready%20for%20submission-green)
![Privacy](https://img.shields.io/badge/data%20collection-NONE-green)
![Dependencies](https://img.shields.io/badge/dependencies-pdf--lib-blue)

---

**Built with ❤️ for privacy and simplicity**

---

**Last Updated**: January 20, 2026