# Quick Fill Browser Extension

Quick Fill is a minimal browser extension for repetitive form filling.
You can store common values (full name, email, GitHub, LinkedIn, etc.), assign shortcuts, and inject values into the currently focused field.

## Core Features

- Multiple profiles (variants) for different contexts
- Field and link items in each profile
- Starred items for faster access
- Custom shortcut per item (example: `ctrl+alt+1`)
- Keyword alias + `Tab` auto-complete (example: `linkedin` + `Tab`)
- One-click insert from popup
- Separate settings page for adding extra fields
- Persistent sync storage via `chrome.storage.sync`

## Current Architecture

- `popup` (`src/App.tsx`): minimal quick-insert UI
- `options` (`src/options/OptionsApp.tsx`): detailed profile/item management page
- `content script` (`src/content.ts`): shortcut listening + insertion into focused element
- `storage layer` (`src/lib/storage.ts`): data read/write/normalize
- `shortcut utils` (`src/lib/shortcuts.ts`): normalize and match keyboard combos

## UI

Custom, minimal CSS is used. No external UI component library.

## Default Data

On first run, one profile is created with:

- `Full Name` -> `ctrl+alt+1`
- `Email` -> `ctrl+alt+2`
- `GitHub` -> `ctrl+alt+3`
- `LinkedIn` -> `ctrl+alt+4`

## How It Works

1. Focus an editable area on any webpage (`input`, `textarea`, `contenteditable`).
2. Trigger a configured shortcut (for example `ctrl+alt+1`).
3. Matching item value is inserted at cursor position.

Alias method:

1. Type an item alias (for example `linkedin`) into a field.
2. Press `Tab`.
3. Alias is replaced with the saved value.

Alternative:

1. Open extension popup.
2. Click a saved item to insert directly.
3. Use `Ekstra Alanlar` button to open the full settings page.

## Shortcut Format

- Supported modifiers: `ctrl`, `alt`, `shift`, `meta`
- Example formats:
  - `ctrl+alt+1`
  - `ctrl+shift+g`
  - `alt+enter`

## Local Development

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start dev mode:
   ```bash
   npm run dev
   ```
3. Build production:
   ```bash
   npm run build
   ```
4. Load extension as unpacked (use your browser extension page).

Firefox:

1. Build project: `npm run build`
2. Open `about:debugging#/runtime/this-firefox`
3. Click `Load Temporary Add-on...`
4. Select `dist/manifest.json`

## Permissions Used

- `storage`: save profiles/items/shortcuts
- `tabs`: send insert message from popup to active tab
- `host_permissions: <all_urls>`: run content script on pages for shortcut handling

## Browser Support

- Chrome (MV3)
- Firefox (MV3, temporary load for local development)

## Notes / Limitations

- Content scripts are not allowed on some special pages (for example `chrome://` pages).
- Shortcuts are interpreted inside page context; avoid using very generic single-key shortcuts.

## Next Steps (Planned)

- Import/export profile data
- Reorder items with drag-and-drop
- Better shortcut conflict detection
- Optional site-specific profiles

## License

MIT
