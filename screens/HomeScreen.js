import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, ActivityIndicator } from 'react-native';
import { shop } from '../services/api';
import Header from '../components/Header';

const HomeScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [qrCodeData, setQrCodeData] = useState(null);
  const [shopData, setShopData] = useState(null);

  useEffect(() => {
    fetchShopData();
  }, []);

  const fetchShopData = async () => {
    try {
      setLoading(true);
      const [shopResponse, qrResponse] = await Promise.all([
        shop.getMyShop(),
        shop.getQRCode()
      ]);
      setShopData(shopResponse);
      setQrCodeData(qrResponse);
    } catch (error) {
      console.error('Error fetching shop data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000" />
        <Text style={styles.loadingText}>Loading shop data...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Header 
        title={shopData?.name || 'E-KOM'}
        onNotificationPress={() => console.log('Notification pressed')}
        onProfilePress={() => navigation.navigate('Settings')}
      />

      <View style={styles.content}>
        <View style={styles.qrSection}>
          <Text style={styles.sectionTitle}>Your Shop QR</Text>
          <View style={styles.qrPlaceholder}>
            <View style={styles.qrCode}>
              <Text style={styles.qrText}>QR Code</Text>
            </View>
          </View>
          <View style={styles.qrButtons}>
            <TouchableOpacity style={styles.qrButton}>
              <Text style={styles.qrButtonText}>Download</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.qrButton}>
              <Text style={styles.qrButtonText}>Share</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.bioSection}>
          <Text style={styles.sectionTitle}>BIO-LINK FOR SOCIALS</Text>
          <View style={styles.bioLink}>
            <Text style={styles.bioUrl}>e-kom.io/yourshop</Text>
            <TouchableOpacity style={styles.copyButton}>
              <Text style={styles.copyText}>Copy</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.bioDescription}>
            Share this link on Instagram, Facebook, WhatsApp status etc. to drive traffic to your shop.
          </Text>
        </View>

        <View style={styles.howToSection}>
          <Text style={styles.sectionTitle}>HOW TO USE</Text>
          <View style={styles.stepItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Print & Engrave</Text>
              <Text style={styles.stepDescription}>Print QR code on packaging, receipts, or engrave on products</Text>
            </View>
          </View>
          <View style={styles.stepItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Social Traffic</Text>
              <Text style={styles.stepDescription}>Share bio-link on social media to drive traffic</Text>
            </View>
          </View>
        </View>
      </View>

        <View style={styles.stickerSection}>
          <View style={styles.stickerCard}>
            <View style={styles.stickerContent}>
              <Text style={styles.stickerIcon}>🏷️</Text>
              <View style={styles.stickerInfo}>
                <Text style={styles.stickerTitle}>Need custom stickers?</Text>
                <Text style={styles.stickerDescription}>
                  Order high-quality QR stickers for your shop front.
                </Text>
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
  partnerIcon: {
    fontSize: 16,
    marginLeft: 8,
  },
  performanceSection: {
    marginBottom: 30,
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
  qrSection: {
    marginBottom: 30,
  },
  qrCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  qrPlaceholder: {
    width: 200,
    height: 200,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
    marginBottom: 15,
  },
  qrText: {
    fontSize: 24,
    marginBottom: 8,
  },
  qrSubtext: {
    fontSize: 14,
    color: '#666',
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  downloadIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  downloadText: {
    color: '#fff',
    fontSize: 14,
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
  // New section styles
  bioSection: {
    marginBottom: 30,
  },
  bioCard: {
    backgroundColor: '#f9f9f9',
    padding: 20,
    borderRadius: 12,
  },
  linkItem: {
    marginBottom: 12,
  },
  linkLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  linkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
  },
  bioNote: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 8,
  },
  howToUseSection: {
    marginBottom: 30,
  },
  howToUseCard: {
    backgroundColor: '#f9f9f9',
    padding: 20,
    borderRadius: 12,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  stepNumberText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },
  stickerSection: {
    marginBottom: 30,
  },
  stickerCard: {
    backgroundColor: '#000',
    padding: 20,
    borderRadius: 12,
  },
  stickerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  stickerIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  stickerInfo: {
    flex: 1,
  },
  stickerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  stickerDescription: {
    fontSize: 12,
    color: '#ccc',
    lineHeight: 16,
  },
  orderButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  orderButtonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '600',
  },

    content: {
    paddingHorizontal: 20,
  },
  qrSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
    color: '#000',
  },
  qrPlaceholder: {
    width: 200,
    height: 200,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  qrCode: {
    width: 150,
    height: 150,
    backgroundColor: '#e0e0e0',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrText: {
    fontSize: 14,
    color: '#666',
  },
  qrButtons: {
    flexDirection: 'row',
    gap: 15,
  },
  qrButton: {
    backgroundColor: '#000',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  qrButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  bioSection: {
    marginBottom: 40,
  },
  bioLink: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginBottom: 10,
  },
  bioUrl: {
    flex: 1,
    fontSize: 14,
    color: '#000',
  },
  copyButton: {
    backgroundColor: '#000',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  copyText: {
    color: '#fff',
    fontSize: 12,
  },
  bioDescription: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },
  howToSection: {
    marginBottom: 40,
  },
  stepItem: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  stepNumberText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    color: '#000',
  },
  stepDescription: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  ctaSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
    paddingVertical: 20,
    borderRadius: 8,
    marginBottom: 20,
  },

});

export default HomeScreen;
