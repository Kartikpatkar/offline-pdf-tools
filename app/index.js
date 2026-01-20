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
  pageCount: 0,
  selectedPages: new Set(),
  pageOrder: []
};

// DOM Elements
const elements = {
  toolButtons: document.querySelectorAll('.tool-btn'),
  uploadArea: document.getElementById('uploadArea'),
  fileInput: document.getElementById('fileInput'),
  fileList: document.getElementById('fileList'),
  fileItems: document.getElementById('fileItems'),
  clearFiles: document.getElementById('clearFiles'),
  uploadSection: document.getElementById('uploadSection'),
  uploadTitle: document.getElementById('uploadTitle'),
  uploadHint: document.getElementById('uploadHint'),
  toolOptions: document.getElementById('toolOptions'),
  splitOptions: document.getElementById('splitOptions'),
  extractOptions: document.getElementById('extractOptions'),
  rotateOptions: document.getElementById('rotateOptions'),
  deleteOptions: document.getElementById('deleteOptions'),
  reorderOptions: document.getElementById('reorderOptions'),
  actionSection: document.getElementById('actionSection'),
  processBtn: document.getElementById('processBtn'),
  processBtnText: document.getElementById('processBtnText'),
  resetBtn: document.getElementById('resetBtn'),
  statusSection: document.getElementById('statusSection'),
  statusMessage: document.getElementById('statusMessage'),
  progressBar: document.getElementById('progressBar'),
  pageRange: document.getElementById('pageRange'),
  totalPages: document.getElementById('totalPages')
};

// Initialize App
function init() {
  setupEventListeners();
  console.log('Offline PDF Tools initialized - 100% private, 100% offline');
}

// Setup Event Listeners
function setupEventListeners() {
  // Tool selection
  elements.toolButtons.forEach(btn => {
    btn.addEventListener('click', () => selectTool(btn.dataset.tool));
  });

  // File upload
  elements.uploadArea.addEventListener('click', () => elements.fileInput.click());
  elements.fileInput.addEventListener('change', handleFileSelect);
  
  // Drag and drop
  elements.uploadArea.addEventListener('dragover', handleDragOver);
  elements.uploadArea.addEventListener('dragleave', handleDragLeave);
  elements.uploadArea.addEventListener('drop', handleDrop);

  // Clear files
  elements.clearFiles.addEventListener('click', clearFiles);

  // Process button
  elements.processBtn.addEventListener('click', processFiles);

  // Reset button
  elements.resetBtn.addEventListener('click', reset);
}

// Tool Selection
function selectTool(tool) {
  state.currentTool = tool;
  
  // Update UI
  elements.toolButtons.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tool === tool);
  });

  // Update upload section text
  const uploadTexts = {
    merge: { title: 'Select multiple PDFs to merge', hint: 'Select 2 or more PDF files', multiple: true },
    split: { title: 'Select PDF to split', hint: 'Select a single PDF file', multiple: false },
    extract: { title: 'Select PDF to extract pages from', hint: 'Select a single PDF file', multiple: false },
    rotate: { title: 'Select PDF to rotate pages', hint: 'Select a single PDF file', multiple: false },
    delete: { title: 'Select PDF to delete pages from', hint: 'Select a single PDF file', multiple: false },
    reorder: { title: 'Select PDF to reorder pages', hint: 'Select a single PDF file', multiple: false }
  };

  const config = uploadTexts[tool];
  elements.uploadTitle.textContent = config.title;
  elements.uploadHint.textContent = config.hint;
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
  elements.processBtnText.textContent = buttonTexts[tool];

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
  elements.uploadArea.classList.add('drag-over');
}

function handleDragLeave(event) {
  event.preventDefault();
  elements.uploadArea.classList.remove('drag-over');
}

function handleDrop(event) {
  event.preventDefault();
  elements.uploadArea.classList.remove('drag-over');
  
  const files = Array.from(event.dataTransfer.files);
  addFiles(files);
}

async function addFiles(files) {
  // Validate PDFs
  if (!areAllPDFs(files)) {
    showStatus('Please select only PDF files', 'error');
    return;
  }

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

function displayFileList() {
  elements.fileItems.innerHTML = '';
  
  state.selectedFiles.forEach((file, index) => {
    const li = document.createElement('li');
    li.innerHTML = `
      <span>${file.name} (${formatFileSize(file.size)})</span>
      <button class="btn-secondary" onclick="removeFile(${index})">Remove</button>
    `;
    elements.fileItems.appendChild(li);
  });

  if (state.selectedFiles.length > 0) {
    elements.fileList.style.display = 'block';
    elements.actionSection.style.display = 'block';
  } else {
    elements.fileList.style.display = 'none';
    elements.actionSection.style.display = 'none';
  }
}

function clearFiles() {
  state.selectedFiles = [];
  state.pageCount = 0;
  state.selectedPages.clear();
  state.pageOrder = [];
  elements.fileInput.value = '';
  displayFileList();
  hideToolOptions();
  hideStatus();
}

window.removeFile = function(index) {
  state.selectedFiles.splice(index, 1);
  displayFileList();
  if (state.selectedFiles.length === 0) {
    clearFiles();
  }
};

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
  document.querySelectorAll('.option-panel').forEach(panel => {
    panel.style.display = 'none';
  });

  // Show relevant option panel
  const optionPanels = {
    split: elements.splitOptions,
    extract: elements.extractOptions,
    rotate: elements.rotateOptions,
    delete: elements.deleteOptions,
    reorder: elements.reorderOptions
  };

  const panel = optionPanels[state.currentTool];
  if (panel) {
    panel.style.display = 'block';
    elements.toolOptions.style.display = 'block';

    // Initialize tool-specific UI
    if (state.currentTool === 'extract') {
      renderPageSelector('pageSelector');
    } else if (state.currentTool === 'rotate') {
      renderPageSelector('rotatePageSelector');
    } else if (state.currentTool === 'delete') {
      renderPageSelector('deletePageSelector');
    } else if (state.currentTool === 'reorder') {
      renderReorderList();
    }
  } else {
    elements.toolOptions.style.display = 'none';
  }
}

function hideToolOptions() {
  elements.toolOptions.style.display = 'none';
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
  const container = document.getElementById('reorderPageList');
  container.innerHTML = '';

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
        const rangeString = elements.pageRange.value;
        if (!isValidRangeSyntax(rangeString)) {
          throw new Error('Invalid page range syntax');
        }
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
  elements.statusMessage.textContent = message;
  elements.statusMessage.className = `status-message ${type}`;
  elements.statusSection.style.display = 'block';
}

function hideStatus() {
  elements.statusSection.style.display = 'none';
}

function showProgress() {
  elements.progressBar.style.display = 'block';
}

function hideProgress() {
  elements.progressBar.style.display = 'none';
}

// Reset
function reset() {
  state.currentTool = null;
  clearFiles();
  elements.toolButtons.forEach(btn => btn.classList.remove('active'));
  elements.uploadTitle.textContent = 'Drop PDF files here or click to browse';
  elements.uploadHint.textContent = 'Your files never leave your computer';
  hideStatus();
}

// Initialize on load
init();
