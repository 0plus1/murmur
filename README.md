# murmur
[![codecov](https://codecov.io/gh/0plus1/murmur/graph/badge.svg?token=s3FA6doKFy)](https://codecov.io/gh/0plus1/murmur)

**A local-first writing studio for long-form fiction.**

murmur is a native writing studio (Tauri) for novelists, screenwriters, and writers working on long-form projects. It provides a calm, distraction-free environment with strong organisational tools, while keeping your work fully local and portable.

No accounts. No cloud. No telemetry.
Works fully offline. macOS only for now.

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
- **Autosave**: Changes saved automatically to IndexedDB and mirrored to disk

### 🧠 Prompt Studio
Generate copyable prompts for external AI tools (ChatGPT, Claude, etc.):
- **Draft Next Scene**: Continue your story
- **Rewrite with Constraint**: Improve prose with specific guidance
- **Continuity Check**: Identify inconsistencies
- **Context selection**: Include current doc, previous doc, character profiles

### 📦 Export
- **ZIP download**: Export entire project as organized markdown files
- **Standard structure**: `/manuscript/`, `/bible/`, `/notes/`

### 💾 Storage
- **Choose once**: Pick a base folder on first run (changeable in Settings)
- **Live mirror**: Project folders update in real time as you write

### ⌨️ Keyboard Shortcuts
- `Cmd/Ctrl + K`: Quick search & command palette
- `Cmd/Ctrl + S`: Manual save
- `Cmd/Ctrl + P`: Open Prompt Studio

## Local-First Architecture

murmur follows a local-first design:

1. **IndexedDB for fast local state**: Projects, documents, and indexes stay on device
2. **Disk mirror**: Markdown files are written in real time to a user-selected folder
3. **No network calls**: Works completely offline
4. **No accounts or cloud**: Your data stays on your device
5. **Markdown as source of truth**: Documents are stored with YAML frontmatter, easily exported


## Development

### Prerequisites
- Node.js 18+
- Yarn
- Rust 1.77.2+
- Tauri system dependencies for macOS

### Setup
```bash
yarn install
```

### Run (native)
```bash
yarn tauri
```

### Build (frontend only)
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
- **No network calls**: Completely offline
- **No accounts**: No sign-up or login required
- **Your data is yours**: All content stays on your device

## License

Open source. See LICENSE file for details.

---

Built with care for writers who value simplicity, privacy, and focus.
