require('dotenv').config();
const tp = require('../functions/TP.js');
const createRoute = require('../functions/createRoute.js');
const Events = require('../types/Events.js');
const path = require('node:path');
const fs = require('node:fs');

const {
  joinVoiceChannel,
  AudioPlayer,
  AudioPlayerStatus,
  createAudioPlayer,
  createAudioResource,
  VoiceConnection,
  StreamType
} = require('@discordjs/voice');
const {
  createWriteStream,
  createReadStream,
  unlink
} = fs;

const SoundCloudClient = require('./SoundCloudClient.js');

/**
 * It is recommended to define as "client.player" in your bot.
 * @class
 */
class Player extends AudioPlayer {
  constructor (options = {
    debug: false
  }) {
    super(options);
    if (!fs.existsSync(createRoute())) fs.mkdirSync(createRoute());
    
    this.client = new SoundCloudClient();
    this.connections = [];
    this.players = [];
  }
  
  /**
   * Get the guild player playlist.
   * @param {Object} interaction Interaction object (Message|Interaction).
   */
  getPlaylist (interaction) {
    return cb((this.players
      .find(x => x.metadata.guildId === interaction.guild.id) || {
        playlist: []}).playlist);
  }
  
  /**
   * Find or create a connection.
   * @param {Object} PlayerConnectionOptions PlayerConnectionOptions.
   */
  async connect (PlayerConnectionOptions) {
    let find = (this.connections.find(x => x.joinConfig.guildId === PlayerConnectionOptions.guildId));
    if (find) {
      return find;
    } else {
      let connection = joinVoiceChannel(PlayerConnectionOptions);

      this.connections.push(connection);
      return connection;
    }
  }
  
  /**
   * Get or create a AudioPlayer.
   * @param {Object} interaction Interaction object (Message|Interaction).
   */
  async createPlayer (interaction) {
    let find = (this.players.find(x => x.guildId === interaction.guild.id));
    if (find) {
      return find.player;
    } else {
      let player = createAudioPlayer();
      player.metadata = {};
      player.playlist = [];
      player.metadata.guildId = interaction.guild.id;

      player
      .on(AudioPlayerStatus.Idle, (oldStatus) => {
        if (oldStatus.status !== AudioPlayerStatus.Idle && player.playlist.length >= 1) {
          let nextSong = player.playlist.shift();
          this.play(nextSong, interaction);
          player.playlist = player.playlist
          .filter(x => x !== nextSong);
        }
        if (player.playlist.length === 0) {
          let myConnection = this.connections
          .find(x => x.joinConfig.guildId === interaction.guild.id);
          if (myConnection) {
            myConnection.disconnect();
            this
            .emit(Events.END_SONG, interaction.channel);
            this
            .connections = this.connections
            .filter(x => x.joinConfig.guildId !== interaction.guild.id);
          }
        }
      });
      this.players.push(player);
      return player;
    }
  }
  
  /**
   * Play a song.
   * @param {String} query Song title or playlist link.
   * @param {Object} interaction Interaction object (Message|Interaction).
   */
  async play (query,
    interaction) {
    this
    .search(query,
      interaction,
      async (route, song) => {
        let myConnection = this.connections.find(x => x.joinConfig.guildId === interaction.guild.id);
        if (!myConnection) myConnection = await this.connect({
          channelId: interaction.member.voice.channelId,
          guildId: interaction.guild.id,
          adapterCreator: interaction.guild.voiceAdapterCreator
        });
        let myPlayer = this.players.find(x => x.metadata.guildId === interaction.guild.id);
        if (!myPlayer) myPlayer = await this.createPlayer(interaction);

        let Resource = createAudioResource(route, {
          inlineVolume: true
        });


        Resource.volume.setVolume(0.5);

        myPlayer.play(Resource);
        myConnection.subscribe(myPlayer);
        this.emit(Events.PLAY_SONG,
          interaction.channel,
          song);
      });

  }
  
  /**
   * Search a song or playlist.
   * @param {String} query Song title or playlist link.
   * @param {Object} interaction Interaction object (Message|Interaction).
   * @param {search~Callback} cb - The callback that handles the response
   */
  async search (query,
    interaction,
    cb) {
    if (query.startsWith('https://soundcloud.com/') || query.startsWith('https://m.soundcloud.com/')) {
      this.searchPlaylist(query, interaction);
    } else {
      this.client.search(query,
        'track')
      .then(async ArrayOfTracks => {
        let targetTrack = ArrayOfTracks.shift();

        if (!targetTrack) return false;

        this.client.getSongInfo(targetTrack.url)
        .then(async (song) => {
          let stream = await song
          .downloadProgressive();

          let writer = stream.pipe(fs.createWriteStream(createRoute(interaction.guild.id)));
          song.title = song.title.replace('.mp3', '');
          song.duration = tp(song.duration);
          writer.on('finish', () => cb(createRoute(interaction.guild.id), song));
        })
        .catch(err => console.error('[Soundcord Error] ??? ', err));
      })
      .catch(err => console.error('[Soundcord Error] ??? ', err));
    }
  }
  /**
   * @callback search~Callback
   * @param {String} FilePath
   * @param {string} SongInfo
   */

  /**
   * Search a playlist.
   * @param {String} query playlist link or title.
   * @param {Object} interaction Interaction object (Message|Interaction).
   * @param {searchPlaylist~Callback} cb - The callback that handles the response
   */
  async searchPlaylist (query,
    interaction,
    cb) {
    let myPlayer = this.players.find(x => x.metadata.guildId === interaction.guild.id) || await this.createPlayer(interaction);

    if (query.startsWith('https://soundcloud.com/') || query.startsWith('https://m.soundcloud.com/')) {

      this.client.getPlaylist(query.replace('https://m.soundcloud.com/', 'https://soundcloud.com/'))
      .then(async x => {
        await x.tracks.forEach(s => {
          myPlayer.playlist.push(s.title);
        });

        this.emit(Events.ADD_PLAYLIST, interaction.channel, x);
        /*interaction.reply('The songs on the list have been added to the list on the server.');*/

        let npsong = myPlayer.playlist.shift();
        this.play(npsong, interaction);
        myPlayer.playlist = myPlayer.playlist.filter(x => x !== npsong);
      });
    } else {
      this.client
      .search(query,
        'playlist')
      .then((result) => {
        this.client.getPlaylist(result[0].url)
        .then(async x => {
          await x.tracks.forEach(s => {
            myPlayer.playlist.push(s.title);
          });

          this.emit(Events.ADD_PLAYLIST, interaction.channel, x);
          /*interaction.reply('The songs on the list have been added to the list on the server.');*/

          let npsong = myPlayer.playlist.shift();
          this.play(npsong, interaction);
          myPlayer.playlist = myPlayer.playlist.filter(x => x !== npsong);
        });
      });
    }
  }
  
  /**
   * Pause music playback.
   * @param {Object} interaction Interaction object (Message|Interaction).
   */
  pause (interaction) {
    let myPlayer = this.players.find(x => x.metadata.guildId === interaction.guild.id);
    myPlayer.pause();
    this.emit(Events.PAUSE, interaction.channel);
  }
  
  /**
   * Resumes music playback.
   * @param {Object} interaction Interaction object (Message|Interaction).
   */
  async resume (interaction) {
    let myPlayer = this.players.find(x => x.metadata.guildId === interaction.guild.id);

    myPlayer.unpause();
    this.emit(Events.RESUME, interaction.channel);
  }
  /**
   * Skip to the next song.
   * @param {Object} interaction Interaction object (Message|Interaction).
   */
  async skip (interaction) {
    let myPlayer = this.players
    .find(x => x.metadata.guildId === interaction.guild.id) || await this.createPlayer(interaction);
    let npsong = myPlayer.playlist.shift();

    if (typeof npsong === "string") {
      this.emit(Events.SKIP, (interaction.channel));
      this.play(npsong, interaction);
      myPlayer.playlist = myPlayer.playlist.filter(x => x !== npsong);
    } else {
      myPlayer.emit(AudioPlayerStatus.Idle, {
        status: AudioPlayerStatus.Idle
      });
    }
  }
}

module.exports = Player;