/**
 * Style Guide Panel - Manage style guide documents
 */
import { useMemo } from 'react';
import { BookOpen, Plus } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { useProjectStore, useEditorStore } from '@/stores';

const isStyleGuideDoc = (doc) => (
  doc.type === 'theme' &&
  doc.title.toLowerCase().includes('style guide')
);

export function StyleGuidePanel() {
  const documents = useProjectStore((state) => state.documents);
  const openDocument = useEditorStore((state) => state.openDocument);
  const createDocument = useEditorStore((state) => state.createDocument);
  
  const styleGuides = useMemo(
    () => documents.filter((doc) => isStyleGuideDoc(doc)),
    [documents]
  );
  
  const handleCreate = async () => {
    if (styleGuides.length > 0) {
      openDocument(styleGuides[0].id);
      return;
    }
    await createDocument('theme', 'Style Guide');
  };
  
  return (
    <div className="h-full flex flex-col" data-testid="style-guide-panel">
      <ScrollArea className="h-full">
        <div className="p-4 space-y-1">
          {styleGuides.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-6">
              No style guide yet
            </div>
          ) : (
            styleGuides.map((doc) => (
              <button
                key={doc.id}
                onClick={() => openDocument(doc.id)}
                className="group flex items-center justify-between w-full p-2 rounded-md hover:bg-muted/50 transition-colors text-left"
                data-testid={`style-guide-item-${doc.id}`}
              >
                <span className="flex items-center gap-2 text-sm truncate">
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                  {doc.title}
                </span>
              </button>
            ))
          )}
          
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-muted-foreground mt-2"
            onClick={handleCreate}
            data-testid="create-style-guide-btn"
          >
            <Plus className="h-3 w-3 mr-2" />
            {styleGuides.length > 0 ? 'Open style guide' : 'Create style guide'}
          </Button>
        </div>
      </ScrollArea>
    </div>
  );
}

export default StyleGuidePanel;
