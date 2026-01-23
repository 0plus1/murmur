import { parseFrontmatter } from './frontmatter';

export type Wikilink = {
  raw: string;
  text: string;
  anchor: string | null;
  displayText: string | null;
};

const wikilinkRegex = /\[\[([^\[\]#|]+)(?:#([^\]|]+))?(?:\|([^\]]+))?\]\]/g;

export function extractWikilinks(markdown: string): Wikilink[] {
  const result = parseFrontmatter(markdown);
  const content = result.value.content;
  const links: Wikilink[] = [];
  let match: RegExpExecArray | null;

  while ((match = wikilinkRegex.exec(content)) !== null) {
    const startIndex = match.index;
    if (startIndex > 0 && content[startIndex - 1] === '[') {
      continue;
    }
    const text = match[1].trim();
    if (!text) continue;
    links.push({
      raw: match[0],
      text,
      anchor: match[2]?.trim() || null,
      displayText: match[3]?.trim() || null,
    });
  }

  return links;
}
