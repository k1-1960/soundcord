# Soundcord
A simple package to play soundtracks from SoundCloud on Discord.
> `npm install --no-bin-links soundcord`

## How to use / Example

```js
const {
  Client,
  GatewayIntentBits: Intents
} = require('discord.js');
const {
  PlayerBuilder
} = require('soundcord');

// Creating a Discord bot.
const bot = new Client({
  intents: [
    Intents.Guilds,
    Intents.GuildMessages,
    Intents.MessageContent,
    Intents.GuildVoiceStates,
  ]
});

/* —— creating and putting the sound player in the discord bot. —— */
bot.player = new PlayerBuilder();

// Creating simple "playSong" and "endSong" events.
player
.on('playSong', (channel, song) => {
  channel.send(`🔊 Now playing: **${song.title}** - **${song.duration.replace(/[a-z]/gi, '').trim().replace(/ +/g, ':')}**`);
})
.on('endSong', (channel) => {
  channel.send({
    content: '🔈 Music playback terminated, voice channel abandoned...'
  });
});

// Creating a simple "messageCreate" event to detect the commands in the chat.
bot.on('messageCreate', (message) => {
  const prefix = '!'; // Bot prefix.
  
  if (message.author.bot || !message.content.startsWith(prefix)) return;
  
  const args = message.content
  .slice(prefix.length)
  .trim()
  .split(/ +/g);
  
  const command = args
  .shift()
  .toLowerCase();
  
  switch (command) {
    case 'play':
      let songName = args.join(' ');
      bot.player.play(songName, message);
  }
});
```