# Torrentio for Raycast
Watch movies and tv series directly from raycast using the Torrentio API and your favourite debrid service

## How it works
Torrentio for Raycast the [Stremio Cinemata API](https://v3-cinemeta.strem.io) to find movies and shows
and the [Torrentio API](https://torrentio.strem.fun) to find sources. It then launches the http video
stream in your favourite video player.

For now you need a supported debrid provider. I might consider adding
webtorrent support in the future.

## Supported Debrid Services:
- RealDebrid ([Get API key](https://real-debrid.com/apitoken))
- Premiumize ([Get API key](https://www.premiumize.me/account))
- AllDebrid  ([Get API key](https://alldebrid.com/apikeys))
- DebridLink ([Get API key](https://debrid-link.fr/webapp/apikey))
- Offcloud   ([Get API key](https://offcloud.com/#/account))
- Put.io     ([Get API key](https://app.put.io/oauth))
  - Use Format: {ClientID}@{Token}
