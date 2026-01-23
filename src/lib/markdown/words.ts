import { parseFrontmatter } from './frontmatter';

export function countWords(markdown: string): number {
  const result = parseFrontmatter(markdown);
  const content = result.value.content;
  const text = content
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`]+`/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\[\[([^\]]+)\]\]/g, '$1')
    .replace(/#+\s+/g, '')
    .replace(/[*_~`]/g, '')
    .replace(/\n+/g, ' ')
    .trim();

  if (!text) return 0;
  return text.split(/\s+/).filter((word) => word.length > 0).length;
}
