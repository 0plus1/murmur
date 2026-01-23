import { parseFrontmatter } from './frontmatter';

export type HeadingAnchor = {
  level: number;
  text: string;
  anchor: string;
};

const headingRegex = /^(#{1,6})\s+(.+)$/gm;

function slugify(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ł/g, 'l')
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function extractHeadingsAndAnchors(markdown: string): HeadingAnchor[] {
  const result = parseFrontmatter(markdown);
  const content = result.value.content;
  const headings: HeadingAnchor[] = [];
  const anchorCounts = new Map<string, number>();
  let match: RegExpExecArray | null;

  while ((match = headingRegex.exec(content)) !== null) {
    const level = match[1].length;
    const text = match[2].trim();
    if (!text) continue;

    const baseAnchor = slugify(text);
    const count = anchorCounts.get(baseAnchor) ?? 0;
    const anchor = count > 0 ? `${baseAnchor}-${count + 1}` : baseAnchor;

    anchorCounts.set(baseAnchor, count + 1);
    headings.push({ level, text, anchor });
  }

  return headings;
}
