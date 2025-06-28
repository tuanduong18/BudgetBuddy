import React from 'react';
import { Tabs } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#2f95dc',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: { 
          backgroundColor: '#fff',
          height: 70 + insets.bottom, 
          paddingBottom: insets.bottom,
        },
        unmountOnBlur: true,
      }}
    >
      <Tabs.Screen
        name="personal_expenses"
        options={{
          title: 'Expenses',
          tabBarIcon: ({ color, size }) => (
            <FontAwesome name="money" size={size} color={color} />
          ),
          unmountOnBlur: true,
          tabBarLabelStyle: {
            flexWrap: 'nowrap',
          
          },
        }}
      />

      <Tabs.Screen
        name="analytics"
        options={{
          title: 'Analytics',
          tabBarIcon: ({ color, size }) => (
            <FontAwesome name="pie-chart" size={size} color={color} />
          ),
          unmountOnBlur: true,
          tabBarLabelStyle: {
            flexWrap: 'nowrap',
          
          },
        }}
      />

      <Tabs.Screen
        name="reminders"
        options={{
          title: 'Reminders',
          tabBarIcon: ({ color, size }) => (
            <FontAwesome name="bell" size={size} color={color} />
          ),
          unmountOnBlur: true
        }}
      />

      

      <Tabs.Screen
        name="monthly_limit"
        options={{
          title: 'Limits',
          tabBarIcon: ({ color, size }) => (
            <FontAwesome name="line-chart" size={size} color={color} />
          ),
          unmountOnBlur: true
        }}
      />
      <Tabs.Screen
        name="split"
        options={{
          title: 'Group',
          tabBarIcon: ({ color, size }) => (
            <FontAwesome name="group" size={size} color={color} />
          ),
          unmountOnBlur: true
        }}
      />

      <Tabs.Screen
        name="user"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <FontAwesome name="user" size={size} color={color} />
          ),
          unmountOnBlur: true
        }}
      />
      
    </Tabs>
  );
}