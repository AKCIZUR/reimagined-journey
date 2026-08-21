# Simple Notebook — Research Workspace

Professional lightweight notebook app with a unified Notes + Web Search experience.

## Vision

- Command Palette: `Ctrl/Cmd + K`
- Quick Create: `Ctrl/Cmd + N`
- Unified search: Notes / Web / Notes + Web
- Autosave status
- Recent and favorite notes
- Research result saving
- Markdown-first notes
- Responsive desktop / tablet / mobile UI
- OKLCH light/dark design tokens

## Architecture

```text
src/
├── index.html
├── styles.css
└── app.js

api/
└── search-contract.js
```

The browser UI is provider-agnostic. A production deployment can connect `/api/search` to Brave, SearXNG, or another server-side search provider without exposing API keys in the browser.

## Run

This is a dependency-free static prototype. Open `src/index.html` directly or serve the repository with any static HTTP server.

Example:

```bash
npx serve src
```

## Web Search provider

The frontend uses a normalized `WebResult` contract. Provider credentials belong server-side; never put a search API key into client JavaScript.

## GitHub Pages

The app can be deployed as a static site by publishing the `src/` directory, or by copying its contents to the repository root for a root-based Pages deployment.
