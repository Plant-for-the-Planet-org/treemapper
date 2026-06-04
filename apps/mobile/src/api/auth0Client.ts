import Auth0 from 'react-native-auth0'

// Standalone Auth0 client for use OUTSIDE React (e.g. the fetch layer), where
// the `useAuth0()` hook is not available. It reads the same native credential
// store (Keychain / Keystore) that `Auth0Provider` writes to, so calling
// `credentialsManager.getCredentials(...)` here renews the very same session.
// Keep domain / clientId in sync with the <Auth0Provider> in App.tsx.
const auth0 = new Auth0({
  domain: process.env.EXPO_PUBLIC_AUTH0_DOMAIN as string,
  clientId: process.env.EXPO_PUBLIC_CLIENT_ID_AUTH0 as string,
})

export default auth0
