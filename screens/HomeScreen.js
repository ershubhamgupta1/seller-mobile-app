import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { shop } from '../services/api';
import Header from '../components/Header';

const HomeScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [shopData, setShopData] = useState(null);

  useEffect(() => {
    fetchShopData();
  }, []);

  const fetchShopData = async () => {
    try {
      setLoading(true);
      const shopResponse = await shop.getMyShop();
      setShopData(shopResponse);
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
});

export default HomeScreen;
