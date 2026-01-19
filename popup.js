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

// CSS Inspector Functionality
let isInspectorActive = false;
let inspectedElement = null;

function extractCSSProperties(element) {
  const styles = window.getComputedStyle(element);
  const cssProps = {
    'color': styles.color,
    'background-color': styles.backgroundColor,
    'font-size': styles.fontSize,
    'font-family': styles.fontFamily,
    'font-weight': styles.fontWeight,
    'padding': styles.padding,
    'margin': styles.margin,
    'width': styles.width,
    'height': styles.height,
    'border': styles.border,
    'border-radius': styles.borderRadius,
    'display': styles.display,
    'position': styles.position,
    'text-align': styles.textAlign,
    'line-height': styles.lineHeight,
    'opacity': styles.opacity,
    'transform': styles.transform,
    'box-shadow': styles.boxShadow,
    'text-decoration': styles.textDecoration,
  };
  
  return cssProps;
}

function displayCSSForElement(element) {
  const cssProps = extractCSSProperties(element);
  const inspectorContent = document.getElementById('inspector-content');
  
  let htmlContent = `
    <div style="margin-bottom: 10px;">
      <strong style="color: #64b5f6;">Tag:</strong> <span style="color: #fbbf24;">&lt;${element.tagName.toLowerCase()}&gt;</span>
    </div>
    <div style="margin-bottom: 10px;">
      <strong style="color: #64b5f6;">Class:</strong> <span style="color: #fbbf24;">${element.className || 'N/A'}</span>
    </div>
    <div style="margin-bottom: 10px;">
      <strong style="color: #64b5f6;">ID:</strong> <span style="color: #fbbf24;">${element.id || 'N/A'}</span>
    </div>
    <div class="css-display">
  `;
  
  for (const [key, value] of Object.entries(cssProps)) {
    if (value && value !== 'normal' && value !== 'auto') {
      htmlContent += `
        <div class="css-property">
          <span class="css-key">${key}:</span>
          <span class="css-value">${value}</span>
        </div>
      `;
    }
  }
  
  htmlContent += `
    </div>
    <div class="inspector-hint">
      💡 Click Inspector button to toggle hover detection. Hover over website elements to inspect their CSS!
    </div>
  `;
  
  inspectorContent.innerHTML = htmlContent;
}

function startInspecting() {
  isInspectorActive = true;
  document.getElementById('css-inspector-toggle').classList.add('active');
  document.getElementById('css-inspector-toggle').textContent = '🔍 Inspecting...';
  
  // Send message to content script to start hover detection
  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    if (!tabs || tabs.length === 0) {
      console.error('No active tab found');
      showToast('❌ No active tab found');
      stopInspecting();
      return;
    }
    
    chrome.tabs.sendMessage(tabs[0].id, {action: 'startInspecting'}, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Error:', chrome.runtime.lastError.message);
        showToast('❌ Inspector not available on this page');
        stopInspecting();
      } else {
        console.log('Inspector started on page');
        showToast('✨ Inspector activated! Hover over elements...');
      }
    });
  });
}

function stopInspecting() {
  isInspectorActive = false;
  document.getElementById('css-inspector-toggle').classList.remove('active');
  document.getElementById('css-inspector-toggle').textContent = '🔍 Inspector';
  
  // Send message to content script to stop hover detection
  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    if (!tabs || tabs.length === 0) return;
    
    chrome.tabs.sendMessage(tabs[0].id, {action: 'stopInspecting'}, (response) => {
      if (!chrome.runtime.lastError) {
        console.log('Inspector stopped on page');
      }
    });
  });
}

// Inspector toggle button
document.getElementById('css-inspector-toggle').addEventListener('click', () => {
  if (isInspectorActive) {
    stopInspecting();
  } else {
    startInspecting();
  }
});

// Tab switching
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    const tabName = e.target.dataset.tab;
    
    // Remove active class from all tabs and content
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    
    // Add active class to clicked tab
    e.target.classList.add('active');
    document.getElementById(`${tabName}-tab`).classList.add('active');
    
    // Show initial message if switching to inspector tab
    if (tabName === 'inspector') {
      const inspectorContent = document.getElementById('inspector-content');
      if (!inspectorContent.innerHTML.trim()) {
        inspectorContent.innerHTML = `
          <div class="inspector-hint" style="margin-top: 30px; text-align: center;">
            <div style="font-size: 24px; margin-bottom: 10px;">🔍</div>
            <div style="margin-bottom: 10px;">Click the Inspector button to activate element inspection</div>
            <div style="font-size: 12px; color: #64a3b8;">Hover over website elements to see their CSS properties</div>
          </div>
        `;
      }
    }
  });
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'elementInspected') {
    // Element info received from content script
    console.log('Element inspected:', request.element);
    
    // Switch to inspector tab
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.querySelector('[data-tab="inspector"]').classList.add('active');
    document.getElementById('inspector-tab').classList.add('active');
    
    // Display the CSS in inspector
    const inspectorContent = document.getElementById('inspector-content');
    const element = request.element;
    
    let htmlContent = `
      <div style="margin-bottom: 10px;">
        <strong style="color: #64b5f6;">Tag:</strong> <span style="color: #fbbf24;">&lt;${element.tag}&gt;</span>
      </div>
      <div style="margin-bottom: 10px;">
        <strong style="color: #64b5f6;">Class:</strong> <span style="color: #fbbf24;">${element.class || 'N/A'}</span>
      </div>
      <div style="margin-bottom: 10px;">
        <strong style="color: #64b5f6;">ID:</strong> <span style="color: #fbbf24;">${element.id || 'N/A'}</span>
      </div>
      <div style="margin-bottom: 10px; color: #94a3b8; font-size: 11px;">
        <strong style="color: #64b5f6;">Text Content:</strong> ${element.text.substring(0, 50) || 'N/A'}
      </div>
      <div class="css-display">
    `;
    
    for (const [key, value] of Object.entries(element.css)) {
      if (value && value !== 'normal' && value !== 'auto' && value !== 'rgba(0, 0, 0, 0)') {
        htmlContent += `
          <div class="css-property">
            <span class="css-key">${key}:</span>
            <span class="css-value">${value}</span>
          </div>
        `;
      }
    }
    
    htmlContent += `
      </div>
      <div class="inspector-hint">
        💡 Inspector is now active. Hover over elements on the page to inspect!
      </div>
    `;
    
    inspectorContent.innerHTML = htmlContent;
    sendResponse({status: 'received'});
  }
  return true;
});

loadSnippets();