const mongoose = require('mongoose');

const ticketRatingSchema = new mongoose.Schema({
    guildId: { type: String, required: true },
    ticketId: { type: String, required: true },
    ticketNumber: { type: Number, required: true },
    userId: { type: String, required: true },
    supportUserId: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    feedback: { type: String },
    createdAt: { type: Date, default: Date.now }
});

ticketRatingSchema.index({ ticketId: 1 }, { unique: true });

module.exports = mongoose.model('TicketRating', ticketRatingSchema);
