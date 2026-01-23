# murmur

**A local-first writing studio for long-form fiction.**

murmur is a Progressive Web App (PWA) for novelists, screenwriters, and writers working on long-form projects. It provides a calm, distraction-free environment with strong organisational tools, while keeping your work fully local and portable.

No accounts. No cloud. No telemetry.
Works offline after the first load.

## Why murmur

Most writing tools fall into one of two camps:
* word processors with no real structure, or
* heavy, proprietary systems that lock your work behind databases and formats you don’t control.

murmur sits in between.

It gives you:
* Scrivener-like structure
* Obsidian-style internal links
* Markdown as the export format
* A typography-first interface designed for focus

## Features

### 📝 Manuscript Management
- **Hierarchical structure**: Organize your work into Chapters and Scenes
- **Drag-and-drop reordering**: Easily rearrange your manuscript
- **Status tracking**: Mark documents as Draft, Revised, or Final
- **Word count**: Track progress per document

### 📚 Character Bible
- **Character profiles**: Keep detailed notes on your characters
- **Locations**: Document settings and places
- **Themes**: Track thematic elements and style guides
- **Quick insert**: Add `[[wikilinks]]` to reference entities

### 🔗 Internal Links
- **Wikilinks**: Reference any document with `[[Document Name]]`
- **Heading anchors**: Link to specific sections with `[[Doc#Heading]]`
- **Autocomplete**: Get suggestions while typing `[[`
- **Backlinks panel**: See all documents that reference the current one
- **Safe refactoring**: Rename documents and all links update automatically

### ✍️ Markdown Editor
- **CodeMirror 6**: Fast, reliable markdown editing
- **Syntax highlighting**: Visual distinction for headings, emphasis, links
- **YAML frontmatter**: Structured metadata for each document
- **Autosave**: Changes saved automatically to IndexedDB

### 🧠 Prompt Studio
Generate copyable prompts for external AI tools (ChatGPT, Claude, etc.):
- **Draft Next Scene**: Continue your story
- **Rewrite with Constraint**: Improve prose with specific guidance
- **Continuity Check**: Identify inconsistencies
- **Context selection**: Include current doc, previous doc, character profiles

### 📦 Export
- **ZIP download**: Export entire project as organized markdown files
- **Folder sync**: Write directly to disk (File System Access API, where supported)
- **Standard structure**: `/manuscript/`, `/bible/`, `/notes/`

### ⌨️ Keyboard Shortcuts
- `Cmd/Ctrl + K`: Quick search & command palette
- `Cmd/Ctrl + S`: Manual save
- `Cmd/Ctrl + P`: Open Prompt Studio

## Local-First Architecture

murmur follows a local-first design:

1. **All data in IndexedDB**: Projects, documents, and indexes are stored entirely in your browser
2. **No network calls**: After initial load, works completely offline
3. **No accounts or cloud**: Your data stays on your device
4. **Markdown as source of truth**: Documents are stored with YAML frontmatter, easily exported


## Development

### Prerequisites
- Node.js 18+
- Yarn

### Setup
```bash
yarn install
yarn start
```

### Build
```bash
yarn build
```

### Tests
```bash
yarn test
```

```bash
yarn test:watch
```

## Privacy

- **No telemetry**: Zero analytics or tracking
- **No network calls**: After initial load, completely offline
- **No accounts**: No sign-up or login required
- **Your data is yours**: All content stays in your browser

## License

Open source. See LICENSE file for details.

---

Built with care for writers who value simplicity, privacy, and focus.
