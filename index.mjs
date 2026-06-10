import path from 'node:path';
import { readdir } from 'node:fs/promises';
import { Client, Events, GatewayIntentBits, InteractionType, MessageFlags } from 'discord.js';
import {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  entersState,
  VoiceConnectionStatus
} from '@discordjs/voice';
import Fuse from 'fuse.js';

const audioPlayer = createAudioPlayer();

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates]
});

function log(...args) {
  console.log(new Date().toJSON(), args);
}

async function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function listSounds(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  return Object.fromEntries(
    entries
      .filter((entry) => entry.isFile())
      .map((entry) => [
        path.basename(entry.name, path.extname(entry.name)),
        path.join(dir, entry.name)
      ])
  );
}

const [allSoundsByName, airhornSoundsByName] = await Promise.all([
  listSounds('audio/all'),
  listSounds('audio/airhorn')
]);

const data = {
  audio: {
    all: allSoundsByName,
    airhorn: airhornSoundsByName
  }
};

async function connectToChannel(channel) {
  const connection = joinVoiceChannel({
    channelId: channel.id,
    guildId: channel.guild.id,
    adapterCreator: channel.guild.voiceAdapterCreator
  });

  try {
    await entersState(connection, VoiceConnectionStatus.Ready, 30e3);
    return connection;
  } catch (error) {
    connection.destroy();
    throw error;
  }
}

async function playSoundToChannel(sound, soundName, interaction) {
  if (interaction.member?.voice?.channel) {
    await interaction.reply({ content: `▶️ \`${soundName}\``, flags: MessageFlags.Ephemeral });
    try {
      const connection = await connectToChannel(interaction.member.voice.channel);
      connection.subscribe(audioPlayer);
      const resource = createAudioResource(sound);
      audioPlayer.play(resource);
    } catch (err) {
      log(err);
    }
  } else {
    await interaction.reply({
      content: '‼️ You are not in a voice channel ಠ_ಠ',
      flags: MessageFlags.Ephemeral
    });
  }
}

async function onCommand(interaction) {
  switch (interaction.commandName) {
    case 'ping': {
      log('/ping', interaction.user.tag);
      await interaction.reply({ content: 'ಠ_ಠ pong', flags: MessageFlags.Ephemeral });
      break;
    }
    case 'help': {
      log('/help', interaction.user.tag);
      await interaction.reply({
        content: 'Sending you the list of sounds in PM..',
        flags: MessageFlags.Ephemeral
      });
      const msg = ['-- Sounds ------------------------------', '`/airhorn`'];
      Object.keys(data.audio.all).forEach((key) => {
        msg.push(`\`/play ${key}\``);
      });
      const NB_LINES = 50;
      for (let i = 0; i < msg.length; i += NB_LINES) {
        await interaction.user.send(msg.slice(i, i + NB_LINES).join('\n'));
        await sleep(200);
      }
      break;
    }
    case 'airhorn': {
      const allSounds = Object.keys(data.audio.airhorn);
      const randomSound = allSounds[Math.floor(Math.random() * allSounds.length)];
      log(`/airhorn >> ${randomSound}`, interaction.user.tag);
      playSoundToChannel(data.audio.airhorn[randomSound], randomSound, interaction);
      break;
    }
    case 'random': {
      const allSounds = Object.keys(data.audio.all);
      const randomSound = allSounds[Math.floor(Math.random() * allSounds.length)];
      log(`/random >> ${randomSound}`, interaction.user.tag);
      playSoundToChannel(data.audio.all[randomSound], randomSound, interaction);
      break;
    }
    case 'play': {
      const query = interaction.options.getString('query');
      if (data.audio.all[query]) {
        log(`/play ${query}`, interaction.user.tag);
        playSoundToChannel(data.audio.all[query], query, interaction);
      } else {
        await interaction.reply({
          content: `‼️ No sound to play with \`${query}\` 👀`,
          flags: MessageFlags.Ephemeral
        });
      }
      break;
    }
    default:
      log('wtf onCommand interaction.commandName', interaction.commandName);
      break;
  }
}

async function onAutoComplete(interaction) {
  const focusedValue = interaction.options.getFocused();
  const allSounds = Object.keys(data.audio.all).toSorted((a, b) => a.length - b.length);
  switch (interaction.commandName) {
    case 'play': {
      const fuse = new Fuse(allSounds);
      const result = fuse.search(focusedValue, { limit: 25 });
      await interaction.respond(result.map((res) => ({ name: res.item, value: res.item })));
      break;
    }
    default:
      log('wtf onAutoComplete interaction.commandName', interaction.commandName);
      break;
  }
}

async function onInteraction(interaction) {
  switch (interaction.type) {
    case InteractionType.ApplicationCommand:
      onCommand(interaction);
      break;
    case InteractionType.ApplicationCommandAutocomplete:
      onAutoComplete(interaction);
      break;
    default:
      log('wtf interaction', interaction);
      break;
  }
}

function initDiscordClient() {
  client.once(Events.ClientReady, (readyClient) => {
    log(`Ready! Logged in as ${readyClient.user.tag}`);
  });
  client.on(Events.InteractionCreate, onInteraction);
  client.on(Events.Error, (err) => {
    log('Error!', err);
  });
  client.login(process.env.DISCORD_TOKEN);
}
initDiscordClient();
