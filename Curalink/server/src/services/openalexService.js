// server/src/services/openalexService.js
const axios = require('axios');

const BASE = 'https://api.openalex.org/works';

const normalizeWork = (work) => ({
  title:    work.title || '',
  abstract: work.abstract_inverted_index
    ? invertedIndexToText(work.abstract_inverted_index)
    : '',
  authors:  (work.authorships || [])
    .slice(0, 3)
    .map(a => a.author?.display_name || ''),
  year:     work.publication_year || 0,
  source:   'openalex',
  url:      work.primary_location?.landing_page_url
            || work.id
            || ''
});

const invertedIndexToText = (index) => {
  if (!index) return '';
  const words = [];
  Object.entries(index).forEach(([word, positions]) => {
    positions.forEach(pos => { words[pos] = word; });
  });
  return words.filter(Boolean).join(' ');
};

const fetchPage = async (query, page) => {
  const url = `${BASE}?search=${encodeURIComponent(query)}&per-page=100&page=${page}&sort=relevance_score:desc&filter=from_publication_date:2018-01-01`;
  const { data } = await axios.get(url, {
    headers: { 'User-Agent': 'Curalink/1.0 (mailto:your@email.com)' }
  });
  return (data.results || []).map(normalizeWork);
};

const getOpenAlexPublications = async (query) => {
  const [page1, page2] = await Promise.all([
    fetchPage(query, 1),
    fetchPage(query, 2)
  ]);
  return [...page1, ...page2];
};

module.exports = { getOpenAlexPublications };