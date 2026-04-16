import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { FontAwesome5 } from '@expo/vector-icons';
import Octicons from '@expo/vector-icons/Octicons';

import UserProfileScreen from '../screens/UserProfileScreen';
import OrdersScreen from '../screens/OrdersScreen';
import OrderDetailScreen from '../screens/OrderDetailScreen';

import ShopProfileScreen from '../screens/ShopProfileScreen';

import InventoryScreen from '../screens/InventoryScreen';
import ClosetScreen from '../screens/ClosetScreen';
import DashboardScreen from '../screens/DashboardScreen';
import PayoutHistoryScreen from '../screens/PayoutHistoryScreen';

import AddProductScreen from '../screens/AddProductScreen';
import AnalyticsScreen from '../screens/AnalyticsScreen';
import InvoiceScreen from '../screens/InvoiceScreen';
import LoginScreen from '../screens/LoginScreen';
import { createStackNavigator } from '@react-navigation/stack';
import TrustMeterScreen from '../screens/TrustMeterScreen';
import FeedScreen from '../screens/FeedScreen';
import IncomingShareScreen from '../screens/IncomingShareScreen';
import CollaborationRequestDetailScreen from '../screens/CollaborationRequestDetailScreen';
import CollabSearchScreen from '../screens/CollabSearchScreen';
import CollaborationRequestsScreen2 from '../screens/CollaborationRequestsScreen2';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const resolveAccountType = (authUser) => {
  const u = authUser?.user || authUser?.me || authUser?.data?.user || authUser;

  const accountTypeRaw = u?.account_type;
  if (typeof accountTypeRaw === 'string') {
    const normalized = accountTypeRaw.toLowerCase();
    if (normalized.includes('influencer') || normalized.includes('creator')) return 'influencer';
    if (normalized.includes('business') || normalized.includes('seller') || normalized.includes('shop')) return 'business';
  }

  const raw =
    u?.user_type ??
    u?.type ??
    u?.role ??
    u?.profile_type ??
    u?.actor_type;

  if (typeof raw === 'string') {
    const normalized = raw.toLowerCase();
    if (normalized.includes('influencer') || normalized.includes('creator')) return 'influencer';
    if (normalized.includes('business') || normalized.includes('seller') || normalized.includes('shop')) return 'business';
  }

  if (u?.is_influencer === true) return 'influencer';
  if (u?.is_business === true) return 'business';

  return 'business';
};

const MainTabs = ({ accountType }) => {
  const insets = useSafeAreaInsets();
  const isInfluencer = accountType === 'influencer';
  const inventoryOrClosetRouteName = isInfluencer ? 'Closet' : 'Inventory';
  const inventoryOrClosetComponent = isInfluencer ? ClosetScreen : InventoryScreen;
  const inventoryOrClosetLabel = isInfluencer ? 'Closet' : 'Inventory';
  const shopIdentityLabel = isInfluencer ? 'Influ. Profile' : 'Shop Profile';

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Dashboard') {
            iconName = 'home';
          } else if (route.name === inventoryOrClosetRouteName) {
            iconName = isInfluencer ? 'tshirt' : 'box-open';
            return <FontAwesome5 name={iconName} size={20} color={color} />;
          } else if (route.name === 'Orders') {
            iconName = 'shopping-bag';
            return <FontAwesome5 name={iconName} size={20} color={color} />;
          } else if (route.name === 'Add') {
            iconName = 'plus';
          } else if (route.name === 'Feed') {
            iconName = 'rss';
          } else if (route.name === 'Settings') {
            iconName = 'cog';
          }

          return <FontAwesome5 name={iconName} size={20} color={color} />;
        },
        tabBarActiveTintColor: '#000',
        tabBarInactiveTintColor: '#666',
        tabBarStyle: [styles.tabBar, { marginBottom: Math.max(insets.bottom, 5) }],
        tabBarLabelStyle: styles.tabLabel,
        tabBarShowLabel: true,
        headerStyle: styles.header,
        headerTitleStyle: styles.headerTitle,
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          headerShown: false,
          tabBarLabel: 'Home',
        }}
      />
      <Tab.Screen
        name={inventoryOrClosetRouteName}
        component={inventoryOrClosetComponent}
        options={{
          headerShown: false,
          tabBarLabel: inventoryOrClosetLabel,
        }}
      />
      <Tab.Screen
        name="Orders"
        component={OrdersScreen}
        options={{
          headerShown: false,
          tabBarLabel: 'Orders',
        }}
      />
      <Tab.Screen
        name="Feed"
        component={FeedScreen}
        options={{
          headerShown: false,
          tabBarLabel: 'Feed',
        }}
      />
      <Tab.Screen
        name="shopIdentity"
        component={ShopProfileScreen}
        options={{
          headerShown: false,
          tabBarLabel: shopIdentityLabel,
          tabBarIcon: ({ focused, color, size }) => (
            <FontAwesome5 name="store" size={20} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const AppNavigator = () => {
  const { isAuthenticated, loading, user } = useAuth();
  const accountType = resolveAccountType(user);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }
  if (!isAuthenticated) {
    return <LoginScreen />;
  }
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Main">
        {(props) => <MainTabs {...props} accountType={accountType} />}
      </Stack.Screen>
      <Stack.Screen name="orderScreen" component={OrdersScreen} />
      <Stack.Screen name="orderDetailsScreen" component={OrderDetailScreen} />
      <Stack.Screen name="shopProfile" component={ShopProfileScreen} />
      <Stack.Screen name="trustMeter" component={TrustMeterScreen} />
      <Stack.Screen name="dashboard" component={DashboardScreen} />
      <Stack.Screen name="payoutHistory" component={PayoutHistoryScreen} />
      <Stack.Screen name="userProfile" component={UserProfileScreen} />
      <Stack.Screen name="handleShare" component={IncomingShareScreen} />
      <Stack.Screen name="addPost" component={AddProductScreen} />
      <Stack.Screen name="feedScreen" component={FeedScreen} />
      <Stack.Screen name="analytics" component={AnalyticsScreen} />
      <Stack.Screen name="invoice" component={InvoiceScreen} />
      <Stack.Screen name="collaborationRequestDetail" component={CollaborationRequestDetailScreen} />
      <Stack.Screen name="collaborationRequests" component={CollaborationRequestsScreen2} />
      <Stack.Screen name="collab-search" component={CollabSearchScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />

    </Stack.Navigator>
  );
};

//       <View style={styles.loadingContainer}>
//         <ActivityIndicator size="large" color="#000" />
//       </View>
//     );
//   }

//   if (!isAuthenticated) {
//     return <LoginScreen />;
//   }

//   return <MainTabs />;
// };

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#fff',
    elevation: 0,
    shadowOpacity: 0,
    borderBottomWidth: 0,
  },
  headerTitle: {
    fontWeight: 'bold',
    fontSize: 18,
  },
  tabBar: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    height: 80,
    paddingBottom: 5,
  },
  tabLabel: {
    fontSize: 11,
    marginTop: 4,
    marginBottom: 4,
    color: '#000',
  },
  tabIcon: {
    fontSize: 24,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 28,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  addButtonFocused: {
    backgroundColor: '#000',
  },
  addIcon: {
    fontWeight: 'bold',
  },
});

export default AppNavigator;
