import React from 'react';
import { Tabs } from 'expo-router';
import { Home, CalendarDays, User } from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { Platform } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors.bgWhite,
          ...Platform.select({
            ios: {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 4,
            },
            android: { elevation: 2 },
          }),
        },
        headerTintColor: Colors.textPrimary,
        headerTitleStyle: {
          fontFamily: 'Inter_700Bold',
          fontSize: 18,
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textTertiary,
        tabBarLabelStyle: {
          fontFamily: 'Inter_600SemiBold',
          fontSize: 11,
          marginBottom: Platform.OS === 'android' ? 4 : 0,
        },
        tabBarStyle: {
          backgroundColor: Colors.bgWhite,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          paddingTop: 8,
          height: Platform.OS === 'android' ? 64 : 85,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Trang chủ',
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          title: 'Lịch chiếu',
          headerTitle: 'LỊCH CHIẾU',
          headerTitleStyle: {
            fontFamily: 'Inter_700Bold',
            fontSize: 18,
            color: Colors.primary,
          },
          tabBarIcon: ({ color, size }) => (
            <CalendarDays size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Tài khoản',
          headerTitle: 'TÀI KHOẢN',
          headerTitleStyle: {
            fontFamily: 'Inter_700Bold',
            fontSize: 18,
          },
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
