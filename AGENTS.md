# murmur — agents.md

This file is the single source of truth for how contributors should build, extend, and maintain murmur.

## Product Identity

- **Name:** murmur
- **Type:** Local-first PWA writing studio
- **Vibe:** Minimalist, focused, typography-first, local-first
- **Emotional tone:** Calm, organised, flow-inducing
- **Non-goals (v1):**
  - No AI integrations or API calls
  - No accounts, auth, cloud sync, or telemetry
  - No vendor lock-in formats

## Core Principles

1. **Local-first**
   - Works offline after first load.
   - No network calls by default.
2. **Data ownership**
   - Documents are stored as Markdown strings in IndexedDB.
   - Export produces a plain folder structure of `.md` files + `project.json`.
3. **Derived index**
   - Links/backlinks/search indexes are derived from stored Markdown and can be rebuilt.
4. **Clean architecture**
   - Small modules, explicit boundaries, no “god files”.
5. **Open-source readiness**
   - Minimal dependencies, auditable, consistent style, no platform/vendor references in UI/copy.

## Information Architecture

### Entities
- **Manuscript:** Chapters and Scenes
- **Bible:** Characters, Locations, Themes
- **Notes:** Optional (v1-friendly but not required)

### Wikilinks
- `[[Name]]`
- `[[Doc#Heading]]` (heading anchors)
Features:
- Autocomplete when typing `[[`
- Backlinks panel (“Referenced in…”)
- Rename refactor updates links safely

## Data Model

### Markdown format
Each document is Markdown with YAML frontmatter (mandatory):

- `id` (uuid)
- `type` (`chapter|scene|character|location|theme|note`)
- `title`
- `status` (`draft|revised|final`) for manuscript docs
- `order` (number) for sorting
- `updated_at` (ISO string)

### IndexedDB (primary storage)
Use Dexie (or idb) with tables:

- `projects`: `{ id, name, created_at, updated_at }`
- `documents`: `{ id, project_id, type, title, status?, order, markdown, updated_at }`
- `entities`: `{ project_id, entity_type, name, doc_id }`
- `links`: `{ project_id, source_doc_id, target_text, target_doc_id?, target_anchor?, raw }`
- `settings`: `{ project_id, key, value }`

### Reindexing (mandatory)
“Reindex Project” must:
- Parse all documents in a project
- Extract frontmatter, title, headings, wordcount, wikilinks
- Populate `links` and `entities`
- Be deterministic and fast for hundreds of docs
- Be robust to malformed frontmatter (fail gracefully, show toast)

## UI / UX

### Layout
- Three-pane layout:
  - **Left:** manuscript tree / navigation
  - **Center:** editor
  - **Right:** context panels (backlinks / bible / prompt studio)
- Resizable panes (desktop)
- Responsive:
  - Mobile stacks panels (tabs/drawer)

### Typography (mandatory)
- UI: **Manrope**
- Editor: **Merriweather**
- Mono: **JetBrains Mono**

Usage:
- Headings: `font-ui font-bold tracking-tight`
- Body: `font-editor leading-relaxed`
- UI text: `font-ui text-sm`
- Code: `font-mono text-xs`

Editor readability:
- Keep editor content constrained to `max-w-prose` with comfortable line height.

### Theme
- Dark mode default, light mode toggle
- Palette: Slate + muted teal accent
- No gradients, no textures

### Accessibility
- Visible focus states: `ring-2 ring-primary ring-offset-2`
- Respect `prefers-reduced-motion`
- Ensure contrast is readable in dark mode

### Keyboard shortcuts (mandatory)
- `Cmd/Ctrl+K` command palette / quick switch
- `Cmd/Ctrl+S` manual save
- `Cmd/Ctrl+P` open Prompt Studio

## Component / Module Expectations

### Dependencies
- UI: shadcn/ui, lucide-react
- Editor: CodeMirror 6 with markdown
- Validation: Zod
- State: Zustand
- Toasts: sonner

### Code organisation
Maintain clear folders (example):

- `src/`
  - `app/` (routing/layout)
  - `components/`
  - `features/`
    - `project/`
    - `manuscript/`
    - `bible/`
    - `links/`
    - `prompt-studio/`
    - `search/`
  - `lib/`
    - `db/`
    - `markdown/`
    - `export/`
    - `utils/`
  - `types/` (Zod schemas + shared TS types)

Guidelines:
- No `any`
- Prefer pure functions in `lib/` with unit tests
- UI components stay thin; logic in `features/` and `lib/`

## Prompt Studio (no AI calls)

Prompt Studio generates copyable prompts for external tools (ChatGPT/Claude/etc.). No network calls.

Templates (v1):
1. Draft next scene
2. Rewrite with constraint (more subtext, less exposition)
3. Continuity check

Context selection:
- Current doc
- Previous doc
- Referenced bible entities (suggested)
- Style guide doc (if present)

## Testing Requirements

Minimum test suite:
- Frontmatter parser
- Wikilink parser
- Heading/anchor extraction
- Reindexer logic (pure functions)
- Link refactor on rename (pure function)

Integration smoke tests:
- Create project
- Create doc, autosave
- Reindex updates backlinks
- Export zip generates expected structure

All interactive elements should include `data-testid` attributes.

## Universal Guidelines

- Avoid platform vendor references in UI or copy.
- Avoid large rewrites; keep PRs small and reviewable
- Prefer explicitness over cleverness
- Keep the app calm and quiet: typography-first, minimal ornamentation
