const {
  Client
} = require("soundcloud-scraper");

/**
 * Create soundcloud-scraper client.
 * @class
 */
class SoundCloudClient extends Client {
  constructor () {
    super();
  }
}

module.exports = SoundCloudClient;