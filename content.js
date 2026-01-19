let inspectorActive = false;
let highlightElement = null;
let overlayAdded = false;
let tooltipElement = null;
let currentInspectingElement = null;

console.log('[Snippet Snap] Content script loaded');

// Wait for document to be ready, then add styles
function setupInspector() {
  try {
    console.log('[Snippet Snap] Setting up inspector styles...');
    
    // Create highlight overlay styles and tooltip styles
    const highlightStyle = document.createElement('style');
    highlightStyle.textContent = `
      .snippet-snap-highlight {
        outline: 2px solid #61dafb !important;
        background-color: rgba(97, 218, 251, 0.1) !important;
      }
      
      .snippet-snap-inspector-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        cursor: crosshair;
        z-index: 999998;
      }
      
      .snippet-snap-tooltip {
        position: fixed;
        background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
        border: 2px solid #61dafb;
        border-radius: 8px;
        padding: 12px;
        font-family: 'Courier New', monospace;
        font-size: 11px;
        color: #4ade80;
        z-index: 999999;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
        max-width: 300px;
        max-height: 400px;
        overflow-y: auto;
        pointer-events: auto;
      }
      
      .snippet-snap-tooltip-header {
        color: #64b5f6;
        font-weight: bold;
        margin-bottom: 8px;
        border-bottom: 1px solid #334155;
        padding-bottom: 6px;
      }
      
      .snippet-snap-css-item {
        display: flex;
        justify-content: space-between;
        margin-bottom: 4px;
        padding: 2px 0;
      }
      
      .snippet-snap-css-key {
        color: #64b5f6;
        font-weight: 600;
      }
      
      .snippet-snap-css-value {
        color: #fbbf24;
        margin-left: 8px;
        word-break: break-all;
      }
      
      .snippet-snap-copy-btn {
        background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%);
        color: white;
        border: none;
        padding: 6px 12px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 10px;
        font-weight: bold;
        margin-top: 8px;
        width: 100%;
        transition: all 0.2s ease;
      }
      
      .snippet-snap-copy-btn:hover {
        background: linear-gradient(135deg, #1e88e5 0%, #1976d2 100%);
        box-shadow: 0 4px 8px rgba(25, 118, 210, 0.4);
      }
      
      .snippet-snap-copy-btn:active {
        transform: scale(0.98);
      }
      
      .snippet-snap-tooltip::-webkit-scrollbar {
        width: 4px;
      }
      
      .snippet-snap-tooltip::-webkit-scrollbar-thumb {
        background: rgba(100, 181, 246, 0.4);
        border-radius: 4px;
      }
    `;
    
    if (document.head) {
      document.head.appendChild(highlightStyle);
      console.log('[Snippet Snap] Styles added to document.head');
    } else if (document.documentElement) {
      document.documentElement.appendChild(highlightStyle);
      console.log('[Snippet Snap] Styles added to documentElement');
    }
  } catch (error) {
    console.error('[Snippet Snap] Error setting up inspector styles:', error);
  }
}

// Create overlay but don't append yet
const overlay = document.createElement('div');
overlay.className = 'snippet-snap-inspector-overlay';
overlay.style.display = 'none';

// Setup inspector immediately since we use document_end now
setupInspector();

console.log('[Snippet Snap] Inspector setup complete');

function createTooltip(element, elementInfo) {
  try {
    console.log('[Snippet Snap] Creating tooltip for:', elementInfo.tag);
    
    // Remove old tooltip if exists
    if (tooltipElement && tooltipElement.parentElement) {
      tooltipElement.remove();
    }
    
    // Create new tooltip
    tooltipElement = document.createElement('div');
    tooltipElement.className = 'snippet-snap-tooltip';
    
    let content = `
      <div class="snippet-snap-tooltip-header">
        Tag: &lt;${elementInfo.tag}&gt;
      </div>
      <div style="color: #94a3b8; font-size: 10px; margin-bottom: 8px; padding: 4px 0;">
        Class: ${elementInfo.class || 'none'}<br>
        ID: ${elementInfo.id || 'none'}
      </div>
    `;
    
    // Add CSS properties
    let cssCount = 0;
    if (elementInfo.css) {
      for (const [key, value] of Object.entries(elementInfo.css)) {
        if (value && value !== '' && value !== 'normal' && value !== 'auto' && value !== 'rgba(0, 0, 0, 0)') {
          content += `
            <div class="snippet-snap-css-item">
              <span class="snippet-snap-css-key">${key}:</span>
              <span class="snippet-snap-css-value">${value}</span>
            </div>
          `;
          cssCount++;
        }
      }
    }
    
    if (cssCount === 0) {
      content += `<div style="color: #94a3b8; font-size: 10px; padding: 4px 0;">No CSS properties found</div>`;
    }
    
    content += `
      <button class="snippet-snap-copy-btn">📋 Copy CSS</button>
    `;
    
    tooltipElement.innerHTML = content;
    
    // Position tooltip near the element
    const rect = element.getBoundingClientRect();
    let top = rect.bottom + 10;
    let left = rect.left;
    
    // Adjust if tooltip goes off-screen
    if (left + 300 > window.innerWidth) {
      left = window.innerWidth - 310;
    }
    if (left < 10) {
      left = 10;
    }
    if (top + 400 > window.innerHeight) {
      top = rect.top - 410;
    }
    
    tooltipElement.style.top = top + 'px';
    tooltipElement.style.left = left + 'px';
    
    // Add copy button event listener
    const copyBtn = tooltipElement.querySelector('.snippet-snap-copy-btn');
    if (copyBtn) {
      copyBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        copyToClipboard(elementInfo);
      });
    }
    
    document.body.appendChild(tooltipElement);
    console.log('[Snippet Snap] Tooltip created and shown at', top, left);
    
  } catch (error) {
    console.error('[Snippet Snap] Error creating tooltip:', error);
  }
}

function hideTooltip() {
  try {
    if (tooltipElement && tooltipElement.parentElement) {
      tooltipElement.remove();
      tooltipElement = null;
      console.log('[Snippet Snap] Tooltip hidden');
    }
  } catch (error) {
    console.error('[Snippet Snap] Error hiding tooltip:', error);
  }
}

function copyToClipboard(elementInfo) {
  try {
    let cssText = `CSS Properties for <${elementInfo.tag}>\n\n`;
    
    if (elementInfo.css) {
      for (const [key, value] of Object.entries(elementInfo.css)) {
        if (value && value !== 'normal' && value !== 'auto' && value !== 'rgba(0, 0, 0, 0)') {
          cssText += `${key}: ${value};\n`;
        }
      }
    }
    
    navigator.clipboard.writeText(cssText).then(() => {
      console.log('[Snippet Snap] CSS copied to clipboard');
      
      // Show feedback
      if (tooltipElement) {
        const btn = tooltipElement.querySelector('.snippet-snap-copy-btn');
        if (btn) {
          const originalText = btn.innerText;
          btn.innerText = '✅ Copied!';
          setTimeout(() => {
            btn.innerText = originalText;
          }, 2000);
        }
      }
    }).catch(err => {
      console.error('[Snippet Snap] Error copying to clipboard:', err);
    });
  } catch (error) {
    console.error('[Snippet Snap] Error in copyToClipboard:', error);
  }
}

function getElementInfo(element) {
  try {
    const styles = window.getComputedStyle(element);
    
    // Create clean object with only serializable data
    const cssData = {};
    const cssProps = [
      'color', 'backgroundColor', 'fontSize', 'fontFamily', 'fontWeight',
      'padding', 'margin', 'width', 'height', 'border', 'borderRadius',
      'display', 'position', 'textAlign', 'lineHeight', 'opacity',
      'transform', 'boxShadow', 'textDecoration'
    ];
    
    for (const prop of cssProps) {
      const value = styles[prop];
      // Convert to string to ensure serializability
      cssData[prop] = value ? String(value) : '';
    }
    
    const elementInfo = {
      tag: String(element.tagName.toLowerCase()),
      class: String(element.className || ''),
      id: String(element.id || ''),
      text: String((element.innerText || element.textContent || '').substring(0, 100)),
      css: cssData
    };
    
    // Verify it's JSON serializable
    JSON.stringify(elementInfo);
    
    return elementInfo;
  } catch (error) {
    console.error('[Snippet Snap] Error getting element info:', error);
    return null;
  }
}

function handleMouseOver(e) {
  if (!inspectorActive) return;
  
  let element = e.target;
  
  // If target is a text node, get the parent element
  if (element.nodeType === 3) {
    element = element.parentElement;
  }
  
  if (!element || element === overlay || element === document.body || element === document.documentElement) return;
  
  try {
    if (highlightElement && highlightElement !== element) {
      highlightElement.classList.remove('snippet-snap-highlight');
    }
    
    element.classList.add('snippet-snap-highlight');
    highlightElement = element;
    currentInspectingElement = element;
    
    // Get element info and show tooltip
    const elementInfo = getElementInfo(element);
    if (elementInfo) {
      createTooltip(element, elementInfo);
    }
    
    console.log('[Snippet Snap] Hovering over:', element.tagName, element.className);
  } catch (error) {
    console.error('[Snippet Snap] Error in handleMouseOver:', error);
  }
}

function handleMouseOut(e) {
  if (!inspectorActive) return;
  
  try {
    let element = e.target;
    
    // If target is a text node, get the parent element
    if (element.nodeType === 3) {
      element = element.parentElement;
    }
    
    if (element) {
      element.classList.remove('snippet-snap-highlight');
    }
    
    // Hide tooltip
    hideTooltip();
  } catch (error) {
    console.error('[Snippet Snap] Error in handleMouseOut:', error);
  }
}

function handleClick(e) {
  if (!inspectorActive) return;
  
  e.preventDefault();
  e.stopPropagation();
  
  let element = e.target;
  
  // If target is a text node, get the parent element
  if (element.nodeType === 3) {
    element = element.parentElement;
  }
  
  if (!element) {
    console.error('[Snippet Snap] No element found for click');
    return;
  }
  
  console.log('[Snippet Snap] Element clicked:', element.tagName, element.className);
  
  const elementInfo = getElementInfo(element);
  
  if (!elementInfo) {
    console.error('[Snippet Snap] Failed to get element info');
    return;
  }
  
  console.log('[Snippet Snap] Element info:', elementInfo);
  console.log('[Snippet Snap] CSS data:', elementInfo.css);
  
  // Save to chrome storage first (most reliable)
  try {
    chrome.storage.local.set({ 
      lastInspectedElement: elementInfo 
    }, () => {
      if (chrome.runtime.lastError) {
        console.error('[Snippet Snap] Error saving to chrome storage:', chrome.runtime.lastError);
      } else {
        console.log('[Snippet Snap] Saved to chrome.storage');
      }
    });
  } catch (error) {
    console.error('[Snippet Snap] Error saving to chrome storage:', error);
  }
  
  // Also save to local storage as backup
  try {
    localStorage.setItem('inspectorData', JSON.stringify(elementInfo));
    console.log('[Snippet Snap] Saved to localStorage');
  } catch (error) {
    console.error('[Snippet Snap] Error saving to localStorage:', error);
  }
  
  // Send to popup via chrome runtime (may fail if popup is closed, but that's ok)
  try {
    chrome.runtime.sendMessage({
      action: 'elementInspected',
      element: elementInfo
    }, (response) => {
      if (chrome.runtime.lastError) {
        console.log('[Snippet Snap] Data saved to storage. Open popup to view!');
      } else {
        console.log('[Snippet Snap] Message sent to popup');
      }
    });
  } catch (error) {
    console.log('[Snippet Snap] Data saved to storage. Open popup to view!');
  }
  
  stopInspector();
}

function startInspector() {
  try {
    console.log('[Snippet Snap] Starting inspector...');
    inspectorActive = true;
    
    // Append overlay if not already in DOM
    if (!overlayAdded && overlay && document.body) {
      try {
        document.body.appendChild(overlay);
        overlayAdded = true;
        console.log('[Snippet Snap] Overlay appended to body');
      } catch (error) {
        console.error('[Snippet Snap] Error appending overlay:', error);
        // Try alternate approach
        if (document.documentElement) {
          document.documentElement.appendChild(overlay);
          overlayAdded = true;
          console.log('[Snippet Snap] Overlay appended to documentElement');
        }
      }
    }
    
    if (overlay) {
      overlay.style.display = 'block';
      overlay.style.pointerEvents = 'auto';
    }
    
    // Add listeners - use capture phase for mouseover to catch all elements
    document.addEventListener('mouseover', handleMouseOver, true);
    document.addEventListener('mouseout', handleMouseOut, true);
    document.addEventListener('click', handleClick, true);
    
    console.log('[Snippet Snap] Inspector started! Ready to inspect elements.');
  } catch (error) {
    console.error('[Snippet Snap] Error starting inspector:', error);
  }
}

function stopInspector() {
  try {
    console.log('[Snippet Snap] Stopping inspector...');
    inspectorActive = false;
    
    if (overlay) {
      overlay.style.pointerEvents = 'none';
      overlay.style.display = 'none';
    }
    
    if (highlightElement) {
      highlightElement.classList.remove('snippet-snap-highlight');
      highlightElement = null;
    }
    
    // Hide tooltip
    hideTooltip();
    
    // Remove listeners
    document.removeEventListener('mouseover', handleMouseOver, true);
    document.removeEventListener('mouseout', handleMouseOut, true);
    document.removeEventListener('click', handleClick, true);
    
    console.log('[Snippet Snap] Inspector stopped!');
  } catch (error) {
    console.error('[Snippet Snap] Error stopping inspector:', error);
  }
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('[Snippet Snap] Content script received message:', request);
  
  if (request.action === 'startInspecting') {
    startInspector();
    sendResponse({status: 'started'});
  } else if (request.action === 'stopInspecting') {
    stopInspector();
    sendResponse({status: 'stopped'});
  }
});
