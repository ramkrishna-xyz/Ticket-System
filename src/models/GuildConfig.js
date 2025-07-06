const mongoose = require('mongoose');

const guildConfigSchema = new mongoose.Schema({
    guildId: {
        type: String,
        required: true,
        unique: true
    },
    ticketChannelId: {
        type: String,
        required: true
    },
    ticketCategoryId: {
        type: String,
        required: true
    },
    logsChannelId: {
        type: String,
        required: true
    },
    transcriptsChannelId: {
        type: String,
        required: true
    },
    supportRoleId: {
        type: String,
        required: true
    },
    staffRoles: [{
        type: String
    }],
    staffMembers: [{
        type: String
    }],
    ratingChannelId: {
        type: String,
        required: true
    },
    lastTicketNumber: {
        type: Number,
        default: 0
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

// Update the updatedAt timestamp before saving
guildConfigSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

module.exports = mongoose.model('GuildConfig', guildConfigSchema);
