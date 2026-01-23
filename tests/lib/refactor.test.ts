import { describe, expect, it } from 'vitest';
import { refactorLinksOnRename } from '@/lib/markdown';
import refactorFixture from '../fixtures/refactor.md?raw';

describe('refactorLinksOnRename', () => {
  it('renames wikilinks without touching frontmatter or code blocks', () => {
    const markdown = refactorFixture;
    const docs = [{ id: 1, markdown }];

    const result = refactorLinksOnRename(docs, 'Old Title', 'New Title');

    expect(result.updatedCount).toBe(1);
    expect(result.updatedDocuments[0].markdown).toContain('[[New Title]]');
    expect(result.updatedDocuments[0].markdown).toContain('[[New Title#Section]]');
    expect(result.updatedDocuments[0].markdown).toContain('title: Old Title');
    expect(result.updatedDocuments[0].markdown).toContain('Code block with [[Old Title]]');
  });
});
