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

import { PDFDocument, degrees } from '../lib/pdf-lib.esm.js';

class PDFService {
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

    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    return pdfDoc.getPageCount();
  }
}

// Export singleton instance
export default new PDFService();
