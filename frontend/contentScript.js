const getSystemPrompt = (language) => `
You are part of a Chrome extension that provides concise, illustrative examples to clarify selected text when appropriate.

If the input text lends itself to examples, generate a clear, practical example in just a few sentences. If it does not, respond with: "No examples are applicable for this text."

Your response must be concise, relevant, and contain only the generated example or the default message, without any additional explanation or unnecessary text.

IMPORTANT: Always respond in ${language}.
`;

(function() {
  let examplifyButton = null;
  let exampleBubble = null;

  document.addEventListener('mouseup', handleSelection);
  document.addEventListener('keydown', handleShortcut);

  async function handleSelection() {
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();

    // remove old bubble
    if (exampleBubble) {
      exampleBubble.remove();
      exampleBubble = null;
    }

    // if no text => remove button
    if (!selectedText) {
      if (examplifyButton) {
        examplifyButton.remove();
        examplifyButton = null;
      }
      return;
    }

    // if text & button not existing => create button
    if (!examplifyButton) {
      examplifyButton = document.createElement('button');
      examplifyButton.innerText = 'Examplify';
      examplifyButton.className = 'examplify-button';
      document.body.appendChild(examplifyButton);

      // handle click
      examplifyButton.addEventListener('click', async () => {
        const text = window.getSelection().toString().trim();
        if (!text) return;

        // Show loading bubble immediately
        showExampleBubble('...', true);

        // read user's preference from storage
        const { modelType, localEndpoint, openAiApiKey } = await getUserSettings();

        let generatedText = 'No response.';
        if (modelType === 'local') {
          generatedText = await callLocalModel(localEndpoint, text);
        } else {
          generatedText = await callOpenAiModel(openAiApiKey, text);
        }

        showExampleBubble(generatedText || 'No response.');
      });
    }
  }

  async function handleShortcut(event) {
    // Check for Ctrl+E (or Cmd+E on Mac)
    if ((event.ctrlKey || event.metaKey) && event.key === 'e') {
      event.preventDefault(); // Prevent default browser behavior
      
      // Add pop animation to button if it exists
      if (examplifyButton) {
        examplifyButton.classList.add('pop');
        // Remove the class after animation completes
        setTimeout(() => examplifyButton.classList.remove('pop'), 300);
      }
      
      const text = window.getSelection().toString().trim();
      if (!text) return;
      
      // Show loading bubble immediately
      showExampleBubble('...', true);
      
      const { modelType, localEndpoint, openAiApiKey } = await getUserSettings();
      
      let generatedText = 'No response.';
      if (modelType === 'local') {
        generatedText = await callLocalModel(localEndpoint, text);
      } else {
        generatedText = await callOpenAiModel(openAiApiKey, text);
      }
      
      showExampleBubble(generatedText || 'No response.');
    }
  }

  // read from chrome.storage
  function getUserSettings() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(['modelType', 'localEndpoint', 'openAiApiKey', 'language'], (data) => {
        resolve({
          modelType: data.modelType || 'local',
          localEndpoint: data.localEndpoint || '',
          openAiApiKey: data.openAiApiKey || '',
          language: data.language || 'en'
        });
      });
    });
  }

  // local model call
  async function callLocalModel(endpoint, userText) {
    if (!endpoint) {
      return 'Local endpoint not configured.';
    }
    try {
      const { language } = await getUserSettings();
      const response = await fetch(`${endpoint}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_prompt: getSystemPrompt(language),
          user_text: userText
        })
      });
      if (!response.ok) {
        return 'Error from local model.';
      }
      const data = await response.json();
      return data.generated_text || 'No data.generated_text.';
    } catch (err) {
      return 'Could not reach local model.';
    }
  }

  // openai call
  async function callOpenAiModel(apiKey, userText) {
    if (!apiKey) return 'OpenAI API key missing.';
    try {
      const { language } = await getUserSettings();
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: getSystemPrompt(language) },
            { role: 'user', content: userText }
          ],
          temperature: 0.7
        })
      });
      if (!response.ok) {
        return 'Error from OpenAI.';
      }
      const data = await response.json();
      return data.choices?.[0]?.message?.content?.trim() || 'No response from OpenAI.';
    } catch (err) {
      return 'Could not reach OpenAI.';
    }
  }

  // show bubble near selection
  function showExampleBubble(generatedText, isLoading = false) {
    if (exampleBubble) {
      exampleBubble.remove();
      exampleBubble = null;
    }
    exampleBubble = document.createElement('div');
    exampleBubble.className = 'examplify-hello-world';
    
    if (isLoading) {
      exampleBubble.classList.add('loading');
      // Create loading dots container
      const loadingDotsContainer = document.createElement('div');
      loadingDotsContainer.className = 'loading-dots';
      
      // Create three separate dots
      for (let i = 0; i < 3; i++) {
        const dot = document.createElement('span');
        dot.className = 'dot';
        dot.textContent = '.';
        loadingDotsContainer.appendChild(dot);
      }
      
      exampleBubble.appendChild(loadingDotsContainer);
    } else {
      exampleBubble.textContent = generatedText;
    }
    
    document.body.appendChild(exampleBubble);

    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    const rect = selection.getRangeAt(0).getBoundingClientRect();

    const bubbleWidth = exampleBubble.offsetWidth;
    const bubbleHeight = exampleBubble.offsetHeight;
    const leftSpace = rect.left;
    const rightSpace = window.innerWidth - rect.right;
    const verticalMid = rect.top + rect.height / 2;
    const horizontalPadding = 10;

    let bubbleLeft, bubbleTop;
    let arrowSideClass = 'arrow-left';

    if (rightSpace >= bubbleWidth + horizontalPadding) {
      bubbleLeft = window.scrollX + rect.right + horizontalPadding;
      arrowSideClass = 'arrow-left';
    } else if (leftSpace >= bubbleWidth + horizontalPadding) {
      bubbleLeft = window.scrollX + rect.left - bubbleWidth - horizontalPadding;
      arrowSideClass = 'arrow-right';
    } else {
      bubbleLeft = window.scrollX + rect.right + horizontalPadding;
      arrowSideClass = 'arrow-left';
    }

    bubbleTop = window.scrollY + verticalMid - bubbleHeight / 2;

    exampleBubble.style.left = bubbleLeft + 'px';
    exampleBubble.style.top = bubbleTop + 'px';
    exampleBubble.classList.add(arrowSideClass);
  }
})();