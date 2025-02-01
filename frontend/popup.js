document.addEventListener('DOMContentLoaded', () => {
    const localModelRadio = document.getElementById('localModel');
    const externalModelRadio = document.getElementById('externalModel');
    const localSection = document.getElementById('localSection');
    const externalSection = document.getElementById('externalSection');
    const saveSettingsBtn = document.getElementById('saveSettings');
  
    // Show/hide sections based on which radio is selected
    function updateModelSections() {
      if (localModelRadio.checked) {
        localSection.style.display = 'block';
        externalSection.style.display = 'none';
      } else {
        localSection.style.display = 'none';
        externalSection.style.display = 'block';
      }
    }
  
    // Listen for changes in the radio buttons
    localModelRadio.addEventListener('change', updateModelSections);
    externalModelRadio.addEventListener('change', updateModelSections);
  
    // Load any previously saved settings from chrome.storage
    chrome.storage.sync.get(['modelType', 'localEndpoint', 'openAiApiKey', 'language'], (data) => {
      // Default to local if not set
      const modelType = data.modelType || 'local';
      if (modelType === 'external') {
        externalModelRadio.checked = true;
      } else {
        localModelRadio.checked = true;
      }
  
      document.getElementById('localEndpoint').value = data.localEndpoint || '';
      document.getElementById('openAiApiKey').value = data.openAiApiKey || '';
      document.getElementById('language').value = data.language || 'en';
  
      updateModelSections();
    });
  
    // Save button
    saveSettingsBtn.addEventListener('click', () => {
      const modelType = localModelRadio.checked ? 'local' : 'external';
      const localEndpoint = document.getElementById('localEndpoint').value;
      const openAiApiKey = document.getElementById('openAiApiKey').value;
      const language = document.getElementById('language').value;
  
      // Save the settings in chrome.storage.sync
      chrome.storage.sync.set({
        modelType,
        localEndpoint,
        openAiApiKey,
        language
      }, () => {
        console.log('Examplify settings saved.');
        window.close();
      });
    });
  });