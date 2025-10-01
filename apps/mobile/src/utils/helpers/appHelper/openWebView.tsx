import * as WebBrowser from 'expo-web-browser'

/**
 * Opens the url inside the app, if in app browser is not available then opens the link in browser
 *
 * @param {string} link - link to be opened in web view
 */
const openWebView = async (link: string) => {
  try {
    await WebBrowser.openBrowserAsync(link)
  } catch (error) {
    console.error(error)
  }
}

export default openWebView
