chrome.action.onClicked.addListener((tab) => {
  if (tab.url.startsWith('chrome://')) {
    console.log('Cannot run on chrome:// pages');
    return;
  }

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ['content.js'],
  });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'seoDataReady') {
    console.log('Background script received SEO data:', request.data);
    chrome.runtime.sendMessage(request);
  }
});
