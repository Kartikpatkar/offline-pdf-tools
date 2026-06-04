# 📄 Offline PDF Tools – Private PDF Editor

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/Version-1.1.0-blue.svg)](#)
[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-green.svg?logo=google-chrome)](#)

> **Tagline**: *Merge, split, compress, watermark, protect, and edit PDFs — 100% offline, private, and fast.*

---

## ✨ Overview

**Offline PDF Tools** is a modern, privacy-first **Chrome Extension (Manifest V3)** that opens as a **full-page app** and lets you **modify PDFs entirely within your browser**.

All PDF operations are performed **locally in memory** —
📌 **no uploads**, **no servers**, **no tracking**.

Built for users who need reliable PDF tools without trusting online services, this extension focuses on **privacy, performance, and simplicity**.

---

## 🚀 Key Features

### 📑 Merge PDFs

* Combine **multiple PDF files** into a single document
* Drag-and-drop file upload
* Reorder input files before merging
* Automatic filename generation

### ✂️ Split PDF (Page Ranges)

* Split PDFs using flexible range syntax:
  ```
  1-3,5,7-10
  ```
* Validate ranges against total page count
* Export only the pages you need

### 📋 Extract Pages

* Select individual pages using **thumbnail grid**
* Create a new PDF from selected pages
* Visual selection indicators and page numbers

### 🔀 Reorder Pages

* Drag-and-drop page thumbnails
* Reorder pages intuitively
* Export reordered PDF instantly

### 🗑️ Delete Pages

* Remove unwanted pages from a document
* Prevents deleting all pages (safe guard)
* Works seamlessly with preview grid

### 🔄 Rotate Pages

* Rotate pages by **90°, 180°, or 270°**
* Per-page rotation controls
* Visual rotation preview before export

### 🔓 Unlock PDF

* Remove password security from encrypted PDFs locally
* Instant password entry decryption

### 🔒 Protect PDF

* Set custom user and owner passwords completely offline
* Restrict printing, content copying, editing, or form-filling permissions

### 🛠️ Repair PDF

* Reconstruct cross-reference tables (xref) and trailers of broken PDFs
* Local stream byte offset recovery

### ✍️ Edit Metadata

* Modify document metadata (Title, Author, Subject, Keywords) offline
* Auto-populates existing metadata fields for quick edits

### 📉 Compress PDF

* Deflate stream size losslessly to optimize PDF files locally

### 💧 Watermarks & Page Numbers

* Draw custom text watermarks (color, size, opacity, rotation angle)
* Stamp dynamic page numbers at 6 standard alignments
* Supports simultaneous dual overlays

### ↩️ Global Undo/Redo

* Step backward or forward through page selections, rotations, and reorder steps
* Bound to `Ctrl/Cmd + Z` and `Ctrl/Cmd + Y` shortcuts

### 📋 Action Presets (Blueprints)

* Save actions (rotations and deletions) as custom local blueprints to apply to new uploads

### 📊 Privacy Scoreboard

* Track cumulative stats (total processed files, bandwidth saved in MB) in the footer scoreboard


---

## 🖥️ UI Philosophy

Offline PDF Tools is designed with:

* **Privacy-first UX**
* **Full-page workspace (not a popup)**
* **Clear visual feedback**
* **Minimal distractions**
* **Fast, responsive interactions**
* **Keyboard-friendly navigation**
* **No forced login or account setup**

---

## 📸 Screenshots

### 🔷 Light Mode

![Light Mode - Home](./assets/screenshots/Main%20Page%20-%20Light%20Theme.png)
![Light Mode - Page Tools](./assets/screenshots/Feature%20screen%20-%20Light%20Theme.png)

### 🌑 Dark Mode

![Dark Mode - Home](./assets/screenshots/Main%20Screen%20-%20Dark%20Theme.png)
![Dark Mode - Page Tools](./assets/screenshots/Feature%20Screen%20-%20Dark%20Theme.png)

---

## 🛠 Built With

* **HTML5, CSS3, Vanilla JavaScript**
* **pdf-lib** – PDF manipulation engine
* **PDF.js** – Page thumbnails & previews
* Chrome Extensions API (**Manifest V3**)
* Modular, service-based architecture
* CSP-compliant & review-safe design

---

## 📦 Installation

### 🌐 Install from Chrome Web Store (Recommended)

**[📥 Get it on Chrome Web Store](https://chromewebstore.google.com/detail/lkokanmnglecjkgabbhincgaiceedolc?utm_source=item-share-cb)**

1. Click the link above or visit the Chrome Web Store
2. Click **"Add to Chrome"**
3. Confirm the installation

### 🔧 Load Offline PDF Tools Manually (Developer Mode)

1. **Clone or Download this Repository**

   ```bash
   git clone https://github.com/Kartikpatkar/offline-pdf-tools.git
   ```

2. **Open Chrome Extensions Page**

   ```
   chrome://extensions/
   ```

3. **Enable Developer Mode**

   * Toggle **Developer mode** (top-right)

4. **Click “Load unpacked”**

   * Select the project root folder (contains `manifest.json`)

5. **Done 🎉**

   * Launch the extension from Chrome’s extensions menu

> ✅ Works completely offline
> ✅ No internet connection required
> ✅ No external services or uploads

---

## 🧪 Current Capabilities

✔ Merge PDFs
✔ Split PDFs using page ranges
✔ Extract selected pages
✔ Reorder pages visually
✔ Delete unwanted pages
✔ Rotate pages
✔ Unlock password-protected PDFs
✔ Encrypt and restrict PDF permissions
✔ Repair corrupted/damaged PDF structures
✔ Edit PDF metadata tags
✔ Compress file sizes losslessly
✔ Apply text watermarks and page numbers simultaneously
✔ Undo/Redo stack with keyboard shortcuts
✔ Action preset blueprints
✔ Local privacy scoreboard
✔ Light / dark theme
✔ Full offline processing

---

## 🛣️ Roadmap (Planned Enhancements)

* 📁 Multi-file batch processing for conversion tools
* 🖊️ Interactive PDF signing and form editing
* 🔍 Offline Optical Character Recognition (OCR) text extraction
* 🌐 Internationalization support (i18n) for more languages
* ⚙️ Global extension configuration settings panel

---

## 🤝 Contributing

Contributions, bug reports, and feature suggestions are welcome!

* Fork the repository
* Create a feature branch
* Submit a pull request

Please keep changes **modular**, **offline-safe**, and aligned with privacy-first principles.

---

## 🧠 Author

Built by **Kartik Patkar**
🔗 GitHub • LinkedIn • Developer & Salesforce Consultant

---

## 📜 License

This project is licensed under the **MIT License** — free to use, modify, and distribute.

---

> **Offline PDF Tools** — powerful PDF editing without compromising your privacy.

---