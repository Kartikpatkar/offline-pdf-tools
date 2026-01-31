# 🤝 Contributing to Offline PDF Tools

Thank you for your interest in contributing to **Offline PDF Tools**!
We welcome bug reports, feature requests, code improvements, UI/UX enhancements, documentation updates, and more.

Offline PDF Tools is a **privacy-first, offline Chrome Extension**, so **security, performance, and user trust** are top priorities.

---

## 🧩 Ways to Contribute

### 🐞 Report Bugs

If you encounter a bug, please open an issue with:

* A clear description of the issue
* Steps to reproduce the problem
* Expected behavior vs actual behavior
* Screenshots or screen recordings (if applicable)
* Browser and OS details (Chrome version, OS)
* PDF details if relevant (file size, page count — **do not upload files**)

This helps us diagnose issues while respecting user privacy.

---

### 💡 Suggest Enhancements

Have an idea to improve Offline PDF Tools?
Open a feature request issue and explain:

* What problem it solves
* Why it improves usability or privacy
* How it fits an **offline-first workflow**
* Any references (other tools, UX patterns)
* Mockups or screenshots (optional)

We especially welcome ideas related to:

* PDF page operations
* Performance improvements
* Accessibility enhancements
* UI/UX clarity
* Offline reliability
* Chrome Web Store compliance

---

### 💻 Submit Code

We accept pull requests for:

* Bug fixes
* New PDF tools or enhancements
* UI/UX improvements
* Performance optimizations
* Refactoring and cleanup
* Documentation updates

**Please follow the existing project structure and coding style.**
All changes must remain **100% offline** and **privacy-safe**.

---

## 🚀 Getting Started

To set up Offline PDF Tools locally:

```bash
git clone https://github.com/Kartikpatkar/offline-pdf-tools.git
cd offline-pdf-tools
```

### Load the Extension in Chrome

1. Open Chrome and go to:

   ```
   chrome://extensions/
   ```
2. Enable **Developer Mode** (top-right)
3. Click **Load unpacked**
4. Select the project root folder (where `manifest.json` exists)

Offline PDF Tools will now open as a **full-page Chrome extension**.

---

## ✅ Before Submitting a Pull Request

1. Fork the repository and create a feature branch:

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make focused, well-scoped changes with clear commits.

3. Test your changes locally:

   * Merge multiple PDFs
   * Split PDFs using page ranges
   * Extract, rotate, delete, and reorder pages
   * Test both light and dark themes
   * Verify exports via Chrome Downloads

4. Submit a pull request with:

   * A clear title and description
   * Screenshots or screen recordings for UI changes
   * References to related issues (e.g. `Closes #12`)

---

## 🧪 Testing Guidelines

If your change affects PDF processing or previews, please test with:

* Small and large PDF files
* PDFs with different page counts
* Page range edge cases (invalid ranges, boundaries)
* Rotations and reordering combinations
* Light and dark modes
* Browser refresh and reload scenarios

⚠️ Avoid adding tests that require external services or internet access.

---

## 📚 Code Style Guide

* Keep JavaScript **modular and readable**
* Avoid inline scripts (Chrome Extension CSP)
* Use clear, semantic naming for variables and functions
* Keep PDF logic isolated inside `services/`
* Ensure new UI elements:

  * Work offline
  * Support dark mode
  * Are keyboard accessible where possible

---

## 🙌 Code of Conduct

Please be respectful and inclusive.
We follow the [Contributor Covenant](https://www.contributor-covenant.org/version/2/1/code_of_conduct/) to foster a welcoming and collaborative environment.

---

## 📬 Questions or Discussions?

* Open an issue for questions or ideas
* GitHub Discussions may be enabled in the future

Thanks for contributing to **Offline PDF Tools** 🚀
Your contributions help make private, offline PDF editing accessible to everyone.