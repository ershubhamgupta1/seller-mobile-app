import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StyleSheet, View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import HomeScreen from '../screens/HomeScreen';
import OrdersScreen from '../screens/OrdersScreen';
import AddProductScreen from '../screens/AddProductScreen';
import QRCodeScreen from '../screens/QRCodeScreen';
import SettingsScreen from '../screens/SettingsScreen';
import AnalyticsScreen from '../screens/AnalyticsScreen';

const Tab = createBottomTabNavigator();

const AppNavigator = () => {
  const insets = useSafeAreaInsets();
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          
          if (route.name === 'Home') {
            iconName = focused ? '🏠' : '🏠';
          } else if (route.name === 'Orders') {
            iconName = focused ? '📋' : '📋';
          } else if (route.name === 'Add') {
            iconName = '➕';
          } else if (route.name === 'QRCode') {
            iconName = focused ? '📱' : '📱';
          } else if (route.name === 'Analytics') {
            iconName = focused ? '📊' : '📊';
          } else if (route.name === 'Settings') {
            iconName = focused ? '⚙️' : '⚙️';
          }
          
          return <Text style={[styles.tabIcon, { color, fontSize: size }]}>{iconName}</Text>;
        },
        tabBarActiveTintColor: '#000',
        tabBarInactiveTintColor: '#666',
        tabBarStyle: [styles.tabBar, { paddingBottom: Math.max(insets.bottom, 5) }],
        tabBarLabelStyle: styles.tabLabel,
        tabBarShowLabel: true,
        headerStyle: styles.header,
        headerTitleStyle: styles.headerTitle,
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{ 
          title: 'E-KOM',
          tabBarLabel: 'Home'
        }}
      />
      <Tab.Screen 
        name="Orders" 
        component={OrdersScreen}
        options={{ 
          title: 'Orders',
          tabBarLabel: 'Orders'
        }}
      />
      <Tab.Screen 
        name="Add" 
        component={AddProductScreen}
        options={{ 
          tabBarLabel: 'Add',
          tabBarIcon: ({ focused, color, size }) => (
            <View style={[styles.addButton, focused && styles.addButtonFocused]}>
              <Text style={[styles.addIcon, { color, fontSize: size * 1.5 }]}>+</Text>
            </View>
          )
        }}
      />
      <Tab.Screen 
        name="QRCode" 
        component={QRCodeScreen}
        options={{ 
          title: 'QR Code',
          tabBarLabel: 'QR Code'
        }}
      />
      <Tab.Screen 
        name="Analytics" 
        component={AnalyticsScreen}
        options={{ 
          title: 'Analytics',
          tabBarLabel: 'Analytics'
        }}
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{ 
          title: 'Settings',
          tabBarLabel: 'Settings'
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
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
    width: 56,
    height: 56,
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
