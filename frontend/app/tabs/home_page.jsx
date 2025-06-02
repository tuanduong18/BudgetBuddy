import React, { useEffect } from 'react';
import { Image, TouchableOpacity, StyleSheet, ActivityIndicator, Text, Platform, View } from 'react-native';
import { useRouter } from 'expo-router';
import createStyles from "./style";
import { Inter_500Medium, useFonts } from "@expo-google-fonts/inter";
import { useUsername } from "@/hooks/data";
import * as Notifications from 'expo-notifications';

// Notifications setup
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner:   true,
    shouldShowList:     true,
    shouldPlaySound:   true,
    shouldSetBadge:    false,
  }),
});

export default function HomeScreen() {  
    const router = useRouter();

    useEffect(()=>{
        if (Platform.OS === 'android') {
            Notifications.setNotificationChannelAsync('default');
        }
    },[])

    const [loaded, error] = useFonts({        
        Inter_500Medium,
    })  

    // Fetch username
    const {data: username, usernameLoading: load1} = useUsername();

    // If fonts are not loaded or there's an error, return null
    if (!loaded && !error) {
        return null
    }

    // If still loading username, show a loading indicator
    if (load1) {
        return <ActivityIndicator style={{ flex: 1 }} />;
    }

    // If no username is found, show a message
    if (!username) {
        return <Text style={{ padding: 20 }}>No data</Text>;
    }

    // Home Screen
    return (
    <View style={styles.container}>
      {/* Greeting & Profile */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hi, {username} 👋</Text>
          <Text style={styles.subtext}>Check out some friendly reminders!</Text>
        </View>

        {/* Clicking the profile pic navigates to /profile */}
        <TouchableOpacity onPress={() => router.push('/user/profile')}>
          <Image
            source={require('@/assets/images/profile_pic.png')} 
            style={styles.profilePic}
          />
        </TouchableOpacity>
      </View>

      {/* Alerts Block */}
      <View style={styles.alertBlock}>
        <Text style={styles.alertText}>🔔 Alerts</Text>
        <Text style={styles.alertContent}>
          Spotify May subscription ends tomorrow!
        </Text>
      </View>

      {/* Navigation Blocks */}
      <TouchableOpacity
        style={[styles.navBlock, { backgroundColor: '#26ADE4' }]}
        onPress={() => router.push('/personal_expenses/expenses')}
      >
        <Text style={styles.navText}>Expenses</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.navBlock, { backgroundColor: '#FF99AD' }]}
        onPress={() => router.push('/money_splitting')}
      >
        <Text style={styles.navText}>Money Splitting</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.navBlock, { backgroundColor: '#FF8C5A' }]}
        onPress={() => router.push('/monthly_limit/allLimits')}
      >
        <Text style={styles.navText}>Budget Tracker</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.navBlock, { backgroundColor: '#4BAA71' }]}
        onPress={() => router.push('/statistics')}
      >
        <Text style={styles.navText}>Statistics</Text>
      </TouchableOpacity>
    </View>
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,           
    paddingHorizontal: 20,
    backgroundColor: '#ffde1a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtext: {
    fontSize: 14,
    color: '#555',
    marginTop: 4,
  },
  profilePic: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  alertBlock: {
    backgroundColor: '#5B57D3',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  alertText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  alertContent: {
    color: '#fff',
    fontSize: 14,
  },
  navBlock: {
    padding: 24,
    borderRadius: 16,
    marginBottom: 16,
    alignItems: 'flex-start',
    elevation: 2,
  },
  navText: {
    fontSize: 18,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#333',
  },
});