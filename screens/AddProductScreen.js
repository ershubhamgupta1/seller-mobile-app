import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { inventory } from '../services/api';
import Header from '../components/Header';

const AddProductScreen = ({ navigation }) => {
  const [socialLink, setSocialLink] = useState('');
  const [category, setCategory] = useState('Clothing & Apparel');
  const [material, setMaterial] = useState('');
  const [sizeRange, setSizeRange] = useState('S, M, L, XL');
  const [originalPrice, setOriginalPrice] = useState('$ 0.00');
  const [offerPrice, setOfferPrice] = useState('$ 0.00');
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState([]);

  const handleAutoFetch = () => {
    // TODO: Implement auto-fetch from social media
    Alert.alert('Auto-Fetch', 'This feature will automatically fetch product details from the social media link.');
  };

  const handlePublish = async () => {
    if (!title || !socialLink) {
      Alert.alert('Error', 'Please fill in at least the title and social media link.');
      return;
    }

    try {
      setLoading(true);
      
      const postData = {
        social_platform: 'instagram', // Default to Instagram, could be dynamic
        social_url: socialLink,
        title: title || 'Untitled Product',
        caption: caption || '',
        price: parseFloat(offerPrice.replace(/[^0-9.]/g, '')) || 0,
        currency: 'INR',
        material: material || '',
        attributes: {
          color: '', // Could be added as a separate field
          size: sizeRange,
          delivery_fee_amount: 0, // Could be added as a separate field
        },
        images: images.map((img, index) => ({
          url: img.url,
          sort_order: index + 1
        }))
      };

      await inventory.createPost(postData);
      Alert.alert('Success', 'Product published successfully!');
      
      // Reset form
      setTitle('');
      setCaption('');
      setSocialLink('');
      setMaterial('');
      setSizeRange('S, M, L, XL');
      setOriginalPrice('$ 0.00');
      setOfferPrice('$ 0.00');
      setImages([]);
      
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to publish product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Header 
        title="Add Product"
        onNotificationPress={() => console.log('Notification pressed')}
        onProfilePress={() => navigation.navigate('Settings')}
      />

      <View style={styles.content}>
        <View style={styles.titleSection}>
          <Text style={styles.title}>Add New Product</Text>
          <Text style={styles.subtitle}>Import from social media or add manually</Text>
        </View>

        <View style={styles.socialSection}>
          <Text style={styles.label}>Social Media Link</Text>
          <View style={styles.linkInputContainer}>
            <Text style={styles.linkIcon}>🔗</Text>
            <TextInput
              style={styles.linkInput}
              placeholder="Enter social media link"
              placeholderTextColor="#999"
              value={socialLink}
              onChangeText={setSocialLink}
            />
          </View>
          <TouchableOpacity style={styles.autoFetchButton} onPress={handleAutoFetch}>
            <Text style={styles.magicIcon}>✨</Text>
            <Text style={styles.autoFetchText}>Auto-Fetch Details</Text>
          </TouchableOpacity>
          <View style={styles.socialIcons}>
            <TouchableOpacity style={styles.socialIcon}>
              <Text style={styles.iconText}>📷</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialIcon}>
              <Text style={styles.iconText}>📘</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialIcon}>
              <Text style={styles.iconText}>📌</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.imagesSection}>
          <Text style={styles.label}>PRODUCT IMAGES (MAX 3)</Text>
          <Text style={styles.subtitleSmall}>High-res recommended</Text>
          <View style={styles.imageGrid}>
            <TouchableOpacity style={styles.imageSlot}>
              <Text style={styles.addImageText}>+ Add</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.imageSlot}>
              <Text style={styles.addImageText}>+ Add</Text>
            </TouchableOpacity>
            <View style={styles.imageSlotFilled}>
              <Text style={styles.thumbnailText}>Product Thumbnail</Text>
              <TouchableOpacity style={styles.removeButton}>
                <Text style={styles.removeText}>×</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.categorySection}>
          <Text style={styles.label}>Product Category (Template)</Text>
          <TextInput
            style={styles.input}
            value={category}
            onChangeText={setCategory}
          />
        </View>

        <View style={styles.detailsSection}>
          <View style={styles.formRowContainer}>
            <Text style={styles.label}>Material</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Cotton"
              placeholderTextColor="#999"
              value={material}
              onChangeText={setMaterial}
            />
          </View>
          <View style={styles.formRowContainer}>
            <Text style={styles.label}>Size Range</Text>
            <TextInput
              style={styles.input}
              value={sizeRange}
              onChangeText={setSizeRange}
            />
          </View>
        </View>

        <View style={styles.detailsSection}>
          <View style={styles.formRowContainer}>
            <Text style={styles.label}>Original Price</Text>
            <TextInput
              style={styles.input}
              value={originalPrice}
              onChangeText={setOriginalPrice}
            />
          </View>
          <View style={styles.formRowContainer}>
            <Text style={styles.label}>Offer Price</Text>
            <TextInput
              style={styles.input}
              value={offerPrice}
              onChangeText={setOfferPrice}
            />
          </View>
        </View>

        <TouchableOpacity style={styles.publishButton} onPress={handlePublish} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.cloudIcon}>☁️</Text>
          )}
          <Text style={styles.publishText}>
            {loading ? 'Publishing...' : 'Publish Product'}
          </Text>
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
  titleSection: {
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  subtitleSmall: {
    fontSize: 12,
    color: '#666',
    marginBottom: 15,
  },
  socialSection: {
    marginBottom: 30,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 10,
  },
  linkInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginBottom: 15,
  },
  linkIcon: {
    fontSize: 18,
    marginRight: 10,
    color: '#666',
  },
  linkInput: {
    flex: 1,
    fontSize: 14,
    color: '#000',
  },
  autoFetchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 15,
  },
  magicIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  autoFetchText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  socialIcons: {
    flexDirection: 'row',
    gap: 15,
  },
  socialIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    fontSize: 20,
  },
  imagesSection: {
    marginBottom: 30,
  },
  imageGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  imageSlot: {
    flex: 1,
    height: 100,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
  },
  imageSlotFilled: {
    flex: 1,
    height: 100,
    backgroundColor: '#e8f5e8',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  addImageText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  thumbnailText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '500',
  },
  removeButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  categorySection: {
    marginBottom: 30,
  },
  detailsSection: {
    marginBottom: 30,
    flexDirection: 'row',
    justifyContent:'space-between',
    width: '100%',
  },
  pricingSection: {
    marginBottom: 30,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: '#000',
    marginBottom: 15,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  publishButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
    paddingVertical: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  cloudIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  publishText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  formRowContainer: {
    flex:1,
    marginRight: 10
  }
});

export default AddProductScreen;
