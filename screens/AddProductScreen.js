import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  Linking
} from "react-native";
import { Feather, FontAwesome, FontAwesome5 } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { API_BASE, inventory, uploads } from "../services/api";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";

const COLORS = {
  bg: "#f9fafb",
  card: "#ffffff",
  border: "#e5e7eb",
  textPrimary: "#111827",
  textSecondary: "#4b5563",
  textMuted: "#6b7280",
};

const FORM_INPUT_FONT_SIZE = 12;

const getAbsoluteImageUrl = (value) => {
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  return `${API_BASE}${value.startsWith("/") ? value : `/${value}`}`;
};

const BestPractices = ()=>{
  return (
     <View style={styles.card}>
        <Text style={styles.smallTitle}>Best practices</Text>
        <Text style={styles.bestTitle}>
          For maximum conversion:
        </Text>
        <Text style={styles.bestItem}>
          1. Add price (kills friction)
        </Text>
        <Text style={styles.bestItem}>
          2. Add key details (builds trust)
        </Text>
        <Text style={styles.bestItem}>
          3. Add 3 images (boosts intent)
        </Text>
      </View>    
  )
}
const PreviewCard = ({ imageUrl }) => {
  return (
    <View style={styles.card}>
      <Text style={styles.smallTitle}>Preview</Text>

      <View style={styles.previewWrapper}>
        <Image
          source={{ uri: getAbsoluteImageUrl(imageUrl) }}
          style={styles.previewImage}
        />
      </View>
    </View>
  );
};

const PostMetricsCard = ({ shares = 0, images = 0, onOpenLink }) => {
  return (
    <View style={styles.card}>
      <Text style={styles.smallTitle}>Post metrics</Text>

      {/* METRICS ROW */}
      <View style={styles.metricsRow}>
        <View style={styles.metricBox}>
          <Text style={styles.metricLabel}>Shares</Text>
          <Text style={styles.metricValue}>{shares}</Text>
        </View>

        <View style={styles.metricBox}>
          <Text style={styles.metricLabel}>Images</Text>
          <Text style={styles.metricValue}>{images}</Text>
        </View>
      </View>

      {/* ACTION */}
      <TouchableOpacity style={styles.secondaryButton} onPress={onOpenLink}>
        <Text style={styles.secondaryButtonText}>
          Open social link
        </Text>
        <Feather name="arrow-right" size={16} />
      </TouchableOpacity>

    </View>
  );
};

export default function AddPostScreen({ route }) {
  const navigation = useNavigation();
  const { post } = route.params || {};
  const isEditMode = !!post;
  const [url, setUrl] = useState(post?.social_url || "");
  const [title, setTitle] = useState(post?.title || "");
  const [material, setMaterial] = useState(post?.material || "");
  const [price, setPrice] = useState(post?.price?.toString() || "");
  const [delivery, setDelivery] = useState(post?.attributes?.delivery_fee_amount?.toString() || "");
  const [color, setColor] = useState(post?.attributes?.color || "");
  const [size, setSize] = useState(post?.attributes?.size || "");
  const [caption, setCaption] = useState(post?.caption || "");
  const [imageUrls, setImageUrls] = useState(post?.images?.length > 0 ? post.images.map(img => getAbsoluteImageUrl(img.url)) : [""]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState(post?.social_platform || "instagram");
  const [selectedTemplate, setSelectedTemplate] = useState("default");
  const [loading, setLoading] = useState(false);

  const pickAndUploadImages = async () => {
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

      if (result.canceled) return;

      setUploadingImages(true);

      const assets = result.assets || [];
      const uploadedUrls = [];

      for (const asset of assets) {
        const uri = asset.uri;
        if (!uri) continue;

        const fileName = asset.fileName || uri.split('/').pop() || `image-${Date.now()}.jpg`;
        const ext = (fileName.split('.').pop() || 'jpg').toLowerCase();
        const mimeType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';

        const fileAsset = {
          uri,
          name: fileName,
          type: mimeType,
        };

        const res = await uploads.uploadInventoryImage(fileAsset);
        const publicUrl = res?.url ? res.url : null;
        if (!publicUrl) {
          throw new Error('Upload succeeded but no image URL was returned');
        }
        uploadedUrls.push(getAbsoluteImageUrl(publicUrl));
      }

      if (uploadedUrls.length === 0) {
        Alert.alert('Error', 'No images were uploaded');
        return;
      }

      setImageUrls((prev) => {
        const existing = (prev || []).filter((u) => (u || '').trim() !== '');
        return [...existing, ...uploadedUrls, ''];
      });
    } catch (e) {
      console.error('Error picking/uploading images:', e);
      Alert.alert('Error', 'Failed to upload images');
    } finally {
      setUploadingImages(false);
    }
  };

  const handleCreatePost = async () => {
    // Validation
    if (!url.trim()) {
      Alert.alert('Error', 'Please enter a social post URL');
      return;
    }
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }
    if (!price.trim()) {
      Alert.alert('Error', 'Please enter a price');
      return;
    }

    try {
      setLoading(true);
      
      // Filter out empty image URLs and create images array
      const validImageUrls = imageUrls.filter(url => url.trim() !== "");
      const images = validImageUrls.map((url, index) => ({
        url: getAbsoluteImageUrl(url.trim()),
        sort_order: index + 1
      }));
      
      const postData = {
        title: title,
        price: parseFloat(price),
        attributes: {
          color: color || "",
          size: size || "",
          delivery_fee_amount: delivery ? parseFloat(delivery) : 0
        },
        images: images,
        caption: caption || "",
        material: material || "",
      };

      let response;
      if (isEditMode) {
        response = await inventory.updatePost(post.id, postData);
      } else {
        postData.social_platform = selectedPlatform;
        postData.social_url = url;

        response = await inventory.createPost(postData);
      }
      
      Alert.alert(
        'Success',
        isEditMode ? 'Post updated successfully!' : 'Post created successfully!',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]
      );
      
      // Reset form only if not in edit mode
      if (!isEditMode) {
        setUrl("");
        setTitle("");
        setMaterial("");
        setPrice("");
        setDelivery("");
        setColor("");
        setSize("");
        setCaption("");
        setImageUrls([""]);
      }
      
    } catch (error) {
      console.error('Error creating post:', error);
      Alert.alert('Error', `Failed to ${isEditMode ? 'update' : 'create'} post. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePost = async () => {
    Alert.alert(
      'Delete Post',
      'Are you sure you want to delete this post? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await inventory.deletePost(post.id);
              Alert.alert(
                'Success',
                'Post deleted successfully!',
                [
                  {
                    text: 'OK',
                    onPress: () => navigation.goBack()
                  }
                ]
              );
            } catch (error) {
              console.error('Error deleting post:', error);
              Alert.alert('Error', 'Failed to delete post. Please try again.');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const addImageUrl = () => {
    setImageUrls([...imageUrls, ""]);
  };

  const removeImageUrl = (index) => {
    const newImageUrls = imageUrls.filter((_, i) => i !== index);
    setImageUrls(newImageUrls.length > 0 ? newImageUrls : [""]);
  };

  const updateImageUrl = (index, value) => {
    const newImageUrls = [...imageUrls];
    newImageUrls[index] = value;
    setImageUrls(newImageUrls);
  };

  const platforms = [
    { value: "instagram", label: "Instagram", icon: "instagram", color: "#e1306c" },
    { value: "facebook", label: "Facebook", icon: "facebook-official", color: "#1877f2" },
    { value: "pinterest", label: "Pinterest", icon: "pinterest-p", color: "#e60023" },

  ];

  const templates = [
    { value: "default", label: "Default", icon: "magic", color: "#475569" },
    { value: "fashion", label: "Fashion", icon: "tshirt", color: "#e11d48" },
    { value: "electronics", label: "Electronics", icon: "microchip", color: "#0284c7" },
    { value: "grocery", label: "Grocery", icon: "shopping-basket", color: "#059669" }
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.customHeader}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Feather name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEditMode ? 'Edit post' : 'Create post'}</Text>
        <View style={styles.headerSpacer} />
      </View>
      <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
        <View style={{ padding: 20 }}>
          {/* Create Post */}

          <View style={styles.card}>

            <View style={styles.rowBetween}>
              <View>
                <Text style={styles.smallTitle}>Visual Inventory</Text>
                <Text style={styles.title}>{isEditMode ? 'Edit post' : 'Create post'}</Text>
              </View>
              <View style={styles.rowActions}>
                {/* <Feather name="plus" size={22} /> */}
                {isEditMode && (
                  <TouchableOpacity 
                    style={styles.deleteButton}
                    onPress={handleDeletePost}
                    disabled={loading}
                  >
                    <Feather name="trash-2" size={16} color="#dc2626" />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <Text style={styles.description}>
              {isEditMode ? post.social_url : 'Paste your social link, then add structured details like price and material.'}
            </Text>

            {/* Images */}

            <View style={styles.imageCard}>

              <View style={styles.rowBetween}>
                <View>
                  <Text style={styles.imageTitle}>Add images</Text>
                  <Text style={styles.helperText}>Pick from your device or paste image URLs.</Text>
                </View>
              </View>

              {uploadingImages && (
                <View style={styles.uploadStatusRow}>
                  <ActivityIndicator size="small" color="#111827" />
                  <Text style={styles.uploadStatusText}>Uploading images...</Text>
                </View>
              )}

              {/* Thumbnails */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.thumbRow}>
                <TouchableOpacity
                  style={styles.thumbAddTile}
                  onPress={pickAndUploadImages}
                  disabled={uploadingImages || loading}
                  activeOpacity={0.9}
                >
                  <Ionicons name="add" size={28} color="#4b5563" />
                </TouchableOpacity>

                {imageUrls
                  .filter((u) => (u || '').trim() !== '')
                  .map((u, idx) => {
                    return (
                    <View key={`${u}-${idx}`} style={styles.thumbTile}>
                      <Image source={{ uri: getAbsoluteImageUrl(u) }} style={styles.thumbImage} />
                      <TouchableOpacity
                        style={styles.thumbRemove}
                        onPress={() => {
                          const urlIndex = imageUrls.findIndex((x) => x === u);
                          if (urlIndex >= 0) removeImageUrl(urlIndex);
                        }}
                      >
                        <Feather name="x" size={14} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  )
                  })}
              </ScrollView>

              <View style={styles.imageUrlHeader}>
                <Text style={styles.imageUrlTitle}>Image URLs</Text>
                <TouchableOpacity style={styles.addButtonSmall} onPress={addImageUrl}>
                  <Text style={styles.addButtonSmallText}>Add</Text>
                </TouchableOpacity>
              </View>

              {imageUrls.map((imageUrl, index) => (
                <View key={index} style={styles.imageInputContainer}>
                  <TextInput
                    style={[styles.input, {width: '80%'}]}
                    placeholder={`https://... image url ${index + 1}`}
                    value={imageUrl}
                    onChangeText={(value) => updateImageUrl(index, value)}
                  />
                  {imageUrls.length > 1 && (
                    <TouchableOpacity 
                      style={styles.removeButton}
                      onPress={() => removeImageUrl(index)}
                    >
                      <Feather name="x" size={16} color="#666" />
                    </TouchableOpacity>
                  )}
                </View>
              ))}

            </View>
            {
              !isEditMode &&
              <>
                <Text style={styles.label}>Template</Text>

                <View style={styles.templateGrid}>
                  {templates.map((template) => {
                    const isSelected = selectedTemplate === template.value;

                    return (
                      <TouchableOpacity
                        key={template.value}
                        style={[
                          styles.templateCard,
                          isSelected && styles.templateCardSelected,
                        ]}
                        onPress={() => setSelectedTemplate(template.value)}
                        activeOpacity={0.9}
                      >
                        <FontAwesome5
                          name={template.icon}
                          size={22}
                          color={template.color}
                          solid={template.value !== "default"}
                        />
                        <Text
                          style={[
                            styles.templateCardText,
                            isSelected && styles.templateCardTextSelected,
                          ]}
                        >
                          {template.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>  
            }
            {
              !isEditMode &&
              <>  
                <Text style={styles.label}>Social post / reel URL</Text>

                <TextInput
                  style={styles.input}
                  placeholder="https://www.instagram.com/reel/..."
                  value={url}
                  onChangeText={setUrl}
                />

                <View style={styles.platformGrid}>
                  {platforms.map((platform) => {
                    const isSelected = selectedPlatform === platform.value;

                    return (
                      <TouchableOpacity
                        key={platform.value}
                        style={[
                          styles.platformCard,
                          isSelected && styles.platformCardSelected,
                        ]}
                        onPress={() => setSelectedPlatform(platform.value)}
                        activeOpacity={0.9}
                      >
                        <FontAwesome
                          name={platform.icon}
                          size={22}
                          color={platform.color}
                        />
                        <Text
                          style={[
                            styles.platformCardText,
                            isSelected && styles.platformCardTextSelected,
                          ]}
                        >
                          {platform.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            }


            <Text style={styles.helperText}>
              We store the link and build structured inventory around it.
            </Text>


            {/* Title */}

            <Text style={styles.label}>Title</Text>

            <TextInput
              style={styles.input}
              placeholder="e.g., Product name"
              value={title}
              onChangeText={setTitle}
            />


            {/* Material */}

            <Text style={styles.label}>Material</Text>

            <TextInput
              style={styles.input}
              placeholder="e.g., Cotton"
              value={material}
              onChangeText={setMaterial}
            />


            {/* Price */}

            <Text style={styles.label}>Price (₹)</Text>

            <TextInput
              style={styles.input}
              placeholder="1499"
              keyboardType="numeric"
              value={price}
              onChangeText={setPrice}
            />


            {/* Delivery */}

            <Text style={styles.label}>Delivery fee (₹)</Text>

            <TextInput
              style={styles.input}
              placeholder="0"
              keyboardType="numeric"
              value={delivery}
              onChangeText={setDelivery}
            />


            {/* Color */}

            <Text style={styles.label}>Color</Text>

            <TextInput
              style={styles.input}
              placeholder="e.g., Black"
              value={color}
              onChangeText={setColor}
            />


            {/* Size */}

            <Text style={styles.label}>Size</Text>

            <TextInput
              style={styles.input}
              placeholder="e.g., M / L / Free"
              value={size}
              onChangeText={setSize}
            />


            {/* Caption */}

            <Text style={styles.label}>Caption (optional)</Text>

            <TextInput
              style={styles.textarea}
              placeholder="Write details customers care about..."
              value={caption}
              onChangeText={setCaption}
              multiline
            />


            {/* Buttons */}

            <View style={styles.buttonRow}>

              <TouchableOpacity 
                style={styles.createButton}
                onPress={handleCreatePost}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.createText}>{isEditMode ? 'Update' : 'Create'}</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => navigation.goBack()}
                disabled={loading}
              >
                <Text>Cancel</Text>
              </TouchableOpacity>

            </View>

          </View>

          {
            isEditMode && 
            <PostMetricsCard 
              shares={post.share_count} 
              images={post.inventory_image_count} 
              onOpenLink={()=>{
                Linking.openURL(post.social_url).catch(err => {});
              }} 
            />
          }
          {isEditMode && <PreviewCard imageUrl={imageUrls?.[0]} />}
          {!isEditMode && <BestPractices />}      


          <Text style={styles.footer}>
            © 2026 Social Commerce SaaS · Business Console
          </Text>

        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },

  card: {
    backgroundColor: "#f4f4f4",
    borderRadius: 22,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#e5e7eb"
  },

  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8
  },

  rowActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },

  deleteButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "#f5f5f5",
    borderWidth: 1,
    borderColor: "#ddd"
  },

  smallTitle: {
    fontSize: 14,
    color: "#6b7280"
  },

  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827"
  },

  description: {
    fontSize: 15,
    color: "#4b5563",
    // marginVertical: 12,
  },

  label: {
    fontSize: 14,
    color: "#4b5563",
    marginTop: 14,
    marginBottom: 6
  },

  input: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    fontSize: FORM_INPUT_FONT_SIZE,
  },

  templateGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    marginTop: 4,
  },

  templateCard: {
    // width: "48%",
    // minHeight: 28,
    alignSelf: "flex-start",
    marginRight: 12,
    marginBottom: 12,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#ffffff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
    gap: 12,
  },

  templateCardSelected: {
    borderColor: "#f2c7a5",
    borderWidth: 2,
    backgroundColor: "#fffaf5",
  },

  templateCardText: {
    fontSize: FORM_INPUT_FONT_SIZE,
    fontWeight: "700",
    color: "#111827",
  },

  templateCardTextSelected: {
    color: "#0f172a",
  },

  platformGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    marginTop: 16,
  },

  platformCard: {
    alignSelf: "flex-start",
    marginRight: 12,
    marginBottom: 12,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#ffffff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
    gap: 12,
  },

  platformCardSelected: {
    borderColor: "#f2c7a5",
    borderWidth: 2,
    backgroundColor: "#fffaf5",
  },

  platformCardText: {
    fontSize: FORM_INPUT_FONT_SIZE,
    fontWeight: "700",
    color: "#111827",
  },

  platformCardTextSelected: {
    color: "#0f172a",
  },

  textarea: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    height: 120,
    textAlignVertical: "top"
  },

  helperText: {
    fontSize: 13,
    color: "#6b7280",
    marginVertical: 6
  },

  imageCard: {
    marginTop: 20,
    backgroundColor: "#f8f8f8",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb"
  },

  imageTitle: {
    fontSize: 16,
    fontWeight: "600"
  },

  uploadStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },

  uploadStatusText: {
    fontSize: 14,
    color: "#4b5563",
  },

  thumbRow: {
    marginTop: 12,
  },

  thumbAddTile: {
    width: 92,
    height: 92,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#d1d5db",
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  thumbTile: {
    width: 92,
    height: 92,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginRight: 10,
  },

  thumbImage: {
    width: "100%",
    height: "100%",
  },

  thumbRemove: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },

  imageUrlHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 16,
  },

  imageUrlTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },

  addButtonSmall: {
    borderWidth: 1,
    borderColor: "#ddd",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#fff",
  },

  addButtonSmallText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },

  imageInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8
  },

  removeButton: {
    marginLeft: 10,
    padding: 8,
    backgroundColor: "#f5f5f5",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ddd"
  },

  buttonRow: {
    flexDirection: "row",
    marginTop: 20,
    gap: 12
  },

  createButton: {
    backgroundColor: "#f59e0b",
    paddingVertical: 14,
    paddingHorizontal: 26,
    borderRadius: 30
  },

  createText: {
    fontWeight: "600",
    fontSize: 16
  },

  cancelButton: {
    borderWidth: 1,
    borderColor: "#ddd",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 30
  },

  bestTitle: {
    marginTop: 10,
    marginBottom: 10,
    fontWeight: "600"
  },

  bestItem: {
    color: "#6b7280",
    marginBottom: 6
  },

  footer: {
    textAlign: "center",
    color: "#9ca3af",
    marginBottom: 40
  },

  qrButton: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6
  },

  customHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0"
  },

  backButton: {
    padding: 5
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333"
  },

  headerSpacer: {
    width: 34
  },

  qrText: {
    marginLeft: 6
  },
  metricsRow: {
  flexDirection: "row",
  justifyContent: "space-between",
  marginTop: 12,
},

  metricBox: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 10,
  },

  metricLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },

  metricValue: {
    fontSize: 32,
    fontWeight: "700",
    marginTop: 6,
    color: COLORS.textPrimary,
  },
    secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    marginVertical: 10,
    gap: 6,
  },

  secondaryButtonText: {
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  previewWrapper: {
    marginTop: 12,
    borderRadius: 20,
    overflow: "hidden",
  },

  previewImage: {
    width: "100%",
    height: 350, // adjust based on your UI
    resizeMode: "cover",
  },
});