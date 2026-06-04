/**
 * @pdfsmaller/pdf-encrypt — PDF encryption with AES-256 support
 *
 * Implements:
 *   - AES-256 (V=5, R=6) per ISO 32000-2:2020 — Algorithms 2.B, 11, 12, 13
 *
 * Companion to @pdfsmaller/pdf-decrypt
 * Verified against mozilla/pdf.js and Adobe Acrobat
 */

import { PDFDocument, PDFName, PDFHexString, PDFString, PDFDict, PDFArray, PDFRawStream, PDFNumber, PDFBool } from '../pdf-lib.esm.js';
import { bytesToHex } from './crypto-rc4.js';
import {
  computeHash2B, concat,
  aes256CbcEncrypt, aes256CbcEncryptNoPad, aes256EcbEncryptBlock
} from './crypto-aes.js';

/**
 * Truncate password to 127 bytes (UTF-8) per PDF 2.0 spec
 */
function saslPrepPassword(password) {
  const bytes = new TextEncoder().encode(password);
  return bytes.length > 127 ? bytes.slice(0, 127) : bytes;
}

/**
 * Generate 16-byte permissions block for AES-256 validation
 */
function generatePermsBlock(permissions, encryptMetadata) {
  const perms = new Uint8Array(16);
  
  // Bytes 0-3: permissions (little-endian)
  perms[0] = permissions & 0xFF;
  perms[1] = (permissions >> 8) & 0xFF;
  perms[2] = (permissions >> 16) & 0xFF;
  perms[3] = (permissions >> 24) & 0xFF;
  
  // Bytes 4-7: 0xFF
  perms[4] = 0xFF;
  perms[5] = 0xFF;
  perms[6] = 0xFF;
  perms[7] = 0xFF;
  
  // Byte 8: 'T' (0x54) or 'F' (0x46)
  perms[8] = encryptMetadata ? 0x54 : 0x46;
  
  // Bytes 9-11: 'a', 'd', 'b'
  perms[9] = 0x61;
  perms[10] = 0x64;
  perms[11] = 0x62;
  
  // Bytes 12-15: random bytes
  crypto.getRandomValues(perms.subarray(12, 16));
  
  return perms;
}

/**
 * Recursively collect encryptable strings from a PDF object
 */
function collectStringsFromObject(obj, items) {
  if (!obj) return;

  if (obj instanceof PDFString) {
    const bytes = obj.asBytes();
    if (bytes.length > 0) {
      items.push({ obj, bytes, type: 'string' });
    }
  } else if (obj instanceof PDFHexString) {
    const bytes = obj.asBytes();
    if (bytes.length > 0) {
      items.push({ obj, bytes, type: 'hex' });
    }
  } else if (obj instanceof PDFDict) {
    for (const [key, value] of obj.entries()) {
      const keyName = key.asString();
      // Skip encryption-related entries
      if (keyName !== '/Length' && keyName !== '/Filter' && keyName !== '/DecodeParms') {
        collectStringsFromObject(value, items);
      }
    }
  } else if (obj instanceof PDFArray) {
    for (const element of obj.asArray()) {
      collectStringsFromObject(element, items);
    }
  }
}

/**
 * Collect all encryptable streams and strings from PDF document
 */
function collectEncryptableItems(context, encryptMetadata) {
  const streamItems = [];
  const stringItems = [];
  const indirectObjects = context.enumerateIndirectObjects();

  for (const [ref, obj] of indirectObjects) {
    const objectNum = ref.objectNumber;
    const generationNum = ref.generationNumber || 0;

    // Skip signature dictionaries
    if (obj instanceof PDFDict && !(obj instanceof PDFRawStream)) {
      const type = obj.get(PDFName.of('Type'));
      if (type && type.toString() === '/Sig') continue;
    }

    // Skip streams we shouldn't encrypt
    if (obj instanceof PDFRawStream && obj.dict) {
      const type = obj.dict.get(PDFName.of('Type'));
      if (type) {
        const typeName = type.toString();
        if (typeName === '/XRef') continue;
        if (typeName === '/Sig') continue;
        if (typeName === '/Metadata' && !encryptMetadata) continue;
      }
    }

    // Collect streams
    if (obj instanceof PDFRawStream) {
      const streamData = obj.contents;
      if (streamData.length > 0) {
        streamItems.push({ ref, obj, data: streamData, objectNum, generationNum });
      }

      // Collect strings inside stream dictionaries
      if (obj.dict) {
        collectStringsFromObject(obj.dict, stringItems);
      }
    }

    // Collect strings in non-stream objects
    if (!(obj instanceof PDFRawStream)) {
      collectStringsFromObject(obj, stringItems);
    }
  }

  return { streamItems, stringItems };
}

/**
 * Encrypt a PDF file using standard AES-256 (V=5, R=6) encryption
 *
 * @param {Uint8Array} pdfBytes - The input unencrypted PDF bytes
 * @param {Object} options - Encryption settings
 * @param {string} [options.userPassword] - Password required to open the PDF
 * @param {string} [options.ownerPassword] - Password required to restrict permissions
 * @param {number} [options.permissions] - Signed 32-bit permission flags (default: -4 for full permission)
 * @param {boolean} [options.encryptMetadata] - Whether to encrypt the document metadata (default: true)
 * @returns {Promise<Uint8Array>} - The encrypted PDF bytes
 */
export async function encryptPDF(pdfBytes, options = {}) {
  const {
    userPassword = '',
    ownerPassword = '',
    permissions = -4,
    encryptMetadata = true
  } = options;

  // If no passwords are provided and permissions are unrestricted, return original bytes
  if (!userPassword && !ownerPassword && permissions === -4) {
    return pdfBytes;
  }

  // Load the PDF
  const pdfDoc = await PDFDocument.load(pdfBytes, {
    ignoreEncryption: true,
    updateMetadata: false
  });

  const context = pdfDoc.context;

  // 1. Generate random 32-byte fileKey (FEK)
  const fileKey = new Uint8Array(32);
  crypto.getRandomValues(fileKey);

  // 2. Generate random 8-byte salts
  const uValidationSalt = new Uint8Array(8);
  const uKeySalt = new Uint8Array(8);
  const oValidationSalt = new Uint8Array(8);
  const oKeySalt = new Uint8Array(8);

  crypto.getRandomValues(uValidationSalt);
  crypto.getRandomValues(uKeySalt);
  crypto.getRandomValues(oValidationSalt);
  crypto.getRandomValues(oKeySalt);

  // 3. Compute U and UE
  const uPassBytes = saslPrepPassword(userPassword);
  const uHash = await computeHash2B(uPassBytes, uValidationSalt, new Uint8Array(0));
  const U = concat(uHash, uValidationSalt, uKeySalt);

  const ueKey = await computeHash2B(uPassBytes, uKeySalt, new Uint8Array(0));
  const zeroIV = new Uint8Array(16);
  const UE = await aes256CbcEncryptNoPad(fileKey, ueKey, zeroIV);

  // 4. Compute O and OE (fallback to user password if owner password not provided)
  const oPassBytes = saslPrepPassword(ownerPassword || userPassword);
  const oHash = await computeHash2B(oPassBytes, oValidationSalt, U);
  const O = concat(oHash, oValidationSalt, oKeySalt);

  const oeKey = await computeHash2B(oPassBytes, oKeySalt, U);
  const OE = await aes256CbcEncryptNoPad(fileKey, oeKey, zeroIV);

  // 5. Compute Perms
  const permsBlock = generatePermsBlock(permissions, encryptMetadata);
  const Perms = await aes256EcbEncryptBlock(permsBlock, fileKey);

  // 6. Collect encryptable streams/strings
  const { streamItems, stringItems } = collectEncryptableItems(context, encryptMetadata);

  // 7. Encrypt streams and strings
  const cryptoKey = await crypto.subtle.importKey('raw', fileKey, 'AES-CBC', false, ['encrypt']);

  // Encrypt streams
  for (const item of streamItems) {
    const originalData = item.data;
    const iv = new Uint8Array(16);
    crypto.getRandomValues(iv);

    const encrypted = await crypto.subtle.encrypt({ name: 'AES-CBC', iv }, cryptoKey, originalData);
    const encryptedBytes = new Uint8Array(encrypted);

    // Replace stream content with IV (16-bytes) + Ciphertext
    item.obj.contents = concat(iv, encryptedBytes);
  }

  // Encrypt strings
  for (const item of stringItems) {
    const originalBytes = item.bytes;
    const iv = new Uint8Array(16);
    crypto.getRandomValues(iv);

    const encrypted = await crypto.subtle.encrypt({ name: 'AES-CBC', iv }, cryptoKey, originalBytes);
    const encryptedBytes = new Uint8Array(encrypted);

    const output = concat(iv, encryptedBytes);

    if (item.type === 'string') {
      item.obj.value = Array.from(output).map(b => String.fromCharCode(b)).join('');
    } else {
      item.obj.value = bytesToHex(output);
    }
  }

  // 8. Create and register the /Encrypt dictionary
  const encryptDict = context.obj({
    Filter: PDFName.of('Standard'),
    StmF: PDFName.of('StdCF'),
    StrF: PDFName.of('StdCF'),
    EFF: PDFName.of('StdCF'),
    V: PDFNumber.of(5),
    R: PDFNumber.of(6),
    Length: PDFNumber.of(256),
    P: PDFNumber.of(permissions),
    O: PDFHexString.of(bytesToHex(O)),
    U: PDFHexString.of(bytesToHex(U)),
    OE: PDFHexString.of(bytesToHex(OE)),
    UE: PDFHexString.of(bytesToHex(UE)),
    Perms: PDFHexString.of(bytesToHex(Perms)),
    CF: context.obj({
      StdCF: context.obj({
        CFM: PDFName.of('AESV3'),
        AuthEvent: PDFName.of('DocOpen'),
        Length: PDFNumber.of(256)
      })
    })
  });

  if (!encryptMetadata) {
    encryptDict.set(PDFName.of('EncryptMetadata'), PDFBool.False);
  }

  const encryptRef = context.register(encryptDict);
  context.trailerInfo.Encrypt = encryptRef;

  // Save the document without object streams
  const encryptedBytes = await pdfDoc.save({ useObjectStreams: false });
  return encryptedBytes;
}
