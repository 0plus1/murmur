/**
 * Rich Markdown Editor with entity highlighting and distraction-free mode
 */
import { useEffect, useRef, useCallback, useMemo, useState } from 'react';
import { EditorView, keymap, placeholder, Decoration, ViewPlugin, WidgetType } from '@codemirror/view';
import { EditorState, Compartment, RangeSetBuilder } from '@codemirror/state';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { syntaxHighlighting, HighlightStyle } from '@codemirror/language';
import { tags } from '@lezer/highlight';
import { useProjectStore } from '@/stores';
import { parseFrontmatter } from '@/lib/markdown';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Custom theme for editor
const editorTheme = EditorView.theme({
  '&': {
    height: '100%',
    fontSize: '16px',
    fontFamily: "'Merriweather', Georgia, serif",
  },
  '.cm-content': {
    padding: '24px 0',
    width: '100%',
    lineHeight: '1.8',
    caretColor: 'hsl(173, 58%, 39%)',
  },
  '.cm-cursor': {
    borderLeftColor: 'hsl(173, 58%, 39%)',
    borderLeftWidth: '2px',
  },
  '.cm-selectionBackground': {
    backgroundColor: 'hsla(173, 58%, 39%, 0.2) !important',
  },
  '&.cm-focused .cm-selectionBackground': {
    backgroundColor: 'hsla(173, 58%, 39%, 0.3) !important',
  },
  '.cm-activeLine': {
    backgroundColor: 'transparent',
  },
  '.cm-gutters': {
    display: 'none',
  },
  '.cm-scroller': {
    overflow: 'auto',
    padding: '0 24px',
  },
  '.cm-entity-highlight': {
    backgroundColor: 'hsla(173, 58%, 39%, 0.15)',
    borderRadius: '2px',
    padding: '0 2px',
    cursor: 'pointer',
    borderBottom: '1px dashed hsla(173, 58%, 39%, 0.5)',
  },
  '.cm-entity-highlight:hover': {
    backgroundColor: 'hsla(173, 58%, 39%, 0.3)',
  },
}, { dark: false });

const darkEditorTheme = EditorView.theme({
  '&': {
    height: '100%',
    fontSize: '16px',
    fontFamily: "'Merriweather', Georgia, serif",
    backgroundColor: 'hsl(222, 47%, 11%)',
    color: 'hsl(210, 40%, 98%)',
  },
  '.cm-content': {
    padding: '24px 0',
    width: '100%',
    lineHeight: '1.8',
    caretColor: 'hsl(173, 58%, 50%)',
  },
  '.cm-cursor': {
    borderLeftColor: 'hsl(173, 58%, 50%)',
    borderLeftWidth: '2px',
  },
  '.cm-selectionBackground': {
    backgroundColor: 'hsla(173, 58%, 39%, 0.3) !important',
  },
  '&.cm-focused .cm-selectionBackground': {
    backgroundColor: 'hsla(173, 58%, 39%, 0.4) !important',
  },
  '.cm-activeLine': {
    backgroundColor: 'transparent',
  },
  '.cm-gutters': {
    display: 'none',
  },
  '.cm-scroller': {
    overflow: 'auto',
    padding: '0 24px',
  },
  '.cm-entity-highlight': {
    backgroundColor: 'hsla(173, 58%, 50%, 0.2)',
    borderRadius: '2px',
    padding: '0 2px',
    cursor: 'pointer',
    borderBottom: '1px dashed hsla(173, 58%, 50%, 0.5)',
  },
  '.cm-entity-highlight:hover': {
    backgroundColor: 'hsla(173, 58%, 50%, 0.35)',
  },
}, { dark: true });

// Syntax highlighting
const markdownHighlighting = HighlightStyle.define([
  { tag: tags.heading1, fontSize: '1.75em', fontWeight: '700', lineHeight: '1.3' },
  { tag: tags.heading2, fontSize: '1.5em', fontWeight: '600', lineHeight: '1.4' },
  { tag: tags.heading3, fontSize: '1.25em', fontWeight: '600' },
  { tag: tags.emphasis, fontStyle: 'italic' },
  { tag: tags.strong, fontWeight: '700' },
  { tag: tags.link, color: 'hsl(173, 58%, 45%)', textDecoration: 'underline' },
  { tag: tags.url, color: 'hsl(173, 58%, 45%)' },
  { tag: tags.monospace, fontFamily: "'JetBrains Mono', monospace", fontSize: '0.9em' },
  { tag: tags.quote, fontStyle: 'italic', color: 'hsl(215, 20%, 65%)' },
]);

// Entity highlighter decoration
const entityHighlightMark = Decoration.mark({ class: 'cm-entity-highlight' });

function createEntityMatcher(entities, onEntityClick) {
  return ViewPlugin.fromClass(class {
    decorations;
    
    constructor(view) {
      this.decorations = this.buildDecorations(view);
    }
    
    update(update) {
      if (update.docChanged || update.viewportChanged) {
        this.decorations = this.buildDecorations(update.view);
      }
    }
    
    buildDecorations(view) {
      const builder = new RangeSetBuilder();
      
      if (!entities || entities.length === 0) {
        return builder.finish();
      }
      
      const text = view.state.doc.toString();
      
      // Find frontmatter end to skip it
      let contentStart = 0;
      if (text.startsWith('---')) {
        const endMatch = text.indexOf('---', 3);
        if (endMatch !== -1) {
          contentStart = endMatch + 3;
        }
      }
      
      // Sort entities by length (longest first) to handle overlapping matches
      const sortedEntities = [...entities].sort((a, b) => b.name.length - a.name.length);
      
      // Track matched ranges to avoid overlaps
      const matchedRanges = [];
      
      for (const entity of sortedEntities) {
        const regex = new RegExp(`\\b${escapeRegex(entity.name)}\\b`, 'gi');
        let match;
        
        while ((match = regex.exec(text)) !== null) {
          const from = match.index;
          const to = from + match[0].length;
          
          // Skip if in frontmatter
          if (from < contentStart) continue;
          
          // Skip if overlaps with existing match
          const overlaps = matchedRanges.some(([s, e]) => 
            (from >= s && from < e) || (to > s && to <= e) || (from <= s && to >= e)
          );
          
          if (!overlaps) {
            matchedRanges.push([from, to]);
            builder.add(from, to, entityHighlightMark);
          }
        }
      }
      
      // Sort by position for RangeSetBuilder
      matchedRanges.sort((a, b) => a[0] - b[0]);
      
      // Rebuild with sorted ranges
      const sortedBuilder = new RangeSetBuilder();
      for (const [from, to] of matchedRanges) {
        sortedBuilder.add(from, to, entityHighlightMark);
      }
      
      return sortedBuilder.finish();
    }
  }, {
    decorations: v => v.decorations,
    eventHandlers: {
      click: (e, view) => {
        const pos = view.posAtCoords({ x: e.clientX, y: e.clientY });
        if (pos === null) return false;
        
        const text = view.state.doc.toString();
        
        // Check if click is on an entity
        for (const entity of entities) {
          const regex = new RegExp(`\\b${escapeRegex(entity.name)}\\b`, 'gi');
          let match;
          
          while ((match = regex.exec(text)) !== null) {
            if (pos >= match.index && pos <= match.index + match[0].length) {
              e.preventDefault();
              onEntityClick(entity);
              return true;
            }
          }
        }
        
        return false;
      }
    }
  });
}

function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Rendered Markdown component for distraction-free mode
function RenderedMarkdown({ content, entities, isDark, onEntityClick }) {
  // Process content to remove wikilink brackets but keep the names
  const processedContent = useMemo(() => {
    // Remove wikilink syntax: [[Name]] -> Name, [[Name#anchor]] -> Name
    return content.replace(/\[\[([^\]#|]+)(?:#[^\]|]+)?(?:\|([^\]]+))?\]\]/g, (match, name, display) => {
      return display || name;
    });
  }, [content]);
  
  // Custom renderer for text that highlights entities
  const renderText = useCallback((text) => {
    if (typeof text !== 'string') return text;
    if (!entities || entities.length === 0) return text;
    
    let result = [];
    let lastIndex = 0;
    
    // Sort entities by length (longest first)
    const sortedEntities = [...entities].sort((a, b) => b.name.length - a.name.length);
    
    // Find all matches
    const matches = [];
    for (const entity of sortedEntities) {
      const regex = new RegExp(`\\b${escapeRegex(entity.name)}\\b`, 'gi');
      let match;
      while ((match = regex.exec(text)) !== null) {
        matches.push({ 
          index: match.index, 
          length: match[0].length, 
          text: match[0],
          entity 
        });
      }
    }
    
    // Sort matches and filter overlaps
    matches.sort((a, b) => a.index - b.index);
    const filteredMatches = [];
    let lastEnd = 0;
    for (const match of matches) {
      if (match.index >= lastEnd) {
        filteredMatches.push(match);
        lastEnd = match.index + match.length;
      }
    }
    
    if (filteredMatches.length === 0) return text;
    
    // Build result
    lastIndex = 0;
    for (const match of filteredMatches) {
      if (match.index > lastIndex) {
        result.push(text.slice(lastIndex, match.index));
      }
      result.push(
        <span
          key={`${match.index}-${match.entity.name}`}
          className="entity-highlight cursor-pointer transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            onEntityClick(match.entity);
          }}
          style={{
            backgroundColor: isDark ? 'hsla(173, 58%, 50%, 0.2)' : 'hsla(173, 58%, 39%, 0.15)',
            borderRadius: '2px',
            padding: '0 2px',
            borderBottom: isDark ? '1px dashed hsla(173, 58%, 50%, 0.5)' : '1px dashed hsla(173, 58%, 39%, 0.5)',
          }}
        >
          {match.text}
        </span>
      );
      lastIndex = match.index + match.length;
    }
    
    if (lastIndex < text.length) {
      result.push(text.slice(lastIndex));
    }
    
    return result;
  }, [entities, isDark, onEntityClick]);
  
  // Recursively process children to highlight entities
  const processChildren = useCallback((children) => {
    if (!children) return children;
    
    if (typeof children === 'string') {
      return renderText(children);
    }
    
    if (Array.isArray(children)) {
      return children.map((child, i) => {
        if (typeof child === 'string') {
          const processed = renderText(child);
          return Array.isArray(processed) ? processed.map((p, j) => 
            typeof p === 'string' ? p : { ...p, key: `${i}-${j}` }
          ) : processed;
        }
        return child;
      }).flat();
    }
    
    return children;
  }, [renderText]);

  return (
    <div 
      className="prose-container px-6 py-6 overflow-auto h-full"
      style={{ 
        maxWidth: '65ch', 
        margin: '0 auto',
        fontFamily: "'Merriweather', Georgia, serif",
        lineHeight: '1.8',
        color: isDark ? 'hsl(210, 40%, 98%)' : 'hsl(222, 47%, 11%)',
      }}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 style={{ fontSize: '1.75em', fontWeight: 700, marginTop: '1.5em', marginBottom: '0.5em', lineHeight: 1.3 }}>
              {processChildren(children)}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 style={{ fontSize: '1.5em', fontWeight: 600, marginTop: '1.5em', marginBottom: '0.5em', lineHeight: 1.4 }}>
              {processChildren(children)}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 style={{ fontSize: '1.25em', fontWeight: 600, marginTop: '1.25em', marginBottom: '0.5em' }}>
              {processChildren(children)}
            </h3>
          ),
          p: ({ children }) => (
            <p style={{ marginBottom: '1em' }}>{processChildren(children)}</p>
          ),
          ul: ({ children }) => (
            <ul style={{ marginBottom: '1em', paddingLeft: '1.5em', listStyleType: 'disc' }}>{children}</ul>
          ),
          ol: ({ children }) => (
            <ol style={{ marginBottom: '1em', paddingLeft: '1.5em', listStyleType: 'decimal' }}>{children}</ol>
          ),
          li: ({ children }) => (
            <li style={{ marginBottom: '0.25em' }}>{processChildren(children)}</li>
          ),
          blockquote: ({ children }) => (
            <blockquote style={{ 
              borderLeft: isDark ? '3px solid hsl(173, 58%, 50%)' : '3px solid hsl(173, 58%, 39%)',
              paddingLeft: '1em',
              marginLeft: 0,
              marginBottom: '1em',
              fontStyle: 'italic',
              opacity: 0.9,
            }}>
              {children}
            </blockquote>
          ),
          code: ({ inline, children }) => inline ? (
            <code style={{ 
              backgroundColor: isDark ? 'hsla(215, 20%, 40%, 0.3)' : 'hsla(215, 20%, 80%, 0.5)',
              padding: '0.1em 0.3em',
              borderRadius: '3px',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '0.9em',
            }}>
              {children}
            </code>
          ) : (
            <pre style={{ 
              backgroundColor: isDark ? 'hsl(217, 33%, 17%)' : 'hsl(210, 40%, 96%)',
              padding: '1em',
              borderRadius: '6px',
              overflow: 'auto',
              marginBottom: '1em',
            }}>
              <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.9em' }}>
                {children}
              </code>
            </pre>
          ),
          hr: () => (
            <hr style={{ 
              border: 'none',
              borderTop: isDark ? '1px solid hsl(217, 33%, 25%)' : '1px solid hsl(214, 32%, 85%)',
              margin: '2em 0',
            }} />
          ),
          a: ({ href, children }) => (
            <a 
              href={href} 
              style={{ color: 'hsl(173, 58%, 45%)', textDecoration: 'underline' }}
              target="_blank"
              rel="noopener noreferrer"
            >
              {children}
            </a>
          ),
          strong: ({ children }) => <strong>{processChildren(children)}</strong>,
          em: ({ children }) => <em>{processChildren(children)}</em>,
          td: ({ children }) => <td style={{ padding: '0.5em', borderBottom: '1px solid currentColor', opacity: 0.2 }}>{processChildren(children)}</td>,
          th: ({ children }) => <th style={{ padding: '0.5em', fontWeight: 600, borderBottom: '2px solid currentColor', opacity: 0.3 }}>{children}</th>,
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
}

export function MarkdownEditor({ 
  value, 
  onChange, 
  isDark = true,
  highlightEntities = true,
  distractionFree = false,
  onEntityClick
}) {
  const editorRef = useRef(null);
  const viewRef = useRef(null);
  const themeCompartment = useRef(new Compartment());
  const entityCompartment = useRef(new Compartment());
  
  const documents = useProjectStore((state) => state.documents);
  
  // Get character and location entities
  const entities = useMemo(() => {
    return documents
      .filter(d => ['character', 'location'].includes(d.type))
      .map(d => ({ id: d.id, name: d.title, type: d.type }));
  }, [documents]);
  
  // Parse content without frontmatter for distraction-free mode
  const { content: cleanContent } = useMemo(() => {
    return parseFrontmatter(value || '').value;
  }, [value]);
  
  // Handle entity click
  const handleEntityClick = useCallback((entity) => {
    if (onEntityClick) {
      onEntityClick(entity.id);
    }
  }, [onEntityClick]);
  
  // Initialize editor
  useEffect(() => {
    if (!editorRef.current || viewRef.current || distractionFree) return;
    
    const entityPlugin = highlightEntities && entities.length > 0
      ? createEntityMatcher(entities, handleEntityClick)
      : [];
    
    const startState = EditorState.create({
      doc: value || '',
      extensions: [
        history(),
        markdown({ base: markdownLanguage }),
        syntaxHighlighting(markdownHighlighting),
        themeCompartment.current.of(isDark ? darkEditorTheme : editorTheme),
        entityCompartment.current.of(entityPlugin),
        keymap.of([
          ...defaultKeymap,
          ...historyKeymap,
        ]),
        placeholder('Start writing...'),
        EditorView.lineWrapping,
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onChange?.(update.state.doc.toString());
          }
        }),
      ],
    });
    
    viewRef.current = new EditorView({
      state: startState,
      parent: editorRef.current,
    });
    
    return () => {
      viewRef.current?.destroy();
      viewRef.current = null;
    };
  }, [distractionFree]);
  
  // Update content when value prop changes
  useEffect(() => {
    if (!viewRef.current || distractionFree) return;
    
    const currentValue = viewRef.current.state.doc.toString();
    if (value !== currentValue) {
      viewRef.current.dispatch({
        changes: { from: 0, to: currentValue.length, insert: value || '' },
      });
    }
  }, [value, distractionFree]);
  
  // Update theme
  useEffect(() => {
    if (!viewRef.current || distractionFree) return;
    
    viewRef.current.dispatch({
      effects: themeCompartment.current.reconfigure(isDark ? darkEditorTheme : editorTheme),
    });
  }, [isDark, distractionFree]);
  
  // Update entity highlighting
  useEffect(() => {
    if (!viewRef.current || distractionFree) return;
    
    const entityPlugin = highlightEntities && entities.length > 0
      ? createEntityMatcher(entities, handleEntityClick)
      : [];
    
    viewRef.current.dispatch({
      effects: entityCompartment.current.reconfigure(entityPlugin),
    });
  }, [highlightEntities, entities, handleEntityClick, distractionFree]);
  
  // Distraction-free mode - render markdown
  if (distractionFree) {
    return (
      <div 
        className="h-full w-full overflow-auto"
        style={{ backgroundColor: isDark ? 'hsl(222, 47%, 11%)' : 'hsl(210, 40%, 98%)' }}
        data-testid="markdown-editor-preview"
      >
        <RenderedMarkdown 
          content={cleanContent}
          entities={highlightEntities ? entities : []}
          isDark={isDark}
          onEntityClick={handleEntityClick}
        />
      </div>
    );
  }
  
  return (
    <div 
      ref={editorRef} 
      className="h-full w-full overflow-hidden"
      data-testid="markdown-editor"
    />
  );
}

export default MarkdownEditor;
