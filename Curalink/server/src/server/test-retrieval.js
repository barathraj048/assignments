// server/test-retrieval.js  (delete after testing)
require('dotenv').config();
const { expandQuery }          = require('../services/queryExpander');
const { getPubMedPublications } = require('../services/pubmedService');
const { getOpenAlexPublications } = require('../services/openalexService');
const { getClinicalTrials }     = require('../services/trialsService');

const run = async () => {
  const { pubmedQuery, openalexQuery, trialsQuery } =
    expandQuery("Parkinson's disease", "deep brain stimulation");

  console.log('Fetching all 3 sources in parallel...');
  const [pubmed, openalex, trials] = await Promise.all([
    getPubMedPublications(pubmedQuery, 20),
    getOpenAlexPublications(openalexQuery),
    getClinicalTrials(trialsQuery, 10)
  ]);

  console.log(`PubMed:       ${pubmed.length} results`);
  console.log(`OpenAlex:     ${openalex.length} results`);
  console.log(`Clinical trials: ${trials.length} results`);

  console.log('--- Sample PubMed ---');
  console.log(pubmed[0]);

  console.log('--- Sample Trial ---');
  console.log(trials[0]);

  console.log('--- Phase 3 DONE. All 3 services working ---');
};

run().catch(console.error);