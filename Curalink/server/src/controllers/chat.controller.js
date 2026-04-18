import { expandQuery }          from '../services/queryExpander.js';
import { getPubMedPublications } from '../services/pubmedService.js';
import { fetchOpenAlexWorks }    from '../services/openalexService.js';
import { fetchClinicalTrials }   from '../services/trialsService.js';
import { mergeResults, rankPublications, rankTrials } from '../services/aggregator.js';
import { buildPrompt, queryOllama } from '../services/llmService.js';
import { buildStructuredResponse } from '../services/responseBuilder.js';
import Session          from '../models/Session.model.js';
import ResearchCache     from '../models/ResearchCache.model.js';
import crypto            from 'crypto';

export const chat = async (req, res, next) => {
  try {
    const { query, sessionId } = req.body;

    // 1. Load session
    const session = await Session.findOne({ sessionId });
    if (!session) return res.status(404).json({ error: 'Session not found' });
    const { patientContext, messages } = session;

    // 2. Expand query
    const expanded = expandQuery(patientContext.disease, query);
    const qHash = crypto.createHash('md5')
                         .update(expanded.expandedQuery).digest('hex');

    // 3. Check cache
    let publications, trials;
    const cached = await ResearchCache.findOne({ queryHash: qHash });

    if (cached) {
      ({ publications, trials } = cached);
    } else {
      // 4. Parallel fetch
      const [pubmed, openAlex, rawTrials] = await Promise.all([
        getPubMedPublications(expanded.pubmedQuery),
        fetchOpenAlexWorks(expanded.openalexQuery),
        fetchClinicalTrials(patientContext.disease, query, patientContext.location)
      ]);

      // 5. Merge, dedup, rank
      const merged = mergeResults(pubmed, openAlex, rawTrials);
      publications = rankPublications(merged.publications, expanded.expandedQuery);
      trials       = rankTrials(merged.trials, patientContext.disease, patientContext.location);

      // 6. Cache results
      await ResearchCache.create({
        queryHash: qHash, publications, trials,
        fetchedAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      });
    }

    // 7. Build prompt + call LLM
    const prompt = buildPrompt(query, patientContext, publications, trials, messages);
    const llmOutput = await queryOllama(prompt);

    // 8. Structure response
    const structured = buildStructuredResponse(llmOutput, publications, trials);

    // 9. Save to session
    await Session.findOneAndUpdate({ sessionId }, {
      $push: {
        messages: {
          $each: [
            { role: 'user',      content: query,          timestamp: new Date() },
            { role: 'assistant', content: structured.raw, timestamp: new Date(), sources: structured.sources }
          ]
        }
      }
    });

    res.json(structured);
  } catch (err) { next(err); }
};