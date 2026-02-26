import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Switch, Alert } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';

const SettingsScreen = ({ navigation }) => {
  const { logout } = useAuth();
  const [autoDecrement, setAutoDecrement] = useState(true);
  const [lowStockNotification, setLowStockNotification] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: logout,
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <Header
        title="Settings"
        onNotificationPress={() => console.log('Notification pressed')}
        onProfilePress={() => navigation.navigate('Settings')}
      />
      <View style={styles.content}>
        <View style={styles.trustMeterSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Trust Meter</Text>
            <Text style={styles.sectionSubtitle}>Get verified to unlock 'Blue Tick'</Text>
          </View>
          <View style={styles.statusTag}>
            <Text style={styles.statusText}>STATUS: PENDING</Text>
          </View>
        </View>
          <View style={styles.trustCard}>
            <Text style={styles.trustScore}>65% Trust Score</Text>
            <Text style={styles.trustDescription}>Complete 2 more steps to reach 100% and get your badge.</Text>
          </View>

        <View style={styles.gstSection}>
          <Text style={styles.sectionTitle}>GST Number</Text>
          <View style={styles.inputContainer}>
            <Text style={styles.checkIcon}>✓</Text>
            <TextInput
              style={styles.input}
              value="22AAAAA0000A1Z5"
              editable={false}
            />
          </View>
        </View>

        <View style={styles.photoSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Physical Shop Photo</Text>
            <View style={styles.actionTag}>
              <Text style={styles.actionText}>Action Required</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.uploadBox}>
            <Text style={styles.cameraIcon}>📷</Text>
            <Text style={styles.uploadText}>Upload storefront with signage</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.socialSection}>
          <Text style={styles.sectionTitle}>Social Media Verification</Text>
          <TextInput
            style={styles.input}
            placeholder="Instagram Profile Link"
            placeholderTextColor="#999"
          />
          <Text style={styles.note}>Must have {'>'}10k followers for automatic verification.</Text>
        </View>

        <TouchableOpacity style={styles.submitButton}>
          <Text style={styles.submitIcon}>✈️</Text>
          <Text style={styles.submitText}>Submit for Review</Text>
        </TouchableOpacity>
        <Text style={styles.reviewNote}>Review typically takes 24-48 hours</Text>


        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutIcon}>🚪</Text>
          <Text style={styles.logoutText}>Logout</Text>
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
  trustMeterSection: {
    marginBottom: 15,
    flexDirection:'row'
  },
  sectionHeader: {
    flex: 1
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#666',
  },
  statusTag: {
    alignSelf: 'flex-start',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    marginBottom: 15,
    flex:1
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  trustCard: {
    backgroundColor: '#333',
    padding: 20,
    borderRadius: 10,
    marginBottom: 15,
    flex:1
  },
  trustScore: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  trustDescription: {
    fontSize: 14,
    color: '#ccc',
    lineHeight: 18,
  },
  gstSection: {
    marginBottom: 30,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  checkIcon: {
    fontSize: 18,
    color: '#4CAF50',
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  photoSection: {
    marginBottom: 30,
  },
  actionTag: {
    backgroundColor: '#FF9800',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  actionText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
  uploadBox: {
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 30,
    alignItems: 'center',
    backgroundColor: '#fafafa',
  },
  cameraIcon: {
    fontSize: 32,
    marginBottom: 10,
  },
  uploadText: {
    fontSize: 14,
    color: '#666',
  },
  socialSection: {
    marginBottom: 30,
  },
  note: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
    paddingVertical: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  submitIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  submitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  reviewNote: {
    textAlign: 'center',
    fontSize: 12,
    color: '#666',
    marginBottom: 30,
  },
  inventorySection: {
    marginBottom: 30,
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
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#dc3545',
    paddingVertical: 15,
    borderRadius: 8,
    marginTop: 20,
    marginBottom: 30,
  },
  logoutIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SettingsScreen;
