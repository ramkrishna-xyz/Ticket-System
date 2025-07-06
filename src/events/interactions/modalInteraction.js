const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const GuildConfig = require('../../models/GuildConfig');
const Ticket = require('../../models/Ticket');
const TicketRating = require('../../models/TicketRating'); // Assuming TicketRating model is defined in this file

module.exports = {
    name: 'interactionCreate',
    async execute(interaction) {
        if (!interaction.isModalSubmit()) return;

        try {
            if (interaction.customId === 'create_ticket_modal') {
                await interaction.deferReply({ ephemeral: true });

                const subject = interaction.fields.getTextInputValue('ticketSubject');
                const description = interaction.fields.getTextInputValue('ticketDescription');
                const category = interaction.fields.getTextInputValue('ticketCategory');

                const guildConfig = await GuildConfig.findOne({ guildId: interaction.guild.id });
                if (!guildConfig) {
                    return await interaction.editReply({
                        content: 'The ticket system has not been set up in this server!',
                        ephemeral: true
                    });
                }

                // Check if user already has an open ticket
                const existingTicket = await Ticket.findOne({
                    guildId: interaction.guild.id,
                    userId: interaction.user.id,
                    status: 'open'
                });

                if (existingTicket) {
                    return await interaction.editReply({
                        content: `You already have an open ticket! <#${existingTicket.channelId}>`,
                        ephemeral: true
                    });
                }

                // Create ticket channel
                const ticketNumber = (guildConfig.lastTicketNumber || 0) + 1;
                const channelName = `ticket-${ticketNumber.toString().padStart(4, '0')}`;

                const channel = await interaction.guild.channels.create({
                    name: channelName,
                    type: 0,
                    parent: guildConfig.ticketCategoryId,
                    permissionOverwrites: [
                        {
                            id: interaction.guild.id,
                            deny: [PermissionFlagsBits.ViewChannel]
                        },
                        {
                            id: interaction.user.id,
                            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory]
                        }
                    ]
                });

                // Add staff role permissions
                for (const roleId of guildConfig.staffRoles) {
                    await channel.permissionOverwrites.create(roleId, {
                        ViewChannel: true,
                        SendMessages: true,
                        ReadMessageHistory: true
                    });
                }

                // Create ticket in database
                const ticket = new Ticket({
                    guildId: interaction.guild.id,
                    channelId: channel.id,
                    ticketNumber,
                    userId: interaction.user.id,
                    subject,
                    category,
                    status: 'open'
                });

                await ticket.save();

                // Update guild config
                guildConfig.lastTicketNumber = ticketNumber;
                await guildConfig.save();

                // Create ticket management buttons
                const buttons = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('claim_ticket')
                            .setLabel('Claim Ticket')
                            .setStyle(ButtonStyle.Primary)
                            .setEmoji('👋'),
                        new ButtonBuilder()
                            .setCustomId('transcript_ticket')
                            .setLabel('Save Transcript')
                            .setStyle(ButtonStyle.Secondary)
                            .setEmoji('📑'),
                        new ButtonBuilder()
                            .setCustomId('delete_ticket')
                            .setLabel('Close Ticket')
                            .setStyle(ButtonStyle.Danger)
                            .setEmoji('🔒')
                    );

                // Create welcome embed
                const embed = new EmbedBuilder()
                    .setTitle(`Ticket #${ticketNumber}`)
                    .setDescription(description)
                    .addFields(
                        { name: 'Subject', value: subject, inline: true },
                        { name: 'Category', value: category, inline: true },
                        { name: 'Created By', value: `${interaction.user}`, inline: true }
                    )
                    .setColor('#0099ff')
                    .setTimestamp();

                // Send welcome message with buttons
                await channel.send({
                    content: `Welcome ${interaction.user}!\n<@&${guildConfig.supportRoleId}>`,
                    embeds: [embed],
                    components: [buttons]
                });

                await interaction.editReply({
                    content: `Your ticket has been created! ${channel}`,
                    ephemeral: true
                });
            } else if (interaction.customId.startsWith('rating_feedback_')) {
                const rating = parseInt(interaction.customId.split('_')[2]);
                const feedback = interaction.fields.getTextInputValue('feedback');

                try {
                    // Get the closed ticket from the database
                    const ticket = await Ticket.findOne({
                        userId: interaction.user.id,
                        status: 'closed'
                    }).sort({ closedAt: -1 });

                    if (!ticket) {
                        return await interaction.reply({
                            content: 'Could not find the ticket to rate.',
                            ephemeral: true
                        });
                    }

                    // Check if ticket has already been rated
                    const existingRating = await TicketRating.findOne({ ticketId: ticket._id });
                    if (existingRating) {
                        return await interaction.reply({
                            content: 'You have already rated this ticket.',
                            ephemeral: true
                        });
                    }

                    // Save the rating
                    const ticketRating = new TicketRating({
                        guildId: ticket.guildId,
                        ticketId: ticket._id,
                        ticketNumber: ticket.ticketNumber,
                        userId: interaction.user.id,
                        supportUserId: ticket.closedBy,
                        rating: rating,
                        feedback: feedback
                    });
                    await ticketRating.save();

                    // Get guild config for rating channel
                    const guildConfig = await GuildConfig.findOne({ guildId: ticket.guildId });
                    if (!guildConfig) {
                        return await interaction.reply({
                            content: 'Could not find guild configuration.',
                            ephemeral: true
                        });
                    }

                    // Send rating to rating channel
                    const ratingChannel = await interaction.client.channels.fetch(guildConfig.ratingChannelId);
                    if (ratingChannel) {
                        const supportUser = await interaction.client.users.fetch(ticket.closedBy);
                        const ratingEmbed = new EmbedBuilder()
                            .setTitle(`Ticket #${ticket.ticketNumber} Rating`)
                            .addFields(
                                { name: 'Rating', value: '⭐'.repeat(rating), inline: true },
                                { name: 'User', value: `<@${interaction.user.id}>`, inline: true },
                                { name: 'Support Staff', value: supportUser ? `<@${supportUser.id}>` : 'Unknown', inline: true },
                                { name: 'Subject', value: ticket.subject || 'N/A', inline: true },
                                { name: 'Category', value: ticket.category || 'N/A', inline: true }
                            )
                            .setColor(rating >= 4 ? '#00ff00' : rating >= 3 ? '#ffff00' : '#ff0000')
                            .setTimestamp();

                        if (feedback) {
                            ratingEmbed.addFields({ name: 'Feedback', value: feedback });
                        }

                        await ratingChannel.send({ embeds: [ratingEmbed] });
                    }

                    // Find and delete the rating message
                    const messages = await interaction.channel.messages.fetch({ limit: 10 });
                    const ratingMessage = messages.find(m => 
                        m.author.bot && 
                        m.embeds.length > 0 && 
                        m.embeds[0].title === 'Rate Your Support Experience'
                    );

                    if (ratingMessage) {
                        await ratingMessage.delete().catch(() => {});
                    }

                    // Send confirmation to user
                    await interaction.reply({
                        content: 'Thank you for your feedback! Your rating has been recorded.',
                        ephemeral: true
                    });

                } catch (error) {
                    console.error('Error processing rating feedback:', error);
                    await interaction.reply({
                        content: 'There was an error processing your rating. Please try again.',
                        ephemeral: true
                    });
                }
                return;
            }
        } catch (error) {
            console.error('Error handling modal interaction:', error);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                    content: 'There was an error processing your request. Please try again.',
                    ephemeral: true
                });
            }
        }
    }
};
