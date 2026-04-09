import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import Header from '../components/Header';
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

const CollaborationRequestsScreen2 = ({ navigation }) => {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [outgoingRequests, setOutgoingRequests] = useState([]);
  const [respondingById, setRespondingById] = useState({});

  const fetchRequests = useCallback(async (opts = {}) => {
    const isRefresh = opts.refresh === true;
    try {
      if (!isRefresh) setLoading(true);

      const [incomingRes, outgoingRes] = await Promise.all([
        collaboration.getIncomingRequests(),
        collaboration.getOutgoingRequests(),
      ]);

      setIncomingRequests(incomingRes?.requests || incomingRes?.data?.requests || []);
      setOutgoingRequests(outgoingRes?.requests || outgoingRes?.data?.requests || []);
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

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchRequests({ refresh: true });
  }, [fetchRequests]);

  const handleRespond = useCallback(
    async (req, action) => {
      const requestId = req?.id;
      if (!requestId) {
        Alert.alert('Error', 'Missing request id');
        return;
      }

      const normalizedAction = String(action || '').toLowerCase();
      if (normalizedAction !== 'accept' && normalizedAction !== 'reject') {
        Alert.alert('Error', 'Invalid action');
        return;
      }

      try {
        setRespondingById((prev) => ({ ...prev, [String(requestId)]: true }));
        await collaboration.respondToRequest(requestId, normalizedAction);
        await fetchRequests({ refresh: true });
      } catch (e) {
        Alert.alert('Error', e?.message || 'Failed to respond to request');
      } finally {
        setRespondingById((prev) => ({ ...prev, [String(requestId)]: false }));
      }
    },
    [fetchRequests]
  );

  const allRequests = useMemo(
    () => [...(incomingRequests || []), ...(outgoingRequests || [])],
    [incomingRequests, outgoingRequests]
  );

  const combinedRequests = useMemo(() => {
    const incoming = (incomingRequests || []).map((r) => ({ ...r, __direction: 'incoming' }));
    const outgoing = (outgoingRequests || []).map((r) => ({ ...r, __direction: 'outgoing' }));
    return [...incoming, ...outgoing];
  }, [incomingRequests, outgoingRequests]);

  const acceptedCount = useMemo(
    () => allRequests.filter((r) => String(r?.status || '').toUpperCase() === 'ACCEPTED').length,
    [allRequests]
  );

  const renderRequestCard = (req, opts = {}) => {
    const isIncoming = opts.incoming === true || req?.__direction === 'incoming';
    const status = req?.status;
    const statusPalette = getStatusColor(status);
    const post = req?.post || {};
    const imageUrl = post?.image_url;
    const influencerName = req?.influencer?.name || '';
    const brandName = req?.brand?.name || post?.brand?.name || '';
    const initiatedBy = req?.initiated_by ? String(req.initiated_by) : '';
    const requestId = req?.id;
    const responding = requestId != null ? respondingById[String(requestId)] === true : false;
    const isPending = String(status || '').toUpperCase() === 'PENDING';

    const subtitle = isIncoming ? influencerName || initiatedBy : brandName || initiatedBy;

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
          {!!subtitle && <Text style={styles.productSubTitle}>{subtitle}</Text>}

          <View style={styles.requestMetaRow}>
            <Text style={styles.requestMetaText} numberOfLines={1}>
              {formatCurrency(post?.currency, post?.price)}
            </Text>
          </View>

          {!!req?.message && <Text style={styles.productNote}>{req.message}</Text>}

          {isIncoming && isPending ? (
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.actionBtn, styles.acceptBtn, responding && styles.actionBtnDisabled]}
                disabled={responding}
                onPress={() => handleRespond(req, 'accept')}
              >
                <Text style={[styles.actionBtnText, styles.acceptBtnText]}>Accept</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, styles.rejectBtn, responding && styles.actionBtnDisabled]}
                disabled={responding}
                onPress={() => handleRespond(req, 'reject')}
              >
                <Text style={[styles.actionBtnText, styles.rejectBtnText]}>Reject</Text>
              </TouchableOpacity>
            </View>
          ) : null}
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
            <View style={styles.heroCopyWrap}>
              <Text style={styles.eyebrow}>Inventory</Text>
              <Text style={styles.heroTitle}>Collaboration requests</Text>
              <Text style={styles.heroDescription}>
                Review both received and sent collaboration requests for your products.
              </Text>
            </View>
            <View style={styles.metricRow}>
              <View style={styles.metricChip}>
                <Feather name="check-circle" size={14} color="#0f766e" />
                <Text style={styles.metricChipText}>{acceptedCount} accepted</Text>
              </View>
              <View style={styles.metricChip}>
                <Feather name="layers" size={14} color="#7c3aed" />
                <Text style={styles.metricChipText}>{combinedRequests.length} total</Text>
              </View>
            </View>
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
                  <Text style={styles.emptyTitle}>No requests yet</Text>
                  <Text style={styles.emptyDescription}>
                    Incoming and outgoing collaboration requests will show up here.
                  </Text>
                </View>
              ) : (
                combinedRequests.map((req) =>
                  renderRequestCard(req, { incoming: req?.__direction === 'incoming' })
                )
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
  productSubTitle: {
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
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  actionBtnDisabled: {
    opacity: 0.6,
  },
  acceptBtn: {
    backgroundColor: '#e7f6ef',
    borderColor: '#b9e7d1',
  },
  rejectBtn: {
    backgroundColor: '#fdecef',
    borderColor: '#f6b3bd',
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '500',
  },
  acceptBtnText: {
    color: '#065f46',
  },
  rejectBtnText: {
    color: '#9f1239',
  },
});

export default CollaborationRequestsScreen2;
