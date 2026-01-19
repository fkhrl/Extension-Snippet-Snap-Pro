chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "saveSnippet",
    title: "Save as Snippet",
    contexts: ["selection"]
  }, () => {
    console.log("Context menu created successfully");
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  console.log("Menu clicked:", info.menuItemId);
  if (info.menuItemId === "saveSnippet" && info.selectionText) {
    console.log("Saving snippet:", info.selectionText);
    const now = new Date();
    const dateTime = now.toLocaleDateString() + " " + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newSnippet = {
      text: info.selectionText,
      url: tab.url,
      date: dateTime
    };

    chrome.storage.local.get({ snippets: [] }, (result) => {
      const snippets = result.snippets;
      
      // Check for duplicates - don't save if same text already exists
      const isDuplicate = snippets.some(snippet => snippet.text === info.selectionText);
      if (isDuplicate) {
        console.log("Duplicate snippet detected, not saving");
        const notificationId = 'duplicate-' + Date.now();
        chrome.notifications.create(notificationId, {
          type: 'basic',
          iconUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
          title: '⚠️ Duplicate Snippet',
          message: 'This snippet is already saved.',
          requireInteraction: false
        });
        setTimeout(() => {
          chrome.notifications.clear(notificationId);
        }, 4000);
        return;
      }
      
      snippets.push(newSnippet);
      chrome.storage.local.set({ snippets: snippets }, () => {
        console.log("Snippet saved to storage");
        
        // Send message to popup if it's open
        chrome.runtime.sendMessage({
          action: 'snippetSaved',
          snippet: newSnippet
        }).catch(() => {
          // Popup is not open, that's fine
        });
        
        const notificationId = 'snippet-saved-' + Date.now();
        chrome.notifications.create(notificationId, {
          type: 'basic',
          iconUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
          title: '✅ Snippet Saved!',
          message: 'Your code snippet has been saved successfully.',
          requireInteraction: false,
          isClickable: true
        }, (id) => {
          console.log("Notification created with ID:", id);
          setTimeout(() => {
            chrome.notifications.clear(id, (wasCleared) => {
              console.log("Notification cleared:", wasCleared);
            });
          }, 5000);
        });
      });
    });
  }
});