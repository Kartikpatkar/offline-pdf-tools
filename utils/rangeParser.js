/**
 * Range Parser Utility
 * Parses page range strings like "1-3,5,7-10" into page indices
 */

/**
 * Parse page range string into array of 0-indexed page numbers
 * @param {string} rangeString - Range like "1-3,5,7-10"
 * @param {number} totalPages - Total pages in PDF
 * @returns {number[]} - Array of 0-indexed page numbers
 */
export function parsePageRange(rangeString, totalPages) {
  if (!rangeString || typeof rangeString !== 'string') {
    throw new Error('Invalid range string');
  }

  const pageSet = new Set();
  const parts = rangeString.split(',').map(s => s.trim()).filter(s => s);

  for (const part of parts) {
    if (part.includes('-')) {
      // Range like "1-3" or "7-10"
      const [startStr, endStr] = part.split('-').map(s => s.trim());
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);

      if (isNaN(start) || isNaN(end)) {
        throw new Error(`Invalid range: ${part}`);
      }

      if (start > end) {
        throw new Error(`Invalid range: ${part} (start > end)`);
      }

      for (let i = start; i <= end; i++) {
        if (i >= 1 && i <= totalPages) {
          pageSet.add(i - 1); // Convert to 0-indexed
        }
      }
    } else {
      // Single page like "5"
      const pageNum = parseInt(part, 10);
      
      if (isNaN(pageNum)) {
        throw new Error(`Invalid page number: ${part}`);
      }

      if (pageNum >= 1 && pageNum <= totalPages) {
        pageSet.add(pageNum - 1); // Convert to 0-indexed
      }
    }
  }

  // Return sorted array
  return Array.from(pageSet).sort((a, b) => a - b);
}

/**
 * Validate if a page range string is syntactically correct
 * @param {string} rangeString - Range string to validate
 * @returns {boolean} - True if valid syntax
 */
export function isValidRangeSyntax(rangeString) {
  if (!rangeString || typeof rangeString !== 'string') {
    return false;
  }

  // Allow digits, commas, hyphens, and spaces only
  const validPattern = /^[\d,\s-]+$/;
  if (!validPattern.test(rangeString)) {
    return false;
  }

  // Check for common errors
  if (rangeString.includes('--') || rangeString.includes(',,')) {
    return false;
  }

  return true;
}

/**
 * Format page indices back to human-readable range
 * @param {number[]} indices - Array of 0-indexed page numbers
 * @returns {string} - Formatted range like "1-3,5,7-10"
 */
export function formatPageRange(indices) {
  if (!indices || indices.length === 0) {
    return '';
  }

  // Convert to 1-indexed and sort
  const pages = [...indices].map(i => i + 1).sort((a, b) => a - b);
  
  const ranges = [];
  let start = pages[0];
  let end = pages[0];

  for (let i = 1; i < pages.length; i++) {
    if (pages[i] === end + 1) {
      // Continue range
      end = pages[i];
    } else {
      // Break in sequence, add previous range
      ranges.push(start === end ? `${start}` : `${start}-${end}`);
      start = pages[i];
      end = pages[i];
    }
  }

  // Add final range
  ranges.push(start === end ? `${start}` : `${start}-${end}`);

  return ranges.join(',');
}
