/**
 * Export utilities - ZIP export
 */
import JSZip from 'jszip';
import { db } from '@/lib/db';
import { parseFrontmatter } from '@/lib/markdown';
import { buildDocumentFilename, sanitizeFilename } from '@/lib/storage/filenames';
import { syncProjectToDisk } from '@/lib/storage';

/**
 * Export project as ZIP file containing markdown files
 */
export async function exportProjectAsZip(projectId) {
  const project = await db.projects.get(projectId);
  if (!project) throw new Error('Project not found');
  
  const documents = await db.documents.where('projectId').equals(projectId).toArray();
  
  const zip = new JSZip();
  
  // Create folder structure
  const manuscriptFolder = zip.folder('manuscript');
  const chaptersFolder = manuscriptFolder.folder('chapters');
  const bibleFolder = zip.folder('bible');
  const charactersFolder = bibleFolder.folder('characters');
  const locationsFolder = bibleFolder.folder('locations');
  const themesFolder = bibleFolder.folder('themes');
  const notesFolder = zip.folder('notes');
  
  // Add documents to appropriate folders
  for (const doc of documents) {
    const filename = buildDocumentFilename(doc);
    const markdown = doc.markdown;
    
    switch (doc.type) {
      case 'chapter':
      case 'scene':
        chaptersFolder.file(filename, markdown);
        break;
      case 'character':
        charactersFolder.file(filename, markdown);
        break;
      case 'location':
        locationsFolder.file(filename, markdown);
        break;
      case 'theme':
        themesFolder.file(filename, markdown);
        break;
      case 'note':
        notesFolder.file(filename, markdown);
        break;
      default:
        notesFolder.file(filename, markdown);
    }
  }
  
  // Add project.json
  const projectJson = {
    name: project.name,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
    exportedAt: new Date().toISOString(),
    documentCount: documents.length
  };
  zip.file('project.json', JSON.stringify(projectJson, null, 2));
  
  // Generate ZIP blob
  const blob = await zip.generateAsync({ type: 'blob' });
  
  return { blob, filename: sanitizeFilename(project.name) + '.zip' };
}

/**
 * Download ZIP file
 */
export function downloadZip(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Import project from ZIP file
 */
export async function importProjectFromZip(file, projectName) {
  const zip = await JSZip.loadAsync(file);
  
  // Try to read project.json for metadata
  let projectMeta = { name: projectName || 'Imported Project' };
  const projectJsonFile = zip.file('project.json');
  if (projectJsonFile) {
    try {
      const content = await projectJsonFile.async('string');
      const parsed = JSON.parse(content);
      projectMeta.name = parsed.name || projectMeta.name;
    } catch (e) {
      console.warn('Failed to parse project.json:', e);
    }
  }
  
  // Create project
  const now = new Date().toISOString();
  const projectId = await db.projects.add({
    name: projectMeta.name,
    createdAt: now,
    updatedAt: now
  });
  
  // Process all markdown files
  const markdownFiles = [];
  zip.forEach((relativePath, file) => {
    if (relativePath.endsWith('.md') && !file.dir) {
      markdownFiles.push({ path: relativePath, file });
    }
  });
  
  let order = 0;
  for (const { path, file } of markdownFiles) {
    const content = await file.async('string');
    const { frontmatter } = parseFrontmatter(content).value;
    
    // Determine type from path
    let type = 'note';
    if (path.includes('characters/')) type = 'character';
    else if (path.includes('locations/')) type = 'location';
    else if (path.includes('themes/')) type = 'theme';
    else if (path.includes('manuscript/') || path.includes('chapters/')) type = 'chapter';
    
    // Get title from frontmatter or filename
    const filename = path.split('/').pop().replace('.md', '');
    const title = frontmatter.title || filename;
    
    await db.documents.add({
      projectId,
      type: frontmatter.type || type,
      title,
      status: frontmatter.status || 'draft',
      order: frontmatter.order ?? order++,
      markdown: content,
      updatedAt: now
    });
  }

  await syncProjectToDisk(projectId);
  return projectId;
}
