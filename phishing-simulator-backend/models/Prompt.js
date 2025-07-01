const mongoose = require('mongoose');

const PromptSchema = new mongoose.Schema({
  scenario: {
    type: String,
    required: true
  },
  type: { // NEW: To store whether it was 'email' or 'sms'
    type: String,
    enum: ['email', 'sms'],
    required: true
  },
  aiGeneratedId: {
    type: String,
    required: true,
    unique: true
  },
  phishingType: { // e.g., 'Impersonation', 'Urgency'
    type: String,
    required: true
  },
  emailDetails: { // Only present if type is 'email'
    subject: { type: String },
    sender: { type: String },
    recipient: { type: String },
    body: { type: String },
    links: [{
      text: { type: String },
      url: { type: String },
      isPhishing: { type: Boolean }
    }],
    attachments: [{ type: String }]
  },
  smsDetails: { // NEW: Only present if type is 'sms'
    senderPhone: { type: String },
    recipientPhone: { type: String },
    message: { type: String },
    links: [{
      text: { type: String },
      url: { type: String },
      isPhishing: { type: Boolean }
    }]
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Prompt', PromptSchema);