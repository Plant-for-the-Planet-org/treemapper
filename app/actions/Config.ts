import Config from 'react-native-config';

let APIConfig = {
  protocol: 'https',
  url: Config.API_ENDPOINT,
  cdnUrl: Config.CDN_URL,
  webAppUrl: Config.WEB_APP_URL,
};

export { APIConfig };
