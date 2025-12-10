/**
 * Bizora AI Source Rendering Demo
 * 
 * CORE CONCEPTS:
 * 1. The API returns text with embedded Node IDs: "Some fact [uuid-1234]..."
 * 2. We must Regex-match these IDs.
 * 3. We map the IDs to the Source Metadata (title, file path, etc.).
 * 4. We replace the ID with a clickable [1] citation button.
 * 5. We also handle "step_message" to show the AI's thinking process.
 */

// ---------------------------------------------------------
// 1. THE PARSING LOGIC (Reuse this in your app)
// ---------------------------------------------------------

/**
 * Parses text containing UUID node annotations and replaces them with 
 * clickable citation numbers.
 */
function renderWithCitations(text, sources) {
    if (!text) return '';

    // REGEX: Matches the UUID format sent by the API: [8-4-4-4-12 hex chars]
    const nodeIdPattern = /\[([a-f0-9\-]{36})\]/g;

    // Map UUIDs to sequential numbers (1, 2, 3...)
    const nodeIdToNumber = new Map();
    let counter = 1;
    let match;

    // Build map first
    while ((match = nodeIdPattern.exec(text)) !== null) {
        const nodeId = match[1];
        if (!nodeIdToNumber.has(nodeId)) {
            nodeIdToNumber.set(nodeId, counter++);
        }
    }

    // Replace UUIDs with HTML Buttons
    const processedHtml = text.replace(nodeIdPattern, (match, nodeId) => {
        const number = nodeIdToNumber.get(nodeId);
        return `<button class="inline-citation" onclick="handleCitationClick('${nodeId}', ${number})">${number}</button>`;
    });

    // Basic markdown formatting for newlines and bullets (for demo purposes)
    return processedHtml
        .replace(/\n\n/g, '<br><br>')
        .replace(/\n- /g, '<br>• ');
}

// ---------------------------------------------------------
// 2. UI HELPERS (Demo specific)
// ---------------------------------------------------------

window.handleCitationClick = (nodeId, number) => {
    const source = window.currentSources?.find(s => s.node_id === nodeId);
    if (source) {
        openSourceModal(source, number);
    }
};

function renderSourceCards(container, sources) {
    container.innerHTML = '';
    const uniqueSources = [];
    const seenIds = new Set();

    // Flatten sources if they came in batches
    sources.forEach(src => {
        if (src.node_id && !seenIds.has(src.node_id)) {
            seenIds.add(src.node_id);
            uniqueSources.push(src);
        }
    });

    if (uniqueSources.length === 0) return;

    const title = document.createElement('div');
    title.className = 'sources-title';
    title.innerHTML = '<i data-lucide="book-open"></i> Sources';
    container.appendChild(title);

    uniqueSources.forEach((source, index) => {
        const citationNumber = index + 1;
        const card = document.createElement('button');
        card.className = 'source-card';
        // Try to use title or tool name, fallback to s3 path filename
        let title = source.title || source.tool || 'Document';
        if (source.s3_file_path) {
            const parts = source.s3_file_path.split('/');
            title = parts[parts.length - 1]; // snippet filename
        }

        card.innerHTML = `
            <div class="source-header">
                <div class="citation-number">${citationNumber}</div>
                <div class="source-title">${title}</div>
            </div>
            <div class="source-snippet">${source.text ? source.text.substring(0, 100) + '...' : 'No preview available'}</div>
        `;
        card.addEventListener('click', () => openSourceModal(source, citationNumber));
        container.appendChild(card);
    });
    lucide.createIcons();
}

function renderSteps(container, steps) {
    container.innerHTML = '';

    if (steps.length === 0) return;

    // Show only the last step or a summary, or all.
    // For "Industry Good" feel, let's show a "Thinking..." accordion
    const lastStep = steps[steps.length - 1];

    const wrapper = document.createElement('div');
    wrapper.className = 'steps-wrapper';

    wrapper.innerHTML = `
        <div class="step-header">
            <i data-lucide="brain-circuit" class="spin-slow"></i>
            <span>${lastStep.title || 'Thinking...'}</span>
        </div>
        <div class="step-details">${lastStep.description || ''}</div>
    `;
    container.appendChild(wrapper);
    lucide.createIcons();
}

function openSourceModal(source, number) {
    let title = source.title || source.tool || 'Document';
    if (source.s3_file_path) {
        const parts = source.s3_file_path.split('/');
        title = parts[parts.length - 1];
    }

    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalText').textContent = source.text || 'No content.';
    document.getElementById('modalCitationBadge').textContent = number;
    document.getElementById('sourceModal').classList.remove('hidden');
}

// ---------------------------------------------------------
// 3. APPLICATION LOGIC
// ---------------------------------------------------------

const chatForm = document.getElementById('chatForm');
const messagesContainer = document.getElementById('messagesContainer');
const userInput = document.getElementById('userInput');

// Enable/disable send button based on input
userInput.addEventListener('input', () => {
    document.getElementById('sendBtn').disabled = !userInput.value.trim();
});

chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = userInput.value.trim();
    if (!text) return;

    userInput.value = '';
    document.getElementById('sendBtn').disabled = true;

    // Add User Message
    const userDiv = document.createElement('div');
    userDiv.className = 'message user';
    userDiv.innerHTML = `<div class="content"><div class="bubble">${text}</div></div>`;
    messagesContainer.appendChild(userDiv);

    // Add Assistant Placeholder
    const assistantDiv = document.createElement('div');
    assistantDiv.className = 'message assistant';
    assistantDiv.innerHTML = `
        <div class="avatar"><i data-lucide="bot"></i></div>
        <div class="content">
            <div class="steps-container"></div>
            <div class="bubble">
                <div class="markdown-content"></div>
                <div class="typing-indicator"><span>.</span><span>.</span><span>.</span></div>
            </div>
            <div class="sources-grid"></div>
        </div>`;
    messagesContainer.appendChild(assistantDiv);

    // Stream from Mock Data
    await streamResponse(assistantDiv);
});

async function streamResponse(container) {
    const contentDiv = container.querySelector('.markdown-content');
    const sourcesGrid = container.querySelector('.sources-grid');
    const stepsContainer = container.querySelector('.steps-container');
    const loader = container.querySelector('.typing-indicator');

    let fullText = "";
    let accumulatedSources = [];
    let accumulatedSteps = [];

    // Use globally loaded MOCK_STREAM_DATA
    if (typeof MOCK_STREAM_DATA === 'undefined') {
        contentDiv.innerHTML = "Error: MOCK_STREAM_DATA not found. Run generate_mock_stream.py first.";
        loader.style.display = 'none';
        return;
    }

    for (const chunk of MOCK_STREAM_DATA) {
        // Simulate network delay
        await new Promise(r => setTimeout(r, 10)); // Fast stream for demo

        // 1. Handle Text Deltas
        if (chunk.choices && chunk.choices[0].delta.content) {
            fullText += chunk.choices[0].delta.content;
            contentDiv.innerHTML = renderWithCitations(fullText, accumulatedSources);
            loader.style.display = 'none';
        }

        // 2. Handle Custom Data (Steps & Sources)
        if (chunk.custom_data) {
            const data = chunk.custom_data;

            if (data.type === 'step_message') {
                accumulatedSteps.push(data);
                renderSteps(stepsContainer, accumulatedSteps);
            }

            else if (data.type === 'source_message') {
                if (data.content && Array.isArray(data.content)) {
                    accumulatedSources.push(...data.content);
                    window.currentSources = accumulatedSources;
                    contentDiv.innerHTML = renderWithCitations(fullText, accumulatedSources);
                }
            }
        }
        // No mid-stream scrolling - let user read freely
    }

    // Render sources AFTER streaming is complete
    if (accumulatedSources.length > 0) {
        renderSourceCards(sourcesGrid, accumulatedSources);
    }

    // Hide steps after completion (optional: could keep them)
    stepsContainer.innerHTML = '';
}

// Modal Close Logic
document.getElementById('modalClose').addEventListener('click', () => {
    document.getElementById('sourceModal').classList.add('hidden');
});

// Clear Chat Button
document.getElementById('clearBtn').addEventListener('click', () => {
    const container = document.getElementById('messagesContainer');
    container.innerHTML = `
        <div class="message assistant">
            <div class="avatar"><i data-lucide="bot"></i></div>
            <div class="content">
                <div class="bubble">
                    <p>Hello! I can help you research tax codes, financial regulations, and more. I'll provide citations for everything I find.</p>
                </div>
            </div>
        </div>`;
    lucide.createIcons();
});

lucide.createIcons();
