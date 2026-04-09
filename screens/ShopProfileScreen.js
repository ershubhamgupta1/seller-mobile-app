import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image, Alert, TextInput, RefreshControl, Linking, useWindowDimensions } from 'react-native';
import { FontAwesome5, FontAwesome } from '@expo/vector-icons';
import Header from '../components/Header';
import { shop, payouts, uploads, verification, API_BASE } from '../services/api';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import * as Clipboard from 'expo-clipboard';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { SvgXml } from 'react-native-svg';
import { SafeAreaView } from "react-native-safe-area-context";
import ViewShot from "react-native-view-shot";
import { useAuth } from '../contexts/AuthContext';

const getMimeTypeFromUri = (value = '') => {
  const sanitizedValue = value.split('?')[0];
  const ext = (sanitizedValue.split('.').pop() || 'jpg').toLowerCase();

  if (['png'].includes(ext)) return 'image/png';
  if (['webp'].includes(ext)) return 'image/webp';
  if (['heic', 'heif'].includes(ext)) return 'image/heic';

  return 'image/jpeg';
};

const ensureTrailingImageInput = (values = []) => {
  const nonEmptyValues = (values || []).filter((value) => (value || '').trim() !== '');
  return nonEmptyValues.length > 0 ? [...nonEmptyValues, ''] : [''];
};

const getAbsoluteImageUrl = (value) => {
  if (!value) return '';
  if (/^https?:\/\//i.test(value) || /^(file|content):\/\//i.test(value) || /^data:/i.test(value)) return value;
  return `${API_BASE}${value.startsWith('/') ? value : `/${value}`}`;
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

const ShopProfileScreen = ({ navigation }) => {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const { logout, user } = useAuth();
  const accountType = resolveAccountType(user);
  const isInfluencer = accountType === 'influencer';
  const headerTitle = isInfluencer ? 'Influencer profile' : 'Shop Profile';
  const [loading, setLoading] = useState(true);
  const [shopData, setShopData] = useState(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  // const [isEditingProfile, setisEditingProfile] = useState(false);
  const [payoutData, setPayoutData] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [qrImageUrl, setQrImageUrl] = useState(null);
  const [uploadingShopPhotos, setUploadingShopPhotos] = useState(false);
  const viewShotRef = useRef(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    whatsapp: '',
    address: '',
    city: '',
    category: '',
    description: '',
    logo: null,
    instagram_handle: '',
    pinterest_handle: '',
    youtube_handle: '',
    facebook_handle: '',
    founded_year: '',
    claimed_lifetime_sales: '',
    tagline: '',
    known_for: '',
    story: '',
    storefrontStory: '',
    wearing_size: '',
    shoe_size: '',
    height_cm: '',
    weight_kg: '',
    bust_cm: '',
    waist_cm: '',
    hip_cm: '',
    payout_ifsc_code: '',
    payout_account_number: '',
    payout_upi_id: '',
    ships_internationally: false,
    shop_photo_urls: [''],
    accountHolderName: '',
    payoutFrequency: 'Weekly',
    minPayoutAmount: ''
  });

  useEffect(() => {
    fetchShopData();
    fetchPayoutData();
  }, []);

  const fetchPayoutData = async () => {
    try {
      const response = await payouts.getPayouts();
      
      // Mock data for testing if API returns empty
      let payoutList = response?.payouts || [];
      if (payoutList.length === 0) {
        // payoutList = [
        //   {
        //     id: 1,
        //     amount: 2500.00,
        //     status: 'COMPLETED',
        //     payout_date: '2026-02-25T10:30:00Z',
        //     transaction_id: 'TXN123456789',
        //     bank_account: '****1234',
        //     payment_method: 'Bank Transfer',
        //     processing_fee: 25.00,
        //     net_amount: 2475.00,
        //     remarks: 'Monthly payout February 2026'
        //   },
        //   {
        //     id: 2,
        //     amount: 1800.00,
        //     status: 'PROCESSING',
        //     payout_date: '2026-02-28T14:15:00Z',
        //     transaction_id: 'TXN123456790',
        //     bank_account: '****1234',
        //     payment_method: 'Bank Transfer',
        //     processing_fee: 18.00,
        //     net_amount: 1782.00,
        //     remarks: 'Monthly payout February 2026 - Processing'
        //   },
        //   {
        //     id: 3,
        //     amount: 3200.00,
        //     status: 'FAILED',
        //     payout_date: '2026-02-20T09:45:00Z',
        //     transaction_id: 'TXN123456791',
        //     bank_account: '****1234',
        //     payment_method: 'Bank Transfer',
        //     processing_fee: 32.00,
        //     net_amount: 3168.00,
        //     remarks: 'Bank account verification failed'
        //   }
        // ];
      }
      setPayoutData(payoutList);
    } catch (error) {
      console.error('Error fetching payout data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchShopData();
    await fetchPayoutData();
    setRefreshing(false);
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

  const fetchShopData = async () => {
    try {
      setLoading(true);
      const response = await shop.getMyShop();
      let qrCode = await shop.getQRCode();
      let verificationResponse = null;

      try {
        verificationResponse = await verification.getVerificationStatus();
      } catch (verificationError) {
        console.error('Error fetching verification data:', verificationError);
      }

      qrCode = qrCode?.replace(/svg:/g, "")
      .replace(/xmlns:svg="[^"]*"/g, "");

      setQrImageUrl(qrCode)
      // Extract shop data from nested response
      const shopResponse = response?.shop || {};
      const verificationShopPhotoUrls = Array.isArray(verificationResponse?.submission?.shop_photo_urls)
        ? verificationResponse.submission.shop_photo_urls.filter(Boolean)
        : [];
      const hydratedShopData = {
        ...shopResponse,
        shop_photo_urls: verificationShopPhotoUrls.length > 0
          ? verificationShopPhotoUrls
          : Array.isArray(shopResponse?.shop_photo_urls)
            ? shopResponse.shop_photo_urls.filter(Boolean)
            : [],
      };

      setShopData(hydratedShopData);
      setFormData({
        name: shopResponse?.name || '',
        email: shopResponse?.email || '',
        phone: shopResponse?.phone || '',
        whatsapp: shopResponse?.whatsapp || '',
        address: shopResponse?.address || '',
        city: shopResponse?.city || '',
        category: shopResponse?.category || '',
        description: shopResponse?.description || '',
        facebook_handle: shopResponse?.facebook_handle || '',
        instagram_handle: shopResponse?.instagram_handle || '',
        pinterest_handle: shopResponse?.pinterest_handle || '',
        youtube_handle: shopResponse?.youtube_handle || '',

        founded_year: shopResponse?.founded_year ? shopResponse.founded_year.toString() : '',
        claimed_lifetime_sales: shopResponse?.claimed_lifetime_sales ? shopResponse.claimed_lifetime_sales.toString() : '',
        tagline: shopResponse?.tagline || '',
        known_for: shopResponse?.known_for || '',
        story: shopResponse?.story || '',
        storefrontStory: shopResponse?.storefront_story || '',
        wearing_size: shopResponse?.wearing_size ? String(shopResponse.wearing_size) : '',
        shoe_size: shopResponse?.shoe_size ? String(shopResponse.shoe_size) : '',
        height_cm: shopResponse?.height_cm ? String(shopResponse.height_cm) : '',
        weight_kg: shopResponse?.weight_kg ? String(shopResponse.weight_kg) : '',
        bust_cm: shopResponse?.bust_cm ? String(shopResponse.bust_cm) : '',
        waist_cm: shopResponse?.waist_cm ? String(shopResponse.waist_cm) : '',
        hip_cm: shopResponse?.hip_cm ? String(shopResponse.hip_cm) : '',
        payout_ifsc_code: shopResponse?.payout_ifsc_code || '',
        payout_account_number: shopResponse?.payout_account_number || '',
        payout_upi_id: shopResponse?.payout_upi_id || '',
        ships_internationally: Boolean(shopResponse?.ships_internationally),
        shop_photo_urls: ensureTrailingImageInput(hydratedShopData.shop_photo_urls),
      });
      
    } catch (error) {
      console.error('Error fetching shop data:', error);
      Alert.alert('Error', 'Failed to load shop data');
    } finally {
      setLoading(false);
    }
  };

  const handleImagePick = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        setFormData({ ...formData, logo: result.assets[0].uri });
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const updateShopPhotoUrl = (index, value) => {
    setFormData((prev) => {
      const next = [...(prev.shop_photo_urls || [''])];
      next[index] = value;

      return {
        ...prev,
        shop_photo_urls: next,
      };
    });
  };

  const addShopPhotoUrl = () => {
    setFormData((prev) => ({
      ...prev,
      shop_photo_urls: [...(prev.shop_photo_urls || ['']), ''],
    }));
  };

  const removeShopPhotoUrl = (index) => {
    setFormData((prev) => {
      const next = (prev.shop_photo_urls || []).filter((_, currentIndex) => currentIndex !== index);

      return {
        ...prev,
        shop_photo_urls: next.length > 0 ? ensureTrailingImageInput(next) : [''],
      };
    });
  };

  const uploadShopPhotoFromUri = async (uri, fileName) => {
    const resolvedFileName = fileName || uri.split('/').pop()?.split('?')[0] || `shop-photo-${Date.now()}.jpg`;
    const fileAsset = {
      uri,
      name: resolvedFileName,
      type: getMimeTypeFromUri(resolvedFileName),
    };

    const response = await uploads.uploadShopPhoto(fileAsset);
    const publicUrl = response?.url ? response.url : null;

    if (!publicUrl) {
      throw new Error('Upload succeeded but no image URL was returned');
    }

    return getAbsoluteImageUrl(publicUrl);
  };

  const pickAndUploadShopPhotos = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permission.status !== 'granted') {
        Alert.alert('Permission required', 'Gallery permission is required to pick images');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
      });

      if (result.canceled) {
        return;
      }

      setUploadingShopPhotos(true);

      const assets = result.assets || [];
      const uploadedUrls = [];

      for (const asset of assets) {
        const uri = asset.uri;

        if (!uri) {
          continue;
        }

        const uploadedUrl = await uploadShopPhotoFromUri(
          uri,
          asset.fileName || uri.split('/').pop() || `shop-photo-${Date.now()}.jpg`
        );
        uploadedUrls.push(uploadedUrl);
      }

      if (uploadedUrls.length === 0) {
        Alert.alert('Error', 'No images were uploaded');
        return;
      }

      setFormData((prev) => {
        const existing = (prev.shop_photo_urls || []).filter((value) => (value || '').trim() !== '');

        return {
          ...prev,
          shop_photo_urls: [...existing, ...uploadedUrls, ''],
        };
      });
    } catch (error) {
      console.error('Error picking/uploading shop photos:', error);
      Alert.alert('Error', 'Failed to upload shop photos');
    } finally {
      setUploadingShopPhotos(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setLoading(true);
      const cleanedShopPhotoUrls = (formData.shop_photo_urls || [])
        .map((value) => (value || '').trim())
        .filter(Boolean);
      // API call to update shop profile data only
      const profileData = isInfluencer
        ? {
            name: formData.name,
            category: formData.category,
            phone: formData.phone,
            whatsapp: formData.whatsapp,
            address: formData.address,
            city: formData.city,
            instagram_handle: formData.instagram_handle,
            facebook_handle: formData.facebook_handle,
            pinterest_handle: formData.pinterest_handle,
            youtube_handle: formData.youtube_handle,
            tagline: formData.tagline,
            known_for: formData.known_for,
            story: formData.story,
            // storefront_story: formData.storefrontStory,
            influencer_wearing_size: formData.wearing_size,
            influencer_shoe_size: formData.shoe_size,
            influencer_height_cm: formData.height_cm ? Number(formData.height_cm) : null,
            influencer_weight_kg: formData.weight_kg ? Number(formData.weight_kg) : null,
            influencer_bust_cm: formData.bust_cm ? Number(formData.bust_cm) : null,
            influencer_waist_cm: formData.waist_cm ? Number(formData.waist_cm) : null,
            influencer_hip_cm: formData.hip_cm ? Number(formData.hip_cm) : null,
          }
        : {
            name: formData.name,
            category: formData.category,
            phone: formData.phone,
            whatsapp: formData.whatsapp,
            address: formData.address,
            city: formData.city,
            payout_ifsc_code: formData.payout_ifsc_code,
            payout_account_number: formData.payout_account_number,
            payout_upi_id: formData.payout_upi_id,
            instagram_handle: formData.instagram_handle,
            facebook_handle: formData.facebook_handle,
            pinterest_handle: formData.pinterest_handle,
            youtube_handle: formData.youtube_handle,
            founded_year: formData.founded_year,
            claimed_lifetime_sales: Number(formData.claimed_lifetime_sales),
            tagline: formData.tagline,
            known_for: formData.known_for,
            story: formData.story,
            ships_internationally: !!formData.ships_internationally,
            // shop_photo_urls: cleanedShopPhotoUrls
          };
      
      await shop.createOrUpdateShop(profileData);
      
      setShopData({ ...shopData, ...profileData });
      setFormData((prev) => ({
        ...prev,
        shop_photo_urls: ensureTrailingImageInput(cleanedShopPhotoUrls),
      }));
      setIsEditingProfile(false);
      Alert.alert('Success', 'Shop profile updated successfully');
    } catch (error) {
      console.error('Error updating shop profile:', error);
      Alert.alert('Error', 'Failed to update shop profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePayout = async () => {
    try {
      setLoading(true);
      // API call to update payout data only
      const payoutData = {
        payout_ifsc_code: formData.payout_ifsc_code,
        payout_account_number: formData.payout_account_number,
        payout_upi_id: formData.payout_upi_id
      };
      await shop.createOrUpdateShop(payoutData);
      setShopData({ ...shopData, ...payoutData });
      setisEditingProfile(false);
      Alert.alert('Success', 'Payout settings updated successfully');
    } catch (error) {
      console.error('Error updating payout settings:', error);
      Alert.alert('Error', 'Failed to update payout settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      // API call to update shop data
      await shop.createOrUpdateShop(formData);
      setShopData({ ...shopData, ...formData });
      setIsEditing(false);
      Alert.alert('Success', 'Shop profile updated successfully');
    } catch (error) {
      console.error('Error updating shop:', error);
      Alert.alert('Error', 'Failed to update shop profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: shopData?.name || '',
      email: shopData?.email || '',
      phone: shopData?.phone || '',
      whatsapp: shopData?.whatsapp || '',
      address: shopData?.address || '',
      city: shopData?.city || '',
      category: shopData?.category || '',
      description: shopData?.description || '',
      logo: shopData?.logo || null,
      instagram_handle: shopData?.instagram_handle || '',
      pinterest_handle: shopData?.pinterest_handle || '',
      youtube_handle: shopData?.youtube_handle || '',
      founded_year: shopData?.founded_year ? shopData.founded_year.toString() : '',
      claimed_lifetime_sales: shopData?.claimed_lifetime_sales ? shopData.claimed_lifetime_sales.toString() : '',
      tagline: shopData?.tagline || '',
      known_for: shopData?.known_for || '',
      story: shopData?.story || '',
      // storefrontStory: shopData?.storefront_story || '',
      wearing_size: shopData?.wearing_size ? String(shopData.wearing_size) : '',
      shoe_size: shopData?.shoe_size ? String(shopData.shoe_size) : '',
      height_cm: shopData?.height_cm ? String(shopData.height_cm) : '',
      weight_kg: shopData?.weight_kg ? String(shopData.weight_kg) : '',
      bust_cm: shopData?.bust_cm ? String(shopData.bust_cm) : '',
      waist_cm: shopData?.waist_cm ? String(shopData.waist_cm) : '',
      hip_cm: shopData?.hip_cm ? String(shopData.hip_cm) : '',
      payout_ifsc_code: shopData?.payout_ifsc_code || '',
      payout_account_number: shopData?.payout_account_number || '',
      payout_ifsc_code: shopData?.ifsc_code || '',
      payout_upi_id: shopData?.payout_upi_id || '',
      ships_internationally: Boolean(shopData?.ships_internationally),
      shop_photo_urls: ensureTrailingImageInput(
        Array.isArray(shopData?.shop_photo_urls)
          ? shopData.shop_photo_urls.filter(Boolean)
          : []
      ),
      accountHolderName: shopData?.account_holder_name || '',
      payoutFrequency: shopData?.payout_frequency || 'Weekly',
      minPayoutAmount: shopData?.min_payout_amount || ''
    });
    setIsEditingProfile(false);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'COMPLETED':
        return '#4CAF50';
      case 'PROCESSING':
        return '#FF9800';
      case 'FAILED':
        return '#F44336';
      case 'PENDING':
        return '#2196F3';
      default:
        return '#666';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'COMPLETED':
        return 'check-circle';
      case 'PROCESSING':
        return 'clock';
      case 'FAILED':
        return 'times-circle';
      case 'PENDING':
        return 'hourglass-half';
      default:
        return 'question-circle';
    }
  };

  const renderPayoutItem = (item) => (
    <View key={item.id} style={styles.payoutCard}>
      <View style={styles.payoutHeader}>
        <View style={styles.payoutAmount}>
          <Text style={styles.amountText}>₹{item.amount?.toFixed(2) || '0.00'}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <FontAwesome5 
              name={getStatusIcon(item.status)} 
              size={12} 
              color="#fff" 
              style={styles.statusIcon} 
            />
            <Text style={styles.statusText}>{item.status || 'PENDING'}</Text>
          </View>
        </View>
        <Text style={styles.dateText}>{formatDate(item.created_at)}</Text>
      </View>

      <View style={styles.payoutDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Transaction ID:</Text>
          <Text style={styles.detailValue}>{item.transaction_ref || 'N/A'}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Payment Method:</Text>
          <Text style={styles.detailValue}>{item.payment_method || 'Bank Transfer'}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Bank Account:</Text>
          <Text style={styles.detailValue}>{item.bank_account || 'N/A'}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Processing Fee:</Text>
          <Text style={styles.detailValue}>₹{item.processing_fee?.toFixed(2) || '0.00'}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Net Amount:</Text>
          <Text style={[styles.detailValue, styles.netAmount]}>₹{item.net_amount?.toFixed(2) || '0.00'}</Text>
        </View>
        {item.remarks && (
          <View style={styles.remarksRow}>
            <Text style={styles.remarksLabel}>Remarks:</Text>
            <Text style={styles.remarksText}>{item.remarks}</Text>
          </View>
        )}
      </View>

      {item.status === 'FAILED' && (
        <View style={styles.failedAlert}>
          <FontAwesome name="exclamation-triangle" size={16} color="#F44336" />
          <Text style={styles.failedText}>Payment failed. Please check your bank details.</Text>
        </View>
      )}
    </View>
  );

  const downloadQR = async () => {
    try {
      const uri = await viewShotRef.current.capture();

      const { status } = await MediaLibrary.requestPermissionsAsync();

      if (status !== "granted") {
        Alert.alert("Permission required", "Please allow gallery access");
        return;
      }

      const asset = await MediaLibrary.createAssetAsync(uri);
      await MediaLibrary.createAlbumAsync("Download", asset, false);

      Alert.alert("Success", "QR Code saved to gallery");
    } catch (error) {
      console.log(error);
      Alert.alert("Error", "Download failed");
    }
  };
  const shareQR = async () => {
    try {
      const uri = await viewShotRef.current.capture();

      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert("Sharing not available on this device");
        return;
      }

      await Sharing.shareAsync(uri);
    } catch (error) {
      console.log(error);
      Alert.alert("Error", "Failed to share QR code");
    }
  };
  if (loading && !shopData) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000" />
        <Text style={styles.loadingText}>Loading shop profile...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView 
        style={styles.container}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Header 
          title={headerTitle}
          onNotificationPress={() => console.log('Notification pressed')}
          onProfilePress={() => navigation.navigate('userProfile')}
        />
        <View style={[styles.content, isTablet && styles.contentTablet]}>
          <View style={[styles.pageContent, isTablet && styles.pageContentTablet]}>
          {/* Shop Logo Section */}
          {/* <View style={styles.logoSection}>
            <View style={styles.logoContainer}>
              {formData.logo ? (
                <Image source={{ uri: formData.logo }} style={styles.logoImage} />
              ) : (
                <View style={styles.logoPlaceholder}>
                  <FontAwesome5 name="store" size={40} color="#ccc" />
                </View>
              )}
              {isEditingProfile && (
                <TouchableOpacity style={styles.cameraButton} onPress={handleImagePick}>
                  <FontAwesome name="camera" size={16} color="#fff" />
                </TouchableOpacity>
              )}
            </View>
            <Text style={styles.shopName}>{formData.name || 'Shop Name'}</Text>
          </View> */}

          {/* Profile Information */}
          <View style={[styles.profileSection, styles.sectionCard]}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <Text>Unified shop identity</Text>
                {/* <Text style={styles.sectionTitle}>{isInfluencer ? 'Influencer profile' : 'Shop Profile'}</Text> */}
                <Text style={styles.sectionDescription}>This powers your single QR code and your bio-link storefront</Text>
              </View>
              {!isEditingProfile ? (
                <TouchableOpacity style={styles.editButton} onPress={() => setIsEditingProfile(true)}>
                  <FontAwesome5 name="edit" size={14} color="#000" />
                  {/* <Text style={styles.editButtonText}>Edit</Text> */}
                </TouchableOpacity>
              ) : (
                <View style={[styles.actionButtons, isTablet && styles.actionButtonsTablet]}>
                  <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.saveButton} onPress={handleSaveProfile}>
                    <Text style={styles.saveButtonText}>Save</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            <View style={styles.infoContainer}>
              <View style={styles.shopPhotoCard}>
                  <View style={styles.inlinePhotoCopy}>
                    <Text style={styles.shopPhotoTitle}>Physical shop photos</Text>
                    <Text style={styles.shopPhotoDesc}>Pick from your device or paste photo URLs.</Text>
                  </View>
                <View style={styles.shopPhotoHeader}>

                  {isEditingProfile && (
                    <View style={styles.shopPhotoActions}>
                      {/* <TouchableOpacity
                        style={styles.uploadActionBtn}
                        onPress={pickAndUploadShopPhotos}
                        disabled={uploadingShopPhotos}
                      >
                        {uploadingShopPhotos ? (
                          <ActivityIndicator size="small" color="#111827" />
                        ) : (
                          <>
                            <FontAwesome5 name="plus" size={14} color="#111827" />
                            <Text style={styles.uploadActionBtnText}>Upload</Text>
                          </>
                        )}
                      </TouchableOpacity> */}

                      <TouchableOpacity style={styles.uploadActionBtn} onPress={addShopPhotoUrl}>
                        <Text style={styles.uploadActionBtnText}>Add URL</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.shopPhotoThumbRow}>
                  {isEditingProfile && (
                    <TouchableOpacity
                      style={styles.shopPhotoAddTile}
                      onPress={pickAndUploadShopPhotos}
                      disabled={uploadingShopPhotos}
                      activeOpacity={0.9}
                    >
                      {uploadingShopPhotos ? (
                        <ActivityIndicator size="small" color="#4b5563" />
                      ) : (
                        <FontAwesome5 name="plus" size={26} color="#4b5563" />
                      )}
                    </TouchableOpacity>
                  )}

                  {formData.shop_photo_urls.map((value, idx) => {
                    if ((value || '').trim() === '') {
                      return null;
                    }

                    return (
                      <View key={`${value}-${idx}`} style={styles.shopPhotoThumbTile}>
                        <Image source={{ uri: getAbsoluteImageUrl(value) }} style={styles.shopPhotoThumbImage} />
                        {isEditingProfile && (
                          <TouchableOpacity
                            style={styles.shopPhotoThumbRemove}
                            onPress={() => removeShopPhotoUrl(idx)}
                          >
                            <FontAwesome name="close" size={12} color="#fff" />
                          </TouchableOpacity>
                        )}
                      </View>
                    );
                  })}
                </ScrollView>

                {isEditingProfile ? (
                  formData.shop_photo_urls.map((url, idx) => (
                    <View key={idx} style={styles.shopPhotoInputRow}>
                      <TextInput
                        placeholder="https://..."
                        style={styles.shopPhotoInput}
                        placeholderTextColor="#9ca3af"
                        value={url}
                        onChangeText={(text) => updateShopPhotoUrl(idx, text)}
                      />

                      {formData.shop_photo_urls.length > 1 && (
                        <TouchableOpacity style={styles.shopPhotoRemoveBtn} onPress={() => removeShopPhotoUrl(idx)}>
                          <FontAwesome name="close" size={14} color="#666" />
                        </TouchableOpacity>
                      )}
                    </View>
                  ))
                ) : (
                  formData.shop_photo_urls.filter((value) => (value || '').trim() !== '').length === 0 ? (
                    <Text style={styles.emptyPhotoText}>No shop photos added</Text>
                  ) : null
                )}
              </View>

              <View style={styles.infoRow}>
                <View style={[styles.infoIcon, styles.infoIconHidden]}>
                  <FontAwesome5 name="store" size={16} color="#666" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>{isInfluencer ? 'Influencer name' : 'Shop Name'}</Text>
                  {isEditingProfile ? (
                    <TextInput
                      style={isInfluencer ? styles.influencerInput : styles.input}
                      value={formData.name}
                      onChangeText={(text) => setFormData({ ...formData, name: text })}
                      placeholder={isInfluencer ? 'Enter your name' : 'Enter shop name'}
                    />
                  ) : (
                    isInfluencer ? (
                      <View style={styles.influencerValueBox}>
                        <Text style={styles.influencerValueText}>{formData.name || 'Not specified'}</Text>
                      </View>
                    ) : (
                      <Text style={styles.infoValue}>{formData.name || 'Not specified'}</Text>
                    )
                  )}
                </View>
              </View>
              <View style={styles.infoRow}>
                <View style={[styles.infoIcon, styles.infoIconHidden]}>
                  <FontAwesome5 name="tag" size={16} color="#666" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>{isInfluencer ? 'Niche' : 'Category'}</Text>
                  {isEditingProfile ? (
                    <TextInput
                      style={isInfluencer ? styles.influencerInput : styles.input}
                      value={formData.category}
                      onChangeText={(text) => setFormData({ ...formData, category: text })}
                      placeholder={isInfluencer ? 'Enter niche' : 'Enter category'}
                    />
                  ) : (
                    isInfluencer ? (
                      <View style={styles.influencerValueBox}>
                        <Text style={styles.influencerValueText}>{formData.category || 'Not specified'}</Text>
                      </View>
                    ) : (
                      <Text style={styles.infoValue}>{formData.category || 'Not specified'}</Text>
                    )
                  )}
                </View>
              </View>

              <View style={styles.infoRow}>
                <View style={[styles.infoIcon, styles.infoIconHidden]}>
                  <FontAwesome5 name="globe" size={16} color="#666" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Instagram</Text>
                  {isEditingProfile ? (
                    <TextInput
                      style={isInfluencer ? styles.influencerInput : styles.input}
                      value={formData.instagram_handle}
                      onChangeText={(text) => setFormData({ ...formData, instagram_handle: text })}
                      placeholder={isInfluencer ? 'https://www.instagram.com/...' : 'https://instagram.com'}
                      keyboardType="url"
                    />
                  ) : (
                    isInfluencer ? (
                      <View style={styles.influencerValueBox}>
                        <Text style={styles.influencerValueText}>{formData.instagram_handle || 'Not specified'}</Text>
                      </View>
                    ) : (
                      <Text style={styles.infoValue}>{formData.instagram_handle || 'Not specified'}</Text>
                    )
                  )}
                </View>
              </View>
              <View style={styles.infoRow}>
                <View style={[styles.infoIcon, styles.infoIconHidden]}>
                  <FontAwesome5 name="globe" size={16} color="#666" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Facebook</Text>
                  {isEditingProfile ? (
                    <TextInput
                      style={isInfluencer ? styles.influencerInput : styles.input}
                      value={formData.facebook_handle}
                      onChangeText={(text) => setFormData({ ...formData, facebook_handle: text })}
                      placeholder={isInfluencer ? 'https://www.facebook.com/...' : 'https://yourwebsite.com'}
                      keyboardType="url"
                    />
                  ) : (
                    isInfluencer ? (
                      <View style={styles.influencerValueBox}>
                        <Text style={styles.influencerValueText}>{formData.facebook_handle || 'Not specified'}</Text>
                      </View>
                    ) : (
                      <Text style={styles.infoValue}>{formData.facebook_handle || 'Not specified'}</Text>
                    )
                  )}
                </View>
              </View>
              <View style={styles.infoRow}>
                <View style={[styles.infoIcon, styles.infoIconHidden]}>
                  <FontAwesome5 name="globe" size={16} color="#666" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Pinterest</Text>
                  {isEditingProfile ? (
                    <TextInput
                      style={isInfluencer ? styles.influencerInput : styles.input}
                      value={formData.pinterest_handle}
                      onChangeText={(text) => setFormData({ ...formData, pinterest_handle: text })}
                      placeholder={isInfluencer ? 'https://www.pinterest.com/...' : 'https://pinterest.com'}
                      keyboardType="url"
                    />
                  ) : (
                    isInfluencer ? (
                      <View style={styles.influencerValueBox}>
                        <Text style={styles.influencerValueText}>{formData.pinterest_handle || 'Not specified'}</Text>
                      </View>
                    ) : (
                      <Text style={styles.infoValue}>{formData.pinterest_handle || 'Not specified'}</Text>
                    )
                  )}
                </View>
              </View>
              {/* <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <FontAwesome5 name="envelope" size={16} color="#666" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Email</Text>
                  {isEditingProfile ? (
                    <TextInput
                      style={styles.input}
                      value={formData.email}
                      onChangeText={(text) => setFormData({ ...formData, email: text })}
                      placeholder="Enter email"
                      keyboardType="email-address"
                    />
                  ) : (
                    <Text style={styles.infoValue}>{formData.email || 'Not specified'}</Text>
                  )}
                </View>
              </View> */}

              <View style={styles.infoRow}>
                <View style={[styles.infoIcon, styles.infoIconHidden]}>
                  <FontAwesome5 name="phone" size={16} color="#666" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Phone</Text>
                  {isEditingProfile ? (
                    <TextInput
                      style={isInfluencer ? styles.influencerInput : styles.input}
                      value={formData.phone}
                      onChangeText={(text) => setFormData({ ...formData, phone: text })}
                      placeholder="Enter phone number"
                      keyboardType="phone-pad"
                    />
                  ) : (
                    isInfluencer ? (
                      <View style={styles.influencerValueBox}>
                        <Text style={styles.influencerValueText}>{formData.phone || 'Not specified'}</Text>
                      </View>
                    ) : (
                      <Text style={styles.infoValue}>{formData.phone || 'Not specified'}</Text>
                    )
                  )}
                </View>
              </View>

              <View style={styles.infoRow}>
                <View style={[styles.infoIcon, styles.infoIconHidden]}>
                  <FontAwesome5 name="whatsapp" size={16} color="#666" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>WhatsApp</Text>
                  {isEditingProfile ? (
                    <TextInput
                      style={isInfluencer ? styles.influencerInput : styles.input}
                      value={formData.whatsapp}
                      onChangeText={(text) => setFormData({ ...formData, whatsapp: text })}
                      placeholder="Enter WhatsApp number"
                      keyboardType="phone-pad"
                    />
                  ) : (
                    isInfluencer ? (
                      <View style={styles.influencerValueBox}>
                        <Text style={styles.influencerValueText}>{formData.whatsapp || 'Not specified'}</Text>
                      </View>
                    ) : (
                      <Text style={styles.infoValue}>{formData.whatsapp || 'Not specified'}</Text>
                    )
                  )}
                </View>
              </View>

              <View style={styles.infoRow}>
                <View style={[styles.infoIcon, styles.infoIconHidden]}>
                  <FontAwesome5 name="map-marker-alt" size={16} color="#666" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Address</Text>
                  {isEditingProfile ? (
                    <TextInput
                      style={isInfluencer ? [styles.influencerInput, styles.influencerTextArea] : [styles.input, styles.textArea]}
                      value={formData.address}
                      onChangeText={(text) => setFormData({ ...formData, address: text })}
                      placeholder="Enter address"
                      multiline
                      numberOfLines={3}
                    />
                  ) : (
                    isInfluencer ? (
                      <View style={[styles.influencerValueBox, styles.influencerTextAreaBox]}>
                        <Text style={styles.influencerValueText}>{formData.address || 'Not specified'}</Text>
                      </View>
                    ) : (
                      <Text style={styles.infoValue}>{formData.address || 'Not specified'}</Text>
                    )
                  )}
                </View>
              </View>

              <View style={styles.infoRow}>
                <View style={[styles.infoIcon, styles.infoIconHidden]}>
                  <FontAwesome5 name="city" size={16} color="#666" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>City</Text>
                  {isEditingProfile ? (
                    <TextInput
                      style={isInfluencer ? styles.influencerInput : styles.input}
                      value={formData.city}
                      onChangeText={(text) => setFormData({ ...formData, city: text })}
                      placeholder="Enter city"
                    />
                  ) : (
                    isInfluencer ? (
                      <View style={styles.influencerValueBox}>
                        <Text style={styles.influencerValueText}>{formData.city || 'Not specified'}</Text>
                      </View>
                    ) : (
                      <Text style={styles.infoValue}>{formData.city || 'Not specified'}</Text>
                    )
                  )}
                </View>
              </View>

              {isInfluencer && (
                <View style={styles.measurementCard}>
                  <Text style={styles.measurementTitle}>Body measurements</Text>
                  <Text style={styles.measurementDesc}>These help customers understand fit for the outfits you wear.</Text>

                  <View style={styles.measurementGrid}>
                    <View style={styles.measurementField}>
                      <Text style={styles.measurementLabel}>Wearing size</Text>
                      <TextInput
                        style={styles.measurementInput}
                        value={formData.wearing_size}
                        onChangeText={(text) => setFormData({ ...formData, wearing_size: text })}
                        placeholder="S"
                        editable={isEditingProfile}
                        selectTextOnFocus={isEditingProfile}
                      />
                    </View>

                    <View style={styles.measurementField}>
                      <Text style={styles.measurementLabel}>Shoe size</Text>
                      <TextInput
                        style={styles.measurementInput}
                        value={formData.shoe_size}
                        onChangeText={(text) => setFormData({ ...formData, shoe_size: text })}
                        placeholder="UK 7"
                        editable={isEditingProfile}
                        selectTextOnFocus={isEditingProfile}
                      />
                    </View>
                  </View>

                  <View style={styles.measurementGrid}>
                    <View style={styles.measurementField}>
                      <Text style={styles.measurementLabel}>Height (cm)</Text>
                      <TextInput
                        style={styles.measurementInput}
                        value={formData.height_cm}
                        onChangeText={(text) => setFormData({ ...formData, height_cm: text })}
                        placeholder="178"
                        keyboardType="numeric"
                        editable={isEditingProfile}
                        selectTextOnFocus={isEditingProfile}
                      />
                    </View>

                    <View style={styles.measurementField}>
                      <Text style={styles.measurementLabel}>Weight (kg)</Text>
                      <TextInput
                        style={styles.measurementInput}
                        value={formData.weight_kg}
                        onChangeText={(text) => setFormData({ ...formData, weight_kg: text })}
                        placeholder="67"
                        keyboardType="numeric"
                        editable={isEditingProfile}
                        selectTextOnFocus={isEditingProfile}
                      />
                    </View>
                  </View>

                  <View style={styles.measurementGrid}>
                    <View style={styles.measurementField}>
                      <Text style={styles.measurementLabel}>Bust (cm)</Text>
                      <TextInput
                        style={styles.measurementInput}
                        value={formData.bust_cm}
                        onChangeText={(text) => setFormData({ ...formData, bust_cm: text })}
                        placeholder="86"
                        keyboardType="numeric"
                        editable={isEditingProfile}
                        selectTextOnFocus={isEditingProfile}
                      />
                    </View>

                    <View style={styles.measurementField}>
                      <Text style={styles.measurementLabel}>Waist (cm)</Text>
                      <TextInput
                        style={styles.measurementInput}
                        value={formData.waist_cm}
                        onChangeText={(text) => setFormData({ ...formData, waist_cm: text })}
                        placeholder="66"
                        keyboardType="numeric"
                        editable={isEditingProfile}
                        selectTextOnFocus={isEditingProfile}
                      />
                    </View>
                  </View>

                  <View style={styles.measurementGrid}>
                    <View style={styles.measurementField}>
                      <Text style={styles.measurementLabel}>Hip (cm)</Text>
                      <TextInput
                        style={styles.measurementInput}
                        value={formData.hip_cm}
                        onChangeText={(text) => setFormData({ ...formData, hip_cm: text })}
                        placeholder="92"
                        keyboardType="numeric"
                        editable={isEditingProfile}
                        selectTextOnFocus={isEditingProfile}
                      />
                    </View>

                    <View style={styles.measurementField} />
                  </View>
                </View>
              )}

              {!isInfluencer && (
                <View style={styles.infoRow}>
                  <View style={[styles.infoIcon, styles.infoIconHidden]}>
                    <FontAwesome5 name="globe" size={16} color="#666" />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.segmentedLabel}>Ships internationally?</Text>
                    {isEditingProfile ? (
                      <View style={styles.segmentedControl}>
                        <TouchableOpacity
                          style={[
                            styles.segmentOption,
                            formData.ships_internationally && styles.segmentOptionActive,
                          ]}
                          onPress={() => setFormData({
                            ...formData,
                            ships_internationally: true,
                          })}
                          activeOpacity={0.85}
                        >
                          <View
                            style={[
                              styles.segmentRadio,
                              formData.ships_internationally && styles.segmentRadioActive,
                            ]}
                          >
                            {formData.ships_internationally && <View style={styles.segmentRadioDot} />}
                          </View>
                          <Text
                            style={[
                              styles.segmentText,
                              formData.ships_internationally && styles.segmentTextActive,
                            ]}
                          >
                            Yes
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[
                            styles.segmentOption,
                            !formData.ships_internationally && styles.segmentOptionActive,
                          ]}
                          onPress={() => setFormData({
                            ...formData,
                            ships_internationally: false,
                          })}
                          activeOpacity={0.85}
                        >
                          <View
                            style={[
                              styles.segmentRadio,
                              !formData.ships_internationally && styles.segmentRadioActive,
                            ]}
                          >
                            {!formData.ships_internationally && <View style={styles.segmentRadioDot} />}
                          </View>
                          <Text
                            style={[
                              styles.segmentText,
                              !formData.ships_internationally && styles.segmentTextActive,
                            ]}
                          >
                            No
                          </Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <Text style={styles.infoValue}>
                        {formData.ships_internationally ? 'Yes' : 'No'}
                      </Text>
                    )}
                  </View>
                </View>
              )}


              {/* <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <FontAwesome5 name="info-circle" size={16} color="#666" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Description</Text>
                  {isEditingProfile ? (
                    <TextInput
                      style={[styles.input, styles.textArea]}
                      value={formData.description}
                      onChangeText={(text) => setFormData({ ...formData, description: text })}
                      placeholder="Enter shop description"
                      multiline
                      numberOfLines={4}
                    />
                  ) : (
                    <Text style={styles.infoValue}>{formData.description || 'No description provided'}</Text>
                  )}
                </View>
              </View> */}

              {/* <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <FontAwesome5 name="globe" size={16} color="#666" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Website</Text>
                  {isEditingProfile ? (
                    <TextInput
                      style={styles.input}
                      value={formData.website}
                      onChangeText={(text) => setFormData({ ...formData, website: text })}
                      placeholder="https://yourwebsite.com"
                      keyboardType="url"
                    />
                  ) : (
                    <Text style={styles.infoValue}>{formData.website || 'Not specified'}</Text>
                  )}
                </View>
              </View> */}
              <View style={styles.infoRow}>
                <Text>{isInfluencer ? 'Influencer story' : 'Storefront story'}</Text>
              </View>

              {/* <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <FontAwesome5 name="book-open" size={16} color="#666" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>{isInfluencer ? 'Influencer Story' : 'Storefront Story'}</Text>
                  {isEditingProfile ? (
                    <TextInput
                      style={isInfluencer ? [styles.influencerInput, styles.influencerTextArea] : [styles.input, styles.textArea]}
                      value={formData.storefrontStory}
                      onChangeText={(text) => setFormData({ ...formData, storefrontStory: text })}
                      placeholder={isInfluencer ? 'Tell your influencer story' : 'Tell your storefront story'}
                      multiline
                      numberOfLines={4}
                    />
                  ) : (
                    isInfluencer ? (
                      <View style={[styles.influencerValueBox, styles.influencerTextAreaBox]}>
                        <Text style={styles.influencerValueText}>{formData.storefrontStory || 'No story provided'}</Text>
                      </View>
                    ) : (
                      <Text style={styles.infoValue}>{formData.storefrontStory || 'No story provided'}</Text>
                    )
                  )}
                </View>
              </View> */}

              {!isInfluencer && (
                <View style={styles.infoRow}>
                  <View style={styles.infoIcon}>
                    <FontAwesome5 name="calendar" size={16} color="#666" />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Founded Year</Text>
                    {isEditingProfile ? (
                      <TextInput
                        style={styles.input}
                        value={formData.founded_year}
                        onChangeText={(text) => setFormData({ ...formData, founded_year: text })}
                        placeholder="e.g., 2020"
                        keyboardType="numeric"
                        maxLength={4}
                      />
                    ) : (
                      <Text style={styles.infoValue}>{formData.founded_year || 'Not specified'}</Text>
                    )}
                  </View>
                </View>
              )}

              {!isInfluencer && (
                <View style={styles.infoRow}>
                  <View style={styles.infoIcon}>
                    <FontAwesome5 name="chart-line" size={16} color="#666" />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Lifetime Sales</Text>
                    {isEditingProfile ? (
                      <TextInput
                        style={styles.input}
                        value={formData.claimed_lifetime_sales}
                        onChangeText={(text) => setFormData({ ...formData, claimed_lifetime_sales: text })}
                        placeholder="e.g., ₹50,000"
                      />
                    ) : (
                      <Text style={styles.infoValue}>{formData.claimed_lifetime_sales || 'Not specified'}</Text>
                    )}
                  </View>
                </View>
              )}

              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <FontAwesome5 name="tag" size={16} color="#666" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Tag Line</Text>
                  {isEditingProfile ? (
                    <TextInput
                      style={styles.influencerInput}
                      value={formData.tagline}
                      onChangeText={(text) => setFormData({ ...formData, tagline: text })}
                      placeholder="Your shop's tag line"
                    />
                  ) : (
                    <Text style={styles.infoValue}>{formData.tagline || 'Not specified'}</Text>
                  )}
                </View>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <FontAwesome5 name="star" size={16} color="#666" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Known For</Text>
                  {isEditingProfile ? (
                    <TextInput
                      style={styles.influencerInput}
                      value={formData.known_for}
                      onChangeText={(text) => setFormData({ ...formData, known_for: text })}
                      placeholder="What your shop is known for"
                    />
                  ) : (
                    <Text style={styles.infoValue}>{formData.known_for || 'Not specified'}</Text>
                  )}
                </View>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <FontAwesome5 name="book-open" size={16} color="#666" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Your story</Text>
                  {isEditingProfile ? (
                    <TextInput
                      style={[styles.influencerInput, styles.influencerTextArea]}
                      value={formData.story}
                      onChangeText={(text) => setFormData({ ...formData, story: text })}
                      placeholder={isInfluencer ? "Tell your influencer story" : "Tell your shop's story"}
                      multiline
                      numberOfLines={4}
                    />
                  ) : (
                    isInfluencer ? (
                      <View style={[styles.influencerValueBox, styles.influencerTextAreaBox]}>
                        <Text style={styles.influencerValueText}>{formData.story || 'No story provided'}</Text>
                      </View>
                    ) : (
                      <Text style={styles.infoValue}>{formData.story || 'No story provided'}</Text>
                    )
                  )}
                </View>
              </View>
            </View>
          </View>

          {/* Payout Settings Section */}
          <View style={[styles.payoutSettingsSection, styles.sectionCard]}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <Text style={styles.sectionTitle}>Payout settings</Text>
                <Text style={styles.sectionDescription}>Manage your bank details and payout preferences</Text>
              </View>
              {/* {!isEditingProfile ? (
                <TouchableOpacity style={styles.editButton} onPress={() => setisEditingProfile(true)}>
                  <FontAwesome5 name="edit" size={14} color="#000" />
                  <Text style={styles.editButtonText}>Edit</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.actionButtons}>
                  <TouchableOpacity style={styles.cancelButton} onPress={() => setisEditingProfile(false)}>
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.saveButton} onPress={handleSavePayout}>
                    <Text style={styles.saveButtonText}>Save</Text>
                  </TouchableOpacity>
                </View>
              )} */}
            </View>
            <View style={styles.infoContainer}>
              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <FontAwesome5 name="university" size={16} color="#666" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>IFSC Code</Text>
                  {isEditingProfile ? (
                    <TextInput
                      style={styles.influencerInput}
                      value={formData.payout_ifsc_code || ''}
                      onChangeText={(text) => setFormData({ ...formData, payout_ifsc_code: text })}
                      placeholder="Enter IFSC Code"
                    />
                  ) : (
                    <Text style={styles.infoValue}>{formData.payout_ifsc_code || 'Not specified'}</Text>
                  )}
                </View>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <FontAwesome5 name="credit-card" size={16} color="#666" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Account Number</Text>
                  {isEditingProfile ? (
                    <TextInput
                      style={styles.influencerInput}
                      value={formData.payout_account_number || ''}
                      onChangeText={(text) => setFormData({ ...formData, payout_account_number: text })}
                      placeholder="Enter account number"
                      keyboardType="numeric"
                      secureTextEntry
                    />
                  ) : (
                    <Text style={styles.infoValue}>{formData.payout_account_number ? `****${formData.payout_account_number.slice(-4)}` : 'Not specified'}</Text>
                  )}
                </View>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <FontAwesome5 name="university" size={16} color="#666" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>UPI ID</Text>
                  {isEditingProfile ? (
                    <TextInput
                      style={styles.influencerInput}
                      value={formData.payout_upi_id || ''}
                      onChangeText={(text) => setFormData({ ...formData, payout_upi_id: text })}
                      placeholder="Enter upi id"
                      autoCapitalize="characters"
                    />
                  ) : (
                    <Text style={styles.infoValue}>{formData.payout_upi_id || 'Not specified'}</Text>
                  )}
                </View>
              </View>

              {/* <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <FontAwesome5 name="user" size={16} color="#666" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Account Holder Name</Text>
                  {isEditingProfile ? (
                    <TextInput
                      style={styles.input}
                      value={formData.accountHolderName || ''}
                      onChangeText={(text) => setFormData({ ...formData, accountHolderName: text })}
                      placeholder="Enter account holder name"
                    />
                  ) : (
                    <Text style={styles.infoValue}>{formData.accountHolderName || 'Not specified'}</Text>
                  )}
                </View>
              </View>

              {/* <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <FontAwesome5 name="clock" size={16} color="#666" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Payout Frequency</Text>
                  {isEditingProfile ? (
                    <View style={styles.pickerContainer}>
                      <Text style={styles.pickerLabel}>Select frequency:</Text>
                      <TouchableOpacity style={styles.pickerButton}>
                        <Text style={styles.pickerText}>{formData.payoutFrequency || 'Weekly'}</Text>
                        <FontAwesome5 name="chevron-down" size={12} color="#666" />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <Text style={styles.infoValue}>{formData.payoutFrequency || 'Weekly'}</Text>
                  )}
                </View>
              </View>
  */}
              {/* <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <FontAwesome5 name="money-bill-wave" size={16} color="#666" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Minimum Payout Amount</Text>
                  {isEditingProfile ? (
                    <TextInput
                      style={styles.input}
                      value={formData.minPayoutAmount || ''}
                      onChangeText={(text) => setFormData({ ...formData, minPayoutAmount: text })}
                      placeholder="Enter minimum amount"
                      keyboardType="numeric"
                    />
                  ) : (
                    <Text style={styles.infoValue}>{formData.minPayoutAmount ? `₹${formData.minPayoutAmount}` : 'Not specified'}</Text>
                  )}
                </View>
              </View> */}
            </View>
          </View>

          {/* Bio Link Section */}
          <View style={[styles.utilityGrid, isTablet && styles.utilityGridTablet]}>
          <View style={[styles.bioLinkSection, isTablet && styles.utilitySectionTablet]}>
            <View style={styles.bioLinkCard}>
              <View style={styles.bioLinkHeader}>
                <View style={styles.bioLinkContent}>
                  <Text style={styles.bioLinkTitle}>Bio-Link</Text>
                  <Text style={styles.bioLinkUrl}>{shopData?.bio_link || 'e-kom.io/yourshop'}</Text>
                </View>
                <View style={styles.bioLinkActions}>
                  <TouchableOpacity style={styles.copyBioButton} onPress={() => {
                    Clipboard.setStringAsync(shopData?.bio_link || 'e-kom.io/yourshop');
                    Alert.alert('Copied!', 'Bio link copied to clipboard');
                  }}>
                    <FontAwesome5 name="copy" size={14} color="#fff" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.openBioButton} onPress={() => {
                    const link = shopData?.bio_link;
                    Alert.alert(
                      'Open Link',
                      'Do you want to open this link in your browser?',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        { 
                          text: 'Open', 
                          onPress: () => {
                            Linking.openURL(link).catch(err => {
                              console.error('Failed to open URL:', err);
                              Alert.alert('Error', 'Unable to open the link');
                            });
                          }
                        }
                      ]
                    );
                  }}>
                    <FontAwesome5 name="external-link-alt" size={14} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>

          {/* QR Code Section */}
          <View style={[styles.qrCodeSection, isTablet && styles.utilitySectionTablet]}>
            {/* <Text style={styles.sectionTitle}>QR Code</Text> */}
            <View style={styles.qrCodeCard}>
              <View style={styles.qrCodeHeader}>
                <View style={styles.qrCodeIcon}>
                  <FontAwesome5 name="qrcode" size={20} color="#000" />
                </View>
                <View style={styles.qrCodeContent}>
                  <Text style={styles.qrCodeTitle}>Shop QR Code</Text>
                  <Text style={styles.qrCodeSubtitle}>One code for all your products</Text>
                </View>
              </View>
              <View style={styles.qrCodeImageContainer}>
              {qrImageUrl ? (
                <ViewShot ref={viewShotRef} options={{ format: "png", quality: 1 }}>
                  <SvgXml
                    xml={qrImageUrl}
                    width={150}
                    height={150}
                    style={styles.qrCodeImage}
                  />
                </ViewShot>
              ) : (
                  <View style={styles.qrCodePlaceholder}>
                    <FontAwesome5 name="qrcode" size={60} color="#ccc" />
                    <Text style={styles.qrCodePlaceholderText}>Loading QR Code...</Text>
                  </View>
                )}
              </View>
              <View style={styles.qrCodeActions}>
                <TouchableOpacity style={styles.qrActionButton} onPress={downloadQR}>
                  <FontAwesome5 name="download" size={14} color="#fff" />
                  <Text style={styles.qrActionText}>Download</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.qrActionButton} onPress={shareQR}>
                  <FontAwesome5 name="whatsapp" size={14} color="#fff" />
                  <Text style={styles.qrActionText}>Share</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
          </View>

          {/* Payout History Section */}
          <View style={[styles.payoutSection, styles.sectionCard]}>
            <View style={styles.payoutHeader}>
              <Text style={styles.sectionTitle}>Payout History</Text>
              <View style={styles.payoutSummary}>
                <Text style={styles.payoutSummaryText}>
                  Total: ₹{payoutData.reduce((sum, item) => sum + (item.amount || 0), 0).toFixed(2)}
                </Text>
              </View>
            </View>
            
            {payoutData.length === 0 ? (
              <View style={styles.emptyPayoutContainer}>
                <FontAwesome5 name="money-bill-wave" size={40} color="#ccc" />
                <Text style={styles.emptyText}>No payout history found</Text>
                <Text style={styles.emptySubText}>Your payout records will appear here</Text>
              </View>
            ) : (
              payoutData.slice(0, 3).map(renderPayoutItem) // Show only first 3 payouts
            )}
            
            {payoutData.length > 3 && (
              <TouchableOpacity style={styles.viewAllButton}>
                <Text style={styles.viewAllText}>View All Payouts</Text>
                <FontAwesome5 name="chevron-right" size={12} color="#000" />
              </TouchableOpacity>
            )}
            </View>

          <TouchableOpacity style={[styles.logoutButton, isTablet && styles.logoutButtonTablet]} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  contentTablet: {
    paddingHorizontal: 32,
  },
  pageContent: {
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
  },
  pageContentTablet: {
    maxWidth: 1120,
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
  logoSection: {
    alignItems: 'center',
    paddingVertical: 30,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  logoContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  logoImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  logoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#f59e0b',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  shopName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
  },
  profileSection: {
    paddingVertical: 20,
  },
  sectionCard: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 24,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  sectionTitleContainer: {
    flex: 1,
  },
  sectionDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  editButtonText: {
    marginLeft: 6,
    fontSize: 12,
    color: '#000',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButtonsTablet: {
    marginLeft: 16,
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  cancelButtonText: {
    fontSize: 12,
    color: '#666',
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f59e0b',
  },
  saveButtonText: {
    fontSize: 12,
    color: '#fff',
  },
  infoContainer: {
    gap: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoIcon: {
    width: 0,
    height: 0,
    marginRight: 0,
    opacity: 0,
  },
  infoIconHidden: {
    width: 0,
    height: 0,
    marginRight: 0,
    opacity: 0,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    color: '#000',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#000',
  },
  shopPhotoCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 24,
    padding: 18,
  },
  shopPhotoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  inlinePhotoCopy: {
    flex: 1,
    paddingRight: 8,
  },
  shopPhotoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  shopPhotoDesc: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 21,
    color: '#475569',
    marginBottom: 8
  },
  shopPhotoActions: {
    flexDirection: 'row',
    gap: 12,
  },
  uploadActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 48,
    paddingHorizontal: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
  },
  uploadActionBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
  },
  shopPhotoThumbRow: {
    marginTop: 18,
  },
  shopPhotoAddTile: {
    width: 136,
    height: 136,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  shopPhotoThumbTile: {
    width: 136,
    height: 136,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginRight: 12,
  },
  shopPhotoThumbImage: {
    width: '100%',
    height: '100%',
  },
  shopPhotoThumbRemove: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shopPhotoInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
  },
  shopPhotoInput: {
    flex: 1,
    minHeight: 56,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 22,
    paddingHorizontal: 18,
    fontSize: 14,
    color: '#0f172a',
    backgroundColor: '#fff',
  },
  shopPhotoRemoveBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
    backgroundColor: '#f3f4f6',
  },
  emptyPhotoText: {
    marginTop: 14,
    fontSize: 14,
    color: '#6b7280',
  },
  segmentedLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#475569',
    marginBottom: 12,
  },
  segmentedControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 26,
    padding: 6,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  segmentOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    paddingVertical: 14,
    paddingHorizontal: 18,
  },
  segmentOptionActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  segmentRadio: {
    width: 12,
    height: 12,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    marginRight: 8,
  },
  segmentRadioActive: {
    borderColor: '#f59e0b',
  },
  segmentRadioDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#f59e0b',
  },
  measurementCard: {
    marginTop: 14,
    padding: 16,
    borderRadius: 18,
    backgroundColor: '#f3f4f6',
  },
  measurementTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  measurementDesc: {
    marginTop: 6,
    fontSize: 12,
    lineHeight: 18,
    color: '#6b7280',
    marginBottom: 12,
  },
  measurementGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  measurementField: {
    flex: 1,
  },
  measurementLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  measurementInput: {
    minHeight: 54,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    fontSize: 15,
    color: '#111827',
  },
  influencerInput: {
    minHeight: 54,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    fontSize: 15,
    color: '#111827',
  },
  influencerTextArea: {
    paddingTop: 16,
    paddingBottom: 16,
    textAlignVertical: 'top',
  },
  influencerValueBox: {
    minHeight: 54,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    justifyContent: 'center',
  },
  influencerTextAreaBox: {
    paddingTop: 16,
    paddingBottom: 16,
    justifyContent: 'flex-start',
  },
  influencerValueText: {
    fontSize: 15,
    color: '#111827',
  },
  actionsSection: {
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  actionCard: {
    width: '48%',
    backgroundColor: '#f5f5f5',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 15,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  actionText: {
    fontSize: 12,
    color: '#000',
    textAlign: 'center',
  },
  // Payout Section Styles
  payoutSection: {
    marginBottom: 30,
  },
  utilityGrid: {
    width: '100%',
  },
  utilityGridTablet: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'stretch',
    gap: 20,
  },
  utilitySectionTablet: {
    width: '48.5%',
  },
  payoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  payoutSummary: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  payoutSummaryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000',
  },
  payoutCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  payoutAmount: {
    flex: 1,
  },
  amountText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 5,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusIcon: {
    marginRight: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },
  dateText: {
    fontSize: 12,
    color: '#666',
  },
  payoutDetails: {
    marginBottom: 10,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  detailLabel: {
    fontSize: 12,
    color: '#666',
    flex: 1,
  },
  detailValue: {
    fontSize: 12,
    color: '#000',
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  netAmount: {
    fontWeight: '600',
    color: '#4CAF50',
  },
  remarksRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  remarksLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  remarksText: {
    fontSize: 12,
    color: '#000',
    fontStyle: 'italic',
  },
  failedAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    padding: 8,
    borderRadius: 6,
    marginTop: 10,
  },
  failedText: {
    fontSize: 12,
    color: '#F44336',
    marginLeft: 8,
    flex: 1,
  },
  emptyPayoutContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  // Payout Settings Section Styles
  payoutSettingsSection: {
    marginBottom: 30,
  },
  pickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  pickerLabel: {
    fontSize: 12,
    color: '#666',
    marginRight: 8,
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    flex: 1,
  },
  pickerText: {
    fontSize: 14,
    color: '#000',
    flex: 1,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  viewAllText: {
    fontSize: 14,
    color: '#000',
    fontWeight: '500',
    marginRight: 8,
  },
  // Bio Link Section Styles
  bioLinkSection: {
    marginBottom: 30,
  },
  bioLinkCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 15,
    // height: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bioLinkHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  bioLinkIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  bioLinkContent: {
    flex: 1,
  },
  bioLinkTitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  bioLinkUrl: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  copyBioButton: {
    backgroundColor: '#f59e0b',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  bioLinkActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  openBioButton: {
    backgroundColor: '#4CAF50',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bioDescription: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 8,
  },
  // QR Code Section Styles
  qrCodeSection: {
    marginBottom: 30,
  },
  qrCodeCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 15,
    // height: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  qrCodeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  qrCodeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  qrCodeContent: {
    flex: 1,
  },
  qrCodeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  qrCodeSubtitle: {
    fontSize: 12,
    color: '#666',
  },
  qrCodeImageContainer: {
    alignItems: 'center',
    marginVertical: 15,
  },
  qrCodeImage: {
    backgroundColor: '#fff',
  },
  qrCodePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 150,
    height: 150,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  qrCodePlaceholderText: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
  },
  qrCodeActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 15,
  },
  qrActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f59e0b',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  qrActionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 6,
  },
  logoutButton: {
    marginBottom: 40,
    backgroundColor: '#f59e0b',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutButtonTablet: {
    alignSelf: 'flex-start',
    minWidth: 220,
    paddingHorizontal: 28,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ShopProfileScreen;
