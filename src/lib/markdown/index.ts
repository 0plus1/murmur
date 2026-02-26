export { parseFrontmatter, generateMarkdown, splitFrontmatter } from './frontmatter';
export { extractWikilinks } from './wikilinks';
export { extractHeadingsAndAnchors } from './headings';
export { extractHeadingsAndAnchors as extractHeadings } from './headings';
export { countWords } from './words';
export { createDocumentMarkdown, getTitle, updateTitle, updateStatus } from './documents';
export { replaceWikilinksInMarkdown, refactorLinksOnRename } from './links';
export { extractTitleMentions } from './mentions';

export type { Result, FrontmatterParse } from './frontmatter';
export type { Wikilink } from './wikilinks';
export type { HeadingAnchor } from './headings';
export type { TitleMention } from './mentions';
