import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  Linking,
  Platform
} from "react-native";
import { Feather, FontAwesome, FontAwesome5 } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { API_BASE, collaboration, inventory, shop, uploads } from "../services/api";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";

const COLORS = {
  bg: "#f9fafb",
  card: "#ffffff",
  border: "#e5e7eb",
  textPrimary: "#111827",
  textSecondary: "#4b5563",
  textMuted: "#6b7280",
};

const FORM_INPUT_FONT_SIZE = 12;
const BULK_CSV_TEMPLATE_FILE_NAME = "inventory-bulk-template.csv";
const BULK_CSV_TEMPLATE = [
  "social_platform,social_url,template,title,material,price,currency,caption,color,size,delivery_fee_amount,pattern,model_number,warranty_months,expiry_date,image_urls",
  "instagram,https://www.instagram.com/reel/Cx1a2B3cD4E/,fashion,Banarasi Silk Saree,Silk,1999,INR,Premium silk saree with zari work.,Maroon,Free,50,Floral,,,,https://example.com/image1.jpg|https://example.com/image2.jpg",
].join("\n");

const getTimestampedBulkCsvFileName = () => `inventory-bulk-template-${Date.now()}.csv`;

const isLocalFileUri = (value = "") => /^(file|content):\/\//i.test(value);

const isCsvFileAsset = (asset = {}) => {
  const normalizedName = (asset?.name || "").toLowerCase();
  const normalizedMimeType = (asset?.mimeType || "").toLowerCase();

  return (
    normalizedName.endsWith(".csv") ||
    normalizedMimeType.includes("csv") ||
    normalizedMimeType.includes("comma-separated") ||
    normalizedMimeType === "application/vnd.ms-excel"
  );
};

const normalizeCsvValue = (value = "") => value.replace(/^\uFEFF/, "").trim();

const normalizeSocialHandleUrl = (platform, value = "") => {
  const normalizedValue = normalizeCsvValue(value);

  if (!normalizedValue) {
    return "";
  }

  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(normalizedValue)) {
    return normalizedValue;
  }

  const sanitizedHandle = normalizedValue.replace(/^@/, "").replace(/^\/+|\/+$/g, "");

  if (!sanitizedHandle) {
    return "";
  }

  if (platform === "instagram") {
    return `https://www.instagram.com/${sanitizedHandle}/`;
  }

  if (platform === "facebook") {
    return `https://www.facebook.com/${sanitizedHandle}`;
  }

  if (platform === "pinterest") {
    return `https://www.pinterest.com/${sanitizedHandle}/`;
  }

  return sanitizedHandle;
};

const extractInstagramUsername = (value = "") => {
  const normalizedUrl = normalizeSocialHandleUrl("instagram", value);

  if (!normalizedUrl) {
    return "";
  }

  const normalizedPath = normalizedUrl
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, "")
    .split(/[?#]/)[0]
    .split("/")
    .filter(Boolean);

  return normalizedPath[0] || "";
};

const buildNativeSocialUrl = (platform, value = "") => {
  const normalizedUrl = normalizeSocialHandleUrl(platform, value);

  if (!normalizedUrl) {
    return "";
  }

  if (platform === "instagram") {
    const username = extractInstagramUsername(value);
    return username ? `instagram://user?username=${encodeURIComponent(username)}` : "";
  }

  if (platform === "facebook") {
    return `fb://facewebmodal/f?href=${encodeURIComponent(normalizedUrl)}`;
  }

  return "";
};

const parseOptionalNumber = (value = "") => {
  const normalizedValue = normalizeCsvValue(value);

  if (!normalizedValue) {
    return null;
  }

  const parsedValue = Number(normalizedValue.replace(/,/g, ""));
  return Number.isFinite(parsedValue) ? parsedValue : null;
};

const parseCsvTable = (csvText = "") => {
  const rows = [];
  let currentRow = [];
  let currentValue = "";
  let inQuotes = false;

  for (let index = 0; index < csvText.length; index += 1) {
    const character = csvText[index];

    if (character === '"') {
      if (inQuotes && csvText[index + 1] === '"') {
        currentValue += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (character === "," && !inQuotes) {
      currentRow.push(currentValue);
      currentValue = "";
      continue;
    }

    if ((character === "\n" || character === "\r") && !inQuotes) {
      if (character === "\r" && csvText[index + 1] === "\n") {
        index += 1;
      }

      currentRow.push(currentValue);

      if (currentRow.some((value) => normalizeCsvValue(value) !== "")) {
        rows.push(currentRow);
      }

      currentRow = [];
      currentValue = "";
      continue;
    }

    currentValue += character;
  }

  if (currentValue.length > 0 || currentRow.length > 0) {
    currentRow.push(currentValue);

    if (currentRow.some((value) => normalizeCsvValue(value) !== "")) {
      rows.push(currentRow);
    }
  }

  return rows;
};

const parseBulkCsvRows = (csvText = "") => {
  const table = parseCsvTable(csvText);

  if (table.length === 0) {
    throw new Error("CSV file is empty.");
  }

  const headers = table[0].map((header) => normalizeCsvValue(header).toLowerCase());
  const requiredHeaders = ["social_platform", "social_url", "title", "price"];
  const missingHeaders = requiredHeaders.filter((header) => !headers.includes(header));

  if (missingHeaders.length > 0) {
    throw new Error(`CSV is missing required columns: ${missingHeaders.join(", ")}`);
  }

  return table
    .slice(1)
    .map((row, rowIndex) => {
      const values = headers.reduce((accumulator, header, headerIndex) => {
        accumulator[header] = normalizeCsvValue(row[headerIndex] || "");
        return accumulator;
      }, {});

      return {
        rowNumber: rowIndex + 2,
        values,
      };
    })
    .filter(({ values }) => Object.values(values).some((value) => value !== ""));
};

const inferPlatformFromUrl = (value = "") => {
  const normalizedValue = value.toLowerCase();

  if (normalizedValue.includes("instagram")) return "instagram";
  if (normalizedValue.includes("facebook")) return "facebook";
  if (normalizedValue.includes("pinterest")) return "pinterest";

  return "instagram";
};

const getMimeTypeFromUri = (value = "") => {
  const sanitizedValue = value.split("?")[0];
  const ext = (sanitizedValue.split(".").pop() || "jpg").toLowerCase();

  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  if (ext === "gif") return "image/gif";
  if (ext === "heic") return "image/heic";

  return "image/jpeg";
};

const ensureTrailingImageInput = (values = []) => {
  const nonEmptyValues = (values || []).filter((value) => (value || "").trim() !== "");
  return nonEmptyValues.length > 0 ? [...nonEmptyValues, ""] : [""];
};

const getAbsoluteImageUrl = (value) => {
  if (!value) return "";
  if (/^https?:\/\//i.test(value) || isLocalFileUri(value) || /^data:/i.test(value)) return value;
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
  const { post, sharedDraft } = route.params || {};
  const isEditMode = !!post;
  const initialSharedImageUrls = !post && sharedDraft?.imageUrls?.length > 0
    ? ensureTrailingImageInput(sharedDraft.imageUrls)
    : [""];
  const [url, setUrl] = useState(post?.social_url || sharedDraft?.socialUrl || "");
  const [title, setTitle] = useState(post?.title || sharedDraft?.title || "");
  const [material, setMaterial] = useState(post?.material || "");
  const [price, setPrice] = useState(post?.price?.toString() || "");
  const [delivery, setDelivery] = useState(post?.attributes?.delivery_fee_amount?.toString() || "");
  const [internationalDelivery, setInternationalDelivery] = useState(post?.attributes?.international_delivery_fee_amount?.toString() || "");
  const [color, setColor] = useState(post?.attributes?.color || "");
  const [size, setSize] = useState(post?.attributes?.size || "");
  const [caption, setCaption] = useState(post?.caption || "");
  const [imageUrls, setImageUrls] = useState(post?.images?.length > 0 ? post.images.map(img => getAbsoluteImageUrl(img.url)) : initialSharedImageUrls);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState(post?.social_platform || sharedDraft?.platform || (sharedDraft?.socialUrl ? inferPlatformFromUrl(sharedDraft.socialUrl) : ""));
  const [selectedTemplate, setSelectedTemplate] = useState("default");
  const [bulkActionLoading, setBulkActionLoading] = useState(null);
  const [loading, setLoading] = useState(false);
  const [influencerQuery, setInfluencerQuery] = useState("");
  const [influencerSearching, setInfluencerSearching] = useState(false);
  const [influencerResults, setInfluencerResults] = useState([]);
  const [selectedInfluencer, setSelectedInfluencer] = useState(null);
  const [collabMessage, setCollabMessage] = useState("");
  const [collabSending, setCollabSending] = useState(false);
  const [sentRequestsForPost, setSentRequestsForPost] = useState([]);
  const [shopSocialHandles, setShopSocialHandles] = useState({
    instagram: "",
    facebook: "",
    pinterest: "",
    shipsInternationally: false,
  });
  const [shopExists, setShopExists] = useState(true);
  const appliedSharedDraftRef = useRef(sharedDraft?.receivedAt || null);

  const postId = useMemo(() => post?.id ?? post?.post_id ?? post?._id, [post]);

  const normalizeInfluencerSearchResponse = (res) => {
    if (!res) return [];
    if (Array.isArray(res)) return res;
    if (Array.isArray(res?.influencers)) return res.influencers;
    if (Array.isArray(res?.results)) return res.results;
    if (Array.isArray(res?.data)) return res.data;
    if (Array.isArray(res?.data?.influencers)) return res.data.influencers;
    if (Array.isArray(res?.data?.results)) return res.data.results;
    if (Array.isArray(res?.data?.data)) return res.data.data;
    return [];
  };

  const getInfluencerId = (i) => i?.shop_id ?? i?.influencer_shop_id ?? i?.id ?? i?._id;

  const getInfluencerLabel = (i) => {
    const name = i?.name || i?.shop_name || i?.title || 'Influencer';
    const username = i?.username || i?.handle || i?.slug;
    const city = i?.city || i?.location || '';
    const handleText = username ? `@${String(username).replace(/^@/, '')}` : '';
    const suffix = city ? ` · ${city}` : '';
    return `${String(name)}${handleText ? ` (${handleText})` : ''}${suffix}`;
  };

  const fetchSentRequestsForPost = useCallback(async () => {
    if (!isEditMode || postId == null) return;
    try {
      const res = await collaboration.getOutgoingRequests();
      const requests = res?.requests || res?.data?.requests || [];
      const filtered = (requests || []).filter((r) => {
        const pid = r?.post?.id ?? r?.post_id ?? r?.post?.post_id ?? r?.post?._id;
        return pid != null && String(pid) === String(postId);
      });
      setSentRequestsForPost(filtered);
    } catch (e) {
      setSentRequestsForPost([]);
    }
  }, [isEditMode, postId]);

  useEffect(() => {
    fetchSentRequestsForPost();
  }, [fetchSentRequestsForPost]);

  useEffect(() => {
    if (!isEditMode) return;

    const q = String(influencerQuery || '').trim();
    if (q.length < 2) {
      setInfluencerResults([]);
      return;
    }

    const handle = setTimeout(async () => {
      try {
        setInfluencerSearching(true);
        const cleaned = q.replace(/^@/, '');
        const res = await collaboration.searchInfluencers(cleaned);
        setInfluencerResults(normalizeInfluencerSearchResponse(res));
      } catch (e) {
        setInfluencerResults([]);
      } finally {
        setInfluencerSearching(false);
      }
    }, 300);

    return () => clearTimeout(handle);
  }, [influencerQuery, isEditMode]);

  const handleSendCollabRequest = useCallback(async () => {
    if (!isEditMode || postId == null) {
      Alert.alert('Error', 'Open an existing post to send collaboration requests.');
      return;
    }

    const influencerId = getInfluencerId(selectedInfluencer);
    if (influencerId == null) {
      Alert.alert('Error', 'Please select an influencer');
      return;
    }

    try {
      setCollabSending(true);
      await collaboration.createRequest({
        post_id: postId,
        influencer_shop_id: influencerId,
        ...(collabMessage.trim() ? { message: collabMessage.trim() } : {}),
      });
      setCollabMessage('');
      await fetchSentRequestsForPost();
    } catch (e) {
      Alert.alert('Error', e?.message || 'Failed to send collaboration request');
    } finally {
      setCollabSending(false);
    }
  }, [collabMessage, fetchSentRequestsForPost, isEditMode, postId, selectedInfluencer]);

  useEffect(() => {
    if (isEditMode || !sharedDraft?.receivedAt || appliedSharedDraftRef.current === sharedDraft.receivedAt) {
      return;
    }

    appliedSharedDraftRef.current = sharedDraft.receivedAt;

    if (sharedDraft.socialUrl) {
      setUrl(sharedDraft.socialUrl);
      setSelectedPlatform(sharedDraft.platform || inferPlatformFromUrl(sharedDraft.socialUrl));
    } else if (sharedDraft.platform) {
      setSelectedPlatform(sharedDraft.platform);
    }

    if (sharedDraft.title) {
      setTitle(sharedDraft.title);
    }

    if (sharedDraft.caption) {
      setCaption(sharedDraft.caption);
    }

    if (sharedDraft.imageUrls?.length > 0) {
      setImageUrls(ensureTrailingImageInput(sharedDraft.imageUrls));
    }
  }, [isEditMode, sharedDraft]);

  useEffect(() => {
    let isMounted = true;

    const fetchShopSocialHandles = async () => {
      try {
        const response = await shop.getMyShop();
        const shopResponse = response?.shop || {};
        if (!isMounted) {
          return;
        }

        setShopSocialHandles({
          instagram: normalizeCsvValue(shopResponse.instagram_handle ?? ''),
          facebook: normalizeCsvValue(shopResponse.facebook_handle ?? ''),
          pinterest: normalizeCsvValue(shopResponse.pinterest_handle ?? ''),
          shipsInternationally: Boolean(shopResponse.ships_internationally),
        });
        setShopExists(true);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        const msg = String(error?.message || '').toLowerCase();
        if (msg.includes('not found') || msg.includes('404') || msg.includes('no shop') || msg.includes('shop_not_created')) {
          setShopExists(false);
        } else {
          console.error("Error fetching shop social handles:", error);
        }
      }
    };

    fetchShopSocialHandles();

    return () => {
      isMounted = false;
    };
  }, []);

  const uploadImageFromUri = async (uri, fileName) => {
    const resolvedFileName = fileName || uri.split("/").pop()?.split("?")[0] || `image-${Date.now()}.jpg`;
    const fileAsset = {
      uri,
      name: resolvedFileName,
      type: getMimeTypeFromUri(resolvedFileName),
    };

    const res = await uploads.uploadInventoryImage(fileAsset);
    const publicUrl = res?.url ? res.url : null;

    if (!publicUrl) {
      throw new Error("Upload succeeded but no image URL was returned");
    }

    return getAbsoluteImageUrl(publicUrl);
  };

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

        const uploadedUrl = await uploadImageFromUri(
          uri,
          asset.fileName || uri.split('/').pop() || `image-${Date.now()}.jpg`
        );
        uploadedUrls.push(uploadedUrl);
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

  const handlePlatformPress = async (platform) => {
    setSelectedPlatform(platform.value);

    const configuredHandle = shopSocialHandles[platform.value];

    if (!configuredHandle) {
      Alert.alert("Handle not set", `Add your ${platform.label} handle in Shop Profile to open it here.`);
      return;
    }

    const webUrl = normalizeSocialHandleUrl(platform.value, configuredHandle);
    const nativeUrl = buildNativeSocialUrl(platform.value, configuredHandle);

    try {
      if (nativeUrl) {
        const canOpenNativeUrl = await Linking.canOpenURL(nativeUrl);

        if (canOpenNativeUrl) {
          await Linking.openURL(nativeUrl);
          return;
        }
      }

      const canOpenWebUrl = await Linking.canOpenURL(webUrl);

      if (canOpenWebUrl) {
        await Linking.openURL(webUrl);
        return;
      }

      throw new Error("No supported URL found");
    } catch (error) {
      console.error(`Error opening ${platform.value} handle:`, error);
      Alert.alert("Error", `Failed to open your ${platform.label} account.`);
    }
  };

  const createPostFromCsvRow = async (rowValues) => {
    const socialPlatformValue = normalizeCsvValue(rowValues.social_platform).toLowerCase();
    const socialUrl = normalizeCsvValue(rowValues.social_url);
    const titleValue = normalizeCsvValue(rowValues.title);
    const priceValue = parseOptionalNumber(rowValues.price);

    if (!socialPlatformValue) {
      throw new Error("Missing social_platform.");
    }

    if (!socialUrl) {
      throw new Error("Missing social_url.");
    }

    if (!titleValue) {
      throw new Error("Missing title.");
    }

    if (priceValue === null) {
      throw new Error("Missing or invalid price.");
    }

    const imageValues = normalizeCsvValue(rowValues.image_urls)
      ? rowValues.image_urls
          .split("|")
          .map((value) => normalizeCsvValue(value))
          .filter(Boolean)
      : [];

    const resolvedImageUrls = [];

    for (const rawImageUrl of imageValues) {
      if (isLocalFileUri(rawImageUrl)) {
        const uploadedUrl = await uploadImageFromUri(rawImageUrl);
        resolvedImageUrls.push(uploadedUrl);
        continue;
      }

      resolvedImageUrls.push(getAbsoluteImageUrl(rawImageUrl));
    }

    const postData = {
      title: titleValue,
      price: priceValue,
      attributes: {
        color: normalizeCsvValue(rowValues.color),
        size: normalizeCsvValue(rowValues.size),
        delivery_fee_amount: parseOptionalNumber(rowValues.delivery_fee_amount) ?? 0,
      },
      images: resolvedImageUrls.map((resolvedUrl, index) => ({
        url: resolvedUrl,
        sort_order: index + 1,
      })),
      caption: normalizeCsvValue(rowValues.caption),
      material: normalizeCsvValue(rowValues.material),
      social_platform: socialPlatformValue,
      social_url: socialUrl,
    };

    const templateValue = normalizeCsvValue(rowValues.template);
    const currencyValue = normalizeCsvValue(rowValues.currency).toUpperCase();
    const patternValue = normalizeCsvValue(rowValues.pattern);
    const modelNumberValue = normalizeCsvValue(rowValues.model_number);
    const warrantyMonthsValue = parseOptionalNumber(rowValues.warranty_months);
    const expiryDateValue = normalizeCsvValue(rowValues.expiry_date);

    // if (templateValue) {
    //   postData.template = templateValue;
    // }

    // if (currencyValue) {
    //   postData.currency = currencyValue;
    // }

    // if (patternValue) {
    //   postData.pattern = patternValue;
    // }

    // if (modelNumberValue) {
    //   postData.model_number = modelNumberValue;
    // }

    // if (warrantyMonthsValue !== null) {
    //   postData.warranty_months = warrantyMonthsValue;
    // }

    // if (expiryDateValue) {
    //   postData.expiry_date = expiryDateValue;
    // }
    return inventory.createPost(postData);
  };

  const handleCreatePost = async () => {
    // Validation
    if (!isEditMode && !selectedPlatform.trim()) {
      Alert.alert('Error', 'Please select a social platform');
      return;
    }
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
      
      const validImageUrls = imageUrls.filter(url => url.trim() !== "");
      const resolvedImageUrls = [];

      for (const rawImageUrl of validImageUrls) {
        const trimmedImageUrl = rawImageUrl.trim();

        if (isLocalFileUri(trimmedImageUrl)) {
          const uploadedUrl = await uploadImageFromUri(trimmedImageUrl);
          resolvedImageUrls.push(uploadedUrl);
          continue;
        }

        resolvedImageUrls.push(getAbsoluteImageUrl(trimmedImageUrl));
      }

      const images = resolvedImageUrls.map((url, index) => ({
        url,
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

      if (shopSocialHandles.shipsInternationally) {
        postData.attributes.international_delivery_fee_amount = internationalDelivery ? parseFloat(internationalDelivery) : 0;
      }

      // Include social fields for both create and edit
      postData.social_platform = selectedPlatform;
      postData.social_url = url;

      let response;
      if (isEditMode) {
        response = await inventory.updatePost(post.id, postData);
      } else {
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
        setInternationalDelivery("");
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

  const promptBulkCsvDownloadAction = () => {
    return new Promise((resolve) => {
      let settled = false;

      const finish = (value) => {
        if (settled) return;
        settled = true;
        resolve(value);
      };

      Alert.alert(
        "Download format",
        "Choose how you want to save the CSV template.",
        [
          {
            text: "Cancel",
            style: "cancel",
            onPress: () => finish(null),
          },
          {
            text: "Save to folder",
            onPress: () => finish("save"),
          },
          {
            text: "Share / other apps",
            onPress: () => finish("share"),
          },
        ],
        {
          cancelable: true,
          onDismiss: () => finish(null),
        }
      );
    });
  };

  const prepareBulkCsvTempFile = async () => {
    const targetDirectory = FileSystem.documentDirectory || FileSystem.cacheDirectory;
    const fileUri = `${targetDirectory}${BULK_CSV_TEMPLATE_FILE_NAME}`;

    await FileSystem.writeAsStringAsync(fileUri, BULK_CSV_TEMPLATE, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    return fileUri;
  };

  const saveBulkCsvToAndroidStorage = async () => {
    const { StorageAccessFramework } = FileSystem;

    if (!StorageAccessFramework) {
      return null;
    }

    const initialDirectoryUri = StorageAccessFramework.getUriForDirectoryInRoot("Download");
    const permission = await StorageAccessFramework.requestDirectoryPermissionsAsync(initialDirectoryUri);

    if (!permission.granted) {
      return false;
    }

    let fileName = BULK_CSV_TEMPLATE_FILE_NAME;
    let fileUri;

    try {
      fileUri = await StorageAccessFramework.createFileAsync(
        permission.directoryUri,
        fileName,
        "text/csv"
      );
    } catch (error) {
      fileName = getTimestampedBulkCsvFileName();
      fileUri = await StorageAccessFramework.createFileAsync(
        permission.directoryUri,
        fileName,
        "text/csv"
      );
    }

    await FileSystem.writeAsStringAsync(fileUri, BULK_CSV_TEMPLATE, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    return fileName;
  };

  const handleDownloadBulkCsvFormat = async () => {
    try {
      setBulkActionLoading("download");

      const action = Platform.OS === "android"
        ? await promptBulkCsvDownloadAction()
        : "share";

      if (!action) {
        return;
      }

      if (Platform.OS === "android" && action === "save") {
        const savedFileName = await saveBulkCsvToAndroidStorage();

        if (savedFileName === false) {
          Alert.alert("Cancelled", "No folder was selected for saving the CSV file.");
          return;
        }

        if (savedFileName) {
          Alert.alert("Saved", `${savedFileName} has been saved to the selected folder.`);
          return;
        }
      }

      const fileUri = await prepareBulkCsvTempFile();

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: "text/csv",
          dialogTitle: "Download CSV format",
        });
      } else {
        Alert.alert("Format ready", "CSV template saved on your device.");
      }
    } catch (error) {
      console.error("Error downloading CSV template:", error);
      Alert.alert("Error", "Failed to prepare the CSV format. Please try again.");
    } finally {
      setBulkActionLoading(null);
    }
  };

  const handleUploadBulkCsv = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["text/csv", "text/comma-separated-values", "application/csv", "application/vnd.ms-excel"],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled) {
        return;
      }

      const pickedFile = result.assets?.[0];

      if (!pickedFile?.uri) {
        Alert.alert("Error", "No CSV file was selected.");
        return;
      }

      if (!isCsvFileAsset(pickedFile)) {
        Alert.alert("Invalid file", "Please select a CSV file.");
        return;
      }

      setBulkActionLoading("upload");

      const csvContent = await FileSystem.readAsStringAsync(pickedFile.uri, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      const rows = parseBulkCsvRows(csvContent);

      if (rows.length === 0) {
        Alert.alert("Error", "CSV file does not contain any data rows.");
        return;
      }

      let createdCount = 0;
      const failedRows = [];
      for (const row of rows) {
        try {
          await createPostFromCsvRow(row.values);
          createdCount += 1;
        } catch (error) {
          console.error(`Error creating post for row ${row.rowNumber}:`, error);
          failedRows.push({
            rowNumber: row.rowNumber,
            message: error.message || "Failed to create post.",
          });
        }
      }

      if (createdCount > 0 && failedRows.length === 0) {
        Alert.alert(
          "Success",
          `${createdCount} post${createdCount === 1 ? "" : "s"} created successfully.`,
          [
            {
              text: "OK",
              onPress: () => navigation.goBack(),
            },
          ]
        );
        return;
      }

      const summaryLines = [];

      if (createdCount > 0) {
        summaryLines.push(`${createdCount} post${createdCount === 1 ? "" : "s"} created successfully.`);
      }

      if (failedRows.length > 0) {
        summaryLines.push(`${failedRows.length} row${failedRows.length === 1 ? "" : "s"} failed.`);
        failedRows.slice(0, 3).forEach((failedRow) => {
          summaryLines.push(`Row ${failedRow.rowNumber}: ${failedRow.message}`);
        });

        if (failedRows.length > 3) {
          summaryLines.push(`+${failedRows.length - 3} more error${failedRows.length - 3 === 1 ? "" : "s"}`);
        }
      }

      Alert.alert(
        createdCount > 0 ? "Partial import complete" : "Import failed",
        summaryLines.join("\n") || "No posts were created."
      );
    } catch (error) {
      console.error("Error uploading CSV:", error);
      Alert.alert("Error", error.message || "Failed to upload CSV. Please try again.");
    } finally {
      setBulkActionLoading(null);
    }
  };

  const platforms = [
    { value: "instagram", label: "Instagram", icon: "instagram", color: "#e1306c" },
    { value: "facebook", label: "Facebook", icon: "facebook", color: "#1877f2" },
    { value: "pinterest", label: "Pinterest", icon: "pinterest", color: "#e60023" },
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
      {!shopExists && (
        <View style={styles.notificationBanner}>
          <Text style={styles.notificationText}>Create your shop first</Text>
        </View>
      )}
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

            {!isEditMode && (
              <View style={styles.bulkCard}>
                <Text style={styles.bulkTitle}>Bulk create posts</Text>
                <Text style={styles.helperText}>
                  Download the CSV format, fill multiple rows, then upload the file to create posts in bulk.
                </Text>

                <View style={styles.bulkActionsRow}>
                  <TouchableOpacity
                    style={styles.bulkActionButton}
                    onPress={handleDownloadBulkCsvFormat}
                    disabled={loading || bulkActionLoading !== null}
                    activeOpacity={0.9}
                  >
                    {bulkActionLoading === "download" ? (
                      <ActivityIndicator size="small" color="#111827" />
                    ) : (
                      <Feather name="download" size={22} color="#111827" />
                    )}
                    <Text style={styles.bulkActionText}>Download format</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.bulkActionButton}
                    onPress={handleUploadBulkCsv}
                    disabled={loading || bulkActionLoading !== null}
                    activeOpacity={0.9}
                  >
                    {bulkActionLoading === "upload" ? (
                      <ActivityIndicator size="small" color="#111827" />
                    ) : (
                      <Feather name="upload" size={22} color="#111827" />
                    )}
                    <Text style={styles.bulkActionText}>Upload CSV</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

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
                      onPress={() => handlePlatformPress(platform)}
                      activeOpacity={0.9}
                    >
                      <FontAwesome
                        name={platform.icon}
                        size={16}
                        color={platform.color}
                      />
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>


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

            {shopSocialHandles.shipsInternationally && (
              <>
                <Text style={styles.label}>International delivery fee (₹)</Text>

                <TextInput
                  style={styles.input}
                  placeholder="0"
                  keyboardType="numeric"
                  value={internationalDelivery}
                  onChangeText={setInternationalDelivery}
                />

                <Text style={styles.helperText}>
                  This is shown because international delivery is enabled in Shop Profile.
                </Text>
              </>
            )}


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

          {isEditMode ? (
            <View style={styles.collabCard}>
              <Text style={styles.collabEyebrow}>Collaborations</Text>
              <Text style={styles.collabTitle}>Request influencer promotion</Text>
              <Text style={styles.collabDescription}>
                Search by influencer name or username and send a collaboration request for this product.
              </Text>

              <TextInput
                style={styles.collabSearchInput}
                value={influencerQuery}
                onChangeText={setInfluencerQuery}
                placeholder="Search influencers"
                placeholderTextColor="#9ca3af"
                autoCapitalize="none"
                autoCorrect={false}
              />

              {influencerSearching ? (
                <View style={styles.collabLoadingRow}>
                  <ActivityIndicator size="small" color="#111827" />
                  <Text style={styles.collabLoadingText}>Searching...</Text>
                </View>
              ) : null}

              {(influencerResults || []).slice(0, 5).map((item) => {
                const iid = getInfluencerId(item);
                const selectedId = getInfluencerId(selectedInfluencer);
                const isSelected = iid != null && selectedId != null && String(iid) === String(selectedId);

                return (
                  <TouchableOpacity
                    key={String(iid ?? getInfluencerLabel(item))}
                    style={[styles.collabResultPill, isSelected && styles.collabResultPillSelected]}
                    activeOpacity={0.9}
                    onPress={() => setSelectedInfluencer(item)}
                  >
                    <Text style={styles.collabResultText} numberOfLines={1}>
                      {getInfluencerLabel(item)}
                    </Text>
                  </TouchableOpacity>
                );
              })}

              <TextInput
                style={styles.collabMessageInput}
                value={collabMessage}
                onChangeText={setCollabMessage}
                placeholder="Optional message..."
                placeholderTextColor="#9ca3af"
                multiline
              />

              <View style={styles.collabFooterRow}>
                <Text style={styles.collabSelectedText} numberOfLines={1}>
                  Selected:{' '}
                  {selectedInfluencer ? getInfluencerLabel(selectedInfluencer) : 'None'}
                </Text>
                <TouchableOpacity
                  style={[styles.collabSendButton, collabSending && styles.collabSendButtonDisabled]}
                  onPress={handleSendCollabRequest}
                  disabled={collabSending}
                  activeOpacity={0.9}
                >
                  {collabSending ? (
                    <ActivityIndicator size="small" color="#111827" />
                  ) : (
                    <Text style={styles.collabSendButtonText}>Send</Text>
                  )}
                </TouchableOpacity>
              </View>

              <View style={styles.collabDivider} />
              <Text style={styles.collabSectionTitle}>Sent requests</Text>
              {sentRequestsForPost.length === 0 ? (
                <Text style={styles.collabEmptyText}>No requests sent for this product yet.</Text>
              ) : (
                (sentRequestsForPost || []).map((r) => {
                  const status = r?.status ? String(r.status).toUpperCase() : '';
                  const toName = r?.influencer?.name || r?.influencer_shop?.name || '';
                  const rowLabel = toName ? `To ${toName}` : 'Request';
                  return (
                    <View key={String(r?.id)} style={styles.collabSentRow}>
                      <Text style={styles.collabSentRowText} numberOfLines={1}>
                        {rowLabel}
                      </Text>
                      <Text style={styles.collabSentStatus}>
                        {status || '—'}
                      </Text>
                    </View>
                  );
                })
              )}
            </View>
          ) : null}

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

  collabCard: {
    backgroundColor: "#f4f4f4",
    borderRadius: 22,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },

  collabEyebrow: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "600",
  },

  collabTitle: {
    fontSize: 16,
    color: "#111827",
    fontWeight: "700",
    marginTop: 8,
  },

  collabDescription: {
    fontSize: 12,
    color: "#4b5563",
    marginTop: 10,
    lineHeight: 20,
  },

  collabSearchInput: {
    backgroundColor: "#fff",
    borderRadius: 22,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    fontSize: 12,
    marginTop: 16,
  },

  collabLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
  },

  collabLoadingText: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '600',
  },

  collabResultPill: {
    backgroundColor: "#fff",
    borderRadius: 22,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginTop: 12,
  },

  collabResultPillSelected: {
    borderColor: '#fb923c',
  },

  collabResultText: {
    fontSize: 12,
    color: '#111827',
    fontWeight: '600',
  },

  collabMessageInput: {
    backgroundColor: "#fff",
    borderRadius: 22,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: "#fbbf24",
    fontSize: 12,
    marginTop: 14,
    minHeight: 110,
    textAlignVertical: 'top',
  },

  collabFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 14,
  },

  collabSelectedText: {
    flex: 1,
    fontSize: 12,
    color: '#4b5563',
    fontWeight: '600',
  },

  collabSendButton: {
    backgroundColor: '#fbbf24',
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },

  collabSendButtonDisabled: {
    opacity: 0.7,
  },

  collabSendButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111827',
  },

  collabDivider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginTop: 18,
  },

  collabSectionTitle: {
    marginTop: 16,
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
  },

  collabEmptyText: {
    marginTop: 10,
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },

  collabSentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginTop: 10,
  },

  collabSentRowText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
  },

  collabSentStatus: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6b7280',
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

  bulkCard: {
    marginTop: 20,
    backgroundColor: "#f8f8f8",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb"
  },

  bulkTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827"
  },

  bulkActionsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
  },

  bulkActionButton: {
    flex: 1,
    minHeight: 88,
    backgroundColor: "#ffffff",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    paddingHorizontal: 18,
    paddingVertical: 16,
    justifyContent: "space-between",
    alignItems: "flex-start",
  },

  bulkActionText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#111827",
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
    fontSize: 14,
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
    fontSize: 14,
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

  notificationBanner: {
    backgroundColor: '#fef3c7',
    padding: 12,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f59e0b',
  },

  notificationText: {
    fontSize: 14,
    color: '#92400e',
    textAlign: 'center',
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