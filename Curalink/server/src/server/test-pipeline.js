// server/test-pipeline.js  — DELETE after testing
import 'dotenv/config';

import { expandQuery } from '../services/queryExpander.js';
import { getPubMedPublications } from '../services/pubmedService.js';
import { getOpenAlexPublications } from '../services/openalexService.js';
import { getClinicalTrials } from '../services/trialsService.js';
import { mergeResults } from '../services/aggregator.js';
import { rankPublications, rankTrials } from '../services/ranker.js';
import { buildPrompt, queryOllama } from '../services/llmService.js';
import { buildStructuredResponse } from '../services/responseBuilder.js';

const run = async () => {
  const disease = "Parkinson's disease";
  const query   = "deep brain stimulation";
  const patient = { name: 'John Smith', disease, location: 'Toronto' };

  console.log('[1] Expanding query...');
  const expanded = expandQuery(disease, query, patient.location);
  console.log('    Expanded:', expanded.base);

  console.log('[2] Fetching from all 3 sources in parallel...');
  const [pubmed, openalex, rawTrials] = await Promise.all([
    getPubMedPublications(expanded.pubmedQuery, 30),
    getOpenAlexPublications(expanded.openalexQuery),
    getClinicalTrials(expanded.trialsQuery, 20),
  ]);
  console.log(`    Raw: ${pubmed.length} PubMed | ${openalex.length} OpenAlex | ${rawTrials.length} trials`);

  console.log('[3] Merging + deduplicating...');
  const { publications } = mergeResults(pubmed, openalex, rawTrials);
  console.log(`    After dedup: ${publications.length} unique publications`);

  console.log('[4] Ranking...');
  const topPubs   = rankPublications(publications, expanded.base);
  const topTrials = rankTrials(rawTrials, disease);
  console.log(`    Top ${topPubs.length} publications | Top ${topTrials.length} trials`);

  console.log('[5] Calling Ollama LLM — this may take 30–90 seconds...');
  const prompt    = buildPrompt(query, patient, topPubs, topTrials, []);
  const llmOutput = await queryOllama(prompt);
  console.log('    LLM responded, length:', llmOutput.length, 'chars');

  console.log('[6] Building structured response...');
  const response = buildStructuredResponse(llmOutput, topPubs, topTrials);

  console.log('\n========== FINAL RESPONSE ==========');
  console.log('OVERVIEW:\n',       response.overview?.slice(0, 300));
  console.log('\nINSIGHTS:\n',     response.insights?.slice(0, 300));
  console.log('\nTRIALS:\n',       response.trialsSection?.slice(0, 200));
  console.log('\nRECOMMENDATION:', response.recommendation?.slice(0, 200));
  console.log('\nSOURCES:',        response.sources?.length, 'cited');
  console.log('TRIALS COUNT:',     response.trials?.length, 'found');
  console.log('\nPhase 4 DONE. Full intelligence pipeline working.');
};

run().catch(console.error);
