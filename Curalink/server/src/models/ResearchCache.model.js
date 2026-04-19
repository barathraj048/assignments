// server/src/models/ResearchCache.model.js
import mongoose from 'mongoose';

const PublicationSchema = new mongoose.Schema({
  title:    String,
  abstract: String,
  authors:  [String],
  year:     Number,
  source:   String, // 'pubmed' or 'openalex'
  url:      String,
  score:    Number  // relevance score from ranker
}, { _id: false });

const TrialSchema = new mongoose.Schema({
  title:       String,
  status:      String,
  eligibility: String,
  location:    String,
  contact:     String,
  url:         String
}, { _id: false });

const CacheSchema = new mongoose.Schema({
  queryHash:    { type: String, required: true, unique: true, index: true },
  publications: [PublicationSchema],
  trials:       [TrialSchema],
  fetchedAt:    { type: Date, default: Date.now },
  expiresAt:    { type: Date, required: true, index: { expires: 0 } }
  // ↑ TTL index: MongoDB deletes doc when expiresAt is reached
});

export default mongoose.model('ResearchCache', CacheSchema);
