/**
 * Main Application Logic
 * Handles UI interactions and coordinates PDF operations
 */

import pdfService from '../services/pdfService.js';
import { downloadPDF, generateTimestampedFilename, generateActionFilename, isPDF, areAllPDFs, formatFileSize } from '../utils/fileUtils.js';
import { parsePageRange, isValidRangeSyntax } from '../utils/rangeParser.js';

// Application State
const state = {
  currentTool: null,
  selectedFiles: [],
  fileMetadata: new Map(), // Store page counts for files
  pageCount: 0,
  selectedPages: new Set(),
  pageOrder: [],
  pageRotations: new Map(), // pageIndex -> rotation (0, 90, 180, 270)
  thumbnailImages: new Map(), // pageIndex -> Image object for redrawing
  keyboardSelectedReorderIndex: null,
  cropPreviewPage: 1,
  cropBounds: { left: 0, top: 0, width: 1, height: 1 },
  cropPageSizes: new Map(),
  isCurrentFileEncrypted: false,
  historyUndoStack: [],
  historyRedoStack: []
};

// DOM Elements
const elements = {
  toolTabs: document.querySelectorAll('.tool-tab'),
  toolCards: document.getElementById('toolCards'),
  toolDescription: document.getElementById('toolDescription'),
  uploadSection: document.getElementById('uploadSection'),
  uploadZone: document.getElementById('uploadZone'),
  fileInput: document.getElementById('fileInput'),
  filesAndOptionsContainer: document.getElementById('filesAndOptionsContainer'),
  fileListSection: document.getElementById('fileListSection'),
  fileItems: document.getElementById('fileItems'),
  fileCount: document.getElementById('fileCount'),
  clearFiles: document.getElementById('clearFiles'),
  addMoreFiles: document.getElementById('addMoreFiles'),
  uploadTitle: document.getElementById('uploadTitle'),
  toolOptions: document.getElementById('toolOptions'),
  splitOptions: document.getElementById('splitOptions'),
  extractOptions: document.getElementById('extractOptions'),
  rotateOptions: document.getElementById('rotateOptions'),
  deleteOptions: document.getElementById('deleteOptions'),
  reorderOptions: document.getElementById('reorderOptions'),
  extractPageSelector: document.getElementById('extractPageSelector'),
  rotatePageSelector: document.getElementById('rotatePageSelector'),
  deletePageSelector: document.getElementById('deletePageSelector'),
  reorderPageSelector: document.getElementById('reorderPageSelector'),
  actionSection: document.getElementById('actionSection'),
  processBtn: document.getElementById('processBtn'),
  btnText: document.getElementById('btnText'),
  processingOverlay: document.getElementById('processingOverlay'),
  toastContainer: document.getElementById('toastContainer'),
  pageRangeInput: document.getElementById('pageRangeInput'),
  totalPages: document.getElementById('totalPages'),
  imageToPdfOptions: document.getElementById('imageToPdfOptions'),
  pdfToImgOptions: document.getElementById('pdfToImgOptions'),
  pdfToImgPageSelector: document.getElementById('pdfToImgPageSelector'),
  imgPageSize: document.getElementById('imgPageSize'),
  imgOrientation: document.getElementById('imgOrientation'),
  imgMargin: document.getElementById('imgMargin'),
  imgAlignment: document.getElementById('imgAlignment'),
  pdfToImgFormat: document.getElementById('pdfToImgFormat'),
  pdfToImgScale: document.getElementById('pdfToImgScale'),
  cropOptions: document.getElementById('cropOptions'),
  cropPreviewContainer: document.getElementById('cropPreviewContainer'),
  cropPreviewCanvas: document.getElementById('cropPreviewCanvas'),
  cropOverlay: document.getElementById('cropOverlay'),
  cropPageSelect: document.getElementById('cropPageSelect'),
  cropMarginTop: document.getElementById('cropMarginTop'),
  cropMarginBottom: document.getElementById('cropMarginBottom'),
  cropMarginLeft: document.getElementById('cropMarginLeft'),
  cropMarginRight: document.getElementById('cropMarginRight'),
  cropScopeRange: document.getElementById('cropScopeRange'),
  unlockOptions: document.getElementById('unlockOptions'),
  unlockFileInfo: document.getElementById('unlockFileInfo'),
  unlockFileName: document.getElementById('unlockFileName'),
  unlockFileSize: document.getElementById('unlockFileSize'),
  unlockFileAlgorithm: document.getElementById('unlockFileAlgorithm'),
  unlockPasswordContainer: document.getElementById('unlockPasswordContainer'),
  unlockPassword: document.getElementById('unlockPassword'),
  toggleUnlockPasswordVisibility: document.getElementById('toggleUnlockPasswordVisibility'),
  unlockNotEncryptedInfo: document.getElementById('unlockNotEncryptedInfo'),
  protectOptions: document.getElementById('protectOptions'),
  protectRequireOpenPassword: document.getElementById('protectRequireOpenPassword'),
  protectOpenPasswordContainer: document.getElementById('protectOpenPasswordContainer'),
  protectOpenPassword: document.getElementById('protectOpenPassword'),
  toggleProtectOpenPasswordVisibility: document.getElementById('toggleProtectOpenPasswordVisibility'),
  protectRestrictPermissions: document.getElementById('protectRestrictPermissions'),
  protectPermissionsContainer: document.getElementById('protectPermissionsContainer'),
  protectPermissionsPassword: document.getElementById('protectPermissionsPassword'),
  toggleProtectPermissionsPasswordVisibility: document.getElementById('toggleProtectPermissionsPasswordVisibility'),
  protectAllowPrinting: document.getElementById('protectAllowPrinting'),
  protectAllowCopying: document.getElementById('protectAllowCopying'),
  protectAllowModifying: document.getElementById('protectAllowModifying'),
  protectAllowAnnotating: document.getElementById('protectAllowAnnotating'),
  protectEncryptMetadata: document.getElementById('protectEncryptMetadata'),
  repairOptions: document.getElementById('repairOptions'),
  repairOptimizeLayout: document.getElementById('repairOptimizeLayout'),
  metadataOptions: document.getElementById('metadataOptions'),
  metadataTitle: document.getElementById('metadataTitle'),
  metadataAuthor: document.getElementById('metadataAuthor'),
  metadataSubject: document.getElementById('metadataSubject'),
  metadataKeywords: document.getElementById('metadataKeywords'),
  
  // Compress Elements
  compressOptions: document.getElementById('compressOptions'),
  compressLevel: document.getElementById('compressLevel'),
  
  // Watermark Elements
  watermarkOptions: document.getElementById('watermarkOptions'),
  watermarkModeTextBtn: document.getElementById('watermarkModeTextBtn'),
  watermarkModeNumBtn: document.getElementById('watermarkModeNumBtn'),
  watermarkTextFields: document.getElementById('watermarkTextFields'),
  watermarkNumFields: document.getElementById('watermarkNumFields'),
  watermarkText: document.getElementById('watermarkText'),
  watermarkFontSize: document.getElementById('watermarkFontSize'),
  watermarkFontSizeVal: document.getElementById('watermarkFontSizeVal'),
  watermarkRotation: document.getElementById('watermarkRotation'),
  watermarkRotationVal: document.getElementById('watermarkRotationVal'),
  watermarkColor: document.getElementById('watermarkColor'),
  watermarkColorHex: document.getElementById('watermarkColorHex'),
  watermarkOpacity: document.getElementById('watermarkOpacity'),
  watermarkOpacityVal: document.getElementById('watermarkOpacityVal'),
  
  // Page Numbers Elements
  pageNumberFormat: document.getElementById('pageNumberFormat'),
  pageNumberAlign: document.getElementById('pageNumberAlign'),
  pageNumberStart: document.getElementById('pageNumberStart'),
  pageNumberColor: document.getElementById('pageNumberColor'),
  pageNumberColorHex: document.getElementById('pageNumberColorHex'),
  pageNumberFontSize: document.getElementById('pageNumberFontSize'),
  pageNumberFontSizeVal: document.getElementById('pageNumberFontSizeVal'),
  pageNumberMargin: document.getElementById('pageNumberMargin'),
  pageNumberMarginVal: document.getElementById('pageNumberMarginVal'),

  // Dim Previews
  dimToggle: document.getElementById('dimToggle'),

  // Undo/Redo
  undoBtn: document.getElementById('undoBtn'),
  redoBtn: document.getElementById('redoBtn'),

  // Blueprints
  blueprintBar: document.getElementById('blueprintBar'),
  blueprintSelect: document.getElementById('blueprintSelect'),
  saveBlueprintBtn: document.getElementById('saveBlueprintBtn'),
  deleteBlueprintBtn: document.getElementById('deleteBlueprintBtn'),

  // Scoreboard
  scoreboardFiles: document.getElementById('scoreboardFiles'),
  scoreboardSavings: document.getElementById('scoreboardSavings')
};

// Initialize App
async function init() {
  await loadPDFJS();
  setupEventListeners();
  // Set default tool to merge (matches the active tab in HTML)
  selectTool('merge');
  // Set current year in footer
  const currentYear = new Date().getFullYear();
  const yearElement = document.getElementById('currentYear');
  if (yearElement) {
    yearElement.textContent = currentYear;
  }

  // Initialize dim previews from saved state
  try {
    const savedDim = localStorage.getItem('dim_previews') === 'true';
    if (elements.dimToggle) {
      elements.dimToggle.checked = savedDim;
      toggleDimPreviews(savedDim);
    }
  } catch (e) {
    console.warn('Failed to load dim state:', e);
  }

  // Initialize privacy scoreboard
  displayPrivacyScore();

  console.log('Offline PDF Tools initialized - 100% private, 100% offline');
}

// Load PDF.js from extension resources
function loadPDFJS() {
  return new Promise((resolve, reject) => {
    let pdfjsUrl = '../lib/pdf.min.js';
    let workerUrl = '../lib/pdf.worker.min.js';

    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL) {
      try {
        pdfjsUrl = chrome.runtime.getURL('lib/pdf.min.js');
        workerUrl = chrome.runtime.getURL('lib/pdf.worker.min.js');
      } catch (e) {
        console.warn('Failed to get extension URLs, falling back to relative paths:', e);
      }
    }

    const pdfjsScript = document.createElement('script');
    pdfjsScript.src = pdfjsUrl;
    pdfjsScript.onload = function() {
      console.log('PDF.js script loaded');
      // Configure PDF.js worker after PDF.js loads
      if (typeof pdfjsLib !== 'undefined') {
        pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;
        console.log('PDF.js configured successfully, version:', pdfjsLib.version);
        window.pdfjsReady = true;
        resolve();
      } else {
        console.error('pdfjsLib not available after script load');
        reject(new Error('pdfjsLib not available after script load'));
      }
    };
    pdfjsScript.onerror = function(e) {
      console.error('Failed to load PDF.js script:', e);
      reject(new Error('Failed to load PDF.js script'));
    };
    document.head.appendChild(pdfjsScript);
  });
}

// Setup Event Listeners
function setupEventListeners() {
  // Tool selection (tabs)
  elements.toolTabs.forEach(tab => {
    tab.addEventListener('click', () => selectTool(tab.dataset.tool));
  });

  // File upload
  elements.uploadZone.addEventListener('click', () => elements.fileInput.click());
  elements.fileInput.addEventListener('change', handleFileSelect);
  
  // Drag and drop
  elements.uploadZone.addEventListener('dragover', handleDragOver);
  elements.uploadZone.addEventListener('dragleave', handleDragLeave);
  elements.uploadZone.addEventListener('drop', handleDrop);

  // Clear files
  elements.clearFiles.addEventListener('click', () => {
    if (state.selectedFiles.length > 0) {
      showConfirmModal(() => {
        clearFiles();
      });
    } else {
      clearFiles();
    }
  });

  // Add more files
  elements.addMoreFiles.addEventListener('click', () => elements.fileInput.click());

  // Process button
  elements.processBtn.addEventListener('click', processFiles);

  // Radio card selections
  document.addEventListener('click', (e) => {
    const radioCard = e.target.closest('.radio-card');
    if (radioCard) {
      const input = radioCard.querySelector('input[type="radio"]');
      if (input) {
        input.checked = true;
        document.querySelectorAll('.radio-card').forEach(card => {
          card.classList.remove('selected');
        });
        radioCard.classList.add('selected');
      }
    }

    // Tool help button toggle
    const helpBtn = e.target.closest('.tool-help-btn');
    if (helpBtn) {
      const targetId = helpBtn.getAttribute('data-target');
      const descElement = document.getElementById(targetId);
      if (descElement) {
        descElement.classList.toggle('hidden');
      }
    }
  });

  // Batch selection - Extract
  document.getElementById('extractSelectAll').addEventListener('click', () => {
    for (let i = 1; i <= state.pageCount; i++) state.selectedPages.add(i);
    updateSelectionUI('extractPageSelector');
  });
  document.getElementById('extractDeselectAll').addEventListener('click', () => {
    state.selectedPages.clear();
    updateSelectionUI('extractPageSelector');
  });
  document.getElementById('extractInvert').addEventListener('click', () => {
    for (let i = 1; i <= state.pageCount; i++) {
      if (state.selectedPages.has(i)) {
        state.selectedPages.delete(i);
      } else {
        state.selectedPages.add(i);
      }
    }
    updateSelectionUI('extractPageSelector');
  });

  // Batch selection - Delete
  document.getElementById('deleteSelectAll').addEventListener('click', () => {
    for (let i = 1; i <= state.pageCount; i++) state.selectedPages.add(i);
    updateSelectionUI('deletePageSelector');
  });
  document.getElementById('deleteDeselectAll').addEventListener('click', () => {
    state.selectedPages.clear();
    updateSelectionUI('deletePageSelector');
  });
  document.getElementById('deleteInvert').addEventListener('click', () => {
    for (let i = 1; i <= state.pageCount; i++) {
      if (state.selectedPages.has(i)) {
        state.selectedPages.delete(i);
      } else {
        state.selectedPages.add(i);
      }
    }
    updateSelectionUI('deletePageSelector');
  });

  // Batch rotation
  document.getElementById('rotateAllCW').addEventListener('click', () => {
    for (let i = 1; i <= state.pageCount; i++) {
      const current = state.pageRotations.get(i) || 0;
      state.pageRotations.set(i, (current + 90) % 360);
    }
    updateRotationUI();
  });
  document.getElementById('rotateAllCCW').addEventListener('click', () => {
    for (let i = 1; i <= state.pageCount; i++) {
      const current = state.pageRotations.get(i) || 0;
      state.pageRotations.set(i, (current - 90 + 360) % 360);
    }
    updateRotationUI();
  });
  document.getElementById('rotateReset').addEventListener('click', () => {
    for (let i = 1; i <= state.pageCount; i++) {
      state.pageRotations.set(i, 0);
    }
    updateRotationUI();
  });

  // Batch selection - PDF to Image
  document.getElementById('pdfToImgSelectAll').addEventListener('click', () => {
    for (let i = 1; i <= state.pageCount; i++) state.selectedPages.add(i);
    updateSelectionUI('pdfToImgPageSelector');
  });
  document.getElementById('pdfToImgDeselectAll').addEventListener('click', () => {
    state.selectedPages.clear();
    updateSelectionUI('pdfToImgPageSelector');
  });
  document.getElementById('pdfToImgInvert').addEventListener('click', () => {
    for (let i = 1; i <= state.pageCount; i++) {
      if (state.selectedPages.has(i)) {
        state.selectedPages.delete(i);
      } else {
        state.selectedPages.add(i);
      }
    }
    updateSelectionUI('pdfToImgPageSelector');
  });

  // Image to PDF option constraints
  if (elements.imgPageSize) {
    elements.imgPageSize.addEventListener('change', () => {
      const isFit = elements.imgPageSize.value === 'fit';
      elements.imgOrientation.disabled = isFit;
      elements.imgAlignment.disabled = isFit;
    });
  }

  // Setup Crop-specific listeners
  setupCropEventListeners();

  // Setup Unlock-specific listeners
  setupUnlockEventListeners();

  // Setup Protect-specific listeners
  setupProtectEventListeners();

  // Setup Undo/Redo button listeners
  if (elements.undoBtn) {
    elements.undoBtn.addEventListener('click', undo);
  }
  if (elements.redoBtn) {
    elements.redoBtn.addEventListener('click', redo);
  }

  // Setup Dim Previews listener
  if (elements.dimToggle) {
    elements.dimToggle.addEventListener('change', (e) => {
      toggleDimPreviews(e.target.checked);
    });
  }

  // Setup Action Blueprints listeners
  if (elements.saveBlueprintBtn) {
    elements.saveBlueprintBtn.addEventListener('click', saveBlueprint);
  }
  if (elements.blueprintSelect) {
    elements.blueprintSelect.addEventListener('change', (e) => {
      applyBlueprint(e.target.value);
    });
  }
  if (elements.deleteBlueprintBtn) {
    elements.deleteBlueprintBtn.addEventListener('click', deleteBlueprint);
  }

  // Setup Watermark color sync
  if (elements.watermarkColor && elements.watermarkColorHex) {
    elements.watermarkColor.addEventListener('input', (e) => {
      elements.watermarkColorHex.value = e.target.value;
    });
    elements.watermarkColorHex.addEventListener('input', (e) => {
      if (/^#[0-9A-F]{6}$/i.test(e.target.value)) {
        elements.watermarkColor.value = e.target.value;
      }
    });
  }
  if (elements.pageNumberColor && elements.pageNumberColorHex) {
    elements.pageNumberColor.addEventListener('input', (e) => {
      elements.pageNumberColorHex.value = e.target.value;
    });
    elements.pageNumberColorHex.addEventListener('input', (e) => {
      if (/^#[0-9A-F]{6}$/i.test(e.target.value)) {
        elements.pageNumberColor.value = e.target.value;
      }
    });
  }

  // Setup Watermark mode toggling (allows selecting both!)
  if (elements.watermarkModeTextBtn) {
    elements.watermarkModeTextBtn.addEventListener('click', () => {
      const active = elements.watermarkModeTextBtn.classList.toggle('selected');
      elements.watermarkTextFields.classList.toggle('hidden', !active);
    });
  }
  if (elements.watermarkModeNumBtn) {
    elements.watermarkModeNumBtn.addEventListener('click', () => {
      const active = elements.watermarkModeNumBtn.classList.toggle('selected');
      elements.watermarkNumFields.classList.toggle('hidden', !active);
    });
  }

  // Setup Watermark sliders value displays sync
  if (elements.watermarkFontSize && elements.watermarkFontSizeVal) {
    elements.watermarkFontSize.addEventListener('input', (e) => {
      elements.watermarkFontSizeVal.textContent = e.target.value + 'pt';
    });
  }
  if (elements.watermarkRotation && elements.watermarkRotationVal) {
    elements.watermarkRotation.addEventListener('input', (e) => {
      elements.watermarkRotationVal.textContent = e.target.value + '°';
    });
  }
  if (elements.watermarkOpacity && elements.watermarkOpacityVal) {
    elements.watermarkOpacity.addEventListener('input', (e) => {
      elements.watermarkOpacityVal.textContent = e.target.value + '%';
    });
  }
  if (elements.pageNumberFontSize && elements.pageNumberFontSizeVal) {
    elements.pageNumberFontSize.addEventListener('input', (e) => {
      elements.pageNumberFontSizeVal.textContent = e.target.value + 'pt';
    });
  }
  if (elements.pageNumberMargin && elements.pageNumberMarginVal) {
    elements.pageNumberMargin.addEventListener('input', (e) => {
      elements.pageNumberMarginVal.textContent = e.target.value + 'pt';
    });
  }
  // Category selection filtering
  const categoryTabs = document.querySelectorAll('.category-tab');
  if (categoryTabs.length > 0) {
    categoryTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        categoryTabs.forEach(t => t.classList.toggle('active', t === tab));
        
        const category = tab.dataset.category;
        
        const toolTabs = document.querySelectorAll('.tool-tab');
        toolTabs.forEach(toolTab => {
          if (category === 'all' || toolTab.dataset.category === category) {
            toolTab.classList.remove('hidden-filter');
          } else {
            toolTab.classList.add('hidden-filter');
          }
        });

        // Auto-select the first visible tool if active tool is hidden
        const activeTab = document.querySelector('.tool-tab.active');
        if (activeTab && activeTab.classList.contains('hidden-filter')) {
          const firstVisible = Array.from(toolTabs).find(t => !t.classList.contains('hidden-filter'));
          if (firstVisible) {
            selectTool(firstVisible.dataset.tool);
          }
        }
      });
    });
  }

  // Global keyboard shortcuts (Ctrl+Z, Ctrl+Y)
  document.addEventListener('keydown', (e) => {
    const isCmdOrCtrl = e.metaKey || e.ctrlKey;
    if (isCmdOrCtrl) {
      if (e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      } else if (e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
      }
    }
  });
}

// Tool Selection
function selectTool(tool) {
  state.currentTool = tool;
  
  // Update UI - update tabs
  elements.toolTabs.forEach(tab => {
    tab.classList.toggle('active', tab.dataset.tool === tool);
  });

  // Tool descriptions
  const toolInfo = {
    merge: {
      title: 'How it works',
      desc: 'Combine multiple PDF files into a single document. Simply upload your files and click merge!',
      icon: '<svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><use href="../assets/icons/icons.svg#icon-help"></use></svg>'
    },
    split: {
      title: 'How it works',
      desc: 'Extract specific page ranges into a new PDF. Use commas for individual pages and dashes for ranges.',
      icon: '<svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><use href="../assets/icons/icons.svg#icon-help"></use></svg>'
    },
    extract: {
      title: 'How it works',
      desc: 'Select individual pages to create a new PDF. Click on pages to toggle selection.',
      icon: '<svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><use href="../assets/icons/icons.svg#icon-help"></use></svg>'
    },
    rotate: {
      title: 'How it works',
      desc: 'Click the rotation button on each page to cycle through 0°, 90°, 180°, 270° rotations.',
      icon: '<svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><use href="../assets/icons/icons.svg#icon-help"></use></svg>'
    },
    delete: {
      title: 'How it works',
      desc: 'Remove unwanted pages from your PDF. Select the pages you want to delete.',
      icon: '<svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><use href="../assets/icons/icons.svg#icon-help"></use></svg>'
    },
    reorder: {
      title: 'How it works',
      desc: 'Drag and drop pages to rearrange their order in the PDF document.',
      icon: '<svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><use href="../assets/icons/icons.svg#icon-help"></use></svg>'
    },
    imageToPdf: {
      title: 'How it works',
      desc: 'Convert images (PNG, JPEG, WebP, GIF, BMP, SVG) to a single PDF document. Upload files, reorder if needed, and configure pages.',
      icon: '<svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><use href="../assets/icons/icons.svg#icon-help"></use></svg>'
    },
    pdfToImg: {
      title: 'How it works',
      desc: 'Convert and download pages of a PDF document as images (PNG or JPEG). Upload a PDF, choose the format and quality, and select pages.',
      icon: '<svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><use href="../assets/icons/icons.svg#icon-help"></use></svg>'
    },
    crop: {
      title: 'How it works',
      desc: 'Crop pages or trim borders from your PDF document visually. Drag handles to define your boundaries and select range.',
      icon: '<svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><use href="../assets/icons/icons.svg#icon-crop"></use></svg>'
    },
    unlock: {
      title: 'How it works',
      desc: 'Remove password security from an encrypted PDF. Upload a password-protected PDF, type its password, and export an unencrypted version.',
      icon: '<svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><use href="../assets/icons/icons.svg#icon-unlock"></use></svg>'
    },
    protect: {
      title: 'How it works',
      desc: 'Encrypt your PDF with a password offline. You can set a password to open the file, or set custom permissions (like restricting copying or printing) with a permissions password.',
      icon: '<svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><use href="../assets/icons/icons.svg#icon-lock"></use></svg>'
    },
    repair: {
      title: 'How it works',
      desc: 'Repair broken, damaged, or corrupted PDF structures offline. Rebuilds cross-reference (xref) tables, corrects stream byte offsets, and reconstructs trailers locally.',
      icon: '<svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><use href="../assets/icons/icons.svg#icon-tool"></use></svg>'
    },
    metadata: {
      title: 'How it works',
      desc: 'Edit PDF metadata fields locally. View and modify the Title, Author, Subject, and Keywords properties stored inside the document header.',
      icon: '<svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><use href="../assets/icons/icons.svg#icon-document"></use></svg>'
    },
    compress: {
      title: 'How it works',
      desc: 'Optimize and shrink the file size of your PDF documents lossless. Stream deflation and reference table cleanups are applied offline.',
      icon: '<svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><use href="../assets/icons/icons.svg#icon-compress"></use></svg>'
    },
    watermark: {
      title: 'How it works',
      desc: 'Insert custom text watermarks or dynamically number pages (e.g. Page X of Y) at selected positions with custom sizes, margins, colors, and opacity.',
      icon: '<svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><use href="../assets/icons/icons.svg#icon-type"></use></svg>'
    }
  };

  // Update tool description
  const info = toolInfo[tool];
  elements.toolDescription.innerHTML = `
    <div class="flex items-start gap-3">
      <div class="text-2xl">${info.icon}</div>
      <div>
        <h3 class="font-semibold text-lg mb-1 text-primary">${info.title}</h3>
        <p class="text-sm text-secondary">${info.desc}</p>
      </div>
    </div>
  `;

  // Update upload section text
  const uploadTexts = {
    merge: { title: 'Drop your PDF files here', multiple: true, accept: '.pdf,application/pdf' },
    split: { title: 'Drop your PDF file here', multiple: false, accept: '.pdf,application/pdf' },
    extract: { title: 'Drop your PDF file here', multiple: false, accept: '.pdf,application/pdf' },
    rotate: { title: 'Drop your PDF file here', multiple: false, accept: '.pdf,application/pdf' },
    delete: { title: 'Drop your PDF file here', multiple: false, accept: '.pdf,application/pdf' },
    reorder: { title: 'Drop your PDF file here', multiple: false, accept: '.pdf,application/pdf' },
    imageToPdf: { title: 'Drop your image files here', multiple: true, accept: '.png,.jpg,.jpeg,.webp,.gif,.bmp,.svg,image/*' },
    pdfToImg: { title: 'Drop your PDF file here', multiple: false, accept: '.pdf,application/pdf' },
    crop: { title: 'Drop your PDF file here', multiple: false, accept: '.pdf,application/pdf' },
    unlock: { title: 'Drop your password-protected PDF here', multiple: false, accept: '.pdf,application/pdf' },
    protect: { title: 'Drop your PDF file here to protect', multiple: false, accept: '.pdf,application/pdf' },
    repair: { title: 'Drop your corrupted PDF here to repair', multiple: false, accept: '.pdf,application/pdf' },
    metadata: { title: 'Drop your PDF file here to edit metadata', multiple: false, accept: '.pdf,application/pdf' },
    compress: { title: 'Drop your PDF file here to compress', multiple: false, accept: '.pdf,application/pdf' },
    watermark: { title: 'Drop your PDF file here to add watermark/numbering', multiple: false, accept: '.pdf,application/pdf' }
  };

  const config = uploadTexts[tool];
  elements.uploadTitle.textContent = config.title;
  elements.fileInput.multiple = config.multiple;
  elements.fileInput.accept = config.accept;

  // Update process button text
  const buttonTexts = {
    merge: 'Merge PDFs',
    split: 'Split PDF',
    extract: 'Extract Pages',
    rotate: 'Rotate Pages',
    delete: 'Delete Pages',
    reorder: 'Reorder & Export',
    imageToPdf: 'Convert to PDF',
    pdfToImg: 'Convert Pages to Images',
    crop: 'Crop PDF',
    unlock: 'Unlock PDF',
    protect: 'Encrypt & Protect PDF',
    repair: 'Repair & Recover PDF',
    metadata: 'Update PDF Metadata',
    compress: 'Compress PDF',
    watermark: 'Apply Watermark/Numbers'
  };
  elements.btnText.textContent = buttonTexts[tool];

  // Adjust layout for merge tool (no options needed)
  const toolOptionsContainer = elements.toolOptions.parentElement;
  const fileListContainer = elements.fileListSection.parentElement;
  if (tool === 'merge') {
    toolOptionsContainer.style.display = 'none';
    fileListContainer.style.flex = '1';
  } else {
    toolOptionsContainer.style.display = 'block';
    fileListContainer.style.flex = '0 0 33.3333%';
  }

  // Reset state
  clearFiles();
}

// File Selection
function handleFileSelect(event) {
  const files = Array.from(event.target.files);
  addFiles(files);
}

function handleDragOver(event) {
  event.preventDefault();
  elements.uploadZone.classList.add('drag-over');
}

function handleDragLeave(event) {
  event.preventDefault();
  elements.uploadZone.classList.remove('drag-over');
}

function handleDrop(event) {
  event.preventDefault();
  elements.uploadZone.classList.remove('drag-over');
  
  const files = Array.from(event.dataTransfer.files);
  addFiles(files);
}

async function addFiles(files) {
  console.log('addFiles called with:', files);
  console.log('Current tool:', state.currentTool);
  
  if (state.currentTool === 'imageToPdf') {
    // Validate images
    const areAllImages = files.every(file => file.type.startsWith('image/') || /\.(png|jpe?g|webp|gif|bmp|svg)$/i.test(file.name));
    if (!areAllImages) {
      showStatus('Please select only image files', 'error');
      return;
    }
  } else {
    // Validate PDFs
    if (!areAllPDFs(files)) {
      showStatus('Please select only PDF files', 'error');
      return;
    }
  }

  // Check file count based on tool
  if (state.currentTool === 'merge' || state.currentTool === 'imageToPdf') {
    state.selectedFiles = [...state.selectedFiles, ...files];
  } else {
    if (files.length > 1) {
      showStatus('Please select only one file', 'warning');
      return;
    }
    state.selectedFiles = files;
  }

  console.log('Selected files:', state.selectedFiles);

  // Load page counts for all files in parallel (PDF tools only)
  if (state.currentTool !== 'imageToPdf') {
    const rejectedFiles = [];
    const metadataPromises = state.selectedFiles.map(async (file) => {
      if (!state.fileMetadata.has(file)) {
        try {
          if (state.currentTool === 'unlock') {
            const encInfo = await pdfService.checkEncryption(file);
            state.isCurrentFileEncrypted = encInfo.encrypted;
            if (encInfo.encrypted) {
              state.fileMetadata.set(file, { pageCount: '?', encrypted: true, encInfo });
              return;
            }
          }

          const pageCount = await pdfService.getPageCount(file);
          state.fileMetadata.set(file, { pageCount, encrypted: false });
        } catch (error) {
          console.error('Error loading page count for', file.name, error);
          
          const isEncrypted = error.message?.toLowerCase().includes('encrypt') || 
                              error.message?.toLowerCase().includes('password') || 
                              error.name === 'PasswordException';
          
          if (state.currentTool === 'unlock' && isEncrypted) {
            state.isCurrentFileEncrypted = true;
            state.fileMetadata.set(file, { pageCount: '?', encrypted: true });
            return;
          }

          if (isEncrypted) {
            const errorMsg = `"${file.name}" is password-protected or encrypted. Because all processing happens locally inside your browser, encrypted PDFs are not supported.`;
            if (typeof alert !== 'undefined') {
              alert(errorMsg);
            } else {
              console.warn(errorMsg);
            }
            rejectedFiles.push(file);
            return;
          }
                              
          let errorMsg = `Error loading "${file.name}": ${error.message}`;
          showStatus(errorMsg, 'error');
          state.fileMetadata.set(file, { pageCount: '?' });
        }
      }
    });
    await Promise.all(metadataPromises);

    if (rejectedFiles.length > 0) {
      state.selectedFiles = state.selectedFiles.filter(f => !rejectedFiles.includes(f));
      rejectedFiles.forEach(f => state.fileMetadata.delete(f));
      if (state.selectedFiles.length === 0 || state.currentTool !== 'merge') {
        clearFiles();
        return;
      }
    }
  }

  // Update UI
  displayFileList();
  
  // For single-file tools, load page info
  if (state.currentTool !== 'merge' && state.currentTool !== 'imageToPdf' && state.selectedFiles.length > 0) {
    if (state.currentTool === 'unlock' && state.isCurrentFileEncrypted) {
      // Skip loadPageInfo as PDF is encrypted and will throw error
    } else {
      await loadPageInfo();
    }
  }

  // Show options if file is selected
  if (state.selectedFiles.length > 0) {
    showToolOptions();
  }
}

function getSplitRangeString() {
  const rangeInput = elements.pageRangeInput?.value?.trim();
  if (!rangeInput) {
    throw new Error('Please enter a page range');
  }

  if (!isValidRangeSyntax(rangeInput)) {
    throw new Error('Invalid range syntax. Use numbers, commas, and hyphens (e.g., 1-3, 5).');
  }

  try {
    const indices = parsePageRange(rangeInput, state.pageCount);
    if (indices.length === 0) {
      throw new Error('No valid pages found in the range');
    }
  } catch (error) {
    throw new Error(`Range validation failed: ${error.message}`);
  }

  return rangeInput;
}

function displayFileList() {
  console.log('displayFileList called');
  console.log('elements.fileItems:', elements.fileItems);
  console.log('state.selectedFiles:', state.selectedFiles);
  
  elements.fileItems.innerHTML = '';
  
  state.selectedFiles.forEach((file, index) => {
    console.log('Creating list item for:', file.name);
    const li = document.createElement('li');
    li.className = 'file-item flex items-center justify-between p-3 rounded-lg';
    
    // Add drag capabilities for Merge and Image to PDF tools
    if (state.currentTool === 'merge' || state.currentTool === 'imageToPdf') {
      li.draggable = true;
      li.classList.add('draggable-file-item');
      li.dataset.index = index;
      li.addEventListener('dragstart', handleFileDragStart);
      li.addEventListener('dragover', handleFileDragOver);
      li.addEventListener('drop', handleFileDrop);
      li.addEventListener('dragend', handleFileDragEnd);
    }
    
    const dragHandle = (state.currentTool === 'merge' || state.currentTool === 'imageToPdf')
      ? `<div class="drag-handle" style="cursor: grab; margin-right: 12px; font-weight: bold; opacity: 0.5;">⋮⋮</div>`
      : '';

    const isImage = state.currentTool === 'imageToPdf';
    let fileMetaText = '';
    if (isImage) {
      fileMetaText = `Size: ${formatFileSize(file.size)} · Image`;
    } else {
      const metadata = state.fileMetadata.get(file);
      const pageInfo = metadata ? metadata.pageCount : '?';
      fileMetaText = `Size: ${formatFileSize(file.size)} · Pages: ${pageInfo}`;
    }

    li.innerHTML = `
      <div class="flex items-center flex-1">
        ${dragHandle}
        <div class="file-info">
          <div class="file-name font-semibold mb-1">${file.name}</div>
          <div class="file-meta text-sm opacity-70">
            ${fileMetaText}
          </div>
        </div>
      </div>
      <button class="icon-btn btn-danger" data-file-index="${index}" title="Remove" aria-label="Remove file ${file.name}"><svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><use href="../assets/icons/icons.svg#icon-delete"></use></svg></button>
    `;
    
    // Add click listener to remove button
    const removeBtn = li.querySelector('button');
    removeBtn.addEventListener('click', () => {
      state.selectedFiles.splice(index, 1);
      displayFileList();
      if (state.selectedFiles.length === 0) {
        clearFiles();
      }
    });
    
    elements.fileItems.appendChild(li);
  });

  // Update file count
  elements.fileCount.textContent = state.selectedFiles.length;
  
  console.log('File count updated to:', state.selectedFiles.length);
  console.log('Showing file list section');

  if (state.selectedFiles.length > 0) {
    elements.filesAndOptionsContainer.classList.remove('hidden');
    elements.actionSection.classList.remove('hidden');
    elements.uploadSection.classList.add('hidden');
    
    // Show blueprint bar if page-based tool
    const isPageTool = ['rotate', 'delete', 'extract', 'reorder', 'split'].includes(state.currentTool);
    if (isPageTool && elements.blueprintBar) {
      elements.blueprintBar.classList.remove('hidden');
      populateBlueprintsDropdown();
    } else if (elements.blueprintBar) {
      elements.blueprintBar.classList.add('hidden');
    }
  } else {
    elements.filesAndOptionsContainer.classList.add('hidden');
    elements.actionSection.classList.add('hidden');
    elements.uploadSection.classList.remove('hidden');
    if (elements.blueprintBar) {
      elements.blueprintBar.classList.add('hidden');
    }
  }
  
  console.log('Container display:', elements.filesAndOptionsContainer.classList);
}

function clearFiles() {
  state.selectedFiles = [];
  state.fileMetadata.clear();
  state.pageCount = 0;
  state.selectedPages.clear();
  state.pageOrder = [];
  state.pageRotations.clear();
  state.thumbnailImages.clear();
  state.keyboardSelectedReorderIndex = null;
  state.cropPreviewPage = 1;
  state.cropBounds = { left: 0, top: 0, width: 1, height: 1 };
  state.cropPageSizes.clear();
  state.isCurrentFileEncrypted = false;
  
  // Clear Undo/Redo
  state.historyUndoStack = [];
  state.historyRedoStack = [];
  updateUndoRedoButtons();
  
  // Hide blueprint bar
  if (elements.blueprintBar) {
    elements.blueprintBar.classList.add('hidden');
  }

  elements.fileInput.value = '';
  if (elements.pageRangeInput) elements.pageRangeInput.value = '';
  initMetadataUI();
  pdfService.clearCache();
  displayFileList();
  hideToolOptions();
  hideStatus();
  elements.uploadSection.classList.remove('hidden');
}

// Load Page Info
async function loadPageInfo() {
  if (state.selectedFiles.length === 0) return;

  try {
    state.pageCount = await pdfService.getPageCount(state.selectedFiles[0]);
    elements.totalPages.textContent = state.pageCount;
    
    // Initialize page order for reorder tool
    if (state.currentTool === 'reorder') {
      state.pageOrder = Array.from({ length: state.pageCount }, (_, i) => i + 1);
    }

    // Initialize page rotations for rotate tool
    if (state.currentTool === 'rotate') {
      state.pageRotations.clear();
      for (let i = 1; i <= state.pageCount; i++) {
        state.pageRotations.set(i, 0);
      }
    }

    // Load metadata if current tool is metadata
    if (state.currentTool === 'metadata') {
      showStatus('Loading document properties...', 'info');
      try {
        const metadata = await pdfService.getPDFMetadata(state.selectedFiles[0]);
        if (elements.metadataTitle) elements.metadataTitle.value = metadata.title;
        if (elements.metadataAuthor) elements.metadataAuthor.value = metadata.author;
        if (elements.metadataSubject) elements.metadataSubject.value = metadata.subject;
        if (elements.metadataKeywords) elements.metadataKeywords.value = metadata.keywords;
        hideStatus();
      } catch (err) {
        showStatus(`Failed to read metadata: ${err.message}`, 'error');
        if (elements.metadataTitle) elements.metadataTitle.value = '';
        if (elements.metadataAuthor) elements.metadataAuthor.value = '';
        if (elements.metadataSubject) elements.metadataSubject.value = '';
        if (elements.metadataKeywords) elements.metadataKeywords.value = '';
      }
    }
  } catch (error) {
    showStatus(`Error loading PDF: ${error.message}`, 'error');
  }
}

// Show Tool Options
function showToolOptions() {
  // Hide all options first
  const optionPanels = {
    split: elements.splitOptions,
    extract: elements.extractOptions,
    rotate: elements.rotateOptions,
    delete: elements.deleteOptions,
    reorder: elements.reorderOptions,
    imageToPdf: elements.imageToPdfOptions,
    pdfToImg: elements.pdfToImgOptions,
    crop: elements.cropOptions,
    unlock: elements.unlockOptions,
    protect: elements.protectOptions,
    repair: elements.repairOptions,
    metadata: elements.metadataOptions,
    compress: elements.compressOptions,
    watermark: elements.watermarkOptions
  };

  // Hide all panels
  Object.values(optionPanels).forEach(panel => {
    if (panel) panel.classList.add('hidden');
  });

  const panel = optionPanels[state.currentTool];
  if (panel) {
    panel.classList.remove('hidden');
    elements.toolOptions.classList.remove('hidden');

    // Initialize tool-specific UI
    if (state.currentTool === 'extract') {
      renderPageSelector('extractPageSelector');
    } else if (state.currentTool === 'rotate') {
      renderPageSelector('rotatePageSelector');
    } else if (state.currentTool === 'delete') {
      renderPageSelector('deletePageSelector');
    } else if (state.currentTool === 'reorder') {
      renderReorderList();
    } else if (state.currentTool === 'imageToPdf') {
      elements.imgPageSize.value = 'fit';
      elements.imgOrientation.value = 'auto';
      elements.imgOrientation.disabled = true;
      elements.imgMargin.value = '0';
      elements.imgAlignment.value = 'center';
      elements.imgAlignment.disabled = true;
    } else if (state.currentTool === 'pdfToImg') {
      state.selectedPages.clear();
      renderPageSelector('pdfToImgPageSelector');
    } else if (state.currentTool === 'crop') {
      setupCropPageSelect();
      loadCropPagePreview();
    } else if (state.currentTool === 'unlock') {
      displayUnlockOptionsUI();
    } else if (state.currentTool === 'protect') {
      initProtectUI();
    } else if (state.currentTool === 'repair') {
      initRepairUI();
    } else if (state.currentTool === 'compress') {
      elements.compressLevel.value = 'medium';
    } else if (state.currentTool === 'watermark') {
      initWatermarkUI();
    }
  } else {
    elements.toolOptions.classList.add('hidden');
  }
}

function hideToolOptions() {
  elements.toolOptions.classList.add('hidden');
}

// Page Selector
function renderPageSelector(containerId) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';

  state.thumbnailImages = new Map(); // Reset thumbnail images

  const grid = document.createElement('div');
  grid.className = 'page-grid';

  // Create page items with thumbnails
  const thumbnailPromises = [];
  for (let i = 1; i <= state.pageCount; i++) {
    const pageItem = document.createElement('div');
    pageItem.className = 'page-item';
    pageItem.dataset.page = i;

    // Create thumbnail container
    const thumbnailContainer = document.createElement('div');
    thumbnailContainer.className = 'page-thumbnail-container';

    // Create canvas for thumbnail
    const canvas = document.createElement('canvas');
    canvas.className = 'page-thumbnail';
    if (elements.dimToggle && elements.dimToggle.checked) {
      canvas.classList.add('dim-page');
    }
    canvas.width = 120;
    canvas.height = 160;

    // Add loading placeholder
    const context = canvas.getContext('2d');
    context.fillStyle = 'var(--secondary-color)';
    context.fillRect(0, 0, 120, 160);
    context.fillStyle = 'var(--text-color)';
    context.font = '12px Arial';
    context.textAlign = 'center';
    context.fillText('Loading...', 60, 80);

    thumbnailContainer.appendChild(canvas);

    // Add page number
    const pageNumber = document.createElement('div');
    pageNumber.className = 'page-number';
    pageNumber.textContent = `Page ${i}`;

    pageItem.appendChild(thumbnailContainer);
    pageItem.appendChild(pageNumber);

    if (state.currentTool === 'rotate') {
      // Add rotation controls
      const rotationControls = document.createElement('div');
      rotationControls.className = 'rotation-controls flex gap-1 mt-2 justify-center';

      const currentRotation = state.pageRotations.get(i) || 0;

      const rotateBtn = document.createElement('button');
      rotateBtn.className = 'rotate-btn mt-2';
      rotateBtn.textContent = `${currentRotation}°`;
      rotateBtn.setAttribute('aria-label', `Rotate page ${i}. Current rotation: ${currentRotation} degrees`);
      rotateBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        saveHistoryState();
        const newRotation = (state.pageRotations.get(i) + 90) % 360;
        state.pageRotations.set(i, newRotation);
        rotateBtn.textContent = `${newRotation}°`;
        rotateBtn.setAttribute('aria-label', `Rotate page ${i}. Current rotation: ${newRotation} degrees`);
        redrawThumbnail(canvas, i, newRotation);
      });
      rotationControls.appendChild(rotateBtn);

      pageItem.appendChild(rotationControls);
    } else {
      // Add keyboard accessibility
      pageItem.tabIndex = 0;
      pageItem.setAttribute('role', 'checkbox');
      const isSelected = state.selectedPages.has(i);
      pageItem.setAttribute('aria-checked', isSelected ? 'true' : 'false');
      pageItem.setAttribute('aria-label', `Page ${i}`);
      if (isSelected) {
        pageItem.classList.add('selected');
      }

      const toggleSelection = () => {
        saveHistoryState();
        if (state.selectedPages.has(i)) {
          state.selectedPages.delete(i);
          pageItem.classList.remove('selected');
          pageItem.setAttribute('aria-checked', 'false');
        } else {
          state.selectedPages.add(i);
          pageItem.classList.add('selected');
          pageItem.setAttribute('aria-checked', 'true');
        }
      };

      pageItem.addEventListener('click', toggleSelection);
      pageItem.addEventListener('keydown', (e) => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          toggleSelection();
        }
      });
    }

    grid.appendChild(pageItem);

    // Render thumbnail asynchronously - check if PDF.js is loaded
    const thumbnailPromise = (async () => {
      try {
        // Wait for PDF.js to be available
        if (typeof pdfjsLib === 'undefined') {
          console.log('Waiting for PDF.js to load...');
          // Wait up to 5 seconds for PDF.js to load
          let attempts = 0;
          while (typeof pdfjsLib === 'undefined' && attempts < 50) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
          }

          if (typeof pdfjsLib === 'undefined') {
            throw new Error('PDF.js failed to load within timeout');
          }
        }

        console.log('PDF.js is ready, rendering thumbnail for page', i);
        const dataUrl = await pdfService.renderPageThumbnail(state.selectedFiles[0], i - 1, 120, 160);
        const img = new Image();
        img.onload = () => {
          state.thumbnailImages.set(i, img); // Store for redrawing
          const ctx = canvas.getContext('2d');
          ctx.clearRect(0, 0, 120, 160);
          // Apply rotation
          const rotation = state.pageRotations.get(i) || 0;
          ctx.save();
          ctx.translate(60, 80); // center
          ctx.rotate(rotation * Math.PI / 180);
          // Calculate scaling to fit the canvas while maintaining aspect ratio
          const scale = Math.min(120 / img.width, 160 / img.height);
          const scaledWidth = img.width * scale;
          const scaledHeight = img.height * scale;
          ctx.drawImage(img, -scaledWidth/2, -scaledHeight/2, scaledWidth, scaledHeight);
          ctx.restore();
        };
        img.src = dataUrl;
      } catch (error) {
        console.error(`Error rendering thumbnail for page ${i}:`, error);
        // Show error state
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = 'var(--secondary-color)';
        ctx.fillRect(0, 0, 120, 160);
        ctx.fillStyle = '#ff6b6b';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Error', 60, 80);
      }
    })();

    thumbnailPromises.push(thumbnailPromise);
  }

  container.appendChild(grid);

  // Handle any errors in thumbnail rendering
  Promise.allSettled(thumbnailPromises).then(results => {
    const failedCount = results.filter(result => result.status === 'rejected').length;
    if (failedCount > 0) {
      console.warn(`${failedCount} page thumbnails failed to render`);
    }
  });
}

// Redraw thumbnail with new rotation
function redrawThumbnail(canvas, pageNum, rotation) {
  const img = state.thumbnailImages.get(pageNum);
  if (!img) return;

  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, 120, 160);
  ctx.save();
  ctx.translate(60, 80);
  ctx.rotate(rotation * Math.PI / 180);
  const scale = Math.min(120 / img.width, 160 / img.height);
  const scaledWidth = img.width * scale;
  const scaledHeight = img.height * scale;
  ctx.drawImage(img, -scaledWidth/2, -scaledHeight/2, scaledWidth, scaledHeight);
  ctx.restore();
}

function updateSelectionUI(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const items = container.querySelectorAll('.page-item');
  items.forEach(item => {
    const pageNum = parseInt(item.dataset.page, 10);
    if (state.selectedPages.has(pageNum)) {
      item.classList.add('selected');
      item.setAttribute('aria-checked', 'true');
    } else {
      item.classList.remove('selected');
      item.setAttribute('aria-checked', 'false');
    }
  });
}

function updateRotationUI() {
  const container = document.getElementById('rotatePageSelector');
  if (!container) return;
  const items = container.querySelectorAll('.page-item');
  items.forEach(item => {
    const pageNum = parseInt(item.dataset.page, 10);
    const rotation = state.pageRotations.get(pageNum) || 0;
    const rotateBtn = item.querySelector('.rotate-btn');
    if (rotateBtn) {
      rotateBtn.textContent = `${rotation}°`;
    }
    const canvas = item.querySelector('canvas');
    if (canvas) {
      redrawThumbnail(canvas, pageNum, rotation);
    }
  });
}

// Reorder List
function renderReorderList() {
  const container = document.getElementById('reorderPageSelector');
  container.innerHTML = '';
  container.classList.add('page-grid');

  // Create page items with thumbnails for reordering
  const thumbnailPromises = [];
  state.pageOrder.forEach((pageNum, index) => {
    const pageItem = document.createElement('div');
    pageItem.className = 'page-item reorder-item';
    pageItem.draggable = true;
    pageItem.dataset.index = index;

    // Create thumbnail container
    const thumbnailContainer = document.createElement('div');
    thumbnailContainer.className = 'page-thumbnail-container';

    // Create canvas for thumbnail
    const canvas = document.createElement('canvas');
    canvas.className = 'page-thumbnail';
    if (elements.dimToggle && elements.dimToggle.checked) {
      canvas.classList.add('dim-page');
    }
    canvas.width = 120;
    canvas.height = 160;

    // Add loading placeholder
    const context = canvas.getContext('2d');
    context.fillStyle = 'var(--secondary-color)';
    context.fillRect(0, 0, 120, 160);
    context.fillStyle = 'var(--text-color)';
    context.font = '12px Arial';
    context.textAlign = 'center';
    context.fillText('Loading...', 60, 80);

    thumbnailContainer.appendChild(canvas);

    // Add page number
    const pageNumber = document.createElement('div');
    pageNumber.className = 'page-number';
    pageNumber.textContent = `Page ${pageNum}`;

    pageItem.appendChild(thumbnailContainer);
    pageItem.appendChild(pageNumber);

    pageItem.addEventListener('dragstart', handleReorderDragStart);
    pageItem.addEventListener('dragover', handleReorderDragOver);
    pageItem.addEventListener('drop', handleReorderDrop);
    pageItem.addEventListener('dragend', handleReorderDragEnd);

    // Add keyboard accessibility
    pageItem.tabIndex = 0;
    pageItem.setAttribute('role', 'listitem');
    pageItem.setAttribute('aria-describedby', 'reorderInstructions');

    const isSelectedForMove = state.keyboardSelectedReorderIndex === index;
    if (isSelectedForMove) {
      pageItem.classList.add('keyboard-selected');
      pageItem.setAttribute('aria-selected', 'true');
      pageItem.setAttribute('aria-label', `Moving Page ${pageNum}. Position ${index + 1} of ${state.pageOrder.length}. Use Left/Right Arrow keys to move, Space/Enter to place.`);
    } else {
      pageItem.setAttribute('aria-selected', 'false');
      pageItem.setAttribute('aria-label', `Page ${pageNum}. Position ${index + 1} of ${state.pageOrder.length}. Press Space or Enter to start moving.`);
    }

    pageItem.addEventListener('keydown', (e) => {
      const idx = parseInt(pageItem.dataset.index, 10);
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        if (state.keyboardSelectedReorderIndex === null) {
          state.keyboardSelectedReorderIndex = idx;
          renderReorderList();
          focusReorderItem(idx);
        } else if (state.keyboardSelectedReorderIndex === idx) {
          state.keyboardSelectedReorderIndex = null;
          renderReorderList();
          focusReorderItem(idx);
        }
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (state.keyboardSelectedReorderIndex !== null) {
          if (idx > 0) {
            saveHistoryState();
            const temp = state.pageOrder[idx];
            state.pageOrder[idx] = state.pageOrder[idx - 1];
            state.pageOrder[idx - 1] = temp;
            state.keyboardSelectedReorderIndex = idx - 1;
            renderReorderList();
            focusReorderItem(idx - 1);
          }
        } else {
          if (idx > 0) focusReorderItem(idx - 1);
        }
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (state.keyboardSelectedReorderIndex !== null) {
          if (idx < state.pageOrder.length - 1) {
            saveHistoryState();
            const temp = state.pageOrder[idx];
            state.pageOrder[idx] = state.pageOrder[idx + 1];
            state.pageOrder[idx + 1] = temp;
            state.keyboardSelectedReorderIndex = idx + 1;
            renderReorderList();
            focusReorderItem(idx + 1);
          }
        } else {
          if (idx < state.pageOrder.length - 1) focusReorderItem(idx + 1);
        }
      } else if (e.key === 'Escape') {
        if (state.keyboardSelectedReorderIndex !== null) {
          state.keyboardSelectedReorderIndex = null;
          renderReorderList();
          focusReorderItem(idx);
        }
      }
    });

    container.appendChild(pageItem);

    // Render thumbnail asynchronously
    const thumbnailPromise = (async () => {
      try {
        // Wait for PDF.js to be available
        if (typeof pdfjsLib === 'undefined') {
          console.log('Waiting for PDF.js to load...');
          // Wait up to 5 seconds for PDF.js to load
          let attempts = 0;
          while (typeof pdfjsLib === 'undefined' && attempts < 50) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
          }

          if (typeof pdfjsLib === 'undefined') {
            throw new Error('PDF.js failed to load within timeout');
          }
        }

        console.log('PDF.js is ready, rendering thumbnail for page', pageNum);
        const dataUrl = await pdfService.renderPageThumbnail(state.selectedFiles[0], pageNum - 1, 120, 160);
        const img = new Image();
        img.onload = () => {
          const ctx = canvas.getContext('2d');
          ctx.clearRect(0, 0, 120, 160);
          // Calculate scaling to fit the canvas while maintaining aspect ratio
          const scale = Math.min(120 / img.width, 160 / img.height);
          const scaledWidth = img.width * scale;
          const scaledHeight = img.height * scale;
          const x = (120 - scaledWidth) / 2;
          const y = (160 - scaledHeight) / 2;

          ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
        };
        img.src = dataUrl;
      } catch (error) {
        console.error(`Error rendering thumbnail for page ${pageNum}:`, error);
        // Show error state
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = 'var(--secondary-color)';
        ctx.fillRect(0, 0, 120, 160);
        ctx.fillStyle = '#ff6b6b';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Error', 60, 80);
      }
    })();

    thumbnailPromises.push(thumbnailPromise);
  });

  // Handle any errors in thumbnail rendering
  Promise.allSettled(thumbnailPromises).then(results => {
    const failedCount = results.filter(result => result.status === 'rejected').length;
    if (failedCount > 0) {
      console.warn(`${failedCount} page thumbnails failed to render`);
    }
  });
}

let draggedIndex = null;

function handleReorderDragStart(event) {
  const targetItem = event.target.closest('.reorder-item');
  if (!targetItem) return;
  draggedIndex = parseInt(targetItem.dataset.index, 10);
  targetItem.classList.add('dragging');
}

function handleReorderDragOver(event) {
  event.preventDefault();
}

function handleReorderDrop(event) {
  event.preventDefault();
  const targetItem = event.target.closest('.reorder-item');
  if (!targetItem) return;
  const dropIndex = parseInt(targetItem.dataset.index, 10);

  if (draggedIndex !== null && draggedIndex !== dropIndex) {
    saveHistoryState();
    // Reorder array
    const [removed] = state.pageOrder.splice(draggedIndex, 1);
    state.pageOrder.splice(dropIndex, 0, removed);
    renderReorderList();
  }
}

function handleReorderDragEnd(event) {
  const targetItem = event.target.closest('.reorder-item');
  if (targetItem) {
    targetItem.classList.remove('dragging');
  }
  draggedIndex = null;
}

let draggedFileIndex = null;

function handleFileDragStart(event) {
  const targetItem = event.target.closest('.draggable-file-item');
  if (!targetItem) return;
  draggedFileIndex = parseInt(targetItem.dataset.index, 10);
  targetItem.classList.add('dragging');
}

function handleFileDragOver(event) {
  event.preventDefault();
}

function handleFileDrop(event) {
  event.preventDefault();
  const targetItem = event.target.closest('.draggable-file-item');
  if (!targetItem) return;
  const dropIndex = parseInt(targetItem.dataset.index, 10);

  if (draggedFileIndex !== null && draggedFileIndex !== dropIndex) {
    const [removed] = state.selectedFiles.splice(draggedFileIndex, 1);
    state.selectedFiles.splice(dropIndex, 0, removed);
    displayFileList();
  }
}

function handleFileDragEnd(event) {
  const targetItem = event.target.closest('.draggable-file-item');
  if (targetItem) {
    targetItem.classList.remove('dragging');
  }
  draggedFileIndex = null;
}

// Process Files
async function processFiles() {
  if (!state.currentTool || state.selectedFiles.length === 0) {
    showStatus('Please select a tool and files', 'warning');
    return;
  }

  showProgress();
  elements.processBtn.disabled = true;

  try {
    let result;

    switch (state.currentTool) {
      case 'merge':
        result = await pdfService.mergePDFs(state.selectedFiles);
        await downloadPDF(result, generateActionFilename(state.selectedFiles[0].name, 'merged'));
        showStatus('PDFs merged successfully!', 'success');
        break;

      case 'split':
        const rangeString = getSplitRangeString();
        result = await pdfService.splitPDF(state.selectedFiles[0], rangeString);
        await downloadPDF(result, generateActionFilename(state.selectedFiles[0].name, 'split'));
        showStatus('PDF split successfully!', 'success');
        break;

      case 'extract':
        if (state.selectedPages.size === 0) {
          throw new Error('Please select pages to extract');
        }
        result = await pdfService.extractPages(state.selectedFiles[0], Array.from(state.selectedPages));
        await downloadPDF(result, generateActionFilename(state.selectedFiles[0].name, 'extracted'));
        showStatus('Pages extracted successfully!', 'success');
        break;

      case 'rotate':
        // Check if any pages have rotation set
        const hasRotations = Array.from(state.pageRotations.values()).some(rot => rot > 0);
        if (!hasRotations) {
          throw new Error('No pages have rotation set');
        }
        result = await pdfService.rotatePagesPerPage(state.selectedFiles[0], state.pageRotations);
        await downloadPDF(result, generateActionFilename(state.selectedFiles[0].name, 'rotated'));
        showStatus('Pages rotated successfully!', 'success');
        break;

      case 'delete':
        if (state.selectedPages.size === 0) {
          throw new Error('Please select pages to delete');
        }
        result = await pdfService.deletePages(state.selectedFiles[0], Array.from(state.selectedPages));
        await downloadPDF(result, generateActionFilename(state.selectedFiles[0].name, 'pages_deleted'));
        showStatus('Pages deleted successfully!', 'success');
        break;

      case 'reorder':
        result = await pdfService.reorderPages(state.selectedFiles[0], state.pageOrder);
        await downloadPDF(result, generateActionFilename(state.selectedFiles[0].name, 'reordered'));
        showStatus('Pages reordered successfully!', 'success');
        break;

      case 'imageToPdf':
        const imgOptions = {
          pageSize: elements.imgPageSize.value,
          orientation: elements.imgOrientation.value,
          margin: elements.imgMargin.value,
          alignment: elements.imgAlignment.value
        };
        result = await pdfService.imageToPDF(state.selectedFiles, imgOptions);
        // Formulate output filename using the first file's name
        await downloadPDF(result, generateActionFilename(state.selectedFiles[0].name, 'converted'));
        showStatus('Images converted to PDF successfully!', 'success');
        break;

      case 'pdfToImg':
        if (state.selectedPages.size === 0) {
          throw new Error('Please select at least one page to export as an image');
        }
        
        const selectedPagesArray = Array.from(state.selectedPages).sort((a, b) => a - b);
        const imgFormat = elements.pdfToImgFormat.value;
        const imgScale = parseFloat(elements.pdfToImgScale.value);
        const extension = imgFormat === 'image/png' ? 'png' : 'jpg';
        
        showStatus(`Starting image export for ${selectedPagesArray.length} pages...`, 'info');
        
        const baseFileName = state.selectedFiles[0].name.replace(/\.pdf$/i, '');
        
        for (let idx = 0; idx < selectedPagesArray.length; idx++) {
          const pageNum = selectedPagesArray[idx];
          const imgDataUrl = await pdfService.renderPageToImage(state.selectedFiles[0], pageNum - 1, imgFormat, imgScale);
          
          // Convert data URL to bytes
          const res = await fetch(imgDataUrl);
          const blob = await res.blob();
          const buffer = await blob.arrayBuffer();
          const imgBytes = new Uint8Array(buffer);
          
          // Formulate filename
          const outputName = `${baseFileName}_page_${pageNum}.${extension}`;
          
          // Download the file
          await downloadImage(imgBytes, outputName, imgFormat);
          
          // Introduce a small 250ms delay between downloads to prevent chrome from blocking batch downloads
          if (idx < selectedPagesArray.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 250));
          }
        }
        
        showStatus('Pages exported to images successfully!', 'success');
        break;

      case 'crop':
        const scopeRadio = document.querySelector('input[name="cropScope"]:checked');
        const scope = scopeRadio ? scopeRadio.value : 'current';
        
        let rangeVal = '';
        if (scope === 'range') {
          rangeVal = elements.cropScopeRange.value.trim();
          if (!rangeVal) {
            throw new Error('Please enter a custom page range');
          }
          if (!isValidRangeSyntax(rangeVal)) {
            throw new Error('Invalid range syntax. Use numbers, commas, and hyphens (e.g. 1-3, 5).');
          }
        }
        
        const scopeOptions = {
          scope,
          currentPage: state.cropPreviewPage,
          range: rangeVal
        };
        
        result = await pdfService.cropPDF(state.selectedFiles[0], state.cropBounds, scopeOptions);
        await downloadPDF(result, generateActionFilename(state.selectedFiles[0].name, 'cropped'));
        showStatus('PDF pages cropped successfully!', 'success');
        break;

      case 'unlock':
        if (!state.selectedFiles[0]) {
          throw new Error('Please select a PDF file first');
        }
        if (!state.isCurrentFileEncrypted) {
          throw new Error('This PDF file is not password-protected. Decryption is not required.');
        }
        const unlockPassword = elements.unlockPassword.value;
        if (!unlockPassword) {
          if (elements.unlockPassword) {
            elements.unlockPassword.style.borderColor = '#ef4444';
            elements.unlockPassword.focus();
          }
          throw new Error('Please enter the password to decrypt the PDF');
        }
        
        showStatus('Decrypting PDF offline...', 'info');
        result = await pdfService.unlockPDF(state.selectedFiles[0], unlockPassword);
        await downloadPDF(result, generateActionFilename(state.selectedFiles[0].name, 'unlocked'));
        showStatus('PDF unlocked and decrypted successfully!', 'success');
        break;

      case 'protect':
        if (!state.selectedFiles[0]) {
          throw new Error('Please select a PDF file first');
        }

        const requireOpen = elements.protectRequireOpenPassword.checked;
        const restrictPerms = elements.protectRestrictPermissions.checked;

        if (!requireOpen && !restrictPerms) {
          throw new Error('Please configure at least one protection option (Open Password or Permissions Restriction)');
        }

        let userPass = '';
        if (requireOpen) {
          userPass = elements.protectOpenPassword.value;
          if (!userPass) {
            elements.protectOpenPassword.style.borderColor = '#ef4444';
            elements.protectOpenPassword.focus();
            throw new Error('Please enter a Document Open Password');
          }
        }

        let ownerPass = '';
        if (restrictPerms) {
          ownerPass = elements.protectPermissionsPassword.value;
          if (!ownerPass) {
            elements.protectPermissionsPassword.style.borderColor = '#ef4444';
            elements.protectPermissionsPassword.focus();
            throw new Error('Please enter a Permissions Password');
          }
        }

        // Calculate permission flags (standard PDF P-value)
        let P = -4; // Full permissions by default
        if (restrictPerms) {
          const allowPrint = elements.protectAllowPrinting.checked;
          const allowCopy = elements.protectAllowCopying.checked;
          const allowModify = elements.protectAllowModifying.checked;
          const allowAnnotate = elements.protectAllowAnnotating.checked;

          if (!allowPrint) {
            P &= ~(1 << 2);  // Print
            P &= ~(1 << 11); // High-res print
          }
          if (!allowCopy) {
            P &= ~(1 << 4);  // Copy
            P &= ~(1 << 9);  // Accessibility copy
          }
          if (!allowModify) {
            P &= ~(1 << 3);  // Modify
            P &= ~(1 << 10); // Assemble
          }
          if (!allowAnnotate) {
            P &= ~(1 << 5);  // Annotations
          }
        }

        const protectOptions = {
          userPassword: userPass,
          ownerPassword: ownerPass,
          permissions: P,
          encryptMetadata: elements.protectEncryptMetadata.checked
        };

        showStatus('Encrypting PDF locally...', 'info');
        result = await pdfService.protectPDF(state.selectedFiles[0], protectOptions);
        await downloadPDF(result, generateActionFilename(state.selectedFiles[0].name, 'protected'));
        showStatus('PDF protected and encrypted successfully!', 'success');
        break;

      case 'repair':
        if (!state.selectedFiles[0]) {
          throw new Error('Please select a PDF file first');
        }

        const repairOptions = {
          optimizeLayout: elements.repairOptimizeLayout.checked
        };

        showStatus('Repairing PDF structures locally...', 'info');
        result = await pdfService.repairPDF(state.selectedFiles[0], repairOptions);
        await downloadPDF(result, generateActionFilename(state.selectedFiles[0].name, 'repaired'));
        showStatus('PDF structurally repaired and recovered successfully!', 'success');
        break;

      case 'metadata':
        if (!state.selectedFiles[0]) {
          throw new Error('Please select a PDF file first');
        }

        const metadataValues = {
          title: elements.metadataTitle.value.trim(),
          author: elements.metadataAuthor.value.trim(),
          subject: elements.metadataSubject.value.trim(),
          keywords: elements.metadataKeywords.value.trim()
        };

        showStatus('Updating PDF metadata locally...', 'info');
        result = await pdfService.updatePDFMetadata(state.selectedFiles[0], metadataValues);
        await downloadPDF(result, generateActionFilename(state.selectedFiles[0].name, 'updated_metadata'));
        showStatus('PDF metadata updated successfully!', 'success');
        break;

      case 'compress':
        if (!state.selectedFiles[0]) {
          throw new Error('Please select a PDF file first');
        }
        const compressLvl = elements.compressLevel.value;
        showStatus('Compressing PDF offline...', 'info');
        result = await pdfService.compressPDF(state.selectedFiles[0], compressLvl);
        await downloadPDF(result, generateActionFilename(state.selectedFiles[0].name, 'compressed'));
        showStatus('PDF compressed successfully!', 'success');
        break;

      case 'watermark':
        if (!state.selectedFiles[0]) {
          throw new Error('Please select a PDF file first');
        }
        const addText = elements.watermarkModeTextBtn.classList.contains('selected');
        const addNumbers = elements.watermarkModeNumBtn.classList.contains('selected');

        if (!addText && !addNumbers) {
          throw new Error('Please select at least one overlay to apply (Text Watermark or Page Numbers)');
        }

        const watermarkOpts = {
          addText,
          addNumbers
        };

        if (addText) {
          const text = elements.watermarkText.value.trim();
          if (!text) {
            throw new Error('Please enter watermark text');
          }
          watermarkOpts.text = text;
          watermarkOpts.fontSize = parseInt(elements.watermarkFontSize.value, 10);
          watermarkOpts.rotation = parseInt(elements.watermarkRotation.value, 10);
          watermarkOpts.colorHex = elements.watermarkColorHex.value.trim();
          watermarkOpts.opacity = parseInt(elements.watermarkOpacity.value, 10);
        }

        if (addNumbers) {
          watermarkOpts.format = elements.pageNumberFormat.value;
          watermarkOpts.align = elements.pageNumberAlign.value;
          watermarkOpts.startNumber = parseInt(elements.pageNumberStart.value, 10) || 1;
          watermarkOpts.numColorHex = elements.pageNumberColorHex.value.trim();
          watermarkOpts.numFontSize = parseInt(elements.pageNumberFontSize.value, 10);
          watermarkOpts.margin = parseInt(elements.pageNumberMargin.value, 10) || 36;
        }

        showStatus('Applying overlays offline...', 'info');
        result = await pdfService.watermarkPDF(state.selectedFiles[0], watermarkOpts);
        
        let suffix = 'overlay';
        if (addText && !addNumbers) suffix = 'watermarked';
        else if (!addText && addNumbers) suffix = 'numbered';

        await downloadPDF(result, generateActionFilename(state.selectedFiles[0].name, suffix));
        showStatus('PDF overlays applied successfully!', 'success');
        break;
    }

    // Record metrics on success
    let totalBytesProcessed = 0;
    state.selectedFiles.forEach(file => {
      totalBytesProcessed += file.size;
    });
    recordOfflineMetrics(state.selectedFiles.length, totalBytesProcessed);
  } catch (error) {
    showStatus(`Error: ${error.message}`, 'error');
    console.error('Processing error:', error);
  } finally {
    hideProgress();
    elements.processBtn.disabled = false;
  }
}

/**
 * Download image file
 */
async function downloadImage(imgBytes, filename, mimeType) {
  const blob = new Blob([imgBytes], { type: mimeType });
  const url = URL.createObjectURL(blob);
  try {
    if (typeof chrome !== 'undefined' && chrome.downloads) {
      await chrome.downloads.download({
        url: url,
        filename: filename,
        saveAs: false
      });
    } else {
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
    }
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}

// Status & Progress
function showStatus(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = 'card p-4 mb-3';
  toast.style.minWidth = '250px';
  
  const iconSvg = type === 'error' ? 
    '<svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>' :
    type === 'warning' ? 
    '<svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>' :
    type === 'success' ? 
    '<svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22,4 12,14.01 9,11.01"></polyline></svg>' :
    '<svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>';
  
  toast.innerHTML = `
    <div class="flex items-center gap-3">
      <span class="text-xl">${iconSvg}</span>
      <span style="color: var(--text-color);">${message}</span>
    </div>
  `;
  
  elements.toastContainer.appendChild(toast);
  
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function hideStatus() {
  elements.toastContainer.innerHTML = '';
}

function showProgress() {
  elements.processingOverlay.classList.remove('hidden');
}

function hideProgress() {
  elements.processingOverlay.classList.add('hidden');
}

function showConfirmModal(onConfirm) {
  const modal = document.getElementById('confirmModal');
  if (!modal) return;
  const cancelBtn = document.getElementById('confirmCancelBtn');
  const clearBtn = document.getElementById('confirmClearBtn');
  
  modal.classList.remove('hidden');
  
  const close = () => {
    modal.classList.add('hidden');
    cancelBtn.removeEventListener('click', handleCancel);
    clearBtn.removeEventListener('click', handleClear);
  };
  
  const handleCancel = () => close();
  const handleClear = () => {
    onConfirm();
    close();
  };
  
  cancelBtn.addEventListener('click', handleCancel);
  clearBtn.addEventListener('click', handleClear);
}

// Reset
function reset() {
  state.currentTool = null;
  clearFiles();
  elements.toolTabs.forEach(tab => tab.classList.remove('active'));
  elements.uploadTitle.textContent = 'Drop PDF files here or click to browse';
  hideStatus();
}

function focusReorderItem(index) {
  setTimeout(() => {
    const container = document.getElementById('reorderPageSelector');
    if (!container) return;
    const items = container.querySelectorAll('.page-item');
    const target = items[index];
    if (target) target.focus();
  }, 50);
}

/**
 * Setup crop page select dropdown list options
 */
function setupCropPageSelect() {
  if (!elements.cropPageSelect) return;
  elements.cropPageSelect.innerHTML = '';
  for (let i = 1; i <= state.pageCount; i++) {
    const opt = document.createElement('option');
    opt.value = i;
    opt.textContent = `Page ${i}`;
    elements.cropPageSelect.appendChild(opt);
  }
}

/**
 * Load page thumbnail and render on preview canvas, resizing overlay container
 */
async function loadCropPagePreview() {
  const pageNum = state.cropPreviewPage;
  const file = state.selectedFiles[0];
  if (!file) return;

  try {
    showProgress();
    
    // Get page size from pdf-lib
    const pageIndex = pageNum - 1;
    let size = state.cropPageSizes.get(pageIndex);
    if (!size) {
      size = await pdfService.getPageSize(file, pageIndex);
      state.cropPageSizes.set(pageIndex, size);
    }
    
    // Render page thumbnail to canvas
    const dataUrl = await pdfService.renderPageThumbnail(file, pageIndex, 300, 400);
    const img = new Image();
    img.onload = () => {
      const canvas = elements.cropPreviewCanvas;
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      
      // Update Crop Overlay container style
      const container = elements.cropPreviewContainer;
      container.style.width = `${img.width}px`;
      container.style.height = `${img.height}px`;
      
      // Update visual overlay position based on current cropBounds
      updateCropOverlayUI();
      hideProgress();
    };
    img.src = dataUrl;
  } catch (error) {
    console.error('Error loading crop preview:', error);
    showStatus(`Failed to load preview: ${error.message}`, 'error');
    hideProgress();
  }
}

/**
 * Synchronize screen overlay styling to state.cropBounds
 */
function updateCropOverlayUI() {
  const container = elements.cropPreviewContainer;
  const overlay = elements.cropOverlay;
  if (!container || !overlay) return;
  
  const contWidth = container.clientWidth || 300;
  const contHeight = container.clientHeight || 400;
  
  const { left, top, width, height } = state.cropBounds;
  
  overlay.style.left = `${left * contWidth}px`;
  overlay.style.top = `${top * contHeight}px`;
  overlay.style.width = `${width * contWidth}px`;
  overlay.style.height = `${height * contHeight}px`;
  
  // Sync numerical inputs (display absolute points based on current page size)
  const pageIndex = state.cropPreviewPage - 1;
  const size = state.cropPageSizes.get(pageIndex) || { width: 612, height: 792 };
  
  const ptLeft = Math.round(left * size.width);
  const ptTop = Math.round(top * size.height);
  const ptRight = Math.round((1 - left - width) * size.width);
  const ptBottom = Math.round((1 - top - height) * size.height);
  
  elements.cropMarginLeft.value = ptLeft;
  elements.cropMarginTop.value = ptTop;
  elements.cropMarginRight.value = ptRight;
  elements.cropMarginBottom.value = ptBottom;
}

/**
 * Update state bounds from numeric input values
 */
function updateBoundsFromInputs() {
  const pageIndex = state.cropPreviewPage - 1;
  const size = state.cropPageSizes.get(pageIndex) || { width: 612, height: 792 };
  
  // Read points values
  const ptLeft = parseFloat(elements.cropMarginLeft.value) || 0;
  const ptTop = parseFloat(elements.cropMarginTop.value) || 0;
  const ptRight = parseFloat(elements.cropMarginRight.value) || 0;
  const ptBottom = parseFloat(elements.cropMarginBottom.value) || 0;
  
  // Convert back to fractions
  let left = ptLeft / size.width;
  let top = ptTop / size.height;
  let right = ptRight / size.width;
  let bottom = ptBottom / size.height;
  
  // Validate and clamp
  left = Math.max(0, Math.min(left, 1));
  top = Math.max(0, Math.min(top, 1));
  right = Math.max(0, Math.min(right, 1 - left));
  bottom = Math.max(0, Math.min(bottom, 1 - top));
  
  const width = 1 - left - right;
  const height = 1 - top - bottom;
  
  state.cropBounds = { left, top, width, height };
  
  // Re-update overlay UI (this clamps visual input values if they were out-of-bounds)
  const container = elements.cropPreviewContainer;
  const overlay = elements.cropOverlay;
  const contWidth = container.clientWidth || 300;
  const contHeight = container.clientHeight || 400;
  
  overlay.style.left = `${left * contWidth}px`;
  overlay.style.top = `${top * contHeight}px`;
  overlay.style.width = `${width * contWidth}px`;
  overlay.style.height = `${height * contHeight}px`;
}

/**
 * Visual crop box dragging and resizing
 */
function setupCropDragAndResize() {
  const overlay = elements.cropOverlay;
  const container = elements.cropPreviewContainer;
  if (!overlay || !container) return;
  
  let isDragging = false;
  let activeHandle = null; // 'tl', 'tr', 'bl', 'br', or null
  
  let startX, startY;
  let startLeft, startTop, startWidth, startHeight;
  
  overlay.addEventListener('mousedown', startAction);
  overlay.addEventListener('touchstart', startAction, { passive: false });
  
  function startAction(e) {
    e.preventDefault();
    const event = e.touches ? e.touches[0] : e;
    
    const handleElement = e.target.closest('.crop-handle');
    if (handleElement) {
      activeHandle = handleElement.dataset.handle;
    } else {
      activeHandle = null;
    }
    
    isDragging = true;
    startX = event.clientX;
    startY = event.clientY;
    
    startLeft = parseFloat(overlay.style.left) || 0;
    startTop = parseFloat(overlay.style.top) || 0;
    startWidth = parseFloat(overlay.style.width) || 0;
    startHeight = parseFloat(overlay.style.height) || 0;
    
    document.addEventListener('mousemove', moveAction);
    document.addEventListener('mouseup', endAction);
    document.addEventListener('touchmove', moveAction, { passive: false });
    document.addEventListener('touchend', endAction);
  }
  
  function moveAction(e) {
    if (!isDragging) return;
    e.preventDefault();
    const event = e.touches ? e.touches[0] : e;
    
    const dx = event.clientX - startX;
    const dy = event.clientY - startY;
    
    const contWidth = container.clientWidth;
    const contHeight = container.clientHeight;
    
    let newLeft = startLeft;
    let newTop = startTop;
    let newWidth = startWidth;
    let newHeight = startHeight;
    
    if (activeHandle === null) {
      newLeft = Math.max(0, Math.min(startLeft + dx, contWidth - startWidth));
      newTop = Math.max(0, Math.min(startTop + dy, contHeight - startHeight));
    } else {
      const minSize = 20;
      if (activeHandle.includes('l')) {
        const potentialLeft = startLeft + dx;
        const boundedLeft = Math.max(0, Math.min(potentialLeft, startLeft + startWidth - minSize));
        newLeft = boundedLeft;
        newWidth = startWidth - (boundedLeft - startLeft);
      }
      if (activeHandle.includes('r')) {
        newWidth = Math.max(minSize, Math.min(startWidth + dx, contWidth - startLeft));
      }
      if (activeHandle.includes('t')) {
        const potentialTop = startTop + dy;
        const boundedTop = Math.max(0, Math.min(potentialTop, startTop + startHeight - minSize));
        newTop = boundedTop;
        newHeight = startHeight - (boundedTop - startTop);
      }
      if (activeHandle.includes('b')) {
        newHeight = Math.max(minSize, Math.min(startHeight + dy, contHeight - startTop));
      }
    }
    
    state.cropBounds = {
      left: newLeft / contWidth,
      top: newTop / contHeight,
      width: newWidth / contWidth,
      height: newHeight / contHeight
    };
    
    overlay.style.left = `${newLeft}px`;
    overlay.style.top = `${newTop}px`;
    overlay.style.width = `${newWidth}px`;
    overlay.style.height = `${newHeight}px`;
    
    const pageIndex = state.cropPreviewPage - 1;
    const size = state.cropPageSizes.get(pageIndex) || { width: 612, height: 792 };
    
    elements.cropMarginLeft.value = Math.round(state.cropBounds.left * size.width);
    elements.cropMarginTop.value = Math.round(state.cropBounds.top * size.height);
    elements.cropMarginRight.value = Math.round((1 - state.cropBounds.left - state.cropBounds.width) * size.width);
    elements.cropMarginBottom.value = Math.round((1 - state.cropBounds.top - state.cropBounds.height) * size.height);
  }
  
  function endAction() {
    isDragging = false;
    activeHandle = null;
    document.removeEventListener('mousemove', moveAction);
    document.removeEventListener('mouseup', endAction);
    document.removeEventListener('touchmove', moveAction);
    document.removeEventListener('touchend', endAction);
  }
}

/**
 * Setup preset button handlers
 */
function setupCropPresets() {
  const resetBtn = document.getElementById('cropPresetReset');
  const marginsBtn = document.getElementById('cropPresetMargins');
  const headerBtn = document.getElementById('cropPresetHeader');
  const footerBtn = document.getElementById('cropPresetFooter');
  
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      state.cropBounds = { left: 0, top: 0, width: 1, height: 1 };
      updateCropOverlayUI();
    });
  }
  
  if (marginsBtn) {
    marginsBtn.addEventListener('click', () => {
      elements.cropMarginLeft.value = 36;
      elements.cropMarginTop.value = 36;
      elements.cropMarginRight.value = 36;
      elements.cropMarginBottom.value = 36;
      updateBoundsFromInputs();
    });
  }
  
  if (headerBtn) {
    headerBtn.addEventListener('click', () => {
      elements.cropMarginLeft.value = 0;
      elements.cropMarginTop.value = 86;
      elements.cropMarginRight.value = 0;
      elements.cropMarginBottom.value = 0;
      updateBoundsFromInputs();
    });
  }
  
  if (footerBtn) {
    footerBtn.addEventListener('click', () => {
      elements.cropMarginLeft.value = 0;
      elements.cropMarginTop.value = 0;
      elements.cropMarginRight.value = 0;
      elements.cropMarginBottom.value = 86;
      updateBoundsFromInputs();
    });
  }
}

/**
 * Setup crop scope radio bindings
 */
function setupCropScopeListeners() {
  document.querySelectorAll('input[name="cropScope"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      if (e.target.value === 'range') {
        elements.cropScopeRange.classList.remove('hidden');
        elements.cropScopeRange.focus();
      } else {
        elements.cropScopeRange.classList.add('hidden');
      }
    });
  });
}

/**
 * Main Crop tool listeners initializer
 */
function setupCropEventListeners() {
  if (elements.cropPageSelect) {
    elements.cropPageSelect.addEventListener('change', async (e) => {
      state.cropPreviewPage = parseInt(e.target.value, 10);
      await loadCropPagePreview();
    });
  }

  const marginInputs = [elements.cropMarginTop, elements.cropMarginBottom, elements.cropMarginLeft, elements.cropMarginRight];
  marginInputs.forEach(input => {
    if (input) {
      input.addEventListener('input', () => {
        updateBoundsFromInputs();
      });
    }
  });

  setupCropPresets();
  setupCropScopeListeners();
  setupCropDragAndResize();
}

/**
 * Main Unlock tool listeners initializer
 */
function setupUnlockEventListeners() {
  if (elements.toggleUnlockPasswordVisibility) {
    elements.toggleUnlockPasswordVisibility.addEventListener('click', () => {
      const input = elements.unlockPassword;
      if (!input) return;
      
      if (input.type === 'password') {
        input.type = 'text';
        elements.toggleUnlockPasswordVisibility.innerHTML = `
          <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <use href="../assets/icons/icons.svg#icon-eye-off"></use>
          </svg>
        `;
      } else {
        input.type = 'password';
        elements.toggleUnlockPasswordVisibility.innerHTML = `
          <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <use href="../assets/icons/icons.svg#icon-eye"></use>
          </svg>
        `;
      }
    });
  }

  if (elements.unlockPassword) {
    elements.unlockPassword.addEventListener('input', () => {
      elements.unlockPassword.style.borderColor = '';
    });
  }
}

/**
 * Display options/results for PDF unlocking
 */
function displayUnlockOptionsUI() {
  const file = state.selectedFiles[0];
  console.log('[Unlock UI] Displaying options for file:', file ? file.name : null);
  if (!file) return;

  const metadata = state.fileMetadata.get(file);
  console.log('[Unlock UI] Retrieved metadata:', metadata);
  const isEncrypted = metadata ? metadata.encrypted : false;
  console.log('[Unlock UI] isEncrypted flag:', isEncrypted, 'state.isCurrentFileEncrypted:', state.isCurrentFileEncrypted);

  // Hide everything first
  if (elements.unlockFileInfo) elements.unlockFileInfo.classList.add('hidden');
  if (elements.unlockPasswordContainer) elements.unlockPasswordContainer.classList.add('hidden');
  if (elements.unlockNotEncryptedInfo) elements.unlockNotEncryptedInfo.classList.add('hidden');

  if (isEncrypted) {
    // Show File Info
    if (elements.unlockFileName) elements.unlockFileName.textContent = file.name;
    if (elements.unlockFileSize) elements.unlockFileSize.textContent = formatFileSize(file.size);
    
    let algoDesc = 'Unknown';
    if (metadata && metadata.encInfo) {
      const info = metadata.encInfo;
      algoDesc = `${info.algorithm || 'AES-256'} (V=${info.version || 5}, R=${info.revision || 6})`;
      if (info.keyLength) {
        algoDesc += `, ${info.keyLength}-bit`;
      }
    }
    if (elements.unlockFileAlgorithm) elements.unlockFileAlgorithm.textContent = algoDesc;

    console.log('[Unlock UI] Removing hidden class from elements');
    if (elements.unlockFileInfo) elements.unlockFileInfo.classList.remove('hidden');
    if (elements.unlockPasswordContainer) elements.unlockPasswordContainer.classList.remove('hidden');
    
    if (elements.unlockPassword) {
      elements.unlockPassword.value = '';
      elements.unlockPassword.style.borderColor = '';
      elements.unlockPassword.focus();
    }
  } else {
    console.log('[Unlock UI] Showing non-encrypted info');
    // Show Not Encrypted Message
    if (elements.unlockNotEncryptedInfo) elements.unlockNotEncryptedInfo.classList.remove('hidden');
  }
}

function initProtectUI() {
  if (elements.protectRequireOpenPassword) elements.protectRequireOpenPassword.checked = false;
  if (elements.protectOpenPasswordContainer) elements.protectOpenPasswordContainer.classList.add('hidden');
  if (elements.protectOpenPassword) {
    elements.protectOpenPassword.value = '';
    elements.protectOpenPassword.style.borderColor = '';
  }
  
  if (elements.protectRestrictPermissions) elements.protectRestrictPermissions.checked = false;
  if (elements.protectPermissionsContainer) elements.protectPermissionsContainer.classList.add('hidden');
  if (elements.protectPermissionsPassword) {
    elements.protectPermissionsPassword.value = '';
    elements.protectPermissionsPassword.style.borderColor = '';
  }
  
  if (elements.protectAllowPrinting) elements.protectAllowPrinting.checked = true;
  if (elements.protectAllowCopying) elements.protectAllowCopying.checked = true;
  if (elements.protectAllowModifying) elements.protectAllowModifying.checked = true;
  if (elements.protectAllowAnnotating) elements.protectAllowAnnotating.checked = true;
  if (elements.protectEncryptMetadata) elements.protectEncryptMetadata.checked = true;
}

function initRepairUI() {
  if (elements.repairOptimizeLayout) elements.repairOptimizeLayout.checked = true;
}

function initMetadataUI() {
  if (elements.metadataTitle) elements.metadataTitle.value = '';
  if (elements.metadataAuthor) elements.metadataAuthor.value = '';
  if (elements.metadataSubject) elements.metadataSubject.value = '';
  if (elements.metadataKeywords) elements.metadataKeywords.value = '';
}

function setupProtectEventListeners() {
  // Checkbox: Require Open Password
  if (elements.protectRequireOpenPassword) {
    elements.protectRequireOpenPassword.addEventListener('change', () => {
      const show = elements.protectRequireOpenPassword.checked;
      if (show) {
        elements.protectOpenPasswordContainer.classList.remove('hidden');
        elements.protectOpenPassword.focus();
      } else {
        elements.protectOpenPasswordContainer.classList.add('hidden');
      }
    });
  }

  // Checkbox: Restrict Permissions
  if (elements.protectRestrictPermissions) {
    elements.protectRestrictPermissions.addEventListener('change', () => {
      const show = elements.protectRestrictPermissions.checked;
      if (show) {
        elements.protectPermissionsContainer.classList.remove('hidden');
        elements.protectPermissionsPassword.focus();
      } else {
        elements.protectPermissionsContainer.classList.add('hidden');
      }
    });
  }

  // Visibility toggle: Open Password
  if (elements.toggleProtectOpenPasswordVisibility) {
    elements.toggleProtectOpenPasswordVisibility.addEventListener('click', () => {
      const input = elements.protectOpenPassword;
      if (!input) return;
      if (input.type === 'password') {
        input.type = 'text';
        elements.toggleProtectOpenPasswordVisibility.innerHTML = `
          <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <use href="../assets/icons/icons.svg#icon-eye-off"></use>
          </svg>
        `;
      } else {
        input.type = 'password';
        elements.toggleProtectOpenPasswordVisibility.innerHTML = `
          <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <use href="../assets/icons/icons.svg#icon-eye"></use>
          </svg>
        `;
      }
    });
  }

  // Visibility toggle: Permissions Password
  if (elements.toggleProtectPermissionsPasswordVisibility) {
    elements.toggleProtectPermissionsPasswordVisibility.addEventListener('click', () => {
      const input = elements.protectPermissionsPassword;
      if (!input) return;
      if (input.type === 'password') {
        input.type = 'text';
        elements.toggleProtectPermissionsPasswordVisibility.innerHTML = `
          <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <use href="../assets/icons/icons.svg#icon-eye-off"></use>
          </svg>
        `;
      } else {
        input.type = 'password';
        elements.toggleProtectPermissionsPasswordVisibility.innerHTML = `
          <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <use href="../assets/icons/icons.svg#icon-eye"></use>
          </svg>
        `;
      }
    });
  }

  // Input listeners to reset validation borders
  if (elements.protectOpenPassword) {
    elements.protectOpenPassword.addEventListener('input', () => {
      elements.protectOpenPassword.style.borderColor = '';
    });
  }
  if (elements.protectPermissionsPassword) {
    elements.protectPermissionsPassword.addEventListener('input', () => {
      elements.protectPermissionsPassword.style.borderColor = '';
    });
  }
}

// --- EXTRA Roadmap Features Helper Functions ---

// 1. Dim Previews
function toggleDimPreviews(dimmed) {
  try {
    localStorage.setItem('dim_previews', dimmed ? 'true' : 'false');
  } catch (e) {}
  
  if (elements.dimToggle) {
    elements.dimToggle.checked = dimmed;
  }
  
  document.querySelectorAll('.page-thumbnail').forEach(canvas => {
    canvas.classList.toggle('dim-page', dimmed);
  });
}

// 2. Global Undo/Redo
function saveHistoryState() {
  const snapshot = {
    selectedPages: new Set(state.selectedPages),
    pageOrder: [...state.pageOrder],
    pageRotations: new Map(state.pageRotations)
  };
  
  state.historyUndoStack.push(snapshot);
  state.historyRedoStack = []; // Reset Redo stack on new action
  
  updateUndoRedoButtons();
}

// Ensure global reference for handlers in reorder.js if needed
window.saveHistoryState = saveHistoryState;

function updateUndoRedoButtons() {
  const hasUndo = state.historyUndoStack && state.historyUndoStack.length > 0;
  const hasRedo = state.historyRedoStack && state.historyRedoStack.length > 0;
  
  if (elements.undoBtn) {
    elements.undoBtn.disabled = !hasUndo;
    elements.undoBtn.classList.toggle('opacity-50', !hasUndo);
  }
  if (elements.redoBtn) {
    elements.redoBtn.disabled = !hasRedo;
    elements.redoBtn.classList.toggle('opacity-50', !hasRedo);
  }
}

function undo() {
  if (!state.historyUndoStack || state.historyUndoStack.length === 0) return;
  
  const currentSnapshot = {
    selectedPages: new Set(state.selectedPages),
    pageOrder: [...state.pageOrder],
    pageRotations: new Map(state.pageRotations)
  };
  state.historyRedoStack.push(currentSnapshot);
  
  const prevSnapshot = state.historyUndoStack.pop();
  state.selectedPages = prevSnapshot.selectedPages;
  state.pageOrder = prevSnapshot.pageOrder;
  state.pageRotations = prevSnapshot.pageRotations;
  
  updateUndoRedoButtons();
  refreshActiveToolUI();
}

function redo() {
  if (!state.historyRedoStack || state.historyRedoStack.length === 0) return;
  
  const currentSnapshot = {
    selectedPages: new Set(state.selectedPages),
    pageOrder: [...state.pageOrder],
    pageRotations: new Map(state.pageRotations)
  };
  state.historyUndoStack.push(currentSnapshot);
  
  const nextSnapshot = state.historyRedoStack.pop();
  state.selectedPages = nextSnapshot.selectedPages;
  state.pageOrder = nextSnapshot.pageOrder;
  state.pageRotations = nextSnapshot.pageRotations;
  
  updateUndoRedoButtons();
  refreshActiveToolUI();
}

function refreshActiveToolUI() {
  if (state.currentTool === 'extract') {
    renderPageSelector('extractPageSelector');
  } else if (state.currentTool === 'rotate') {
    renderPageSelector('rotatePageSelector');
  } else if (state.currentTool === 'delete') {
    renderPageSelector('deletePageSelector');
  } else if (state.currentTool === 'reorder') {
    renderReorderList();
  } else if (state.currentTool === 'pdfToImg') {
    renderPageSelector('pdfToImgPageSelector');
  }
}

// 3. Action Preset Blueprints
function populateBlueprintsDropdown() {
  if (!elements.blueprintSelect) return;
  
  // Clear existing options except the placeholder
  elements.blueprintSelect.innerHTML = '<option value="">Apply Action Preset...</option>';
  
  try {
    const blueprints = JSON.parse(localStorage.getItem('pdf_action_blueprints') || '{}');
    Object.keys(blueprints).forEach(name => {
      const option = document.createElement('option');
      option.value = name;
      option.textContent = name;
      elements.blueprintSelect.appendChild(option);
    });
  } catch (e) {
    console.error('Error loading blueprints from localStorage:', e);
  }
  
  if (elements.deleteBlueprintBtn) {
    elements.deleteBlueprintBtn.classList.add('hidden');
  }
}

function saveBlueprint() {
  const presetName = prompt('Enter a name for this action preset / blueprint:');
  if (!presetName) return;
  
  const trimmedName = presetName.trim();
  if (!trimmedName) {
    showStatus('Preset name cannot be empty', 'error');
    return;
  }
  
  const blueprintData = {
    pageRotations: Array.from(state.pageRotations.entries()),
    selectedPages: Array.from(state.selectedPages)
  };
  
  try {
    const blueprints = JSON.parse(localStorage.getItem('pdf_action_blueprints') || '{}');
    blueprints[trimmedName] = blueprintData;
    localStorage.setItem('pdf_action_blueprints', JSON.stringify(blueprints));
    
    showStatus(`Preset "${trimmedName}" saved successfully!`, 'success');
    populateBlueprintsDropdown();
  } catch (e) {
    showStatus('Failed to save preset: ' + e.message, 'error');
  }
}

function applyBlueprint(name) {
  if (!name) {
    if (elements.deleteBlueprintBtn) {
      elements.deleteBlueprintBtn.classList.add('hidden');
    }
    return;
  }
  
  try {
    const blueprints = JSON.parse(localStorage.getItem('pdf_action_blueprints') || '{}');
    const blueprint = blueprints[name];
    if (!blueprint) {
      showStatus('Preset not found', 'error');
      return;
    }
    
    saveHistoryState();
    
    // Restore rotations (making sure indices are within bounds)
    state.pageRotations.clear();
    if (blueprint.pageRotations) {
      blueprint.pageRotations.forEach(([idx, rot]) => {
        if (idx <= state.pageCount) {
          state.pageRotations.set(idx, rot);
        }
      });
    }
    
    // Restore selections (making sure indices are within bounds)
    state.selectedPages.clear();
    if (blueprint.selectedPages) {
      blueprint.selectedPages.forEach(idx => {
        if (idx <= state.pageCount) {
          state.selectedPages.add(idx);
        }
      });
    }
    
    refreshActiveToolUI();
    showStatus(`Applied preset "${name}"`, 'success');
    
    if (elements.deleteBlueprintBtn) {
      elements.deleteBlueprintBtn.classList.remove('hidden');
    }
  } catch (e) {
    showStatus('Failed to apply preset: ' + e.message, 'error');
  }
}

function deleteBlueprint() {
  const selectedName = elements.blueprintSelect.value;
  if (!selectedName) return;
  
  if (!confirm(`Are you sure you want to delete the preset "${selectedName}"?`)) return;
  
  try {
    const blueprints = JSON.parse(localStorage.getItem('pdf_action_blueprints') || '{}');
    delete blueprints[selectedName];
    localStorage.setItem('pdf_action_blueprints', JSON.stringify(blueprints));
    
    showStatus(`Preset "${selectedName}" deleted`, 'success');
    populateBlueprintsDropdown();
  } catch (e) {
    showStatus('Failed to delete preset: ' + e.message, 'error');
  }
}

// 4. Privacy Scoreboard
function recordOfflineMetrics(fileCount, totalBytes) {
  try {
    const storedFiles = parseInt(localStorage.getItem('privacy_files_processed') || '0', 10);
    const storedSavings = parseFloat(localStorage.getItem('privacy_bytes_saved') || '0');
    
    localStorage.setItem('privacy_files_processed', (storedFiles + fileCount).toString());
    localStorage.setItem('privacy_bytes_saved', (storedSavings + totalBytes).toString());
    
    displayPrivacyScore();
  } catch (e) {
    console.error('Error writing metrics to localStorage:', e);
  }
}

function displayPrivacyScore() {
  try {
    const files = localStorage.getItem('privacy_files_processed') || '0';
    const bytes = parseFloat(localStorage.getItem('privacy_bytes_saved') || '0');
    const mb = bytes / (1024 * 1024);
    
    if (elements.scoreboardFiles) {
      elements.scoreboardFiles.textContent = files;
    }
    if (elements.scoreboardSavings) {
      elements.scoreboardSavings.textContent = mb.toFixed(2);
    }
  } catch (e) {
    console.error('Error reading metrics from localStorage:', e);
  }
}

// 5. Initialize Watermark UI
function initWatermarkUI() {
  if (elements.watermarkModeTextBtn) {
    elements.watermarkModeTextBtn.classList.add('selected');
    elements.watermarkModeNumBtn.classList.remove('selected');
  }
  if (elements.watermarkTextFields) {
    elements.watermarkTextFields.classList.remove('hidden');
  }
  if (elements.watermarkNumFields) {
    elements.watermarkNumFields.classList.add('hidden');
  }
  
  // Set default values and reset values displays
  if (elements.watermarkText) elements.watermarkText.value = 'DRAFT';
  if (elements.watermarkFontSize) elements.watermarkFontSize.value = '60';
  if (elements.watermarkFontSizeVal) elements.watermarkFontSizeVal.textContent = '60pt';
  
  if (elements.watermarkRotation) elements.watermarkRotation.value = '45';
  if (elements.watermarkRotationVal) elements.watermarkRotationVal.textContent = '45°';
  
  if (elements.watermarkColor) elements.watermarkColor.value = '#ff0000';
  if (elements.watermarkColorHex) elements.watermarkColorHex.value = '#ff0000';
  
  if (elements.watermarkOpacity) elements.watermarkOpacity.value = '30';
  if (elements.watermarkOpacityVal) elements.watermarkOpacityVal.textContent = '30%';
  
  if (elements.pageNumberFormat) elements.pageNumberFormat.value = 'Page X of Y';
  if (elements.pageNumberAlign) elements.pageNumberAlign.value = 'bottom-center';
  if (elements.pageNumberStart) elements.pageNumberStart.value = '1';
  if (elements.pageNumberColor) elements.pageNumberColor.value = '#000000';
  if (elements.pageNumberColorHex) elements.pageNumberColorHex.value = '#000000';
  if (elements.pageNumberFontSize) elements.pageNumberFontSize.value = '10';
  if (elements.pageNumberFontSizeVal) elements.pageNumberFontSizeVal.textContent = '10pt';
  if (elements.pageNumberMargin) elements.pageNumberMargin.value = '36';
  if (elements.pageNumberMarginVal) elements.pageNumberMarginVal.textContent = '36pt';
}


// Initialize on load
init();

// Theme toggle logic — robust and accessible
(function(){
  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }
  ready(function() {
    const checkbox = document.getElementById('themeToggle');
    const root = document.documentElement;
    function safeSetStorage(key, value) {
      try { localStorage.setItem(key, value); } catch (e) { /* ignore */ }
    }
    function applyTheme(theme) {
      if (theme === 'dark') {
        root.classList.add('dark-theme');
        root.classList.remove('light-theme');
        if (checkbox) checkbox.checked = true;
      } else {
        root.classList.add('light-theme');
        root.classList.remove('dark-theme');
        if (checkbox) checkbox.checked = false;
      }
      safeSetStorage('theme', theme);
    }
    function toggleTheme() {
      const isDark = root.classList.contains('dark-theme');
      applyTheme(isDark ? 'light' : 'dark');
    }
    (function init() {
      let saved = null;
      try { saved = localStorage.getItem('theme'); } catch (e) {}
      if (saved) {
        applyTheme(saved);
        return;
      }
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      applyTheme(prefersDark ? 'dark' : 'light');
    })();
    if (!checkbox) {
      console.warn('Theme toggle checkbox not found');
      return;
    }
    checkbox.addEventListener('change', toggleTheme);
  });
})();
