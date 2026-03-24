export function sanitizeFilename(name) {
  return (
    name
      ?.replace(/[<>:"/\\|?*]/g, '-')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 100) || 'untitled'
  );
}

export function buildProjectFolderName(project) {
  return `${sanitizeFilename(project.name)}-${project.id}`;
}

export function buildDocumentFilename(doc, titleOverride) {
  if (doc?.type === 'narrative_spine') {
    return 'narrative-spine.md';
  }
  if (doc?.type === 'style_guide') {
    return 'style-guide.md';
  }
  if (doc?.type === 'story_compass') {
    return 'story-compass.md';
  }
  if (doc?.type === 'emotional_arc') {
    return 'emotional-arc.md';
  }

  const title = titleOverride ?? doc.title;
  return `${sanitizeFilename(title)}-${doc.id}.md`;
}
