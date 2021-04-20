import Config from 'react-native-config';

let APIConfig = {
  protocol: 'https',
  url: Config.API_ENDPOINT,
  cdnUrl: Config.CDN_URL,
};

export { APIConfig };
