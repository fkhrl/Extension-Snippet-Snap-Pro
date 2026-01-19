let inspectorActive = false;
let highlightElement = null;
let overlayAdded = false;

console.log('[Snippet Snap] Content script loaded');

// Wait for document to be ready, then add styles
function setupInspector() {
  try {
    console.log('[Snippet Snap] Setting up inspector styles...');
    
    // Create highlight overlay styles
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

function getElementInfo(element) {
  const styles = window.getComputedStyle(element);
  return {
    tag: element.tagName.toLowerCase(),
    class: element.className || '',
    id: element.id || '',
    text: (element.innerText || element.textContent || '').substring(0, 100),
    css: {
      color: styles.color,
      backgroundColor: styles.backgroundColor,
      fontSize: styles.fontSize,
      fontFamily: styles.fontFamily,
      fontWeight: styles.fontWeight,
      padding: styles.padding,
      margin: styles.margin,
      width: styles.width,
      height: styles.height,
      border: styles.border,
      borderRadius: styles.borderRadius,
      display: styles.display,
      position: styles.position,
      textAlign: styles.textAlign,
      lineHeight: styles.lineHeight,
      opacity: styles.opacity,
      transform: styles.transform,
      boxShadow: styles.boxShadow,
      textDecoration: styles.textDecoration,
    }
  };
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
  
  console.log('[Snippet Snap] Element info:', elementInfo);
  
  // Save to local storage first
  try {
    localStorage.setItem('inspectorData', JSON.stringify(elementInfo));
    console.log('[Snippet Snap] Saved to localStorage');
  } catch (error) {
    console.error('[Snippet Snap] Error saving to localStorage:', error);
  }
  
  // Send to popup via chrome runtime
  chrome.runtime.sendMessage({
    action: 'elementInspected',
    element: elementInfo
  }, (response) => {
    if (chrome.runtime.lastError) {
      console.error('[Snippet Snap] Error sending message:', chrome.runtime.lastError);
    } else {
      console.log('[Snippet Snap] Message sent, response:', response);
    }
  });
  
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
    
    // Remove listeners
    document.removeEventListener('mouseover', handleMouseOver, true);
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
