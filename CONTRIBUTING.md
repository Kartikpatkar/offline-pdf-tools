# Contributing to Offline PDF Tools

Thank you for considering contributing to Offline PDF Tools! This document provides guidelines and instructions for contributing.

---

## 🎯 How Can I Contribute?

### Reporting Bugs
1. Check if the bug has already been reported in [Issues](https://github.com/yourusername/offline-pdf-tools/issues)
2. If not, create a new issue with:
   - Clear title
   - Detailed description
   - Steps to reproduce
   - Expected vs actual behavior
   - Chrome version and OS
   - Screenshots if applicable

### Suggesting Features
1. Check [ROADMAP.md](ROADMAP.md) to see if feature is planned
2. Search existing issues for similar suggestions
3. Create a new issue with:
   - Clear feature description
   - Use case / problem it solves
   - Proposed implementation (if any)

### Code Contributions
1. Fork the repository
2. Create a feature branch (`feature/your-feature-name`)
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

## 💻 Development Setup

### Prerequisites
- Chrome 88 or higher
- Git
- Text editor (VS Code recommended)

### Local Setup
```bash
# Clone your fork
git clone https://github.com/YOUR-USERNAME/offline-pdf-tools.git
cd offline-pdf-tools

# Create a feature branch
git checkout -b feature/my-feature

# Load extension in Chrome
# 1. Open chrome://extensions/
# 2. Enable "Developer mode"
# 3. Click "Load unpacked"
# 4. Select the offline-pdf-tools folder
```

---

## 📝 Code Style

### JavaScript
- Use ES6+ features
- Prefer `const` over `let`
- Use descriptive variable names
- Add JSDoc comments for functions
- Keep functions small and focused

Example:
```javascript
/**
 * Parse page range string into array of indices
 * @param {string} rangeString - Range like "1-3,5"
 * @param {number} totalPages - Total pages in PDF
 * @returns {number[]} Array of 0-indexed page numbers
 */
function parsePageRange(rangeString, totalPages) {
  // Implementation...
}
```

### HTML/CSS
- Use semantic HTML
- Mobile-first responsive design
- CSS custom properties for theming
- Accessible markup (ARIA labels)

---

## 🧪 Testing

Before submitting a PR:
- [ ] Test all modified features manually
- [ ] Test on Chrome (latest version)
- [ ] Test edge cases (empty inputs, large files, etc.)
- [ ] Check console for errors
- [ ] Verify no new permissions needed

---

## 🔒 Privacy Guidelines

**CRITICAL**: All contributions must maintain our privacy guarantees:
- ❌ No network requests (except loading pdf-lib from CDN)
- ❌ No data collection
- ❌ No analytics
- ❌ No third-party services
- ❌ No persistent storage (except downloads)

If your feature requires any of the above, it will be rejected.

---

## 📋 Pull Request Process

1. **Update Documentation**
   - Update README.md if adding features
   - Update ARCHITECTURE.md for technical changes
   - Add comments to complex code

2. **Test Thoroughly**
   - Test in Chrome
   - Test edge cases
   - Check for console errors

3. **Submit PR**
   - Clear title describing change
   - Detailed description of what/why
   - Reference related issues
   - Screenshots for UI changes

4. **Code Review**
   - Respond to feedback
   - Make requested changes
   - Re-test after changes

5. **Merge**
   - Maintainers will merge when approved
   - Delete your feature branch after merge

---

## 🎨 UI/UX Guidelines

- **Simplicity**: Keep UI clean and uncluttered
- **Accessibility**: Support keyboard navigation
- **Consistency**: Follow existing design patterns
- **Performance**: Fast load times, smooth interactions
- **Responsive**: Work on all screen sizes

---

## 🚫 What We Don't Accept

- Features that require internet connectivity
- Features that collect user data
- Features that add unnecessary permissions
- Obfuscated code
- Code without proper documentation
- Breaking changes without discussion

---

## 📞 Questions?

- Open a [Discussion](https://github.com/yourusername/offline-pdf-tools/discussions)
- Email: [your-email@example.com]

---

## 📜 Code of Conduct

- Be respectful and inclusive
- Constructive criticism only
- No harassment or discrimination
- Focus on the code, not the person

---

Thank you for contributing to Offline PDF Tools! 🙏
