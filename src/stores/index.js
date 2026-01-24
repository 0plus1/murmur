/**
 * Main application store using Zustand
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  db, 
  createProject, 
  getAllProjects, 
  deleteProject,
  getProjectDocuments,
  createDocument,
  updateDocument,
  deleteDocument,
  reorderDocuments,
  searchDocuments
} from '@/lib/db';
import { createDocumentMarkdown, countWords } from '@/lib/markdown';
import { reindexProject, refactorLinks, getBacklinksForDocument, getLinkableItems } from '@/lib/reindexer';
import { createSampleProject } from '@/lib/sample';

// UI Store - for panels, modals, theme
export const useUIStore = create(
  persist(
    (set, get) => ({
      theme: 'dark',
      sidebarCollapsed: false,
      rightPanelCollapsed: false,
      rightPanelTab: 'backlinks', // backlinks | bible | styleGuide | prompt
      commandPaletteOpen: false,
      promptStudioOpen: false,
      settingsOpen: false,
      exportModalOpen: false,
      
      setTheme: (theme) => {
        set({ theme });
        document.documentElement.classList.toggle('dark', theme === 'dark');
      },
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      toggleRightPanel: () => set((state) => ({ rightPanelCollapsed: !state.rightPanelCollapsed })),
      setRightPanelTab: (tab) => set({ rightPanelTab: tab }),
      openCommandPalette: () => set({ commandPaletteOpen: true }),
      closeCommandPalette: () => set({ commandPaletteOpen: false }),
      toggleCommandPalette: () => set((state) => ({ commandPaletteOpen: !state.commandPaletteOpen })),
      openPromptStudio: () => set({ promptStudioOpen: true, rightPanelTab: 'prompt' }),
      closePromptStudio: () => set({ promptStudioOpen: false }),
      openSettings: () => set({ settingsOpen: true }),
      closeSettings: () => set({ settingsOpen: false }),
      openExportModal: () => set({ exportModalOpen: true }),
      closeExportModal: () => set({ exportModalOpen: false }),
    }),
    {
      name: 'murmur-ui',
      partialize: (state) => ({
        theme: state.theme,
        sidebarCollapsed: state.sidebarCollapsed,
        rightPanelCollapsed: state.rightPanelCollapsed,
      }),
    }
  )
);

// Project Store - for project data
export const useProjectStore = create((set, get) => ({
  projects: [],
  currentProject: null,
  documents: [],
  loading: false,
  error: null,
  initialized: false,
  
  // Initialize app - load projects
  initialize: async () => {
    set({ loading: true });
    try {
      console.log('[murmur] Initializing...');
      const projects = await getAllProjects();
      console.log('[murmur] Projects loaded:', projects.length);
      
      set({ projects, initialized: true, loading: false });
      
      // Auto-open most recent project if exists
      if (projects.length > 0) {
        console.log('[murmur] Opening project:', projects[0].name);
        await get().openProject(projects[0].id);
      }
    } catch (e) {
      console.error('[murmur] Initialize error:', e);
      set({ error: e.message, loading: false, initialized: true });
    }
  },
  
  // Create new project
  createNewProject: async (name) => {
    set({ loading: true });
    try {
      const id = await createProject(name);
      const projects = await getAllProjects();
      set({ projects, loading: false });
      await get().openProject(id);
      return id;
    } catch (e) {
      set({ error: e.message, loading: false });
      throw e;
    }
  },
  
  // Open project
  openProject: async (id) => {
    set({ loading: true });
    try {
      const project = await db.projects.get(id);
      if (!project) throw new Error('Project not found');
      
      const documents = await getProjectDocuments(id);
      set({ currentProject: project, documents, loading: false });
      
      // Reindex in background to keep links/backlinks in sync
      reindexProject(id).catch((error) => {
        console.error('[murmur] Reindex failed:', error);
      });
    } catch (e) {
      set({ error: e.message, loading: false });
      throw e;
    }
  },
  
  // Delete project
  removeProject: async (id) => {
    set({ loading: true });
    try {
      await deleteProject(id);
      const projects = await getAllProjects();
      
      // If deleted current project, switch to another or clear
      if (get().currentProject?.id === id) {
        if (projects.length > 0) {
          await get().openProject(projects[0].id);
        } else {
          set({ currentProject: null, documents: [] });
        }
      }
      
      set({ projects, loading: false });
    } catch (e) {
      set({ error: e.message, loading: false });
      throw e;
    }
  },
  
  // Refresh documents
  refreshDocuments: async () => {
    const projectId = get().currentProject?.id;
    if (!projectId) return;
    
    const documents = await getProjectDocuments(projectId);
    set({ documents });
  },
  
  // Reindex current project
  reindexCurrentProject: async () => {
    const projectId = get().currentProject?.id;
    if (!projectId) return;
    
    set({ loading: true });
    try {
      await reindexProject(projectId);
      await get().refreshDocuments();
      set({ loading: false });
    } catch (e) {
      set({ error: e.message, loading: false });
      throw e;
    }
  },
  
  // Recreate sample project
  recreateSampleProject: async () => {
    set({ loading: true });
    try {
      const id = await createSampleProject();
      const projects = await getAllProjects();
      set({ projects, loading: false });
      await get().openProject(id);
    } catch (e) {
      set({ error: e.message, loading: false });
      throw e;
    }
  }
}));

// Editor Store - for current document editing
export const useEditorStore = create((set, get) => ({
  currentDocument: null,
  isDirty: false,
  backlinks: [],
  linkableItems: [],
  searchResults: [],
  searchQuery: '',
  
  // Open document
  openDocument: async (id) => {
    const doc = await db.documents.get(id);
    if (!doc) return;
    
    set({ currentDocument: doc, isDirty: false });
    
    // Load backlinks
    const backlinks = await getBacklinksForDocument(id);
    set({ backlinks });
    
    // Load linkable items for autocomplete
    const items = await getLinkableItems(doc.projectId);
    set({ linkableItems: items });
  },
  
  // Update document content
  updateContent: (markdown) => {
    set((state) => ({
      currentDocument: state.currentDocument 
        ? { ...state.currentDocument, markdown }
        : null,
      isDirty: true
    }));
  },
  
  // Save document
  saveDocument: async () => {
    const doc = get().currentDocument;
    if (!doc || !get().isDirty) return;
    
    const wordCount = countWords(doc.markdown);
    await updateDocument(doc.id, { 
      markdown: doc.markdown,
      wordCount 
    });
    
    set({ isDirty: false });
    
    // Refresh project documents
    await useProjectStore.getState().refreshDocuments();
    
    // Reindex to keep links/backlinks in sync with updated markdown
    await reindexProject(doc.projectId);
    
    // Refresh backlinks after save
    const backlinks = await getBacklinksForDocument(doc.id);
    set({ backlinks });
  },
  
  // Create new document
  createDocument: async (type, title, parentId = null) => {
    const projectId = useProjectStore.getState().currentProject?.id;
    if (!projectId) return;
    
    const documents = useProjectStore.getState().documents;
    const sameTypeDocs = documents.filter(d => d.type === type);
    const maxOrder = Math.max(0, ...sameTypeDocs.map(d => d.order));
    
    const markdown = createDocumentMarkdown(type, title);
    
    const id = await createDocument(projectId, {
      type,
      title,
      markdown,
      order: maxOrder + 1,
      parentId
    });
    
    await useProjectStore.getState().refreshDocuments();
    await get().openDocument(id);
    
    return id;
  },
  
  // Update document title
  updateTitle: async (id, newTitle) => {
    const doc = await db.documents.get(id);
    if (!doc) return;
    
    const oldTitle = doc.title;
    await updateDocument(id, { title: newTitle });
    
    // Refactor links if title changed
    if (oldTitle !== newTitle) {
      await refactorLinks(doc.projectId, oldTitle, newTitle);
    }
    
    await useProjectStore.getState().refreshDocuments();
    
    // Refresh current document if it's the one we renamed
    if (get().currentDocument?.id === id) {
      await get().openDocument(id);
    }
  },
  
  // Update document status
  updateStatus: async (id, status) => {
    await updateDocument(id, { status });
    await useProjectStore.getState().refreshDocuments();
    
    if (get().currentDocument?.id === id) {
      set((state) => ({
        currentDocument: state.currentDocument 
          ? { ...state.currentDocument, status }
          : null
      }));
    }
  },
  
  // Delete document
  removeDocument: async (id) => {
    await deleteDocument(id);
    await useProjectStore.getState().refreshDocuments();
    
    // Clear current document if deleted
    if (get().currentDocument?.id === id) {
      set({ currentDocument: null, backlinks: [] });
    }
  },
  
  // Duplicate document
  duplicateDocument: async (id) => {
    const doc = await db.documents.get(id);
    if (!doc) return;
    
    const newTitle = `${doc.title} (copy)`;
    const markdown = createDocumentMarkdown(doc.type, newTitle);
    
    const newId = await createDocument(doc.projectId, {
      type: doc.type,
      title: newTitle,
      markdown: doc.markdown.replace(doc.title, newTitle),
      order: doc.order + 0.5,
      status: 'draft'
    });
    
    await useProjectStore.getState().refreshDocuments();
    return newId;
  },
  
  // Reorder documents
  reorderDocs: async (type, orderedIds) => {
    const projectId = useProjectStore.getState().currentProject?.id;
    if (!projectId) return;
    
    await reorderDocuments(projectId, type, orderedIds);
    await useProjectStore.getState().refreshDocuments();
  },
  
  // Search
  search: async (query) => {
    set({ searchQuery: query });
    
    if (!query.trim()) {
      set({ searchResults: [] });
      return;
    }
    
    const projectId = useProjectStore.getState().currentProject?.id;
    if (!projectId) return;
    
    const results = await searchDocuments(projectId, query);
    set({ searchResults: results });
  },
  
  clearSearch: () => set({ searchQuery: '', searchResults: [] })
}));
