/**
 * PDF Service - All PDF operations using pdf-lib
 * 100% offline, in-memory processing only
 * 
 * Operations:
 * - mergePDFs: Combine multiple PDFs into one
 * - splitPDF: Split PDF by page ranges
 * - extractPages: Extract specific pages
 * - rotatePages: Rotate specific pages
 * - deletePages: Remove specific pages
 */

import { PDFDocument, degrees, rgb, StandardFonts } from '../lib/pdf-lib.esm.js';
import { decryptPDF, isEncrypted, encryptPDF, repairPDF } from '../lib/pdf-decrypt/index.js';

class PDFService {
  constructor() {
    this._cachedPdfjsDoc = null;
    this._cachedFile = null;
  }

  clearCache() {
    if (this._cachedPdfjsDoc) {
      try {
        this._cachedPdfjsDoc.destroy();
      } catch (e) {
        console.error('Error destroying cached PDF.js doc:', e);
      }
      this._cachedPdfjsDoc = null;
    }
    this._cachedFile = null;
  }

  /**
   * Merge multiple PDFs into a single PDF
   * @param {File[]} files - Array of PDF File objects
   * @returns {Promise<Uint8Array>} - Combined PDF as byte array
   */
  async mergePDFs(files) {
    if (!files || files.length === 0) {
      throw new Error('No files provided for merging');
    }

    const mergedPdf = await PDFDocument.create();

    for (const file of files) {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await PDFDocument.load(arrayBuffer);
      const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      copiedPages.forEach((page) => mergedPdf.addPage(page));
    }

    return await mergedPdf.save();
  }

  /**
   * Split PDF by page ranges
   * @param {File} file - PDF File object
   * @param {string} rangeString - Page ranges (e.g., "1-3,5,7-10")
   * @returns {Promise<Uint8Array>} - New PDF with selected pages
   */
  async splitPDF(file, rangeString) {
    if (!file) {
      throw new Error('No file provided');
    }
    if (!rangeString || rangeString.trim() === '') {
      throw new Error('No page range provided');
    }

    const arrayBuffer = await file.arrayBuffer();
    const srcPdf = await PDFDocument.load(arrayBuffer);
    const totalPages = srcPdf.getPageCount();

    // Parse range string to get page indices
    const { parsePageRange } = await import('../utils/rangeParser.js');
    const pageIndices = parsePageRange(rangeString, totalPages);

    if (pageIndices.length === 0) {
      throw new Error('No valid pages in range');
    }

    const newPdf = await PDFDocument.create();
    const copiedPages = await newPdf.copyPages(srcPdf, pageIndices);
    copiedPages.forEach((page) => newPdf.addPage(page));

    return await newPdf.save();
  }

  /**
   * Extract specific pages from PDF
   * @param {File} file - PDF File object
   * @param {number[]} pageNumbers - Array of page numbers (1-indexed)
   * @returns {Promise<Uint8Array>} - New PDF with extracted pages
   */
  async extractPages(file, pageNumbers) {
    if (!file) {
      throw new Error('No file provided');
    }
    if (!pageNumbers || pageNumbers.length === 0) {
      throw new Error('No pages selected for extraction');
    }

    const arrayBuffer = await file.arrayBuffer();
    const srcPdf = await PDFDocument.load(arrayBuffer);
    const totalPages = srcPdf.getPageCount();

    // Convert to 0-indexed and validate
    const pageIndices = pageNumbers
      .map(n => n - 1)
      .filter(i => i >= 0 && i < totalPages);

    if (pageIndices.length === 0) {
      throw new Error('No valid pages selected');
    }

    const newPdf = await PDFDocument.create();
    const copiedPages = await newPdf.copyPages(srcPdf, pageIndices);
    copiedPages.forEach((page) => newPdf.addPage(page));

    return await newPdf.save();
  }

  /**
   * Rotate specific pages in PDF
   * @param {File} file - PDF File object
   * @param {number[]} pageNumbers - Array of page numbers to rotate (1-indexed)
   * @param {number} rotation - Rotation angle (90, 180, 270, or -90)
   * @returns {Promise<Uint8Array>} - Modified PDF
   */
  async rotatePages(file, pageNumbers, rotation) {
    if (!file) {
      throw new Error('No file provided');
    }
    if (!pageNumbers || pageNumbers.length === 0) {
      throw new Error('No pages selected for rotation');
    }
    if (![90, 180, 270, -90].includes(rotation)) {
      throw new Error('Invalid rotation angle. Use 90, 180, 270, or -90');
    }

    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    const totalPages = pdfDoc.getPageCount();

    pageNumbers.forEach(pageNum => {
      const pageIndex = pageNum - 1;
      if (pageIndex >= 0 && pageIndex < totalPages) {
        const page = pdfDoc.getPage(pageIndex);
        page.setRotation(degrees(rotation));
      }
    });

    return await pdfDoc.save();
  }

  /**
   * Rotate pages with individual rotations
   * @param {File} file - PDF File object
   * @param {Map<number, number>} pageRotations - Map of page number (1-based) to rotation angle
   * @returns {Promise<Uint8Array>} - Rotated PDF as byte array
   */
  async rotatePagesPerPage(file, pageRotations) {
    if (!file) {
      throw new Error('No file provided');
    }
    if (!pageRotations || pageRotations.size === 0) {
      throw new Error('No rotations specified');
    }

    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    const totalPages = pdfDoc.getPageCount();

    for (const [pageNum, rotation] of pageRotations) {
      if (rotation !== 0) {
        const pageIndex = pageNum - 1;
        if (pageIndex >= 0 && pageIndex < totalPages) {
          const page = pdfDoc.getPage(pageIndex);
          page.setRotation(degrees(rotation));
        }
      }
    }

    return await pdfDoc.save();
  }

  /**
   * Delete specific pages from PDF
   * @param {File} file - PDF File object
   * @param {number[]} pageNumbers - Array of page numbers to delete (1-indexed)
   * @returns {Promise<Uint8Array>} - Modified PDF
   */
  async deletePages(file, pageNumbers) {
    if (!file) {
      throw new Error('No file provided');
    }
    if (!pageNumbers || pageNumbers.length === 0) {
      throw new Error('No pages selected for deletion');
    }

    const arrayBuffer = await file.arrayBuffer();
    const srcPdf = await PDFDocument.load(arrayBuffer);
    const totalPages = srcPdf.getPageCount();

    // Create set of pages to keep (inverse of delete)
    const pagesToDelete = new Set(pageNumbers.map(n => n - 1));
    const pagesToKeep = [];

    for (let i = 0; i < totalPages; i++) {
      if (!pagesToDelete.has(i)) {
        pagesToKeep.push(i);
      }
    }

    if (pagesToKeep.length === 0) {
      throw new Error('Cannot delete all pages from PDF');
    }

    const newPdf = await PDFDocument.create();
    const copiedPages = await newPdf.copyPages(srcPdf, pagesToKeep);
    copiedPages.forEach((page) => newPdf.addPage(page));

    return await newPdf.save();
  }

  /**
   * Reorder pages in PDF
   * @param {File} file - PDF File object
   * @param {number[]} newOrder - New page order (1-indexed array)
   * @returns {Promise<Uint8Array>} - Reordered PDF
   */
  async reorderPages(file, newOrder) {
    if (!file) {
      throw new Error('No file provided');
    }
    if (!newOrder || newOrder.length === 0) {
      throw new Error('No page order provided');
    }

    const arrayBuffer = await file.arrayBuffer();
    const srcPdf = await PDFDocument.load(arrayBuffer);
    const totalPages = srcPdf.getPageCount();

    // Validate order array
    if (newOrder.length !== totalPages) {
      throw new Error(`Order array length (${newOrder.length}) must match page count (${totalPages})`);
    }

    // Convert to 0-indexed
    const pageIndices = newOrder.map(n => n - 1);

    // Validate all indices
    const validIndices = pageIndices.every(i => i >= 0 && i < totalPages);
    if (!validIndices) {
      throw new Error('Invalid page numbers in order array');
    }

    const newPdf = await PDFDocument.create();
    const copiedPages = await newPdf.copyPages(srcPdf, pageIndices);
    copiedPages.forEach((page) => newPdf.addPage(page));

    return await newPdf.save();
  }

  /**
   * Get page count from PDF
   * @param {File} file - PDF File object
   * @returns {Promise<number>} - Number of pages
   */
  async getPageCount(file) {
    if (!file) {
      throw new Error('No file provided');
    }

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      return pdfDoc.getPageCount();
    } catch (error) {
      if (error.message?.toLowerCase().includes('encrypt') || error.message?.toLowerCase().includes('password')) {
        throw new Error('Document is encrypted/password-protected.');
      }
      throw error;
    }
  }
  /**
   * Render a page thumbnail as a data URL
   * @param {File} file - PDF File object
   * @param {number} pageIndex - Page index (0-based)
   * @param {number} width - Thumbnail width in pixels
   * @param {number} height - Thumbnail height in pixels
   * @returns {Promise<string>} - Data URL of the rendered thumbnail
   */
  async renderPageThumbnail(file, pageIndex, width = 150, height = 200) {
    if (!file) {
      throw new Error('No file provided');
    }

    // Check if PDF.js is available
    if (typeof pdfjsLib === 'undefined') {
      throw new Error('PDF.js library not loaded');
    }

    try {
      let pdf;
      if (this._cachedFile === file && this._cachedPdfjsDoc) {
        pdf = this._cachedPdfjsDoc;
      } else {
        this.clearCache();
        const arrayBuffer = await file.arrayBuffer();
        pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        this._cachedPdfjsDoc = pdf;
        this._cachedFile = file;
      }
      const page = await pdf.getPage(pageIndex + 1); // PDF.js uses 1-based indexing

      const viewport = page.getViewport({ scale: 1 });
      const scale = Math.min(width / viewport.width, height / viewport.height);
      const scaledViewport = page.getViewport({ scale });

      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.height = scaledViewport.height;
      canvas.width = scaledViewport.width;

      const renderContext = {
        canvasContext: context,
        viewport: scaledViewport
      };

      await page.render(renderContext).promise;
      return canvas.toDataURL('image/jpeg', 0.8);
    } catch (error) {
      console.error('Error in renderPageThumbnail:', error);
      if (error.name === 'PasswordException' || error.message?.toLowerCase().includes('password') || error.message?.toLowerCase().includes('encrypt')) {
        throw new Error('Document is encrypted/password-protected.');
      }
      throw error;
    }
  }

  /**
   * Convert multiple image files into a single PDF
   * @param {File[]} files - Array of image File objects
   * @param {Object} options - Layout options (pageSize, orientation, margin, alignment)
   * @returns {Promise<Uint8Array>} - Generated PDF as byte array
   */
  async imageToPDF(files, options = {}) {
    if (!files || files.length === 0) {
      throw new Error('No images selected');
    }

    const pdfDoc = await PDFDocument.create();

    for (const file of files) {
      const pngBytes = await convertImageToPngBytes(file);
      const embeddedImage = await pdfDoc.embedPng(pngBytes);
      
      const { width: imgWidth, height: imgHeight } = embeddedImage;
      
      let pageWidth = imgWidth;
      let pageHeight = imgHeight;
      
      const pageSize = options.pageSize || 'fit';
      const orientation = options.orientation || 'auto';
      const margin = options.margin !== undefined ? parseInt(options.margin, 10) : 0;
      
      if (pageSize === 'a4') {
        pageWidth = 595.28;
        pageHeight = 841.89;
      } else if (pageSize === 'letter') {
        pageWidth = 612;
        pageHeight = 792;
      }
      
      if (pageSize !== 'fit') {
        const isPortrait = orientation === 'portrait' || (orientation === 'auto' && imgHeight >= imgWidth);
        const currentIsPortrait = pageHeight >= pageWidth;
        if (isPortrait !== currentIsPortrait) {
          const temp = pageWidth;
          pageWidth = pageHeight;
          pageHeight = temp;
        }
      }
      
      const page = pdfDoc.addPage([pageWidth, pageHeight]);
      
      const availableWidth = pageWidth - (margin * 2);
      const availableHeight = pageHeight - (margin * 2);
      
      const scale = Math.min(availableWidth / imgWidth, availableHeight / imgHeight);
      const drawWidth = imgWidth * scale;
      const drawHeight = imgHeight * scale;
      
      let x = margin + (availableWidth - drawWidth) / 2;
      let y = margin + (availableHeight - drawHeight) / 2;
      
      if (options.alignment === 'top') {
        y = pageHeight - margin - drawHeight;
      } else if (options.alignment === 'bottom') {
        y = margin;
      }
      
      page.drawImage(embeddedImage, {
        x,
        y,
        width: drawWidth,
        height: drawHeight
      });
    }

    return await pdfDoc.save();
  }

  /**
   * Render a specific PDF page to an image data URL
   * @param {File} file - PDF File object
   * @param {number} pageIndex - Page index (0-based)
   * @param {string} format - Image format ('image/png' or 'image/jpeg')
   * @param {number} scale - DPI Scale multiplier (e.g. 1, 2, 3)
   * @returns {Promise<string>} - Image data URL
   */
  async renderPageToImage(file, pageIndex, format = 'image/png', scale = 2) {
    if (!file) {
      throw new Error('No file provided');
    }

    if (typeof pdfjsLib === 'undefined') {
      throw new Error('PDF.js library not loaded');
    }

    try {
      let pdf;
      if (this._cachedFile === file && this._cachedPdfjsDoc) {
        pdf = this._cachedPdfjsDoc;
      } else {
        this.clearCache();
        const arrayBuffer = await file.arrayBuffer();
        pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        this._cachedPdfjsDoc = pdf;
        this._cachedFile = file;
      }
      const page = await pdf.getPage(pageIndex + 1);

      const viewport = page.getViewport({ scale });

      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      const renderContext = {
        canvasContext: context,
        viewport: viewport
      };

      await page.render(renderContext).promise;
      return canvas.toDataURL(format, 0.92);
    } catch (error) {
      console.error('Error in renderPageToImage:', error);
      throw error;
    }
  }

  /**
   * Get width and height of a page in PDF points
   * @param {File} file - PDF File object
   * @param {number} pageIndex - Page index (0-based)
   * @returns {Promise<{width: number, height: number}>} - Dimensions
   */
  async getPageSize(file, pageIndex) {
    if (!file) {
      throw new Error('No file provided');
    }
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    const page = pdfDoc.getPage(pageIndex);
    return {
      width: page.getWidth(),
      height: page.getHeight()
    };
  }

  /**
   * Crop pages of a PDF file
   * @param {File} file - PDF File object
   * @param {Object} cropBounds - Crop bounds {left, top, width, height} as fractions from 0 to 1
   * @param {Object} scopeOptions - Scope options {scope, currentPage, range}
   * @returns {Promise<Uint8Array>} - Cropped PDF bytes
   */
  async cropPDF(file, cropBounds, scopeOptions = {}) {
    if (!file) {
      throw new Error('No file provided');
    }

    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    const totalPages = pdfDoc.getPageCount();

    // Determine which pages to crop
    let pagesToCrop = [];
    const scope = scopeOptions.scope || 'current';

    if (scope === 'current') {
      const curr = scopeOptions.currentPage || 1;
      if (curr >= 1 && curr <= totalPages) {
        pagesToCrop.push(curr - 1);
      }
    } else if (scope === 'all') {
      pagesToCrop = Array.from({ length: totalPages }, (_, i) => i);
    } else if (scope === 'range') {
      const rangeString = scopeOptions.range || '';
      const { parsePageRange } = await import('../utils/rangeParser.js');
      const pageIndices = parsePageRange(rangeString, totalPages);
      pagesToCrop = pageIndices;
    }

    if (pagesToCrop.length === 0) {
      throw new Error('No pages selected for cropping');
    }

    const { left, top, width: wFrac, height: hFrac } = cropBounds;

    pagesToCrop.forEach(pageIndex => {
      const page = pdfDoc.getPage(pageIndex);
      const pageWidth = page.getWidth();
      const pageHeight = page.getHeight();

      // Map relative coordinates to absolute PDF points (starts from bottom-left)
      const x = Math.max(0, Math.min(left, 1)) * pageWidth;
      const width = Math.max(0, Math.min(wFrac, 1 - left)) * pageWidth;
      const height = Math.max(0, Math.min(hFrac, 1 - top)) * pageHeight;
      const y = Math.max(0, Math.min(1 - top - hFrac, 1)) * pageHeight;

      // Apply crop bounds to crop box and media box
      page.setCropBox(x, y, width, height);
      page.setMediaBox(x, y, width, height);
    });

    return await pdfDoc.save();
  }

  /**
   * Check if a PDF file is password protected/encrypted
   * @param {File} file - PDF File object
   * @returns {Promise<{encrypted: boolean, algorithm?: string, version?: number, revision?: number, keyLength?: number}>}
   */
  async checkEncryption(file) {
    if (!file) {
      throw new Error('No file provided');
    }
    const arrayBuffer = await file.arrayBuffer();
    return await isEncrypted(new Uint8Array(arrayBuffer));
  }

  /**
   * Decrypt/unlock a password-protected PDF
   * @param {File} file - PDF File object
   * @param {string} password - PDF password
   * @returns {Promise<Uint8Array>} - Decrypted PDF bytes
   */
  async unlockPDF(file, password) {
    if (!file) {
      throw new Error('No file provided');
    }
    const arrayBuffer = await file.arrayBuffer();
    return await decryptPDF(new Uint8Array(arrayBuffer), password);
  }

  /**
   * Encrypt/protect a PDF file with a password
   * @param {File} file - PDF File object
   * @param {Object} options - Encryption options
   * @returns {Promise<Uint8Array>} - Encrypted PDF bytes
   */
  async protectPDF(file, options) {
    if (!file) {
      throw new Error('No file provided');
    }
    const arrayBuffer = await file.arrayBuffer();
    return await encryptPDF(new Uint8Array(arrayBuffer), options);
  }

  /**
   * Repair a corrupted PDF file client-side
   * @param {File} file - PDF File object
   * @param {Object} options - Repair settings { optimizeLayout: boolean }
   * @returns {Promise<Uint8Array>} - Repaired PDF bytes
   */
  async repairPDF(file, options = {}) {
    if (!file) {
      throw new Error('No file provided');
    }
    const arrayBuffer = await file.arrayBuffer();
    const inputBytes = new Uint8Array(arrayBuffer);
    
    // 1. Run the structural repair engine
    let repairedBytes = repairPDF(inputBytes);
    
    // 2. Optional: Load and save via pdf-lib to rebuild layout streams and prune dead references
    if (options.optimizeLayout !== false) {
      try {
        const pdfDoc = await PDFDocument.load(repairedBytes, {
          ignoreEncryption: true,
          updateMetadata: false
        });
        repairedBytes = await pdfDoc.save({ useObjectStreams: false });
      } catch (err) {
        console.warn('pdf-lib optimization failed; returning structurally repaired bytes directly:', err);
      }
    }
    
    return repairedBytes;
  }

  /**
   * Extract metadata properties from a PDF file
   * @param {File} file - PDF File object
   * @returns {Promise<Object>} - Metadata object { title, author, subject, keywords }
   */
  async getPDFMetadata(file) {
    if (!file) {
      throw new Error('No file provided');
    }
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer, {
        ignoreEncryption: true,
        updateMetadata: false
      });
      return {
        title: pdfDoc.getTitle() || '',
        author: pdfDoc.getAuthor() || '',
        subject: pdfDoc.getSubject() || '',
        keywords: pdfDoc.getKeywords() || ''
      };
    } catch (error) {
      if (error.message?.toLowerCase().includes('encrypt') || error.message?.toLowerCase().includes('password') || error.name === 'PasswordException') {
        throw new Error('This PDF is password-protected. Please decrypt it under the Unlock tab first.');
      }
      throw error;
    }
  }

  /**
   * Update metadata properties of a PDF file
   * @param {File} file - PDF File object
   * @param {Object} metadata - Metadata values { title, author, subject, keywords }
   * @returns {Promise<Uint8Array>} - Updated PDF bytes
   */
  async updatePDFMetadata(file, metadata) {
    if (!file) {
      throw new Error('No file provided');
    }
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer, {
      ignoreEncryption: true,
      updateMetadata: false
    });

    if (metadata.title !== undefined) pdfDoc.setTitle(metadata.title);
    if (metadata.author !== undefined) pdfDoc.setAuthor(metadata.author);
    if (metadata.subject !== undefined) pdfDoc.setSubject(metadata.subject);
    
    if (metadata.keywords !== undefined) {
      const keywordsArray = metadata.keywords
        .split(/[\s,;]+/)
        .map(k => k.trim())
        .filter(k => k !== '');
      pdfDoc.setKeywords(keywordsArray);
    }

    return await pdfDoc.save({ useObjectStreams: false });
  }

  /**
   * Compress PDF size client-side
   * @param {File} file - PDF File object
   * @param {string} level - Compression level ('low', 'medium', 'high')
   * @returns {Promise<Uint8Array>} - Compressed PDF bytes
   */
  async compressPDF(file, level = 'medium') {
    if (!file) {
      throw new Error('No file provided');
    }
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer, {
      ignoreEncryption: true,
      updateMetadata: false
    });

    // Object streams compression (lossless)
    const saveOptions = {
      useObjectStreams: true
    };
    
    return await pdfDoc.save(saveOptions);
  }

  /**
   * Add text watermark or page numbers to PDF
   * @param {File} file - PDF File object
   * @param {Object} options - Watermark / Page numbering options
   * @returns {Promise<Uint8Array>} - Updated PDF bytes
   */
  async watermarkPDF(file, options) {
    if (!file) {
      throw new Error('No file provided');
    }
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer, {
      ignoreEncryption: true,
      updateMetadata: false
    });

    const {
      addText,
      addNumbers,
      mode,
      text,
      fontSize,
      rotation,
      colorHex,
      opacity,
      format,
      align,
      startNumber,
      margin,
      numColorHex,
      numFontSize
    } = options;

    // Backward compatibility with legacy mode string parameter
    let shouldAddText = addText;
    let shouldAddNumbers = addNumbers;
    if (mode === 'text') {
      shouldAddText = true;
      shouldAddNumbers = false;
    } else if (mode === 'number') {
      shouldAddText = false;
      shouldAddNumbers = true;
    }

    if (shouldAddText) {
      const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const pages = pdfDoc.getPages();
      const opacityVal = (opacity !== undefined ? opacity : 30) / 100;
      const rotDeg = rotation !== undefined ? rotation : 45;
      const size = fontSize || 60;
      const txt = text || 'DRAFT';
      const { r, g, b } = hexToRgb(colorHex || '#ff0000');

      for (const page of pages) {
        const { width, height } = page.getSize();
        const textWidth = font.widthOfTextAtSize(txt, size);
        const textHeight = font.heightAtSize(size);
        
        const x = width / 2;
        const y = height / 2;
        
        const radians = (rotDeg * Math.PI) / 180;
        const cos = Math.cos(radians);
        const sin = Math.sin(radians);
        
        page.drawText(txt, {
          x: x - (textWidth / 2) * cos + (textHeight / 2) * sin,
          y: y - (textWidth / 2) * sin - (textHeight / 2) * cos,
          size: size,
          font: font,
          color: rgb(r, g, b),
          opacity: opacityVal,
          rotate: degrees(rotDeg),
        });
      }
    }

    if (shouldAddNumbers) {
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const pages = pdfDoc.getPages();
      const totalPages = pages.length;
      const startNum = startNumber !== undefined ? parseInt(startNumber, 10) : 1;
      const mgn = margin !== undefined ? parseInt(margin, 10) : 36;
      const size = numFontSize || fontSize || 10;
      const fmt = format || 'Page X of Y';
      const aln = align || 'bottom-center';
      const { r, g, b } = hexToRgb(numColorHex || colorHex || '#000000');

      for (let i = 0; i < totalPages; i++) {
        const page = pages[i];
        const { width, height } = page.getSize();
        const pageNum = startNum + i;
        
        const txt = fmt
          .replace('X', pageNum.toString())
          .replace('Y', totalPages.toString());
        
        const textWidth = font.widthOfTextAtSize(txt, size);
        const textHeight = font.heightAtSize(size);
        
        let x = 0;
        let y = 0;
        
        switch (aln) {
          case 'top-left':
            x = mgn;
            y = height - mgn - textHeight;
            break;
          case 'top-center':
            x = (width - textWidth) / 2;
            y = height - mgn - textHeight;
            break;
          case 'top-right':
            x = width - mgn - textWidth;
            y = height - mgn - textHeight;
            break;
          case 'bottom-left':
            x = mgn;
            y = mgn;
            break;
          case 'bottom-center':
            x = (width - textWidth) / 2;
            y = mgn;
            break;
          case 'bottom-right':
            x = width - mgn - textWidth;
            y = mgn;
            break;
          default:
            x = (width - textWidth) / 2;
            y = mgn;
        }
        
        page.drawText(txt, {
          x: x,
          y: y,
          size: size,
          font: font,
          color: rgb(r, g, b),
          opacity: 1.0,
        });
      }
    }

    return await pdfDoc.save();
  }
}

/**
 * Helper to convert hex color to RGB percentage values (0.0 to 1.0)
 */
function hexToRgb(hex) {
  const cleanHex = hex.replace(/^#/, '');
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255;
  return { r, g, b };
}

/**
 * Helper to convert any browser-supported image file into standard PNG bytes
 */
async function convertImageToPngBytes(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = function(e) {
      const img = new Image();
      img.onload = function() {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          canvas.toBlob((blob) => {
            if (!blob) {
              reject(new Error('Failed to convert image to Blob'));
              return;
            }
            const reader2 = new FileReader();
            reader2.onload = () => resolve(new Uint8Array(reader2.result));
            reader2.onerror = () => reject(new Error('Failed to read image Blob'));
            reader2.readAsArrayBuffer(blob);
          }, 'image/png');
        } catch (err) {
          reject(err);
        }
      };
      img.onerror = () => reject(new Error('Failed to load image file'));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.readAsDataURL(file);
  });
}

// Export singleton instance
export default new PDFService();
