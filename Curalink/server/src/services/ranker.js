// server/src/services/ranker.js

const CURRENT_YEAR = new Date().getFullYear();

const scorePublication = (pub, queryTerms) => {
  // 1. Recency: full score for current year, -5 per year back, min 0
  const recency = Math.max(0, 50 - (CURRENT_YEAR - (pub.year || 2000)) * 5);

  // 2. Keyword match across title + abstract
  const text = ((pub.title || '') + ' ' + (pub.abstract || '')).toLowerCase();
  const matches = queryTerms.filter(t => text.includes(t.toLowerCase())).length;
  const keyword = queryTerms.length > 0
    ? (matches / queryTerms.length) * 40
    : 20;

  // 3. Abstract quality: reward having a real abstract
  const quality = (pub.abstract?.length || 0) > 100 ? 10 : 0;

  return recency + keyword + quality;
};

const STATUS_SCORE = {
  RECRUITING:               100,
  ACTIVE_NOT_RECRUITING:     80,
  COMPLETED:                 60,
  ENROLLING_BY_INVITATION:   50,
  NOT_YET_RECRUITING:        40,
  TERMINATED:                10,
};

export const rankPublications = (publications, query) => {
  const terms = query.toLowerCase().split(/\s+/).filter(t => t.length > 3);
  return publications
    .map(pub => ({ ...pub, score: scorePublication(pub, terms) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);
};

export const rankTrials = (trials, disease) => {
  const diseaseLower = disease.toLowerCase();
  return trials
    .map(trial => ({
      ...trial,
      score: (STATUS_SCORE[trial.status] || 0) +
        (trial.title?.toLowerCase().includes(diseaseLower) ? 20 : 0)
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);
};
