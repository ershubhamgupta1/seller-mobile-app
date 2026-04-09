import React, { useMemo, useState } from 'react';
import {
  Alert,
  Keyboard,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, Ionicons } from '@expo/vector-icons';
import { collaboration } from '../services/api';

const COLORS = {
  bg: '#f4efe9',
  card: '#ffffff',
  cardAlt: '#f3f4f6',
  border: '#e5e7eb',
  textPrimary: '#111827',
  textSecondary: '#4b5563',
  textMuted: '#6b7280',
  buttonStart: '#fb923c',
  buttonEnd: '#fbbf24',
};

const CollabSearchScreen = ({ navigation }) => {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const [query, setQuery] = useState('');
  const isDisabled = useMemo(() => query.trim().length === 0, [query]);

  const [searching, setSearching] = useState(false);
  const [shops, setShops] = useState([]);
  const [selectedShop, setSelectedShop] = useState(null);

  const [postsLoading, setPostsLoading] = useState(false);
  const [posts, setPosts] = useState([]);
  const [requestStatusByPostId, setRequestStatusByPostId] = useState({});
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [messageByPostId, setMessageByPostId] = useState({});
  const [sendingByPostId, setSendingByPostId] = useState({});

  const normalizeShopSearchResponse = (res) => {
    if (!res) return [];
    if (Array.isArray(res)) return res;
    if (Array.isArray(res?.shops)) return res.shops;
    if (Array.isArray(res?.results)) return res.results;
    if (Array.isArray(res?.data)) return res.data;
    if (Array.isArray(res?.data?.shops)) return res.data.shops;
    if (Array.isArray(res?.data?.results)) return res.data.results;
    if (Array.isArray(res?.data?.data)) return res.data.data;
    if (Array.isArray(res?.shop)) return res.shop;
    if (Array.isArray(res?.items)) return res.items;
    if (Array.isArray(res?.data?.items)) return res.data.items;
    return [];
  };

  const getShopLabel = (s) => {
    const name = s?.name || s?.shop_name || s?.title || 'Store';
    const slug = s?.slug || s?.handle || s?.username || s?.shop_slug || s?.public_slug;
    const slugText = slug ? `@${String(slug).replace(/^@/, '')}` : '';
    return { name: String(name), slugText };
  };

  const getShopId = (s) => s?.id ?? s?.shop_id ?? s?._id;

  const getPostId = (p) => p?.id ?? p?.post_id ?? p?._id;

  const normalizeRequestStatus = (value) => {
    const normalized = String(value || '').toUpperCase();
    if (normalized === 'ACCEPTED') return 'Accepted';
    if (normalized === 'PENDING') return 'Pending';
    if (normalized === 'REJECTED') return 'Rejected';
    return normalized ? normalized[0] + normalized.slice(1).toLowerCase() : '';
  };

  const getStatusDotColor = (value) => {
    const normalized = String(value || '').toUpperCase();
    if (normalized === 'ACCEPTED') return '#10b981';
    if (normalized === 'PENDING') return '#f59e0b';
    if (normalized === 'REJECTED') return '#ef4444';
    return '#9ca3af';
  };

  const buildRequestStatusIndex = (requests) => {
    const next = {};
    (requests || []).forEach((r) => {
      const postId = r?.post?.id ?? r?.post_id ?? r?.post?.post_id ?? r?.post?._id;
      if (!postId) return;
      const raw = r?.status;
      next[String(postId)] = raw;
    });
    return next;
  };

  const handleSendRequest = async (postObj) => {
    const pid = getPostId(postObj);
    if (pid == null) {
      Alert.alert('Error', 'Unable to send request: missing post id');
      return;
    }

    const message = String(messageByPostId[String(pid)] || '').trim();

    try {
      setSendingByPostId((prev) => ({ ...prev, [String(pid)]: true }));
      await collaboration.createRequest({
        post_id: pid,
        ...(message ? { message } : {}),
      });

      setMessageByPostId((prev) => ({ ...prev, [String(pid)]: '' }));
      await fetchOutgoingRequestIndex();
    } catch (e) {
      Alert.alert('Error', e?.message || 'Failed to send collaboration request');
    } finally {
      setSendingByPostId((prev) => ({ ...prev, [String(pid)]: false }));
    }
  };

  const fetchOutgoingRequestIndex = async () => {
    try {
      setRequestsLoading(true);
      const [outgoingRes, incomingRes] = await Promise.all([
        collaboration.getOutgoingRequests(),
        collaboration.getIncomingRequests(),
      ]);

      const outgoing = outgoingRes?.requests || outgoingRes?.data?.requests || [];
      const incoming = incomingRes?.requests || incomingRes?.data?.requests || [];
      setRequestStatusByPostId(buildRequestStatusIndex([...(outgoing || []), ...(incoming || [])]));
    } catch (e) {
      setRequestStatusByPostId({});
    } finally {
      setRequestsLoading(false);
    }
  };

  const fetchShopPosts = async (shopId, shopObj) => {
    if (!shopId) return;
    try {
      setSelectedShop(shopObj || null);
      setPosts([]);
      setPostsLoading(true);
      setRequestStatusByPostId({});

      await fetchOutgoingRequestIndex();
      const res = await collaboration.getBusinessShopPosts(shopId);
      setPosts(res?.posts || res?.data?.posts || []);
    } catch (e) {
      setPosts([]);
    } finally {
      setPostsLoading(false);
    }
  };

  const handleSearch = async () => {
    const q = query.trim();
    if (!q) return;
    Keyboard.dismiss();

    try {
      setSearching(true);
      setShops([]);
      setSelectedShop(null);
      setPosts([]);

      const cleaned = q.replace(/^@/, '');
      const res = await collaboration.searchBusinessShops(cleaned);
      setShops(normalizeShopSearchResponse(res));
    } catch (e) {
      setShops([]);
    } finally {
      setSearching(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.content, isTablet && styles.contentTablet]}>
          <View style={styles.card}>
            <View style={styles.topRow}>
              <View style={styles.copyWrap}>
                <Text style={styles.eyebrow}>Closet</Text>
                <Text style={styles.title}>Search Collabs</Text>
                <Text style={styles.description}>
                  Find business stores, browse their products, and request collaborations.
                </Text>
              </View>

              <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                <Ionicons name="arrow-back" size={16} color={COLORS.textPrimary} />
                <Text style={styles.backBtnText}>Back to Closet</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.searchCard}>
              <Text style={styles.searchLabel}>Search business stores</Text>
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search by store name or @slug"
                placeholderTextColor="#9ca3af"
                style={styles.input}
                returnKeyType="search"
                onSubmitEditing={handleSearch}
              />

              <TouchableOpacity
                activeOpacity={0.9}
                style={[styles.searchBtn, isDisabled && styles.searchBtnDisabled]}
                onPress={handleSearch}
                disabled={isDisabled}
              >
                {searching ? (
                  <ActivityIndicator size="small" color={COLORS.textPrimary} />
                ) : (
                  <Feather name="search" size={18} color={COLORS.textPrimary} />
                )}
                <Text style={styles.searchBtnText}>{searching ? 'Searching…' : 'Search'}</Text>
              </TouchableOpacity>

              {!searching && query.trim().length > 0 && shops.length === 0 && !selectedShop && (
                <View style={styles.noResultsWrap}>
                  <Text style={styles.noResultsTitle}>No stores found</Text>
                  <Text style={styles.noResultsDesc}>Try a different name or @slug.</Text>
                </View>
              )}

              {!!shops.length && (
                <View style={styles.shopResultsWrap}>
                  {shops.map((s) => {
                    const shopId = getShopId(s);
                    const key = String(shopId ?? s?.slug ?? s?.name ?? Math.random());
                    const { name, slugText } = getShopLabel(s);
                    const isActive = selectedShop && getShopId(selectedShop) === shopId;

                    return (
                      <TouchableOpacity
                        key={key}
                        activeOpacity={0.9}
                        style={[styles.shopPill, isActive && styles.shopPillActive]}
                        onPress={() => fetchShopPosts(shopId, s)}
                      >
                        <Text style={styles.shopPillName} numberOfLines={1}>
                          {name}
                        </Text>
                        {!!slugText && (
                          <Text style={styles.shopPillSlug} numberOfLines={1}>
                            {slugText}
                          </Text>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              {!!selectedShop && (
                <View style={styles.postsWrap}>
                  <View style={styles.postsHeaderRow}>
                    <Text style={styles.postsTitle}>Posts</Text>
                    {postsLoading && <ActivityIndicator size="small" color={COLORS.textMuted} />}
                  </View>

                  {!postsLoading && posts.length === 0 ? (
                    <View style={styles.emptyPostsCard}>
                      <Text style={styles.emptyPostsTitle}>No posts found</Text>
                      <Text style={styles.emptyPostsDesc}>This store does not have any posts yet.</Text>
                    </View>
                  ) : (
                    posts.map((p, idx) => {
                      const pid = getPostId(p);
                      const postKey = String(pid ?? `${idx}`);
                      const img = p?.image_url || p?.thumbnail_url || p?.images?.[0];
                      const title = p?.title || 'Untitled';
                      const subtitle = p?.subtitle || p?.name || p?.product_name || title;
                      const price = p?.price;
                      const currency = p?.currency || 'INR';
                      const platform =
                        p?.social_platform || p?.platform || p?.template || p?.source || 'Instagram';
                      const statusRaw =
                        (pid != null ? requestStatusByPostId[String(pid)] : undefined) ||
                        p?.status ||
                        p?.collab_status ||
                        p?.request_status ||
                        '';
                      const normalizedStatus = normalizeRequestStatus(statusRaw);
                      const statusLabel = normalizedStatus || 'Request';
                      const dotColor = getStatusDotColor(statusRaw);
                      const hasOutgoingRequest =
                        pid != null &&
                        Object.prototype.hasOwnProperty.call(requestStatusByPostId, String(pid));
                      const showRequestComposer =
                        pid != null && !requestsLoading && !hasOutgoingRequest;
                      const messageValue =
                        pid != null ? String(messageByPostId[String(pid)] || '') : '';
                      const sending = pid != null ? sendingByPostId[String(pid)] === true : false;

                      return (
                        <View key={postKey} style={styles.postCard}>
                          <View style={styles.postMediaWrap}>
                            {img ? (
                              <Image source={{ uri: img }} style={styles.postMedia} />
                            ) : (
                              <View style={[styles.postMedia, styles.postMediaPlaceholder]} />
                            )}

                            <View style={styles.platformPill}>
                              <Text style={styles.platformPillText} numberOfLines={1}>
                                {String(platform)}
                              </Text>
                            </View>
                          </View>

                          <View style={styles.postInfo}>
                            <Text style={styles.postTitle} numberOfLines={1}>
                              {title}
                            </Text>
                            <Text style={styles.postSubtitle} numberOfLines={1}>
                              {subtitle}
                            </Text>
                            {price != null && (
                              <Text style={styles.postPrice}>
                                {currency} {price}
                              </Text>
                            )}

                            <View style={styles.postFooterRow}>
                              {showRequestComposer ? null : (
                                <View style={styles.statusPill}>
                                  <View style={[styles.statusDot, { backgroundColor: dotColor }]} />
                                  <Text style={styles.statusPillText} numberOfLines={1}>
                                    {requestsLoading ? 'Loading…' : statusLabel}
                                  </Text>
                                  <Feather name="arrow-up-right" size={16} color={COLORS.textPrimary} />
                                </View>
                              )}
                            </View>

                            {showRequestComposer && (
                              <View style={styles.requestComposerWrap}>
                                <TextInput
                                  value={messageValue}
                                  onChangeText={(text) => {
                                    if (pid == null) return;
                                    setMessageByPostId((prev) => ({
                                      ...prev,
                                      [String(pid)]: text,
                                    }));
                                  }}
                                  placeholder="Optional message for brand..."
                                  placeholderTextColor="#9ca3af"
                                  style={styles.requestMessageInput}
                                  multiline
                                />

                                <TouchableOpacity
                                  activeOpacity={0.9}
                                  style={[styles.sendRequestBtn, sending && styles.sendRequestBtnDisabled]}
                                  onPress={() => handleSendRequest(p)}
                                  disabled={sending}
                                >
                                  {sending ? (
                                    <ActivityIndicator size="small" color={COLORS.textPrimary} />
                                  ) : (
                                    <Feather name="send" size={18} color={COLORS.textPrimary} />
                                  )}
                                  <Text style={styles.sendRequestBtnText}>
                                    {sending ? 'Sending…' : 'Send Request'}
                                  </Text>
                                </TouchableOpacity>
                              </View>
                            )}
                          </View>
                        </View>
                      );
                    })
                  )}
                </View>
              )}
            </View>
          </View>

          <Text style={styles.footer}>© 2026 Social Commerce SaaS · Business Console</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  contentTablet: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: 720,
  },

  card: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  topRow: {
    gap: 14,
  },
  copyWrap: {
    flex: 1,
  },
  eyebrow: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    lineHeight: 21,
    color: COLORS.textSecondary,
  },

  backBtn: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.cardAlt,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  backBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },

  searchCard: {
    marginTop: 16,
    borderRadius: 20,
    padding: 16,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.textPrimary,
  },

  searchBtn: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    borderRadius: 18,
    backgroundColor: COLORS.buttonEnd,
  },
  searchBtnDisabled: {
    opacity: 0.55,
  },
  searchBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },

  noResultsWrap: {
    marginTop: 12,
    borderRadius: 16,
    padding: 14,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  noResultsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  noResultsDesc: {
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.textSecondary,
  },

  shopResultsWrap: {
    marginTop: 12,
    gap: 10,
  },
  shopPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 999,
  },
  shopPillActive: {
    borderColor: '#f59e0b',
    backgroundColor: '#fffbeb',
  },
  shopPillName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    flexShrink: 1,
  },
  shopPillSlug: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    flexShrink: 1,
  },

  postsWrap: {
    marginTop: 16,
  },
  postsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  postsTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textSecondary,
    letterSpacing: 0.2,
  },
  emptyPostsCard: {
    borderRadius: 16,
    padding: 14,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyPostsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  emptyPostsDesc: {
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.textSecondary,
  },
  postCard: {
    borderRadius: 24,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 12,
    overflow: 'hidden',
  },

  postMediaWrap: {
    position: 'relative',
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#f9fafb',
  },
  postMedia: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  postMediaPlaceholder: {
    backgroundColor: '#f3f4f6',
  },

  platformPill: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  platformPillText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },

  postInfo: {
    padding: 16,
  },
  postTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  postSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  postPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },

  postFooterRow: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: '#ffffff',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: '#10b981',
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textPrimary,
  },

  requestComposerWrap: {
    marginTop: 14,
    gap: 12,
  },
  requestMessageInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: '#ffffff',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: COLORS.textPrimary,
    minHeight: 54,
  },
  sendRequestBtn: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: COLORS.buttonEnd,
  },
  sendRequestBtnDisabled: {
    opacity: 0.7,
  },
  sendRequestBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },

  footer: {
    marginTop: 18,
    textAlign: 'center',
    fontSize: 12,
    color: '#9ca3af',
  },
});

export default CollabSearchScreen;
