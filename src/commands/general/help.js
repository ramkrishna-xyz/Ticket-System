// help.js (for Discord.js v14.19+ with Components V2)
// Make sure discord.js is updated and installed

const {
  SlashCommandBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  MessageFlags,
  TextDisplayBuilder,
  ContainerBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  Events
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Show help menu for bot commands'),

  async execute(interaction) {
    // Heading component using markdown
    const heading = new TextDisplayBuilder()
      .setContent('# :sparkles: Bot Help Menu');

    // Brief introduction
    const intro = new TextDisplayBuilder()
      .setContent('Welcome! Select a topic below to learn more about each feature.');

    // Separator for spacing
    const divider = new SeparatorBuilder()
      .setSpacing(SeparatorSpacingSize.Large)
      .setDivider(true);

    // Modern select menu for categories
    const helpMenu = new StringSelectMenuBuilder()
      .setCustomId('help_select')
      .setPlaceholder('Choose a help category...')
      .addOptions(
        new StringSelectMenuOptionBuilder()
          .setLabel('Ping')
          .setDescription('Info about the ping command')
          .setValue('help_ping')
          .setEmoji('🏓'),
        new StringSelectMenuOptionBuilder()
          .setLabel('Manage Ticket')
          .setDescription('How to manage support tickets')
          .setValue('help_manage_ticket')
          .setEmoji('🛠️'),
        new StringSelectMenuOptionBuilder()
          .setLabel('Setup Ticket')
          .setDescription('How to set up your ticket system')
          .setValue('help_setup_ticket')
          .setEmoji('🎫')
      );

    // Buttons row (for users preferring buttons)
    const helpButtonRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('help_ping')
        .setLabel('Ping Help')
        .setEmoji('🏓')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('help_manage_ticket')
        .setLabel('Manage Ticket')
        .setEmoji('🛠️')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('help_setup_ticket')
        .setLabel('Setup Ticket')
        .setEmoji('🎫')
        .setStyle(ButtonStyle.Primary)
    );

    // Container to group all together in Components V2 style
    const contents = [
      heading,
      intro,
      divider,
      new ContainerBuilder().addTextDisplayComponents(),
      new ActionRowBuilder().addComponents(helpMenu),
      helpButtonRow
    ];

    await interaction.reply({
      components: contents,
      flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
    });
  }
};

// ---- GLOBAL INTERACTION HANDLER ----

// Place this event somewhere in your main bot file
client.on(Events.InteractionCreate, async (interaction) => {
  // Select menu or button presses
  if (
    interaction.isButton() &&
    ['help_ping', 'help_manage_ticket', 'help_setup_ticket'].includes(interaction.customId)
  ) {
    const helpTopics = {
      help_ping: {
        title: '🏓 Ping Command Help',
        desc: 'Use `/ping` to check the bot’s current latency, which can help diagnose connection issues.'
      },
      help_manage_ticket: {
        title: '🛠️ Manage Ticket Help',
        desc: 'Manage your tickets by:\n- `/ticket close` – Closes the current ticket\n- `/ticket info` – Get details about your ticket\n- For more, see the **server’s ticket documentation.**'
      },
      help_setup_ticket: {
        title: '🎫 Setup Ticket Help',
        desc: 'Set up the ticket system using `/setup-ticket`:\n1. Choose the category and permissions.\n2. Customize the ticket panel as you like.\n3. Deploy for users to create support tickets.'
      }
    };
    const { title, desc } = helpTopics[interaction.customId];
    await interaction.reply({
      components: [
        new TextDisplayBuilder().setContent(`## ${title}\n${desc}`)
      ],
      flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
    });
  }

  if (
    interaction.isStringSelectMenu() &&
    ['help_select'].includes(interaction.customId)
  ) {
    const topic = interaction.values[0];
    const helpTopics = {
      help_ping: {
        title: '🏓 Ping Command Help',
        desc: 'Use `/ping` to check the bot’s current latency, which can help diagnose connection issues.'
      },
      help_manage_ticket: {
        title: '🛠️ Manage Ticket Help',
        desc: 'Manage your tickets by:\n- `/ticket close` – Closes the current ticket\n- `/ticket info` – Get details about your ticket\n- For more, see the **server’s ticket documentation.**'
      },
      help_setup_ticket: {
        title: '🎫 Setup Ticket Help',
        desc: 'Set up the ticket system using `/setup-ticket`:\n1. Choose the category and permissions.\n2. Customize the ticket panel as you like.\n3. Deploy for users to create support tickets.'
      }
    };
    const { title, desc } = helpTopics[topic];
    await interaction.reply({
      components: [
        new TextDisplayBuilder().setContent(`## ${title}\n${desc}`)
      ],
      flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
    });
  }
});
