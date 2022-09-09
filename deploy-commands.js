const { SlashCommandBuilder, Routes } = require('discord.js');
const { REST } = require('@discordjs/rest');
const { clientId, guildId, token } = require('./config.json');

const commands = [
  new SlashCommandBuilder().setName('ping').setDescription('Replies with pong 🏓 !'),
  new SlashCommandBuilder().setName('help').setDescription('Send you in PM the list 📝 of sounds.'),
  new SlashCommandBuilder().setName('airhorn').setDescription('Play a random airhorn 🎉 !'),
  new SlashCommandBuilder().setName('random').setDescription('Play a random 🎲 sound.'),
  new SlashCommandBuilder()
    .setName('play')
    .setDescription('Play a sound 🔊 !')
    .addStringOption((option) => option.setName('query')
      .setDescription('Sound to search/play')
      .setAutocomplete(true)),
].map((command) => command.toJSON());

const rest = new REST({ version: '10' }).setToken(token);

// delete all current commands
rest
  .put(Routes.applicationGuildCommands(clientId, guildId), { body: [] })
  .then(() => console.log('Successfully deleted all guild commands.'))
  .catch(console.error);

// push all commands
rest
  .put(Routes.applicationGuildCommands(clientId, guildId), { body: commands })
  .then((data) => console.log(`Successfully registered ${data.length} application commands.`))
  .catch(console.error);
