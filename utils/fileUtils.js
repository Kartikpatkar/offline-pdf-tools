/**
 * File Utilities
 * Helper functions for file handling and download
 */

/**
 * Validate if file is a PDF
 * @param {File} file - File object to validate
 * @returns {boolean} - True if file is PDF
 */
export function isPDF(file) {
  if (!file || !(file instanceof File)) {
    return false;
  }
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
}

/**
 * Validate multiple files are PDFs
 * @param {File[]} files - Array of File objects
 * @returns {boolean} - True if all files are PDFs
 */
export function areAllPDFs(files) {
  if (!Array.isArray(files) || files.length === 0) {
    return false;
  }
  return files.every(isPDF);
}

/**
 * Format file size to human-readable string
 * @param {number} bytes - File size in bytes
 * @returns {string} - Formatted size (e.g., "1.5 MB")
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Download a PDF using Chrome's downloads API
 * @param {Uint8Array} pdfBytes - PDF data as byte array
 * @param {string} filename - Desired filename
 * @returns {Promise<void>}
 */
export async function downloadPDF(pdfBytes, filename) {
  if (!pdfBytes || !(pdfBytes instanceof Uint8Array)) {
    throw new Error('Invalid PDF data');
  }

  if (!filename) {
    filename = 'document.pdf';
  }

  // Ensure .pdf extension
  if (!filename.toLowerCase().endsWith('.pdf')) {
    filename += '.pdf';
  }

  // Create blob and object URL
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);

  try {
    // Use Chrome downloads API for extension
    if (chrome && chrome.downloads) {
      await chrome.downloads.download({
        url: url,
        filename: filename,
        saveAs: true
      });
    } else {
      // Fallback for testing outside extension context
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
    }
  } finally {
    // Clean up object URL after a delay
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}

/**
 * Generate a timestamped filename
 * @param {string} prefix - Filename prefix (e.g., "merged", "split")
 * @returns {string} - Filename with timestamp
 */
export function generateTimestampedFilename(prefix = 'document') {
  const now = new Date();
  const timestamp = now.toISOString()
    .replace(/:/g, '-')
    .replace(/\..+/, '')
    .replace('T', '_');
  return `${prefix}_${timestamp}.pdf`;
}

/**
 * Read file as ArrayBuffer
 * @param {File} file - File to read
 * @returns {Promise<ArrayBuffer>} - File contents as ArrayBuffer
 */
export function readFileAsArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Generate a filename based on original file with action prefix
 * @param {string} originalFilename - Original file name
 * @param {string} action - Action performed (e.g., "rotated", "split")
 * @returns {string} - Filename with action prefix
 */
export function generateActionFilename(originalFilename, action) {
  if (!originalFilename) return generateTimestampedFilename(action);
  
  const baseName = originalFilename.replace(/\.pdf$/i, '');
  const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '').replace('T', '_');
  return `${baseName}_${action}_${timestamp}.pdf`;
}
