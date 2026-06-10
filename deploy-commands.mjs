import { REST, Routes, SlashCommandBuilder } from 'discord.js';

const { DISCORD_TOKEN, CLIENT_ID, GUILD_ID } = process.env;

if (!DISCORD_TOKEN || !CLIENT_ID || !GUILD_ID) {
  console.error(
    'Missing env vars: DISCORD_TOKEN, CLIENT_ID and GUILD_ID are required (see .env.example).'
  );
  process.exit(1);
}

const commands = [
  new SlashCommandBuilder().setName('ping').setDescription('Replies with pong 🏓 !'),
  new SlashCommandBuilder().setName('help').setDescription('Send you in PM the list 📝 of sounds.'),
  new SlashCommandBuilder().setName('airhorn').setDescription('Play a random airhorn 🎉 !'),
  new SlashCommandBuilder().setName('random').setDescription('Play a random 🎲 sound.'),
  new SlashCommandBuilder()
    .setName('play')
    .setDescription('Play a sound 🔊 !')
    .addStringOption((option) =>
      option.setName('query').setDescription('Sound to search/play').setAutocomplete(true)
    )
].map((command) => command.toJSON());

const rest = new REST().setToken(DISCORD_TOKEN);

try {
  const result = await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), {
    body: commands
  });

  console.log(`Successfully registered ${result.length} application commands.`);
} catch (error) {
  console.error(error);
  process.exit(1);
}
