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
      content = `# ${title}\n\n## Description\n\nExplain the theme and its significance to the story.\n\n## Key Scenes\n\n\n## Character Connections\n\n`;
      break;
    case 'narrative_spine':
      content = `# ${title}\n\n## Core Premise\n\nSummarize the core premise in one clear paragraph.\n\n## Throughline\n\nDescribe the narrative throughline across beginning, middle, and end.\n\n## Act Beats\n\n### Act I\n\n\n### Act II\n\n\n### Act III\n\n\n## Emotional Arc\n\nTrack the emotional movement of the story.\n\n## Stakes and Consequences\n\nClarify what is at risk and how stakes escalate.\n\n`;
      break;
    case 'style_guide':
      content = `# ${title}\n\n## Voice and Tone\n\nDefine the voice and tonal range for the manuscript.\n\n## Pacing\n\nDescribe pacing expectations scene to scene.\n\n## World Rules\n\nList the narrative and worldbuilding rules that must stay consistent.\n\n## Things to Avoid\n\nNote cliches, habits, or tonal moves to avoid.\n\n## Reference Works\n\nCapture useful comparison points or touchstones.\n\n`;
      break;
    case 'story_compass':
      content = `# ${title}\n\n## North Star\n\nState the clearest expression of what this story is trying to do.\n\n## Promise to the Reader\n\nWhat emotional or narrative promise should every chapter keep serving?\n\n## Core Questions\n\nWhat central questions drive the story forward?\n\n## Boundaries\n\nWhat should this story avoid becoming?\n\n## Success Criteria\n\nHow will you know this draft is aligned with the intended story?\n\n`;
      break;
    case 'emotional_arc':
      content = `# ${title}\n\n## Baseline\n\nWhere does the story begin emotionally?\n\n## Escalation\n\nHow should the emotional pressure build across the draft?\n\n## Midpoint Shift\n\nDescribe the central emotional turn.\n\n## Late-Stage Fracture\n\nWhat breaks, deepens, or clarifies near the end?\n\n## Final Emotional State\n\nWhere should the story leave the reader and the main characters emotionally?\n\n`;
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
