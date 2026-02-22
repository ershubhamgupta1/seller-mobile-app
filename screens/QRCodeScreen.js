import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch } from 'react-native';

const QRCodeScreen = ({ navigation }) => {
  const [autoApprovePayouts, setAutoApprovePayouts] = useState(true);
  const [teeEnabled, setTeeEnabled] = useState(true);
  const [pantsEnabled, setPantsEnabled] = useState(false);

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
        <View style={styles.influencerSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Influencer Store</Text>
            <TouchableOpacity style={styles.inviteButton}>
              <Text style={styles.inviteText}>+ Invite</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.statsCards}>
            <View style={styles.statCard}>
              <Text style={styles.statTitle}>TOTAL SALES</Text>
              <Text style={styles.statValue}>₹ 1,02,480</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statTitle}>ACTIVE PARTNERS</Text>
              <View style={styles.partnerInfo}>
                <Text style={styles.statValue}>8</Text>
                <Text style={styles.partnerIcon}>👤</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.performanceSection}>
          <Text style={styles.sectionTitle}>PARTNER PERFORMANCE</Text>
          
          <View style={styles.partnerCard}>
            <View style={styles.partnerInfo}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>A</Text>
              </View>
              <View style={styles.partnerDetails}>
                <Text style={styles.partnerName}>@alex_style</Text>
                <Text style={styles.partnerStats}>4 items stocked</Text>
              </View>
            </View>
            <View style={styles.partnerMetrics}>
              <Text style={styles.partnerRevenue}>₹37,125</Text>
              <Text style={styles.partnerSales}>12 sales</Text>
            </View>
          </View>

          <View style={styles.partnerCard}>
            <View style={styles.partnerInfo}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>M</Text>
              </View>
              <View style={styles.partnerDetails}>
                <Text style={styles.partnerName}>@mi_boutique</Text>
                <Text style={styles.partnerStats}>2 items stocked</Text>
              </View>
            </View>
            <View style={styles.partnerMetrics}>
              <Text style={styles.partnerRevenue}>₹17,325</Text>
              <Text style={styles.partnerSales}>5 sales</Text>
            </View>
          </View>
        </View>

        <View style={styles.accessSection}>
          <Text style={styles.sectionTitle}>MANAGE PRODUCT ACCESS</Text>
          
          <View style={styles.productCard}>
            <View style={styles.productHeader}>
              <Text style={styles.productName}>Vintage Oversized Tee</Text>
              <Text style={styles.commission}>Commission: 10%</Text>
            </View>
            <View style={styles.productControls}>
              <Switch
                value={teeEnabled}
                onValueChange={setTeeEnabled}
              />
              <View style={styles.linkInfo}>
                <Text style={styles.linkText}>Influencer Link: e-kom.io/s/alex/vint...</Text>
                <TouchableOpacity style={styles.copyButton}>
                  <Text style={styles.copyIcon}>📋</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={styles.productCard}>
            <View style={styles.productHeader}>
              <Text style={styles.productName}>Cargo Pants - Black</Text>
              <Text style={styles.commission}>Commission: 15%</Text>
            </View>
            <View style={styles.productControls}>
              <Switch
                value={pantsEnabled}
                onValueChange={setPantsEnabled}
              />
              <View style={styles.disabledInfo}>
                <Text style={styles.lockIcon}>🔒</Text>
                <Text style={styles.disabledText}>Sharing disabled for this item</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.payoutSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Payout Logic</Text>
            <TouchableOpacity style={styles.filterIcon}>
              <Text style={styles.icon}>⚙️</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.payoutItem}>
            <Text style={styles.payoutLabel}>Global Commission</Text>
            <Text style={styles.payoutValue}>10%</Text>
          </View>
          
          <View style={styles.payoutItem}>
            <Text style={styles.payoutLabel}>Auto-Approve Payouts</Text>
            <Switch
              value={autoApprovePayouts}
              onValueChange={setAutoApprovePayouts}
            />
          </View>
          
          <Text style={styles.payoutNote}>
            Sales are tracked via unique referral cookies valid for 30 days.
          </Text>
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
  influencerSection: {
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  inviteButton: {
    backgroundColor: '#000',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  inviteText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  statsCards: {
    flexDirection: 'row',
    gap: 15,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 8,
  },
  statTitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  partnerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  partnerIcon: {
    fontSize: 16,
    marginLeft: 8,
  },
  performanceSection: {
    marginBottom: 30,
  },
  partnerCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  partnerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  partnerDetails: {
    flex: 1,
  },
  partnerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  partnerStats: {
    fontSize: 12,
    color: '#666',
  },
  partnerMetrics: {
    alignItems: 'flex-end',
  },
  partnerRevenue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 2,
  },
  partnerSales: {
    fontSize: 12,
    color: '#666',
  },
  accessSection: {
    marginBottom: 30,
  },
  productCard: {
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    flex: 1,
  },
  commission: {
    fontSize: 12,
    color: '#666',
  },
  productControls: {
    alignItems: 'flex-start',
  },
  linkInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    flex: 1,
  },
  linkText: {
    flex: 1,
    fontSize: 12,
    color: '#666',
    marginRight: 8,
  },
  copyButton: {
    padding: 4,
  },
  copyIcon: {
    fontSize: 14,
  },
  disabledInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  lockIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  disabledText: {
    fontSize: 12,
    color: '#666',
  },
  payoutSection: {
    marginBottom: 30,
  },
  filterIcon: {
    padding: 4,
  },
  payoutItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  payoutLabel: {
    fontSize: 16,
    color: '#000',
  },
  payoutValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  payoutNote: {
    fontSize: 12,
    color: '#666',
    marginTop: 15,
    fontStyle: 'italic',
  },
});

export default QRCodeScreen;
