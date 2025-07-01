import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  ScrollView
} from 'react-native';
import { useRouter } from 'expo-router';
import { Inter_500Medium, useFonts } from '@expo-google-fonts/inter';
import { useUsername } from '@/hooks/data';
import { useSignOut } from '@/hooks/auth';
import * as Notifications from 'expo-notifications';

// ── Notification Handler (Foreground) ─────────────────────────────────────────────────────────────────
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner:   true,
    shouldShowList:     true,
    shouldPlaySound:    true,
    shouldSetBadge:     false,
  }),
});

export default function ProfileScreen() {
  const router = useRouter();

  // On Android: ensure the default notification channel exists
  useEffect(() => {
    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default');
    }
  }, []);

  // Load custom font
  const [fontsLoaded, fontError] = useFonts({
    Inter_500Medium,
  });

  // Fetch username
  const { data: username, loading: usernameLoading } = useUsername();

  // Hook to sign out
  const signOut = useSignOut();

  if (!fontsLoaded && !fontError) {
    return null;
  }

  if (usernameLoading) {
    return <ActivityIndicator style={{ flex: 1 }} />;
  }

  if (!username) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No user data found.</Text>
      </View>
    );
  }

  const handleSignOut = async () => {
    await signOut();
    router.replace('/auth/sign_in');
  };

  return (
    <View style={styles.wrapper}>
      {/* Top Green Header */}
      <View style={styles.headerContainer}>
        <Image
          source={require('@/assets/images/profile_pic.png')}
          style={styles.profilePicLarge}
        />
        <View style={styles.headerTextContainer}>
          <Text style={styles.nameText}>{username}</Text>
          
        </View>
      </View>

      {/* White Card for Options */}
      <View style={styles.cardContainer}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.cardContent}>
          {/* <TouchableOpacity style={styles.optionButton} onPress={() => router.push('/settings/private')}>
            <Text style={styles.optionText}>Private settings</Text>
          </TouchableOpacity> */}
          <TouchableOpacity style={styles.optionButton} onPress={() => router.replace('/(tabs)/user/saveCurrency')}>
            <Text style={styles.optionText}>Set currency preference</Text>
          </TouchableOpacity>
          {/* <TouchableOpacity style={styles.optionButton} onPress={() => router.push('/about')}>
            <Text style={styles.optionText}>About us</Text>
          </TouchableOpacity> */}
          {/* <TouchableOpacity style={styles.optionButton} onPress={() => router.push('/feedback')}>
            <Text style={styles.optionText}>Any feedback? Let us know!</Text>
          </TouchableOpacity> */}
          <TouchableOpacity style={styles.optionButton} onPress={handleSignOut}>
            <Text style={styles.optionText}>Sign Out</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#27592D',
    paddingTop:40, 
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
  headerContainer: {
    backgroundColor: '#27592D',  // green header
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  profilePicLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: '#fff',
  },
  headerTextContainer: {
    marginLeft: 16,
  },
  nameText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitleText: {
    fontSize: 14,
    color: '#E8F5E9',
    marginTop: 4,
  },
  cardContainer: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 6,
  },
  cardContent: {
    padding: 24,
  },
  optionButton: {
    backgroundColor: '#B3E5FC',
    marginVertical: 10,
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: 'center',
  },
  optionText: {
    fontSize: 16,
    color: '#000',
    fontWeight: '500',
  },
});


