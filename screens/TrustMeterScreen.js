import React, { useState, useCallback, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, Alert, Image } from "react-native";
import { Feather } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { TextInput } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { API_BASE, verification, uploads } from '../services/api';
import { useNavigation } from "@react-navigation/native";
import { useAuth } from '../contexts/AuthContext';

const getVerificationItemType = (title = "") => {
  const normalizedTitle = title.toLowerCase();

  if (normalizedTitle.includes("gst")) return "gst";
  if (normalizedTitle.includes("social proof") || normalizedTitle.includes("social profile") || normalizedTitle.includes("profile url")) return "socialProof";
  if (normalizedTitle.includes("follower")) return "followers";
  if (normalizedTitle.includes("shop photo") || normalizedTitle.includes("physical shop")) return "shopPhotos";

  return null;
};

const getMimeTypeFromUri = (value = "") => {
  const sanitizedValue = value.split("?")[0];
  const ext = (sanitizedValue.split(".").pop() || "jpg").toLowerCase();

  if (["png"].includes(ext)) return "image/png";
  if (["webp"].includes(ext)) return "image/webp";
  if (["heic", "heif"].includes(ext)) return "image/heic";

  return "image/jpeg";
};

const ensureTrailingImageInput = (values = []) => {
  const nonEmptyValues = (values || []).filter((value) => (value || "").trim() !== "");
  return nonEmptyValues.length > 0 ? [...nonEmptyValues, ""] : [""];
};

const getAbsoluteImageUrl = (value) => {
  if (!value) return "";
  if (/^https?:\/\//i.test(value) || /^(file|content):\/\//i.test(value) || /^data:/i.test(value)) return value;
  return `${API_BASE}${value.startsWith("/") ? value : `/${value}`}`;
};

export default function VerificationScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();

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

  const isInfluencer = resolveAccountType(user) === 'influencer';

  const getEffectiveVerificationItemType = (title = "") => {
    const normalizedTitle = (title || "").toLowerCase();

    if (isInfluencer) {
      if (
        normalizedTitle.includes('aadhaar') ||
        normalizedTitle.includes('aadhar') ||
        normalizedTitle.includes('government id')
      ) {
        return 'govId';
      }
      if (normalizedTitle.includes('face')) return 'facePhotos';
      if (normalizedTitle.includes('social proof') || normalizedTitle.includes('social profile') || normalizedTitle.includes('profile url')) return 'socialProof';
      if (normalizedTitle.includes('follower')) return 'followers';
      if (normalizedTitle.includes('gst')) return 'govId';
      if (normalizedTitle.includes('shop photo') || normalizedTitle.includes('physical shop')) return 'facePhotos';
    }

    return getVerificationItemType(title);
  };

  const [verificationItems, setVerificationItems] = useState([
    // { title: "Verified status", points: 10, done: true },
    // { title: "GST number + documents", points: 20, done: true },
    // { title: "Physical shop photos", points: 15, done: false },
    // { title: "Social proof URL", points: 10, done: true },

    // { title: "Followers (10k+)", points: 5, done: false },
    // { title: "Contact info (phone/email)", points: 5, done: true },
    // { title: "Address + city", points: 5, done: true },
    // { title: "Listings (5+)", points: 5, done: false },
    // { title: "Active recently (30d)", points: 5, done: true },

    // { title: "Low cancellations", points: 10, done: false },
    // { title: "Customer reviews", points: 10, done: false }
  ]);
  
  const [totalScore, setTotalScore] = useState(0);
  const [progress, setProgress] = useState(0);
  const [shopStatus, setShopStatus] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [submission, setSubmission] = useState(null);

  const [gstNumber, setGstNumber] = useState("");
  const [gstDocumentUrl, setGstDocumentUrl] = useState("");
  const [socialProofUrl, setSocialProofUrl] = useState("");
  const [followerCount, setFollowerCount] = useState("");
  const [shopPhotoUrls, setShopPhotoUrls] = useState([""]);

  const [savingDraft, setSavingDraft] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingShopPhotos, setUploadingShopPhotos] = useState(false);
  const [isEditingVerification, setIsEditingVerification] = useState(false);

  useEffect(()=>{
    fetchVerificationData();
  }, []);

  const buildPayload = () => {
    const cleanedShopPhotoUrls = (shopPhotoUrls || [])
      .map((u) => (u || "").trim())
      .filter(Boolean);

    return {
      gst_number: (gstNumber || "").trim(),
      gst_document_url: (gstDocumentUrl || "").trim(),
      shop_photo_urls: cleanedShopPhotoUrls,
      social_proof_url: (socialProofUrl || "").trim(),
      follower_count: followerCount === "" ? null : Number(followerCount),
    };
  };

  const validateForSubmit = (payload) => {
    if (!payload.gst_number) return "GST number is required.";
    if (!payload.gst_document_url) return "GST certificate URL is required.";
    if (!payload.social_proof_url) return "Social proof URL is required.";
    if (!payload.follower_count || Number.isNaN(payload.follower_count)) return "Follower count is required.";
    if (!Array.isArray(payload.shop_photo_urls) || payload.shop_photo_urls.length === 0) return "At least 1 shop photo URL is required.";
    return null;
  };

  const handleSaveDraft = async () => {
    try {
      if (savingDraft || submitting) return;
      setSavingDraft(true);
      const payload = buildPayload();
      await verification.saveDraft(payload);
      setIsEditingVerification(false);
      Alert.alert("Saved", "Draft saved successfully");
      fetchVerificationData();
    } catch (error) {
      console.error('Error saving draft:', error);
      Alert.alert("Error", "Failed to save draft");
    } finally {
      setSavingDraft(false);
    }
  };

  const handleSubmitForReview = async () => {
    try {
      if (savingDraft || submitting) return;
      setSubmitting(true);
      const payload = buildPayload();
      const validationError = validateForSubmit(payload);
      if (validationError) {
        Alert.alert("Validation", validationError);
        return;
      }
      await verification.submitForReview(payload);
      setIsEditingVerification(false);
      Alert.alert("Submitted", "Submitted for review successfully");
      fetchVerificationData();
    } catch (error) {
      console.error('Error submitting for review:', error);
      Alert.alert("Error", "Failed to submit for review");
    } finally {
      setSubmitting(false);
    }
  };

  const updateShopPhotoUrl = (index, value) => {
    setShopPhotoUrls((prev) => {
      const next = [...(prev || [])];
      next[index] = value;
      return next;
    });
  };

  const addShopPhotoUrl = () => {
    setShopPhotoUrls((prev) => ([...(prev || []), ""]));
  };

  const removeShopPhotoUrl = (index) => {
    setShopPhotoUrls((prev) => {
      const next = (prev || []).filter((_, currentIndex) => currentIndex !== index);
      return next.length > 0 ? ensureTrailingImageInput(next) : [""];
    });
  };

  const uploadShopPhotoFromUri = async (uri, fileName) => {
    const resolvedFileName = fileName || uri.split("/").pop()?.split("?")[0] || `shop-photo-${Date.now()}.jpg`;
    const fileAsset = {
      uri,
      name: resolvedFileName,
      type: getMimeTypeFromUri(resolvedFileName),
    };

    const response = await uploads.uploadShopPhoto(fileAsset);
    const publicUrl = response?.url ? response.url : null;

    if (!publicUrl) {
      throw new Error("Upload succeeded but no image URL was returned");
    }

    return getAbsoluteImageUrl(publicUrl);
  };

  const pickAndUploadShopPhotos = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permission.status !== "granted") {
        Alert.alert("Permission required", "Gallery permission is required to pick images");
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
          asset.fileName || uri.split("/").pop() || `shop-photo-${Date.now()}.jpg`
        );
        uploadedUrls.push(uploadedUrl);
      }

      if (uploadedUrls.length === 0) {
        Alert.alert("Error", "No images were uploaded");
        return;
      }

      setShopPhotoUrls((prev) => {
        const existing = (prev || []).filter((value) => (value || "").trim() !== "");
        return [...existing, ...uploadedUrls, ""];
      });
    } catch (error) {
      console.error("Error picking/uploading shop photos:", error);
      Alert.alert("Error", "Failed to upload shop photos");
    } finally {
      setUploadingShopPhotos(false);
    }
  };

  const hydrateFormFromSubmission = (submission) => {
    if (!submission) return;

    setGstNumber(submission?.gst_number || "");
    setGstDocumentUrl(submission?.gst_document_url || "");
    setSocialProofUrl(submission?.social_proof_url || "");
    setFollowerCount(
      submission?.follower_count !== null && submission?.follower_count !== undefined
        ? String(submission.follower_count)
        : ""
    );

    const urls = Array.isArray(submission?.shop_photo_urls)
      ? submission.shop_photo_urls.filter(Boolean)
      : [];
    setShopPhotoUrls(ensureTrailingImageInput(urls));
  };

  const fetchVerificationData = async()=>{
    try {
      const response = await verification.getVerificationStatus();
      
      // Extract data from API response
      const trustMeterData = response?.trust_meter || {};
      const submissionData = response?.submission || {};
      const apiShopStatus = response?.shop_status || null;
      
      // Update verification items with real data
      const updatedVerificationItems = trustMeterData.checks?.map(check => ({
        title: check.label,
        points: check.points,
        done: check.done
      })) || verificationItems;
      
      // Update total score and progress
      const apiTotalScore = trustMeterData.score || 0;
      const apiProgress = apiTotalScore / 100;
      
      // Set state with API data
      setVerificationItems(updatedVerificationItems);
      setTotalScore(apiTotalScore);
      setProgress(apiProgress);
      setShopStatus(apiShopStatus);

      setSubmission(submissionData);
      hydrateFormFromSubmission(submissionData);
    } catch (error) {
      console.error('Error fetching verification status:', error);
    } finally {
      setRefreshing(false);
    }
  }

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchVerificationData();
  }, []);

  const StatusBadge = ({ done }) => (
    <View
      style={[
        styles.badge,
        done ? styles.doneBadge : styles.missingBadge
      ]}
    >
      <Text
        style={[
          styles.badgeText,
          done ? styles.doneText : styles.missingText
        ]}
      >
        {done ? "Done" : "Missing"}
      </Text>
    </View>
  );

  const submissionStatus =
    submission?.status ||
    submission?.submission_status ||
    null;

  const effectiveStatus = shopStatus || submissionStatus;

  const isInReview =
    effectiveStatus === 'SUBMITTED' ||
    !!submission?.submitted_at;

  useEffect(() => {
    if (effectiveStatus === 'VERIFIED') {
      setIsEditingVerification(false);
    }
  }, [effectiveStatus]);

  const editableItemIndexes = verificationItems.reduce((indexes, item, index) => {
    if (getEffectiveVerificationItemType(item.title)) {
      indexes.push(index);
    }

    return indexes;
  }, []);

  const lastEditableItemIndex = editableItemIndexes[editableItemIndexes.length - 1] ?? -1;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.customHeader}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Feather name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Trust Meter</Text>
        <View style={styles.headerSpacer} />
      </View>
      <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.smallTitle}>Trust & Verification</Text>
            {effectiveStatus === 'VERIFIED' ? (
              <View style={styles.verifiedBadge}>
                <Feather name="check-circle" size={16} color="#1c7c54" />
                <Text style={styles.verifiedText}>Verified</Text>
              </View>
            ) : isInReview ? (
              <View style={styles.inReviewBadge}>
                <Feather name="clock" size={16} color="#b45309" />
                <Text style={styles.inReviewText}>In Review</Text>
              </View>
            ) : (
              <View style={styles.pendingBadge}>
                <Feather name="clock" size={16} color="#dc2626" />
                <Text style={styles.pendingText}>Pending</Text>
              </View>
            )}
          </View>
          <Text style={styles.title}>Blue Tick submission</Text>
          <Text style={styles.description}>
            Manual verification to prevent scams and unlock marketplace trust.
          </Text>
          <View style={styles.trustBox}>

            <View style={styles.rowBetween}>
              <Text style={styles.trustTitle}>Trust meter</Text>
              <Text style={styles.target}>Target: 80+ for fast approval</Text>
            </View>

            <Text style={styles.score}>{totalScore} / 100</Text>

            <View style={styles.progressBar}>
              <View
                style={[styles.progressFill, { width: `${progress * 100}%` }]}
              />
            </View>

            {verificationItems.map((item, index) => {
              const itemType = getEffectiveVerificationItemType(item.title);
              const isEditableItem = shopStatus !== 'VERIFIED' && !!itemType;
              const showInlineEditor = isEditableItem && isEditingVerification;
              const showActionRow = showInlineEditor && index === lastEditableItemIndex;

              return (
                <View key={index} style={[styles.item, showInlineEditor && styles.itemExpanded]}>
                  <View style={styles.itemHeader}>
                    <View style={styles.itemContent}>
                      <Text style={styles.itemTitle} ellipsizeMode="tail" numberOfLines={1}>{item.title}</Text>
                      <Text style={styles.points}>{item.points} pts</Text>
                    </View>

                    <View style={styles.itemMeta}>
                      {isEditableItem && (
                        <View style={styles.inlineEditBtnWrap}>
                          <TouchableOpacity
                            style={styles.inlineEditBtn}
                            onPress={() => setIsEditingVerification((prev) => !prev)}
                            disabled={savingDraft || submitting}
                          >
                            <Text style={styles.inlineEditBtnText}>{isEditingVerification ? 'Hide' : 'Edit'}</Text>
                          </TouchableOpacity>
                        </View>
                      )}

                      <StatusBadge done={item.done} />
                    </View>
                  </View>

                  {showInlineEditor && itemType === 'gst' && (
                    <View style={styles.itemForm}>
                      <Text style={styles.inlineInputLabel}>GST number</Text>
                      <TextInput
                        placeholder="GSTIN"
                        style={styles.input}
                        placeholderTextColor="#9ca3af"
                        value={gstNumber}
                        onChangeText={setGstNumber}
                      />

                      <Text style={styles.inlineInputLabel}>GST certificate URL</Text>
                      <TextInput
                        placeholder="https://..."
                        style={styles.input}
                        placeholderTextColor="#9ca3af"
                        value={gstDocumentUrl}
                        onChangeText={setGstDocumentUrl}
                      />
                    </View>
                  )}

                  {showInlineEditor && itemType === 'govId' && (
                    <View style={styles.itemForm}>
                      <Text style={styles.inlineInputLabel}>Aadhaar number</Text>
                      <TextInput
                        placeholder="Aadhaar number"
                        style={styles.input}
                        placeholderTextColor="#9ca3af"
                        value={gstNumber}
                        onChangeText={setGstNumber}
                      />

                      <Text style={styles.inlineInputLabel}>Aadhaar document URL</Text>
                      <TextInput
                        placeholder="https://..."
                        style={styles.input}
                        placeholderTextColor="#9ca3af"
                        value={gstDocumentUrl}
                        onChangeText={setGstDocumentUrl}
                      />
                    </View>
                  )}

                  {showInlineEditor && itemType === 'socialProof' && (
                    <View style={styles.itemForm}>
                      <Text style={styles.inlineInputLabel}>Social proof URL</Text>
                      <TextInput
                        placeholder="Instagram profile / press / etc"
                        style={styles.input}
                        placeholderTextColor="#9ca3af"
                        value={socialProofUrl}
                        onChangeText={setSocialProofUrl}
                      />
                    </View>
                  )}

                  {showInlineEditor && itemType === 'followers' && (
                    <View style={styles.itemForm}>
                      <Text style={styles.inlineInputLabel}>Follower count</Text>
                      <TextInput
                        placeholder="10000"
                        style={styles.input}
                        keyboardType="numeric"
                        placeholderTextColor="#9ca3af"
                        value={followerCount}
                        onChangeText={setFollowerCount}
                      />
                    </View>
                  )}

                  {showInlineEditor && itemType === 'shopPhotos' && (
                    <View style={styles.itemForm}>
                      <View style={styles.shopPhotoCard}>
                          <View style={styles.inlinePhotoCopy}>
                            <Text style={styles.shopPhotoTitle}>Physical shop photos</Text>
                            <Text style={styles.shopPhotoDesc}>Pick from your device or paste photo URLs.</Text>
                          </View>
                        <View style={styles.shopPhotoHeader}>
                          <View style={styles.shopPhotoActions}>
                            {/* <TouchableOpacity
                              style={styles.uploadActionBtn}
                              onPress={pickAndUploadShopPhotos}
                              disabled={uploadingShopPhotos || savingDraft || submitting}
                            >
                              {uploadingShopPhotos ? (
                                <ActivityIndicator size="small" color="#111827" />
                              ) : (
                                <>
                                  <Feather name="plus" size={18} color="#111827" />
                                  <Text style={styles.uploadActionBtnText}>Upload</Text>
                                </>
                              )}
                            </TouchableOpacity> */}

                            <TouchableOpacity
                              style={styles.uploadActionBtn}
                              onPress={addShopPhotoUrl}
                              disabled={uploadingShopPhotos || savingDraft || submitting}
                            >
                              <Text style={styles.uploadActionBtnText}>Add URL</Text>
                            </TouchableOpacity>
                          </View>
                        </View>

                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.shopPhotoThumbRow}>
                          <TouchableOpacity
                            style={styles.shopPhotoAddTile}
                            onPress={pickAndUploadShopPhotos}
                            disabled={uploadingShopPhotos || savingDraft || submitting}
                            activeOpacity={0.9}
                          >
                            {uploadingShopPhotos ? (
                              <ActivityIndicator size="small" color="#4b5563" />
                            ) : (
                              <Feather name="plus" size={28} color="#4b5563" />
                            )}
                          </TouchableOpacity>

                          {shopPhotoUrls.map((value, idx) => {
                            if ((value || '').trim() === '') {
                              return null;
                            }

                            return (
                              <View key={`${value}-${idx}`} style={styles.shopPhotoThumbTile}>
                                <Image source={{ uri: getAbsoluteImageUrl(value) }} style={styles.shopPhotoThumbImage} />
                                <TouchableOpacity
                                  style={styles.shopPhotoThumbRemove}
                                  onPress={() => removeShopPhotoUrl(idx)}
                                  disabled={uploadingShopPhotos || savingDraft || submitting}
                                >
                                  <Feather name="x" size={14} color="#fff" />
                                </TouchableOpacity>
                              </View>
                            );
                          })}
                        </ScrollView>

                        {shopPhotoUrls.map((url, idx) => (
                          <View key={idx} style={styles.shopPhotoInputRow}>
                            <TextInput
                              placeholder="https://..."
                              style={styles.shopPhotoInput}
                              placeholderTextColor="#9ca3af"
                              value={url}
                              editable={!(uploadingShopPhotos || savingDraft || submitting)}
                              onChangeText={(text) => updateShopPhotoUrl(idx, text)}
                            />

                            {shopPhotoUrls.length > 1 && (
                              <TouchableOpacity
                                style={styles.shopPhotoRemoveBtn}
                                onPress={() => removeShopPhotoUrl(idx)}
                                disabled={uploadingShopPhotos || savingDraft || submitting}
                              >
                                <Feather name="x" size={16} color="#666" />
                              </TouchableOpacity>
                            )}
                          </View>
                        ))}
                      </View>
                    </View>
                  )}

                  {showInlineEditor && itemType === 'facePhotos' && (
                    <View style={styles.itemForm}>
                      <View style={styles.shopPhotoCard}>
                          <View style={styles.inlinePhotoCopy}>
                            <Text style={styles.shopPhotoTitle}>Face verification photos</Text>
                            <Text style={styles.shopPhotoDesc}>Upload clear face photos for admin identity verification.</Text>
                          </View>
                        <View style={styles.shopPhotoHeader}>
                          <View style={styles.shopPhotoActions}>
                            <TouchableOpacity
                              style={styles.uploadActionBtn}
                              onPress={addShopPhotoUrl}
                              disabled={uploadingShopPhotos || savingDraft || submitting}
                            >
                              <Text style={styles.uploadActionBtnText}>Add URL</Text>
                            </TouchableOpacity>
                          </View>
                        </View>

                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.shopPhotoThumbRow}>
                          <TouchableOpacity
                            style={styles.shopPhotoAddTile}
                            onPress={pickAndUploadShopPhotos}
                            disabled={uploadingShopPhotos || savingDraft || submitting}
                            activeOpacity={0.9}
                          >
                            {uploadingShopPhotos ? (
                              <ActivityIndicator size="small" color="#4b5563" />
                            ) : (
                              <Feather name="plus" size={28} color="#4b5563" />
                            )}
                          </TouchableOpacity>

                          {shopPhotoUrls.map((value, idx) => {
                            if ((value || '').trim() === '') {
                              return null;
                            }

                            return (
                              <View key={`${value}-${idx}`} style={styles.shopPhotoThumbTile}>
                                <Image source={{ uri: getAbsoluteImageUrl(value) }} style={styles.shopPhotoThumbImage} />
                                <TouchableOpacity
                                  style={styles.shopPhotoThumbRemove}
                                  onPress={() => removeShopPhotoUrl(idx)}
                                  disabled={uploadingShopPhotos || savingDraft || submitting}
                                >
                                  <Feather name="x" size={14} color="#fff" />
                                </TouchableOpacity>
                              </View>
                            );
                          })}
                        </ScrollView>

                        {shopPhotoUrls.map((url, idx) => (
                          <View key={idx} style={styles.shopPhotoInputRow}>
                            <TextInput
                              placeholder="https://..."
                              style={styles.shopPhotoInput}
                              placeholderTextColor="#9ca3af"
                              value={url}
                              editable={!(uploadingShopPhotos || savingDraft || submitting)}
                              onChangeText={(text) => updateShopPhotoUrl(idx, text)}
                            />

                            {shopPhotoUrls.length > 1 && (
                              <TouchableOpacity
                                style={styles.shopPhotoRemoveBtn}
                                onPress={() => removeShopPhotoUrl(idx)}
                                disabled={uploadingShopPhotos || savingDraft || submitting}
                              >
                                <Feather name="x" size={16} color="#666" />
                              </TouchableOpacity>
                            )}
                          </View>
                        ))}
                      </View>
                    </View>
                  )}

                  {showActionRow && (
                    <View style={styles.itemFormFooter}>
                      <View style={styles.actionRow}>
                        <TouchableOpacity style={styles.secondaryBtn} onPress={handleSaveDraft} disabled={savingDraft || submitting}>
                          {savingDraft ? (
                            <ActivityIndicator size="small" color="#111827" />
                          ) : (
                            <Text style={styles.secondaryBtnText}>Save draft</Text>
                          )}
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.primaryBtn} onPress={handleSubmitForReview} disabled={savingDraft || submitting}>
                          {submitting ? (
                            <ActivityIndicator size="small" color="#111827" />
                          ) : (
                            <Text style={styles.primaryBtnText}>Submit for review</Text>
                          )}
                        </TouchableOpacity>
                      </View>

                      <Text style={styles.warningText}>
                        Upload your Shop QR to your Instagram Highlights. Admin verification is approved only after checking your Instagram page for that QR highlight (fraud prevention).
                      </Text>
                    </View>
                  )}
                </View>
              );
            })}

          </View>
          {shopStatus === 'VERIFIED' && (
            <View style={styles.successCard}>
              <Text style={styles.successLabel}>Blue Tick</Text>
              <Text style={styles.successText}>
                Your shop is verified. Submission form is disabled.
              </Text>
            </View>
          )}
        </View>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>What we verify</Text>
          {isInfluencer ? (
            <>
              <View style={styles.verifyRow}>
                <View style={styles.iconCircle}>
                  <Feather name="file-text" size={18} />
                </View>

                <View>
                  <Text style={styles.verifyTitle}>Government ID</Text>
                  <Text style={styles.verifyDesc}>Identity match and legitimacy</Text>
                </View>
              </View>
              <View style={styles.verifyRow}>
                <View style={styles.iconCircle}>
                  <Feather name="camera" size={18} />
                </View>

                <View>
                  <Text style={styles.verifyTitle}>Face verification</Text>
                  <Text style={styles.verifyDesc}>Prevents impersonation and fake creators</Text>
                </View>
              </View>
              <View style={styles.verifyRow}>
                <View style={styles.iconCircle}>
                  <Feather name="users" size={18} />
                </View>

                <View>
                  <Text style={styles.verifyTitle}>Social proof</Text>
                  <Text style={styles.verifyDesc}>Followers and profile authenticity</Text>
                </View>
              </View>
            </>
          ) : (
            <>
              <View style={styles.verifyRow}>
                <View style={styles.iconCircle}>
                  <Feather name="file-text" size={18} />
                </View>

                <View>
                  <Text style={styles.verifyTitle}>GST</Text>
                  <Text style={styles.verifyDesc}>Business legitimacy</Text>
                </View>
              </View>
              <View style={styles.verifyRow}>
                <View style={styles.iconCircle}>
                  <Feather name="camera" size={18} />
                </View>

                <View>
                  <Text style={styles.verifyTitle}>Physical shop</Text>
                  <Text style={styles.verifyDesc}>Prevents fake sellers</Text>
                </View>
              </View>
              <View style={styles.verifyRow}>
                <View style={styles.iconCircle}>
                  <Feather name="users" size={18} />
                </View>

                <View>
                  <Text style={styles.verifyTitle}>Social proof</Text>
                  <Text style={styles.verifyDesc}>Followers, credibility</Text>
                </View>
              </View>
            </>
          )}
        </View>
        <View style={[styles.card, { marginBottom: 40 }]}>
          <Text style={styles.sectionTitle}>Note</Text>
          <Text style={styles.noteText}>
            Admin approval/rejection workflow will be built in the Super Admin Hub next.
          </Text>
        </View>
      {/* ================= FORM SECTION ================= */}
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
    padding: 20,
    paddingBottom: 80
  },

  card: {
    backgroundColor: "#f4f4f4",
    borderRadius: 20,
    padding: 8,
    marginVertical: 10,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },

  smallTitle: {
    fontSize: 14,
    color: "#6b7280"
  },

  title: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: 6,
    color: "#111827"
  },

  description: {
    fontSize: 14,
    color: "#4b5563",
    marginVertical: 10
  },

  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#d4f5e3",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20
  },

  verifiedText: {
    marginLeft: 5,
    color: "#1c7c54"
  },

  pendingBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fee2e2",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20
  },

  pendingText: {
    marginLeft: 5,
    color: "#dc2626"
  },

  inReviewBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fef3c7",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20
  },

  inReviewText: {
    marginLeft: 5,
    color: "#b45309"
  },

  trustBox: {
    backgroundColor: "#f8f8f8",
    marginTop: 14,
    padding: 16,
    borderRadius: 18
  },

  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },

  trustTitle: {
    fontSize: 14,
    color: "#6b7280"
  },

  target: {
    fontSize: 12,
    color: "#6b7280"
  },

  score: {
    fontSize: 20,
    fontWeight: "700",
    marginVertical: 8
  },

  progressBar: {
    height: 8,
    backgroundColor: "#e5e7eb",
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 16
  },

  progressFill: {
    height: "100%",
    backgroundColor: "#f59e0b"
  },

  item: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    flexDirection: "column",
    alignItems: "stretch"
  },

  itemExpanded: {
    paddingBottom: 16,
  },

  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start"
  },

  itemContent: {
    flex: 1,
    paddingRight: 12
  },

  itemMeta: {
    alignItems: "flex-end",
    justifyContent: "flex-start"
  },

  inlineEditBtnWrap: {
    marginBottom: 8,
  },

  inlineEditBtn: {
    backgroundColor: "#f3f4f6",
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },

  inlineEditBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#111827",
  },

  itemForm: {
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
    paddingTop: 12,
  },

  inlineInputLabel: {
    fontSize: 13,
    color: "#6b7280",
    marginTop: 10,
  },

  inlineHelperText: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 18,
    color: "#6b7280",
  },

  inlineRowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },

  inlinePhotoCopy: {
    flex: 1,
  },

  shopPhotoCard: {
    backgroundColor: "#fcfcfc",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 20,
    padding: 14,
  },

  shopPhotoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },

  shopPhotoTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },

  shopPhotoDesc: {
    marginTop: 2,
    fontSize: 12,
    lineHeight: 18,
    color: "#6b7280",
    marginBottom: 8
  },

  shopPhotoActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  uploadActionBtn: {
    minWidth: 96,
    height: 46,
    paddingHorizontal: 16,
    borderRadius: 23,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  uploadActionBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#111827",
  },

  shopPhotoThumbRow: {
    marginTop: 14,
  },

  shopPhotoAddTile: {
    width: 104,
    height: 104,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#d1d5db",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    backgroundColor: "#fff",
  },

  shopPhotoThumbTile: {
    width: 104,
    height: 104,
    borderRadius: 18,
    overflow: "hidden",
    marginRight: 12,
    backgroundColor: "#f3f4f6",
  },

  shopPhotoThumbImage: {
    width: "100%",
    height: "100%",
  },

  shopPhotoThumbRemove: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(17, 24, 39, 0.7)",
    alignItems: "center",
    justifyContent: "center",
  },

  shopPhotoInputRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
  },

  shopPhotoInput: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    fontSize: 14,
  },

  shopPhotoRemoveBtn: {
    width: 40,
    height: 40,
    marginLeft: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },

  itemFormFooter: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
    paddingTop: 12,
  },

  itemTitle: {
    fontSize: 14,
    fontWeight: "600",
    overflow: 'hidden',
    // backgroundColor: 'red',
    maxWidth: '90%'

  },

  points: {
    fontSize: 12,
    color: "#6b7280"
  },

  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20
  },

  doneBadge: {
    backgroundColor: "#d4f5e3"
  },

  missingBadge: {
    backgroundColor: "#e5e7eb"
  },

  badgeText: {
    fontSize: 12
  },

  doneText: {
    color: "#1c7c54"
  },

  missingText: {
    color: "#6b7280"
  },
  successCard: {
    backgroundColor: "#d7f5e6",
    borderRadius: 20,
    padding: 18,
    marginTop: 20,
    borderWidth: 1,
    borderColor: "#9bd9bb"
  },

  successLabel: {
    fontSize: 14,
    color: "#1c7c54",
    marginBottom: 4
  },

  successText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#166534"
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 14,
    color: "#374151"
  },

  verifyRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 14
  },

  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff"
  },

  verifyTitle: {
    fontSize: 16,
    fontWeight: "600"
  },

  verifyDesc: {
    fontSize: 14,
    color: "#6b7280"
  },

  noteText: {
    fontSize: 16,
    color: "#374151",
    lineHeight: 22
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




  inputLabel: {
    fontSize: 13,
    color: "#6b7280",
    marginTop: 14,
  },

  input: {
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginTop: 6,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    fontSize: 14,
  },

  uploadCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 0,
    marginTop: 16,
  },

  uploadTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },

  uploadDesc: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
  },

  addBtn: {
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },

  addBtnText: {
    fontSize: 13,
    fontWeight: "500",
  },

  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    gap: 10,
  },

  secondaryBtn: {
    flex: 1,
    backgroundColor: "white",
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: "center",
  },

  secondaryBtnText: {
    fontWeight: "600",
    color: "#111827",
  },

  primaryBtn: {
    flex: 1,
    backgroundColor: "#f59e0b",
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderRadius: 20,
    alignItems: "center",
  },

  primaryBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#111827",
  },

  warningText: {
    marginTop: 14,
    fontSize: 12,
    color: "#dc2626",
    lineHeight: 18,
  },  
});