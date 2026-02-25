import { countWords } from '@/lib/markdown';

const MANUSCRIPT_TYPES = new Set(['chapter', 'scene']);
const DEFAULT_A5_WORDS_PER_PAGE = 250;
const DEFAULT_READING_WORDS_PER_MINUTE = 200;

function getDocumentWordCount(doc) {
  if (!doc) return 0;
  if (typeof doc.wordCount === 'number') return doc.wordCount;
  return countWords(doc.markdown || '');
}

export function isManuscriptDocument(doc) {
  return MANUSCRIPT_TYPES.has(doc?.type);
}

export function getManuscriptWordCount(documents = []) {
  return documents.reduce((total, doc) => {
    if (!isManuscriptDocument(doc)) return total;
    return total + getDocumentWordCount(doc);
  }, 0);
}

export function estimateA5PagesFromWords(words, wordsPerPage = DEFAULT_A5_WORDS_PER_PAGE) {
  if (!words) return 0;
  return Math.max(1, Math.ceil(words / wordsPerPage));
}

export function estimateReadingMinutesFromWords(words, wordsPerMinute = DEFAULT_READING_WORDS_PER_MINUTE) {
  if (!words) return 0;
  return Math.max(1, Math.ceil(words / wordsPerMinute));
}

export function formatReadingTime(minutes) {
  if (!minutes) return '0 min';
  if (minutes < 60) return `${minutes} min`;

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0) return `${hours}h`;
  return `${hours}h ${remainingMinutes}m`;
}

