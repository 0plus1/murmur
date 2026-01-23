import { countWords, extractTitleMentions } from '@/lib/markdown';

export type IndexDocument = {
  id: number;
  title: string;
  type: string;
  markdown: string;
};

export type IndexedLink = {
  sourceDocId: number;
  targetText: string;
  targetDocId: number | null;
  targetAnchor: string | null;
  raw: string;
};

export type IndexedEntity = {
  entityType: string;
  name: string;
  docId: number;
};

export type IndexResult = {
  links: IndexedLink[];
  entities: IndexedEntity[];
  wordCounts: Record<string, number>;
  backlinks: Record<string, IndexedLink[]>;
};

export function buildIndexForProject(documents: IndexDocument[]): IndexResult {
  const titleToDocId = new Map<string, number>();
  const titles = documents.map((doc) => doc.title);
  documents.forEach((doc) => {
    titleToDocId.set(doc.title.toLowerCase(), doc.id);
  });

  const links: IndexedLink[] = [];
  const entities: IndexedEntity[] = [];
  const wordCounts: Record<string, number> = {};
  const backlinks: Record<string, IndexedLink[]> = {};

  documents.forEach((doc) => {
    const mentions = extractTitleMentions(doc.markdown, titles.filter((title) => title !== doc.title));
    mentions.forEach((mention) => {
      const targetDocId = titleToDocId.get(mention.title.toLowerCase()) ?? null;
      const indexedLink: IndexedLink = {
        sourceDocId: doc.id,
        targetText: mention.title,
        targetDocId,
        targetAnchor: null,
        raw: mention.title,
      };
      links.push(indexedLink);
      if (targetDocId !== null) {
        const key = String(targetDocId);
        if (!backlinks[key]) backlinks[key] = [];
        backlinks[key].push(indexedLink);
      }
    });

    if (['character', 'location', 'theme'].includes(doc.type)) {
      entities.push({ entityType: doc.type, name: doc.title, docId: doc.id });
    }

    wordCounts[String(doc.id)] = countWords(doc.markdown);
  });

  return {
    links,
    entities,
    wordCounts,
    backlinks,
  };
}
