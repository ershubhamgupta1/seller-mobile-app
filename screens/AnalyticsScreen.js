import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';

const AnalyticsScreen = ({ navigation }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('Today');
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
        <View style={styles.titleSection}>
          <Text style={styles.title}>Analytics</Text>
          <TouchableOpacity style={styles.filterButton}>
            <Text style={styles.filterText}>Filter</Text>
            <Text style={styles.filterArrow}>▼</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.timePeriodSection}>
          <TouchableOpacity 
            style={styles.dropdownButton}
            onPress={() => setShowDropdown(!showDropdown)}
          >
            <Text style={styles.dropdownText}>{selectedPeriod}</Text>
            <Text style={styles.dropdownArrow}>{showDropdown ? '▲' : '▼'}</Text>
          </TouchableOpacity>
          
          {showDropdown && (
            <View style={styles.dropdownMenu}>
              {['Today', 'Week', 'Month', 'Year'].map((period) => (
                <TouchableOpacity
                  key={period}
                  style={styles.dropdownItem}
                  onPress={() => {
                    setSelectedPeriod(period);
                    setShowDropdown(false);
                  }}
                >
                  <Text style={styles.dropdownItemText}>{period}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View style={styles.summaryCards}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Total Revenue</Text>
            <Text style={styles.summaryValue}>₹ 1,02,480</Text>
            <Text style={styles.summaryChange}>+12.5%</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Total Orders</Text>
            <Text style={styles.summaryValue}>156</Text>
            <Text style={styles.summaryChange}>+8.2%</Text>
          </View>
        </View>

        <View style={styles.topMetricsSection}>
          <View style={styles.topMetricsGrid}>
            <View style={styles.topMetricCard}>
              <Text style={styles.topMetricIcon}>📤</Text>
              <Text style={styles.topMetricValue}>1,234</Text>
              <Text style={styles.topMetricLabel}>Total Shares</Text>
              <Text style={styles.topMetricChange}>+18%</Text>
            </View>
            <View style={styles.topMetricCard}>
              <Text style={styles.topMetricIcon}>👁️</Text>
              <Text style={styles.topMetricValue}>8,456</Text>
              <Text style={styles.topMetricLabel}>Total Views</Text>
              <Text style={styles.topMetricChange}>+24%</Text>
            </View>
            <View style={styles.topMetricCard}>
              <Text style={styles.topMetricIcon}>📝</Text>
              <Text style={styles.topMetricValue}>89</Text>
              <Text style={styles.topMetricLabel}>Total Posts</Text>
              <Text style={styles.topMetricChange}>+5%</Text>
            </View>
            <View style={styles.topMetricCard}>
              <Text style={styles.topMetricIcon}>🎯</Text>
              <Text style={styles.topMetricValue}>4.8%</Text>
              <Text style={styles.topMetricLabel}>Conv Rate</Text>
              <Text style={styles.topMetricChange}>+0.3%</Text>
            </View>
          </View>
        </View>

        <View style={styles.chartSection}>
          <Text style={styles.sectionTitle}>Sales Overview</Text>
          <View style={styles.chartPlaceholder}>
            <Text style={styles.chartText}>📊 Sales Chart</Text>
            <Text style={styles.chartSubtext}>Revenue trends over time</Text>
          </View>
        </View>

        <View style={styles.weeklyManagementSection}>
          <Text style={styles.sectionTitle}>Weekly Management</Text>
          
          <View style={styles.weeklyCard}>
            <View style={styles.weeklyHeader}>
              <Text style={styles.weeklyTitle}>This Week's Performance</Text>
              <Text style={styles.weeklyDate}>Feb 15 - Feb 21</Text>
            </View>
            <View style={styles.weeklyStats}>
              <View style={styles.weeklyStat}>
                <Text style={styles.weeklyStatValue}>₹ 45,230</Text>
                <Text style={styles.weeklyStatLabel}>Revenue</Text>
              </View>
              <View style={styles.weeklyStat}>
                <Text style={styles.weeklyStatValue}>68</Text>
                <Text style={styles.weeklyStatLabel}>Orders</Text>
              </View>
              <View style={styles.weeklyStat}>
                <Text style={styles.weeklyStatValue}>4.8%</Text>
                <Text style={styles.weeklyStatLabel}>Conversion</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.popularProductSection}>
          <Text style={styles.sectionTitle}>Most Popular Product</Text>
          
          <View style={styles.popularCard}>
            <View style={styles.popularHeader}>
              <View style={styles.productRank}>
                <Text style={styles.rankNumber}>#1</Text>
              </View>
              <View style={styles.popularInfo}>
                <Text style={styles.popularProductName}>Vintage Oversized Tee</Text>
                <Text style={styles.popularCategory}>Clothing & Apparel</Text>
              </View>
              <View style={styles.popularBadge}>
                <Text style={styles.badgeText}>HOT</Text>
              </View>
            </View>
            <View style={styles.popularStats}>
              <View style={styles.popularStat}>
                <Text style={styles.popularStatValue}>45</Text>
                <Text style={styles.popularStatLabel}>Units Sold</Text>
              </View>
              <View style={styles.popularStat}>
                <Text style={styles.popularStatValue}>₹ 37,125</Text>
                <Text style={styles.popularStatLabel}>Revenue</Text>
              </View>
              <View style={styles.popularStat}>
                <Text style={styles.popularStatValue}>4.9⭐</Text>
                <Text style={styles.popularStatLabel}>Rating</Text>
              </View>
            </View>
            <View style={styles.popularTrend}>
              <Text style={styles.trendIcon}>📈</Text>
              <Text style={styles.trendText}>+23% from last week</Text>
            </View>
          </View>
        </View>

        <View style={styles.topProductsSection}>
          <Text style={styles.sectionTitle}>Top Products</Text>
          
          <View style={styles.productItem}>
            <View style={styles.productInfo}>
              <Text style={styles.productName}>Vintage Oversized Tee</Text>
              <Text style={styles.productSales}>45 sold</Text>
            </View>
            <Text style={styles.productRevenue}>₹ 37,125</Text>
          </View>

          <View style={styles.productItem}>
            <View style={styles.productInfo}>
              <Text style={styles.productName}>Cargo Pants - Black</Text>
              <Text style={styles.productSales}>32 sold</Text>
            </View>
            <Text style={styles.productRevenue}>₹ 28,400</Text>
          </View>

          <View style={styles.productItem}>
            <View style={styles.productInfo}>
              <Text style={styles.productName}>Classic Denim Jacket</Text>
              <Text style={styles.productSales}>28 sold</Text>
            </View>
            <Text style={styles.productRevenue}>₹ 22,960</Text>
          </View>
        </View>

        <View style={styles.trafficSection}>
          <Text style={styles.sectionTitle}>Traffic Sources</Text>
          
          <View style={styles.trafficItem}>
            <View style={styles.trafficInfo}>
              <Text style={styles.trafficSource}>Instagram</Text>
              <Text style={styles.trafficPercentage}>45%</Text>
            </View>
            <View style={styles.trafficBar}>
              <View style={[styles.trafficFill, { width: '45%' }]} />
            </View>
          </View>

          <View style={styles.trafficItem}>
            <View style={styles.trafficInfo}>
              <Text style={styles.trafficSource}>QR Code</Text>
              <Text style={styles.trafficPercentage}>30%</Text>
            </View>
            <View style={styles.trafficBar}>
              <View style={[styles.trafficFill, { width: '30%' }]} />
            </View>
          </View>

          <View style={styles.trafficItem}>
            <View style={styles.trafficInfo}>
              <Text style={styles.trafficSource}>Direct</Text>
              <Text style={styles.trafficPercentage}>25%</Text>
            </View>
            <View style={styles.trafficBar}>
              <View style={[styles.trafficFill, { width: '25%' }]} />
            </View>
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
  titleSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
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
  timePeriodSection: {
    marginBottom: 20,
    position: 'relative',
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 8,
  },
  dropdownText: {
    fontSize: 14,
    color: '#000',
    fontWeight: '500',
  },
  dropdownArrow: {
    fontSize: 12,
    color: '#666',
  },
  dropdownMenu: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    marginTop: 4,
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#000',
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
  },
  summaryTitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  summaryChange: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '500',
  },
  topMetricsSection: {
    marginBottom: 30,
  },
  topMetricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  topMetricCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
  },
  topMetricIcon: {
    fontSize: 20,
    marginBottom: 8,
  },
  topMetricValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  topMetricLabel: {
    fontSize: 11,
    color: '#666',
    marginBottom: 4,
  },
  topMetricChange: {
    fontSize: 10,
    color: '#4CAF50',
    fontWeight: '500',
  },
  chartSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 15,
  },
  chartPlaceholder: {
    backgroundColor: '#f9f9f9',
    height: 200,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartText: {
    fontSize: 24,
    marginBottom: 8,
  },
  chartSubtext: {
    fontSize: 12,
    color: '#666',
  },
  weeklyManagementSection: {
    marginBottom: 30,
  },
  weeklyCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 20,
  },
  weeklyHeader: {
    marginBottom: 20,
  },
  weeklyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  weeklyDate: {
    fontSize: 12,
    color: '#666',
  },
  weeklyStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  weeklyStat: {
    alignItems: 'center',
    flex: 1,
  },
  weeklyStatValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  weeklyStatLabel: {
    fontSize: 11,
    color: '#666',
  },
  popularProductSection: {
    marginBottom: 30,
  },
  popularCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 20,
  },
  popularHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  productRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankNumber: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  popularInfo: {
    flex: 1,
  },
  popularProductName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  popularCategory: {
    fontSize: 12,
    color: '#666',
  },
  popularBadge: {
    backgroundColor: '#FF4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  popularStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  popularStat: {
    alignItems: 'center',
    flex: 1,
  },
  popularStatValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  popularStatLabel: {
    fontSize: 11,
    color: '#666',
  },
  popularTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f8f0',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  trendIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  trendText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '500',
  },
  topProductsSection: {
    marginBottom: 30,
  },
  productItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
    marginBottom: 2,
  },
  productSales: {
    fontSize: 12,
    color: '#666',
  },
  productRevenue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  trafficSection: {
    marginBottom: 30,
  },
  trafficItem: {
    marginBottom: 15,
  },
  trafficInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  trafficSource: {
    fontSize: 14,
    color: '#000',
  },
  trafficPercentage: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  trafficBar: {
    height: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 3,
  },
  trafficFill: {
    height: '100%',
    backgroundColor: '#000',
    borderRadius: 3,
  },
});

export default AnalyticsScreen;
