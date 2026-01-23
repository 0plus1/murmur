import { describe, expect, it } from 'vitest';
import { buildIndexForProject } from '@/lib/reindexer/indexer';

describe('buildIndexForProject', () => {
  it('derives links, entities, word counts, and backlinks deterministically', () => {
    const documents = [
      {
        id: 1,
        title: 'Chapter One',
        type: 'chapter',
        markdown: '# Chapter One\n\nMentions Character A and Theme Alpha.',
      },
      {
        id: 2,
        title: 'Character A',
        type: 'character',
        markdown: '# Character A\n\nBio here.',
      },
      {
        id: 3,
        title: 'Theme Alpha',
        type: 'theme',
        markdown: '# Theme Alpha\n\nNotes here.',
      },
    ];

    const index = buildIndexForProject(documents);

    expect(index.links).toHaveLength(2);
    expect(index.entities).toHaveLength(2);
    expect(index.wordCounts['1']).toBeGreaterThan(0);
    expect(index.links[0].targetDocId).toBe(2);
    expect(index.links[1].targetDocId).toBe(3);
    expect(index.backlinks['2']).toHaveLength(1);
  });
});
