import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  RefreshControl,
} from 'react-native';
import { feed, orders } from '../services/api';
import Header from '../components/Header';
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from '../contexts/AuthContext';

const OrdersScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [ordersData, setOrdersData] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const { user } = useAuth();

  const statusOptions = [
    { key: 'all', label: 'All Orders' },
    { key: 'created', label: 'Created' },
    { key: 'processing', label: 'Processing' },
    { key: 'shipped', label: 'Shipped' },
    { key: 'delivered', label: 'Delivered' },
    { key: 'cancelled', label: 'Cancelled' },
  ];

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

  const headerCopy = isInfluencer
    ? {
        title: 'Collaborated order flow',
        description: 'Track brand status updates and your 15% collaboration cut.',
      }
    : {
        title: 'Manage customer orders',
        description: 'Update status, add tracking, and keep customers informed.',
      };

  useEffect(() => {
    fetchOrders();
  }, [selectedStatus]);

  const fetchOrders = async () => {
    try {
      if (!refreshing) setLoading(true);

      const response = await orders?.getOrders();
      let ordersDataRes = response?.orders || [];

      // Filter orders by selected status
      if (selectedStatus !== 'all') {
        ordersDataRes = ordersDataRes.filter(order => {
          const status = order.fulfillment?.status || order.order_status || 'CREATED';
          const normalizedStatus = status.toLowerCase();
          return normalizedStatus === selectedStatus;
        });
      }

      // fallback mock
      // if (ordersDataRes.length === 0) {
      //   ordersDataRes = [{
      //     id: 3,
      //     order_number: '3',
      //     customer: { email: 'smridh@tandev.us' },
      //     first_item: {
      //       image_url: "https://images.unsplash.com/photo-1610189020382-668a64c0c7a6",
      //       title: "Saree 2"
      //     },
      //     fulfillment: { status: "CREATED" },
      //     item_count: 1,
      //     total_qty: 2,
      //     shop_subtotal: 4198,
      //     updated_at: new Date().toISOString()
      //   }];
      // }

      setOrdersData(ordersDataRes);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  };

  const getDate = (ts) => ts ? new Date(ts).toISOString().split('T')[0] : '';

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text>Loading orders...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.container}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Header 
          title="Orders"
          onNotificationPress={() => {}}
          onProfilePress={() => navigation.navigate("userProfile")}
        />

        <View style={styles.content}>

          {/* WRAPPER */}
          <View style={styles.wrapper}>
            <Text style={styles.smallTitle}>Orders</Text>

            <Text style={styles.mainTitle}>
              {headerCopy.title}
            </Text>

            <Text style={styles.description}>
              {headerCopy.description}
            </Text>

            {/* STATUS FILTERS */}
            <View style={styles.filterContainer}>
              <Text style={styles.filterTitle}>Filter by Status</Text>
              <View style={styles.radioGroup}>
                {statusOptions.map((option) => (
                  <TouchableOpacity
                    key={option.key}
                    style={[
                      styles.radioButton,
                      selectedStatus === option.key && styles.radioButtonSelected
                    ]}
                    onPress={() => setSelectedStatus(option.key)}
                  >
                    <View style={styles.radioInner}>
                      <View style={[
                        styles.radioDot,
                        selectedStatus === option.key && styles.radioDotSelected
                      ]} />
                      <Text style={[
                        styles.radioLabel,
                        selectedStatus === option.key && styles.radioLabelSelected
                      ]}>
                        {option.label}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* INNER BOX */}
            <View style={styles.innerBox}>

              {ordersData.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text>No orders found</Text>
                </View>
              ) : (
                ordersData.map((item) => {
                  const status = item.fulfillment?.status || item.order_status || 'CREATED';
                  const metaParts = [
                    item.customer?.email,
                    `Items ${item.item_count || 1}`,
                    `Qty ${item.total_qty || 0}`,
                    getDate(item.updated_at || item.created_at),
                  ].filter(Boolean);

                  return (
                    <TouchableOpacity
                      key={item.id}
                      onPress={() =>
                        navigation.navigate('orderDetailsScreen', { orderId: item.id })
                      }
                    >
                      <View style={styles.orderCard}>

                        {isInfluencer ? (
                          <>
                            <View style={styles.orderTopRow}>
                              <Text style={styles.orderTitle}>
                                Order #{item.order_number || item.id}
                              </Text>
                              <View style={styles.statusPill}>
                                <Text style={styles.statusDot}>•</Text>
                                <Text style={styles.statusText}>
                                  {String(status || '').charAt(0) + String(status || '').slice(1).toLowerCase()}
                                </Text>
                              </View>
                            </View>

                            <Text style={styles.orderMetaLine} numberOfLines={2}>
                              {metaParts.join(' · ')}
                            </Text>

                            <View style={styles.orderBottomRow}>
                              <View style={styles.productRow}>
                                {item.first_item?.image_url ? (
                                  <Image
                                    source={{ uri: item.first_item?.image_url }}
                                    style={styles.productImage}
                                  />
                                ) : (
                                  <View style={styles.productImagePlaceholder} />
                                )}
                                <Text style={styles.productName} numberOfLines={2}>
                                  {item.first_item?.title || 'Item'}
                                </Text>
                              </View>

                              <View style={styles.priceContainer}>
                                <Text style={styles.priceValue}>₹ {item.influencer_cut_amount ?? 0}</Text>
                                <Text style={styles.priceLabel}>Your cut</Text>
                              </View>
                            </View>
                          </>
                        ) : (
                          <View style={styles.row}>
                            {/* LEFT */}
                            <View style={{ flex: 1 }}>
                              <Text style={styles.orderTitle}>
                                Order #{item.order_number || item.id}
                              </Text>

                              <Text style={styles.orderMeta}>
                                {item.customer?.email}
                              </Text>
                              <Text style={styles.orderMeta}>
                                · item {item.item_count || 1}
                              </Text>
                              <Text style={styles.orderMeta}>
                                · Qty {item.total_qty}
                              </Text>

                              <View style={styles.productRowBusiness}>
                                {item.first_item?.image_url ? (
                                  <Image
                                    source={{ uri: item.first_item?.image_url }}
                                    style={styles.productImage}
                                  />
                                ) : (
                                  <View style={styles.productImagePlaceholder} />
                                )}
                                <Text style={styles.productName} numberOfLines={2}>
                                  {item.first_item?.title || 'Item'}
                                </Text>
                              </View>
                            </View>

                            {/* RIGHT */}
                            <View style={styles.rightSection}>
                              <View style={styles.statusPill}>
                                <Text style={styles.statusDot}>•</Text>
                                <Text style={styles.statusText}>
                                  {String(status || '').charAt(0) + String(status || '').slice(1).toLowerCase()}
                                </Text>
                              </View>

                              <View style={styles.priceContainerBusiness}>
                                <Text style={styles.priceValue}>₹ {item.shop_subtotal ?? 0}</Text>
                                <Text style={styles.priceLabel}>Shop subtotal</Text>
                              </View>
                            </View>
                          </View>
                        )}

                      </View>
                    </TouchableOpacity>
                  );
                })
              )}

            </View>
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default OrdersScreen;

/* ===================== STYLES ===================== */

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f9fafb" },
  container: { flex: 1 },
  content: { padding: 16 },

  /* WRAPPER */
  wrapper: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },

  smallTitle: {
    fontSize: 14,
    color: "#6b7280",
  },

  mainTitle: {
    fontSize: 22,
    fontWeight: "700",
    marginTop: 4,
    color: "#111827",
  },

  description: {
    fontSize: 14,
    color: "#4b5563",
    marginVertical: 10,
  },

  innerBox: {
    // backgroundColor: "#f9fafb",
    // borderRadius: 16,
    // padding: 10,
  },

  /* ORDER CARD */
  orderCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },

  row: {
    flexDirection: "row",
  },

  rightSection: {
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginLeft: 10,
  },

  orderTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },

  orderTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },

  orderMeta: {
    fontSize: 13,
    color: "#6b7280",
    marginTop: 4,
  },

  orderMetaLine: {
    fontSize: 13,
    color: "#6b7280",
    marginTop: 8,
    lineHeight: 18,
  },

  orderBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 12,
  },

  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: "flex-end",
  },

  statusDot: {
    marginRight: 6,
  },

  statusText: {
    fontSize: 13,
    color: "#111827",
  },

  priceContainer: {
    alignItems: "flex-end",
  },

  priceContainerBusiness: {
    alignItems: "flex-end",
    marginTop: 20,
  },

  priceValue: {
    fontSize: 12,
    fontWeight: "700",
    color: "#111827",
  },

  priceLabel: {
    fontSize: 12,
    color: "#6b7280",
  },

  productRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  productRowBusiness: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
  },

  productImage: {
    width: 45,
    height: 45,
    borderRadius: 12,
    marginRight: 10,
  },

  productImagePlaceholder: {
    width: 45,
    height: 45,
    borderRadius: 12,
    marginRight: 10,
    backgroundColor: '#e5e7eb',
  },

  productName: {
    fontSize: 14,
    color: "#374151",
    flexShrink: 1,
  },

  /* STATES */
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  emptyContainer: {
    padding: 20,
    alignItems: "center",
  },

  /* Radio Button Styles */
  filterContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  radioGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  radioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    minWidth: 90,
  },
  radioButtonSelected: {
    backgroundColor: '#f59e0b',
    borderColor: '#f59e0b',
  },
  radioInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 8,
    backgroundColor: '#e2e8f0',
    marginRight: 8,
  },
  radioDotSelected: {
    backgroundColor: '#fff',
  },
  radioLabel: {
    fontSize: 10,
    color: '#64748b',
  },
  radioLabelSelected: {
    color: '#fff',
    fontWeight: '600',
  },
});