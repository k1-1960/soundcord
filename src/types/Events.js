/**
 * All event names.
 * @property {String} ADD_PLAYLIST Emitted when a playlist is added.
 * @property {String} PLAY_SONG Emitted when a song is playing.
 * @property {String} END_SONG Emitted when a song ends.
 * @property {String} PAUSE Emitted when a the music is paused.
 * @property {String} RESUME Emitted when a the music is unpaused.
 * @property {String} SKIP Emitted when a song is skiped.
 */
const Events = {
  ADD_PLAYLIST: 'addPlaylist',
  PLAY_SONG: 'playSong',
  END_SONG: 'endSong',
  PAUSE: 'pause',
  RESUME: 'resume',
  SKIP: 'skip'
};

module.exports = Events;