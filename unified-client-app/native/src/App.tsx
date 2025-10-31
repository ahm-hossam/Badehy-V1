/**
 * Badehy Shell App
 * A React Native shell application that displays the web app in a WebView
 */

import React, {useState, useEffect, useRef} from 'react';
import {
  StyleSheet,
  View,
  ActivityIndicator,
  Text,
  SafeAreaView,
  StatusBar,
  Platform,
  Alert,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import {WebView} from 'react-native-webview';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'client_access_token';
const REFRESH_TOKEN_KEY = 'client_refresh_token';

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
  // For development, use localhost (works in iOS simulator)
  // For production, replace with your deployed client web app URL
  // Start at / (root) so root page can detect token and redirect appropriately
  const baseUrl = __DEV__ ? 'http://localhost:3002' : 'https://your-client-webapp-url.com';
  return `${baseUrl}/`;
};

const WEB_APP_URL = getWebAppUrl();

const App: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savedToken, setSavedToken] = useState<string | null>(null);
  const [savedRefreshToken, setSavedRefreshToken] = useState<string | null>(null);
  const [tokensLoaded, setTokensLoaded] = useState(false);
  const [debugVisible, setDebugVisible] = useState(false);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);

  const addDebugLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}`;
    setDebugLogs(prev => [...prev.slice(-49), logMessage]); // Keep last 50 logs
    console.log(logMessage);
  };

  const handleLoadStart = () => {
    setLoading(true);
    setError(null);
  };

  const handleLoadEnd = () => {
    setLoading(false);
    // When page loads, ensure token is injected if we have one
    // This is a backup in case injection before content didn't work
    if (savedToken && webViewRef.current) {
      setTimeout(() => {
        const injectScript = `
          (function() {
            try {
              if (window.handleNativeTokenInjection) {
                window.handleNativeTokenInjection({
                  type: 'INJECT_TOKEN',
                  token: ${JSON.stringify(savedToken)},
                  refreshToken: ${savedRefreshToken ? JSON.stringify(savedRefreshToken) : 'null'}
                });
              } else {
                // Fallback: inject directly if function doesn't exist
                localStorage.setItem('client_access_token', ${JSON.stringify(savedToken)});
                window.ACCESS_TOKEN = ${JSON.stringify(savedToken)};
                (globalThis || window).ACCESS_TOKEN = ${JSON.stringify(savedToken)};
                ${savedRefreshToken ? `localStorage.setItem('client_refresh_token', ${JSON.stringify(savedRefreshToken)});` : ''}
                if (window.dispatchEvent) {
                  window.dispatchEvent(new CustomEvent('tokenInjected', { detail: { token: ${JSON.stringify(savedToken)}, refreshToken: ${savedRefreshToken ? JSON.stringify(savedRefreshToken) : 'null'} } }));
                }
                console.log('[WebView] Token injected on loadEnd (backup)');
              }
            } catch (e) {
              console.error('[WebView] Error in backup injection:', e);
            }
          })();
          true;
        `;
        webViewRef.current.injectJavaScript(injectScript);
      }, 100);
    }
  };

  const handleError = (syntheticEvent: any) => {
    const {nativeEvent} = syntheticEvent;
    console.error('WebView error: ', nativeEvent);
    // More specific error message
    const errorMsg = nativeEvent.description || nativeEvent.message || 'Unknown error';
    console.error('Error details:', errorMsg);
    setError(`Failed to load: ${errorMsg}. Make sure the server is running on ${WEB_APP_URL}`);
    setLoading(false);
  };

  const handleHttpError = (syntheticEvent: any) => {
    const {nativeEvent} = syntheticEvent;
    console.error('HTTP error: ', nativeEvent);
    if (nativeEvent.statusCode >= 400) {
      // Don't show error for 404s if we're on login page (might be redirecting)
      if (nativeEvent.statusCode === 404 && nativeEvent.url?.includes('/login')) {
        console.log('404 on login page, might be redirecting...');
        return;
      }
      setError(
        `HTTP ${nativeEvent.statusCode}: ${nativeEvent.url || 'Unknown URL'}. Check server logs.`,
      );
      setLoading(false);
    }
  };

  // Load saved tokens from AsyncStorage on mount - CRITICAL: Must load before WebView renders
  useEffect(() => {
    const loadSavedTokens = async () => {
      try {
        console.log('[Native] Starting token load from AsyncStorage...');
        const [token, refreshToken] = await Promise.all([
          AsyncStorage.getItem(TOKEN_KEY),
          AsyncStorage.getItem(REFRESH_TOKEN_KEY)
        ]);
        
        if (token) {
          setSavedToken(token);
          addDebugLog(`✓ Loaded token from AsyncStorage (${token.length} chars)`);
        } else {
          addDebugLog('✗ No token in AsyncStorage');
        }
        
        if (refreshToken) {
          setSavedRefreshToken(refreshToken);
          console.log('[Native] ✓ Loaded refresh token from AsyncStorage, length:', refreshToken.length);
        } else {
          console.log('[Native] ✗ No refresh token found in AsyncStorage');
        }
        
        setTokensLoaded(true); // Mark as loaded so WebView can render
        addDebugLog('Token loading complete, WebView can render');
        
        // CRITICAL: If token was found, we need to make sure it gets injected
        // Don't just wait for WebView to request it - inject proactively
        if (token) {
          // Set a small delay to ensure WebView ref is ready
          setTimeout(() => {
            if (webViewRef.current && token) {
              const proactiveInjectScript = `
                (function() {
                  try {
                    const token = ${JSON.stringify(token)};
                    const refreshToken = ${refreshToken ? JSON.stringify(refreshToken) : 'null'};
                    
                    // Inject directly into localStorage
                    if (typeof Storage !== 'undefined') {
                      localStorage.setItem('client_access_token', token);
                      if (refreshToken) {
                        localStorage.setItem('client_refresh_token', refreshToken);
                      }
                    }
                    
                    if (typeof window !== 'undefined') {
                      window.ACCESS_TOKEN = token;
                      (globalThis || window).ACCESS_TOKEN = token;
                    }
                    
                    // Dispatch event
                    if (typeof window !== 'undefined' && window.dispatchEvent) {
                      window.dispatchEvent(new CustomEvent('tokenInjected', { 
                        detail: { token: token, refreshToken: refreshToken } 
                      }));
                    }
                    
                    console.log('[WebView] Token injected proactively after AsyncStorage load');
                  } catch (e) {
                    console.error('[WebView] Error in proactive injection:', e);
                  }
                })();
                true;
              `;
              webViewRef.current.injectJavaScript(proactiveInjectScript);
              addDebugLog('Proactive token injection attempted');
            }
          }, 200);
          
          // Also verify after injection
          setTimeout(() => {
            if (webViewRef.current && token) {
              webViewRef.current.injectJavaScript(`
                (function() {
                  try {
                    const storedToken = localStorage.getItem('client_access_token');
                    if (storedToken && storedToken.length > 0) {
                      console.log('[WebView] Proactive injection VERIFIED: Token found');
                      if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
                        window.ReactNativeWebView.postMessage(JSON.stringify({
                          type: 'VERIFY_TOKEN',
                          found: true,
                          length: storedToken.length
                        }));
                      }
                    } else {
                      console.log('[WebView] Proactive injection VERIFIED: Token NOT found!');
                      if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
                        window.ReactNativeWebView.postMessage(JSON.stringify({
                          type: 'VERIFY_TOKEN',
                          found: false
                        }));
                      }
                    }
                  } catch (e) {
                    console.error('[WebView] Proactive verification error:', e);
                  }
                })();
                true;
              `);
            }
          }, 800);
        }
      } catch (error) {
        console.error('[Native] Error loading tokens:', error);
        setTokensLoaded(true); // Still allow WebView to render even if there's an error
      }
    };
    loadSavedTokens();
  }, []);

  // Handle messages from WebView to sync tokens
  const handleMessage = async (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      if (data.type === 'SAVE_TOKEN') {
        // Save token to AsyncStorage when WebView saves it
        addDebugLog('Received SAVE_TOKEN from WebView');
        await AsyncStorage.setItem(TOKEN_KEY, data.token);
        addDebugLog(`✓ Saved token to AsyncStorage (${data.token.length} chars)`);
        
        if (data.refreshToken) {
          await AsyncStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
          setSavedRefreshToken(data.refreshToken);
          addDebugLog('✓ Saved refresh token');
        }
        setSavedToken(data.token);
        
        // Verify it was saved
        const verifyToken = await AsyncStorage.getItem(TOKEN_KEY);
        if (verifyToken === data.token) {
          addDebugLog('✓ Token verified in AsyncStorage');
        } else {
          addDebugLog('✗ Token verification FAILED!');
        }
      } else if (data.type === 'CLEAR_TOKEN') {
        // Clear token from AsyncStorage when WebView clears it
        await AsyncStorage.removeItem(TOKEN_KEY);
        await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
        setSavedToken(null);
        setSavedRefreshToken(null);
        console.log('[Native] Token cleared from AsyncStorage');
      } else if (data.type === 'VERIFY_TOKEN') {
        // WebView is reporting token verification status
        if (data.found) {
          addDebugLog(`✓ WebView confirmed token in localStorage (${data.length} chars)`);
        } else {
          addDebugLog('✗ WebView reports token NOT in localStorage! Re-injecting...');
          // Token not found, re-inject immediately
          if (savedToken && webViewRef.current) {
            const reInjectScript = `
              (function() {
                try {
                  const token = ${JSON.stringify(savedToken)};
                  localStorage.setItem('client_access_token', token);
                  window.ACCESS_TOKEN = token;
                  (globalThis || window).ACCESS_TOKEN = token;
                  if (typeof window !== 'undefined' && window.dispatchEvent) {
                    window.dispatchEvent(new CustomEvent('tokenInjected', { 
                      detail: { token: token, refreshToken: ${savedRefreshToken ? JSON.stringify(savedRefreshToken) : 'null'} } 
                    }));
                  }
                  console.log('[WebView] Token re-injected after verification failure');
                } catch (e) {
                  console.error('[WebView] Error in re-injection:', e);
                }
              })();
              true;
            `;
            webViewRef.current.injectJavaScript(reInjectScript);
            addDebugLog('Re-injection attempted');
          }
        }
      } else if (data.type === 'REQUEST_TOKEN') {
        // WebView is requesting token - send it immediately via injected JS
        const token = await AsyncStorage.getItem(TOKEN_KEY);
        const refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
        
        if (token && webViewRef.current) {
          addDebugLog('Received REQUEST_TOKEN, sending to WebView...');
          // Use injectedJavaScript to inject token with multiple methods
          const injectScript = `
            (function() {
              try {
                const token = ${JSON.stringify(token)};
                const refreshToken = ${refreshToken ? JSON.stringify(refreshToken) : 'null'};
                
                // Method 1: Use handler if available
                if (window.handleNativeTokenInjection) {
                  window.handleNativeTokenInjection({
                    type: 'INJECT_TOKEN',
                    token: token,
                    refreshToken: refreshToken
                  });
                }
                
                // Method 2: Direct injection (always do this as backup)
                if (typeof Storage !== 'undefined') {
                  try {
                    localStorage.setItem('client_access_token', token);
                    if (refreshToken) {
                      localStorage.setItem('client_refresh_token', refreshToken);
                    }
                  } catch (e) {
                    console.error('[WebView] localStorage.setItem error:', e);
                  }
                }
                
                if (typeof window !== 'undefined') {
                  window.ACCESS_TOKEN = token;
                  (globalThis || window).ACCESS_TOKEN = token;
                }
                
                // Dispatch event
                if (typeof window !== 'undefined' && window.dispatchEvent) {
                  window.dispatchEvent(new CustomEvent('tokenInjected', { 
                    detail: { token: token, refreshToken: refreshToken } 
                  }));
                }
                
                console.log('[WebView] Token injected via REQUEST_TOKEN');
              } catch (e) {
                console.error('[WebView] Error in REQUEST_TOKEN injection:', e);
              }
            })();
            true;
          `;
          
          webViewRef.current.injectJavaScript(injectScript);
          addDebugLog('✓ Token sent to WebView via injectJavaScript');
        } else {
          addDebugLog('✗ REQUEST_TOKEN but no token in AsyncStorage');
        }
      }
    } catch (error) {
      console.error('[Native] Error handling message:', error);
    }
  };
  
  // Ref to WebView for sending messages
  const webViewRef = useRef<WebView>(null);

  // Inject JavaScript to restore token from native storage and intercept localStorage changes
  // This MUST run before any page code executes
  const getInjectedJavaScript = (token: string | null, refreshToken: string | null) => `
    (function() {
      // CRITICAL: Restore tokens FIRST before any other code runs
      try {
        ${token ? `
          (function injectTokenImmediately() {
            try {
              const savedToken = ${JSON.stringify(token)};
              if (savedToken && savedToken.trim().length > 0) {
                // Try localStorage first
                if (typeof localStorage !== 'undefined') {
                  localStorage.setItem('client_access_token', savedToken);
                }
                // Set in window/globalThis
                if (typeof window !== 'undefined') {
                  window.ACCESS_TOKEN = savedToken;
                  (globalThis || window).ACCESS_TOKEN = savedToken;
                }
                ${refreshToken ? `
                  if (typeof localStorage !== 'undefined') {
                    localStorage.setItem('client_refresh_token', ${JSON.stringify(refreshToken)});
                  }
                ` : ''}
                console.log('[WebView] Token injected BEFORE page load via injectedJavaScriptBeforeContentLoaded');
                
                // Dispatch event immediately
                if (typeof window !== 'undefined' && window.dispatchEvent) {
                  window.dispatchEvent(new CustomEvent('tokenInjected', { 
                    detail: { token: savedToken, refreshToken: ${refreshToken ? JSON.stringify(refreshToken) : 'null'} }
                  }));
                }
              }
            } catch (e) {
              console.error('[WebView] Error in immediate token injection:', e);
            }
          })();
        ` : ''}
        
        // Set up function to handle token injection from native (for REQUEST_TOKEN flow)
        window.handleNativeTokenInjection = function(data) {
          try {
            if (data.type === 'INJECT_TOKEN') {
              if (data.token) {
                if (typeof localStorage !== 'undefined') {
                  localStorage.setItem('client_access_token', data.token);
                }
                if (typeof window !== 'undefined') {
                  window.ACCESS_TOKEN = data.token;
                  (globalThis || window).ACCESS_TOKEN = data.token;
                }
              }
              if (data.refreshToken) {
                if (typeof localStorage !== 'undefined') {
                  localStorage.setItem('client_refresh_token', data.refreshToken);
                }
              }
              console.log('[WebView] Token injected via handleNativeTokenInjection function');
              
              // Dispatch event so root page can listen for it
              if (typeof window !== 'undefined' && window.dispatchEvent) {
                window.dispatchEvent(new CustomEvent('tokenInjected', { detail: data }));
              }
            }
          } catch (e) {
            console.error('[WebView] Error handling native message:', e);
          }
        };
        
        // Request token from native on load if not already injected
        if (!${token ? 'true' : 'false'} && window.ReactNativeWebView) {
          setTimeout(function() {
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'REQUEST_TOKEN'
              }));
            }
          }, 100);
        }
      } catch (e) {
        console.error('[WebView] Error in injected JavaScript:', e);
      }
      
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
      
      // Intercept localStorage.setItem to sync tokens to native
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = function(key, value) {
        originalSetItem.call(this, key, value);
        
        // Sync token changes to native
        if (key === 'client_access_token') {
          window.ACCESS_TOKEN = value;
          try {
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'SAVE_TOKEN',
                token: value
              }));
            }
          } catch (e) {
            console.error('[WebView] Error syncing token:', e);
          }
        } else if (key === 'client_refresh_token') {
          try {
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'SAVE_TOKEN',
                token: localStorage.getItem('client_access_token'),
                refreshToken: value
              }));
            }
          } catch (e) {
            console.error('[WebView] Error syncing refresh token:', e);
          }
        }
      };
      
      // Intercept localStorage.removeItem to sync token removal
      const originalRemoveItem = localStorage.removeItem;
      localStorage.removeItem = function(key) {
        originalRemoveItem.call(this, key);
        
        if (key === 'client_access_token' || key === 'client_refresh_token') {
          delete window.ACCESS_TOKEN;
          try {
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'CLEAR_TOKEN'
              }));
            }
          } catch (e) {
            console.error('[WebView] Error syncing token removal:', e);
          }
        }
      };
      
      // Prevent text selection on mobile
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
      {/* Debug Panel Toggle Button */}
      <TouchableOpacity
        style={styles.debugButton}
        onPress={() => setDebugVisible(!debugVisible)}
      >
        <Text style={styles.debugButtonText}>🐛 Debug</Text>
      </TouchableOpacity>
      
      {/* Debug Panel */}
      {debugVisible && (
        <View style={styles.debugPanel}>
          <View style={styles.debugHeader}>
            <Text style={styles.debugTitle}>Debug Logs</Text>
            <TouchableOpacity onPress={() => setDebugLogs([])}>
              <Text style={styles.debugClearText}>Clear</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.debugScrollView}>
            {debugLogs.map((log, i) => (
              <Text key={i} style={styles.debugLogText}>{log}</Text>
            ))}
            {debugLogs.length === 0 && (
              <Text style={styles.debugLogText}>No logs yet...</Text>
            )}
          </ScrollView>
          <View style={styles.debugFooter}>
            <Text style={styles.debugFooterText}>
              Token: {savedToken ? `✓ (${savedToken.length} chars)` : '✗ Not found'}
            </Text>
            <Text style={styles.debugFooterText}>
              Tokens Loaded: {tokensLoaded ? '✓' : '✗'}
            </Text>
          </View>
        </View>
      )}
      
      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Connection Error</Text>
          <Text style={styles.errorText}>{error}</Text>
          <Text style={styles.errorUrl}>URL: {WEB_APP_URL}</Text>
        </View>
      ) : !tokensLoaded ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000000" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      ) : (
        <WebView
          ref={webViewRef}
          source={{uri: WEB_APP_URL}}
          style={styles.webview}
          // CRITICAL: Inject token BEFORE any page loads
          injectedJavaScriptBeforeContentLoaded={savedToken ? `
            (function() {
              try {
                const token = ${JSON.stringify(savedToken)};
                const refreshToken = ${savedRefreshToken ? JSON.stringify(savedRefreshToken) : 'null'};
                
                // Set in localStorage IMMEDIATELY
                if (typeof Storage !== 'undefined') {
                  localStorage.setItem('client_access_token', token);
                  if (refreshToken && refreshToken !== 'null') {
                    localStorage.setItem('client_refresh_token', refreshToken);
                  }
                }
                
                // Set in window/globalThis
                if (typeof window !== 'undefined') {
                  window.ACCESS_TOKEN = token;
                  if (typeof globalThis !== 'undefined') {
                    globalThis.ACCESS_TOKEN = token;
                  }
                }
                
                // Dispatch event
                if (typeof window !== 'undefined' && window.dispatchEvent) {
                  try {
                    window.dispatchEvent(new CustomEvent('tokenInjected', { 
                      detail: { token: token, refreshToken: refreshToken } 
                    }));
                  } catch (e) {}
                }
                
                console.log('[WebView] Token injected via injectedJavaScriptBeforeContentLoaded (EARLIEST)');
              } catch (e) {
                console.error('[WebView] Error in earliest injection:', e);
              }
            })();
            true;
          ` : ''}
          onLoadStart={() => {
            handleLoadStart();
            // CRITICAL: Inject token immediately when load starts (backup)
            if (savedToken && webViewRef.current) {
              const immediateInjectScript = `
                (function() {
                  try {
                    const token = ${JSON.stringify(savedToken)};
                    const refreshToken = ${savedRefreshToken ? JSON.stringify(savedRefreshToken) : 'null'};
                    
                    if (typeof Storage !== 'undefined' && localStorage) {
                      try {
                        localStorage.setItem('client_access_token', token);
                        if (refreshToken && refreshToken !== 'null') {
                          localStorage.setItem('client_refresh_token', refreshToken);
                        }
                      } catch (e) {
                        console.error('[WebView] localStorage.setItem error:', e);
                      }
                    }
                    
                    if (typeof window !== 'undefined') {
                      window.ACCESS_TOKEN = token;
                      if (typeof globalThis !== 'undefined') {
                        globalThis.ACCESS_TOKEN = token;
                      }
                    }
                    
                    if (typeof window !== 'undefined' && window.dispatchEvent) {
                      try {
                        window.dispatchEvent(new CustomEvent('tokenInjected', { 
                          detail: { token: token, refreshToken: refreshToken } 
                        }));
                      } catch (e) {
                        console.error('[WebView] dispatchEvent error:', e);
                      }
                    }
                    
                    console.log('[WebView] Token injected onLoadStart (EARLY)');
                  } catch (e) {
                    console.error('[WebView] Error in onLoadStart injection:', e);
                  }
                })();
                true;
              `;
              webViewRef.current.injectJavaScript(immediateInjectScript);
              addDebugLog('Token injection attempted on loadStart');
              
              // Verify injection worked after a delay
              setTimeout(() => {
                if (webViewRef.current) {
                  webViewRef.current.injectJavaScript(`
                    (function() {
                      try {
                        const token = localStorage.getItem('client_access_token');
                        if (token && token.length > 0) {
                          console.log('[WebView] VERIFIED: Token is in localStorage');
                          if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
                            window.ReactNativeWebView.postMessage(JSON.stringify({
                              type: 'VERIFY_TOKEN',
                              found: true,
                              length: token.length
                            }));
                          }
                        } else {
                          console.log('[WebView] VERIFIED: Token NOT in localStorage!');
                          if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
                            window.ReactNativeWebView.postMessage(JSON.stringify({
                              type: 'VERIFY_TOKEN',
                              found: false
                            }));
                          }
                        }
                      } catch (e) {
                        console.error('[WebView] Verification error:', e);
                      }
                    })();
                    true;
                  `);
                }
              }, 500);
            }
          }}
          onLoadEnd={handleLoadEnd}
          onError={handleError}
          onHttpError={handleHttpError}
          onMessage={handleMessage}
          injectedJavaScript={getInjectedJavaScript(savedToken, savedRefreshToken)}
          // Enable JavaScript
          javaScriptEnabled={true}
          // Enable DOM storage (critical for localStorage persistence)
          domStorageEnabled={true}
          // Enable third-party cookies (helps with localStorage)
          thirdPartyCookiesEnabled={true}
          // Enable debugging for WebView console
          webviewDebuggingEnabled={true}
          // Allow debugging on iOS
          allowsInlineMediaPlayback={true}
          // CRITICAL: Enable shared process pool (iOS) - prevents localStorage clearing
          sharedCookiesEnabled={true}
          // iOS specific: Use shared process pool
          incognito={false}
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
  debugButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    right: 20,
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    zIndex: 1000,
  },
  debugButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  debugPanel: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 90 : 60,
    right: 20,
    left: 20,
    backgroundColor: '#000000',
    borderRadius: 8,
    maxHeight: 400,
    zIndex: 999,
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  debugHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  debugTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  debugClearText: {
    color: '#007AFF',
    fontSize: 14,
  },
  debugScrollView: {
    maxHeight: 300,
    padding: 8,
  },
  debugLogText: {
    color: '#00FF00',
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: 4,
  },
  debugFooter: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#333333',
    backgroundColor: '#111111',
  },
  debugFooterText: {
    color: '#FFFFFF',
    fontSize: 12,
    marginBottom: 4,
  },
});

export default App;

