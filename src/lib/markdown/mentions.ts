import { splitFrontmatter } from './frontmatter';

export type TitleMention = {
  title: string;
  index: number;
};

function stripCodeBlocks(content: string): string {
  return content
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`]+`/g, '');
}

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function extractTitleMentions(markdown: string, titles: string[]): TitleMention[] {
  if (titles.length === 0) return [];

  const { content } = splitFrontmatter(markdown);
  const plain = stripCodeBlocks(content);
  const mentions: TitleMention[] = [];

  for (const title of titles) {
    if (!title.trim()) continue;
    const escaped = escapeRegex(title);
    const regex = new RegExp(`(^|[^A-Za-z0-9_])(${escaped})(?=[^A-Za-z0-9_]|$)`, 'gi');
    let match: RegExpExecArray | null;

    while ((match = regex.exec(plain)) !== null) {
      const offset = match[1]?.length ?? 0;
      const index = match.index + offset;
      mentions.push({ title, index });
    }
  }

  return mentions;
}
