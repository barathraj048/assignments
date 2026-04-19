// server/src/services/llmService.js
import axios from 'axios';

const OLLAMA_URL   = process.env.OLLAMA_URL   || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3';

export const buildPrompt = (userMessage, patientContext, publications, trials, history = []) => {

  const pubContext = publications.map((p, i) => `
[PUB ${i + 1}] ${p.title}
Authors: ${p.authors?.join(', ') || 'Unknown'} | Year: ${p.year} | Source: ${p.source}
Abstract: ${(p.abstract || '').slice(0, 400)}...
URL: ${p.url}
`).join('\n');

  const trialContext = trials.map((t, i) => `
[TRIAL ${i + 1}] ${t.title}
Status: ${t.status} | Location: ${t.location}
Eligibility: ${(t.eligibility || '').slice(0, 300)}...
Contact: ${t.contact} | URL: ${t.url}
`).join('\n');

  const historyText = history
    .slice(-4)
    .map(m => `${m.role.toUpperCase()}: ${m.content}`)
    .join('\n');

  const systemPrompt = `You are Curalink, an AI medical research assistant.
Patient: ${patientContext.name || 'User'} | Condition: ${patientContext.disease} | Location: ${patientContext.location || 'Not specified'}

RESEARCH PUBLICATIONS:
${pubContext || 'No publications retrieved.'}

CLINICAL TRIALS:
${trialContext || 'No trials retrieved.'}

CONVERSATION HISTORY:
${historyText || 'None'}

STRICT RULES:
- Only use the provided research. Never invent facts or statistics.
- Always cite publications inline using [PUB 1], [PUB 2] etc.
- If the research does not cover a claim, say so explicitly.
- Personalise every answer to the patient's specific condition.
- Never give direct medical advice — frame everything as research guidance.

Respond in EXACTLY this format with no deviations:

##OVERVIEW##
[2-3 sentences summarising the condition relevant to the query]

##INSIGHTS##
[Key findings from publications with inline citations like [PUB 1]]

##TRIALS##
[Summary of relevant clinical trials with their status]

##RECOMMENDATION##
[Evidence-based next steps for further research — not direct medical advice]`;

  return { systemPrompt, userMessage };
};

export const queryOllama = async ({ systemPrompt, userMessage }) => {
  const { data } = await axios.post(
    `${OLLAMA_URL}/api/generate`,
    {
      model:  OLLAMA_MODEL,
      prompt: `${systemPrompt}\n\nUSER QUERY: ${userMessage}`,
      stream: false,
      options: {
        temperature: 0.3,   // low = factual, not creative
        num_predict: 1200,  // max tokens in response
      },
    },
    { timeout: 120000 }     // 2 min timeout for local models
  );
  return data.response || '';
};
