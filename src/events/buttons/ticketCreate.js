const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const GuildConfig = require('../../models/GuildConfig');
const Ticket = require('../../models/Ticket');

module.exports = {
    customId: 'create_ticket',
    async execute(interaction, client) {
        try {
            // Get guild configuration
            const guildConfig = await GuildConfig.findOne({ guildId: interaction.guild.id });
            if (!guildConfig) {
                return interaction.reply({
                    content: 'Ticket system is not configured for this server.',
                    ephemeral: true
                });
            }

            // Modal for ticket details
            const modal = new ModalBuilder()
                .setCustomId('ticket_create_modal')
                .setTitle('Create a Support Ticket');

            const categorySelect = new StringSelectMenuBuilder()
                .setCustomId('ticket_category')
                .setPlaceholder('Select ticket category')
                .addOptions([
                    {
                        label: 'General Support',
                        description: 'General questions and assistance',
                        value: 'general',
                        emoji: '❓'
                    },
                    {
                        label: 'Technical Support',
                        description: 'Technical issues and bugs',
                        value: 'technical',
                        emoji: '🔧'
                    },
                    {
                        label: 'Billing Support',
                        description: 'Payment and billing issues',
                        value: 'billing',
                        emoji: '💳'
                    },
                    {
                        label: 'Report User',
                        description: 'Report a user or appeal',
                        value: 'report',
                        emoji: '🚨'
                    }
                ]);

            const subjectInput = new TextInputBuilder()
                .setCustomId('ticket_subject')
                .setLabel('What can we help you with?')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('Brief description of your issue')
                .setRequired(true)
                .setMaxLength(100);

            const descriptionInput = new TextInputBuilder()
                .setCustomId('ticket_description')
                .setLabel('Additional Details')
                .setStyle(TextInputStyle.Paragraph)
                .setPlaceholder('Please provide more details about your issue')
                .setRequired(true)
                .setMaxLength(1000);

            const firstActionRow = new ActionRowBuilder().addComponents(categorySelect);
            const secondActionRow = new ActionRowBuilder().addComponents(subjectInput);
            const thirdActionRow = new ActionRowBuilder().addComponents(descriptionInput);

            modal.addComponents(firstActionRow, secondActionRow, thirdActionRow);

            await interaction.showModal(modal);

        } catch (error) {
            console.error('Error handling ticket creation:', error);
            await interaction.reply({
                content: 'There was an error creating your ticket. Please try again later.',
                ephemeral: true
            });
        }
    }
};
