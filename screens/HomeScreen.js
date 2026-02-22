import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';

const HomeScreen = ({ navigation }) => {
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

        <TouchableOpacity style={styles.ctaSection}>
          <Text style={styles.ctaText}>Need custom stickers?</Text>
          <Text style={styles.ctaArrow}>→</Text>
        </TouchableOpacity>
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
  ctaText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginRight: 8,
  },
  ctaArrow: {
    fontSize: 20,
    color: '#000',
  },
});

export default HomeScreen;
