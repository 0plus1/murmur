import { open } from '@tauri-apps/plugin-dialog';
import { exists, mkdir, readDir, readTextFile, remove, rename, writeTextFile } from '@tauri-apps/plugin-fs';
import { join } from '@tauri-apps/api/path';
import { db, getSetting, setSetting } from '@/lib/db';
import { parseFrontmatter } from '@/lib/markdown';
import { buildDocumentFilename, buildProjectFolderName } from '@/lib/storage/filenames';

const APP_SETTINGS_ID = 'app';
const STORAGE_PATH_KEY = 'storage.rootPath';

export async function getStoragePath() {
  return getSetting(APP_SETTINGS_ID, STORAGE_PATH_KEY);
}

export async function setStoragePath(path) {
  return setSetting(APP_SETTINGS_ID, STORAGE_PATH_KEY, path);
}

export async function pickStoragePath() {
  const selected = await open({
    directory: true,
    multiple: false,
    title: 'Choose storage folder'
  });

  if (Array.isArray(selected)) {
    return selected[0] ?? null;
  }

  return typeof selected === 'string' ? selected : null;
}

export function getFolderForDocType(type) {
  switch (type) {
    case 'chapter':
    case 'scene':
      return 'manuscript/chapters';
    case 'character':
      return 'bible/characters';
    case 'location':
      return 'bible/locations';
    case 'theme':
      return 'bible/themes';
    case 'narrative_spine':
    case 'style_guide':
    case 'story_compass':
    case 'emotional_arc':
      return 'bible';
    case 'note':
    default:
      return 'notes';
  }
}

async function ensureDir(path) {
  await mkdir(path, { recursive: true });
}

async function getProjectRootPath(rootPath, project) {
  return join(rootPath, buildProjectFolderName(project));
}

export async function ensureProjectStructure(rootPath, project) {
  const projectRoot = await getProjectRootPath(rootPath, project);
  const manuscript = await join(projectRoot, 'manuscript');
  const chapters = await join(manuscript, 'chapters');
  const bible = await join(projectRoot, 'bible');
  const characters = await join(bible, 'characters');
  const locations = await join(bible, 'locations');
  const themes = await join(bible, 'themes');
  const notes = await join(projectRoot, 'notes');

  await Promise.all([
    ensureDir(projectRoot),
    ensureDir(manuscript),
    ensureDir(chapters),
    ensureDir(bible),
    ensureDir(characters),
    ensureDir(locations),
    ensureDir(themes),
    ensureDir(notes)
  ]);

  return { projectRoot };
}

function parseProjectId(value) {
  if (typeof value === 'number' && Number.isInteger(value) && value > 0) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isInteger(parsed) && parsed > 0) return parsed;
  }
  return null;
}

function parseProjectIdFromFolderName(folderName) {
  if (!folderName) return null;
  const match = String(folderName).match(/-(\d+)$/);
  return match ? Number(match[1]) : null;
}

function inferDocTypeFromPath(path) {
  if (/(^|\/)bible\/characters\//.test(path)) return 'character';
  if (/(^|\/)bible\/locations\//.test(path)) return 'location';
  if (/(^|\/)bible\/themes\//.test(path)) return 'theme';
  if (/(^|\/)bible\/narrative-spine\.md$/.test(path)) return 'narrative_spine';
  if (/(^|\/)bible\/style-guide\.md$/.test(path)) return 'style_guide';
  if (/(^|\/)bible\/story-compass\.md$/.test(path)) return 'story_compass';
  if (/(^|\/)bible\/emotional-arc\.md$/.test(path)) return 'emotional_arc';
  if (/(^|\/)manuscript\/chapters\//.test(path)) return 'chapter';
  if (/(^|\/)notes\//.test(path)) return 'note';
  return 'note';
}

function parseDocIdFromFileName(fileName) {
  const match = String(fileName).match(/-(\d+)\.md$/);
  if (!match) return null;
  const parsed = Number(match[1]);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

async function safeReadProjectMetadata(projectRoot) {
  const metadataPath = await join(projectRoot, 'project.json');
  if (!(await exists(metadataPath))) return null;

  try {
    const raw = await readTextFile(metadataPath);
    return JSON.parse(raw);
  } catch (error) {
    console.warn('[murmur] Failed to read project.json:', metadataPath, error);
    return null;
  }
}

async function collectMarkdownFiles(projectRoot) {
  const targets = [
    'manuscript/chapters',
    'bible/characters',
    'bible/locations',
    'bible/themes',
    'notes',
  ];

  const files = [];

  for (const relativeDir of targets) {
    const absoluteDir = await join(projectRoot, relativeDir);
    if (!(await exists(absoluteDir))) continue;

    const entries = await readDir(absoluteDir);
    for (const entry of entries) {
      if (entry?.isDirectory) continue;
      const name = entry?.name;
      if (!name || !name.endsWith('.md')) continue;
      files.push({
        relativePath: `${relativeDir}/${name}`.replace(/\\/g, '/'),
        absolutePath: await join(absoluteDir, name),
        fileName: name,
      });
    }
  }

  const narrativeSpinePath = await join(projectRoot, 'bible', 'narrative-spine.md');
  if (await exists(narrativeSpinePath)) {
    files.push({
      relativePath: 'bible/narrative-spine.md',
      absolutePath: narrativeSpinePath,
      fileName: 'narrative-spine.md',
    });
  }

  const styleGuidePath = await join(projectRoot, 'bible', 'style-guide.md');
  if (await exists(styleGuidePath)) {
    files.push({
      relativePath: 'bible/style-guide.md',
      absolutePath: styleGuidePath,
      fileName: 'style-guide.md',
    });
  }

  const storyCompassPath = await join(projectRoot, 'bible', 'story-compass.md');
  if (await exists(storyCompassPath)) {
    files.push({
      relativePath: 'bible/story-compass.md',
      absolutePath: storyCompassPath,
      fileName: 'story-compass.md',
    });
  }

  const emotionalArcPath = await join(projectRoot, 'bible', 'emotional-arc.md');
  if (await exists(emotionalArcPath)) {
    files.push({
      relativePath: 'bible/emotional-arc.md',
      absolutePath: emotionalArcPath,
      fileName: 'emotional-arc.md',
    });
  }

  return files;
}

async function hydrateProjectDocumentsFromDisk(projectId, projectRoot) {
  const markdownFiles = await collectMarkdownFiles(projectRoot);
  const existingDocs = await db.documents.where('projectId').equals(projectId).toArray();
  const existingByFileName = new Map(existingDocs.map((doc) => [doc.fileName, doc]));
  const existingNarrativeSpine = existingDocs.find((doc) => doc.type === 'narrative_spine');
  const existingStyleGuide = existingDocs.find((doc) => doc.type === 'style_guide' || (doc.type === 'theme' && doc.title?.toLowerCase().includes('style guide')));
  const existingStoryCompass = existingDocs.find((doc) => doc.type === 'story_compass');
  const existingEmotionalArc = existingDocs.find((doc) => doc.type === 'emotional_arc');
  const now = new Date().toISOString();

  const docsToPersist = [];
  let fallbackOrder = 0;
  const hasCanonicalStyleGuideFile = markdownFiles.some((file) => file.fileName === 'style-guide.md');

  for (const file of markdownFiles) {
    let markdown;
    try {
      markdown = await readTextFile(file.absolutePath);
    } catch (error) {
      console.warn('[murmur] Failed reading markdown file:', file.absolutePath, error);
      continue;
    }

    const parsed = parseFrontmatter(markdown).value;
    const fm = parsed.frontmatter || {};
    const titleFromFrontmatter = typeof fm.title === 'string' && fm.title.trim() ? fm.title.trim() : null;
    const inferredType = inferDocTypeFromPath(file.relativePath);
    let type = typeof fm.type === 'string' ? fm.type : inferredType;
    if (type === 'theme' && titleFromFrontmatter?.toLowerCase().includes('style guide')) {
      type = 'style_guide';
    }
    if (type === 'style_guide' && file.fileName !== 'style-guide.md' && hasCanonicalStyleGuideFile) {
      continue;
    }
    const titleFromFile = file.fileName.replace(/\.md$/, '');
    const status = typeof fm.status === 'string' ? fm.status : 'draft';
    const order = Number.isFinite(fm.order) ? Number(fm.order) : fallbackOrder++;
    const updatedAt = typeof fm.updated_at === 'string' ? fm.updated_at : now;

    const idFromName = parseDocIdFromFileName(file.fileName);
    const existingByName = existingByFileName.get(file.fileName);
    const resolvedId = idFromName
      ?? existingByName?.id
      ?? (type === 'narrative_spine' ? existingNarrativeSpine?.id : null)
      ?? (type === 'style_guide' ? existingStyleGuide?.id : null)
      ?? (type === 'story_compass' ? existingStoryCompass?.id : null)
      ?? (type === 'emotional_arc' ? existingEmotionalArc?.id : null);

    const record = {
      projectId,
      type,
      title: titleFromFrontmatter || titleFromFile,
      status,
      order,
      markdown,
      updatedAt,
      fileName: file.fileName,
    };

    if (resolvedId) {
      record.id = resolvedId;
    }

    docsToPersist.push(record);
  }

  await db.transaction('rw', [db.documents, db.links, db.entities], async () => {
    await db.documents.where('projectId').equals(projectId).delete();
    await db.links.where('projectId').equals(projectId).delete();
    await db.entities.where('projectId').equals(projectId).delete();
    if (docsToPersist.length > 0) {
      await db.documents.bulkAdd(docsToPersist);
    }
  });
}

async function upsertProjectFromDiskFolder(rootPath, folderName) {
  const projectRoot = await join(rootPath, folderName);
  const metadata = await safeReadProjectMetadata(projectRoot);
  if (!metadata) return null;

  const projectId = parseProjectId(metadata.id) ?? parseProjectIdFromFolderName(folderName);
  if (!projectId) {
    console.warn('[murmur] Skipping project folder without numeric id:', folderName);
    return null;
  }

  const now = new Date().toISOString();
  const projectRecord = {
    id: projectId,
    name: typeof metadata.name === 'string' && metadata.name.trim() ? metadata.name.trim() : folderName,
    createdAt: typeof metadata.createdAt === 'string' ? metadata.createdAt : now,
    updatedAt: typeof metadata.updatedAt === 'string' ? metadata.updatedAt : now,
  };

  await db.projects.put(projectRecord);
  await hydrateProjectDocumentsFromDisk(projectId, projectRoot);
  return projectId;
}

export async function hydrateProjectsFromDisk() {
  const rootPath = await getStoragePath();
  if (!rootPath || !(await exists(rootPath))) return { projectsHydrated: 0 };

  const entries = await readDir(rootPath);
  let projectsHydrated = 0;

  for (const entry of entries) {
    if (!entry?.isDirectory || !entry?.name) continue;
    const hydratedId = await upsertProjectFromDiskFolder(rootPath, entry.name);
    if (hydratedId) {
      projectsHydrated += 1;
    }
  }

  return { projectsHydrated };
}

export async function hydrateProjectFromDisk(projectId) {
  const rootPath = await getStoragePath();
  if (!rootPath || !(await exists(rootPath))) return false;

  const project = await db.projects.get(projectId);
  if (!project) return false;

  const preferredRoot = await getProjectRootPath(rootPath, project);
  if (await exists(preferredRoot)) {
    await hydrateProjectDocumentsFromDisk(projectId, preferredRoot);
    return true;
  }

  const entries = await readDir(rootPath);
  for (const entry of entries) {
    if (!entry?.isDirectory || !entry?.name) continue;
    const candidateRoot = await join(rootPath, entry.name);
    const metadata = await safeReadProjectMetadata(candidateRoot);
    if (!metadata) continue;
    const candidateId = parseProjectId(metadata.id) ?? parseProjectIdFromFolderName(entry.name);
    if (candidateId !== projectId) continue;
    await hydrateProjectDocumentsFromDisk(projectId, candidateRoot);
    return true;
  }

  return false;
}

export async function ensureDocumentFileName(doc) {
  if (doc.fileName) return doc.fileName;
  const fileName = buildDocumentFilename(doc);
  await db.documents.update(doc.id, { fileName });
  return fileName;
}

export async function writeProjectMetadata(projectRoot, projectId) {
  const project = await db.projects.get(projectId);
  if (!project) return;

  const metadata = {
    id: project.id,
    name: project.name,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
    syncedAt: new Date().toISOString()
  };

  const path = await join(projectRoot, 'project.json');
  await writeTextFile(path, JSON.stringify(metadata, null, 2));
}

export async function writeDocumentToDisk(project, doc) {
  const rootPath = await getStoragePath();
  if (!rootPath) return false;

  const { projectRoot } = await ensureProjectStructure(rootPath, project);
  const folder = getFolderForDocType(doc.type);
  const docFolder = await join(projectRoot, folder);
  await ensureDir(docFolder);

  const fileName = await ensureDocumentFileName(doc);
  const filePath = await join(docFolder, fileName);
  await writeTextFile(filePath, doc.markdown);
  await writeProjectMetadata(projectRoot, project.id);

  return true;
}

export async function removeDocumentFromDisk(project, doc) {
  const rootPath = await getStoragePath();
  if (!rootPath) return false;

  const projectRoot = await getProjectRootPath(rootPath, project);
  if (!(await exists(projectRoot))) return false;
  const folder = getFolderForDocType(doc.type);
  const docFolder = await join(projectRoot, folder);
  const fileName = await ensureDocumentFileName(doc);
  const filePath = await join(docFolder, fileName);

  if (await exists(filePath)) {
    await remove(filePath);
  }

  await writeProjectMetadata(projectRoot, project.id);
  return true;
}

export async function renameDocumentOnDisk(project, doc, newTitle) {
  const rootPath = await getStoragePath();
  if (!rootPath) return null;

  const projectRoot = await getProjectRootPath(rootPath, project);
  if (!(await exists(projectRoot))) return null;
  const folder = getFolderForDocType(doc.type);
  const docFolder = await join(projectRoot, folder);

  const previousName = doc.fileName || buildDocumentFilename(doc);
  const nextName = buildDocumentFilename(doc, newTitle);

  if (previousName !== nextName) {
    const fromPath = await join(docFolder, previousName);
    const toPath = await join(docFolder, nextName);
    if (await exists(fromPath)) {
      await rename(fromPath, toPath);
    }
    await db.documents.update(doc.id, { fileName: nextName });
  }

  return nextName;
}

export async function syncProjectToDisk(projectId) {
  const rootPath = await getStoragePath();
  if (!rootPath) return false;

  const project = await db.projects.get(projectId);
  if (!project) return false;

  const documents = await db.documents.where('projectId').equals(projectId).toArray();
  const { projectRoot } = await ensureProjectStructure(rootPath, project);

  for (const doc of documents) {
    const folder = getFolderForDocType(doc.type);
    const docFolder = await join(projectRoot, folder);
    await ensureDir(docFolder);
    const fileName = await ensureDocumentFileName(doc);
    const filePath = await join(docFolder, fileName);
    await writeTextFile(filePath, doc.markdown);
  }

  await writeProjectMetadata(projectRoot, project.id);
  return true;
}

export async function syncAllProjectsToDisk() {
  const rootPath = await getStoragePath();
  if (!rootPath) return false;

  const projects = await db.projects.toArray();
  for (const project of projects) {
    await syncProjectToDisk(project.id);
  }

  return true;
}

export async function removeProjectFromDisk(project) {
  const rootPath = await getStoragePath();
  if (!rootPath) return false;

  const projectRoot = await getProjectRootPath(rootPath, project);
  if (await exists(projectRoot)) {
    await remove(projectRoot, { recursive: true });
  }

  return true;
}
