import React from 'react';
import { Tabs } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#2f95dc',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: { 
          backgroundColor: '#fff',
          height: 70, 
          paddingBottom: 5,
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
        name="stats"
        options={{
          title: 'Statistics',
          tabBarIcon: ({ color, size }) => (
            <FontAwesome name="bar-chart" size={size} color={color} />
          ),
          unmountOnBlur: true,
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