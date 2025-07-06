const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
    guildId: {
        type: String,
        required: true
    },
    channelId: {
        type: String,
        required: true
    },
    ticketNumber: {
        type: Number,
        required: true
    },
    userId: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['open', 'closed'],
        default: 'open'
    },
    subject: {
        type: String,
        default: 'No subject provided'
    },
    category: {
        type: String,
        default: 'General Support'
    },
    assignedTo: {
        type: String,
        default: null
    },
    closedBy: {
        type: String,
        default: null
    },
    closedAt: {
        type: Date,
        default: null
    },
    closeReason: {
        type: String,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update updatedAt timestamp before saving
ticketSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

module.exports = mongoose.model('Ticket', ticketSchema);
