import {
  ChatInputCommandInteraction,
  Client,
  Collection,
  Events,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  TextChannel,
} from 'discord.js';

import { discord as discordConfig } from './config.json';

const { token, clientId, guildId } = discordConfig;

const commands = [
  {
    data: new SlashCommandBuilder().setName('ping').setDescription('Replies with Pong!'),
    execute: async (interaction: ChatInputCommandInteraction) => {
      await interaction.reply('Pong!');
    },
  },
  {
    data: new SlashCommandBuilder().setName('user').setDescription('Provides information about the user.'),
    execute: async (interaction: ChatInputCommandInteraction) => {
      // interaction.user is the object representing the User who ran the command
      // interaction.member is the GuildMember object, which represents the user in the specific guild
      await interaction.reply(
        `This command was run by ${interaction.user.username}, who joined on ${(interaction.member as any).joinedAt}.`,
      );
    },
  },
];

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
});
(client as any).commands = new Collection();

export const init = () => {
  // コマンドの登録
  commands.forEach((command) => (client as any).commands.set(command.data.name, command));

  // Construct and prepare an instance of the REST module
  const rest = new REST().setToken(token);

  // and deploy your commands!
  (async () => {
    try {
      console.log(`Started refreshing ${commands.length} application (/) commands.`);

      // The put method is used to fully refresh all commands in the guild with the current set
      const data = await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
        body: commands.map((command) => command.data.toJSON()),
      });

      console.log(`Successfully reloaded ${(data as any).length} application (/) commands.`);
    } catch (error) {
      // And of course, make sure you catch and log any errors!
      console.error(error);
    }
  })();

  // ログインが成功した時
  client.on(Events.ClientReady, async (readyClient) => {
    console.log(`Ready! Logged in as ${readyClient.user.tag}`);
  });

  // メッセージを受信した時
  client.on(Events.MessageCreate, (message) => {
    const {
      author: { bot, username },
      content,
    } = message;

    if (bot) return;

    console.log(username, content);
  });

  // コマンドを受信した時
  client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const command = (interaction.client as any).commands.get(interaction.commandName);

    if (!command) {
      console.error(`No command matching ${interaction.commandName} was found.`);
      return;
    }

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(error);
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content: 'There was an error while executing this command!',
          ephemeral: true,
        });
      } else {
        await interaction.reply({
          content: 'There was an error while executing this command!',
          ephemeral: true,
        });
      }
    }
  });

  // ログイン
  client.login(token);
};

export const send = (channelId: string, message: string) =>
  (client.channels.cache.get(channelId) as TextChannel | undefined)?.send(message);
