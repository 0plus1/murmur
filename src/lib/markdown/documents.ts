import { v4 as uuidv4 } from 'uuid';
import { generateMarkdown, parseFrontmatter } from './frontmatter';

export function createDocumentMarkdown(type: string, title: string, status = 'draft'): string {
  const frontmatter = {
    id: uuidv4(),
    type,
    title,
    status,
    order: 0,
    updated_at: new Date().toISOString(),
  };

  let content = '';

  switch (type) {
    case 'chapter':
      content = `# ${title}\n\nStart writing your chapter here...\n`;
      break;
    case 'scene':
      content = `# ${title}\n\nDescribe the scene...\n`;
      break;
    case 'character':
      content = `# ${title}\n\n## Overview\n\nBrief description of the character.\n\n## Physical Description\n\n\n## Personality\n\n\n## Background\n\n\n## Goals & Motivations\n\n`;
      break;
    case 'location':
      content = `# ${title}\n\n## Overview\n\nBrief description of the location.\n\n## Atmosphere\n\n\n## Key Features\n\n\n## History\n\n`;
      break;
    case 'theme':
      if (title.toLowerCase().includes('style guide')) {
        content = `# ${title}\n\n## Voice and Tone\n\nVoice and tone for the story.\n\n## Pacing\n\n\n## World Rules\n\n\n## Things to Avoid\n\n\n## Reference Works\n\n`;
      } else {
        content = `# ${title}\n\n## Description\n\nExplain the theme and its significance to the story.\n\n## Key Scenes\n\n\n## Character Connections\n\n`;
      }
      break;
    case 'note':
      content = `# ${title}\n\nYour notes here...\n`;
      break;
    default:
      content = `# ${title}\n\n`;
  }

  return generateMarkdown(frontmatter, content);
}

export function getTitle(markdown: string): string {
  const result = parseFrontmatter(markdown);
  const { frontmatter, content } = result.value;

  if (typeof frontmatter.title === 'string' && frontmatter.title) {
    return frontmatter.title;
  }

  const match = content.match(/^#\s+(.+)$/m);
  if (match) {
    return match[1].trim();
  }

  return 'Untitled';
}

export function updateTitle(markdown: string, newTitle: string): string {
  const result = parseFrontmatter(markdown);
  const { frontmatter, content } = result.value;
  const updated = { ...frontmatter, title: newTitle, updated_at: new Date().toISOString() };
  const nextContent = content.replace(/^(#\s+).+$/m, `$1${newTitle}`);
  return generateMarkdown(updated, nextContent);
}

export function updateStatus(markdown: string, newStatus: string | null): string {
  const result = parseFrontmatter(markdown);
  const { frontmatter, content } = result.value;
  const updated = { ...frontmatter, status: newStatus, updated_at: new Date().toISOString() };
  return generateMarkdown(updated, content);
}
