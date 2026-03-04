/**
 * Command Palette - Quick search and navigation (Cmd+K)
 */
import { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Search, 
  FileText, 
  BookOpen, 
  Users, 
  MapPin, 
  Sparkles,
  Plus,
  Settings,
  Download,
  FolderSync,
  RefreshCw
} from 'lucide-react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { useProjectStore, useEditorStore, useUIStore } from '@/stores';
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

export function CommandPalette({ onCreateDocument, onExport, onSettings }) {
  const open = useUIStore((state) => state.commandPaletteOpen);
  const closeCommandPalette = useUIStore((state) => state.closeCommandPalette);
  const openPromptStudio = useUIStore((state) => state.openPromptStudio);
  
  const documents = useProjectStore((state) => state.documents);
  const reindexCurrentProject = useProjectStore((state) => state.reindexCurrentProject);
  const openDocument = useEditorStore((state) => state.openDocument);
  const search = useEditorStore((state) => state.search);
  const searchResults = useEditorStore((state) => state.searchResults);
  const searchQuery = useEditorStore((state) => state.searchQuery);
  const clearSearch = useEditorStore((state) => state.clearSearch);
  
  const [inputValue, setInputValue] = useState('');
  
  // Keyboard shortcut
  useEffect(() => {
    const down = (e) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        useUIStore.getState().toggleCommandPalette();
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);
  
  // Clear search when closing
  useEffect(() => {
    if (!open) {
      setInputValue('');
      clearSearch();
    }
  }, [open, clearSearch]);
  
  // Search as user types
  const handleSearch = useCallback((value) => {
    setInputValue(value);
    if (value.length >= 2) {
      search(value);
    } else {
      clearSearch();
    }
  }, [search, clearSearch]);
  
  // Group documents by type
  const groupedDocs = useMemo(() => {
    const groups = {
      manuscript: [],
      characters: [],
      locations: [],
      themes: [],
      narrativeSpine: [],
      notes: [],
    };
    
    const docsToShow = searchQuery.length >= 2 ? searchResults : documents;
    
    for (const doc of docsToShow) {
      if (['chapter', 'scene'].includes(doc.type)) {
        groups.manuscript.push(doc);
      } else if (doc.type === 'character') {
        groups.characters.push(doc);
      } else if (doc.type === 'location') {
        groups.locations.push(doc);
      } else if (doc.type === 'theme') {
        groups.themes.push(doc);
      } else if (doc.type === 'narrative_spine') {
        groups.narrativeSpine.push(doc);
      } else if (doc.type === 'note') {
        groups.notes.push(doc);
      }
    }
    
    return groups;
  }, [documents, searchResults, searchQuery]);
  
  const handleSelect = (docId) => {
    openDocument(docId);
    closeCommandPalette();
  };
  
  const handleAction = (action) => {
    closeCommandPalette();
    action();
  };
  
  return (
    <CommandDialog open={open} onOpenChange={closeCommandPalette}>
      <CommandInput 
        placeholder="Search documents or type a command..." 
        value={inputValue}
        onValueChange={handleSearch}
        data-testid="command-input"
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        
        {/* Quick Actions */}
        <CommandGroup heading="Actions">
          <CommandItem onSelect={() => handleAction(() => onCreateDocument('chapter'))}>
            <Plus className="h-4 w-4 mr-2" />
            New Chapter
          </CommandItem>
          <CommandItem onSelect={() => handleAction(() => onCreateDocument('scene'))}>
            <Plus className="h-4 w-4 mr-2" />
            New Scene
          </CommandItem>
          <CommandItem onSelect={() => handleAction(() => onCreateDocument('character'))}>
            <Plus className="h-4 w-4 mr-2" />
            New Character
          </CommandItem>
          <CommandItem onSelect={() => handleAction(() => onCreateDocument('narrative_spine'))}>
            <Plus className="h-4 w-4 mr-2" />
            New Narrative Spine
          </CommandItem>
          <CommandItem onSelect={() => handleAction(openPromptStudio)}>
            <Sparkles className="h-4 w-4 mr-2" />
            Open Prompt Studio
          </CommandItem>
          <CommandItem onSelect={() => handleAction(onExport)}>
            <Download className="h-4 w-4 mr-2" />
            Export Project
          </CommandItem>
          <CommandItem onSelect={() => handleAction(reindexCurrentProject)}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Reindex Project
          </CommandItem>
          <CommandItem onSelect={() => handleAction(onSettings)}>
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </CommandItem>
        </CommandGroup>
        
        <CommandSeparator />
        
        {/* Documents */}
        {groupedDocs.manuscript.length > 0 && (
          <CommandGroup heading="Manuscript">
            {groupedDocs.manuscript.map((doc) => {
              const Icon = typeIcons[doc.type];
              return (
                <CommandItem
                  key={doc.id}
                  onSelect={() => handleSelect(doc.id)}
                  data-testid={`cmd-doc-${doc.id}`}
                >
                  <Icon className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="truncate">{doc.title}</span>
                  {doc.status && (
                    <span className="ml-auto text-xs text-muted-foreground">{doc.status}</span>
                  )}
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}
        
        {groupedDocs.characters.length > 0 && (
          <CommandGroup heading="Characters">
            {groupedDocs.characters.map((doc) => (
              <CommandItem
                key={doc.id}
                onSelect={() => handleSelect(doc.id)}
                data-testid={`cmd-doc-${doc.id}`}
              >
                <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="truncate">{doc.title}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        
        {groupedDocs.locations.length > 0 && (
          <CommandGroup heading="Locations">
            {groupedDocs.locations.map((doc) => (
              <CommandItem
                key={doc.id}
                onSelect={() => handleSelect(doc.id)}
                data-testid={`cmd-doc-${doc.id}`}
              >
                <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="truncate">{doc.title}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        
        {groupedDocs.themes.length > 0 && (
          <CommandGroup heading="Themes">
            {groupedDocs.themes.map((doc) => (
              <CommandItem
                key={doc.id}
                onSelect={() => handleSelect(doc.id)}
                data-testid={`cmd-doc-${doc.id}`}
              >
                <Sparkles className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="truncate">{doc.title}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {groupedDocs.narrativeSpine.length > 0 && (
          <CommandGroup heading="Narrative Spine">
            {groupedDocs.narrativeSpine.map((doc) => (
              <CommandItem
                key={doc.id}
                onSelect={() => handleSelect(doc.id)}
                data-testid={`cmd-doc-${doc.id}`}
              >
                <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="truncate">{doc.title}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        
        {groupedDocs.notes.length > 0 && (
          <CommandGroup heading="Notes">
            {groupedDocs.notes.map((doc) => (
              <CommandItem
                key={doc.id}
                onSelect={() => handleSelect(doc.id)}
                data-testid={`cmd-doc-${doc.id}`}
              >
                <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="truncate">{doc.title}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}

export default CommandPalette;
