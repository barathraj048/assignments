// server/src/services/responseBuilder.js

const extractSection = (text, tag) => {
  const regex = new RegExp(`##${tag}##\\s*([\\s\\S]*?)(?=##[A-Z]+##|$)`);
  const match = text.match(regex);
  return match ? match[1].trim() : '';
};

const formatSource = (pub) => ({
  title:   pub.title   || 'Untitled',
  authors: pub.authors?.join(', ') || 'Unknown',
  year:    pub.year    || 'N/A',
  source:  pub.source  || 'unknown',
  url:     pub.url     || '',
  snippet: (pub.abstract || '').slice(0, 200) + '...',
});

const buildStructuredResponse = (llmOutput, publications, trials) => {
  const overview       = extractSection(llmOutput, 'OVERVIEW');
  const insights       = extractSection(llmOutput, 'INSIGHTS');
  const trialsSection  = extractSection(llmOutput, 'TRIALS');
  const recommendation = extractSection(llmOutput, 'RECOMMENDATION');

  // Fallback: if LLM ignored the format markers, return raw output
  if (!overview && !insights) {
    return {
      overview:       llmOutput,
      insights:       '',
      trialsSection:  '',
      recommendation: '',
      sources:        publications.map(formatSource),
      trials,
    };
  }

  return {
    overview,
    insights,
    trialsSection,
    recommendation,
    sources: publications.map(formatSource),
    trials,
  };
};

module.exports = { buildStructuredResponse };