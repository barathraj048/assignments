// server/src/services/queryExpander.js
export const expandQuery = (disease, query, location = '') => {
  const base = query
    ? `${query} ${disease}`
    : disease;

  // PubMed: boolean AND syntax
  const pubmedQuery = query
    ? `(${query}[Title/Abstract]) AND (${disease}[Title/Abstract])`
    : `${disease}[Title/Abstract]`;

  // OpenAlex: plain text search works best
  const openalexQuery = base.trim().replace(/\s+/g, '+');

  // ClinicalTrials: disease is the condition field
  const trialsQuery = {
    condition: disease,
    term: query || disease,
    location: location || ''
  };

  return { base, pubmedQuery, openalexQuery, trialsQuery };
};
