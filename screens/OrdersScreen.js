import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, ActivityIndicator } from 'react-native';
import { orders } from '../services/api';
import Header from '../components/Header';
import { FontAwesome } from '@expo/vector-icons';
import Octicons from '@expo/vector-icons/Octicons';

const OrdersScreen = ({ navigation }) => {
  const [autoDecrement, setAutoDecrement] = useState(true);
  const [lowStockNotification, setLowStockNotification] = useState(false);
  const [selectedTab, setSelectedTab] = useState('new');
  const [loading, setLoading] = useState(true);
  const [ordersData, setOrdersData] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      console.log('ordwer service---------', orders);
      const response = await orders?.getOrders();
      let orders = response?.orders || [];
      
      // Add mock data for testing if API returns empty
      if (orders.length === 0) {
        orders = [
          {
            id: 1,
            order_number: 'ORD-2025-882',
            customer_name: 'Sarah Jenkins',
            product_name: 'Vintage Oversized Tee',
            size: 'M',
            stock_left: 14,
            total_amount: '2400',
            status: 'CREATED',
            product_image: true
          },
          {
            id: 2,
            order_number: 'ORD-2025-881',
            customer_name: 'Marcus Chen',
            product_name: 'Cargo Pants - Black',
            size: '32',
            stock_left: 3,
            total_amount: '4125',
            status: 'PACKED',
            product_image: false
          }
        ];
      }
      
      setOrdersData(orders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      // Set mock data on error as well
      setOrdersData([
        {
          id: 1,
          order_number: 'ORD-2025-882',
          customer_name: 'Sarah Jenkins',
          product_name: 'Vintage Oversized Tee',
          size: 'M',
          stock_left: 14,
          total_amount: '2400',
          status: 'CREATED',
          product_image: true
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      await orders.updateFulfillment(orderId, { status });
      await fetchOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000" />
        <Text style={styles.loadingText}>Loading orders...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Header 
        title="Orders"
        onNotificationPress={() => console.log('Notification pressed')}
        onProfilePress={() => navigation.navigate('Settings')}
      />

      <View style={styles.content}>
        <View style={styles.ordersHeader}>
          <Text style={styles.ordersTitle}>Orders</Text>
          <TouchableOpacity style={styles.filterButton}>
            <FontAwesome name="filter" size={14} style={{paddingTop: 4, marginRight: 4}} color="black" />
            <Text style={styles.filterText}>Filter</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'new' && styles.activeTab]}
            onPress={() => setSelectedTab('new')}
          >
            <Text style={[styles.tabText, selectedTab === 'new' && styles.activeTabText]}>
              New (3)
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'active' && styles.activeTab]}
            onPress={() => setSelectedTab('active')}
          >
            <Text style={[styles.tabText, selectedTab === 'active' && styles.activeTabText]}>
              Active
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'history' && styles.activeTab]}
            onPress={() => setSelectedTab('history')}
          >
            <Text style={[styles.tabText, selectedTab === 'history' && styles.activeTabText]}>
              History
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.summaryCards}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>STOCK ALERTS</Text>
            <View style={styles.summaryStockAlertContainer}>
              <FontAwesome name="warning" size={14} style={{paddingTop: 4, marginRight: 4}} color="black" />
              <Text style={styles.summaryValue}>2 items low</Text>
            </View>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>TODAY'S SALES</Text>
            <View style={styles.summaryStockAlertContainer}>
              <Octicons name="graph" size={14} style={{paddingTop: 4, marginRight: 4}} color="black" />
              <Text style={styles.summaryValue}>{ordersData.length} orders</Text>
            </View>
          </View>
        </View>

        <View style={styles.pendingSection}>
          <Text style={{...styles.sectionTitle, paddingBottom: 10, fontSize: 10}}>PENDING ACTION</Text>
          
          {ordersData.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No orders found</Text>
            </View>
          ) : (
            ordersData.map((item) => (
              <View key={item.id} style={styles.orderCard}>
                <View style={styles.orderHeader}>
                  <Text style={styles.orderId}>#{item.order_number || `ORD-${item.id}`}</Text>
                  <View style={[
                    item.status === 'CREATED' ? styles.newBadge : 
                    item.status === 'PACKED' ? styles.progressBadge : 
                    styles.shippedBadge
                  ]}>
                    <Text style={[
                      item.status === 'CREATED' ? styles.newBadgeText : 
                      item.status === 'PACKED' ? styles.progressBadgeText : 
                      styles.shippedBadgeText
                    ]}>
                      {item.status || 'NEW'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.customerName}>{item.customer_name || 'Customer'}</Text>
                <View style={styles.productInfo}>
                  <View style={styles.productImage}>
                    {item.product_image ? (
                      <Text style={styles.productIcon}>👕</Text>
                    ) : (
                      <Text style={styles.noImageText}>No Image</Text>
                    )}
                  </View>
                  <View style={styles.productDetails}>
                    <Text style={styles.productName}>
                      {item.product_name || 'Product'} {item.size && `(${item.size})`}
                    </Text>
                    <Text style={styles.stockInfo}>
                      Stock: {item.stock_left || 'N/A'} left
                    </Text>
                    <Text style={styles.price}>
                      ₹{item.total_amount || '0'} +GST
                    </Text>
                  </View>
                </View>
                <View style={styles.orderActions}>
                  {item.status === 'CREATED' && (
                    <TouchableOpacity 
                      style={styles.actionButton}
                      onPress={() => updateOrderStatus(item.id, 'PACKED')}
                    >
                      <Text style={styles.actionButtonText}>Mark 'In-Progress'</Text>
                    </TouchableOpacity>
                  )}
                  {item.status === 'PACKED' && (
                    <TouchableOpacity 
                      style={[styles.actionButton, styles.completeButton]}
                      onPress={() => updateOrderStatus(item.id, 'SHIPPED')}
                    >
                      <Text style={[styles.actionButtonText, styles.completeButtonText]}>Complete Order</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity style={styles.chatButton}>
                    <Text style={item.status === 'PACKED' ? styles.phoneIcon : styles.chatIcon}>
                      {item.status === 'PACKED' ? 
                        <FontAwesome name="phone" size={16} color="666" /> : 
                        <FontAwesome name="whatsapp" size={16} color="666" />
                      }
                    </Text>
                  </TouchableOpacity>
                </View>
                {item.status === 'PACKED' && (
                  <Text style={styles.stockNote}>Stock will decrement by 1 upon completion.</Text>
                )}
              </View>
            ))
          )}
        </View>

        <View style={styles.inventorySection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Inventory Logic</Text>
            <TouchableOpacity style={styles.refreshIcon}>
              <FontAwesome name="refresh" size={16} color="#666" />
            </TouchableOpacity>
          </View>
          <View style={styles.toggleItem}>
            <Text style={styles.toggleLabel}>Auto-Decrement</Text>
            <Switch
              value={autoDecrement}
              onValueChange={setAutoDecrement}
            />
          </View>
          <View style={{...styles.toggleItem, borderBottomWidth:0}}>
            <Text style={styles.toggleLabel}>Low Stock Notification</Text>
            <Switch
              value={lowStockNotification}
              onValueChange={setLowStockNotification}
            />
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  logo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  headerIcons: {
    flexDirection: 'row',
  },
  iconButton: {
    marginLeft: 15,
  },
  icon: {
    fontSize: 20,
  },
  content: {
    paddingHorizontal: 20,
  },
  ordersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  ordersTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#f5f5f5',
  },
  filterText: {
    fontSize: 14,
    color: '#000',
    marginRight: 4,
  },
  filterArrow: {
    fontSize: 12,
    color: '#000',
  },
  tabsContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#000',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#000',
    fontWeight: '600',
  },
  summaryCards: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 30,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  summaryIcon: {
    fontSize: 16,
    marginBottom: 8,
  },
  summaryTitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  summaryStockAlertContainer: {
    flexDirection: 'row'
  },

  pendingSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '400',
    color: '#666',
    // marginBottom: 15,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  orderId: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  newBadge: {
    backgroundColor: '#000',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  newBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  progressBadge: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  progressBadgeText: {
    color: '#000',
    fontSize: 11,
    fontWeight: '600',
  },
  customerName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    marginBottom: 10,
  },
  productInfo: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  productImage: {
    width: 60,
    height: 60,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  productIcon: {
    fontSize: 24,
  },
  noImageText: {
    fontSize: 10,
    color: '#999',
  },
  productDetails: {
    flex: 1,
  },
  productName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
    marginBottom: 4,
  },
  stockInfo: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  price: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  orderActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#000',
    paddingVertical: 10,
    borderRadius: 6,
    marginRight: 10,
  },
  completeButton: {
    backgroundColor: '#f0f0f0',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  completeButtonText: {
    color: '#000',
  },
  chatButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatIcon: {
    fontSize: 18,
  },
  phoneIcon: {
    fontSize: 18,
  },
  stockNote: {
    fontSize: 11,
    color: '#666',
    marginTop: 8,
    fontStyle: 'italic',
  },
  inventorySection: {
    marginBottom: 30,
    backgroundColor:'#f5f5f5',
    padding: 15,
    borderRadius: 8,

  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  refreshIcon: {
    padding: 4,
  },
  toggleItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    // paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  toggleLabel: {
    fontSize: 12,
    color: '#666',
  },
  shippedBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  shippedBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
});

export default OrdersScreen;
