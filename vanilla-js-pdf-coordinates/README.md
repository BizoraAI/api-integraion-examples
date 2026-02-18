# Vanilla JS: PDF Page Navigation Example

This example demonstrates how to implement page-level PDF navigation using the `page_label` metadata returned by the Bizora Platform API.

## Overview

This implementation uses a simplified approach to PDF navigation that highlights entire pages rather than specific text regions. This approach is:

- **Simpler**: No complex coordinate parsing or normalization
- **More Reliable**: Works consistently across different PDF viewers and screen sizes
- **Easier to Maintain**: Fewer edge cases and less code to manage
- **User-Friendly**: Clear visual indication of which page contains the referenced information

## Core Concepts

### 1. Page Labels

The Bizora API returns a `page_label` in the metadata for each source:

```javascript
{
  node_id: "uuid-1234",
  metadata: {
    file_path: "document.pdf",
    page_label: "1",  // The page number containing this information
    sourceOrigin: "https://..."
  }
}
```

Page labels can be:
- Numeric strings: `"1"`, `"2"`, `"42"`
- Text labels: `"Page 5"`, `"Introduction"`

### 2. Page-Level Highlighting

Instead of highlighting specific text regions with coordinates, we highlight the entire page:

```javascript
function renderPageHighlight(pageLabel) {
  const highlightDiv = document.createElement('div');
  highlightDiv.className = 'page-highlight';
  highlightDiv.setAttribute('data-page', pageLabel);
  highlightLayer.appendChild(highlightDiv);
}
```

The highlight uses:
- **15% opacity yellow background** for subtle page indication
- **3px solid amber border (#FFC107)** for clear visual boundary
- **Full-page coverage** to indicate the entire page contains relevant information

### 3. Auto-Scroll to Page

When a user clicks a citation, the viewer automatically scrolls to the highlighted page using a three-layer approach:

```javascript
function scrollToHighlightedPage() {
  // Layer 1: Immediate scroll
  performScroll();
  
  // Layer 2: Retry after 150ms (handles rendering delays)
  setTimeout(performScroll, 150);
  
  // Layer 3: Final attempt after 300ms (handles slow loading)
  setTimeout(performScroll, 300);
}
```

This ensures reliable scrolling even with:
- Slow page rendering
- Large PDF documents
- Rapid user navigation

## Files

- **index.html**: The markup structure with a mock PDF page
- **script.js**: Core logic for page navigation and highlighting
- **style.css**: Styles for the chat interface and page-level highlights

## How to Run

Simply open `index.html` in any web browser. No build step or server is required.

## Integration with Real PDF Viewers

### Using PDF.js

```javascript
// When a page is rendered
pdfViewer.on('pagerendered', (event) => {
  const pageNumber = event.pageNumber;
  
  // Check if this page should be highlighted
  if (pageNumber === currentHighlightedPage) {
    renderPageHighlight(pageNumber);
  }
});

// Navigate to page
function navigateToPage(pageLabel) {
  const pageNumber = parseInt(pageLabel);
  pdfViewer.currentPageNumber = pageNumber;
}
```

### Using React-PDF

```jsx
<Document file={pdfUrl}>
  {Array.from(new Array(numPages), (el, index) => (
    <Page
      key={`page_${index + 1}`}
      pageNumber={index + 1}
      renderAnnotationLayer={false}
      renderTextLayer={false}
    >
      {/* Render highlight if this is the target page */}
      {highlightedPage === index + 1 && (
        <div className="page-highlight" />
      )}
    </Page>
  ))}
</Document>
```

## API Response Structure

The Bizora API returns sources with this structure:

```json
{
  "node_id": "uuid-1234",
  "text": "The relevant text content...",
  "metadata": {
    "file_path": "taxes/federal/IRC/section_179.pdf",
    "page_label": "1",
    "sourceOrigin": "https://...",
    "year": 2025
  }
}
```

The `page_label` field is generated during the PDF indexing process and represents the page number where the content was extracted.

## Troubleshooting

### Highlight not appearing
- Check that `page_label` exists in metadata
- Verify the highlight layer has correct z-index
- Ensure the PDF page container has `position: relative`

### Scroll not working
- Confirm the PDF wrapper is scrollable
- Check that highlight element is rendered before scrolling
- Verify scroll container dimensions are calculated correctly

### Multiple highlights showing
- Clear previous highlights before rendering new ones
- Use `highlightLayer.innerHTML = ''` to reset

## Learn More

- [Bizora API Documentation](https://docs.bizora.ai)
- [Page Labels and Source Origin Guide](https://docs.bizora.ai/chat-completions/page-labels-and-origins)
- [PDF.js Documentation](https://mozilla.github.io/pdf.js/)
- [React-PDF Documentation](https://github.com/wojtekmaj/react-pdf)
