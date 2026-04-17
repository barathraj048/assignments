
// server/src/models/Session.model.js
const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant'],
    required: true
  },
  content:   { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  sources:   [{ type: mongoose.Schema.Types.Mixed }]
});

const SessionSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  patientContext: {
    name:           { type: String, default: '' },
    disease:        { type: String, required: true },
    location:       { type: String, default: '' },
    additionalInfo: { type: String, default: '' }
  },
  messages: [MessageSchema]
}, { timestamps: true });

module.exports = mongoose.model('Session', SessionSchema);