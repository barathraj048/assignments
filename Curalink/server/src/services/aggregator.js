// server/src/services/aggregator.js

const normalizeTitle = (title = '') =>
  title.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();

const titleSimilarity = (a, b) => {
  const wordsA = new Set(normalizeTitle(a).split(/\s+/));
  const wordsB = new Set(normalizeTitle(b).split(/\s+/));
  const intersection = [...wordsA].filter(w => wordsB.has(w)).length;
  const union = new Set([...wordsA, ...wordsB]).size;
  return union === 0 ? 0 : intersection / union;
};

const deduplicatePublications = (publications) => {
  const unique = [];
  publications.forEach(pub => {
    const isDuplicate = unique.some(
      u => titleSimilarity(u.title, pub.title) > 0.8
    );
    if (!isDuplicate) unique.push(pub);
  });
  return unique;
};

const mergeResults = (pubmedResults, openalexResults, trials) => {
  // PubMed first — it has better structured abstracts
  const combined = [...pubmedResults, ...openalexResults];
  const publications = deduplicatePublications(combined);
  return { publications, trials };
};

module.exports = { mergeResults };