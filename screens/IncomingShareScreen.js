import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ShareIntentModule, useShareIntentContext } from 'expo-share-intent';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../contexts/AuthContext';

const LAST_COLLAB_REQUEST_ID_STORAGE_KEY = 'last_collab_request_id';

const resolveAccountType = (authUser) => {
  const u = authUser?.user || authUser?.me || authUser?.data?.user || authUser;

  const accountTypeRaw = u?.account_type;
  if (typeof accountTypeRaw === 'string') {
    const normalized = accountTypeRaw.toLowerCase();
    if (normalized.includes('influencer') || normalized.includes('creator')) return 'influencer';
    if (normalized.includes('business') || normalized.includes('seller') || normalized.includes('shop')) return 'business';
  }

  const raw = u?.user_type ?? u?.type ?? u?.role ?? u?.profile_type ?? u?.actor_type;
  if (typeof raw === 'string') {
    const normalized = raw.toLowerCase();
    if (normalized.includes('influencer') || normalized.includes('creator')) return 'influencer';
    if (normalized.includes('business') || normalized.includes('seller') || normalized.includes('shop')) return 'business';
  }

  if (u?.is_influencer === true) return 'influencer';
  if (u?.is_business === true) return 'business';

  return 'business';
};

const extractUrlFromText = (value = '') => {
  const match = value.match(/https?:\/\/\S+/i);
  return match ? match[0].replace(/[),.;!?]+$/, '') : '';
};

const cleanSharedText = (value = '') => {
  return value.replace(/https?:\/\/\S+/gi, '').replace(/\s+/g, ' ').trim();
};

const inferPlatformFromUrl = (value = '') => {
  const normalizedValue = value.toLowerCase();

  if (normalizedValue.includes('instagram')) return 'instagram';
  if (normalizedValue.includes('facebook')) return 'facebook';
  if (normalizedValue.includes('pinterest')) return 'pinterest';

  return 'instagram';
};

const toArray = (value) => {
  if (!value) return [];
  return Array.isArray(value) ? value.filter(Boolean) : [value];
};

const getUniqueValues = (values = []) => Array.from(new Set(values.filter((value) => (value || '').trim() !== '')));

const hasDraftContent = (draft = {}) => {
  return !!(draft?.socialUrl || draft?.title || draft?.caption || draft?.imageUrls?.length);
};

const hasIntentPayload = (shareIntent = {}) => {
  return !!(
    shareIntent?.webUrl ||
    shareIntent?.text ||
    shareIntent?.meta?.title ||
    shareIntent?.meta?.['og:image'] ||
    shareIntent?.files?.length
  );
};

const buildSharedDraftFromParams = (params = {}) => {
  const socialUrl = params.socialUrl || params.url || '';
  const imageUrls = getUniqueValues([
    ...toArray(params.imageUrls),
    ...toArray(params.imageUrl),
  ]);

  return {
    receivedAt: Date.now(),
    socialUrl,
    title: params.title || '',
    caption: params.caption || '',
    imageUrls,
    platform: params.platform || inferPlatformFromUrl(socialUrl),
  };
};

const buildSharedDraftFromIntent = (shareIntent = {}) => {
  const sharedText = shareIntent?.text || '';
  const socialUrl = shareIntent?.webUrl || extractUrlFromText(sharedText);
  const cleanedText = cleanSharedText(sharedText);
  const imageUrls = getUniqueValues([
    ...(shareIntent?.files || [])
      .filter((file) => (file?.mimeType || '').startsWith('image/') && file?.path)
      .map((file) => file.path),
    shareIntent?.meta?.['og:image'] || '',
  ]);
  const fallbackTitle = imageUrls.length > 0 ? 'Shared post' : '';

  return {
    receivedAt: Date.now(),
    socialUrl,
    title: shareIntent?.meta?.title || cleanedText.slice(0, 120) || fallbackTitle,
    caption: cleanedText || sharedText,
    imageUrls,
    platform: inferPlatformFromUrl(socialUrl || sharedText),
  };
};

export default function IncomingShareScreen({ route }) {
  const navigation = useNavigation();
  const handledRef = useRef(false);
  const waitTimeoutRef = useRef(null);
  const fallbackDraft = buildSharedDraftFromParams(route?.params || {});
  const { error, hasShareIntent, isReady, resetShareIntent, shareIntent } = useShareIntentContext();
  const hasFallbackDraft = hasDraftContent(fallbackDraft);
  const hasNativePayload = hasIntentPayload(shareIntent);
  const { user } = useAuth();
  const isInfluencer = resolveAccountType(user) === 'influencer';

  useEffect(() => {
    if (handledRef.current) {
      return;
    }

    const nativeModuleMissing = !ShareIntentModule;
    const intentDraft = hasNativePayload ? buildSharedDraftFromIntent(shareIntent) : null;
    const sharedDraft = hasDraftContent(intentDraft) ? intentDraft : fallbackDraft;

    if (!isReady && !nativeModuleMissing && !hasFallbackDraft && !error) {
      return;
    }

    if (!nativeModuleMissing && !error && !hasFallbackDraft && !hasNativePayload) {
      if (!waitTimeoutRef.current) {
        waitTimeoutRef.current = setTimeout(() => {
          waitTimeoutRef.current = null;
        }, 1200);
      }
      return;
    }

    handledRef.current = true;

    if (waitTimeoutRef.current) {
      clearTimeout(waitTimeoutRef.current);
      waitTimeoutRef.current = null;
    }

    if (hasShareIntent || hasNativePayload) {
      resetShareIntent();
    }

    const run = async () => {
      // Business users go directly to new post page (same as old version)
      if (!isInfluencer) {
        navigation.replace('addPost', {
          sharedDraft,
        });
        return;
      }
      
      // Influencers check for collaboration request
      const sharedUrl = String(sharedDraft?.socialUrl || '').trim();
      if (sharedUrl) {
        try {
          const lastRequestId = await AsyncStorage.getItem(LAST_COLLAB_REQUEST_ID_STORAGE_KEY);
          const parsedRequestId = Number(lastRequestId);

          if (Number.isFinite(parsedRequestId) && parsedRequestId > 0) {
            // Alert.alert('Share received', `Opening request #${parsedRequestId}`);
            navigation.replace('collaborationRequestDetail', {
              requestId: parsedRequestId,
              prefillSocialUrl: sharedUrl,
            });
            return;
          }

          // Alert.alert('Share received', 'No request selected. Open a request first, then share again.');
        } catch (e) {
          // Alert.alert('Share received', 'Failed to resolve request.');
        }
      }

      navigation.replace('addPost', {
        sharedDraft,
      });
    };

    run();
  }, [error, fallbackDraft, hasFallbackDraft, hasNativePayload, hasShareIntent, isReady, navigation, resetShareIntent, shareIntent, isInfluencer]);

  useEffect(() => {
    return () => {
      if (waitTimeoutRef.current) {
        clearTimeout(waitTimeoutRef.current);
      }
    };
  }, []);

  const subtitle = error
    ? 'We could not read the shared content.'
    : (!isReady || !hasNativePayload) && ShareIntentModule
      ? 'Reading shared content.'
      : 'Preparing your draft.';

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#111827" />
      <Text style={styles.title}>Opening new post...</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: '#f9fafb',
  },
  title: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    marginTop: 8,
    fontSize: 14,
    textAlign: 'center',
    color: '#6b7280',
  },
});
