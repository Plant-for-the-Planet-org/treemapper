import Config from 'react-native-config';

export enum ENV_TYPE {
  STAGING = 'STAGING',
  PROD = 'PRODUCTION',
}

export const ENVS = {
  STAGING: {
    BUGSNAP_CLIENT_KEY: Config.BUGSNAP_CLIENT_KEY,
    AUTH0_DOMAIN: 'accounts.plant-for-the-planet.org',
    AUTH0_CLIENT_ID: 'LiEqEef641Pzv8cBGn6i9Jt9jrnyLJEt',
    API_ENDPOINT: 'app-staging.plant-for-the-planet.org',
    CDN_URL: 'cdn.plant-for-the-planet.org/staging',
    WEB_APP_URL: 'dev.pp.eco',
  },
  PRODUCTION: {
    BUGSNAP_CLIENT_KEY: 'e1b5d94f16186f8c6a2169882998ebda',
    AUTH0_DOMAIN: 'accounts.plant-for-the-planet.org',
    AUTH0_CLIENT_ID: 'LiEqEef641Pzv8cBGn6i9Jt9jrnyLJEt',
    API_ENDPOINT: 'app.plant-for-the-planet.org',
    CDN_URL: 'cdn.plant-for-the-planet.org',
    WEB_APP_URL: 'www1.plant-for-the-planet.org',
    REALM_DISABLE_ANALYTICS: true,
  },
};
