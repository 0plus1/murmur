import { splitFrontmatter } from './frontmatter';

export type DocWithMarkdown<TId extends string | number = number> = {
  id: TId;
  markdown: string;
};

const wikilinkPattern = /\[\[([^\]#|]+)(#[^\]|]+)?(\|[^\]]+)?\]\]/g;

function replaceWikilinksInLine(line: string, oldTitle: string, newTitle: string): string {
  return line.replace(wikilinkPattern, (match, name, anchor, display) => {
    if (String(name).trim() !== oldTitle) {
      return match;
    }
    const nextAnchor = anchor || '';
    const nextDisplay = display || '';
    return `[[${newTitle}${nextAnchor}${nextDisplay}]]`;
  });
}

function replaceWikilinksInContent(content: string, oldTitle: string, newTitle: string): string {
  const lines = content.split(/\r?\n/);
  let inFence = false;
  let fenceToken: string | null = null;

  const updated = lines.map((line) => {
    const fenceMatch = line.match(/^(\s*)(```|~~~)/);
    if (fenceMatch) {
      const token = fenceMatch[2];
      if (!inFence) {
        inFence = true;
        fenceToken = token;
      } else if (fenceToken === token) {
        inFence = false;
        fenceToken = null;
      }
      return line;
    }

    if (inFence) {
      return line;
    }

    return replaceWikilinksInLine(line, oldTitle, newTitle);
  });

  return updated.join('\n');
}

export function replaceWikilinksInMarkdown(markdown: string, oldTitle: string, newTitle: string): string {
  const { frontmatterRaw, content } = splitFrontmatter(markdown);
  const updatedContent = replaceWikilinksInContent(content, oldTitle, newTitle);
  return `${frontmatterRaw}${updatedContent}`;
}

export function refactorLinksOnRename<TId extends string | number = number>(
  documents: Array<DocWithMarkdown<TId>>,
  oldTitle: string,
  newTitle: string
): { updatedDocuments: Array<DocWithMarkdown<TId>>; updatedCount: number } {
  let updatedCount = 0;
  const updatedDocuments = documents.map((doc) => {
    const nextMarkdown = replaceWikilinksInMarkdown(doc.markdown, oldTitle, newTitle);
    if (nextMarkdown !== doc.markdown) {
      updatedCount += 1;
      return { ...doc, markdown: nextMarkdown };
    }
    return doc;
  });

  return { updatedDocuments, updatedCount };
}
