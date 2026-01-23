/**
 * IndexedDB Database using Dexie
 * Local-first storage for Murmur writing app
 */
import Dexie from 'dexie';

export class MurmurDB extends Dexie {
  constructor() {
    super('MurmurDB');
    
    this.version(1).stores({
      projects: '++id, name, createdAt, updatedAt',
      documents: '++id, projectId, type, title, status, order, updatedAt, [projectId+type], [projectId+order]',
      links: '++id, projectId, sourceDocId, targetText, targetDocId, targetAnchor, [projectId+sourceDocId], [projectId+targetDocId]',
      entities: '++id, projectId, entityType, name, docId, [projectId+entityType]',
      settings: '[projectId+key], projectId, key, value'
    });

    this.projects = this.table('projects');
    this.documents = this.table('documents');
    this.links = this.table('links');
    this.entities = this.table('entities');
    this.settings = this.table('settings');
  }
}

export const db = new MurmurDB();

// Helper functions for database operations

export async function createProject(name) {
  const now = new Date().toISOString();
  const id = await db.projects.add({
    name,
    createdAt: now,
    updatedAt: now
  });
  return id;
}

export async function getProject(id) {
  return db.projects.get(id);
}

export async function getAllProjects() {
  return db.projects.orderBy('updatedAt').reverse().toArray();
}

export async function updateProject(id, updates) {
  return db.projects.update(id, {
    ...updates,
    updatedAt: new Date().toISOString()
  });
}

export async function deleteProject(id) {
  await db.transaction('rw', [db.projects, db.documents, db.links, db.entities, db.settings], async () => {
    await db.documents.where('projectId').equals(id).delete();
    await db.links.where('projectId').equals(id).delete();
    await db.entities.where('projectId').equals(id).delete();
    await db.settings.where('projectId').equals(id).delete();
    await db.projects.delete(id);
  });
}

export async function createDocument(projectId, doc) {
  const now = new Date().toISOString();
  const id = await db.documents.add({
    projectId,
    type: doc.type,
    title: doc.title,
    status: doc.status || 'draft',
    order: doc.order || 0,
    markdown: doc.markdown || '',
    parentId: doc.parentId || null,
    updatedAt: now
  });
  
  // Update project timestamp
  await db.projects.update(projectId, { updatedAt: now });
  
  return id;
}

export async function getDocument(id) {
  return db.documents.get(id);
}

export async function getProjectDocuments(projectId, type = null) {
  if (type) {
    return db.documents.where({ projectId, type }).sortBy('order');
  }
  return db.documents.where('projectId').equals(projectId).sortBy('order');
}

export async function updateDocument(id, updates) {
  const now = new Date().toISOString();
  await db.documents.update(id, {
    ...updates,
    updatedAt: now
  });
  
  // Update project timestamp
  const doc = await db.documents.get(id);
  if (doc) {
    await db.projects.update(doc.projectId, { updatedAt: now });
  }
}

export async function deleteDocument(id) {
  const doc = await db.documents.get(id);
  if (!doc) return;
  
  await db.transaction('rw', [db.documents, db.links, db.entities, db.projects], async () => {
    // Delete associated links
    await db.links.where('sourceDocId').equals(id).delete();
    await db.links.where('targetDocId').equals(id).delete();
    
    // Delete associated entity
    await db.entities.where('docId').equals(id).delete();
    
    // Delete document
    await db.documents.delete(id);
    
    // Update project timestamp
    await db.projects.update(doc.projectId, { updatedAt: new Date().toISOString() });
  });
}

export async function reorderDocuments(projectId, type, orderedIds) {
  await db.transaction('rw', db.documents, async () => {
    for (let i = 0; i < orderedIds.length; i++) {
      await db.documents.update(orderedIds[i], { order: i });
    }
  });
}

// Links operations
export async function createLink(projectId, link) {
  return db.links.add({
    projectId,
    sourceDocId: link.sourceDocId,
    targetText: link.targetText,
    targetDocId: link.targetDocId || null,
    targetAnchor: link.targetAnchor || null,
    raw: link.raw
  });
}

export async function getBacklinks(docId) {
  return db.links.where('targetDocId').equals(docId).toArray();
}

export async function getDocumentLinks(docId) {
  return db.links.where('sourceDocId').equals(docId).toArray();
}

export async function clearProjectLinks(projectId) {
  return db.links.where('projectId').equals(projectId).delete();
}

// Entity operations
export async function createEntity(projectId, entity) {
  return db.entities.add({
    projectId,
    entityType: entity.entityType,
    name: entity.name,
    docId: entity.docId
  });
}

export async function getProjectEntities(projectId, entityType = null) {
  if (entityType) {
    return db.entities.where({ projectId, entityType }).toArray();
  }
  return db.entities.where('projectId').equals(projectId).toArray();
}

export async function clearProjectEntities(projectId) {
  return db.entities.where('projectId').equals(projectId).delete();
}

// Settings operations
export async function getSetting(projectId, key) {
  const setting = await db.settings.get([projectId, key]);
  return setting?.value;
}

export async function setSetting(projectId, key, value) {
  return db.settings.put({ projectId, key, value });
}

// Search functionality
export async function searchDocuments(projectId, query) {
  const lowerQuery = query.toLowerCase();
  const docs = await db.documents.where('projectId').equals(projectId).toArray();
  
  return docs.filter(doc => {
    const titleMatch = doc.title.toLowerCase().includes(lowerQuery);
    const contentMatch = doc.markdown.toLowerCase().includes(lowerQuery);
    return titleMatch || contentMatch;
  });
}
