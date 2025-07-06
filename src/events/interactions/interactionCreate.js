const { Events, InteractionType } = require('discord.js');
const fs = require('fs');
const path = require('path');

// Load button handlers
const buttonHandlers = new Map();
const buttonPath = path.join(__dirname, '..', 'buttons');
const buttonFiles = fs.readdirSync(buttonPath).filter(file => file.endsWith('.js'));

for (const file of buttonFiles) {
    const button = require(path.join(buttonPath, file));
    buttonHandlers.set(button.customId, button);
}

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction, client) {
        try {
            if (interaction.isChatInputCommand()) {
                const command = client.commands.get(interaction.commandName);

                if (!command) {
                    console.error(`No command matching ${interaction.commandName} was found.`);
                    return;
                }

                try {
                    await command.execute(interaction, client);
                } catch (error) {
                    console.error(error);
                    if (interaction.replied || interaction.deferred) {
                        await interaction.followUp({
                            content: 'There was an error while executing this command!',
                            ephemeral: true
                        });
                    } else {
                        await interaction.reply({
                            content: 'There was an error while executing this command!',
                            ephemeral: true
                        });
                    }
                }
            } else if (interaction.isButton()) {
                const handler = buttonHandlers.get(interaction.customId.split('_')[0]);
                
                if (handler) {
                    await handler.execute(interaction, client);
                } else {
                    console.log(`No handler found for button: ${interaction.customId}`);
                }
            } else if (interaction.isModalSubmit()) {
                if (interaction.customId === 'ticket_create_modal') {
                    const category = interaction.fields.getTextInputValue('ticket_category');
                    const subject = interaction.fields.getTextInputValue('ticket_subject');
                    const description = interaction.fields.getTextInputValue('ticket_description');

                    // Handle ticket creation here
                    // This will be handled by a separate function
                    await handleTicketCreation(interaction, client, { category, subject, description });
                }
            }
        } catch (error) {
            console.error('Error handling interaction:', error);
        }
    }
};

async function handleTicketCreation(interaction, client, { category, subject, description }) {
    try {
        const guildConfig = await GuildConfig.findOne({ guildId: interaction.guild.id });
        if (!guildConfig) return;

        // Increment ticket number
        guildConfig.lastTicketNumber += 1;
        await guildConfig.save();

        const ticketNumber = String(guildConfig.lastTicketNumber).padStart(4, '0');
        const ticketChannel = await interaction.guild.channels.create({
            name: `ticket-${ticketNumber}`,
            type: 0,
            parent: guildConfig.ticketCategoryId,
            permissionOverwrites: [
                {
                    id: interaction.guild.id,
                    deny: [PermissionFlagsBits.ViewChannel],
                },
                {
                    id: interaction.user.id,
                    allow: [
                        PermissionFlagsBits.ViewChannel,
                        PermissionFlagsBits.SendMessages,
                        PermissionFlagsBits.ReadMessageHistory,
                    ],
                },
                {
                    id: guildConfig.supportRoleId,
                    allow: [
                        PermissionFlagsBits.ViewChannel,
                        PermissionFlagsBits.SendMessages,
                        PermissionFlagsBits.ReadMessageHistory,
                        PermissionFlagsBits.ManageMessages,
                    ],
                },
            ],
        });

        // Create ticket in database
        const ticket = await Ticket.create({
            ticketId: ticketNumber,
            channelId: ticketChannel.id,
            guildId: interaction.guild.id,
            creator: interaction.user.id,
            category,
            subject,
            description,
            priority: 'medium',
            participants: [interaction.user.id]
        });

        // Create ticket embed
        const embed = new EmbedBuilder()
            .setTitle(`Ticket #${ticketNumber}`)
            .setDescription('Support ticket created')
            .addFields(
                { name: 'Category', value: category, inline: true },
                { name: 'Subject', value: subject, inline: true },
                { name: 'Created By', value: `<@${interaction.user.id}>`, inline: true },
                { name: 'Description', value: description }
            )
            .setColor('#2f3136')
            .setTimestamp();

        // Create button row
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`ticket-claim_${ticketNumber}`)
                    .setLabel('Claim Ticket')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId(`ticket-close_${ticketNumber}`)
                    .setLabel('Close Ticket')
                    .setStyle(ButtonStyle.Danger)
            );

        await ticketChannel.send({
            content: `<@${interaction.user.id}> Welcome to your ticket!\n<@&${guildConfig.supportRoleId}> New ticket created.`,
            embeds: [embed],
            components: [row]
        });

        await interaction.reply({
            content: `Your ticket has been created in ${ticketChannel}`,
            ephemeral: true
        });

    } catch (error) {
        console.error('Error creating ticket:', error);
        await interaction.reply({
            content: 'There was an error creating your ticket. Please try again later.',
            ephemeral: true
        });
    }
}
