import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch } from 'react-native';

const OrdersScreen = ({ navigation }) => {
  const [autoDecrement, setAutoDecrement] = useState(true);
  const [lowStockNotification, setLowStockNotification] = useState(false);
  const [selectedTab, setSelectedTab] = useState('new');

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>E-KOM</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.iconButton}>
            <Text style={styles.icon}>🔔</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <Text style={styles.icon}>👤</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.ordersHeader}>
          <Text style={styles.ordersTitle}>Orders</Text>
          <TouchableOpacity style={styles.filterButton}>
            <Text style={styles.filterText}>Filter</Text>
            <Text style={styles.filterArrow}>▼</Text>
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
            <Text style={styles.summaryIcon}>▲</Text>
            <Text style={styles.summaryTitle}>STOCK ALERTS</Text>
            <Text style={styles.summaryValue}>2 items low</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryIcon}>📊</Text>
            <Text style={styles.summaryTitle}>TODAY'S SALES</Text>
            <Text style={styles.summaryValue}>12 orders</Text>
          </View>
        </View>

        <View style={styles.pendingSection}>
          <Text style={styles.sectionTitle}>PENDING ACTION</Text>
          
          <View style={styles.orderCard}>
            <View style={styles.orderHeader}>
              <Text style={styles.orderId}>#ORD-2025-882</Text>
              <View style={styles.newBadge}>
                <Text style={styles.newBadgeText}>NEW</Text>
              </View>
            </View>
            <Text style={styles.customerName}>Sarah Jenkins</Text>
            <View style={styles.productInfo}>
              <View style={styles.productImage}>
                <Text style={styles.productIcon}>👕</Text>
              </View>
              <View style={styles.productDetails}>
                <Text style={styles.productName}>Vintage Oversized Tee (M)</Text>
                <Text style={styles.stockInfo}>Stock: 14 left</Text>
                <Text style={styles.price}>₹2,400 +GST</Text>
              </View>
            </View>
            <View style={styles.orderActions}>
              <TouchableOpacity style={styles.actionButton}>
                <Text style={styles.actionButtonText}>Mark 'In-Progress'</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.chatButton}>
                <Text style={styles.chatIcon}>💬</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.orderCard}>
            <View style={styles.orderHeader}>
              <Text style={styles.orderId}>#ORD-2025-881</Text>
              <View style={styles.progressBadge}>
                <Text style={styles.progressBadgeText}>IN-PROGRESS</Text>
              </View>
            </View>
            <Text style={styles.customerName}>Marcus Chen</Text>
            <View style={styles.productInfo}>
              <View style={styles.productImage}>
                <Text style={styles.noImageText}>No Image</Text>
              </View>
              <View style={styles.productDetails}>
                <Text style={styles.productName}>Cargo Pants - Black (32)</Text>
                <Text style={styles.stockInfo}>Stock: 3 left</Text>
                <Text style={styles.price}>₹4,125 +GST</Text>
              </View>
            </View>
            <View style={styles.orderActions}>
              <TouchableOpacity style={[styles.actionButton, styles.completeButton]}>
                <Text style={[styles.actionButtonText, styles.completeButtonText]}>Complete Order</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.chatButton}>
                <Text style={styles.phoneIcon}>📞</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.stockNote}>Stock will decrement by 1 upon completion.</Text>
          </View>
        </View>

        <View style={styles.inventorySection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Inventory Logic</Text>
            <TouchableOpacity style={styles.refreshIcon}>
              <Text style={styles.icon}>🔄</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.toggleItem}>
            <Text style={styles.toggleLabel}>Auto-Decrement</Text>
            <Switch
              value={autoDecrement}
              onValueChange={setAutoDecrement}
            />
          </View>
          <View style={styles.toggleItem}>
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
    borderRadius: 6,
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
  pendingSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 15,
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
    color: '#000',
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
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  toggleLabel: {
    fontSize: 16,
    color: '#000',
  },
});

export default OrdersScreen;
