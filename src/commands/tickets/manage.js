const { 
    SlashCommandBuilder, 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle,
    PermissionFlagsBits 
} = require('discord.js');
const GuildConfig = require('../../models/GuildConfig');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('manage')
        .setDescription('Manage ticket panel settings')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcommand =>
            subcommand
                .setName('panel')
                .setDescription('Update ticket panel settings')
                .addStringOption(option =>
                    option
                        .setName('title')
                        .setDescription('Set the embed title')
                        .setRequired(false))
                .addStringOption(option =>
                    option
                        .setName('description')
                        .setDescription('Set the embed description')
                        .setRequired(false))
                .addStringOption(option =>
                    option
                        .setName('color')
                        .setDescription('Set the embed color (hex format: #RRGGBB)')
                        .setRequired(false))
                .addStringOption(option =>
                    option
                        .setName('button_label')
                        .setDescription('Set the button label')
                        .setRequired(false))
                .addStringOption(option =>
                    option
                        .setName('button_emoji')
                        .setDescription('Set the button emoji')
                        .setRequired(false))
                .addStringOption(option =>
                    option
                        .setName('button_style')
                        .setDescription('Set the button style')
                        .addChoices(
                            { name: 'Primary (Blurple)', value: 'PRIMARY' },
                            { name: 'Secondary (Grey)', value: 'SECONDARY' },
                            { name: 'Success (Green)', value: 'SUCCESS' },
                            { name: 'Danger (Red)', value: 'DANGER' }
                        )
                        .setRequired(false))),

    async execute(interaction) {
        try {
            const guildConfig = await GuildConfig.findOne({ guildId: interaction.guild.id });
            if (!guildConfig) {
                return await interaction.reply({
                    content: 'Please set up the ticket system first using `/ticket setup`.',
                    ephemeral: true
                });
            }

            const channel = await interaction.guild.channels.fetch(guildConfig.ticketChannelId);
            if (!channel) {
                return await interaction.reply({
                    content: 'Ticket channel not found. Please set up the ticket system again.',
                    ephemeral: true
                });
            }

            // Get the last message in the channel that contains the ticket panel
            const messages = await channel.messages.fetch({ limit: 10 });
            const panelMessage = messages.find(m => 
                m.author.id === interaction.client.user.id && 
                m.components.length > 0 &&
                m.embeds.length > 0
            );

            if (!panelMessage) {
                return await interaction.reply({
                    content: 'Ticket panel message not found. Please set up the ticket system again.',
                    ephemeral: true
                });
            }

            // Get current embed and button
            const currentEmbed = panelMessage.embeds[0];
            const currentButton = panelMessage.components[0].components[0];

            // Create new embed using current values as defaults
            const embed = new EmbedBuilder()
                .setTitle(interaction.options.getString('title') || currentEmbed.title || 'Support Ticket')
                .setDescription(interaction.options.getString('description') || currentEmbed.description || 'Click the button below to create a support ticket.')
                .setColor(interaction.options.getString('color') || currentEmbed.color || '#0099ff')
                .setTimestamp();

            // Create new button using current values as defaults
            const button = new ButtonBuilder()
                .setCustomId('create_ticket')
                .setLabel(interaction.options.getString('button_label') || currentButton.label || 'Create Ticket');

            // Handle button style
            const selectedStyle = interaction.options.getString('button_style');
            if (selectedStyle === 'PRIMARY') button.setStyle(ButtonStyle.Primary);
            else if (selectedStyle === 'SECONDARY') button.setStyle(ButtonStyle.Secondary);
            else if (selectedStyle === 'SUCCESS') button.setStyle(ButtonStyle.Success);
            else if (selectedStyle === 'DANGER') button.setStyle(ButtonStyle.Danger);
            else button.setStyle(ButtonStyle.Primary); // Default style

            // Set emoji if provided or use current
            const buttonEmoji = interaction.options.getString('button_emoji');
            if (buttonEmoji) {
                button.setEmoji(buttonEmoji);
            } else if (currentButton.emoji) {
                button.setEmoji(currentButton.emoji);
            }

            const row = new ActionRowBuilder().addComponents(button);

            // Update the panel message
            await panelMessage.edit({
                embeds: [embed],
                components: [row]
            });

            await interaction.reply({
                content: 'Ticket panel has been updated successfully!',
                ephemeral: true
            });

        } catch (error) {
            console.error('Error in manage command:', error);
            await interaction.reply({
                content: 'There was an error updating the ticket panel. Please try again.',
                ephemeral: true
            });
        }
    }
};
