const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const GuildConfig = require('../../models/GuildConfig');
const Ticket = require('../../models/Ticket');
const discordTranscripts = require('discord-html-transcripts');

const buttonHandlers = {
    'create_ticket': async (interaction) => {
        const modal = new ModalBuilder()
            .setCustomId('create_ticket_modal')
            .setTitle('Create a Support Ticket');

        const subjectInput = new TextInputBuilder()
            .setCustomId('ticketSubject')
            .setLabel('Ticket Subject')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Brief description of your issue')
            .setRequired(true)
            .setMaxLength(100);

        const descriptionInput = new TextInputBuilder()
            .setCustomId('ticketDescription')
            .setLabel('Description')
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder('Provide details about your issue...')
            .setRequired(true)
            .setMaxLength(1000);

        const categoryInput = new TextInputBuilder()
            .setCustomId('ticketCategory')
            .setLabel('Category')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('e.g., General Support, Bug Report, etc.')
            .setRequired(true)
            .setMaxLength(50);

        modal.addComponents(
            new ActionRowBuilder().addComponents(subjectInput),
            new ActionRowBuilder().addComponents(descriptionInput),
            new ActionRowBuilder().addComponents(categoryInput)
        );

        await interaction.showModal(modal);
    },

    'delete_ticket': async (interaction) => {
        const ticket = await Ticket.findOne({ channelId: interaction.channel.id, status: 'open' });
        if (!ticket) {
            return await interaction.reply({
                content: 'This ticket does not exist or is already closed.',
                ephemeral: true
            });
        }

        // Check if user has permission to close ticket
        const guildConfig = await GuildConfig.findOne({ guildId: interaction.guild.id });
        const hasPermission = interaction.member.roles.cache.has(guildConfig.supportRoleId) || 
                            interaction.user.id === ticket.userId;

        if (!hasPermission) {
            return await interaction.reply({
                content: 'You do not have permission to close this ticket.',
                ephemeral: true
            });
        }

        await interaction.deferReply({ ephemeral: true });

        // Generate transcript
        const transcript = await discordTranscripts.createTranscript(interaction.channel, {
            limit: -1,
            fileName: `ticket-${ticket.ticketNumber}.html`,
            saveImages: true,
            poweredBy: false
        });

        // Update ticket in database
        ticket.status = 'closed';
        ticket.closedBy = interaction.user.id;
        ticket.closedAt = new Date();
        await ticket.save();

        // Send transcript to transcripts channel
        const transcriptChannel = await interaction.guild.channels.fetch(guildConfig.transcriptsChannelId);
        if (transcriptChannel) {
            const logEmbed = new EmbedBuilder()
                .setTitle(`Ticket #${ticket.ticketNumber} Transcript`)
                .addFields(
                    { name: 'Subject', value: ticket.subject || 'N/A', inline: true },
                    { name: 'Category', value: ticket.category || 'N/A', inline: true },
                    { name: 'Created By', value: `<@${ticket.userId}>`, inline: true },
                    { name: 'Closed By', value: `${interaction.user}`, inline: true }
                )
                .setColor('#ff0000')
                .setTimestamp();

            await transcriptChannel.send({
                embeds: [logEmbed],
                files: [transcript]
            });
        }

        // Send confirmation
        await interaction.editReply({
            content: 'Ticket closed! The channel will be deleted in 5 seconds.',
            ephemeral: true
        });

        // Send transcript to user and rating request
        const creator = await interaction.client.users.fetch(ticket.userId);
        if (creator) {
            // Send transcript
            await creator.send({
                content: `Your ticket #${ticket.ticketNumber} has been closed by ${interaction.user.tag}`,
                files: [transcript]
            }).catch(() => console.log('Could not DM transcript to user'));

            // Send rating request
            const ratingRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('rate_1')
                        .setLabel('1⭐')
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId('rate_2')
                        .setLabel('2⭐')
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId('rate_3')
                        .setLabel('3⭐')
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId('rate_4')
                        .setLabel('4⭐')
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId('rate_5')
                        .setLabel('5⭐')
                        .setStyle(ButtonStyle.Secondary)
                );

            const ratingEmbed = new EmbedBuilder()
                .setTitle('Rate Your Support Experience')
                .setDescription(`How would you rate the support for ticket #${ticket.ticketNumber}?\nRate from 1-5 stars (1=poor, 5=excellent)`)
                .setColor('#00ff00')
                .setTimestamp();

            await creator.send({
                embeds: [ratingEmbed],
                components: [ratingRow]
            }).catch(() => console.log('Could not send rating request to user'));
        }

        // Delete channel after delay
        setTimeout(() => {
            interaction.channel.delete()
                .catch(error => console.error('Error deleting ticket channel:', error));
        }, 5000);
    },

    'claim_ticket': async (interaction) => {
        const ticket = await Ticket.findOne({ channelId: interaction.channel.id, status: 'open' });
        if (!ticket) {
            return await interaction.reply({
                content: 'This ticket does not exist or is already closed.',
                ephemeral: true
            });
        }

        // Check if user has support role
        const guildConfig = await GuildConfig.findOne({ guildId: interaction.guild.id });
        if (!interaction.member.roles.cache.has(guildConfig.supportRoleId)) {
            return await interaction.reply({
                content: 'Only support team members can claim tickets.',
                ephemeral: true
            });
        }

        if (ticket.assignedTo) {
            const assignee = await interaction.guild.members.fetch(ticket.assignedTo);
            return await interaction.reply({
                content: `This ticket is already claimed by ${assignee}.`,
                ephemeral: true
            });
        }

        ticket.assignedTo = interaction.user.id;
        await ticket.save();

        const embed = new EmbedBuilder()
            .setTitle('Ticket Claimed')
            .setDescription(`This ticket has been claimed by ${interaction.user}`)
            .setColor('#00ff00')
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });

        // Log claim in logs channel
        const logsChannel = await interaction.guild.channels.fetch(guildConfig.logsChannelId);
        if (logsChannel) {
            const logEmbed = new EmbedBuilder()
                .setTitle(`Ticket #${ticket.ticketNumber} Claimed`)
                .addFields(
                    { name: 'Ticket', value: `#${ticket.ticketNumber}`, inline: true },
                    { name: 'Claimed By', value: `${interaction.user}`, inline: true }
                )
                .setColor('#00ff00')
                .setTimestamp();

            await logsChannel.send({ embeds: [logEmbed] });
        }
    },

    'transcript_ticket': async (interaction) => {
        const ticket = await Ticket.findOne({ channelId: interaction.channel.id });
        if (!ticket) {
            return await interaction.reply({
                content: 'Could not find ticket information.',
                ephemeral: true
            });
        }

        // Check if user has permission to view transcript
        const guildConfig = await GuildConfig.findOne({ guildId: interaction.guild.id });
        const hasPermission = interaction.member.roles.cache.has(guildConfig.supportRoleId) || 
                            interaction.user.id === ticket.userId;

        if (!hasPermission) {
            return await interaction.reply({
                content: 'You do not have permission to view the transcript.',
                ephemeral: true
            });
        }

        await interaction.deferReply({ ephemeral: true });

        const transcript = await discordTranscripts.createTranscript(interaction.channel, {
            limit: -1,
            fileName: `ticket-${ticket.ticketNumber}.html`,
            saveImages: true,
            poweredBy: false
        });

        await interaction.editReply({
            content: 'Here is the transcript for this ticket:',
            files: [transcript],
            ephemeral: true
        });
    },

    'rate_1': handleRating,
    'rate_2': handleRating,
    'rate_3': handleRating,
    'rate_4': handleRating,
    'rate_5': handleRating,
};

async function handleRating(interaction) {
    try {
        const rating = parseInt(interaction.customId.split('_')[1]);
        
        // Create modal for additional feedback
        const modal = new ModalBuilder()
            .setCustomId(`rating_feedback_${rating}`)
            .setTitle('Support Feedback');

        const feedbackInput = new TextInputBuilder()
            .setCustomId('feedback')
            .setLabel('Additional Feedback')
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder('Optional: Tell us about your experience with the support you received...')
            .setRequired(false)
            .setMaxLength(1000);

        const row = new ActionRowBuilder().addComponents(feedbackInput);
        modal.addComponents(row);
        
        await interaction.showModal(modal);
    } catch (error) {
        console.error('Error handling rating:', error);
        await interaction.reply({
            content: 'There was an error processing your rating. Please try again.',
            ephemeral: true
        });
    }
}

module.exports = {
    name: 'interactionCreate',
    async execute(interaction) {
        if (!interaction.isButton()) return;

        try {
            const handler = buttonHandlers[interaction.customId];
            if (handler) {
                await handler(interaction);
            }
        } catch (error) {
            console.error('Error handling button interaction:', error);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                    content: 'There was an error processing your request. Please try again.',
                    ephemeral: true
                }).catch(console.error);
            } else {
                await interaction.editReply({
                    content: 'There was an error processing your request. Please try again.',
                    ephemeral: true
                }).catch(console.error);
            }
        }
    }
};
