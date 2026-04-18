import { v4 as uuidv4 } from 'uuid';
import Session from '../models/Session.model.js';

export const createSession = async (req, res, next) => {
  try {
    const { patientContext } = req.body;
    const session = await Session.create({
      sessionId: uuidv4(),
      patientContext: patientContext || {},
      messages: []
    });
    res.status(201).json({ sessionId: session.sessionId });
  } catch (err) { next(err); }
};

export const getSession = async (req, res, next) => {
  try {
    const session = await Session.findOne({ sessionId: req.params.id });
    if (!session) return res.status(404).json({ error: 'Session not found' });
    res.json(session);
  } catch (err) { next(err); }
};

export const appendMessage = async (req, res, next) => {
  try {
    const { role, content, sources } = req.body;
    const session = await Session.findOneAndUpdate(
      { sessionId: req.params.id },
      { $push: { messages: { role, content, sources, timestamp: new Date() } } },
      { new: true }
    );
    res.json({ ok: true, count: session.messages.length });
  } catch (err) { next(err); }
};

export const deleteSession = async (req, res, next) => {
  try {
    await Session.deleteOne({ sessionId: req.params.id });
    res.json({ ok: true });
  } catch (err) { next(err); }
};