import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';

export function ManuscriptPreviewDialog({
  open,
  onOpenChange,
  renderedMarkdown,
  rawMarkdown,
  isDark = true,
}) {
  const [mode, setMode] = useState('view');

  useEffect(() => {
    if (open) setMode('view');
  }, [open]);

  const hasContent = Boolean(renderedMarkdown?.trim() || rawMarkdown?.trim());

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-5xl h-[85vh] flex flex-col" data-testid="manuscript-preview-dialog">
        <DialogHeader>
          <DialogTitle>Manuscript Preview</DialogTitle>
          <DialogDescription>
            Preview the manuscript sequence (chapters and scenes only).
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between gap-3">
          <Tabs value={mode} onValueChange={setMode}>
            <TabsList data-testid="manuscript-preview-mode-tabs">
              <TabsTrigger value="view" data-testid="manuscript-preview-mode-view">
                View
              </TabsTrigger>
              <TabsTrigger value="raw" data-testid="manuscript-preview-mode-raw">
                Raw
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="flex-1 min-h-0 border rounded-md overflow-hidden">
          {!hasContent ? (
            <div className="h-full flex items-center justify-center text-sm text-muted-foreground" data-testid="manuscript-preview-empty">
              No manuscript documents to preview yet.
            </div>
          ) : mode === 'view' ? (
            <ScrollArea className="h-full" data-testid="manuscript-preview-view">
              <div
                className="px-6 py-6"
                style={{
                  fontFamily: "'Merriweather', Georgia, serif",
                  lineHeight: '1.8',
                  color: isDark ? 'hsl(210, 40%, 98%)' : 'hsl(222, 47%, 11%)',
                }}
              >
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h1: ({ children }) => (
                      <h1 style={{ fontSize: '1.75em', fontWeight: 700, marginTop: '1.25em', marginBottom: '0.5em', lineHeight: 1.3 }}>
                        {children}
                      </h1>
                    ),
                    h2: ({ children }) => (
                      <h2 style={{ fontSize: '1.35em', fontWeight: 600, marginTop: '1.25em', marginBottom: '0.5em', lineHeight: 1.35 }}>
                        {children}
                      </h2>
                    ),
                    h3: ({ children }) => (
                      <h3 style={{ fontSize: '1.15em', fontWeight: 600, marginTop: '1em', marginBottom: '0.4em' }}>
                        {children}
                      </h3>
                    ),
                    p: ({ children }) => <p style={{ marginBottom: '1em' }}>{children}</p>,
                    ul: ({ children }) => <ul style={{ marginBottom: '1em', paddingLeft: '1.5em', listStyleType: 'disc' }}>{children}</ul>,
                    ol: ({ children }) => <ol style={{ marginBottom: '1em', paddingLeft: '1.5em', listStyleType: 'decimal' }}>{children}</ol>,
                    li: ({ children }) => <li style={{ marginBottom: '0.25em' }}>{children}</li>,
                    blockquote: ({ children }) => (
                      <blockquote
                        style={{
                          borderLeft: isDark ? '3px solid hsl(173, 58%, 50%)' : '3px solid hsl(173, 58%, 39%)',
                          paddingLeft: '1em',
                          marginLeft: 0,
                          marginBottom: '1em',
                          fontStyle: 'italic',
                          opacity: 0.9,
                        }}
                      >
                        {children}
                      </blockquote>
                    ),
                    code: ({ inline, children }) =>
                      inline ? (
                        <code
                          style={{
                            backgroundColor: isDark ? 'hsla(215, 20%, 40%, 0.3)' : 'hsla(215, 20%, 80%, 0.5)',
                            padding: '0.1em 0.3em',
                            borderRadius: '3px',
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: '0.9em',
                          }}
                        >
                          {children}
                        </code>
                      ) : (
                        <pre
                          style={{
                            backgroundColor: isDark ? 'hsl(217, 33%, 17%)' : 'hsl(210, 40%, 96%)',
                            padding: '1em',
                            borderRadius: '6px',
                            overflow: 'auto',
                            marginBottom: '1em',
                          }}
                        >
                          <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.9em' }}>{children}</code>
                        </pre>
                      ),
                    hr: () => (
                      <hr
                        style={{
                          border: 'none',
                          borderTop: isDark ? '1px solid hsl(217, 33%, 25%)' : '1px solid hsl(214, 32%, 85%)',
                          margin: '2em 0',
                        }}
                      />
                    ),
                    a: ({ href, children }) => (
                      <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: 'hsl(173, 58%, 45%)', textDecoration: 'underline' }}>
                        {children}
                      </a>
                    ),
                  }}
                >
                  {renderedMarkdown}
                </ReactMarkdown>
              </div>
            </ScrollArea>
          ) : (
            <div className="h-full p-3" data-testid="manuscript-preview-raw">
              <Textarea
                readOnly
                value={rawMarkdown || ''}
                className="h-full min-h-0 resize-none font-mono text-xs leading-5"
                data-testid="manuscript-preview-raw-textarea"
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ManuscriptPreviewDialog;
