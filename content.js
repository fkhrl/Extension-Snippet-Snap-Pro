let inspectorActive = false;
let highlightElement = null;
let overlayAdded = false;

// Wait for document to be ready, then add styles
function setupInspector() {
  try {
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
    } else if (document.documentElement) {
      document.documentElement.appendChild(highlightStyle);
    }
  } catch (error) {
    console.error('Error setting up inspector styles:', error);
  }
}

// Create overlay but don't append yet
const overlay = document.createElement('div');
overlay.className = 'snippet-snap-inspector-overlay';
overlay.style.display = 'none';

// Setup inspector when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupInspector);
} else {
  setupInspector();
}

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
  
  const element = e.target;
  if (!element || element === overlay || element === document.body || element === document.documentElement) return;
  
  try {
    if (highlightElement && highlightElement !== element) {
      highlightElement.classList.remove('snippet-snap-highlight');
    }
    
    element.classList.add('snippet-snap-highlight');
    highlightElement = element;
  } catch (error) {
    console.error('Error in handleMouseOver:', error);
  }
}

function handleMouseOut(e) {
  if (!inspectorActive) return;
  
  try {
    const element = e.target;
    if (element) {
      element.classList.remove('snippet-snap-highlight');
    }
  } catch (error) {
    console.error('Error in handleMouseOut:', error);
  }
}

function handleClick(e) {
  if (!inspectorActive) return;
  
  e.preventDefault();
  e.stopPropagation();
  
  const element = e.target;
  const elementInfo = getElementInfo(element);
  
  console.log('Element clicked:', elementInfo);
  
  // Send to popup
  chrome.runtime.sendMessage({
    action: 'elementInspected',
    element: elementInfo
  }, (response) => {
    console.log('Response from popup:', response);
  });
  
  stopInspector();
}

function startInspector() {
  try {
    console.log('Starting inspector...');
    inspectorActive = true;
    
    // Append overlay if not already in DOM
    if (!overlayAdded && overlay && document.body) {
      try {
        document.body.appendChild(overlay);
        overlayAdded = true;
      } catch (error) {
        console.error('Error appending overlay:', error);
        // Try alternate approach
        if (document.documentElement) {
          document.documentElement.appendChild(overlay);
          overlayAdded = true;
        }
      }
    }
    
    if (overlay) {
      overlay.style.display = 'block';
      overlay.style.pointerEvents = 'auto';
    }
    
    // Add listeners with proper binding
    document.addEventListener('mouseover', handleMouseOver, true);
    document.addEventListener('click', handleClick, true);
    
    console.log('Inspector started!');
  } catch (error) {
    console.error('Error starting inspector:', error);
  }
}

function stopInspector() {
  try {
    console.log('Stopping inspector...');
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
    
    console.log('Inspector stopped!');
  } catch (error) {
    console.error('Error stopping inspector:', error);
  }
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Content script received message:', request);
  
  if (request.action === 'startInspecting') {
    startInspector();
    sendResponse({status: 'started'});
  } else if (request.action === 'stopInspecting') {
    stopInspector();
    sendResponse({status: 'stopped'});
  }
});
