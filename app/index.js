/**
 * Main Application Logic
 * Handles UI interactions and coordinates PDF operations
 */

import pdfService from '../services/pdfService.js';
import { downloadPDF, generateTimestampedFilename, isPDF, areAllPDFs, formatFileSize } from '../utils/fileUtils.js';
import { parsePageRange, isValidRangeSyntax } from '../utils/rangeParser.js';

// Application State
const state = {
  currentTool: null,
  selectedFiles: [],
  fileMetadata: new Map(), // Store page counts for files
  pageCount: 0,
  selectedPages: new Set(),
  pageOrder: []
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
  pageFrom: document.getElementById('pageFrom'),
  pageTo: document.getElementById('pageTo'),
  totalPages: document.getElementById('totalPages')
};

// Initialize App
function init() {
  setupEventListeners();
  // Set default tool to merge (matches the active tab in HTML)
  selectTool('merge');
  console.log('Offline PDF Tools initialized - 100% private, 100% offline');
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
  elements.clearFiles.addEventListener('click', clearFiles);

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
      icon: 'ℹ️'
    },
    split: {
      title: 'How it works',
      desc: 'Extract specific page ranges into a new PDF. Use commas for individual pages and dashes for ranges.',
      icon: 'ℹ️'
    },
    extract: {
      title: 'How it works',
      desc: 'Select individual pages to create a new PDF. Click on pages to toggle selection.',
      icon: 'ℹ️'
    },
    rotate: {
      title: 'How it works',
      desc: 'Rotate selected pages by your chosen angle. Select rotation direction first, then choose pages.',
      icon: 'ℹ️'
    },
    delete: {
      title: 'How it works',
      desc: 'Remove unwanted pages from your PDF. Select the pages you want to delete.',
      icon: 'ℹ️'
    },
    reorder: {
      title: 'How it works',
      desc: 'Drag and drop pages to rearrange their order in the PDF document.',
      icon: 'ℹ️'
    }
  };

  // Update tool description
  const info = toolInfo[tool];
  elements.toolDescription.innerHTML = `
    <div class="flex items-start gap-3">
      <div class="text-2xl">${info.icon}</div>
      <div>
        <h3 class="font-semibold text-lg mb-1" style="color: var(--text-color);">${info.title}</h3>
        <p class="text-sm" style="color: var(--text-color); opacity: 0.7;">${info.desc}</p>
      </div>
    </div>
  `;

  // Update upload section text
  const uploadTexts = {
    merge: { title: 'Drop your PDF files here', multiple: true },
    split: { title: 'Drop your PDF file here', multiple: false },
    extract: { title: 'Drop your PDF file here', multiple: false },
    rotate: { title: 'Drop your PDF file here', multiple: false },
    delete: { title: 'Drop your PDF file here', multiple: false },
    reorder: { title: 'Drop your PDF file here', multiple: false }
  };

  const config = uploadTexts[tool];
  elements.uploadTitle.textContent = config.title;
  elements.fileInput.multiple = config.multiple;
  elements.fileInput.multiple = config.multiple;

  // Update process button text
  const buttonTexts = {
    merge: 'Merge PDFs',
    split: 'Split PDF',
    extract: 'Extract Pages',
    rotate: 'Rotate Pages',
    delete: 'Delete Pages',
    reorder: 'Reorder & Export'
  };
  elements.btnText.textContent = buttonTexts[tool];

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
  
  // Validate PDFs
  if (!areAllPDFs(files)) {
    console.log('Files are not PDFs');
    showStatus('Please select only PDF files', 'error');
    return;
  }

  console.log('All files are PDFs');

  // Check file count based on tool
  if (state.currentTool === 'merge') {
    state.selectedFiles = [...state.selectedFiles, ...files];
  } else {
    if (files.length > 1) {
      showStatus('Please select only one PDF file', 'warning');
      return;
    }
    state.selectedFiles = files;
  }

  console.log('Selected files:', state.selectedFiles);

  // Load page counts for all files
  for (const file of state.selectedFiles) {
    if (!state.fileMetadata.has(file)) {
      try {
        const pageCount = await pdfService.getPageCount(file);
        state.fileMetadata.set(file, { pageCount });
      } catch (error) {
        console.error('Error loading page count for', file.name, error);
        state.fileMetadata.set(file, { pageCount: '?' });
      }
    }
  }

  // Update UI
  displayFileList();
  
  // For single-file tools, load page info
  if (state.currentTool !== 'merge' && state.selectedFiles.length > 0) {
    await loadPageInfo();
  }

  // Show options if file is selected
  if (state.selectedFiles.length > 0) {
    showToolOptions();
  }
}

function getSplitRangeString() {
  const from = parseInt(elements.pageFrom?.value, 10);
  const to = parseInt(elements.pageTo?.value, 10);

  if (Number.isNaN(from) || Number.isNaN(to)) {
    throw new Error('Please enter both From and To pages');
  }
  if (from < 1 || to < 1) {
    throw new Error('Page numbers must be 1 or higher');
  }
  if (state.pageCount && (from > state.pageCount || to > state.pageCount)) {
    throw new Error(`Page numbers must be between 1 and ${state.pageCount}`);
  }
  if (from > to) {
    throw new Error('From page cannot be greater than To page');
  }

  return `${from}-${to}`;
}

function displayFileList() {
  console.log('displayFileList called');
  console.log('elements.fileItems:', elements.fileItems);
  console.log('state.selectedFiles:', state.selectedFiles);
  
  elements.fileItems.innerHTML = '';
  
  state.selectedFiles.forEach((file, index) => {
    console.log('Creating list item for:', file.name);
    const li = document.createElement('li');
    li.className = 'flex items-center justify-between p-3 rounded-lg';
    li.style.backgroundColor = 'var(--secondary-color)';
    
    const metadata = state.fileMetadata.get(file);
    const pageInfo = metadata ? ` · ${metadata.pageCount} pages` : '';
    
    li.innerHTML = `
      <span style="color: var(--text-color);">${file.name} (${formatFileSize(file.size)}${pageInfo})</span>
      <button class="btn-secondary" data-file-index="${index}">Remove</button>
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
  } else {
    elements.filesAndOptionsContainer.classList.add('hidden');
    elements.actionSection.classList.add('hidden');
    elements.uploadSection.classList.remove('hidden');
  }
  
  console.log('Container display:', elements.filesAndOptionsContainer.classList);
}

function clearFiles() {
  state.selectedFiles = [];
  state.fileMetadata.clear();
  state.pageCount = 0;
  state.selectedPages.clear();
  state.pageOrder = [];
  elements.fileInput.value = '';
  if (elements.pageFrom) elements.pageFrom.value = '';
  if (elements.pageTo) elements.pageTo.value = '';
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
    reorder: elements.reorderOptions
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

  const grid = document.createElement('div');
  grid.className = 'page-grid';

  for (let i = 1; i <= state.pageCount; i++) {
    const pageItem = document.createElement('div');
    pageItem.className = 'page-item';
    pageItem.textContent = `Page ${i}`;
    pageItem.dataset.page = i;
    
    pageItem.addEventListener('click', () => {
      if (state.selectedPages.has(i)) {
        state.selectedPages.delete(i);
        pageItem.classList.remove('selected');
      } else {
        state.selectedPages.add(i);
        pageItem.classList.add('selected');
      }
    });

    grid.appendChild(pageItem);
  }

  container.appendChild(grid);
}

// Reorder List
function renderReorderList() {
  const container = document.getElementById('reorderPageSelector');
  container.innerHTML = '';
  container.classList.add('page-grid');

  state.pageOrder.forEach((pageNum, index) => {
    const pageItem = document.createElement('div');
    pageItem.className = 'page-item';
    pageItem.textContent = `Page ${pageNum}`;
    pageItem.draggable = true;
    pageItem.dataset.index = index;

    pageItem.addEventListener('dragstart', handleReorderDragStart);
    pageItem.addEventListener('dragover', handleReorderDragOver);
    pageItem.addEventListener('drop', handleReorderDrop);
    pageItem.addEventListener('dragend', handleReorderDragEnd);

    container.appendChild(pageItem);
  });
}

let draggedIndex = null;

function handleReorderDragStart(event) {
  draggedIndex = parseInt(event.target.dataset.index);
  event.target.classList.add('dragging');
}

function handleReorderDragOver(event) {
  event.preventDefault();
}

function handleReorderDrop(event) {
  event.preventDefault();
  const dropIndex = parseInt(event.target.dataset.index);

  if (draggedIndex !== null && draggedIndex !== dropIndex) {
    // Reorder array
    const [removed] = state.pageOrder.splice(draggedIndex, 1);
    state.pageOrder.splice(dropIndex, 0, removed);
    renderReorderList();
  }
}

function handleReorderDragEnd(event) {
  event.target.classList.remove('dragging');
  draggedIndex = null;
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
        await downloadPDF(result, generateTimestampedFilename('merged'));
        showStatus('PDFs merged successfully!', 'success');
        break;

      case 'split':
        const rangeString = getSplitRangeString();
        result = await pdfService.splitPDF(state.selectedFiles[0], rangeString);
        await downloadPDF(result, generateTimestampedFilename('split'));
        showStatus('PDF split successfully!', 'success');
        break;

      case 'extract':
        if (state.selectedPages.size === 0) {
          throw new Error('Please select pages to extract');
        }
        result = await pdfService.extractPages(state.selectedFiles[0], Array.from(state.selectedPages));
        await downloadPDF(result, generateTimestampedFilename('extracted'));
        showStatus('Pages extracted successfully!', 'success');
        break;

      case 'rotate':
        if (state.selectedPages.size === 0) {
          throw new Error('Please select pages to rotate');
        }
        const rotation = parseInt(document.querySelector('input[name="rotation"]:checked').value);
        result = await pdfService.rotatePages(state.selectedFiles[0], Array.from(state.selectedPages), rotation);
        await downloadPDF(result, generateTimestampedFilename('rotated'));
        showStatus('Pages rotated successfully!', 'success');
        break;

      case 'delete':
        if (state.selectedPages.size === 0) {
          throw new Error('Please select pages to delete');
        }
        result = await pdfService.deletePages(state.selectedFiles[0], Array.from(state.selectedPages));
        await downloadPDF(result, generateTimestampedFilename('modified'));
        showStatus('Pages deleted successfully!', 'success');
        break;

      case 'reorder':
        result = await pdfService.reorderPages(state.selectedFiles[0], state.pageOrder);
        await downloadPDF(result, generateTimestampedFilename('reordered'));
        showStatus('Pages reordered successfully!', 'success');
        break;
    }
  } catch (error) {
    showStatus(`Error: ${error.message}`, 'error');
    console.error('Processing error:', error);
  } finally {
    hideProgress();
    elements.processBtn.disabled = false;
  }
}

// Status & Progress
function showStatus(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = 'card p-4 mb-3';
  toast.style.minWidth = '250px';
  
  const icon = type === 'error' ? '❌' : type === 'warning' ? '⚠️' : type === 'success' ? '✅' : 'ℹ️';
  
  toast.innerHTML = `
    <div class="flex items-center gap-3">
      <span class="text-xl">${icon}</span>
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

// Reset
function reset() {
  state.currentTool = null;
  clearFiles();
  elements.toolTabs.forEach(tab => tab.classList.remove('active'));
  elements.uploadTitle.textContent = 'Drop PDF files here or click to browse';
  hideStatus();
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
