import { NavigationContainer } from '@react-navigation/native';
import * as ExpoLinking from 'expo-linking';
import { ShareIntentModule, ShareIntentProvider, getShareExtensionKey } from 'expo-share-intent';
import { Linking } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './contexts/AuthContext';
import AppNavigator from './navigation/AppNavigator';
import { setNavigationRef } from './services/api';

const APP_SCHEME = 'mobilesellerapp';
const SHARE_INTENT_OPTIONS = {
  debug: __DEV__,
  scheme: APP_SCHEME,
};
const APP_PREFIX = ExpoLinking.createURL('/');

const linking = {
  prefixes: [`${APP_SCHEME}://`, APP_PREFIX],
  config: {
    screens: {
      handleShare: 'handle-share',
      addPost: 'add-post',
      collaborationRequestDetail: {
        path: 'collaboration/requests/:requestId',
        parse: {
          requestId: (value) => Number(value),
        },
      },
    },
  },
  async getInitialURL() {
    const hasPendingShareIntent = ShareIntentModule?.hasShareIntent?.(
      getShareExtensionKey(SHARE_INTENT_OPTIONS)
    );

    if (hasPendingShareIntent) {
      return `${APP_SCHEME}://handle-share`;
    }

    return Linking.getInitialURL();
  },
  subscribe(listener) {
    const urlSubscription = Linking.addEventListener('url', ({ url }) => {
      listener(url);
    });
    const shareIntentSubscription = ShareIntentModule?.addListener?.('onStateChange', ({ value }) => {
      if (value === 'pending') {
        listener(`${APP_SCHEME}://handle-share`);
      }
    });

    return () => {
      shareIntentSubscription?.remove?.();
      urlSubscription.remove();
    };
  },
};

export default function App() {
  return (
    <ShareIntentProvider options={SHARE_INTENT_OPTIONS}>
      <SafeAreaProvider>
        <AuthProvider>
          <NavigationContainer
            linking={linking}
            ref={(navigator) => setNavigationRef(navigator)}
          >
            <AppNavigator />
            {/* <StatusBar style="auto" /> */}
          </NavigationContainer>
        </AuthProvider>
      </SafeAreaProvider>
    </ShareIntentProvider>
  );
}
