import { open } from '@tauri-apps/plugin-dialog';
import { exists, mkdir, remove, rename, writeTextFile } from '@tauri-apps/plugin-fs';
import { join } from '@tauri-apps/api/path';
import { db, getSetting, setSetting } from '@/lib/db';
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
