import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '../components/Header';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { collaboration } from '../services/api';

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
  if (normalized === 'INR') return `₹ ${value}`;
  return `${normalized} ${value}`;
};

const normalizeLinkRoutes = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.link_routes)) return response.link_routes;
  if (Array.isArray(response?.routes)) return response.routes;
  if (Array.isArray(response?.data)) return response.data;
  if (response?.link_route) return [response.link_route];
  if (response?.route) return [response.route];
  return [];
};

const ClosetScreen = ({ navigation }) => {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [outgoingRequests, setOutgoingRequests] = useState([]);
  const [linkRoutes, setLinkRoutes] = useState([]);
  const [linkInput, setLinkInput] = useState('');
  const [linkRouteSubmitting, setLinkRouteSubmitting] = useState(false);
  const [removingLinkRouteId, setRemovingLinkRouteId] = useState(null);

  const fetchRequests = useCallback(async (opts = {}) => {
    const isRefresh = opts.refresh === true;
    try {
      if (!isRefresh) setLoading(true);

      const [incomingRes, outgoingRes, linkRoutesRes] = await Promise.all([
        collaboration.getIncomingRequests(),
        collaboration.getOutgoingRequests(),
        collaboration.getLinkRoutes(),
      ]);

      setIncomingRequests(incomingRes?.requests || []);
      setOutgoingRequests(outgoingRes?.requests || []);
      setLinkRoutes(normalizeLinkRoutes(linkRoutesRes));
    } catch (e) {
      Alert.alert('Error', e?.message || 'Failed to load collaboration requests');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleCopyLink = async (value) => {
    await Clipboard.setStringAsync(value);
    Alert.alert('Copied', 'Closet link copied');
  };

  const handleCreateLinkRoute = async () => {
    const trimmed = String(linkInput || '').trim();
    if (!trimmed) {
      Alert.alert('Missing link', 'Paste a post or reel link first.');
      return;
    }

    try {
      setLinkRouteSubmitting(true);
      const response = await collaboration.createLinkRoute(trimmed);
      const createdRoutes = normalizeLinkRoutes(response);

      if (createdRoutes.length > 0) {
        setLinkRoutes((prev) => {
          const next = [...createdRoutes, ...prev];
          const seen = new Set();
          return next.filter((item, index) => {
            const key = String(item?.id ?? item?.source_url ?? index);
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });
        });
      } else {
        const refreshed = await collaboration.getLinkRoutes();
        setLinkRoutes(normalizeLinkRoutes(refreshed));
      }

      setLinkInput('');
    } catch (e) {
      Alert.alert('Error', e?.message || 'Failed to connect link');
    } finally {
      setLinkRouteSubmitting(false);
    }
  };

  const handleRemoveLinkRoute = async (linkRouteId) => {
    try {
      setRemovingLinkRouteId(linkRouteId);
      await collaboration.deleteLinkRoute(linkRouteId);
      setLinkRoutes((prev) => prev.filter((item) => String(item?.id ?? item?.link_route_id) !== String(linkRouteId)));
    } catch (e) {
      Alert.alert('Error', e?.message || 'Failed to remove connected link');
    } finally {
      setRemovingLinkRouteId(null);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchRequests({ refresh: true });
  }, [fetchRequests]);

  const handleSearchCloset = () => {
    navigation.navigate('collab-search');
  };

  const allRequests = useMemo(
    () => [...incomingRequests, ...outgoingRequests],
    [incomingRequests, outgoingRequests]
  );

  const combinedRequests = useMemo(() => {
    const items = [...allRequests];
    items.sort((a, b) => {
      const aTime = Date.parse(a?.created_at || a?.createdAt || a?.updated_at || a?.updatedAt || '') || 0;
      const bTime = Date.parse(b?.created_at || b?.createdAt || b?.updated_at || b?.updatedAt || '') || 0;
      return bTime - aTime;
    });
    return items;
  }, [allRequests]);

  const acceptedCount = useMemo(
    () => allRequests.filter((r) => String(r?.status || '').toUpperCase() === 'ACCEPTED').length,
    [allRequests]
  );

  const renderRequestCard = (req) => {
    const status = req?.status;
    const statusPalette = getStatusColor(status);
    const post = req?.post || {};
    const brandName = post?.brand?.name ? `By ${post.brand.name}` : '';
    const imageUrl = post?.image_url;
    const influencerName = req?.influencer?.name || '';
    const initiatedBy = req?.initiated_by ? String(req.initiated_by) : '';

    return (
      <TouchableOpacity
        key={String(req?.id)}
        style={styles.productCard}
        activeOpacity={0.9}
        onPress={() => navigation.navigate('collaborationRequestDetail', { request: req })}
      >
        <View style={[styles.statusBadge, { backgroundColor: statusPalette.bg }]}>
          <Feather name="check-circle" size={12} color={statusPalette.fg} />
          <Text style={[styles.statusBadgeText, { color: statusPalette.fg }]}>{String(status || '—')}</Text>
        </View>

        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.productImage} />
        ) : (
          <View style={[styles.productImage, styles.productImagePlaceholder]} />
        )}

        <View style={styles.productBody}>
          <Text style={styles.productTitle}>{post?.title || 'Untitled'}</Text>
          {!!brandName && <Text style={styles.productBrand}>{brandName}</Text>}

          <View style={styles.requestMetaRow}>
            {/* <Text style={styles.requestMetaText} numberOfLines={1}>
              {formatCurrency(post?.currency, post?.price)}
            </Text> */}
            {/* {!!influencerName && (
              <Text style={styles.requestMetaText} numberOfLines={1}>
                {influencerName}
              </Text>
            )} */}
            {!!initiatedBy && (
              <Text style={styles.requestMetaText} numberOfLines={1}>
                {initiatedBy}
              </Text>
            )}
          </View>

          {!!req?.message && <Text style={styles.productNote}>{req.message}</Text>}

          <View style={styles.productFooter}>
            {/* <TouchableOpacity
              style={styles.productLinkButton}
              onPress={() => handleCopyLink(String(req?.id))}
            >
              <FontAwesome5 name="copy" size={13} color="#111827" />
              <Text style={styles.productLinkButtonText}>Copy request id</Text>
            </TouchableOpacity> */}

            {/* <TouchableOpacity
              style={styles.productViewButton}
              onPress={() => navigation.navigate('feedScreen')}
            >
              <Text style={styles.productViewButtonText}>View</Text>
              <Feather name="chevron-right" size={16} color="#111827" />
            </TouchableOpacity> */}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Header
          title="Collaborations"
          headerType="page"
          showBackButton
          onBackPress={() => navigation.goBack()}
          onNotificationPress={() => {}}
          onProfilePress={() => navigation.navigate('userProfile')}
        />

        <View style={[styles.content, isTablet && styles.contentTablet]}>
          <View style={styles.heroCard}>
            <View style={styles.heroTopRow}>
              <View style={styles.heroCopyWrap}>
                <Text style={styles.eyebrow}>Closet</Text>
                {/* <Text style={styles.heroTitle}>Collaborations</Text> */}
                <Text style={styles.heroDescription}>
                  See collaboration requests from brands and keep accepted resale links ready for your audience.
                </Text>
              </View>

              <TouchableOpacity style={styles.searchBtn} onPress={handleSearchCloset}>
                <Feather name="search" size={16} color="#111827" />
                <Text style={styles.searchBtnText}>Search Collabs</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.metricRow}>
              <View style={styles.metricChip}>
                <Feather name="check-circle" size={14} color="#0f766e" />
                <Text style={styles.metricChipText}>{acceptedCount} accepted</Text>
              </View>
              <View style={styles.metricChip}>
                <Feather name="link" size={14} color="#7c3aed" />
                <Text style={styles.metricChipText}>{allRequests.length} requests</Text>
              </View>
            </View>
          </View>

          <View style={styles.linksCard}>
            <View style={styles.linksHeader}>
              <View style={styles.linksCopyWrap}>
                <Text style={styles.linksEyebrow}>Smart storefront redirect</Text>
                <Text style={styles.linksTitle}>Connect reel/post links to your storefront</Text>
                <Text style={styles.linksDescription}>
                  If a customer pastes one of these links in feed search and no product matches, they will be redirected to your customer storefront.
                </Text>
              </View>
            </View>

            <View style={[styles.linkComposerRow, isTablet && styles.linkComposerRowTablet]}>
              <TextInput
                value={linkInput}
                onChangeText={setLinkInput}
                placeholder="Paste Instagram/Facebook/Pinterest/website post link"
                placeholderTextColor="#9ca3af"
                autoCapitalize="none"
                autoCorrect={false}
                style={styles.linkInput}
              />

              <TouchableOpacity
                style={[styles.connectButton, (!linkInput.trim() || linkRouteSubmitting) && styles.connectButtonDisabled]}
                onPress={handleCreateLinkRoute}
                disabled={!linkInput.trim() || linkRouteSubmitting}
              >
                {linkRouteSubmitting ? (
                  <ActivityIndicator size="small" color="#111827" />
                ) : (
                  <>
                    <Feather name="link" size={18} color="#111827" />
                    <Text style={styles.connectButtonText}>Connect Link</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {linkRoutes.length > 0 && (
              <View style={styles.linkPillsWrap}>
                {linkRoutes.map((item, index) => {
                  const routeId = item?.id ?? item?.link_route_id ?? index;
                  const sourceUrl = item?.source_url || item?.url || '';
                  const isRemoving = String(removingLinkRouteId) === String(routeId);

                  return (
                    <View key={String(routeId)} style={styles.linkRoutePill}>
                      <Text style={styles.linkRoutePillText} numberOfLines={1}>{sourceUrl}</Text>
                      <TouchableOpacity
                        style={styles.linkRouteRemoveButton}
                        onPress={() => handleRemoveLinkRoute(routeId)}
                        disabled={isRemoving}
                      >
                        {isRemoving ? (
                          <ActivityIndicator size="small" color="#64748b" />
                        ) : (
                          <Feather name="x" size={18} color="#64748b" />
                        )}
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            )}
          </View>

          {loading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="large" color="#111827" />
            </View>
          ) : (
            <View style={styles.listSection}>
              {/* <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>Requests</Text>
                <Text style={styles.sectionCount}>{combinedRequests.length}</Text>
              </View> */}
              {combinedRequests.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyTitle}>No requests</Text>
                  <Text style={styles.emptyDescription}>Incoming and outgoing collaboration requests will show up here.</Text>
                </View>
              ) : (
                combinedRequests.map(renderRequestCard)
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    paddingBottom: 32,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 16,
  },
  contentTablet: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: 720,
  },
  heroCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  heroTopRow: {
    gap: 14,
  },
  heroCopyWrap: {
    flex: 1,
  },
  eyebrow: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6b7280',
    marginBottom: 4,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  heroDescription: {
    fontSize: 14,
    lineHeight: 21,
    color: '#4b5563',
  },
  searchBtn: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  searchBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  metricRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 14,
  },
  metricChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f8fafc',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  metricChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  linksCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  linksHeader: {
    gap: 12,
    marginBottom: 12,
  },
  linksCopyWrap: {
    flex: 1,
  },
  linksEyebrow: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
  },
  linksTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
  },
  linksDescription: {
    fontSize: 14,
    lineHeight: 22,
    color: '#6b7280',
  },
  linkComposerRow: {
    flexDirection: 'column',
    gap: 12,
  },
  linkComposerRowTablet: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  linkInput: {
    flex: 1,
    minHeight: 56,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 20,
    fontSize: 12,
    color: '#111827',
  },
  connectButton: {
    minHeight: 36,
    borderRadius: 24,
    paddingHorizontal: 22,
    backgroundColor: '#fbbf24',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    alignSelf: 'flex-start',
  },
  connectButtonDisabled: {
    opacity: 0.6,
  },
  connectButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111827',
  },
  linkPillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  linkRoutePill: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingLeft: 12,
    paddingRight: 8,
    paddingVertical: 8,
    gap: 6,
  },
  linkRoutePillText: {
    maxWidth: 180,
    fontSize: 12,
    color: '#475569',
  },
  linkRouteRemoveButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copyPrimaryButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#111827',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  copyPrimaryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  linkPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    backgroundColor: '#f9fafb',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  linkPillText: {
    flex: 1,
    fontSize: 13,
    color: '#4b5563',
  },
  listSection: {
    gap: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  sectionCount: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6b7280',
  },
  loadingWrap: {
    paddingVertical: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 16,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
  },
  emptyDescription: {
    fontSize: 13,
    lineHeight: 20,
    color: '#6b7280',
    marginTop: 6,
  },
  productCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
  },
  statusBadge: {
    position: 'absolute',
    top: 14,
    left: 14,
    zIndex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  productImage: {
    width: '100%',
    height: 280,
    backgroundColor: '#f3f4f6',
  },
  productImagePlaceholder: {
    backgroundColor: '#f3f4f6',
  },
  productBody: {
    padding: 16,
  },
  productTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },
  productBrand: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 4,
  },
  productNote: {
    fontSize: 13,
    lineHeight: 20,
    color: '#4b5563',
    marginTop: 10,
  },
  requestMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 10,
  },
  requestMetaText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6b7280',
  },
  productFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 14,
  },
  productLinkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: '#f9fafb',
  },
  productLinkButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
  },
  productViewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  productViewButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
});

export default ClosetScreen;
