/**
 * Badehy Shell App
 * A React Native shell application that displays the web app in a WebView
 */

import React, {useState} from 'react';
import {
  StyleSheet,
  View,
  ActivityIndicator,
  Text,
  SafeAreaView,
  StatusBar,
  Platform,
  Alert,
} from 'react-native';
import {WebView} from 'react-native-webview';

// Get web app URL from environment or default to localhost
// For production, set this in your build configuration or use a config file
// For iOS: Edit Info.plist or use build settings
// For Android: Edit strings.xml or build.gradle
const getWebAppUrl = (): string => {
  // Try to get from environment variable first
  if (process.env.WEB_APP_URL) {
    return process.env.WEB_APP_URL;
  }
  
  // Default fallback - Client web app URL
  // For development, use local network IP or localhost
  // For production, replace with your deployed client web app URL
  return __DEV__ ? 'http://localhost:3002' : 'https://your-client-webapp-url.com';
};

const WEB_APP_URL = getWebAppUrl();

const App: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleLoadStart = () => {
    setLoading(true);
    setError(null);
  };

  const handleLoadEnd = () => {
    setLoading(false);
  };

  const handleError = (syntheticEvent: any) => {
    const {nativeEvent} = syntheticEvent;
    console.error('WebView error: ', nativeEvent);
    setError('Failed to load the application. Please check your connection.');
    setLoading(false);
  };

  const handleHttpError = (syntheticEvent: any) => {
    const {nativeEvent} = syntheticEvent;
    console.error('HTTP error: ', nativeEvent);
    if (nativeEvent.statusCode >= 400) {
      setError(
        `Failed to load (${nativeEvent.statusCode}). Please check if the server is running.`,
      );
    }
    setLoading(false);
  };

  // Inject JavaScript to ensure mobile-optimized viewport
  const injectedJavaScript = `
    (function() {
      // Set viewport meta tag if not present
      if (!document.querySelector('meta[name="viewport"]')) {
        const meta = document.createElement('meta');
        meta.name = 'viewport';
        meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';
        document.getElementsByTagName('head')[0].appendChild(meta);
      }
      
      // Force mobile-friendly viewport
      const existingViewport = document.querySelector('meta[name="viewport"]');
      if (existingViewport) {
        existingViewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover');
      }
      
      // Prevent text selection on mobile (optional - can be removed if needed)
      document.addEventListener('touchstart', function(e) {
        if (e.touches.length > 1) {
          e.preventDefault();
        }
      }, { passive: false });
      
      // Disable double-tap zoom
      let lastTouchEnd = 0;
      document.addEventListener('touchend', function(e) {
        const now = Date.now();
        if (now - lastTouchEnd <= 300) {
          e.preventDefault();
        }
        lastTouchEnd = now;
      }, false);
      
      true; // Required for iOS
    })();
  `;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle={Platform.OS === 'ios' ? 'dark-content' : 'light-content'}
        backgroundColor={Platform.OS === 'android' ? '#000000' : undefined}
      />
      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Connection Error</Text>
          <Text style={styles.errorText}>{error}</Text>
          <Text style={styles.errorUrl}>URL: {WEB_APP_URL}</Text>
        </View>
      ) : (
        <WebView
          source={{uri: WEB_APP_URL}}
          style={styles.webview}
          onLoadStart={handleLoadStart}
          onLoadEnd={handleLoadEnd}
          onError={handleError}
          onHttpError={handleHttpError}
          injectedJavaScript={injectedJavaScript}
          // Enable JavaScript
          javaScriptEnabled={true}
          // Enable DOM storage
          domStorageEnabled={true}
          // Start in loading state
          startInLoadingState={true}
          // Render loading indicator
          renderLoading={() => (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#000000" />
              <Text style={styles.loadingText}>Loading...</Text>
            </View>
          )}
          // Allow scaling for better mobile experience
          scalesPageToFit={true}
          // Allow inline media playback
          allowsInlineMediaPlayback={true}
          // Media playback requires user action (iOS)
          mediaPlaybackRequiresUserAction={false}
          // Allow file access
          allowFileAccess={true}
          // Allow universal access from file URLs
          allowUniversalAccessFromFileURLs={true}
          // Mixed content mode (Android)
          mixedContentMode="always"
          // User agent (optional - helps identify as mobile)
          userAgent={
            Platform.OS === 'ios'
              ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1'
              : 'Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36'
          }
          // Cache mode
          cacheEnabled={true}
          // Cache mode for Android
          cacheMode="LOAD_DEFAULT"
          // On navigation state change (optional - for debugging)
          onNavigationStateChange={(navState) => {
            if (navState.loading) {
              setLoading(true);
            } else {
              setLoading(false);
            }
          }}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  webview: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#ffffff',
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 10,
  },
  errorText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 20,
  },
  errorUrl: {
    fontSize: 14,
    color: '#999999',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
});

export default App;

