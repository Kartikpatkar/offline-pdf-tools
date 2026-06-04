/**
 * @pdfsmaller/pdf-repair — PDF structural recovery and repair
 *
 * Reconstructs cross-reference (xref) tables, strips leading/trailing garbage,
 * recovers missing endobj delimiters, and generates valid trailer dictionaries.
 * Works 100% offline, in-memory using Web APIs.
 */

/**
 * Robust check to determine if an object contains a stream keyword and locate its end
 */
function findObjectEnd(cleanPdfStr, startOffset, nextObjStart) {
  const subStr = cleanPdfStr.slice(startOffset, nextObjStart);
  
  // Look for the "stream" keyword as a whole word
  const streamMatch = subStr.match(/\bstream\b/);
  if (streamMatch) {
    const streamIdx = streamMatch.index;
    // Search for "endstream" after the stream start
    const endStreamMatch = subStr.slice(streamIdx).match(/\bendstream\b/);
    if (endStreamMatch) {
      const endStreamIdx = streamIdx + endStreamMatch.index + 9;
      // Search for "endobj" after "endstream"
      const endObjMatch = subStr.slice(endStreamIdx).match(/\bendobj\b/);
      if (endObjMatch) {
        return {
          endOffset: startOffset + endStreamIdx + endObjMatch.index + 6,
          hasEndObj: true
        };
      } else {
        // Stream end found but missing "endobj"
        return {
          endOffset: startOffset + endStreamIdx,
          hasEndObj: false
        };
      }
    }
  }

  // Non-stream case: search for "endobj"
  const endObjMatch = subStr.match(/\bendobj\b/);
  if (endObjMatch) {
    return {
      endOffset: startOffset + endObjMatch.index + 6,
      hasEndObj: true
    };
  }

  // Fallback: Bound the object at the next object's start
  return {
    endOffset: nextObjStart,
    hasEndObj: false
  };
}

/**
 * Reconstruct a malformed PDF structure
 *
 * @param {Uint8Array} pdfBytes - Corrupted PDF bytes
 * @returns {Uint8Array} - Re-serialized, structurally valid PDF bytes
 */
export function repairPDF(pdfBytes) {
  // 1. Decode to latin1 string to preserve binary stream bytes (1 char = 1 byte)
  const pdfStr = new TextDecoder('latin1').decode(pdfBytes);

  // 2. Find and slice leading garbage (strip bytes before %PDF)
  const pdfHeaderIndex = pdfStr.indexOf('%PDF-');
  if (pdfHeaderIndex === -1) {
    throw new Error('Not a valid PDF file (Header "%PDF-" not found).');
  }
  const cleanPdfStr = pdfHeaderIndex > 0 ? pdfStr.slice(pdfHeaderIndex) : pdfStr;

  // 3. Scan for all indirect object declarations
  const objRegex = /(\d+)\s+(\d+)\s+obj/g;
  const objects = [];
  let match;

  while ((match = objRegex.exec(cleanPdfStr)) !== null) {
    const objId = parseInt(match[1], 10);
    const genId = parseInt(match[2], 10);
    const matchStart = match.index;
    const objKeywordEnd = matchStart + match[0].length;

    objects.push({
      objId,
      genId,
      matchStart,
      objKeywordEnd
    });
  }

  if (objects.length === 0) {
    throw new Error('No PDF objects could be resolved in the document.');
  }

  // Sort objects by their starting index (should already be sorted, but enforce it)
  objects.sort((a, b) => a.matchStart - b.matchStart);

  // 4. Extract object contents and repair boundaries
  for (let i = 0; i < objects.length; i++) {
    const current = objects[i];
    const nextStart = (i < objects.length - 1) ? objects[i + 1].matchStart : cleanPdfStr.length;

    const { endOffset, hasEndObj } = findObjectEnd(cleanPdfStr, current.objKeywordEnd, nextStart);
    
    // Slice the object body (excluding the "endobj" keyword if present)
    const bodyLength = endOffset - current.objKeywordEnd - (hasEndObj ? 6 : 0);
    current.body = cleanPdfStr.slice(current.objKeywordEnd, current.objKeywordEnd + bodyLength).trim();
  }

  // 5. Locate the Catalog root object reference
  let rootCatalogRef = null;

  // Attempt 1: Search the original string for a /Root reference
  const rootMatch = cleanPdfStr.match(/\/Root\s*(\d+\s+\d+\s+R)/);
  if (rootMatch) {
    rootCatalogRef = rootMatch[1].trim();
  } else {
    // Attempt 2: Search objects for /Type /Catalog
    for (const obj of objects) {
      if (/\/Type\s*\/Catalog/.test(obj.body)) {
        rootCatalogRef = `${obj.objId} 0 R`;
        break;
      }
    }
  }

  // Attempt 3: If still not found, default to object 1 0 R if it exists
  if (!rootCatalogRef && objects.length > 0) {
    const hasObj1 = objects.some(o => o.objId === 1);
    rootCatalogRef = hasObj1 ? '1 0 R' : `${objects[0].objId} 0 R`;
  }

  // Extract encryption reference if the document was encrypted
  const encryptMatch = cleanPdfStr.match(/\/Encrypt\s*(\d+\s+\d+\s+R)/);
  const encryptRef = encryptMatch ? encryptMatch[1].trim() : null;

  // Extract document info reference if present
  const infoMatch = cleanPdfStr.match(/\/Info\s*(\d+\s+\d+\s+R)/);
  const infoRef = infoMatch ? infoMatch[1].trim() : null;

  // Extract document ID if present
  const idMatch = cleanPdfStr.match(/\/ID\s*(\[[^\]]+\])/);
  const idVal = idMatch ? idMatch[1].trim() : null;

  // 6. Re-serialize objects and build clean xref table
  let rebuilt = '%PDF-1.7\n%\u00E2\u00E3\u00CF\u00D3\n';
  const maxObjId = objects.reduce((max, obj) => Math.max(max, obj.objId), 0);
  
  const xrefEntries = new Array(maxObjId + 1);
  for (let i = 0; i <= maxObjId; i++) {
    xrefEntries[i] = { offset: 0, gen: 65535, free: true };
  }

  for (const obj of objects) {
    const currentOffset = rebuilt.length;
    xrefEntries[obj.objId] = { offset: currentOffset, gen: obj.genId, free: false };

    rebuilt += `${obj.objId} ${obj.genId} obj\n`;
    rebuilt += obj.body;
    rebuilt += '\nendobj\n';
  }

  // 7. Write cross-reference table
  const xrefOffset = rebuilt.length;
  rebuilt += 'xref\n';
  rebuilt += `0 ${maxObjId + 1}\n`;
  rebuilt += '0000000000 65535 f \n';

  for (let i = 1; i <= maxObjId; i++) {
    const entry = xrefEntries[i];
    if (entry.free) {
      rebuilt += '0000000000 65535 f \n';
    } else {
      const offsetStr = String(entry.offset).padStart(10, '0');
      const genStr = String(entry.gen).padStart(5, '0');
      rebuilt += `${offsetStr} ${genStr} n \n`;
    }
  }

  // 8. Write trailer
  let trailerDict = `<<\n  /Size ${maxObjId + 1}\n`;
  if (rootCatalogRef) {
    trailerDict += `  /Root ${rootCatalogRef}\n`;
  }
  if (encryptRef) {
    trailerDict += `  /Encrypt ${encryptRef}\n`;
  }
  if (infoRef) {
    trailerDict += `  /Info ${infoRef}\n`;
  }
  if (idVal) {
    trailerDict += `  /ID ${idVal}\n`;
  }
  trailerDict += '>>';

  rebuilt += `trailer\n${trailerDict}\n`;
  rebuilt += 'startxref\n';
  rebuilt += `${xrefOffset}\n`;
  rebuilt += '%%EOF\n';

  // 9. Convert reconstructed latin1 string back to Uint8Array bytes
  const rebuiltBytes = new Uint8Array(rebuilt.length);
  for (let i = 0; i < rebuilt.length; i++) {
    rebuiltBytes[i] = rebuilt.charCodeAt(i);
  }

  return rebuiltBytes;
}
