const path = require('node:path');

/**
 * Create a route from root.
 * @param {String} filename ID of guild.
 * @returns {String} Path to file.
 */
function createRoute (filename) {
  return filename ? path.join(process.cwd() + '/soundcord', filename + '.mp3'): path.join(process.cwd(), 'soundcord');
}

module.exports = createRoute;