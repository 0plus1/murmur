/**
 * Backlinks Panel - shows documents that reference the current document
 */
import React from 'react';
import { useMemo } from 'react';
import { FileText, BookOpen, Users, MapPin, Sparkles, Link2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useEditorStore } from '@/stores';
import { cn } from '@/lib/utils';

const typeIcons = {
  chapter: BookOpen,
  scene: FileText,
  character: Users,
  location: MapPin,
  theme: Sparkles,
  narrative_spine: FileText,
  note: FileText,
};

export function BacklinksPanel() {
  const backlinks = useEditorStore((state) => state.backlinks);
  const currentDocument = useEditorStore((state) => state.currentDocument);
  const openDocument = useEditorStore((state) => state.openDocument);
  
  const groupedBacklinks = useMemo(() => {
    const groups = {};
    for (const link of backlinks) {
      const sourceDoc = link.sourceDoc;
      if (!sourceDoc) continue;
      
      if (!groups[sourceDoc.id]) {
        groups[sourceDoc.id] = {
          doc: sourceDoc,
          links: [],
        };
      }
      groups[sourceDoc.id].links.push(link);
    }
    return Object.values(groups);
  }, [backlinks]);
  
  if (!currentDocument) {
    return (
      <div className="p-4 text-center text-sm text-muted-foreground" data-testid="backlinks-panel-empty">
        <Link2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>Select a document to see its backlinks</p>
      </div>
    );
  }
  
  return (
    <ScrollArea className="h-full" data-testid="backlinks-panel">
      <div className="p-4">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Referenced In ({backlinks.length})
        </h3>
        
        {groupedBacklinks.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No other documents link to this one yet.
          </p>
        ) : (
          <div className="space-y-2">
            {groupedBacklinks.map(({ doc, links }) => {
              const Icon = typeIcons[doc.type] || FileText;
              
              return (
                <button
                  key={doc.id}
                  onClick={() => openDocument(doc.id)}
                  className={cn(
                    'w-full text-left p-2 rounded-md transition-colors',
                    'hover:bg-muted/50 group'
                  )}
                  data-testid={`backlink-${doc.id}`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                      {doc.title}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {links.length} reference{links.length !== 1 ? 's' : ''}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </ScrollArea>
  );
}

export default BacklinksPanel;
