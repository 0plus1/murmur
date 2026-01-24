/**
 * murmur - Local-first writing studio
 * Main Application Component
 */
import { useEffect, useRef, useState, useCallback } from 'react';
import { 
  PanelLeftClose, 
  PanelRightClose,
  Save, 
  Download, 
  Settings, 
  Plus,
  Search,
  BookOpen,
  Wand2,
  ChevronDown,
  FileText,
  Trash2,
  Eye,
  Highlighter,
  Code,
  Link2
} from 'lucide-react';
import { Toaster, toast } from 'sonner';

// UI Components
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';

// Feature Components
import { MarkdownEditor } from '@/components/editor/MarkdownEditor';
import { FileTree } from '@/components/sidebar/FileTree';
import { BacklinksPanel } from '@/components/panels/BacklinksPanel';
import { BiblePanel } from '@/components/panels/BiblePanel';
import { PromptStudio } from '@/components/panels/PromptStudio';
import { StyleGuidePanel } from '@/components/panels/StyleGuidePanel';
import { CommandPalette } from '@/components/dialogs/CommandPalette';
import { ExportModal } from '@/components/dialogs/ExportModal';
import { SettingsDialog } from '@/components/dialogs/SettingsDialog';
import { RenameDocumentDialog } from '@/components/dialogs/RenameDocumentDialog';
import { CreateDocumentDialog } from '@/components/dialogs/CreateDocumentDialog';
import { DeleteProjectDialog } from '@/components/dialogs/DeleteProjectDialog';
import { CreateProjectDialog } from '@/components/dialogs/CreateProjectDialog';
import { QuickCreateDialog } from '@/components/dialogs/QuickCreateDialog';

// Stores
import { useProjectStore, useEditorStore, useUIStore } from '@/stores';

// Utils
import { countWords } from '@/lib/markdown';
import { cn } from '@/lib/utils';
import { useAutosave } from '@/hooks/useAutosave';
import { getSetting, setSetting } from '@/lib/db';

// Status colors
const statusColors = {
  draft: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  revised: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  final: 'bg-green-500/20 text-green-400 border-green-500/30',
};
const statusOptions = ['draft', 'revised', 'final'];

function App() {
  const editorRef = useRef(null);
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);
  const [quickCreateType, setQuickCreateType] = useState('chapter');
  const [fullCreateDialogOpen, setFullCreateDialogOpen] = useState(false);
  const [fullCreateType, setFullCreateType] = useState('chapter');
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [renameDoc, setRenameDoc] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [createProjectDialogOpen, setCreateProjectDialogOpen] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [lastSaved, setLastSaved] = useState(null);
  const [highlightEntities, setHighlightEntities] = useState(true);
  const [distractionFree, setDistractionFree] = useState(false);
  const [showFrontmatter, setShowFrontmatter] = useState(false);
  const settingsLoadedRef = useRef(false);
  
  // Stores
  const theme = useUIStore((state) => state.theme);
  const sidebarCollapsed = useUIStore((state) => state.sidebarCollapsed);
  const toggleSidebar = useUIStore((state) => state.toggleSidebar);
  const rightPanelCollapsed = useUIStore((state) => state.rightPanelCollapsed);
  const toggleRightPanel = useUIStore((state) => state.toggleRightPanel);
  const setSidebarCollapsed = useUIStore((state) => state.setSidebarCollapsed);
  const setRightPanelCollapsed = useUIStore((state) => state.setRightPanelCollapsed);
  const rightPanelTab = useUIStore((state) => state.rightPanelTab);
  const setRightPanelTab = useUIStore((state) => state.setRightPanelTab);
  const openCommandPalette = useUIStore((state) => state.openCommandPalette);
  const openExportModal = useUIStore((state) => state.openExportModal);
  const openSettings = useUIStore((state) => state.openSettings);
  
  const currentProject = useProjectStore((state) => state.currentProject);
  const projects = useProjectStore((state) => state.projects);
  const initialize = useProjectStore((state) => state.initialize);
  const openProject = useProjectStore((state) => state.openProject);
  const createNewProject = useProjectStore((state) => state.createNewProject);
  const removeProject = useProjectStore((state) => state.removeProject);
  const recreateSampleProject = useProjectStore((state) => state.recreateSampleProject);
  const loading = useProjectStore((state) => state.loading);
  const initialized = useProjectStore((state) => state.initialized);
  
  const currentDocument = useEditorStore((state) => state.currentDocument);
  const updateContent = useEditorStore((state) => state.updateContent);
  const saveDocument = useEditorStore((state) => state.saveDocument);
  const createDocument = useEditorStore((state) => state.createDocument);
  const updateTitle = useEditorStore((state) => state.updateTitle);
  const updateStatus = useEditorStore((state) => state.updateStatus);
  const isDirty = useEditorStore((state) => state.isDirty);
  const openDocument = useEditorStore((state) => state.openDocument);

  useEffect(() => {
    const projectId = currentProject?.id;
    if (!projectId) return;
    let active = true;

    const loadSettings = async () => {
      const [
        storedSidebarCollapsed,
        storedRightPanelCollapsed,
        storedHighlightEntities,
        storedDistractionFree,
        storedShowFrontmatter,
      ] = await Promise.all([
        getSetting(projectId, 'ui.sidebarCollapsed'),
        getSetting(projectId, 'ui.rightPanelCollapsed'),
        getSetting(projectId, 'ui.highlightEntities'),
        getSetting(projectId, 'ui.distractionFree'),
        getSetting(projectId, 'ui.showFrontmatter'),
      ]);

      if (!active) return;

      if (typeof storedSidebarCollapsed === 'boolean') {
        setSidebarCollapsed(storedSidebarCollapsed);
      }
      if (typeof storedRightPanelCollapsed === 'boolean') {
        setRightPanelCollapsed(storedRightPanelCollapsed);
      }
      if (typeof storedHighlightEntities === 'boolean') {
        setHighlightEntities(storedHighlightEntities);
      }
      if (typeof storedDistractionFree === 'boolean') {
        setDistractionFree(storedDistractionFree);
      }
      if (typeof storedShowFrontmatter === 'boolean') {
        setShowFrontmatter(storedShowFrontmatter);
      }

      settingsLoadedRef.current = true;
    };

    loadSettings();

    return () => {
      active = false;
    };
  }, [currentProject?.id, setRightPanelCollapsed, setSidebarCollapsed]);

  useEffect(() => {
    const projectId = currentProject?.id;
    if (!projectId || !settingsLoadedRef.current) return;

    const saveSettings = async () => {
      await Promise.all([
        setSetting(projectId, 'ui.sidebarCollapsed', sidebarCollapsed),
        setSetting(projectId, 'ui.rightPanelCollapsed', rightPanelCollapsed),
        setSetting(projectId, 'ui.highlightEntities', highlightEntities),
        setSetting(projectId, 'ui.distractionFree', distractionFree),
        setSetting(projectId, 'ui.showFrontmatter', showFrontmatter),
      ]);
    };

    saveSettings();
  }, [
    currentProject?.id,
    sidebarCollapsed,
    rightPanelCollapsed,
    highlightEntities,
    distractionFree,
    showFrontmatter,
  ]);
  
  // Initialize app
  useEffect(() => {
    initialize();
  }, [initialize]);
  
  // Apply theme
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Cmd/Ctrl+S - Save
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        saveDocument();
        toast.success('Saved');
      }
      // Cmd/Ctrl+P - Prompt Studio
      if ((e.metaKey || e.ctrlKey) && e.key === 'p') {
        e.preventDefault();
        setRightPanelTab('prompt');
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [saveDocument, setRightPanelTab]);
  
  // Save handler with timestamp
  const handleSave = useCallback(async () => {
    await saveDocument();
    setLastSaved(new Date());
  }, [saveDocument]);
  
  const { handleContentChange } = useAutosave({
    onUpdateContent: updateContent,
    onSave: saveDocument,
    countWords,
    onWordCount: setWordCount,
    onLastSaved: setLastSaved,
  });
  
  // Update word count when document changes
  useEffect(() => {
    if (currentDocument) {
      setWordCount(countWords(currentDocument.markdown));
      setLastSaved(null); // Reset last saved when switching docs
    } else {
      setWordCount(0);
    }
  }, [currentDocument?.id]);
  
  // Cleanup handled by useAutosave
  
  // Handle entity click from editor
  const handleEntityClick = useCallback((docId) => {
    openDocument(docId);
  }, [openDocument]);
  
  // Handlers
  const handleCreateDocument = (type) => {
    setQuickCreateType(type);
    setQuickCreateOpen(true);
  };
  
  const handleOpenFullCreateDialog = (type = 'chapter') => {
    setFullCreateType(type);
    setFullCreateDialogOpen(true);
  };
  
  const handleRenameDocument = (doc) => {
    setRenameDoc(doc);
    setRenameDialogOpen(true);
  };
  
  const handleNewProject = () => {
    setCreateProjectDialogOpen(true);
  };
  
  const handleCreateProject = async (name) => {
    await createNewProject(name);
    toast.success('Project created');
  };
  
  const handleCreateSampleProject = async () => {
    try {
      await recreateSampleProject();
      toast.success('Sample project created');
    } catch (e) {
      toast.error(`Failed to create sample: ${e.message}`);
    }
  };
  
  const handleDeleteProject = async (projectId) => {
    try {
      await removeProject(projectId);
      toast.success('Project deleted');
    } catch (e) {
      toast.error(`Failed to delete: ${e.message}`);
    }
  };
  
  // Loading state
  if (!initialized) {
    return (
      <div className={`h-screen flex items-center justify-center ${theme === 'dark' ? 'dark bg-slate-900 text-white' : 'bg-slate-50 text-slate-900'}`} data-testid="loading-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight mb-2">murmur</h1>
          <p className="opacity-60 animate-pulse">Loading...</p>
        </div>
      </div>
    );
  }
  
  return (
    <TooltipProvider>
      <div className="h-screen flex flex-col bg-background" data-testid="app-container">
        {/* Header */}
        <header className="h-12 border-b flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={toggleSidebar}
              data-testid="toggle-sidebar-btn"
            >
              <PanelLeftClose className={cn("h-4 w-4 transition-transform", sidebarCollapsed && "rotate-180")} />
            </Button>
            
            <Separator orientation="vertical" className="h-5" />
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2 font-semibold" data-testid="project-dropdown">
                  <BookOpen className="h-4 w-4" />
                  {currentProject?.name || 'No Project'}
                  <ChevronDown className="h-3 w-3 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                {projects.map((project) => (
                  <DropdownMenuItem 
                    key={project.id}
                    onClick={() => openProject(project.id)}
                    className={cn(currentProject?.id === project.id && "bg-accent")}
                  >
                    {project.name}
                  </DropdownMenuItem>
                ))}
                {projects.length === 0 && (
                  <DropdownMenuItem disabled className="text-muted-foreground">
                    No projects yet
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleNewProject}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Project
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleCreateSampleProject}>
                  <BookOpen className="h-4 w-4 mr-2" />
                  Create Sample Project
                </DropdownMenuItem>
                {currentProject && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => setDeleteDialogOpen(true)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Project
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8"
                  onClick={openCommandPalette}
                  data-testid="search-btn"
                >
                  <Search className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Search (⌘K)</TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8"
                  onClick={openExportModal}
                  data-testid="export-btn"
                >
                  <Download className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Export</TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8"
                  onClick={openSettings}
                  data-testid="settings-btn"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Settings</TooltipContent>
            </Tooltip>
          </div>
        </header>
        
        {/* Main Content */}
        <div className="flex-1 overflow-hidden">
          <ResizablePanelGroup direction="horizontal">
            {/* Left Sidebar */}
            {!sidebarCollapsed && (
              <>
                <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
                  <div className="h-full border-r flex flex-col">
                    <div className="p-2 border-b">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full justify-start gap-2"
                        onClick={handleOpenFullCreateDialog}
                        data-testid="new-doc-btn"
                      >
                        <Plus className="h-3 w-3" />
                        New Document
                      </Button>
                    </div>
                    <FileTree 
                      onCreateDocument={handleCreateDocument}
                      onRenameDocument={handleRenameDocument}
                    />
                  </div>
                </ResizablePanel>
                <ResizableHandle />
              </>
            )}
            
            {/* Editor */}
            <ResizablePanel defaultSize={55}>
              <div className="h-full flex flex-col">
                {currentDocument ? (
                  <>
                    {/* Document Header */}
                    <div className="px-4 py-2 border-b flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <h2 className="font-semibold truncate" data-testid="document-title">
                          {currentDocument.title}
                        </h2>
                        {!distractionFree && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-xs"
                                data-testid="status-trigger"
                              >
                                {currentDocument.status ? (
                                  <Badge
                                    variant="outline"
                                    className={cn('text-xs', statusColors[currentDocument.status])}
                                  >
                                    {currentDocument.status}
                                  </Badge>
                                ) : (
                                  <span className="text-muted-foreground">Set status</span>
                                )}
                                <ChevronDown className="h-3 w-3 ml-1 opacity-60" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-32">
                              {statusOptions.map((status) => (
                                <DropdownMenuItem
                                  key={status}
                                  onClick={() => updateStatus(currentDocument.id, status)}
                                  data-testid={`set-status-${status}`}
                                >
                                  Set {status.charAt(0).toUpperCase() + status.slice(1)}
                                </DropdownMenuItem>
                              ))}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => updateStatus(currentDocument.id, null)}
                                data-testid="clear-status"
                              >
                                Clear status
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span data-testid="word-count">{wordCount.toLocaleString()} words</span>
                        
                        {lastSaved && (
                          <span className="opacity-70">
                            Saved {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                        {isDirty && !lastSaved && (
                          <span className="opacity-70">Unsaved</span>
                        )}
                        
                        <Separator orientation="vertical" className="h-4" />
                        
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant={highlightEntities ? "secondary" : "ghost"}
                              size="icon" 
                              className="h-6 w-6"
                              onClick={() => setHighlightEntities(!highlightEntities)}
                              data-testid="highlight-toggle"
                            >
                              <Highlighter className="h-3 w-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            {highlightEntities ? 'Disable' : 'Enable'} character/location highlighting
                          </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant={showFrontmatter ? "secondary" : "ghost"}
                              size="icon" 
                              className="h-6 w-6"
                              onClick={() => setShowFrontmatter(!showFrontmatter)}
                              data-testid="frontmatter-toggle"
                            >
                              <Code className="h-3 w-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            {showFrontmatter ? 'Hide' : 'Show'} YAML frontmatter
                          </TooltipContent>
                        </Tooltip>
                        
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant={distractionFree ? "secondary" : "ghost"}
                              size="icon" 
                              className="h-6 w-6"
                              onClick={() => setDistractionFree(!distractionFree)}
                              data-testid="distraction-free-toggle"
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            {distractionFree ? 'Edit mode' : 'Distraction-free mode'}
                          </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant={rightPanelCollapsed ? "secondary" : "ghost"}
                              size="icon" 
                              className="h-6 w-6"
                              onClick={toggleRightPanel}
                              data-testid="right-panel-toggle"
                            >
                              <PanelRightClose className={cn("h-3 w-3 transition-transform", rightPanelCollapsed && "rotate-180")} />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            {rightPanelCollapsed ? 'Show' : 'Hide'} right panel
                          </TooltipContent>
                        </Tooltip>
                        
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-6 w-6"
                              onClick={() => {
                                handleSave();
                                toast.success('Saved');
                              }}
                              data-testid="save-btn"
                            >
                              <Save className="h-3 w-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Save (⌘S)</TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                    
                    {/* Editor */}
                    <div className="flex-1 overflow-hidden" ref={editorRef}>
                      <MarkdownEditor
                        value={currentDocument.markdown}
                        onChange={handleContentChange}
                        isDark={theme === 'dark'}
                        highlightEntities={highlightEntities}
                        distractionFree={distractionFree}
                        showFrontmatter={showFrontmatter}
                        onEntityClick={handleEntityClick}
                      />
                    </div>
                  </>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground" data-testid="no-document">
                    <div className="text-center">
                      <FileText className="h-12 w-12 mx-auto mb-4 opacity-30" />
                      <p className="text-lg font-medium mb-1">No document selected</p>
                      <p className="text-sm">Select a document from the sidebar or create a new one</p>
                    </div>
                  </div>
                )}
              </div>
            </ResizablePanel>
            
            {!rightPanelCollapsed && (
              <>
                <ResizableHandle />
                
                {/* Right Panel */}
                <ResizablePanel defaultSize={25} minSize={20} maxSize={35}>
                  <div className="h-full border-l flex flex-col">
                    <Tabs value={rightPanelTab} onValueChange={setRightPanelTab} className="flex-1 flex flex-col">
                      <TabsList className="w-full justify-start rounded-none border-b bg-transparent px-2">
                        <TabsTrigger 
                          value="backlinks"
                          className="text-xs data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"
                        >
                          <Link2 className="h-3 w-3 mr-1" />
                          Backlinks
                        </TabsTrigger>
                        <TabsTrigger 
                          value="bible"
                          className="text-xs data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"
                        >
                          <BookOpen className="h-3 w-3 mr-1" />
                          Bible
                        </TabsTrigger>
                        <TabsTrigger 
                          value="styleGuide"
                          className="text-xs data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"
                          data-testid="right-panel-style-guide-tab"
                        >
                          <BookOpen className="h-3 w-3 mr-1" />
                          Style Guide
                        </TabsTrigger>
                        <TabsTrigger 
                          value="prompt"
                          className="text-xs data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"
                        >
                          <Wand2 className="h-3 w-3 mr-1" />
                          Prompt
                        </TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="backlinks" className="flex-1 mt-0 p-0">
                        <BacklinksPanel />
                      </TabsContent>
                      
                      <TabsContent value="bible" className="flex-1 mt-0 p-0">
                        <BiblePanel
                          editorRef={editorRef}
                          onRequestCreate={handleOpenFullCreateDialog}
                        />
                      </TabsContent>
                      
                      <TabsContent value="styleGuide" className="flex-1 mt-0 p-0">
                        <StyleGuidePanel />
                      </TabsContent>
                      
                      <TabsContent value="prompt" className="flex-1 mt-0 p-0">
                        <PromptStudio />
                      </TabsContent>
                    </Tabs>
                  </div>
                </ResizablePanel>
              </>
            )}
          </ResizablePanelGroup>
        </div>
        
        {/* Dialogs */}
        <CommandPalette 
          onCreateDocument={handleCreateDocument}
          onExport={openExportModal}
          onSettings={openSettings}
        />
        <ExportModal />
        <SettingsDialog />
        <QuickCreateDialog
          open={quickCreateOpen}
          onClose={() => setQuickCreateOpen(false)}
          type={quickCreateType}
          onCreate={createDocument}
        />
        <CreateDocumentDialog
          open={fullCreateDialogOpen}
          onClose={() => setFullCreateDialogOpen(false)}
          initialType={fullCreateType}
          onCreateDocument={createDocument}
        />
        <RenameDocumentDialog
          open={renameDialogOpen}
          onClose={() => setRenameDialogOpen(false)}
          document={renameDoc}
          onRename={updateTitle}
        />
        <DeleteProjectDialog
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
          project={currentProject}
          onDelete={handleDeleteProject}
        />
        <CreateProjectDialog
          open={createProjectDialogOpen}
          onClose={() => setCreateProjectDialogOpen(false)}
          onCreate={handleCreateProject}
        />
        
        {/* Toast notifications */}
        <Toaster 
          position="bottom-right" 
          theme={theme}
          toastOptions={{
            className: 'font-ui',
          }}
        />
      </div>
    </TooltipProvider>
  );
}

export default App;
