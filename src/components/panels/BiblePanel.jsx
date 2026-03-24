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
  { type: 'narrative_spine', label: 'Narrative Spine', icon: FileText, createLabel: 'narrative spine', singleton: true, defaultTitle: 'Narrative Spine' },
  { type: 'style_guide', label: 'Style Guide', icon: FileText, createLabel: 'style guide', singleton: true, defaultTitle: 'Style Guide' },
  { type: 'story_compass', label: 'Story Compass', icon: FileText, createLabel: 'story compass', singleton: true, defaultTitle: 'Story Compass' },
  { type: 'emotional_arc', label: 'Emotional Arc', icon: FileText, createLabel: 'emotional arc', singleton: true, defaultTitle: 'Emotional Arc' },
];

export function BiblePanel({ editorRef, onRequestCreate }) {
  const documents = useProjectStore((state) => state.documents);
  const openDocument = useEditorStore((state) => state.openDocument);
  const createDocument = useEditorStore((state) => state.createDocument);
  const isLegacyStyleGuideDoc = (doc) => doc.type === 'theme' && doc.title.toLowerCase().includes('style guide');
  
  const entities = useMemo(() => {
    return {
      character: documents.filter((d) => d.type === 'character'),
      location: documents.filter((d) => d.type === 'location'),
      scene: documents.filter((d) => d.type === 'scene'),
      theme: documents.filter((d) => d.type === 'theme' && !isLegacyStyleGuideDoc(d)),
      narrative_spine: documents.filter((d) => d.type === 'narrative_spine'),
      style_guide: documents.filter((d) => d.type === 'style_guide' || isLegacyStyleGuideDoc(d)),
      story_compass: documents.filter((d) => d.type === 'story_compass'),
      emotional_arc: documents.filter((d) => d.type === 'emotional_arc'),
    };
  }, [documents]);
  
  const handleInsertLink = (name) => {
    const editor = editorRef?.current;
    if (editor?.insertAtCursor) {
      editor.insertAtCursor(`[[${name}]]`);
    }
  };
  
  const handleCreate = async (type, defaultTitle, singleton) => {
    if (singleton) {
      await createDocument(type, defaultTitle);
      return;
    }
    if (onRequestCreate) {
      onRequestCreate(type);
    }
  };
  
  return (
    <div className="h-full flex flex-col" data-testid="bible-panel">
      <Tabs defaultValue="character" className="flex-1 flex flex-col">
        <TabsList className="h-auto w-full flex-wrap justify-start rounded-none border-b bg-transparent px-4 py-2">
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
        
        {entityTypes.map(({ type, label, createLabel, singleton, defaultTitle }) => (
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
                    onClick={() => handleCreate(type, defaultTitle, singleton)}
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
