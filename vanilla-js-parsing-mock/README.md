# Vanilla JS API Parsing Demo

A **zero-dependency** reference implementation demonstrating how to parse and render the Bizora streaming API response in a web application.

## Features

| Feature | Description |
| :--- | :--- |
| **Step Indicators** | Shows the AI's reasoning process (e.g., "Planning", "Querying IRC Code") |
| **Inline Citations** | Parses `[uuid]` annotations and renders clickable `[1]`, `[2]` buttons |
| **Source Cards** | Displays source metadata with titles and text previews |
| **No Auto-Scroll Interruption** | Users can scroll freely during streaming without being forced back |

## Quick Start

1. Open `index.html` in any modern browser
2. Type a message and press **Send**
3. Observe step indicators, streaming text with citations, and source cards

## Project Structure

```
├── index.html      # Chat UI layout
├── style.css       # Styles for steps, citations, and source cards
├── script.js       # Core parsing and rendering logic
└── mock_data.js    # Sample API response data
```

## Key Implementation Details

### Citation Parsing
The API embeds UUIDs in text: `"The limit is $1,220,000 [8a4b9bf1-...]."` 

Use this regex to extract them:
```javascript
const pattern = /\[([a-f0-9\-]{36})\]/g;
```

### Source Rendering
Sources arrive via `source_message` events. Collect them, then render after streaming completes for a cleaner UX.

### Scrolling
No mid-stream auto-scrolling—users maintain full scroll control during streaming.
