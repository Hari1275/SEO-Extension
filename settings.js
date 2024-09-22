document.addEventListener('DOMContentLoaded', function () {
  // Load the saved API key when the page loads
  chrome.storage.sync.get('geminiApiKey', function (data) {
    if (data.geminiApiKey) {
      document.getElementById('apiKey').value = data.geminiApiKey;
    }
  });

  // Save the API key when the save button is clicked
  document.getElementById('saveApiKey').addEventListener('click', function () {
    var apiKey = document.getElementById('apiKey').value;
    chrome.storage.sync.set({ geminiApiKey: apiKey }, function () {
      console.log('API key saved');
      document.getElementById('status').textContent =
        'API key saved successfully!';
      setTimeout(function () {
        document.getElementById('status').textContent = '';
      }, 3000);
    });
  });
});
