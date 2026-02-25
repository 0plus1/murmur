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
  const title = titleOverride ?? doc.title;
  return `${sanitizeFilename(title)}-${doc.id}.md`;
}
