/**
 * Rich Markdown Editor with entity highlighting and distraction-free mode
 */
import { forwardRef, useEffect, useRef, useCallback, useMemo, useState, useImperativeHandle } from 'react';
import { EditorView, keymap, placeholder, Decoration, ViewPlugin, WidgetType } from '@codemirror/view';
import { EditorState, Compartment, RangeSetBuilder } from '@codemirror/state';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { syntaxHighlighting, HighlightStyle } from '@codemirror/language';
import { tags } from '@lezer/highlight';
import { useEditorStore, useProjectStore } from '@/stores';
import { parseFrontmatter } from '@/lib/markdown';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';

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
  '.cm-comment-highlight': {
    backgroundColor: 'hsla(173, 58%, 39%, 0.2)',
    borderRadius: '2px',
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
  '.cm-comment-highlight': {
    backgroundColor: 'hsla(173, 58%, 39%, 0.3)',
    borderRadius: '2px',
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
const commentHighlightMark = Decoration.mark({ class: 'cm-comment-highlight' });

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

function createFrontmatterHider() {
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
      const text = view.state.doc.toString();
      
      if (!text.startsWith('---')) {
        return builder.finish();
      }
      
      const endMatch = text.indexOf('---', 3);
      if (endMatch === -1) {
        return builder.finish();
      }
      
      const endIndex = endMatch + 3;
      const endLine = view.state.doc.lineAt(endIndex).number;
      for (let lineNumber = 1; lineNumber <= endLine; lineNumber += 1) {
        const line = view.state.doc.line(lineNumber);
        builder.add(line.from, line.from, Decoration.line({ class: 'cm-frontmatter-hidden' }));
        if (line.to > line.from) {
          builder.add(line.from, line.to, Decoration.replace({}));
        }
      }
      
      return builder.finish();
    }
  }, {
    decorations: (v) => v.decorations,
  });
}

function createCommentHighlighter(comments, commentDraft, onCommentClick) {
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
      const hasSavedComments = Array.isArray(comments) && comments.length > 0;
      const hasDraftRange = Number.isInteger(commentDraft?.selectionFrom) && Number.isInteger(commentDraft?.selectionTo);

      if (!hasSavedComments && !hasDraftRange) {
        return builder.finish();
      }

      const docLength = view.state.doc.length;
      const seen = new Set();

      const ranges = [];

      if (Array.isArray(comments)) {
        for (const comment of comments) {
          ranges.push(comment);
        }
      }

      if (commentDraft) {
        ranges.push(commentDraft);
      }

      const normalizedRanges = [];

      for (const comment of ranges) {
        const from = Number.isInteger(comment?.selectionFrom) ? comment.selectionFrom : null;
        const to = Number.isInteger(comment?.selectionTo) ? comment.selectionTo : null;
        if (from === null || to === null) continue;
        if (to <= from) continue;
        if (from < 0 || to > docLength) continue;

        const key = `${from}:${to}`;
        if (seen.has(key)) continue;
        seen.add(key);
        normalizedRanges.push({ from, to });
      }

      normalizedRanges.sort((a, b) => {
        if (a.from !== b.from) return a.from - b.from;
        return a.to - b.to;
      });

      for (const range of normalizedRanges) {
        builder.add(range.from, range.to, commentHighlightMark);
      }

      return builder.finish();
    }
  }, {
    decorations: (v) => v.decorations,
    eventHandlers: {
      click: (event, view) => {
        if (!Array.isArray(comments) || comments.length === 0) return false;

        const pos = view.posAtCoords({ x: event.clientX, y: event.clientY });
        if (pos === null) return false;

        const matchingComment = comments.find((comment) => {
          const from = Number.isInteger(comment?.selectionFrom) ? comment.selectionFrom : null;
          const to = Number.isInteger(comment?.selectionTo) ? comment.selectionTo : null;
          if (from === null || to === null) return false;
          return pos >= from && pos <= to;
        });

        if (!matchingComment) return false;

        event.preventDefault();
        onCommentClick?.(matchingComment);
        return true;
      }
    }
  });
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
        maxWidth: '100%', 
        margin: '0',
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

export const MarkdownEditor = forwardRef(function MarkdownEditor({
  value, 
  onChange, 
  isDark = true,
  highlightEntities = true,
  distractionFree = false,
  showFrontmatter = false,
  onEntityClick,
  onRequestAddComment,
  onCommentClick,
}, ref) {
  const editorRef = useRef(null);
  const viewRef = useRef(null);
  const lastCommentAnchorRef = useRef({});
  const lastTextSelectionRef = useRef(null);
  const themeCompartment = useRef(new Compartment());
  const entityCompartment = useRef(new Compartment());
  const commentsCompartment = useRef(new Compartment());
  const frontmatterCompartment = useRef(new Compartment());
  
  const documents = useProjectStore((state) => state.documents);
  const comments = useEditorStore((state) => state.comments);
  const commentDraft = useEditorStore((state) => state.commentDraft);
  
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

  const updateLastTextSelection = useCallback((view) => {
    if (!view) return;
    const selection = view.state.selection.main;
    if (!selection || selection.empty) return;

    lastTextSelectionRef.current = {
      selectionFrom: selection.from,
      selectionTo: selection.to,
      selectedText: view.state.sliceDoc(selection.from, selection.to),
      anchorOffset: selection.from,
    };
  }, []);

  useImperativeHandle(ref, () => ({
    insertAtCursor(text) {
      const view = viewRef.current;
      if (!view || distractionFree) return false;

      const selection = view.state.selection.main;
      const insertText = String(text ?? '');
      const anchor = selection.from + insertText.length;

      view.dispatch({
        changes: { from: selection.from, to: selection.to, insert: insertText },
        selection: { anchor },
        scrollIntoView: true,
      });
      view.focus();
      return true;
    },
    jumpToOffset(offset) {
      const view = viewRef.current;
      if (!view || distractionFree) return false;

      const docLength = view.state.doc.length;
      const target = Math.max(0, Math.min(Number(offset) || 0, docLength));

      view.dispatch({
        selection: { anchor: target, head: target },
        effects: EditorView.scrollIntoView(target, { y: 'start', yMargin: 24 }),
      });
      view.focus();
      return true;
    },
    focus() {
      const view = viewRef.current;
      if (!view || distractionFree) return false;
      view.focus();
      return true;
    },
  }), [distractionFree]);

  const captureCommentContext = useCallback((event) => {
    const anchor = {
      anchorOffset: null,
      anchorText: null,
      selectionFrom: null,
      selectionTo: null,
      selectedText: null,
    };

    const view = viewRef.current;
    if (view && !distractionFree) {
      const selection = view.state.selection.main;
      if (selection && !selection.empty) {
        anchor.selectionFrom = selection.from;
        anchor.selectionTo = selection.to;
        anchor.selectedText = view.state.sliceDoc(selection.from, selection.to);
        anchor.anchorOffset = selection.from;
      } else if (lastTextSelectionRef.current) {
        anchor.selectionFrom = lastTextSelectionRef.current.selectionFrom;
        anchor.selectionTo = lastTextSelectionRef.current.selectionTo;
        anchor.selectedText = lastTextSelectionRef.current.selectedText;
        anchor.anchorOffset = lastTextSelectionRef.current.anchorOffset;
      }

      const pos = view.posAtCoords({ x: event.clientX, y: event.clientY });
      if (typeof pos === 'number' && (anchor.selectionFrom === null || anchor.selectionTo === null)) {
        anchor.anchorOffset = pos;
      }
    }

    lastCommentAnchorRef.current = anchor;
  }, [distractionFree]);

  const handleMouseDownCapture = useCallback((event) => {
    if (event.button !== 2) return;
    captureCommentContext(event);
  }, [captureCommentContext]);

  const handleAddComment = useCallback(() => {
    onRequestAddComment?.(lastCommentAnchorRef.current || {});
  }, [onRequestAddComment]);
  
  // Initialize editor
  useEffect(() => {
    if (!editorRef.current || viewRef.current || distractionFree) return;
    
    const entityPlugin = highlightEntities && entities.length > 0
      ? createEntityMatcher(entities, handleEntityClick)
      : [];
    const commentPlugin = (comments.length > 0 || commentDraft)
      ? createCommentHighlighter(comments, commentDraft, onCommentClick)
      : [];
    const frontmatterPlugin = showFrontmatter ? [] : createFrontmatterHider();
    
    const startState = EditorState.create({
      doc: value || '',
      extensions: [
        history(),
        markdown({ base: markdownLanguage }),
        syntaxHighlighting(markdownHighlighting),
        themeCompartment.current.of(isDark ? darkEditorTheme : editorTheme),
        entityCompartment.current.of(entityPlugin),
        commentsCompartment.current.of(commentPlugin),
        frontmatterCompartment.current.of(frontmatterPlugin),
        keymap.of([
          ...defaultKeymap,
          ...historyKeymap,
        ]),
        placeholder('Start writing...'),
        EditorView.lineWrapping,
        EditorView.updateListener.of((update) => {
          if (update.selectionSet) {
            updateLastTextSelection(update.view);
          }
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
  }, [distractionFree, onCommentClick]);
  
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

  // Update comment highlighting
  useEffect(() => {
    if (!viewRef.current || distractionFree) return;

    const commentPlugin = (comments.length > 0 || commentDraft)
      ? createCommentHighlighter(comments, commentDraft, onCommentClick)
      : [];

    viewRef.current.dispatch({
      effects: commentsCompartment.current.reconfigure(commentPlugin),
    });
  }, [comments, commentDraft, distractionFree, onCommentClick]);

  // Update frontmatter visibility
  useEffect(() => {
    if (!viewRef.current || distractionFree) return;
    
    const frontmatterPlugin = showFrontmatter ? [] : createFrontmatterHider();
    viewRef.current.dispatch({
      effects: frontmatterCompartment.current.reconfigure(frontmatterPlugin),
    });
  }, [showFrontmatter, distractionFree]);
  
  // Distraction-free mode - render markdown
  if (distractionFree) {
    return (
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div
            className="h-full w-full overflow-auto"
            style={{ backgroundColor: isDark ? 'hsl(222, 47%, 11%)' : 'hsl(210, 40%, 98%)' }}
            data-testid="markdown-editor-preview"
            onMouseDownCapture={handleMouseDownCapture}
            onContextMenuCapture={captureCommentContext}
          >
            <RenderedMarkdown
              content={cleanContent}
              entities={highlightEntities ? entities : []}
              isDark={isDark}
              onEntityClick={handleEntityClick}
            />
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onSelect={handleAddComment} data-testid="editor-add-comment-menu-item">
            Add comment
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    );
  }
  
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          ref={editorRef}
          className="h-full w-full overflow-hidden"
          data-testid="markdown-editor"
          onMouseDownCapture={handleMouseDownCapture}
          onContextMenuCapture={captureCommentContext}
        />
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onSelect={handleAddComment} data-testid="editor-add-comment-menu-item">
          Add comment
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
});

export default MarkdownEditor;
