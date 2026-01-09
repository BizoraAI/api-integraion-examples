/**
 * Vanilla JS Example: PDF Navigation with Coordinates
 */

// ---------------------------------------------------------
// ---------------------------------------------------------
// 1. MOCK DATA 
// ---------------------------------------------------------

const MOCK_SOURCES = [
    {
        node_id: "uuid-1234",
        title: "Internal Revenue Code - Section 179",
        text: "The maximum deduction allowed under this section for any taxable year shall not exceed $1,000,000. This limitation applies to property placed in service during the taxable year.",
        metadata: {
            file_path: "IRC_Code_Section_179.pdf",
            page_label: "1",
            // Coordinates targeting "The maximum deduction... $1,000,000."
            // Original: (68, 200, 527, 240)
            coordinates: "(68, 200, 527, 240)"
        }
    },
    {
        node_id: "uuid-5678",
        title: "IRS Publication 946 - How To Depreciate Property",
        text: "You can elect to recover all or part of the cost of certain qualifying property, up to a limit, by deducting it in the year you place the property in service.",
        metadata: {
            file_path: "p946.pdf",
            page_label: "2",
            // Estimated coordinates for the second paragraph
            // Adjusted to align with text
            coordinates: "(68, 310, 527, 360)"
        }
    },
    {
        node_id: "uuid-9012",
        title: "Tax Cuts and Jobs Act - Summary",
        text: "The Act permanently increased the maximum Section 179 deduction to $1 million and the phase-out threshold to $2.5 million, indexed for inflation.",
        metadata: {
            file_path: "tax_cuts_summary.pdf",
            page_label: "5",
            // Estimated coordinates for the third paragraph
            // Adjusted to align with text
            coordinates: "(68, 420, 527, 470)"
        }
    }
];

const MOCK_RESPONSE_TEXT = "According to the Internal Revenue Code, the maximum deduction allowed under Section 179 for any taxable year is limited to **$1,000,000** [uuid-1234].\n\nIRS Publication 946 clarifies that you can elect to recover costs of qualifying property up to this limit [uuid-5678].\n\nFurthermore, the Tax Cuts and Jobs Act permanently increased this deduction and adjusted the phase-out thresholds [uuid-9012].";

// ---------------------------------------------------------
// 2. COORDINATE UTILITIES
// ---------------------------------------------------------

function parseCoordinates(coordinates) {
    if (!coordinates) return null;
    try {
        if (typeof coordinates === 'string' && coordinates.trim().startsWith('(')) {
            const coords = coordinates.replace(/[()]/g, '').split(',').map(s => parseFloat(s.trim()));
            if (coords.length === 4 && !coords.some(isNaN)) {
                return { x1: coords[0], y1: coords[1], x2: coords[2], y2: coords[3] };
            }
        }
        const parsed = typeof coordinates === 'string' ? JSON.parse(coordinates) : coordinates;
        if (parsed?.bounding_box) return parsed.bounding_box;
        return null;
    } catch (e) {
        return null;
    }
}

function normalizeCoordinates(coords, pageDims) {
    if (!coords || !pageDims) return null;
    return {
        left: (coords.x1 / pageDims.width) * 100,
        top: (coords.y1 / pageDims.height) * 100,
        width: ((coords.x2 - coords.x1) / pageDims.width) * 100,
        height: ((coords.y2 - coords.y1) / pageDims.height) * 100
    };
}

// ---------------------------------------------------------
// 3. UI LOGIC
// ---------------------------------------------------------

const messagesContainer = document.getElementById('messagesContainer');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const highlightLayer = document.getElementById('highlightLayer');
const pdfPage = document.getElementById('pdfPage');

// Input Handling
userInput.addEventListener('input', () => {
    sendBtn.disabled = !userInput.value.trim();
});

document.getElementById('chatForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const text = userInput.value.trim();
    if (!text) return;

    // 1. Add User Message
    addMessage(text, 'user');
    userInput.value = '';
    sendBtn.disabled = true;

    // 2. Simulate AI Response (Loading)
    const assistantDiv = addMessage('Thinking...', 'assistant', true); // isPlaceholder=true

    // 3. Simulate Network Delay then Stream
    setTimeout(() => {
        streamMockResponse(assistantDiv);
    }, 800);
});

function addMessage(text, role, isPlaceholder = false) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${role}`;

    // Avatar
    const avatar = document.createElement('div');
    avatar.className = 'avatar';
    avatar.innerHTML = role === 'assistant' ? '<i data-lucide="bot"></i>' : '<i data-lucide="user"></i>';

    // Content
    const content = document.createElement('div');
    content.className = 'content';

    const bubble = document.createElement('div');
    bubble.className = 'bubble markdown-content'; // Add markdown class
    if (!isPlaceholder) bubble.textContent = text;

    content.appendChild(bubble);
    msgDiv.appendChild(avatar);
    msgDiv.appendChild(content);

    messagesContainer.appendChild(msgDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    lucide.createIcons();

    return msgDiv;
}

function streamMockResponse(msgDiv) {
    const bubble = msgDiv.querySelector('.bubble');

    // 1. Render Markdown with Citations
    // We iterate over MOCK_SOURCES to replace each [node_id] with a citation button
    let processedText = MOCK_RESPONSE_TEXT;

    // Convert newlines to breaks for simple display
    processedText = processedText.replace(/\n/g, '<br>');

    MOCK_SOURCES.forEach((source, index) => {
        const citationNumber = index + 1;
        // Global replace in case the source is cited multiple times
        const regex = new RegExp(`\\[${source.node_id}\\]`, 'g');
        processedText = processedText.replace(
            regex,
            `<button class="inline-citation" onclick="handleCitationClick('${source.node_id}')">${citationNumber}</button>`
        );
    });

    // Simple mock streaming effect replacement
    bubble.innerHTML = processedText;

    // 2. Render Source Cards below bubble
    const contentDiv = msgDiv.querySelector('.content');
    const sourcesGrid = document.createElement('div');
    sourcesGrid.className = 'sources-grid';

    // Add Sources Title
    const sourcesTitle = document.createElement('div');
    sourcesTitle.className = 'sources-title';
    sourcesTitle.innerHTML = '<i data-lucide="book-open" style="width:14px;"></i> Sources';
    contentDiv.appendChild(sourcesTitle);

    // Render Cards for each source
    MOCK_SOURCES.forEach((source, index) => {
        renderSourceCard(sourcesGrid, source, index + 1);
    });

    contentDiv.appendChild(sourcesGrid);

    lucide.createIcons();
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function renderSourceCard(container, source, index) {
    const card = document.createElement('div');
    card.className = 'source-card';
    // Pass the specific node_id to the handler
    card.onclick = () => handleCitationClick(source.node_id);

    card.innerHTML = `
        <div class="source-header">
            <div class="citation-number">${index}</div>
            <div class="source-title">${source.title}</div>
        </div>
        <div class="source-snippet">${source.text}</div>
    `;
    container.appendChild(card);
}

// ---------------------------------------------------------
// 4. HIGHLIGHTING & NAVIGATION LOGIC
// ---------------------------------------------------------

const closePdfBtn = document.getElementById('closePdfBtn');
const appContainer = document.querySelector('.app-container');
const mainContent = document.querySelector('.main-content');

closePdfBtn.addEventListener('click', () => {
    mainContent.classList.remove('open');
    appContainer.classList.remove('has-pdf');
    // Optional: clear highlights when closing
    highlightLayer.innerHTML = '';
});

// Updated to accept nodeId
window.handleCitationClick = (nodeId) => {
    // 1. Open PDF Viewer
    mainContent.classList.add('open');
    appContainer.classList.add('has-pdf');

    // Find the source by ID
    const source = MOCK_SOURCES.find(s => s.node_id === nodeId);
    if (!source) {
        console.error("Source not found for id:", nodeId);
        return;
    }

    console.log("Navigating to source:", source);

    const coords = parseCoordinates(source.metadata.coordinates);
    if (!coords) return;

    // Assume 595x842 (A4) purely for this mock. 
    // Real apps must use actual page dimensions from the PDF viewer.
    const normalized = normalizeCoordinates(coords, { width: 595, height: 842 });

    // 2. Render Highlight and Scroll
    // Small delay to allow CSS transitions or layout updates
    setTimeout(() => {
        renderHighlight(normalized);
    }, 100);
};

function renderHighlight(style) {
    // Clear previous
    highlightLayer.innerHTML = '';

    const div = document.createElement('div');
    div.className = 'highlight';
    div.style.left = `${style.left}%`;
    div.style.top = `${style.top}%`;
    div.style.width = `${style.width}%`;
    div.style.height = `${style.height}%`;

    highlightLayer.appendChild(div);

    // Smooth scroll to highlight
    const wrapper = document.querySelector('.pdf-page-wrapper');
    // Calculate scroll position relative to the container
    const scrollProp = style.top / 100;
    const scrollPixel = scrollProp * pdfPage.offsetHeight;

    wrapper.scrollTo({
        top: Math.max(0, scrollPixel - 150), // 150px padding from top
        behavior: 'smooth'
    });
}
