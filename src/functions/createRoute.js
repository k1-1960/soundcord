const path = require('node:path');

module.exports = (filename) => filename ? path.join(process.cwd() + '/soundcord', filename + '.mp3'): path.join(process.cwd(), 'soundcord');