const {
  Client
} = require("soundcloud-scraper");

class SoundCloudClient extends Client {
  constructor () {
    super();
  }
}

module.exports = SoundCloudClient;