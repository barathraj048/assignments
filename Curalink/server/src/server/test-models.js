import 'dotenv/config';
import mongoose from 'mongoose';
import Session from '../models/Session.model.js';
import User from '../models/User.model.js';
import Cache from '../models/ResearchCache.model.js';

async function test() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected');

  // 1. Test Session
  const session = await Session.create({
    sessionId: 'test-123',
    patientContext: { disease: 'Parkinson', name: 'John' },
    messages: [{ role: 'user', content: 'test message' }]
  });
  console.log('Session saved:', session.sessionId);

  // 2. Test User
  const user = await User.create({
    userId: 'user-456',
    name: 'John Smith',
    primaryDisease: 'Parkinson'
  });
  console.log('User saved:', user.name);

  // 3. Test Cache (expires in 1 min for testing)
  const cache = await Cache.create({
    queryHash: 'abc123',
    publications: [],
    trials: [],
    expiresAt: new Date(Date.now() + 60000)
  });
  console.log('Cache saved, expires:', cache.expiresAt);

  // Cleanup
  await Session.deleteOne({ sessionId: 'test-123' });
  await User.deleteOne({ userId: 'user-456' });
  await Cache.deleteOne({ queryHash: 'abc123' });
  console.log('All cleaned up. Phase 2 DONE!');

  mongoose.disconnect();
}

test().catch(console.error);
