// Background service worker for Offline PDF Tools
// Only handles opening the app in a new tab - no data processing here

chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({
    url: chrome.runtime.getURL('../app/index.html')
  });
});

// Log extension installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('Offline PDF Tools installed - 100% private, 100% offline');
  }
});
