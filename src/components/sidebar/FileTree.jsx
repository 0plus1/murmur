/**
 * File Tree Sidebar Component with drag-drop reordering
 */
import { useState, useMemo } from 'react';
import { 
  ChevronRight, 
  ChevronDown, 
  FileText, 
  Users, 
  MapPin, 
  Sparkles,
  Plus,
  MoreHorizontal,
  Pencil,
  Copy,
  Trash2,
  BookOpen
} from 'lucide-react';
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors 
} from '@dnd-kit/core';
import { 
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates, 
  useSortable, 
  verticalListSortingStrategy 
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { splitFrontmatter } from '@/lib/markdown/frontmatter';
import { useProjectStore, useEditorStore } from '@/stores';

const typeIcons = {
  chapter: BookOpen,
  scene: FileText,
  character: Users,
  location: MapPin,
  theme: Sparkles,
  narrative_spine: FileText,
  style_guide: FileText,
  story_compass: FileText,
  emotional_arc: FileText,
  note: FileText,
};

const statusColors = {
  draft: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  revised: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  final: 'bg-green-500/20 text-green-400 border-green-500/30',
};

function getChapterSections(markdown = '') {
  const { frontmatterRaw, content } = splitFrontmatter(markdown || '');
  const baseOffset = frontmatterRaw.length;
  const rawLines = content.split('\n');
  const sections = [];
  let offset = baseOffset;
  let currentLines = [];

  const pushSection = () => {
    const previewSource = currentLines.map((line) => line.text).join(' ');
    const text = previewSource.replace(/\s+/g, ' ').trim();
    if (!text) {
      currentLines = [];
      return;
    }

    const firstContentLine = currentLines.find((line) => line.text.trim().length > 0) ?? currentLines[0];
    const column = Math.max(0, firstContentLine.text.search(/\S/));

    sections.push({
      text,
      startOffset: firstContentLine.startOffset + (column === -1 ? 0 : column),
    });
    currentLines = [];
  };

  rawLines.forEach((rawLine, index) => {
    const text = rawLine.replace(/\r$/, '');
    const hasNewline = index < rawLines.length - 1;
    const lineLength = rawLine.length + (hasNewline ? 1 : 0);
    const lineStartOffset = offset;

    if (text.trim() === '***') {
      pushSection();
      offset += lineLength;
      return;
    }

    currentLines.push({
      text,
      startOffset: lineStartOffset,
    });
    offset += lineLength;
  });

  pushSection();
  return sections;
}

function getSectionPreview(text, maxLength = 50) {
  if (!text) return 'Untitled';
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
}

function isLegacyStyleGuideDoc(doc) {
  return doc?.type === 'theme' && doc?.title?.toLowerCase().includes('style guide');
}

function SortableItem({
  doc,
  isActive,
  onSelect,
  onRename,
  onDuplicate,
  onDelete,
  onStatusChange,
  sectionTreeOpen = false,
  onToggleSectionTree,
  onSelectSection,
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: doc.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  
  const Icon = isLegacyStyleGuideDoc(doc) ? FileText : (typeIcons[doc.type] || FileText);
  const chapterSections = useMemo(() => {
    if (!sectionTreeOpen || doc.type !== 'chapter') return [];
    return getChapterSections(doc.markdown || '');
  }, [sectionTreeOpen, doc.type, doc.markdown]);
  
  return (
    <div
      ref={setNodeRef}
      style={style}
      className="space-y-1"
    >
      <div
        className={cn(
          'group flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors',
          'hover:bg-muted/50',
          isActive && 'bg-primary/10 text-primary'
        )}
        onClick={() => onSelect(doc.id)}
        data-testid={`tree-item-${doc.id}`}
      >
        <span {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
          <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
        </span>
        <span className="flex-1 truncate text-sm">{doc.title}</span>
        {doc.status && (
          <Badge 
            variant="outline" 
            className={cn('text-[10px] px-1.5 py-0', statusColors[doc.status])}
          >
            {doc.status}
          </Badge>
        )}
        {doc.type === 'chapter' && (
          <Button
            variant={sectionTreeOpen ? 'secondary' : 'ghost'}
            size="sm"
            className="h-6 px-1.5 font-mono text-[10px] tracking-tight"
            onClick={(e) => {
              e.stopPropagation();
              onToggleSectionTree?.(doc.id);
            }}
            data-testid={`toggle-sections-${doc.id}`}
            aria-label={sectionTreeOpen ? 'Hide chapter sections' : 'Show chapter sections'}
          >
            ***
          </Button>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6 opacity-0 group-hover:opacity-100"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onClick={() => onRename(doc)}>
              <Pencil className="h-3 w-3 mr-2" />
              Rename
            </DropdownMenuItem>
            {!['narrative_spine', 'style_guide', 'story_compass', 'emotional_arc'].includes(doc.type) && !isLegacyStyleGuideDoc(doc) && (
              <DropdownMenuItem onClick={() => onDuplicate(doc.id)}>
                <Copy className="h-3 w-3 mr-2" />
                Duplicate
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            {['chapter', 'scene'].includes(doc.type) && (
              <>
                <DropdownMenuItem onClick={() => onStatusChange(doc.id, 'draft')}>
                  Set Draft
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onStatusChange(doc.id, 'revised')}>
                  Set Revised
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onStatusChange(doc.id, 'final')}>
                  Set Final
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem 
              className="text-destructive focus:text-destructive"
              onClick={() => onDelete(doc.id)}
            >
              <Trash2 className="h-3 w-3 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {sectionTreeOpen && chapterSections.length > 0 && (
        <div className="ml-6 space-y-0.5 pb-1" data-testid={`tree-item-sections-${doc.id}`}>
          {chapterSections.map((section, index) => (
            <button
              key={`${doc.id}-section-${index}`}
              type="button"
              className="w-full text-left px-2 py-1 text-xs text-muted-foreground border-l border-border/60 hover:bg-muted/40 hover:text-foreground transition-colors rounded-r-sm"
              data-testid={`tree-item-section-${doc.id}-${index}`}
              onClick={(e) => {
                e.stopPropagation();
                onSelectSection?.(doc.id, section.startOffset);
              }}
            >
              <span className="font-mono text-[10px] mr-2 opacity-80">***</span>
              <span className="align-middle">{getSectionPreview(section.text)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function TreeSection({
  title,
  type,
  items,
  isOpen,
  onToggle,
  onAdd,
  allowAdd = true,
  onSelect,
  currentDocId,
  onRename,
  onDuplicate,
  onDelete,
  onStatusChange,
  onReorder,
  expandedChapterSectionIds,
  onToggleChapterSections,
  onSelectChapterSection,
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );
  
  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = items.findIndex((i) => i.id === active.id);
      const newIndex = items.findIndex((i) => i.id === over.id);
      const newOrder = arrayMove(items, oldIndex, newIndex);
      onReorder(type, newOrder.map((d) => d.id));
    }
  };
  
  return (
    <Collapsible open={isOpen} onOpenChange={onToggle}>
      <div className="flex items-center justify-between px-2 py-1">
        <CollapsibleTrigger asChild>
          <button 
            className="flex items-center gap-1 text-xs font-medium text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors"
            data-testid={`tree-section-${type}`}
          >
            {isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            {title}
            <span className="text-muted-foreground/50 ml-1">({items.length})</span>
          </button>
        </CollapsibleTrigger>
        {allowAdd && (
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-5 w-5"
            onClick={() => onAdd(type)}
            data-testid={`add-${type}-btn`}
          >
            <Plus className="h-3 w-3" />
          </Button>
        )}
      </div>
      <CollapsibleContent>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={items.map((d) => d.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-0.5 pl-2">
              {items.map((doc) => (
                <SortableItem
                  key={doc.id}
                  doc={doc}
                  isActive={doc.id === currentDocId}
                  onSelect={onSelect}
                  onRename={onRename}
                  onDuplicate={onDuplicate}
                  onDelete={onDelete}
                  onStatusChange={onStatusChange}
                  sectionTreeOpen={Boolean(expandedChapterSectionIds?.[doc.id])}
                  onToggleSectionTree={onToggleChapterSections}
                  onSelectSection={onSelectChapterSection}
                />
              ))}
              {items.length === 0 && (
                <p className="text-xs text-muted-foreground py-2 px-2">
                  No {title.toLowerCase()} yet
                </p>
              )}
            </div>
          </SortableContext>
        </DndContext>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function FileTree({ onCreateDocument, onRenameDocument, onSelectSection }) {
  const documents = useProjectStore((state) => state.documents);
  const currentDocument = useEditorStore((state) => state.currentDocument);
  const openDocument = useEditorStore((state) => state.openDocument);
  const duplicateDocument = useEditorStore((state) => state.duplicateDocument);
  const removeDocument = useEditorStore((state) => state.removeDocument);
  const updateStatus = useEditorStore((state) => state.updateStatus);
  const reorderDocs = useEditorStore((state) => state.reorderDocs);
  
  const [openSections, setOpenSections] = useState({
    manuscript: true,
    characters: true,
    locations: true,
    themes: true,
    narrativeSpine: true,
    styleGuide: true,
    storyCompass: true,
    emotionalArc: true,
    notes: false,
  });
  const [expandedChapterSectionIds, setExpandedChapterSectionIds] = useState({});
  
  const manuscriptDocs = useMemo(() => 
    documents.filter((d) => ['chapter', 'scene'].includes(d.type)).sort((a, b) => a.order - b.order),
    [documents]
  );
  
  const characterDocs = useMemo(() => 
    documents.filter((d) => d.type === 'character').sort((a, b) => a.order - b.order),
    [documents]
  );
  
  const locationDocs = useMemo(() => 
    documents.filter((d) => d.type === 'location').sort((a, b) => a.order - b.order),
    [documents]
  );
  
  const themeDocs = useMemo(() => 
    documents.filter((d) => d.type === 'theme' && !isLegacyStyleGuideDoc(d)).sort((a, b) => a.order - b.order),
    [documents]
  );

  const narrativeSpineDocs = useMemo(() =>
    documents.filter((d) => d.type === 'narrative_spine').sort((a, b) => a.order - b.order),
    [documents]
  );

  const styleGuideDocs = useMemo(() =>
    documents.filter((d) => d.type === 'style_guide' || isLegacyStyleGuideDoc(d)).sort((a, b) => a.order - b.order),
    [documents]
  );

  const storyCompassDocs = useMemo(() =>
    documents.filter((d) => d.type === 'story_compass').sort((a, b) => a.order - b.order),
    [documents]
  );

  const emotionalArcDocs = useMemo(() =>
    documents.filter((d) => d.type === 'emotional_arc').sort((a, b) => a.order - b.order),
    [documents]
  );
  
  const noteDocs = useMemo(() => 
    documents.filter((d) => d.type === 'note').sort((a, b) => a.order - b.order),
    [documents]
  );
  
  const toggleSection = (section) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };
  
  const handleAdd = (type) => {
    onCreateDocument(type);
  };
  
  const handleReorder = (type, orderedIds) => {
    reorderDocs(type, orderedIds);
  };

  const handleToggleChapterSections = (docId) => {
    setExpandedChapterSectionIds((prev) => ({
      ...prev,
      [docId]: !prev[docId],
    }));
  };
  
  return (
    <ScrollArea className="h-full" data-testid="file-tree">
      <div className="p-2 space-y-4">
        <TreeSection
          title="Manuscript"
          type="chapter"
          items={manuscriptDocs}
          isOpen={openSections.manuscript}
          onToggle={() => toggleSection('manuscript')}
          onAdd={handleAdd}
          onSelect={openDocument}
          currentDocId={currentDocument?.id}
          onRename={onRenameDocument}
          onDuplicate={duplicateDocument}
          onDelete={removeDocument}
          onStatusChange={updateStatus}
          onReorder={handleReorder}
          expandedChapterSectionIds={expandedChapterSectionIds}
          onToggleChapterSections={handleToggleChapterSections}
          onSelectChapterSection={onSelectSection}
        />
        
        <div className="border-t border-border/50 pt-2">
          <p className="text-[10px] font-medium text-muted-foreground/70 uppercase tracking-wider px-2 mb-2">
            Bible
          </p>
          
          <TreeSection
            title="Characters"
            type="character"
            items={characterDocs}
            isOpen={openSections.characters}
            onToggle={() => toggleSection('characters')}
            onAdd={handleAdd}
            onSelect={openDocument}
            currentDocId={currentDocument?.id}
            onRename={onRenameDocument}
            onDuplicate={duplicateDocument}
            onDelete={removeDocument}
            onStatusChange={updateStatus}
            onReorder={handleReorder}
          />
          
          <TreeSection
            title="Locations"
            type="location"
            items={locationDocs}
            isOpen={openSections.locations}
            onToggle={() => toggleSection('locations')}
            onAdd={handleAdd}
            onSelect={openDocument}
            currentDocId={currentDocument?.id}
            onRename={onRenameDocument}
            onDuplicate={duplicateDocument}
            onDelete={removeDocument}
            onStatusChange={updateStatus}
            onReorder={handleReorder}
          />
          
          <TreeSection
            title="Themes"
            type="theme"
            items={themeDocs}
            isOpen={openSections.themes}
            onToggle={() => toggleSection('themes')}
            onAdd={handleAdd}
            onSelect={openDocument}
            currentDocId={currentDocument?.id}
            onRename={onRenameDocument}
            onDuplicate={duplicateDocument}
            onDelete={removeDocument}
            onStatusChange={updateStatus}
            onReorder={handleReorder}
          />

          {narrativeSpineDocs.length > 0 && (
            <TreeSection
              title="Narrative Spine"
              type="narrative_spine"
              items={narrativeSpineDocs}
              isOpen={openSections.narrativeSpine}
              onToggle={() => toggleSection('narrativeSpine')}
              onAdd={handleAdd}
              allowAdd={false}
              onSelect={openDocument}
              currentDocId={currentDocument?.id}
              onRename={onRenameDocument}
              onDuplicate={duplicateDocument}
              onDelete={removeDocument}
              onStatusChange={updateStatus}
              onReorder={handleReorder}
            />
          )}

          {styleGuideDocs.length > 0 && (
            <TreeSection
              title="Style Guide"
              type="style_guide"
              items={styleGuideDocs}
              isOpen={openSections.styleGuide}
              onToggle={() => toggleSection('styleGuide')}
              onAdd={handleAdd}
              allowAdd={false}
              onSelect={openDocument}
              currentDocId={currentDocument?.id}
              onRename={onRenameDocument}
              onDuplicate={duplicateDocument}
              onDelete={removeDocument}
              onStatusChange={updateStatus}
              onReorder={handleReorder}
            />
          )}

          {storyCompassDocs.length > 0 && (
            <TreeSection
              title="Story Compass"
              type="story_compass"
              items={storyCompassDocs}
              isOpen={openSections.storyCompass}
              onToggle={() => toggleSection('storyCompass')}
              onAdd={handleAdd}
              allowAdd={false}
              onSelect={openDocument}
              currentDocId={currentDocument?.id}
              onRename={onRenameDocument}
              onDuplicate={duplicateDocument}
              onDelete={removeDocument}
              onStatusChange={updateStatus}
              onReorder={handleReorder}
            />
          )}

          {emotionalArcDocs.length > 0 && (
            <TreeSection
              title="Emotional Arc"
              type="emotional_arc"
              items={emotionalArcDocs}
              isOpen={openSections.emotionalArc}
              onToggle={() => toggleSection('emotionalArc')}
              onAdd={handleAdd}
              allowAdd={false}
              onSelect={openDocument}
              currentDocId={currentDocument?.id}
              onRename={onRenameDocument}
              onDuplicate={duplicateDocument}
              onDelete={removeDocument}
              onStatusChange={updateStatus}
              onReorder={handleReorder}
            />
          )}
        </div>
        
        <div className="border-t border-border/50 pt-2">
          <TreeSection
            title="Notes"
            type="note"
            items={noteDocs}
            isOpen={openSections.notes}
            onToggle={() => toggleSection('notes')}
            onAdd={handleAdd}
            onSelect={openDocument}
            currentDocId={currentDocument?.id}
            onRename={onRenameDocument}
            onDuplicate={duplicateDocument}
            onDelete={removeDocument}
            onStatusChange={updateStatus}
            onReorder={handleReorder}
          />
        </div>
      </div>
    </ScrollArea>
  );
}

export default FileTree;
