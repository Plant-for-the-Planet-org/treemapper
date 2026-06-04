import { StyleSheet, ActivityIndicator, View } from 'react-native'
import React, { useState, useRef, useEffect } from 'react'
import { WebView } from 'react-native-webview'
import Header from 'src/components/common/Header'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Colors } from 'src/utils/constants'
import NetInfo from '@react-native-community/netinfo'
import { useNavigation } from '@react-navigation/native'

const DOCS_URL = 'https://docs.treemapper.app/'

const GuideView = () => {
  const [loading, setLoading] = useState(true)
  const webViewRef = useRef<WebView>(null)
  const navigation = useNavigation()

  useEffect(() => {
    // Check network status and reload when coming back online to update cache
    const unsubscribe = NetInfo.addEventListener(state => {
      const online = state.isConnected && state.isInternetReachable !== false
      
      // If we come back online, reload to update cache
      if (online && webViewRef.current) {
        webViewRef.current.reload()
      }
    })

    return () => unsubscribe()
  }, [])

  // JavaScript to inject into the webview
  const injectedJavaScript = `
    (function() {
      // Mark that we're in TreeMapper app
      window.TreeMapperApp = true;
      
      // Dispatch event to notify the page
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
          window.dispatchEvent(new Event('treemapper-app-detected'));
        });
      } else {
        window.dispatchEvent(new Event('treemapper-app-detected'));
      }
      
      // Listen for back button clicks from the page
      window.addEventListener('treemapper-back-click', function() {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'goBack' }));
      });
      
      true; // Required for iOS
    })();
  `

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data)
      if (data.type === 'goBack') {
        navigation.goBack()
      }
    } catch (error) {
      console.error('Error parsing message:', error)
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.webViewContainer}>
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.NEW_PRIMARY || '#007A49'} />
          </View>
        )}
        <WebView
          ref={webViewRef}
          source={{ 
            uri: DOCS_URL,
            headers: {
              'User-Agent': 'TreeMapper-Mobile-App/1.0'
            }
          }}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          onMessage={handleMessage}
          injectedJavaScript={injectedJavaScript}
          style={styles.webView}
          startInLoadingState={true}
          cacheEnabled={true}
          cacheMode="LOAD_CACHE_ELSE_NETWORK"
          domStorageEnabled={true}
          javaScriptEnabled={true}
          renderLoading={() => (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.NEW_PRIMARY || '#007A49'} />
            </View>
          )}
        />
      </View>
    </SafeAreaView>
  )
}

export default GuideView

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.WHITE,
  },
  webViewContainer: {
    flex: 1,
  },
  webView: {
    flex: 1,
    backgroundColor: Colors.WHITE,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.WHITE,
  },
})
