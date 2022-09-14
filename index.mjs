import path from 'node:path';
import glob from 'glob';
import { Client, GatewayIntentBits, InteractionType } from 'discord.js';
import {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  entersState,
  VoiceConnectionStatus,
} from '@discordjs/voice';
import Fuse from 'fuse.js';
// for local dev
// import config from './config.json' assert { type: 'json' };

const audioPlayer = createAudioPlayer();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.MessageContent,
  ],
});

function log(...args) {
  // eslint-disable-next-line no-console
  console.log(new Date().toJSON(), args);
}

async function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function globListToObject(arr) {
  return arr.reduce(
    (acc, item) => ({ ...acc, [path.basename(item, path.extname(item))]: item }),
    {},
  );
}

const data = {
  audio: {
    all: globListToObject(glob.sync('audio/all/*.*')),
    airhorn: globListToObject(glob.sync('audio/airhorn/*.*')),
  },
};

async function connectToChannel(channel) {
  const connection = joinVoiceChannel({
    channelId: channel.id,
    guildId: channel.guild.id,
    adapterCreator: channel.guild.voiceAdapterCreator,
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
    await interaction.reply({ content: `▶️ \`${soundName}\``, ephemeral: true });
    try {
      const connection = await connectToChannel(interaction.member.voice.channel);
      connection.subscribe(audioPlayer);
      const resource = createAudioResource(sound);
      audioPlayer.play(resource);
    } catch (err) {
      log(err);
    }
  } else {
    await interaction.reply({ content: '‼️ You are not in a voice channel ಠ_ಠ', ephemeral: true });
  }
}

async function onCommand(interaction) {
  switch (interaction.commandName) {
    case 'ping': {
      log('/ping', interaction.user.tag);
      await interaction.reply({ content: 'ಠ_ಠ pong', ephemeral: true });
      break;
    }
    case 'help': {
      log('/help', interaction.user.tag);
      await interaction.reply({
        content: 'Sending you the list of sounds in PM..',
        ephemeral: true,
      });
      const msg = ['-- Sounds ------------------------------', '`/airhorn`'];
      Object.keys(data.audio.all).forEach((key) => {
        msg.push(`\`/play ${key}\``);
      });
      const NB_LINES = 50;
      for (let i = 0; i < msg.length; i += NB_LINES) {
        // eslint-disable-next-line no-await-in-loop
        await interaction.user.send(msg.slice(i, i + NB_LINES).join('\n'));
        // eslint-disable-next-line no-await-in-loop
        await sleep(200);
      }
      await interaction.user.send(msg);
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
          ephemeral: true,
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
  const allSounds = Object.keys(data.audio.all).sort((a, b) => a.length - b.length);
  let fuse;
  let result;
  switch (interaction.commandName) {
    case 'play':
      fuse = new Fuse(allSounds);
      result = fuse.search(focusedValue, { limit: 25 });
      await interaction.respond(result.map((res) => ({ name: res.item, value: res.item })));
      break;
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
  client.once('ready', () => {
    log('Ready!');
  });
  client.login(process.env.DISCORD_TOKEN);
  // client.login(config.token);
  client.on('interactionCreate', onInteraction);
  client.on('error', (err) => {
    log('Error!', err);
  });
}
initDiscordClient();
