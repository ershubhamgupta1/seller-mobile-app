import { useState, useEffect, useCallback } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Image,
    RefreshControl,
    useWindowDimensions
} from "react-native";
import { inventory } from "../services/api";
import Header from "../components/Header";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather, FontAwesome } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";

const getInventoryColumnCount = (width) => {
    if (width >= 1100) return 4;
    if (width >= 768) return 3;
    return 2;
};

const getInventoryCardWidth = (columns) => {
    if (columns === 4) return "23.5%";
    if (columns === 3) return "31.5%";
    return "48%";
};

const getInventoryImageHeight = (columns) => {
    if (columns >= 4) return 180;
    if (columns === 3) return 220;
    return 200;
};

const InventoryScreen = ({ navigation }) => {

    const { width } = useWindowDimensions();
    const columnCount = getInventoryColumnCount(width);
    const cardWidth = getInventoryCardWidth(columnCount);
    const imageHeight = getInventoryImageHeight(columnCount);

    const [loading, setLoading] = useState(true);
    const [posts, setPosts] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const [shopExists, setShopExists] = useState(true);

    useEffect(() => {
        fetchPosts();
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchPosts();
        }, [])
    );

    const fetchPosts = async () => {
        try {
            // Don't show loading indicator if just refreshing
            if (!refreshing) {
                setLoading(true);
            }

            const response = await inventory?.getPosts();
            let postsData = response?.posts || [];
            setPosts(postsData);
            setShopExists(true);

        } catch (error) {
            const msg = String(error?.message || '').toLowerCase();
            if (msg.includes('not found') || msg.includes('404') || msg.includes('no shop') || msg.includes('shop_not_created')) {
                setShopExists(false);
            } else {
                console.error("Error fetching posts", error);
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchPosts();
    }, []);

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" />
            </View>
        );
    }
  const platforms = [
    { value: "instagram", label: "Instagram", icon: "instagram", color: "#e1306c" },
    { value: "facebook", label: "Facebook", icon: "facebook", color: "#1877f2" },
    { value: "twitter", label: "Twitter", icon: "twitter", color: "#1da1f2" },
    { value: "youtube", label: "YouTube", icon: "youtube", color: "#ff0000" },
    { value: "tiktok", label: "TikTok", icon: "music", color: "#000000" },
    { value: "other", label: "Other", icon: "globe", color: "#6b7280" },
  ];

    return (

        <SafeAreaView style={styles.safeArea} edges={['top']}>

            <ScrollView 
                style={styles.container}
                keyboardShouldPersistTaps="handled"
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >

                <Header
                    title="Inventory"
                    onNotificationPress={() => { }}
                    onProfilePress={() => navigation.navigate("userProfile")}
                />

                {!shopExists && (
                    <View style={styles.notificationBanner}>
                        <Text style={styles.notificationText}>Create your shop first</Text>
                    </View>
                )}

                <View style={styles.content}>

                    <View style={styles.inventoryHeader}>

                        <View style={{ flex: 1, paddingTop: 12 }}>
                            <Text style={styles.inventorySmall}>Visual Inventory</Text>
                            <Text style={styles.inventoryTitle}>Posts</Text>

                            <Text style={styles.inventoryDesc}>
                                Upload social links and convert them into structured product cards.
                            </Text>
                        </View>

                        <View style={styles.headerButtonColumn}>
                            <TouchableOpacity
                                style={styles.collabButton}
                                onPress={() => navigation.navigate('collaborationRequests')}
                            >
                                <Text style={styles.collabButtonText}>Collaboration Requests</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.newButton}
                                onPress={() => navigation.navigate("addPost")}
                            >
                                <Text style={styles.newButtonText}>+ New</Text>
                            </TouchableOpacity>
                        </View>

                    </View>

                    {posts.length === 0 ? (
                        <View style={styles.emptyStateCard}>
                            <View style={styles.emptyStateIconWrap}>
                                <Feather name="box" size={28} color="#6b7280" />
                            </View>
                            <Text style={styles.emptyStateTitle}>No posts yet</Text>
                            <Text style={styles.emptyStateDescription}>
                                Create your first inventory post to start showing products here.
                            </Text>
                            <TouchableOpacity
                                style={styles.emptyStateButton}
                                onPress={() => navigation.navigate("addPost")}
                            >
                                <Text style={styles.emptyStateButtonText}>Create first post</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={styles.postsGrid}>
                            {posts.map((item) => {
                                const platform =  platforms.find(platform=> platform.value === item.social_platform);
                                return (
                                <TouchableOpacity 
                                    key={item.id} 
                                    style={[styles.postCard, { width: cardWidth }]}
                                    onPress={() => navigation.navigate("addPost", { post: item })}
                                >
                                    <View style={styles.postImageWrapper}>
                                        <Image
                                            source={{ uri: item.images[0]?.url }}
                                            style={[styles.postImage, { height: imageHeight }]}
                                        />
                                        <View style={styles.instagramBadge}>
                                            {['instagram', 'facebook', 'twitter', 'youtube', 'tiktok'].includes(item.social_platform) && <FontAwesome name={platform.icon} size={16} color={platform.color}/>}
                                            {!['instagram', 'facebook', 'twitter', 'youtube', 'tiktok'].includes(item.social_platform) && <Feather name="globe" size={12} color="#fff" />}
                                        </View>
                                        <View style={styles.priceBadge}>
                                            <Text style={styles.priceBadgeText}>₹ {item.price}</Text>
                                        </View>
                                    </View>
                                    <View style={styles.postInfo}>
                                        <Text style={styles.postTitle} numberOfLines={2}>{item.title}</Text>
                                        <Text style={styles.postMaterial} numberOfLines={1}>{item.material}</Text>
                                        <View style={styles.postFooter}>
                                            <View style={styles.postStats}>
                                                <Feather name="image" size={16} />
                                                <Text style={styles.statText}>
                                                    {item.inventory_image_count}
                                                </Text>
                                                <Feather name="share-2" size={16} />
                                                <Text style={styles.statText}>
                                                    {item.share_count}
                                                </Text>
                                            </View>
                                            <Feather name="chevron-right" size={20} />
                                        </View>
                                    </View>
                                </TouchableOpacity>
                                )
                            })}
                        </View>
                    )}

                </View>

            </ScrollView>

        </SafeAreaView>

    );
};

const styles = StyleSheet.create({

    safeArea: {
        flex: 1,
        backgroundColor: "#fff"
    },

    container: {
        flex: 1
    },

    content: {
        paddingHorizontal: 20
    },

    postsGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between"
    },

    emptyStateCard: {
        backgroundColor: "#f9fafb",
        borderRadius: 20,
        borderWidth: 1,
        borderColor: "#e5e7eb",
        paddingVertical: 32,
        paddingHorizontal: 24,
        alignItems: "center",
        marginTop: 8,
        marginBottom: 20
    },

    emptyStateIconWrap: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: "#fff",
        borderWidth: 1,
        borderColor: "#e5e7eb",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 16
    },

    emptyStateTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#111827"
    },

    emptyStateDescription: {
        fontSize: 14,
        color: "#6b7280",
        textAlign: "center",
        marginTop: 8,
        lineHeight: 20,
        maxWidth: 280
    },

    emptyStateButton: {
        marginTop: 20,
        backgroundColor: "#f59e0b",
        paddingHorizontal: 18,
        paddingVertical: 12,
        borderRadius: 24
    },

    emptyStateButtonText: {
        fontWeight: "600",
        color: "#111827"
    },

    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center"
    },

    inventoryHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16
    },

    inventorySmall: {
        fontSize: 14,
        color: "#6b7280"
    },

    inventoryTitle: {
        fontSize: 24,
        fontWeight: "700"
    },

    inventoryDesc: {
        fontSize: 14,
        color: "#6b7280",
        marginTop: 4
    },

    headerButtonColumn: {
        alignItems: 'flex-end',
        gap: 10
    },

    collabButton: {
        backgroundColor: "#111827",
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 24
    },

    collabButtonText: {
        fontWeight: "700",
        color: "#ffffff",
        fontSize: 12
    },

    newButton: {
        backgroundColor: "#f59e0b",
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 24
    },

    newButtonText: {
        fontWeight: "600"
    },

    viewOrdersButton: {
        marginBottom: 20,
        borderWidth: 1,
        borderColor: "#e5e7eb",
        paddingVertical: 10,
        borderRadius: 20,
        alignItems: "center"
    },

    viewOrdersText: {
        fontWeight: "500"
    },

    postCard: {
        backgroundColor: "#fff",
        borderRadius: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: "#e5e7eb",
        overflow: "hidden"
    },

    postImageWrapper: {
        position: "relative"
    },

    postImage: {
        width: "100%",
        height: 320
    },

    instagramBadge: {
        position: "absolute",
        top: 12,
        left: 12,
        backgroundColor: "#fff",
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 20
    },

    instagramText: {
        fontSize: 12
    },

    priceBadge: {
        position: "absolute",
        bottom: 12,
        right: 12,
        backgroundColor: "#fff",
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20
    },

    priceBadgeText: {
        fontSize: 12,
        fontWeight: "600"
    },

    postInfo: {
        padding: 12
    },

    postTitle: {
        fontSize: 14,
        fontWeight: "600"
    },

    postMaterial: {
        color: "#6b7280",
        fontSize: 12,
        marginTop: 4
    },

    postFooter: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 12
    },

    postStats: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6
    },

    statText: {
        marginRight: 12
    },

    notificationBanner: {
        backgroundColor: '#fef3c7',
        padding: 12,
        marginHorizontal: 16,
        marginTop: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#f59e0b'
    },

    notificationText: {
        fontSize: 14,
        color: '#92400e',
        textAlign: 'center'
    }

});

export default InventoryScreen;