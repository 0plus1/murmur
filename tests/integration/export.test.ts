import { describe, expect, it, beforeEach } from 'vitest';
import JSZip from 'jszip';
import { createProject, createDocument, db } from '@/lib/db';
import { exportProjectAsZip } from '@/lib/export';

describe('exportProjectAsZip', () => {
  beforeEach(async () => {
    await db.delete();
    await db.open();
  });

  it('exports the expected folder structure and filenames', async () => {
    const projectId = await createProject('Test Project');

    await createDocument(projectId, {
      type: 'chapter',
      title: 'Chapter 1',
      markdown: '# Chapter 1\n\nContent',
    });
    await createDocument(projectId, {
      type: 'character',
      title: 'Alice',
      markdown: '# Alice\n\nBio',
    });
    await createDocument(projectId, {
      type: 'note',
      title: 'Scratch Pad',
      markdown: '# Scratch Pad\n\nNotes',
    });

    const { blob } = await exportProjectAsZip(projectId);
    const zip = await JSZip.loadAsync(blob);

    expect(zip.file('project.json')).toBeTruthy();
    expect(zip.file('manuscript/chapters/Chapter-1.md')).toBeTruthy();
    expect(zip.file('bible/characters/Alice.md')).toBeTruthy();
    expect(zip.file('notes/Scratch-Pad.md')).toBeTruthy();
  });
});
