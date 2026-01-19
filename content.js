let inspectorActive = false;
let highlightElement = null;

// Create highlight overlay
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
    pointer-events: none;
  }
`;
document.head.appendChild(highlightStyle);

// Create overlay but don't append yet
const overlay = document.createElement('div');
overlay.className = 'snippet-snap-inspector-overlay';
overlay.style.display = 'none';

function getElementInfo(element) {
  const styles = window.getComputedStyle(element);
  return {
    tag: element.tagName.toLowerCase(),
    class: element.className,
    id: element.id,
    text: element.innerText?.substring(0, 100) || '',
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
  if (element === overlay || element === document.body || element === document.documentElement) return;
  
  if (highlightElement) {
    highlightElement.classList.remove('snippet-snap-highlight');
  }
  
  element.classList.add('snippet-snap-highlight');
  highlightElement = element;
}

function handleMouseOut(e) {
  if (!inspectorActive) return;
  
  const element = e.target;
  element.classList.remove('snippet-snap-highlight');
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
  console.log('Starting inspector...');
  inspectorActive = true;
  
  // Append overlay if not already in DOM
  if (!overlay.parentElement) {
    document.documentElement.appendChild(overlay);
  }
  overlay.style.display = 'block';
  overlay.style.pointerEvents = 'auto';
  
  // Add listeners with proper binding
  document.addEventListener('mouseover', handleMouseOver, true);
  document.addEventListener('click', handleClick, true);
  
  console.log('Inspector started!');
}

function stopInspector() {
  console.log('Stopping inspector...');
  inspectorActive = false;
  overlay.style.pointerEvents = 'none';
  overlay.style.display = 'none';
  
  if (highlightElement) {
    highlightElement.classList.remove('snippet-snap-highlight');
    highlightElement = null;
  }
  
  // Remove listeners
  document.removeEventListener('mouseover', handleMouseOver, true);
  document.removeEventListener('click', handleClick, true);
  
  console.log('Inspector stopped!');
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
