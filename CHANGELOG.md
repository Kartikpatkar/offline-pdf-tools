# Changelog

All notable changes to the **Offline PDF Tools** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.1.0] - 2026-06-04

### Added
- **Unlock PDF Tool:** Decrypt password-secured PDFs completely offline.
- **Protect PDF Tool:** Set user/owner passwords and custom permissions (restricting copying, printing, or form filling) locally.
- **Repair PDF Tool:** Local recovery of damaged, broken, or corrupted PDF structures (xref reconstruction, byte offsets, and trailer repair).
- **Edit Metadata Tool:** Modify internal document header metadata fields (Title, Author, Subject, Keywords) offline.
- **Compress PDF Tool:** Lossless file size optimization using `pdf-lib` deflate streams.
- **Watermark & Page Numbering Tool:** Stamp text watermarks (color, rotation, size, opacity) and page numbers (6 positions), supporting simultaneous dual overlays.
- **Global Undo/Redo:** Travel backward and forward through page selection, rotation, and reordering steps with UI buttons or shortcuts (`Ctrl/Cmd + Z`, `Ctrl/Cmd + Y`).
- **Action Preset Blueprints:** Save current rotations/deletions as custom presets in `localStorage` and apply them to newly uploaded PDFs.
- **Privacy Scoreboard:** Track cumulative local processing statistics (total files processed and saved upload bandwidth in MB) shown in the footer scoreboard.
- **Dim Previews Toggle:** Inserted a comfort switch to toggle a canvas thumbnail dimming filter in dark mode.

### Changed
- **Modern UI Redesign:**
  - Upgraded the horizontal category selection bar into a scrollable iOS-style segmented navigation pill bar with modern inline SVG category icons.
  - Upgraded the 15 tool tab buttons from a wrapped list into a responsive, desktop-friendly CSS Grid of dashboard cards.
  - Redesigned card components with interactive lift transformations, icon rotation micro-animations on hover, and glowing active state linear gradients.
  - Polished Action Preset selection dropdowns and solid Save/Delete action buttons.
- **Manifest Version:** Bumped version to `1.1.0`.
- **Upload Validation:** Enhanced drag-and-drop and input validations to proactively reject password-protected files in standard tools (like Rotate), display warning alerts, and reset the upload zone automatically.

---

## [1.0.0] - Initial Release

- Core PDF tools: Merge, Split, Extract, Reorder, Delete, Rotate.
- Light/Dark theme selector.
- 100% offline local processing (zero server uploads).
