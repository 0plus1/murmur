import matter from 'gray-matter';

export type Result<T> =
  | { ok: true; value: T }
  | { ok: false; error: Error; value: T };

export type FrontmatterParse = {
  frontmatter: Record<string, unknown>;
  content: string;
};

export function parseFrontmatter(markdown: string): Result<FrontmatterParse> {
  try {
    const { data, content } = matter(markdown);
    return { ok: true, value: { frontmatter: data, content } };
  } catch (error) {
    const fallback = { frontmatter: {}, content: markdown };
    return { ok: false, error: error instanceof Error ? error : new Error(String(error)), value: fallback };
  }
}

export function generateMarkdown(frontmatter: Record<string, unknown>, content: string): string {
  return matter.stringify(content, frontmatter);
}

export function splitFrontmatter(markdown: string): { frontmatterRaw: string; content: string } {
  if (!markdown.startsWith('---')) {
    return { frontmatterRaw: '', content: markdown };
  }

  const lines = markdown.split(/\r?\n/);
  let endIndex = -1;

  for (let i = 1; i < lines.length; i += 1) {
    const line = lines[i].trim();
    if (line === '---' || line === '...') {
      endIndex = i;
      break;
    }
  }

  if (endIndex === -1) {
    return { frontmatterRaw: '', content: markdown };
  }

  const frontmatterRaw = `${lines.slice(0, endIndex + 1).join('\n')}\n`;
  const content = lines.slice(endIndex + 1).join('\n');

  return { frontmatterRaw, content };
}
