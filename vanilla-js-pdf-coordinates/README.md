# Vanilla JS: PDF Coordinates Example

This example demonstrates how to implement "Deep Linking" into PDF documents using the coordinates metadata returned by the Bizora Platform API.

## Core Concepts

1.  **Parsing Coordinates**: Handling both Tuple String formats `(x1, y1, x2, y2)` and JSON `bounding_box` objects.
2.  **Normalization**: Converting raw PDF coordinates (usually in points) to CSS-friendly percentage values to ensure highlights work responsibly on any screen size.
3.  **Rendering**: Using a simple absolute-positioned overlay (`div`) to highlight the text.

## Files

-   `index.html`: The markup structure, including a mock PDF page.
-   `script.js`: The core logic for parsing coordinates and responding to citation clicks.
-   `style.css`: Styles for the simulated chat interface and the PDF highlights.

## How to Run

Simply open `index.html` in any web browser. No build step or server is required.

## Integration Notes

-   **PDF Viewer**: This example mocks the PDF viewer with a simple HTML `div`. In a real application, you would integrate this with libraries like `pdf.js` or `react-pdf`.
-   **Coordinate System**: Ensure your PDF viewer's coordinate system matches the API's. The API typically returns coordinates based on the original PDF dimensions (often 72 DPI points).
