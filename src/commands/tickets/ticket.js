const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType } = require('discord.js');
const GuildConfig = require('../../models/GuildConfig');
const Ticket = require('../../models/Ticket');
const discordTranscripts = require('discord-html-transcripts');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticket')
        .setDescription('Ticket system management')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcommand =>
            subcommand
                .setName('setup')
                .setDescription('Setup the ticket system')
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('Channel where users can create tickets')
                        .setRequired(true)
                        .addChannelTypes(ChannelType.GuildText))
                .addChannelOption(option =>
                    option.setName('category')
                        .setDescription('Category where ticket channels will be created')
                        .setRequired(true)
                        .addChannelTypes(ChannelType.GuildCategory))
                .addChannelOption(option =>
                    option.setName('logs')
                        .setDescription('Channel where ticket logs will be sent')
                        .setRequired(true)
                        .addChannelTypes(ChannelType.GuildText))
                .addChannelOption(option =>
                    option.setName('transcripts')
                        .setDescription('Channel where ticket transcripts will be sent')
                        .setRequired(true)
                        .addChannelTypes(ChannelType.GuildText))
                .addChannelOption(option =>
                    option.setName('rating')
                        .setDescription('Channel where ticket ratings will be sent')
                        .setRequired(true)
                        .addChannelTypes(ChannelType.GuildText)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Add a staff role')
                .addRoleOption(option =>
                    option.setName('role')
                        .setDescription('The role to add as staff')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Remove a staff role')
                .addRoleOption(option =>
                    option.setName('role')
                        .setDescription('The role to remove from staff')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('staff')
                .setDescription('Add/Remove individual staff members')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('The user to modify')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('action')
                        .setDescription('Add or remove the user')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Add', value: 'add' },
                            { name: 'Remove', value: 'remove' }
                        )))
        .addSubcommand(subcommand =>
            subcommand
                .setName('viewstaff')
                .setDescription('View all staff roles and members'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('claim')
                .setDescription('Claim a ticket'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('unclaim')
                .setDescription('Unclaim a ticket'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('transfer')
                .setDescription('Transfer a ticket to another staff member')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('The user to transfer the ticket to')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('open')
                .setDescription('Open a new ticket')
                .addStringOption(option =>
                    option.setName('reason')
                        .setDescription('The reason for opening the ticket')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('close')
                .setDescription('Close the current ticket')
                .addStringOption(option =>
                    option.setName('reason')
                        .setDescription('The reason for closing the ticket')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('transcript')
                .setDescription('Generate a transcript of the current ticket')),

    async execute(interaction, client) {
        try {
            const subcommand = interaction.options.getSubcommand();

            switch (subcommand) {
                case 'setup': {
                    await handleSetup(interaction);
                    break;
                }
                case 'add':
                    await handleAddRole(interaction);
                    break;
                case 'remove':
                    await handleRemoveRole(interaction);
                    break;
                case 'staff':
                    await handleStaffMember(interaction);
                    break;
                case 'viewstaff':
                    await handleViewStaff(interaction);
                    break;
                case 'claim':
                    await handleClaim(interaction);
                    break;
                case 'unclaim':
                    await handleUnclaim(interaction);
                    break;
                case 'transfer':
                    await handleTransfer(interaction);
                    break;
                case 'open':
                    await handleOpen(interaction);
                    break;
                case 'close':
                    await handleClose(interaction);
                    break;
                case 'transcript':
                    await handleTranscript(interaction);
                    break;
            }
        } catch (error) {
            console.error('Error in ticket command:', error);
            await interaction.reply({
                content: 'There was an error executing this command. Please try again.',
                ephemeral: true
            });
        }
    }
};

async function handleSetup(interaction) {
    try {
        const options = interaction.options;
        
        // Get all channels with proper type validation
        const channels = {
            ticket: options.getChannel('channel'),
            category: options.getChannel('category'),
            logs: options.getChannel('logs'),
            transcripts: options.getChannel('transcripts'),
            rating: options.getChannel('rating')
        };

        // Validate channel types
        if (channels.category.type !== ChannelType.GuildCategory) {
            return await interaction.reply({
                content: 'The category channel must be a category channel!',
                ephemeral: true
            });
        }

        // Validate text channels
        const textChannels = ['ticket', 'logs', 'transcripts', 'rating'];
        for (const channelKey of textChannels) {
            if (channels[channelKey].type !== ChannelType.GuildText) {
                return await interaction.reply({
                    content: `The ${channelKey} channel must be a text channel!`,
                    ephemeral: true
                });
            }
        }

        await interaction.deferReply({ ephemeral: true });

        // Create support role if it doesn't exist
        let supportRole = interaction.guild.roles.cache.find(role => role.name === 'Ticket Support');
        if (!supportRole) {
            supportRole = await interaction.guild.roles.create({
                name: 'Ticket Support',
                color: '#2f3136',
                reason: 'Ticket System Support Role',
                permissions: []
            });
        }

        // Update guild config
        let guildConfig = await GuildConfig.findOne({ guildId: interaction.guild.id });
        if (!guildConfig) {
            guildConfig = new GuildConfig({
                guildId: interaction.guild.id,
                ticketChannelId: channels.ticket.id,
                ticketCategoryId: channels.category.id,
                supportRoleId: supportRole.id,
                logsChannelId: channels.logs.id,
                transcriptsChannelId: channels.transcripts.id,
                ratingChannelId: channels.rating.id
            });
        } else {
            guildConfig.ticketChannelId = channels.ticket.id;
            guildConfig.ticketCategoryId = channels.category.id;
            guildConfig.supportRoleId = supportRole.id;
            guildConfig.logsChannelId = channels.logs.id;
            guildConfig.transcriptsChannelId = channels.transcripts.id;
            guildConfig.ratingChannelId = channels.rating.id;
        }
        await guildConfig.save();

        // Create ticket panel
        const button = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('create_ticket')
                    .setLabel('Create Ticket')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('🎫')
            );

        const embed = new EmbedBuilder()
            .setTitle('🎫 Ticket System')
            .setDescription('Need help? Click the button below to create a ticket!')
            .addFields(
                { name: 'Support Team', value: `<@&${supportRole.id}>`, inline: true },
                { name: 'Category', value: channels.category.name, inline: true }
            )
            .setColor('#0099ff')
            .setFooter({ text: 'Click the button below to create a ticket' });

        await channels.ticket.send({
            embeds: [embed],
            components: [button]
        });

        // Create log embed for setup
        const setupLogEmbed = new EmbedBuilder()
            .setTitle('Ticket System Setup')
            .setDescription('Ticket system has been configured')
            .addFields(
                { name: 'Setup By', value: `${interaction.user}`, inline: true },
                { name: 'Ticket Channel', value: `${channels.ticket}`, inline: true },
                { name: 'Category', value: `${channels.category}`, inline: true },
                { name: 'Logs Channel', value: `${channels.logs}`, inline: true },
                { name: 'Transcripts Channel', value: `${channels.transcripts}`, inline: true },
                { name: 'Rating Channel', value: `${channels.rating}`, inline: true },
                { name: 'Support Role', value: `${supportRole}`, inline: true }
            )
            .setColor('#00ff00')
            .setTimestamp();

        // Send setup log
        await channels.logs.send({ embeds: [setupLogEmbed] });

        // Send success message
        await interaction.editReply({
            content: `Ticket system has been set up successfully!\n\n` +
                    `Panel Channel: ${channels.ticket}\n` +
                    `Category: ${channels.category}\n` +
                    `Logs: ${channels.logs}\n` +
                    `Transcripts: ${channels.transcripts}\n` +
                    `Rating: ${channels.rating}\n` +
                    `Support Role: ${supportRole}`,
            ephemeral: true
        });

    } catch (error) {
        console.error('Error setting up ticket system:', error);
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({
                content: 'There was an error setting up the ticket system. Please try again.',
                ephemeral: true
            });
        } else {
            await interaction.editReply({
                content: 'There was an error setting up the ticket system. Please try again.',
                ephemeral: true
            });
        }
    }
}

async function handleAddRole(interaction) {
    const role = interaction.options.getRole('role');

    try {
        const guildConfig = await GuildConfig.findOne({ guildId: interaction.guild.id });
        if (!guildConfig) {
            return interaction.reply({
                content: 'Please set up the ticket system first using `/ticket setup`',
                ephemeral: true
            });
        }

        if (!guildConfig.staffRoles) {
            guildConfig.staffRoles = [];
        }

        if (guildConfig.staffRoles.includes(role.id)) {
            return interaction.reply({
                content: 'This role is already a staff role!',
                ephemeral: true
            });
        }

        guildConfig.staffRoles.push(role.id);
        await guildConfig.save();

        await interaction.reply({
            content: `Added ${role} as a staff role.`,
            ephemeral: true
        });

    } catch (error) {
        console.error('Error adding staff role:', error);
        await interaction.reply({
            content: 'There was an error adding the staff role. Please try again.',
            ephemeral: true
        });
    }
}

async function handleRemoveRole(interaction) {
    const role = interaction.options.getRole('role');

    try {
        const guildConfig = await GuildConfig.findOne({ guildId: interaction.guild.id });
        if (!guildConfig || !guildConfig.staffRoles) {
            return interaction.reply({
                content: 'No staff roles found.',
                ephemeral: true
            });
        }

        if (!guildConfig.staffRoles.includes(role.id)) {
            return interaction.reply({
                content: 'This role is not a staff role!',
                ephemeral: true
            });
        }

        guildConfig.staffRoles = guildConfig.staffRoles.filter(id => id !== role.id);
        await guildConfig.save();

        await interaction.reply({
            content: `Removed ${role} from staff roles.`,
            ephemeral: true
        });

    } catch (error) {
        console.error('Error removing staff role:', error);
        await interaction.reply({
            content: 'There was an error removing the staff role. Please try again.',
            ephemeral: true
        });
    }
}

async function handleStaffMember(interaction) {
    const user = interaction.options.getUser('user');
    const action = interaction.options.getString('action');

    try {
        const guildConfig = await GuildConfig.findOne({ guildId: interaction.guild.id });
        if (!guildConfig) {
            return interaction.reply({
                content: 'Please set up the ticket system first using `/ticket setup`',
                ephemeral: true
            });
        }

        if (!guildConfig.staffMembers) {
            guildConfig.staffMembers = [];
        }

        if (action === 'add') {
            if (guildConfig.staffMembers.includes(user.id)) {
                return interaction.reply({
                    content: 'This user is already a staff member!',
                    ephemeral: true
                });
            }

            guildConfig.staffMembers.push(user.id);
            await guildConfig.save();

            await interaction.reply({
                content: `Added ${user} as a staff member.`,
                ephemeral: true
            });
        } else {
            if (!guildConfig.staffMembers.includes(user.id)) {
                return interaction.reply({
                    content: 'This user is not a staff member!',
                    ephemeral: true
                });
            }

            guildConfig.staffMembers = guildConfig.staffMembers.filter(id => id !== user.id);
            await guildConfig.save();

            await interaction.reply({
                content: `Removed ${user} from staff members.`,
                ephemeral: true
            });
        }

    } catch (error) {
        console.error('Error managing staff member:', error);
        await interaction.reply({
            content: 'There was an error managing the staff member. Please try again.',
            ephemeral: true
        });
    }
}

async function handleViewStaff(interaction) {
    try {
        const guildConfig = await GuildConfig.findOne({ guildId: interaction.guild.id });
        if (!guildConfig) {
            return interaction.reply({
                content: 'No ticket system configuration found.',
                ephemeral: true
            });
        }

        const embed = new EmbedBuilder()
            .setTitle('Ticket System Staff')
            .setColor('#2f3136')
            .setTimestamp();

        // Add staff roles
        const staffRoles = guildConfig.staffRoles || [];
        const rolesText = staffRoles.length > 0
            ? staffRoles.map(roleId => `<@&${roleId}>`).join('\n')
            : 'No staff roles configured';
        embed.addFields({ name: 'Staff Roles', value: rolesText });

        // Add individual staff members
        const staffMembers = guildConfig.staffMembers || [];
        const membersText = staffMembers.length > 0
            ? staffMembers.map(userId => `<@${userId}>`).join('\n')
            : 'No individual staff members';
        embed.addFields({ name: 'Staff Members', value: membersText });

        await interaction.reply({
            embeds: [embed],
            ephemeral: true
        });

    } catch (error) {
        console.error('Error viewing staff:', error);
        await interaction.reply({
            content: 'There was an error retrieving staff information. Please try again.',
            ephemeral: true
        });
    }
}

async function handleClaim(interaction) {
    try {
        // Check if this is a ticket channel
        const ticket = await Ticket.findOne({ channelId: interaction.channel.id });
        if (!ticket) {
            return interaction.reply({
                content: 'This command can only be used in a ticket channel!',
                ephemeral: true
            });
        }

        // Check if user is staff
        const guildConfig = await GuildConfig.findOne({ guildId: interaction.guild.id });
        const isStaff = guildConfig.staffRoles.some(roleId => 
            interaction.member.roles.cache.has(roleId)
        ) || guildConfig.staffMembers.includes(interaction.user.id);

        if (!isStaff) {
            return interaction.reply({
                content: 'Only staff members can claim tickets!',
                ephemeral: true
            });
        }

        // Check if ticket is already claimed
        if (ticket.assignedTo) {
            if (ticket.assignedTo === interaction.user.id) {
                return interaction.reply({
                    content: 'You have already claimed this ticket!',
                    ephemeral: true
                });
            }
            return interaction.reply({
                content: `This ticket is already claimed by <@${ticket.assignedTo}>!`,
                ephemeral: true
            });
        }

        // Claim the ticket
        ticket.assignedTo = interaction.user.id;
        await ticket.save();

        // Create embed for claim notification
        const embed = new EmbedBuilder()
            .setTitle('Ticket Claimed')
            .setDescription(`This ticket has been claimed by ${interaction.user}`)
            .setColor('#00ff00')
            .setTimestamp();

        await interaction.channel.send({ embeds: [embed] });
        await interaction.reply({
            content: 'You have successfully claimed this ticket!',
            ephemeral: true
        });

    } catch (error) {
        console.error('Error claiming ticket:', error);
        await interaction.reply({
            content: 'There was an error claiming the ticket. Please try again.',
            ephemeral: true
        });
    }
}

async function handleUnclaim(interaction) {
    try {
        // Check if this is a ticket channel
        const ticket = await Ticket.findOne({ channelId: interaction.channel.id });
        if (!ticket) {
            return interaction.reply({
                content: 'This command can only be used in a ticket channel!',
                ephemeral: true
            });
        }

        // Check if ticket is claimed
        if (!ticket.assignedTo) {
            return interaction.reply({
                content: 'This ticket is not claimed by anyone!',
                ephemeral: true
            });
        }

        // Check if user is the one who claimed it or is an admin
        if (ticket.assignedTo !== interaction.user.id && !interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({
                content: 'You can only unclaim tickets that you have claimed!',
                ephemeral: true
            });
        }

        // Unclaim the ticket
        ticket.assignedTo = null;
        await ticket.save();

        // Create embed for unclaim notification
        const embed = new EmbedBuilder()
            .setTitle('Ticket Unclaimed')
            .setDescription(`This ticket has been unclaimed by ${interaction.user}`)
            .setColor('#ffff00')
            .setTimestamp();

        await interaction.channel.send({ embeds: [embed] });
        await interaction.reply({
            content: 'You have successfully unclaimed this ticket!',
            ephemeral: true
        });

    } catch (error) {
        console.error('Error unclaiming ticket:', error);
        await interaction.reply({
            content: 'There was an error unclaiming the ticket. Please try again.',
            ephemeral: true
        });
    }
}

async function handleTransfer(interaction) {
    try {
        const targetUser = interaction.options.getUser('user');

        // Check if this is a ticket channel
        const ticket = await Ticket.findOne({ channelId: interaction.channel.id });
        if (!ticket) {
            return interaction.reply({
                content: 'This command can only be used in a ticket channel!',
                ephemeral: true
            });
        }

        // Check if user is staff
        const guildConfig = await GuildConfig.findOne({ guildId: interaction.guild.id });
        const isTargetStaff = guildConfig.staffRoles.some(roleId => 
            interaction.guild.members.cache.get(targetUser.id)?.roles.cache.has(roleId)
        ) || guildConfig.staffMembers.includes(targetUser.id);

        if (!isTargetStaff) {
            return interaction.reply({
                content: 'You can only transfer tickets to staff members!',
                ephemeral: true
            });
        }

        // Check if user has permission to transfer
        const isCurrentStaff = guildConfig.staffRoles.some(roleId => 
            interaction.member.roles.cache.has(roleId)
        ) || guildConfig.staffMembers.includes(interaction.user.id);

        if (!isCurrentStaff && !interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({
                content: 'You do not have permission to transfer tickets!',
                ephemeral: true
            });
        }

        // Check if ticket is claimed by someone else
        if (ticket.assignedTo && ticket.assignedTo !== interaction.user.id && 
            !interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({
                content: 'You can only transfer tickets that you have claimed!',
                ephemeral: true
            });
        }

        // Transfer the ticket
        const previousAssignee = ticket.assignedTo;
        ticket.assignedTo = targetUser.id;
        await ticket.save();

        // Create embed for transfer notification
        const embed = new EmbedBuilder()
            .setTitle('Ticket Transferred')
            .setDescription(`This ticket has been transferred to ${targetUser}`)
            .addFields(
                { name: 'Previous Assignee', value: previousAssignee ? `<@${previousAssignee}>` : 'None', inline: true },
                { name: 'New Assignee', value: `${targetUser}`, inline: true },
                { name: 'Transferred By', value: `${interaction.user}`, inline: true }
            )
            .setColor('#0099ff')
            .setTimestamp();

        await interaction.channel.send({ embeds: [embed] });
        await interaction.reply({
            content: `Ticket has been transferred to ${targetUser}!`,
            ephemeral: true
        });

    } catch (error) {
        console.error('Error transferring ticket:', error);
        await interaction.reply({
            content: 'There was an error transferring the ticket. Please try again.',
            ephemeral: true
        });
    }
}

async function handleOpen(interaction) {
    try {
        const reason = interaction.options.getString('reason');
        const guildConfig = await GuildConfig.findOne({ guildId: interaction.guild.id });

        if (!guildConfig) {
            return interaction.reply({
                content: 'The ticket system has not been set up in this server!',
                ephemeral: true
            });
        }

        // Check if user already has an open ticket
        const existingTicket = await Ticket.findOne({
            guildId: interaction.guild.id,
            userId: interaction.user.id,
            status: 'OPEN'
        });

        if (existingTicket) {
            return interaction.reply({
                content: `You already have an open ticket! <#${existingTicket.channelId}>`,
                ephemeral: true
            });
        }

        // Create ticket channel
        const ticketNumber = (guildConfig.lastTicketNumber || 0) + 1;
        const channelName = `ticket-${ticketNumber.toString().padStart(4, '0')}`;

        const channel = await interaction.guild.channels.create({
            name: channelName,
            type: 0, // Text channel
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

        // Add staff member permissions
        for (const memberId of guildConfig.staffMembers) {
            await channel.permissionOverwrites.create(memberId, {
                ViewChannel: true,
                SendMessages: true,
                ReadMessageHistory: true
            });
        }

        // Create ticket in database
        const ticket = new Ticket({
            guildId: interaction.guild.id,
            channelId: channel.id,
            userId: interaction.user.id,
            ticketNumber,
            reason,
            status: 'OPEN',
            createdAt: new Date()
        });

        await ticket.save();

        // Update guild config
        guildConfig.lastTicketNumber = ticketNumber;
        await guildConfig.save();

        // Send initial message
        const embed = new EmbedBuilder()
            .setTitle(`Ticket #${ticketNumber}`)
            .setDescription('Thank you for creating a ticket! Please describe your issue and wait for a staff member to assist you.')
            .addFields(
                { name: 'Created By', value: `${interaction.user}`, inline: true },
                { name: 'Reason', value: reason, inline: true }
            )
            .setColor('#0099ff')
            .setTimestamp();

        await channel.send({ embeds: [embed] });
        await interaction.reply({
            content: `Your ticket has been created! ${channel}`,
            ephemeral: true
        });

    } catch (error) {
        console.error('Error opening ticket:', error);
        await interaction.reply({
            content: 'There was an error opening the ticket. Please try again.',
            ephemeral: true
        });
    }
}

async function handleClose(interaction) {
    try {
        // Check if this is a ticket channel
        const ticket = await Ticket.findOne({ channelId: interaction.channel.id });
        if (!ticket) {
            return interaction.reply({
                content: 'This command can only be used in a ticket channel!',
                ephemeral: true
            });
        }

        if (ticket.status === 'CLOSED') {
            return interaction.reply({
                content: 'This ticket is already closed!',
                ephemeral: true
            });
        }

        // Check if user has permission to close
        const guildConfig = await GuildConfig.findOne({ guildId: interaction.guild.id });
        const isStaff = guildConfig.staffRoles.some(roleId => 
            interaction.member.roles.cache.has(roleId)
        ) || guildConfig.staffMembers.includes(interaction.user.id);

        if (!isStaff && interaction.user.id !== ticket.userId && 
            !interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({
                content: 'You do not have permission to close this ticket!',
                ephemeral: true
            });
        }

        // Generate transcript before closing
        const transcript = await discordTranscripts.createTranscript(interaction.channel, {
            limit: -1,
            fileName: `ticket-${ticket.ticketNumber}.html`,
            saveImages: true,
            poweredBy: false
        });

        // Create close embed
        const reason = interaction.options.getString('reason') || 'No reason provided';
        const closeEmbed = new EmbedBuilder()
            .setTitle(`Ticket #${ticket.ticketNumber} Closed`)
            .setDescription('This ticket has been closed.')
            .addFields(
                { name: 'Closed By', value: `${interaction.user}`, inline: true },
                { name: 'Reason', value: reason, inline: true }
            )
            .setColor('#ff0000')
            .setTimestamp();

        // Update ticket in database
        ticket.status = 'CLOSED';
        ticket.closedBy = interaction.user.id;
        ticket.closedAt = new Date();
        ticket.closeReason = reason;
        await ticket.save();

        // Send transcript to log channel if it exists
        if (guildConfig.ticketChannelId) {
            const logChannel = await interaction.guild.channels.fetch(guildConfig.ticketChannelId);
            if (logChannel) {
                const logEmbed = new EmbedBuilder()
                    .setTitle(`Ticket #${ticket.ticketNumber} Transcript`)
                    .addFields(
                        { name: 'Opened By', value: `<@${ticket.userId}>`, inline: true },
                        { name: 'Closed By', value: `${interaction.user}`, inline: true },
                        { name: 'Reason', value: reason, inline: true }
                    )
                    .setColor('#ff0000')
                    .setTimestamp();

                await logChannel.send({
                    embeds: [logEmbed],
                    files: [transcript]
                });
            }
        }

        // Send close message and begin deletion countdown
        await interaction.channel.send({ embeds: [closeEmbed] });
        await interaction.reply({
            content: 'Ticket closed! Channel will be deleted in 5 seconds...',
            ephemeral: true
        });

        // Delete the channel after 5 seconds
        setTimeout(async () => {
            try {
                await interaction.channel.delete();
            } catch (error) {
                console.error('Error deleting channel:', error);
            }
        }, 5000);

    } catch (error) {
        console.error('Error closing ticket:', error);
        await interaction.reply({
            content: 'There was an error closing the ticket. Please try again.',
            ephemeral: true
        });
    }
}

async function handleTranscript(interaction) {
    try {
        const ticket = await Ticket.findOne({ channelId: interaction.channel.id });
        if (!ticket) {
            return interaction.reply({
                content: 'This command can only be used in a ticket channel!',
                ephemeral: true
            });
        }

        const guildConfig = await GuildConfig.findOne({ guildId: interaction.guild.id });
        const isStaff = guildConfig.staffRoles.some(roleId => 
            interaction.member.roles.cache.has(roleId)
        ) || guildConfig.staffMembers.includes(interaction.user.id);

        if (!isStaff && interaction.user.id !== ticket.userId && 
            !interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({
                content: 'You do not have permission to generate transcripts!',
                ephemeral: true
            });
        }

        await interaction.deferReply({ ephemeral: true });
        const transcript = await discordTranscripts.createTranscript(interaction.channel);
        const embed = new EmbedBuilder()
            .setTitle(`Ticket #${ticket.ticketNumber} Transcript`)
            .setDescription('Here is the transcript for this ticket.')
            .addFields(
                { name: 'Generated By', value: `${interaction.user}`, inline: true },
                { name: 'Ticket Owner', value: `<@${ticket.userId}>`, inline: true }
            )
            .setColor('#0099ff')
            .setTimestamp();

        await interaction.editReply({
            embeds: [embed],
            files: [transcript],
            ephemeral: true
        });
    } catch (error) {
        console.error('Error generating transcript:', error);
        const reply = interaction.deferred ? interaction.editReply : interaction.reply;
        await reply({
            content: 'There was an error generating the transcript. Please try again.',
            ephemeral: true
        });
    }
}
