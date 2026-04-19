export const validateRequest = (req, res, next) => {
  const { query, sessionId } = req.body;

  if (!query || !query.trim()) {
    return res.status(400).json({ error: 'query is required and cannot be empty' });
  }

  if (!sessionId || !sessionId.trim()) {
    return res.status(400).json({ error: 'sessionId is required' });
  }

  next();
};
