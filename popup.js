function showToast(message) {
  console.log("showToast called with:", message);
  const toastDiv = document.getElementById('toast');
  if (!toastDiv) {
    console.error("Toast element not found!");
    return;
  }
  // Use HTML content for better character support
  toastDiv.innerHTML = message;
  toastDiv.classList.remove('toast');
  
  // Force reflow to restart animation
  void toastDiv.offsetWidth;
  toastDiv.classList.add('toast');
  console.log("Toast shown with class added");
  
  setTimeout(() => {
    toastDiv.classList.remove('toast');
    toastDiv.innerHTML = '';
  }, 2000);
}

function loadSnippets() {
  chrome.storage.local.get({ snippets: [] }, (result) => {
    const listDiv = document.getElementById('list');
    listDiv.innerHTML = "";
    
    const snippets = result.snippets;

    if (snippets.length === 0) {
      listDiv.innerHTML = "<p style='color:#888; text-align:center; padding: 60px 20px; font-size: 14px;'>📭 No snippets saved yet.<br><span style='font-size: 12px; color: #666;'>Right-click text and select \"Save as Snippet\" to get started!</span></p>";
      return;
    }

    // Ulto kore dekhabo jate latest upore thake
    for (let i = snippets.length - 1; i >= 0; i--) {
      const item = snippets[i];
      const card = document.createElement('div');
      card.className = 'snippet-card';
      
      card.innerHTML = `
        <small>${item.date} | ${new URL(item.url).hostname}</small>
        <pre><code>${escapeHTML(item.text)}</code></pre>
        <div class="btn-group">
          <button class="copy-btn" id="copy-${i}">Copy</button>
          <button class="delete-btn" id="del-${i}">Delete</button>
        </div>
      `;
      listDiv.appendChild(card);

      // Copy Logic
      document.getElementById(`copy-${i}`).addEventListener('click', () => {
        navigator.clipboard.writeText(item.text).then(() => {
          const btn = document.getElementById(`copy-${i}`);
          const originalText = btn.innerText;
          btn.innerText = "Copied!";
          showToast('✅ Text copied successfully!');
          setTimeout(() => btn.innerText = originalText, 1500);
        }).catch(() => {
          showToast('❌ Failed to copy text');
        });
      });

      // Delete Logic
      document.getElementById(`del-${i}`).addEventListener('click', () => {
        deleteSnippet(i);
      });
    }
  });
}

function deleteSnippet(index) {
  chrome.storage.local.get({ snippets: [] }, (result) => {
    const snippets = result.snippets;
    snippets.splice(index, 1);
    chrome.storage.local.set({ snippets: snippets }, () => {
      showToast('✅ Snippet deleted successfully!');
      loadSnippets();
    });
  });
}

function escapeHTML(str) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return str.replace(/[&<>"']/g, (m) => map[m] || m);
}

// Listen for messages from background.js
console.log("Setting up message listener");
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Message received in popup:", request);
  if (request.action === 'snippetSaved') {
    console.log("Snippet saved message received - showing toast");
    showToast('✅ New snippet saved!');
    setTimeout(() => {
      loadSnippets();
    }, 100);
    sendResponse({status: 'success'});
  }
  return true;
});

// Listen for storage changes to show notification when snippet is saved
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local' && changes.snippets) {
    const newSnippets = changes.snippets.newValue;
    const oldSnippets = changes.snippets.oldValue || [];
    
    if (newSnippets.length > oldSnippets.length) {
      showToast('✅ New snippet saved!');
      loadSnippets();
    }
  }
});

loadSnippets();