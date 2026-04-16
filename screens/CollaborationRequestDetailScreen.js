import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  ActivityIndicator,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, FontAwesome, FontAwesome5 } from '@expo/vector-icons';
import Header from '../components/Header';
import * as ImagePicker from 'expo-image-picker';
import { API_BASE, collaboration, shop, uploads } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../contexts/AuthContext';

const LAST_COLLAB_REQUEST_ID_STORAGE_KEY = 'last_collab_request_id';

const getStatusColor = (status) => {
  const normalized = String(status || '').toUpperCase();
  if (normalized === 'ACCEPTED') return { bg: '#ecfdf5', fg: '#047857' };
  if (normalized === 'REJECTED') return { bg: '#fef2f2', fg: '#b91c1c' };
  if (normalized === 'PENDING') return { bg: '#fffbeb', fg: '#b45309' };
  return { bg: '#f3f4f6', fg: '#374151' };
};

const formatCurrency = (currency, amount) => {
  const value = amount ?? 0;
  const normalized = String(currency || '').toUpperCase();
  if (normalized === 'INR') return `INR ${value}`;
  return `${normalized} ${value}`;
};

const getMimeTypeFromUri = (fileNameOrUri) => {
  const value = String(fileNameOrUri || '').toLowerCase();
  if (value.endsWith('.png')) return 'image/png';
  if (value.endsWith('.webp')) return 'image/webp';
  if (value.endsWith('.heic')) return 'image/heic';
  if (value.endsWith('.heif')) return 'image/heif';
  return 'image/jpeg';
};

const getAbsoluteImageUrl = (maybeRelativeUrl) => {
  if (!maybeRelativeUrl) return '';
  const s = String(maybeRelativeUrl);
  if (s.startsWith('http://') || s.startsWith('https://')) return s;
  return `${API_BASE}${s.startsWith('/') ? '' : '/'}${s}`;
};

const getRelativeImageUrl = (absoluteOrRelativeUrl) => {
  if (!absoluteOrRelativeUrl) return '';
  const s = String(absoluteOrRelativeUrl).trim();
  if (s.startsWith('http://') || s.startsWith('https://')) {
    if (s.startsWith(API_BASE)) {
      const withoutBase = s.slice(API_BASE.length);
      return withoutBase.startsWith('/') ? withoutBase : `/${withoutBase}`;
    }
    return s;
  }
  return s;
};

const inferPlatformFromUrl = (value = '') => {
  const normalizedValue = String(value || '').toLowerCase();

  if (normalizedValue.includes('instagram')) return 'instagram';
  if (normalizedValue.includes('facebook')) return 'facebook';
  if (normalizedValue.includes('pinterest')) return 'pinterest';

  return 'instagram';
};

const normalizeSocialHandleUrl = (platform, value = '') => {
  const normalizedValue = String(value || '').trim();
  if (!normalizedValue) {
    return '';
  }

  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(normalizedValue)) {
    return normalizedValue;
  }

  const sanitizedHandle = normalizedValue.replace(/^@/, '').replace(/^\/+|\/+$/g, '');

  if (!sanitizedHandle) {
    return '';
  }

  if (platform === 'instagram') {
    return `https://www.instagram.com/${sanitizedHandle}/`;
  }

  if (platform === 'facebook') {
    return `https://www.facebook.com/${sanitizedHandle}`;
  }

  if (platform === 'pinterest') {
    return `https://www.pinterest.com/${sanitizedHandle}/`;
  }

  return sanitizedHandle;
};

const extractInstagramUsername = (value = '') => {
  const normalizedUrl = normalizeSocialHandleUrl('instagram', value);

  if (!normalizedUrl) {
    return '';
  }

  const normalizedPath = normalizedUrl
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, '')
    .split(/[?#]/)[0]
    .split('/')
    .filter(Boolean);

  return normalizedPath[0] || '';
};

const buildNativeSocialUrl = (platform, value = '') => {
  const normalizedUrl = normalizeSocialHandleUrl(platform, value);

  if (!normalizedUrl) {
    return '';
  }

  if (platform === 'instagram') {
    const username = extractInstagramUsername(value);
    return username ? `instagram://user?username=${encodeURIComponent(username)}` : '';
  }

  if (platform === 'facebook') {
    return `fb://facewebmodal/f?href=${encodeURIComponent(normalizedUrl)}`;
  }

  return '';
};

const CollaborationRequestDetailScreen = ({ route, navigation }) => {
  const initialReq = route?.params?.request || {};
  const requestId = initialReq?.id ?? route?.params?.requestId;
  const prefillSocialUrl = route?.params?.prefillSocialUrl;

  const { user } = useAuth();

  const prefillAppliedRef = useRef(false);

  const [loading, setLoading] = useState(true);
  const [req, setReq] = useState(() => {
    if (initialReq && Object.keys(initialReq).length > 0) return initialReq;
    return requestId ? { id: requestId } : {};
  });
  const [uploadingImages, setUploadingImages] = useState(false);
  const [savingCollabPost, setSavingCollabPost] = useState(false);
  const [responding, setResponding] = useState(false);
  const [shopSocialHandles, setShopSocialHandles] = useState({
    instagram: '',
    facebook: '',
    pinterest: '',
  });

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

  const isInfluencer = resolveAccountType(user) === 'influencer';
  const isPending = String(req?.status || '').toUpperCase() === 'PENDING';

  const statusPalette = useMemo(() => getStatusColor(req?.status), [req?.status]);

  const post = req?.post || {};
  const collabPost = req?.collab_post || {};

  const [socialLink, setSocialLink] = useState(collabPost?.effective_social_url || collabPost?.social_url || '');
  const [selectedPlatform, setSelectedPlatform] = useState(
    (collabPost?.effective_social_platform
      ? String(collabPost.effective_social_platform).toLowerCase()
      : '') ||
      (collabPost?.social_platform ? String(collabPost.social_platform).toLowerCase() : '') ||
      (post?.social_platform ? String(post.social_platform).toLowerCase() : '') ||
      (collabPost?.effective_social_url || collabPost?.social_url ? inferPlatformFromUrl(collabPost?.effective_social_url || collabPost?.social_url) : '') ||
      'instagram'
  );
  const [imageUrls, setImageUrls] = useState(() => {
    const urls = collabPost?.effective_image_urls || collabPost?.image_urls || [];
    const normalized = Array.isArray(urls) ? urls.filter(Boolean) : [];
    return normalized.length > 0 ? [...normalized, ''] : [''];
  });

  const nonEmptyImageUrls = useMemo(() => {
    return (imageUrls || []).map((u) => String(u || '').trim()).filter((u) => u.length > 0);
  }, [imageUrls]);

  const previewImageUrl = useMemo(() => {
    return nonEmptyImageUrls.length > 0 ? nonEmptyImageUrls[0] : '';
  }, [nonEmptyImageUrls]);

  const previewImageUrls = useMemo(() => {
    return nonEmptyImageUrls.slice(0, 2);
  }, [nonEmptyImageUrls]);

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      try {
        if (!requestId) {
          setLoading(false);
          return;
        }

        setLoading(true);
        const res = await collaboration.getRequestDetail(requestId);
        const freshReq = res?.request || res;

        if (!mounted) return;

        if (freshReq) {
          setReq(freshReq);

          const freshCollabPost = freshReq?.collab_post || {};
          if (!prefillAppliedRef.current) {
            setSocialLink(
              freshCollabPost?.effective_social_url || freshCollabPost?.social_url || ''
            );
          }

          if (!prefillAppliedRef.current) {
            setSelectedPlatform(
              (freshCollabPost?.effective_social_platform
                ? String(freshCollabPost.effective_social_platform).toLowerCase()
                : '') ||
                (freshCollabPost?.social_platform
                  ? String(freshCollabPost.social_platform).toLowerCase()
                  : '') ||
                (freshReq?.post?.social_platform
                  ? String(freshReq.post.social_platform).toLowerCase()
                  : '') ||
                (freshCollabPost?.effective_social_url || freshCollabPost?.social_url
                  ? inferPlatformFromUrl(freshCollabPost?.effective_social_url || freshCollabPost?.social_url)
                  : '') ||
                'instagram'
            );
          }

          const urls = freshCollabPost?.effective_image_urls || freshCollabPost?.image_urls || [];
          const normalized = Array.isArray(urls) ? urls.filter(Boolean) : [];
          setImageUrls(normalized.length > 0 ? [...normalized, ''] : ['']);
        }
      } catch (e) {
        if (!mounted) return;
        Alert.alert('Error', e?.message || 'Failed to load request details');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    run();

    return () => {
      mounted = false;
    };
  }, [requestId]);

  const fetchRequestDetails = async () => {
    if (!requestId) return;
    const res = await collaboration.getRequestDetail(requestId);
    const freshReq = res?.request || res;
    if (freshReq) setReq(freshReq);
  };

  const handleRespond = async (action) => {
    if (!requestId) return;
    const normalizedAction = String(action || '').toLowerCase();
    if (normalizedAction !== 'accept' && normalizedAction !== 'reject') return;

    try {
      setResponding(true);
      await collaboration.respondToRequest(requestId, normalizedAction);
      await fetchRequestDetails();
    } catch (e) {
      Alert.alert('Error', e?.message || 'Failed to respond');
    } finally {
      setResponding(false);
    }
  };

  useEffect(() => {
    if (!requestId) return;
    AsyncStorage.setItem(LAST_COLLAB_REQUEST_ID_STORAGE_KEY, String(requestId)).catch(() => {});
  }, [requestId]);

  useEffect(() => {
    const value = String(prefillSocialUrl || '').trim();
    if (!value) return;
    prefillAppliedRef.current = true;
    setSocialLink(value);
    setSelectedPlatform(inferPlatformFromUrl(value));
  }, [prefillSocialUrl]);

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      try {
        const response = await shop.getMyShop();
        const shopResponse = response?.shop || {};

        if (!mounted) return;

        setShopSocialHandles({
          instagram: String(shopResponse.instagram_handle ?? '').trim(),
          facebook: String(shopResponse.facebook_handle ?? '').trim(),
          pinterest: String(shopResponse.pinterest_handle ?? '').trim(),
        });
      } catch (e) {
        if (!mounted) return;
      }
    };

    run();

    return () => {
      mounted = false;
    };
  }, []);

  const brand = req?.brand || post?.brand || {};
  const brandName = brand?.name || '';
  const brandCity = brand?.city || '';
  const influencerName = req?.influencer?.name || '';
  const influencerCity = req?.influencer?.city || '';

  const buildHandle = (entity) => {
    const raw =
      entity?.handle ||
      entity?.username ||
      entity?.slug ||
      entity?.instagram_handle ||
      entity?.instagram ||
      entity?.ig_handle;

    const value = String(raw || '').trim().replace(/^@/, '');
    return value ? `@${value}` : '';
  };

  const buildMetaLine = (entity, city) => {
    const handle = buildHandle(entity);
    const cityValue = String(city || '').trim();
    if (handle && cityValue) return `${handle} · ${cityValue}`;
    return handle || cityValue || '';
  };

  const handlePlatformPress = async (platform) => {
    setSelectedPlatform(platform.value);

    const configuredHandle = String(shopSocialHandles?.[platform.value] || '').trim();

    if (!configuredHandle) {
      Alert.alert(
        'Handle not set',
        `Add your ${platform.label} handle in Shop Profile to open it here.`
      );
      return;
    }

    const webUrl = normalizeSocialHandleUrl(platform.value, configuredHandle);
    const nativeUrl = buildNativeSocialUrl(platform.value, configuredHandle);

    try {
      if (nativeUrl) {
        const canOpenNativeUrl = await Linking.canOpenURL(nativeUrl);

        if (canOpenNativeUrl) {
          await Linking.openURL(nativeUrl);
          return;
        }
      }

      const canOpenWebUrl = await Linking.canOpenURL(webUrl);

      if (canOpenWebUrl) {
        await Linking.openURL(webUrl);
        return;
      }

      throw new Error('No supported URL found');
    } catch (error) {
      console.error(`Error opening ${platform.value} handle:`, error);
      Alert.alert('Error', `Failed to open your ${platform.label} account.`);
    }
  };

  const handleOpenLink = async (url) => {
    if (!url) return;
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (!canOpen) {
        Alert.alert('Error', 'Cannot open this link');
        return;
      }
      await Linking.openURL(url);
    } catch (e) {
      Alert.alert('Error', e?.message || 'Failed to open link');
    }
  };

  const handleSave = () => {
    if (!requestId) {
      Alert.alert('Error', 'Missing request id');
      return;
    }

    const imageUrlsClean = (imageUrls || [])
      .map((u) => String(u || '').trim())
      .filter((u) => u.length > 0)
      .map(getRelativeImageUrl);

    const socialUrlClean = String(socialLink || '').trim();
    const socialPlatform =
      String(selectedPlatform || '').trim().toLowerCase() ||
      collabPost?.effective_social_platform ||
      collabPost?.social_platform ||
      post?.social_platform ||
      inferPlatformFromUrl(socialUrlClean);

    const payload = {
      social_url: socialUrlClean,
      social_platform: socialPlatform,
      image_urls: imageUrlsClean,
    };

    const run = async () => {
      try {
        setSavingCollabPost(true);
        const res = await collaboration.saveCollabPost(requestId, payload);
        const freshReq = res?.request || res;
        if (freshReq) {
          setReq(freshReq);

          const freshCollabPost = freshReq?.collab_post || {};
          if (!prefillAppliedRef.current) {
            setSocialLink(
              freshCollabPost?.effective_social_url || freshCollabPost?.social_url || ''
            );
          }

          const urls = freshCollabPost?.effective_image_urls || freshCollabPost?.image_urls || [];
          const normalized = Array.isArray(urls) ? urls.filter(Boolean) : [];
          setImageUrls(normalized.length > 0 ? [...normalized, ''] : ['']);
        }
        Alert.alert('Saved', 'Collab post saved');
      } catch (e) {
        Alert.alert('Error', e?.message || 'Failed to save collab post');
      } finally {
        setSavingCollabPost(false);
      }
    };

    run();
  };

  const handlePreview = () => {
    Alert.alert('Preview', 'Preview is coming soon.');
  };

  const updateImageUrl = (idx, value) => {
    setImageUrls((prev) => {
      const next = [...prev];
      next[idx] = value;
      if (idx === next.length - 1 && value.trim().length > 0) {
        next.push('');
      }
      return next;
    });
  };

  const uploadImageFromUri = async (uri, fileName) => {
    const resolvedFileName =
      fileName || uri.split('/').pop()?.split('?')[0] || `image-${Date.now()}.jpg`;
    const fileAsset = {
      uri,
      name: resolvedFileName,
      type: getMimeTypeFromUri(resolvedFileName),
    };

    const res = await uploads.uploadInventoryImage(fileAsset);
    const publicUrl = res?.url ? res.url : null;

    if (!publicUrl) {
      throw new Error('Upload succeeded but no image URL was returned');
    }

    return getAbsoluteImageUrl(publicUrl);
  };

  const pickAndUploadImages = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('Permission required', 'Gallery permission is required to pick images');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
      });

      if (result.canceled) return;

      setUploadingImages(true);

      const assets = result.assets || [];
      const uploadedUrls = [];

      for (const asset of assets) {
        const uri = asset.uri;
        if (!uri) continue;

        const uploadedUrl = await uploadImageFromUri(
          uri,
          asset.fileName || uri.split('/').pop() || `image-${Date.now()}.jpg`
        );
        uploadedUrls.push(uploadedUrl);
      }

      if (uploadedUrls.length === 0) {
        Alert.alert('Error', 'No images were uploaded');
        return;
      }

      setImageUrls((prev) => {
        const existing = (prev || []).filter((u) => (u || '').trim() !== '');
        return [...existing, ...uploadedUrls, ''];
      });
    } catch (e) {
      console.error('Error picking/uploading images:', e);
      Alert.alert('Error', e?.message || 'Failed to upload images');
    } finally {
      setUploadingImages(false);
    }
  };

  const removeImageUrl = (idx) => {
    setImageUrls((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      if (next.length === 0 || next[next.length - 1].trim().length > 0) next.push('');
      return next;
    });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Header
          title={`Request #${req?.id ?? '—'}`}
          headerType="page"
          showIcons={false}
          showBackButton
          titleAlign="left"
          onBackPress={() => navigation.goBack()}
          subtitle={
            `Sent ${req?.created_at ? String(req.created_at).slice(0, 10) : '—'}` +
            (req?.responded_at ? ` · Responded ${String(req.responded_at).slice(0, 10)}` : '')
          }
          rightComponent={
            <View style={[styles.statusPill, { backgroundColor: statusPalette.bg }]}>
              <View style={[styles.statusDot, { backgroundColor: statusPalette.fg }]} />
              <Text style={[styles.statusPillText, { color: statusPalette.fg }]}>
                {String(req?.status || '—')}
              </Text>
            </View>
          }
        />

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color="#111827" />
          </View>
        ) : null}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Product</Text>
          <View style={styles.productRow}>
            <View style={styles.productThumbWrap}>
              {post?.image_url ? (
                <Image source={{ uri: post.image_url }} style={styles.productThumb} />
              ) : (
                <View style={[styles.productThumb, styles.thumbPlaceholder]} />
              )}
            </View>

            <View style={styles.productInfo}>
              <Text style={styles.productName} numberOfLines={2}>
                {post?.title || 'Untitled'}
              </Text>
              <Text style={styles.productPrice}>{formatCurrency(post?.currency, post?.price)}</Text>
            </View>
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() =>
                handleOpenLink(
                  (collabPost?.effective_social_url || collabPost?.social_url || post?.social_url || '').trim()
                )
              }
            >
              <Feather name="external-link" size={16} color="#111827" />
              <Text style={styles.actionButtonText}>Open social link</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() =>
                handleOpenLink(
                  collabPost?.customer_url_path
                    ? `https://business.folinko.com${collabPost.customer_url_path}`
                    : 'https://business.folinko.com'
                )
              }
            >
              <FontAwesome5 name="store" size={15} color="#111827" />
              <Text style={styles.actionButtonText}>Open on Folinko</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Collab post (your version)</Text>
          <Text style={styles.cardDescription}>
            Edit the social link and images you want to show on your storefront.
          </Text>

          <Text style={styles.inputLabel}>Social link (optional)</Text>
          <TextInput
            value={socialLink}
            onChangeText={(t) => {
              setSocialLink(t);
              const inferred = inferPlatformFromUrl(t);
              if (inferred) setSelectedPlatform(inferred);
            }}
            placeholder="https://www.instagram.com/reel/..."
            autoCapitalize="none"
            style={styles.input}
          />

          <View style={styles.platformGrid}>
            {[
              { value: 'instagram', label: 'Instagram', icon: 'instagram', color: '#e1306c' },
              { value: 'facebook', label: 'Facebook', icon: 'facebook', color: '#1877f2' },
              { value: 'twitter', label: 'Twitter', icon: 'twitter', color: '#1da1f2' },
              { value: 'youtube', label: 'YouTube', icon: 'youtube', color: '#ff0000' },
              { value: 'tiktok', label: 'TikTok', icon: 'music', color: '#000000' },
              { value: 'other', label: 'Other', icon: 'globe', color: '#6b7280' },
            ].map((platform) => {
              const isSelected = String(selectedPlatform || '').toLowerCase() === platform.value;

              return (
                <TouchableOpacity
                  key={platform.value}
                  style={[styles.platformPill, isSelected && styles.platformPillSelected]}
                  onPress={() => handlePlatformPress(platform)}
                  activeOpacity={0.9}
                >
                  <FontAwesome name={platform.icon} size={16} color={platform.color} />
                  <Text style={[styles.platformPillText, isSelected && styles.platformPillTextSelected]}>
                    {platform.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={[styles.inputLabel, { marginTop: 14 }]}>Image URLs (one per line, optional)</Text>

          <View style={styles.imagesHeaderRow}>
            <View style={styles.imagesHeaderLeft}>
              <Text style={styles.imagesHeaderTitle}>Images</Text>
              <Text style={styles.imagesHeaderSubtitle}>Using image from your overrides.</Text>
            </View>

            <View style={styles.imagesHeaderActions}>
              <TouchableOpacity
                style={[
                  styles.smallButton,
                  (uploadingImages || savingCollabPost) && styles.smallButtonDisabled,
                ]}
                onPress={() => setImageUrls((prev) => (prev[prev.length - 1]?.trim() ? [...prev, ''] : prev))}
                disabled={uploadingImages || savingCollabPost}
              >
                <Feather name="plus" size={16} color="#111827" />
                <Text style={styles.smallButtonText}>Add URL</Text>
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.thumbRow}>
            <TouchableOpacity
              style={[styles.thumbAddTile, (uploadingImages || savingCollabPost) && styles.smallButtonDisabled]}
              onPress={pickAndUploadImages}
              disabled={uploadingImages || savingCollabPost}
              activeOpacity={0.9}
            >
              {uploadingImages ? (
                <ActivityIndicator size="small" color="#111827" />
              ) : (
                <Feather name="plus" size={20} color="#111827" />
              )}
            </TouchableOpacity>

            {nonEmptyImageUrls.map((u, idx) => (
              <View key={`${u}-${idx}`} style={styles.thumbTile}>
                <Image source={{ uri: getAbsoluteImageUrl(u) }} style={styles.thumbImage} />
                <TouchableOpacity
                  style={styles.thumbRemove}
                  onPress={() => {
                    const urlIndex = imageUrls.findIndex((x) => x === u);
                    if (urlIndex >= 0) removeImageUrl(urlIndex);
                  }}
                  activeOpacity={0.9}
                >
                  <Feather name="x" size={14} color="#fff" />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>

          {imageUrls.map((v, idx) => (
            <View key={`${idx}`} style={styles.imageUrlRow}>
              <TextInput
                value={v}
                onChangeText={(t) => updateImageUrl(idx, t)}
                placeholder="https://..."
                autoCapitalize="none"
                style={[styles.input, styles.imageUrlInput]}
              />
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removeImageUrl(idx)}
                disabled={imageUrls.length === 1 && idx === 0}
              >
                <Text style={styles.removeButtonText}>Remove</Text>
              </TouchableOpacity>
            </View>
          ))}

          <Text style={styles.tipText}>Tip: use ↑ and ↓ to control storefront image order.</Text>

          <Text style={styles.previewTitle}>Preview (what customers will see)</Text>
          <View style={styles.previewWrap}>
            <View style={styles.previewRow}>
              {(previewImageUrls.length > 0 ? previewImageUrls : ['', '']).map((u, idx) => (
                <View
                  key={`${u || 'empty'}-${idx}`}
                  style={[styles.previewItem, idx === 0 && styles.previewItemDivider]}
                >
                  {u ? (
                    <Image
                      source={{ uri: getAbsoluteImageUrl(u) }}
                      style={styles.previewImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={[styles.previewImage, styles.thumbPlaceholder]} />
                  )}
                </View>
              ))}
            </View>
          </View>

          <View style={styles.bottomActionsRow}>
            <TouchableOpacity
              style={[styles.primaryButton, savingCollabPost && styles.primaryButtonDisabled]}
              onPress={handleSave}
              disabled={savingCollabPost || uploadingImages}
            >
              <Text style={styles.primaryButtonText}>
                {savingCollabPost ? 'Saving...' : 'Save collab post'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.secondaryButton, savingCollabPost && styles.secondaryButtonDisabled]}
              onPress={handlePreview}
              disabled={savingCollabPost}
            >
              <Feather name="eye" size={16} color="#111827" />
              <Text style={styles.secondaryButtonText}>Preview</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Message</Text>
          <Text style={styles.messageText}>{req?.message || '—'}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Parties</Text>

          <TouchableOpacity style={styles.partyCard} activeOpacity={0.9}>
            <View style={styles.partyTopRow}>
              <Text style={styles.partyLabel}>Brand</Text>
              <Feather name="arrow-up-right" size={18} color="#6b7280" />
            </View>
            <Text style={styles.partyName}>{brandName || '—'}</Text>
            <Text style={styles.partyMeta}>{buildMetaLine(brand, brandCity)}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.partyCard} activeOpacity={0.9}>
            <View style={styles.partyTopRow}>
              <Text style={styles.partyLabel}>Influencer</Text>
              <Feather name="arrow-up-right" size={18} color="#6b7280" />
            </View>
            <Text style={styles.partyName}>{influencerName || '—'}</Text>
            <Text style={styles.partyMeta}>{buildMetaLine(req?.influencer, influencerCity)}</Text>
          </TouchableOpacity>
        </View>

        {isInfluencer && isPending ? (
          <View style={styles.actionCard}>
            <Text style={styles.actionTitle}>Action</Text>
            <View style={styles.actionPillRow}>
              <TouchableOpacity
                style={[styles.actionPill, styles.acceptPill, responding && styles.actionPillDisabled]}
                disabled={responding}
                onPress={() => handleRespond('accept')}
              >
                <Text style={[styles.actionPillText, styles.acceptPillText]}>
                  {responding ? 'Please wait...' : 'Accept'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionPill, styles.rejectPill, responding && styles.actionPillDisabled]}
                disabled={responding}
                onPress={() => handleRespond('reject')}
              >
                <Text style={[styles.actionPillText, styles.rejectPillText]}>
                  {responding ? 'Please wait...' : 'Reject'}
                </Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.actionHint}>Accepting will add this product to your storefront.</Text>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  scrollContent: {
    padding: 16,
    gap: 12,
    paddingBottom: 28,
  },
  loadingWrap: {
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 99,
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 16,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  cardDescription: {
    fontSize: 12,
    lineHeight: 18,
    color: '#6b7280',
    marginTop: 8,
  },
  productRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
    alignItems: 'center',
  },
  productThumbWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#f3f4f6',
  },
  productThumb: {
    width: '100%',
    height: '100%',
  },
  thumbPlaceholder: {
    backgroundColor: '#e5e7eb',
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  productPrice: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 6,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 14,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 11,
    marginTop: 10,
    fontSize: 13,
  },
  platformGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    marginTop: 12,
  },
  platformPill: {
    alignSelf: 'flex-start',
    marginRight: 10,
    marginBottom: 10,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 10,
  },
  platformPillSelected: {
    borderColor: '#111827',
    borderWidth: 1,
    backgroundColor: '#f3f4f6',
  },
  platformPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111827',
  },
  platformPillTextSelected: {
    color: '#111827',
  },
  imageToolsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  imagesHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  imagesHeaderLeft: {
    flex: 1,
    paddingRight: 10,
  },
  smallButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  smallButtonDisabled: {
    opacity: 0.6,
  },
  smallButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
  },
  imageUrlRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  tipText: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 10,
  },
  thumbRow: {
    marginTop: 10,
  },
  thumbAddTile: {
    width: 64,
    height: 64,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    marginRight: 10,
  },
  thumbTile: {
    width: 64,
    height: 64,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#f3f4f6',
    marginRight: 10,
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  thumbRemove: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(17, 24, 39, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111827',
    marginTop: 16,
  },
  previewWrap: {
    marginTop: 10,
    backgroundColor: 'transparent',
  },
  previewRow: {
    flexDirection: 'row',
    gap: 10,
  },
  previewItem: {
    flex: 1,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#f3f4f6',
  },
  previewItemDivider: {
    borderRightWidth: 1,
    borderRightColor: '#e5e7eb',
  },
  previewImage: {
    width: '100%',
    height: 160,
  },
  imageUrlInput: {
    flex: 1,
  },
  removeButton: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: '#f3f4f6',
    marginTop: 10,
  },
  removeButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
  },
  bottomActionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 14,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#111827',
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
  },
  secondaryButtonDisabled: {
    opacity: 0.7,
  },
  secondaryButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
  },
  messageText: {
    fontSize: 13,
    lineHeight: 19,
    color: '#111827',
    marginTop: 12,
  },
  partyCard: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 18,
    padding: 14,
    marginTop: 12,
    backgroundColor: '#ffffff',
  },
  partyTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  partyLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
  },
  partyName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginTop: 10,
  },
  partyMeta: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 6,
  },
  actionCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 18,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  actionPillRow: {
    flexDirection: 'row',
    gap: 14,
    marginTop: 16,
  },
  actionPill: {
    flex: 1,
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  actionPillDisabled: {
    opacity: 0.6,
  },
  actionPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  acceptPill: {
    backgroundColor: '#ecfdf5',
    borderColor: '#bbf7d0',
  },
  acceptPillText: {
    color: '#065f46',
  },
  rejectPill: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecdd3',
  },
  rejectPillText: {
    color: '#9f1239',
  },
  actionHint: {
    fontSize: 15,
    lineHeight: 22,
    color: '#6b7280',
    marginTop: 16,
  },
});

export default CollaborationRequestDetailScreen;
