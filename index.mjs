import path from 'node:path';
import glob from 'glob';
import { Client, GatewayIntentBits } from 'discord.js';
import {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  entersState,
  VoiceConnectionStatus,
} from '@discordjs/voice';

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
  image: globListToObject(glob.sync('image/*.*')),
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

async function playSoundToChannel(sound, channel) {
  try {
    if (channel) {
      const connection = await connectToChannel(channel);
      connection.subscribe(audioPlayer);
      const resource = createAudioResource(sound);
      audioPlayer.play(resource);
    }
  } catch (err) {
    log(err);
  }
}

async function onMessage(message) {
  switch (message.content) {
    case '!ping': {
      log('!ping', message.author.tag);
      await message.channel.send('ಠ_ಠ pong.');
      break;
    }
    case '!help': {
      log('!help', message.author.tag);
      let msg = ['-- Sounds ------------------------------', '`!airhorn`'];
      Object.keys(data.audio.all).forEach((key) => {
        msg.push(`\`!${key}\``);
      });
      const NB_LINES = 50;
      for (let i = 0; i < msg.length; i += NB_LINES) {
        // eslint-disable-next-line no-await-in-loop
        await message.author.send(msg.slice(i, i + NB_LINES).join('\n'));
        // eslint-disable-next-line no-await-in-loop
        await sleep(200);
      }

      msg = '-- Images ------------------------------\n';
      Object.keys(data.image).forEach((key) => {
        msg += `\`!${key}\`\n`;
      });
      await message.author.send(msg);
      try {
        await message.delete();
      } catch (err) {
        log('cant delete..', message.content);
      }
      break;
    }
    case '!airhorn': {
      const allNames = Object.keys(data.audio.airhorn);
      const randomName = allNames[Math.floor(Math.random() * allNames.length)];
      log('!airhorn', message.author.tag);
      if (message.member?.voice?.channel) {
        playSoundToChannel(
          data.audio.airhorn[randomName],
          message.member.voice.channel,
        );
        try {
          await message.delete();
        } catch (err) {
          log('cant delete..', message.content);
        }
      } else {
        await message.author.send('You are not in a voice channel ಠ_ಠ');
      }
      break;
    }
    case '!random': {
      const allNames = Object.keys(data.audio.all);
      const randomName = allNames[Math.floor(Math.random() * allNames.length)];
      log(`!random >> ${randomName}`, message.author.tag);
      if (message.member?.voice?.channel) {
        playSoundToChannel(data.audio.all[randomName], message.member.voice.channel);
        try {
          await message.delete();
        } catch (err) {
          log('cant delete..', message.content);
        }
      } else {
        await message.author.send('You are not in a voice channel ಠ_ಠ');
      }
      break;
    }
    default: {
      const cmdName = message.content.substr(1);
      const prefix = message.content.substring(0, 1);
      if (prefix === '!') {
        if (data.audio.all[cmdName]) {
          log(`!${cmdName}`, message.author.tag);
          if (message.member?.voice?.channel) {
            playSoundToChannel(data.audio.all[cmdName], message.member.voice.channel);
            try {
              await message.delete();
            } catch (err) {
              log('cant delete..', message.content);
            }
          } else {
            await message.author.send('You are not in a voice channel ಠ_ಠ');
          }
        }
        if (data.image[cmdName]) {
          log(`!${cmdName}`, message.author.tag);
          await message.channel.send('', { files: [data.image[cmdName]] });
          try {
            await message.delete();
          } catch (err) {
            log('cant delete..', message.content);
          }
        }
      }
      break;
    }
  }
}

function initDiscordClient() {
  client.once('ready', () => {
    log('Ready!');
  });
  client.login(process.env.DISCORD_TOKEN);
  client.on('messageCreate', onMessage);
}
initDiscordClient();
