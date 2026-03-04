/**
 * Bible Panel - Quick view of characters, locations, scenes, themes with insert link
 */
import { useMemo } from 'react';
import { FileText, Users, MapPin, Sparkles, Plus } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useProjectStore, useEditorStore } from '@/stores';

const entityTypes = [
  { type: 'character', label: 'Characters', icon: Users, createLabel: 'character' },
  { type: 'location', label: 'Locations', icon: MapPin, createLabel: 'location' },
  { type: 'scene', label: 'Scenes', icon: FileText, createLabel: 'scene' },
  { type: 'theme', label: 'Themes', icon: Sparkles, createLabel: 'theme' },
  { type: 'narrative_spine', label: 'Narrative Spine', icon: FileText, createLabel: 'narrative spine', singleton: true },
];

export function BiblePanel({ editorRef, onRequestCreate }) {
  const documents = useProjectStore((state) => state.documents);
  const openDocument = useEditorStore((state) => state.openDocument);
  
  const isStyleGuideDoc = (doc) => (
    doc.type === 'theme' &&
    doc.title.toLowerCase().includes('style guide')
  );
  
  const entities = useMemo(() => {
    return {
      character: documents.filter((d) => d.type === 'character'),
      location: documents.filter((d) => d.type === 'location'),
      scene: documents.filter((d) => d.type === 'scene'),
      theme: documents.filter((d) => d.type === 'theme' && !isStyleGuideDoc(d)),
      narrative_spine: documents.filter((d) => d.type === 'narrative_spine'),
    };
  }, [documents]);
  
  const handleInsertLink = (name) => {
    const editor = editorRef?.current;
    if (editor?.insertAtCursor) {
      editor.insertAtCursor(`[[${name}]]`);
    }
  };
  
  const handleCreate = (type) => {
    if (onRequestCreate) {
      onRequestCreate(type);
    }
  };
  
  return (
    <div className="h-full flex flex-col" data-testid="bible-panel">
      <Tabs defaultValue="character" className="flex-1 flex flex-col">
        <TabsList className="w-full justify-start rounded-none border-b bg-transparent px-4">
          {entityTypes.map(({ type, label, icon: Icon }) => (
            <TabsTrigger 
              key={type} 
              value={type}
              className="text-xs data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"
              data-testid={`bible-tab-${type}`}
            >
              <Icon className="h-3 w-3 mr-1" />
              {label}
            </TabsTrigger>
          ))}
        </TabsList>
        
        {entityTypes.map(({ type, label, createLabel, singleton }) => (
          <TabsContent key={type} value={type} className="flex-1 mt-0 p-0">
            <ScrollArea className="h-full">
              <div className="p-4 space-y-1">
                {entities[type].length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No {label.toLowerCase()} yet
                  </p>
                ) : (
                  entities[type].map((doc) => (
                    <div
                      key={doc.id}
                      className="group flex items-center justify-between p-2 rounded-md hover:bg-muted/50 transition-colors"
                    >
                      <button
                        onClick={() => openDocument(doc.id)}
                        className="flex-1 text-left text-sm truncate hover:text-primary transition-colors"
                        data-testid={`bible-item-${doc.id}`}
                      >
                        {doc.title}
                      </button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleInsertLink(doc.title)}
                        data-testid={`insert-link-${doc.id}`}
                      >
                        Insert [[
                      </Button>
                    </div>
                  ))
                )}
                
                {singleton && entities[type].length > 0 ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-muted-foreground mt-2"
                    onClick={() => openDocument(entities[type][0].id)}
                    data-testid={`open-${type}-btn`}
                  >
                    Open {createLabel}
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-muted-foreground mt-2"
                    onClick={() => handleCreate(type)}
                    data-testid={`create-${type}-btn`}
                  >
                    <Plus className="h-3 w-3 mr-2" />
                    Add {createLabel}
                  </Button>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

export default BiblePanel;
