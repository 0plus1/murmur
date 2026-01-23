/**
 * Reindexer - rebuilds links and entities from stored markdown
 */
import { db, clearProjectLinks, clearProjectEntities, createLink, createEntity } from '@/lib/db';
import { extractHeadingsAndAnchors, refactorLinksOnRename } from '@/lib/markdown';
import { buildIndexForProject } from './indexer';

export async function reindexProject(projectId: number) {
  const documents = await db.documents.where('projectId').equals(projectId).toArray();

  await clearProjectLinks(projectId);
  await clearProjectEntities(projectId);

  const index = buildIndexForProject(documents);

  for (const link of index.links) {
    await createLink(projectId, link);
  }

  for (const entity of index.entities) {
    await createEntity(projectId, entity);
  }

  for (const [docId, wordCount] of Object.entries(index.wordCounts)) {
    await db.documents.update(Number(docId), { wordCount });
  }

  return {
    documentsProcessed: documents.length,
    linksCreated: index.links.length,
    entitiesCreated: index.entities.length,
  };
}

export async function refactorLinks(projectId: number, oldTitle: string, newTitle: string) {
  const documents = await db.documents.where('projectId').equals(projectId).toArray();
  const { updatedDocuments, updatedCount } = refactorLinksOnRename(
    documents.map((doc) => ({ id: doc.id, markdown: doc.markdown })),
    oldTitle,
    newTitle
  );

  const docMap = new Map(documents.map((doc) => [doc.id, doc]));
  for (const updated of updatedDocuments) {
    const original = docMap.get(updated.id);
    if (original && updated.markdown !== original.markdown) {
      await db.documents.update(updated.id, {
        markdown: updated.markdown,
        updatedAt: new Date().toISOString(),
      });
    }
  }

  await reindexProject(projectId);

  return updatedCount;
}

export async function getBacklinksForDocument(docId: number) {
  const doc = await db.documents.get(docId);
  if (!doc) return [];
  
  const byId = await db.links.where('targetDocId').equals(docId).toArray();
  const allLinks = await db.links.where('projectId').equals(doc.projectId).toArray();
  const byTitle = allLinks.filter(
    (link) => link.targetText.toLowerCase() === doc.title.toLowerCase() && link.sourceDocId !== docId
  );

  const shouldFallback = allLinks.length === 0 && byId.length === 0;
  let combinedLinks = [...byId, ...byTitle];
  if (shouldFallback) {
    const documents = await db.documents.where('projectId').equals(doc.projectId).toArray();
    const index = buildIndexForProject(documents);
    const titleLower = doc.title.toLowerCase();
    combinedLinks = index.links.filter(
      (link) =>
        (link.targetDocId === docId || link.targetText.toLowerCase() === titleLower) &&
        link.sourceDocId !== docId
    );
  }
  
  const seen = new Set();
  const uniqueLinks = combinedLinks.filter((link) => {
    const key = `${link.sourceDocId}-${link.targetText}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return link.sourceDocId !== docId;
  });

  const sourceDocIds = [...new Set(uniqueLinks.map((link) => link.sourceDocId))];
  if (sourceDocIds.length === 0) return [];

  const sourceDocs = await db.documents.where('id').anyOf(sourceDocIds).toArray();
  const sourceDocMap = new Map(sourceDocs.map((source) => [source.id, source]));

  return uniqueLinks
    .map((link) => ({ ...link, sourceDoc: sourceDocMap.get(link.sourceDocId) }))
    .filter((link) => link.sourceDoc);
}

type LinkableItem = {
  type: string;
  text: string;
  docId: number;
  anchor: string | null;
};

export async function getLinkableItems(projectId: number) {
  const documents = await db.documents.where('projectId').equals(projectId).toArray();
  const items: LinkableItem[] = [];

  for (const doc of documents) {
    items.push({
      type: doc.type,
      text: doc.title,
      docId: doc.id,
      anchor: null,
    });

    const headings = extractHeadingsAndAnchors(doc.markdown);
    for (const heading of headings) {
      items.push({
        type: doc.type,
        text: `${doc.title}#${heading.text}`,
        docId: doc.id,
        anchor: heading.anchor,
      });
    }
  }

  return items;
}
