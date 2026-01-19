let inspectorActive = false;
let highlightElement = null;
let tooltipElement = null;
let isLocked = false;

const setupInspectorStyles = () => {
    if (document.getElementById('snippet-snap-styles')) return;
    const style = document.createElement('style');
    style.id = 'snippet-snap-styles';
    style.textContent = `
        .snippet-snap-highlight {
            outline: 2px solid #61dafb !important;
            outline-offset: -2px !important;
            background-color: rgba(97, 218, 251, 0.1) !important;
        }
        .snippet-snap-tooltip {
            position: fixed;
            background: #0f172a !important;
            border: 2px solid #61dafb !important;
            border-radius: 10px !important;
            padding: 15px !important;
            font-family: 'Fira Code', monospace !important;
            font-size: 11px !important;
            color: #ffffff !important;
            z-index: 2147483647 !important;
            box-shadow: 0 12px 40px rgba(0, 0, 0, 0.8) !important;
            width: 300px !important;
            pointer-events: none;
            display: none;
        }
        .snippet-snap-tooltip.locked { pointer-events: auto !important; }
        .tooltip-header { display: flex; justify-content: space-between; border-bottom: 1px solid #334155; padding-bottom: 8px; margin-bottom: 10px; }
        .tag-badge { background: #61dafb; color: #000; padding: 2px 6px; border-radius: 4px; font-weight: bold; }
        .close-btn { cursor: pointer; color: #ff5f56; font-size: 18px; }
        .class-chips { display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 10px; }
        .chip { background: #1e293b; color: #fbbf24; padding: 1px 6px; border-radius: 3px; font-size: 10px; border: 1px solid #334155; }
        .css-section { max-height: 220px; overflow-y: auto; background: #00000044; padding: 8px; border-radius: 5px; }
        .css-row { display: flex; justify-content: space-between; margin-bottom: 5px; border-bottom: 1px solid #ffffff11; }
        .copy-btn { width: 100%; padding: 10px; background: #61dafb !important; border: none !important; border-radius: 6px !important; color: #000 !important; font-weight: bold !important; cursor: pointer !important; margin-top: 10px; }
    `;
    document.head.appendChild(style);
};

// Applied CSS filter kora
function getClassSpecificCSS(element) {
    const styles = window.getComputedStyle(element);
    // Common properties jegulo class e thake
    const filterProps = [
        'color', 'background-color', 'font-size', 'font-family', 'font-weight', 
        'padding', 'margin', 'border', 'border-radius', 'width', 'height', 
        'display', 'justify-content', 'align-items', 'gap', 'position', 'opacity', 'box-shadow'
    ];
    
    const results = {};
    filterProps.forEach(prop => {
        const val = styles.getPropertyValue(prop);
        // Default values filter (shudhu applied gula rakhbe)
        if (val && val !== 'none' && val !== '0px' && val !== 'normal' && 
            val !== 'rgba(0, 0, 0, 0)' && val !== 'auto' && val !== 'inline') {
            results[prop] = val;
        }
    });
    return results;
}

function handleMouseMove(e) {
    if (!inspectorActive || isLocked) return;
    const element = e.target;
    if (!element || element === document.body || element === document.documentElement || element === tooltipElement) return;

    if (highlightElement) highlightElement.classList.remove('snippet-snap-highlight');
    element.classList.add('snippet-snap-highlight');
    highlightElement = element;
    updateTooltip(e, element);
}

function updateTooltip(e, element) {
    if (!tooltipElement) {
        tooltipElement = document.createElement('div');
        tooltipElement.className = 'snippet-snap-tooltip';
        document.body.appendChild(tooltipElement);
    }

    const cssData = getClassSpecificCSS(element);
    let cssHtml = "";
    let cssText = "";

    for (const [key, val] of Object.entries(cssData)) {
        cssText += `${key}: ${val};\n`;
        cssHtml += `<div class="css-row"><span style="color:#64b5f6">${key}:</span> <span style="color:#fbbf24">${val.substring(0, 22)}</span></div>`;
    }

    // Classes split kore chip banano
    const classes = Array.from(element.classList)
        .filter(c => c !== 'snippet-snap-highlight')
        .map(c => `<span class="chip">.${c}</span>`).join('');

    tooltipElement.innerHTML = `
        <div class="tooltip-header">
            <span class="tag-badge">&lt;${element.tagName.toLowerCase()}&gt;</span>
            <span class="close-btn" id="snap-close-icon">×</span>
        </div>
        <div class="class-chips">${classes || '<span class="chip">no-class</span>'}</div>
        <div class="css-section">${cssHtml || '<div style="color:#666">No class-based styles detected</div>'}</div>
        <button class="copy-btn" id="snap-copy-btn">📋 Copy All CSS</button>
    `;

    tooltipElement.style.display = 'block';
    
    let top = e.clientY + 15;
    let left = e.clientX + 15;
    if (left + 320 > window.innerWidth) left = window.innerWidth - 320;
    if (top + 380 > window.innerHeight) top = window.innerHeight - 380;

    tooltipElement.style.top = top + 'px';
    tooltipElement.style.left = left + 'px';

    tooltipElement.querySelector('#snap-copy-btn').onclick = (ev) => {
        ev.stopPropagation();
        navigator.clipboard.writeText(cssText);
        ev.target.innerText = "✅ Copied!";
        setTimeout(() => stopInspector(), 800);
    };

    tooltipElement.querySelector('#snap-close-icon').onclick = (ev) => {
        ev.stopPropagation();
        stopInspector();
    };
}

function handleMouseClick(e) {
    if (!inspectorActive || isLocked) return;
    e.preventDefault();
    e.stopPropagation();
    isLocked = true;
    tooltipElement.classList.add('locked');

    const elementInfo = {
        tag: highlightElement.tagName.toLowerCase(),
        class: Array.from(highlightElement.classList).filter(c => c !== 'snippet-snap-highlight').join(' '),
        id: highlightElement.id || 'none',
        css: getClassSpecificCSS(highlightElement)
    };
    chrome.runtime.sendMessage({ action: 'elementInspected', element: elementInfo });
}

function startInspector() {
    isLocked = false;
    inspectorActive = true;
    setupInspectorStyles();
    document.addEventListener('mousemove', handleMouseMove, true);
    document.addEventListener('click', handleMouseClick, true);
}

function stopInspector() {
    inspectorActive = false;
    isLocked = false;
    if (highlightElement) highlightElement.classList.remove('snippet-snap-highlight');
    if (tooltipElement) {
        tooltipElement.style.display = 'none';
        tooltipElement.classList.remove('locked');
    }
    document.removeEventListener('mousemove', handleMouseMove, true);
    document.removeEventListener('click', handleMouseClick, true);
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'startInspecting') {
        startInspector();
        sendResponse({status: 'started'});
    } else if (request.action === 'stopInspecting') {
        stopInspector();
        sendResponse({status: 'stopped'});
    }
    return true;
});