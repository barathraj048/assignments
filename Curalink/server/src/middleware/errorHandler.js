export const errorHandler = (err, req, res, next) => {
  console.error(`[ERROR] ${req.method} ${req.path}:`, err.message);

  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: err.message });
  }

  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

// End-to-end test — run all 4 demo queries
// 1. Create session first:
// curl -X POST /api/session -d '{"patientContext":{"disease":"Parkinson's","location":"Chennai"}}'

// 2. Run these 4 queries with that sessionId:
const demoQueries = [
  "What are the latest treatments for Parkinson's disease?",
  "Are there any clinical trials for deep brain stimulation near Chennai?",
  "What does recent research say about neuroprotective therapy?",
  "Summarize what we've discussed so far"  // tests memory
];
