// server/src/models/User.model.js
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  name:           { type: String, default: 'Anonymous' },
  primaryDisease: { type: String, default: '' },
  location:       { type: String, default: '' },
  preferences: {
    responseDetail: {
      type: String,
      enum: ['simple', 'detailed'],
      default: 'detailed'
    }
  },
  sessionIds: [{ type: String }]
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);