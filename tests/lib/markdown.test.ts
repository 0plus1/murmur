import { describe, expect, it } from 'vitest';
import { parseFrontmatter, extractWikilinks, extractHeadingsAndAnchors } from '@/lib/markdown';
import frontmatterValid from '../fixtures/frontmatter-valid.md?raw';
import frontmatterMissing from '../fixtures/frontmatter-missing.md?raw';
import frontmatterMalformed from '../fixtures/frontmatter-malformed.md?raw';
import wikilinks from '../fixtures/wikilinks.md?raw';
import headingsFixture from '../fixtures/headings.md?raw';

describe('parseFrontmatter', () => {
  it('parses valid YAML frontmatter and preserves content', () => {
    const markdown = frontmatterValid;
    const result = parseFrontmatter(markdown);

    expect(result.ok).toBe(true);
    expect(result.value.frontmatter.title).toBe('Sample Doc');
    expect(result.value.content).toContain('# Heading');
  });

  it('handles missing frontmatter with defaults', () => {
    const markdown = frontmatterMissing;
    const result = parseFrontmatter(markdown);

    expect(result.ok).toBe(true);
    expect(result.value.frontmatter).toEqual({});
    expect(result.value.content).toContain('Just body content here.');
  });

  it('returns fallback on malformed YAML', () => {
    const markdown = frontmatterMalformed;
    const result = parseFrontmatter(markdown);

    expect(result.ok).toBe(false);
    expect(result.value.content).toBe(markdown);
  });
});

describe('extractWikilinks', () => {
  it('extracts wikilinks with anchors and display text', () => {
    const markdown = wikilinks;
    const links = extractWikilinks(markdown);

    expect(links.map((link) => link.text)).toEqual([
      'Name',
      'Doc',
      'Doc',
      'Name With Spaces',
    ]);
    expect(links[1].anchor).toBe('Heading');
    expect(links[2].displayText).toBe('Display Text');
  });
});

describe('extractHeadingsAndAnchors', () => {
  it('creates anchors and handles duplicates and non-latin characters', () => {
    const markdown = headingsFixture;
    const headingItems = extractHeadingsAndAnchors(markdown);

    expect(headingItems.map((heading) => heading.anchor)).toEqual([
      'hello-world',
      'hello-world-2',
      'zazolc-gesla-jazn',
      '中文-标题',
      'hello-world-3',
    ]);
  });
});
