/**
 * Vanilla JS Example: PDF Navigation with Page Labels
 * 
 * This example demonstrates how to implement page-level PDF navigation using
 * the page_label metadata returned by the Bizora Platform API.
 * 
 * Key Features:
 * - Simple page-level highlighting (no complex coordinate parsing)
 * - Automatic scroll to highlighted page
 * - Clean, maintainable code
 */

// ---------------------------------------------------------
// 1. MOCK DATA 
// ---------------------------------------------------------

/**
 * Mock sources representing API response data.
 * Each source contains a page_label that indicates which PDF page contains the information.
 * The coordinates field is deprecated and no longer used for highlighting.
 */
const MOCK_SOURCES = [
    {
        node_id: "uuid-1234",
        title: "Internal Revenue Code - Section 179",
        text: "The maximum deduction allowed under this section for any taxable year shall not exceed $1,000,000. This limitation applies to property placed in service during the taxable year.",
        metadata: {
            file_path: "IRC_Code_Section_179.pdf",
            page_label: "1", // Page label is the primary navigation mechanism
            sourceOrigin: "https://uscode.house.gov/view.xhtml?req=granuleid:USC-prelim-title26-section179"
        }
    },
    {
        node_id: "uuid-5678",
        title: "IRS Publication 946 - How To Depreciate Property",
        text: "You can elect to recover all or part of the cost of certain qualifying property, up to a limit, by deducting it in the year you place the property in service.",
        metadata: {
            file_path: "p946.pdf",
            page_label: "2", // Different page in the document
            sourceOrigin: "https://www.irs.gov/publications/p946"
        }
    },
    {
        node_id: "uuid-9012",
        title: "Tax Cuts and Jobs Act - Summary",
        text: "The Act permanently increased the maximum Section 179 deduction to $1 million and the phase-out threshold to $2.5 million, indexed for inflation.",
        metadata: {
            file_path: "tax_cuts_summary.pdf",
            page_label: "5", // Page labels can be numeric strings
            sourceOrigin: "https://www.congress.gov/bill/115th-congress/house-bill/1"
        }
    }
];

const MOCK_RESPONSE_TEXT = "According to the Internal Revenue Code, the maximum deduction allowed under Section 179 for any taxable year is limited to **$1,000,000** [uuid-1234].\n\nIRS Publication 946 clarifies that you can elect to recover costs of qualifying property up to this limit [uuid-5678].\n\nFurthermore, the Tax Cuts and Jobs Act permanently increased this deduction and adjusted the phase-out thresholds [uuid-9012].";

// ---------------------------------------------------------
// 2. UI LOGIC
// ---------------------------------------------------------

// DOM element references
const messagesContainer = document.getElementById('messagesContainer');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const highlightLayer = document.getElementById('highlightLayer');
const pdfPage = document.getElementById('pdfPage');

/**
 * Enable/disable send button based on input
 */
userInput.addEventListener('input', () => {
    sendBtn.disabled = !userInput.value.trim();
});

/**
 * Handle form submission
 */
document.getElementById('chatForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const text = userInput.value.trim();
    if (!text) return;

    // Add user message to chat
    addMessage(text, 'user');
    userInput.value = '';
    sendBtn.disabled = true;

    // Simulate AI response with loading state
    const assistantDiv = addMessage('Thinking...', 'assistant', true);

    // Simulate network delay before streaming response
    setTimeout(() => {
        streamMockResponse(assistantDiv);
    }, 800);
});

/**
 * Add a message to the chat interface
 * @param {string} text - Message text content
 * @param {string} role - 'user' or 'assistant'
 * @param {boolean} isPlaceholder - Whether this is a temporary loading message
 * @returns {HTMLElement} The created message element
 */
function addMessage(text, role, isPlaceholder = false) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${role}`;

    // Create avatar
    const avatar = document.createElement('div');
    avatar.className = 'avatar';
    avatar.innerHTML = role === 'assistant' ? '<i data-lucide="bot"></i>' : '<i data-lucide="user"></i>';

    // Create content bubble
    const content = document.createElement('div');
    content.className = 'content';

    const bubble = document.createElement('div');
    bubble.className = 'bubble markdown-content';
    if (!isPlaceholder) bubble.textContent = text;

    content.appendChild(bubble);
    msgDiv.appendChild(avatar);
    msgDiv.appendChild(content);

    messagesContainer.appendChild(msgDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    // Initialize Lucide icons
    lucide.createIcons();

    return msgDiv;
}

/**
 * Stream the mock AI response with citations and source cards
 * @param {HTMLElement} msgDiv - The message container element
 */
function streamMockResponse(msgDiv) {
    const bubble = msgDiv.querySelector('.bubble');

    // Process the response text to add citation buttons
    let processedText = MOCK_RESPONSE_TEXT;
    processedText = processedText.replace(/\n/g, '<br>');

    // Replace [node_id] with clickable citation buttons
    MOCK_SOURCES.forEach((source, index) => {
        const citationNumber = index + 1;
        const regex = new RegExp(`\\[${source.node_id}\\]`, 'g');
        processedText = processedText.replace(
            regex,
            `<button class="inline-citation" onclick="handleCitationClick('${source.node_id}')">${citationNumber}</button>`
        );
    });

    bubble.innerHTML = processedText;

    // Add source cards below the message
    const contentDiv = msgDiv.querySelector('.content');
    const sourcesGrid = document.createElement('div');
    sourcesGrid.className = 'sources-grid';

    // Add sources title
    const sourcesTitle = document.createElement('div');
    sourcesTitle.className = 'sources-title';
    sourcesTitle.innerHTML = '<i data-lucide="book-open" style="width:14px;"></i> Sources';
    contentDiv.appendChild(sourcesTitle);

    // Render each source card
    MOCK_SOURCES.forEach((source, index) => {
        renderSourceCard(sourcesGrid, source, index + 1);
    });

    contentDiv.appendChild(sourcesGrid);

    lucide.createIcons();
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

/**
 * Render a single source card
 * @param {HTMLElement} container - Container to append the card to
 * @param {Object} source - Source data object
 * @param {number} index - Citation number
 */
function renderSourceCard(container, source, index) {
    const card = document.createElement('div');
    card.className = 'source-card';
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
// 3. PAGE-LEVEL HIGHLIGHTING & NAVIGATION
// ---------------------------------------------------------

const closePdfBtn = document.getElementById('closePdfBtn');
const appContainer = document.querySelector('.app-container');
const mainContent = document.querySelector('.main-content');

// Track the currently highlighted page
let currentHighlightedPage = null;

/**
 * Close the PDF viewer panel
 */
closePdfBtn.addEventListener('click', () => {
    mainContent.classList.remove('open');
    appContainer.classList.remove('has-pdf');
    highlightLayer.innerHTML = '';
    currentHighlightedPage = null;
});

/**
 * Handle citation click - navigate to and highlight the referenced page
 * @param {string} nodeId - The node_id of the clicked source
 */
window.handleCitationClick = (nodeId) => {
    // Find the source by node_id
    const source = MOCK_SOURCES.find(s => s.node_id === nodeId);
    if (!source) {
        console.error("Source not found for id:", nodeId);
        return;
    }

    console.log("Navigating to source:", source);

    // Extract page label from metadata
    const pageLabel = source.metadata?.page_label;
    if (!pageLabel) {
        console.warn("No page_label found in source metadata");
        return;
    }

    // Open PDF viewer if not already open
    mainContent.classList.add('open');
    appContainer.classList.add('has-pdf');

    // Update the current page display
    document.getElementById('currentPage').textContent = pageLabel;

    // Store the highlighted page
    currentHighlightedPage = pageLabel;

    // Small delay to allow CSS transitions and layout updates
    setTimeout(() => {
        renderPageHighlight(pageLabel);
        scrollToHighlightedPage();
    }, 100);
};

/**
 * Render a full-page highlight overlay
 * @param {string|number} pageLabel - The page label to highlight
 */
function renderPageHighlight(pageLabel) {
    // Clear previous highlights
    highlightLayer.innerHTML = '';

    // Create full-page highlight overlay
    const highlightDiv = document.createElement('div');
    highlightDiv.className = 'page-highlight';
    highlightDiv.setAttribute('data-page', pageLabel);

    highlightLayer.appendChild(highlightDiv);

    console.log(`Highlighted page: ${pageLabel}`);
}

/**
 * Scroll to the highlighted page with smooth animation
 * Uses a three-layer approach for reliability:
 * - Layer 1: Immediate scroll attempt
 * - Layer 2: Retry after short delay (handles slow rendering)
 * - Layer 3: Final attempt after longer delay (handles large documents)
 */
function scrollToHighlightedPage() {
    const wrapper = document.querySelector('.pdf-page-wrapper');
    const highlight = highlightLayer.querySelector('.page-highlight');

    if (!wrapper || !highlight) {
        console.warn("Cannot scroll: wrapper or highlight not found");
        return;
    }

    /**
     * Perform the actual scroll operation
     */
    const performScroll = () => {
        const highlightRect = highlight.getBoundingClientRect();
        const wrapperRect = wrapper.getBoundingClientRect();
        
        // Calculate scroll position to center the highlight
        const scrollTop = wrapper.scrollTop + highlightRect.top - wrapperRect.top - (wrapperRect.height / 2) + (highlightRect.height / 2);

        wrapper.scrollTo({
            top: Math.max(0, scrollTop),
            behavior: 'smooth'
        });

        console.log("Scrolled to highlighted page");
    };

    // Layer 1: Immediate scroll
    performScroll();

    // Layer 2: Retry after 150ms (handles rendering delays)
    setTimeout(performScroll, 150);

    // Layer 3: Final attempt after 300ms (handles slow loading)
    setTimeout(performScroll, 300);
}
