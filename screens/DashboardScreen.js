import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from "react-native";
import Header from "../components/Header";
import { analytics, collaboration, shop } from "../services/api";
import { Feather, MaterialIcons, Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from '../contexts/AuthContext';

/* ===================== TOKENS ===================== */
const COLORS = {
  bg: "#f9fafb",
  card: "#ffffff",
  border: "#e5e7eb",
  textPrimary: "#111827",
  textSecondary: "#4b5563",
  textMuted: "#6b7280",

  successBg: "#dcfce7",
  successText: "#22c55e",

  warningBg: "#ffedd5",
  warningText: "#f97316",
};

const SPACING = {
  sm: 8,
  md: 12,
  lg: 16,
};

/* ===================== BASE ===================== */
const base = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
  },

  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  label: {
    fontSize: 14,
    color: COLORS.textMuted,
  },

  title: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },

  description: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginVertical: 8,
    lineHeight: 20,
  },
});

/* ===================== SMALL COMPONENTS ===================== */
const ProTipCard = () => (
  <View style={base.card}>
    <Text style={styles.smallTitle}>Pro tip</Text>

    <Text style={styles.proTipText}>
      Add 3 high-quality images per product. Use “Material” + “Price” for instant trust.
    </Text>
  </View>
);

const StatCard = ({ title, desc, value }) => (
  <View style={styles.statBox}>
    <Text style={styles.statTitle}>{title}</Text>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statDesc}>{desc}</Text>
  </View>
);

const Badge = ({ type = "success", icon, text }) => {
  const isSuccess = type === "success";

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: isSuccess ? COLORS.successBg : COLORS.warningBg },
      ]}
    >
      <Ionicons
        name={icon}
        size={16}
        color={isSuccess ? COLORS.successText : COLORS.warningText}
      />
      <Text
        style={[
          styles.badgeText,
          { color: isSuccess ? COLORS.successText : COLORS.warningText },
        ]}
      >
        {text}
      </Text>
    </View>
  );
};

const InfluencerAccountCard = ({ email, shopData, onRequestPromotion, promotionLoading }) => {
  const shopStatus = shopData?.verification_status || 'DRAFT';
  const isPromoted = String(shopData?.promotion_status || '').toUpperCase() === 'APPROVED';

  return (
    <View style={base.card}>
      <Text style={base.label}>Account</Text>
      <Text style={styles.accountEmail}>{email || '—'}</Text>

      <View style={styles.innerCard}>
        <Text style={styles.sectionTitle}>Shop status</Text>

        {shopStatus === 'VERIFIED' ? (
          <View style={styles.verifiedBadge}>
            <Feather name="check-circle" size={16} color="#1c7c54" />
            <Text style={styles.verifiedText}>Verified</Text>
          </View>
        ) : (
          <View style={styles.pendingBadge}>
            <Feather name="clock" size={16} color="#6b7280" />
            <Text style={styles.influencerDraftText}>Draft</Text>
          </View>
        )}

        <Text style={styles.url}>{shopData?.bio_link || '—'}</Text>

        {isPromoted ? (
          <View style={styles.promotedPill}>
            <Ionicons name="rocket-outline" size={16} color={styles.promotedPillText.color} />
            <Text style={styles.promotedPillText}>Promoted</Text>
          </View>
        ) : (
          <>
            <Text style={styles.influencerNotPromoted}>Not promoted</Text>

            <TouchableOpacity
              style={[styles.influencerPromoBtn, promotionLoading && styles.promoBtnDisabled]}
              onPress={onRequestPromotion}
              disabled={promotionLoading}
              activeOpacity={0.9}
            >
              <Text style={styles.influencerPromoBtnText}>
                {promotionLoading ? 'Requesting...' : 'Request promotion'}
              </Text>
              <Feather name="arrow-up" size={16} color="#111827" />
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
};

const AccountCard = ({ email, shopData, onRequestPromotion, promotionLoading }) => {
  const shopStatus = shopData?.verification_status || 'PENDING';
  const isPromoted = String(shopData?.promotion_status || '').toUpperCase() === 'APPROVED';

  return (
  <View style={base.card}>
    <Text style={base.label}>Account</Text>
    <Text style={styles.accountEmail}>{email || '—'}</Text>

    <View style={styles.innerCard}>
      <Text style={styles.sectionTitle}>Shop status</Text>

      {shopStatus === 'VERIFIED' ? (
        <View style={styles.verifiedBadge}>
          <Feather name="check-circle" size={16} color="#1c7c54" />
          <Text style={styles.verifiedText}>Verified</Text>
        </View>
      ) : (
        <View style={styles.pendingBadge}>
          <Feather name="clock" size={16} color="#dc2626" />
          <Text style={styles.pendingText}>Pending</Text>
        </View>
      )}

      <Text style={styles.url}>
        {shopData?.bio_link || 'Loading...'}
      </Text>

      {isPromoted ? (
        <View style={styles.promotedRow}>
          <Badge type="warning" icon="rocket-outline" text="Promoted" />

          <Text style={styles.promotedDesc}>
            Shown first in customer trending feed
          </Text>
        </View>
      ) : (
        <TouchableOpacity
          style={[styles.primaryButton, promotionLoading && styles.promoBtnDisabled]}
          onPress={onRequestPromotion}
          disabled={promotionLoading}
          activeOpacity={0.9}
        >
          <Text style={styles.primaryButtonText}>
            {promotionLoading ? 'Requesting...' : 'Request promotion'}
          </Text>
          <Ionicons name="chevron-up" size={18} />
        </TouchableOpacity>
      )}
    </View>
  </View>
);
};

/* ===================== MAIN SCREEN ===================== */

const DashboardScreen = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [metrics, setMetrics] = useState({});
  const [shopData, setShopData] = useState({});
  const [collabCounts, setCollabCounts] = useState({ activeCollabs: 0 });
  const [promotionLoading, setPromotionLoading] = useState(false);
  const [shopExists, setShopExists] = useState(true);
  const { user, isAuthenticated } = useAuth();

  const resolveUserName = (authUser) => {
    const u = authUser?.user || authUser?.me || authUser?.data?.user || authUser;

    const firstName = u?.first_name || u?.firstName;
    const lastName = u?.last_name || u?.lastName;
    const fullName = u?.name || u?.full_name || u?.fullName;
    const email = u?.email;

    if (typeof fullName === 'string' && fullName.trim()) return fullName.trim();

    const joined = [firstName, lastName].filter(Boolean).join(' ').trim();
    if (joined) return joined;

    if (typeof email === 'string' && email.includes('@')) {
      return email.split('@')[0];
    }

    return 'there';
  };

  const resolveUserEmail = (authUser) => {
    const u = authUser?.user || authUser?.me || authUser?.data?.user || authUser;
    const email = u?.email;
    return typeof email === 'string' ? email : '';
  };

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

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    fetchSummaryData();
    fetchShopData();
  }, [isAuthenticated]);

  const fetchShopData = async () => {
    if (!isAuthenticated) {
      return;
    }

    try {
      const response = await shop.getMyShop();
      let qrCode = await shop.getQRCode();
      qrCode = qrCode?.replace(/svg:/g, "")
      .replace(/xmlns:svg="[^"]*"/g, "");

      // Extract shop data from nested response
      const shopResponse = response?.shop || {};
      setShopData(shopResponse);
      setShopExists(true);
    } catch (error) {
      const msg = String(error?.message || '').toLowerCase();
      if (!isAuthenticated || msg.includes('incorrect password') || msg.includes('unauthorized') || msg.includes('401')) {
        return;
      }

      // Check if error is due to shop not existing
      if (msg.includes('not found') || msg.includes('404') || msg.includes('no shop') || msg.includes('shop_not_created')) {
        setShopExists(false);
        return;
      }

      console.error('Error fetching shop data:', error);
    }
  };

  const fetchSummaryData = async () => {
    if (!isAuthenticated) {
      return;
    }

    try {
      const incomingReq = await collaboration.getIncomingRequests();
      const incomingList = Array.isArray(incomingReq)
        ? incomingReq
        : Array.isArray(incomingReq?.requests)
          ? incomingReq.requests
          : Array.isArray(incomingReq?.data)
            ? incomingReq.data
            : [];
      setCollabCounts({ activeCollabs: incomingList.length });

      const res = await analytics.getSummary();
      setMetrics(res?.metrics || {});
    } catch (e) {
      const msg = String(e?.message || '').toLowerCase();
      if (!isAuthenticated || msg.includes('incorrect password') || msg.includes('unauthorized') || msg.includes('401')) {
        return;
      }

       if (msg.includes('not found') || msg.includes('404') || msg.includes('no shop') || msg.includes('shop_not_created')) {
         setShopExists(false);
         return;
       }

      console.error(e);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchSummaryData();
    await fetchShopData();
    setRefreshing(false);
  };

  const handleRequestPromotion = async () => {
    if (promotionLoading) return;
    try {
      setPromotionLoading(true);
      await shop.requestPromotion();
      Alert.alert(
        'Promotion requested',
        'Your request has been submitted. We will review it shortly.'
      );
      await fetchShopData();
    } catch (e) {
      Alert.alert('Error', e?.message || 'Unable to request promotion');
    } finally {
      setPromotionLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.container}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Header
          title="Dashboard"
          onNotificationPress={() => {}}
          onProfilePress={() => navigation.navigate("userProfile")}
        />

        <View style={styles.content}>
          {isInfluencer ? (
            <>
              <View style={styles.influencerWelcomeCard}>
                <Text style={styles.influencerWelcomeEyebrow}>Influencer Dashboard</Text>
                <Text style={styles.influencerWelcomeTitle}>Hello, {resolveUserName(user)}!</Text>
                <Text style={styles.influencerWelcomeSubtitle}>
                  Welcome back. Ready to post, share, and grow your storefront.
                </Text>
              </View>

              <View style={base.card}>
                <Text style={styles.smallTitle}>Quick Actions</Text>
                <Text style={base.title}>Run your storefront like a product</Text>
                <Text style={base.description}>
                  Upload social links, add structured product details, and build trust with verification. This is how we kill “DM for price”.
                </Text>

                <View style={styles.statsContainer}>
                  <StatCard
                    title="Active Collabs"
                    value={collabCounts.activeCollabs ?? 0}
                    desc={'Accepted collab posts in your closet'}
                  />
                  <StatCard
                    title="Closet Images"
                    value={metrics.total_images ?? 0}
                    desc={'Images across your accepted collab posts'}
                  />
                  <StatCard
                    title="Collab Shares"
                    value={metrics.total_shares ?? 0}
                    desc={'Share signal from accepted collab posts'}
                  />
                </View>
              </View>

              <View style={base.card}>
                <View style={base.rowBetween}>
                  <View>
                    <Text style={styles.smallTitle}>Unified Shop Identity</Text>
                    <Text style={base.title}>One QR. One link.</Text>
                  </View>
                  <MaterialIcons name="qr-code" size={24} />
                </View>

                <Text style={base.description}>
                  Use a single QR to bridge offline traffic to your video-first storefront.
                </Text>

                <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.navigate('shopIdentity')}>
                  <Text style={styles.secondaryButtonText}>Manage</Text>
                  <Feather name="arrow-right" size={16} />
                </TouchableOpacity>
              </View>

              <View style={base.card}>
                <View style={base.rowBetween}>
                  <View>
                    <Text style={styles.smallTitle}>Trust & Verification</Text>
                    <Text style={base.title}>Earn the Blue Tick</Text>
                  </View>
                  <Feather name="check-circle" size={22} />
                </View>

                <Text style={base.description}>
                  Submit GST, shop photos, and social proof. Verification unlocks marketplace trust.
                </Text>

                <TouchableOpacity 
                  style={[styles.secondaryButton, !shopExists && styles.disabledButton]} 
                  onPress={() => shopExists && navigation.navigate('trustMeter')}
                  disabled={!shopExists}
                >
                  <Text style={[styles.secondaryButtonText, !shopExists && styles.disabledButtonText]}>Open Trust Meter</Text>
                  <Feather name="arrow-right" size={16} color={shopExists ? undefined : '#9ca3af'} />
                </TouchableOpacity>
              </View>

              <InfluencerAccountCard
                email={resolveUserEmail(user)}
                shopData={shopData}
                onRequestPromotion={handleRequestPromotion}
                promotionLoading={promotionLoading}
              />
              <ProTipCard />
            </>
          ) : (
            <>
              {/* NAV */}
              <TouchableOpacity
                style={[styles.secondaryButton, !shopExists && styles.disabledButton]}
                onPress={() => shopExists && navigation.navigate("analytics")}
                disabled={!shopExists}
              >
                <Text style={[styles.secondaryButtonText, !shopExists && styles.disabledButtonText]}>Open Analytics</Text>
                <Feather name="arrow-right" size={16} color={shopExists ? undefined : '#9ca3af'} />
              </TouchableOpacity>

              {/* QUICK ACTION */}
              <View style={base.card}>
                <Text style={styles.smallTitle}>Quick Actions</Text>
                <Text style={base.title}>Run your storefront like a product</Text>
                <Text style={base.description}>
                  Upload social links, add structured product details, and build trust with verification. This is how we kill “DM for price”.
                </Text>

                <View style={styles.statsContainer}>
                  <StatCard title="Total Posts" value={metrics.total_posts} desc={'Every post is a structured product card'} />
                  <StatCard title="Images" value={metrics.total_images} desc={'Boost conversions with multi-image support'} />
                  <StatCard title="Shares" value={metrics.total_shares} desc={'Signal: demand and social proof'} />
                </View>
              </View>

              {/* QR */}
              <View style={base.card}>
                <View style={base.rowBetween}>
                  <View>
                    <Text style={styles.smallTitle}>Unified Shop Identity</Text>
                    <Text style={base.title}>One QR. One link.</Text>
                  </View>
                  <MaterialIcons name="qr-code" size={24} />
                </View>

                <Text style={base.description}>
                  Use a single QR to bridge offline traffic to your video-first storefront.
                </Text>

                <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.navigate('shopIdentity')}>
                  <Text style={styles.secondaryButtonText}>Manage</Text>
                  <Feather name="arrow-right" size={16} />
                </TouchableOpacity>
              </View>

              {/* TRUST */}
              <View style={base.card}>
                <View style={base.rowBetween}>
                  <View>
                    <Text style={styles.smallTitle}>Trust & Verification</Text>
                    <Text style={base.title}>Earn the Blue Tick</Text>
                  </View>
                  <Feather name="check-circle" size={22} />
                </View>

                <Text style={base.description}>
                  Submit GST, shop photos, and social proof. Verification unlocks marketplace trust.
                </Text>

                <TouchableOpacity 
                  style={[styles.secondaryButton, !shopExists && styles.disabledButton]} 
                  onPress={() => shopExists && navigation.navigate('trustMeter')}
                  disabled={!shopExists}
                >
                  <Text style={[styles.secondaryButtonText, !shopExists && styles.disabledButtonText]}>
                    Open Trust Meter
                  </Text>
                  <Feather name="arrow-right" size={16} color={shopExists ? undefined : '#9ca3af'} />
                </TouchableOpacity>
              </View>

              {/* ACCOUNT */}
              <AccountCard
                email={resolveUserEmail(user)}
                shopData={shopData}
                onRequestPromotion={handleRequestPromotion}
                promotionLoading={promotionLoading}
              />
              <ProTipCard />
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default DashboardScreen;

/* ===================== STYLES ===================== */

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },

  container: {
    flex: 1,
  },

  content: {
    padding: 20,
  },

  influencerWelcomeCard: {
    backgroundColor: '#fff7ed',
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: '#f3d6c8',
    marginBottom: SPACING.md,
  },

  influencerWelcomeEyebrow: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginBottom: 10,
  },

  influencerWelcomeTitle: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 10,
  },

  influencerWelcomeSubtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.textSecondary,
  },

  smallTitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginBottom: 4,
  },

  /* BUTTONS */
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    marginBottom: 10,
    gap: 6,
  },

  secondaryButtonText: {
    fontSize: 14,
    color: COLORS.textPrimary,
  },

  primaryButton: {
    marginTop: 16,
    borderRadius: 30,
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  primaryButtonText: {
    fontSize: 15,
    fontWeight: "500",
  },

  /* STATS */
  statsContainer: {
    gap: 10,
    marginTop: 10,
  },

  statBox: {
    backgroundColor: "#f8f8f8",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  statTitle: {
    fontSize: 12,
    color: COLORS.textMuted,
  },

  statValue: {
    fontSize: 16,
    fontWeight: "600",
    marginVertical: 4,
  },

  statDesc: {
    fontSize: 12,
    color: COLORS.textMuted,
  },

  /* ACCOUNT */
  email: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: 4,
  },

  innerCard: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    padding: 16,
  },

  sectionTitle: {
    fontSize: 15,
    marginBottom: 12,
    color: COLORS.textSecondary,
  },

  url: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.textSecondary,
  },

  promotedRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    gap: 10,
  },

  promotedDesc: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textSecondary,
  },

  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },

  badgeText: {
    fontWeight: "600",
    fontSize: 13,
  },
  proTipText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: 6,
    lineHeight: 24,
  },

  accountEmail: {
    fontSize: 13,
    color: COLORS.textPrimary,
    marginTop: 4,
    fontWeight: '600',
  },

  influencerDraftText: {
    color: COLORS.textMuted,
    fontWeight: "600",
  },

  influencerNotPromoted: {
    marginTop: 10,
    fontSize: 12,
    color: COLORS.textMuted,
  },

  influencerPromoBtn: {
    marginTop: 10,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: '#fbbf24',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  promoBtnDisabled: {
    opacity: 0.6,
  },

  promotedPill: {
    marginTop: 10,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#f59e0b',
    backgroundColor: '#fff7ed',
    gap: 8,
  },

  promotedPillText: {
    color: '#d97706',
    fontWeight: '700',
    fontSize: 15,
  },

  influencerPromoBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },

  /* VERIFICATION BADGES */
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#dcfce7",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: "flex-start",
  },

  verifiedText: {
    color: "#1c7c54",
    fontWeight: "600",
  },

  pendingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#fef3c7",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: "flex-start",
  },

  pendingText: {
    color: "#dc2626",
    fontWeight: "600",
  },
  disabledButton: {
    opacity: 0.5,
    backgroundColor: '#e5e7eb',
  },
  disabledButtonText: {
    color: '#9ca3af',
  },
});