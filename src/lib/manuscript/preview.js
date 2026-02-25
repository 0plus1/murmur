import { parseFrontmatter } from '@/lib/markdown';
import { isManuscriptDocument } from '@/lib/manuscript/stats';

function byManuscriptOrder(a, b) {
  const aOrder = typeof a?.order === 'number' ? a.order : Number.MAX_SAFE_INTEGER;
  const bOrder = typeof b?.order === 'number' ? b.order : Number.MAX_SAFE_INTEGER;
  if (aOrder !== bOrder) return aOrder - bOrder;

  return String(a?.title || '').localeCompare(String(b?.title || ''));
}

function getMarkdownContent(markdown = '') {
  const parsed = parseFrontmatter(markdown || '');
  return (parsed?.value?.content || '').trim();
}

export function getOrderedManuscriptDocuments(documents = []) {
  return documents.filter(isManuscriptDocument).slice().sort(byManuscriptOrder);
}

export function buildManuscriptRenderedMarkdown(documents = []) {
  const manuscriptDocs = getOrderedManuscriptDocuments(documents);
  if (manuscriptDocs.length === 0) return '';

  return manuscriptDocs
    .map((doc, index) => {
      const headingLevel = doc.type === 'chapter' ? '#' : '##';
      const title = (doc.title || 'Untitled').trim();
      const content = getMarkdownContent(doc.markdown || '');
      const parts = [`${headingLevel} ${title}`];

      if (content) parts.push(content);
      if (index < manuscriptDocs.length - 1) parts.push('---');

      return parts.join('\n\n');
    })
    .join('\n\n');
}

export function buildManuscriptRawMarkdown(documents = []) {
  const manuscriptDocs = getOrderedManuscriptDocuments(documents);
  if (manuscriptDocs.length === 0) return '';

  return manuscriptDocs
    .map((doc) => (doc.markdown || '').trim())
    .filter(Boolean)
    .join('\n\n\n');
}
