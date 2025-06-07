import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  ScrollView,
  Button,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Inter_500Medium, useFonts } from '@expo-google-fonts/inter';
import { Picker } from "@react-native-picker/picker";
import { useUsername, useCurrencyTypes, useCurrencyPreference } from '@/hooks/data';
import { useUpdateProfileCurrency } from '@/hooks/crud';
import * as Notifications from 'expo-notifications';
import Ionicons from '@expo/vector-icons/Ionicons';

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

  // load all supported currencies
  const {data: currencyTypes, loading: currencyLoading} = useCurrencyTypes();

  // load user's preference 
  const { data: preferenceCurrency, loading: preferenceCurrencyLoading } = useCurrencyPreference();

  // hook
  const update = useUpdateProfileCurrency();

  // fetch data based on user's currency preference
  const [currency, setCurrency] = useState(null);

  // Load custom font
  const [fontsLoaded, fontError] = useFonts({
    Inter_500Medium,
  });

  // set initial value to user's preference
  useEffect(()=>{
    if(!preferenceCurrencyLoading) {
      setCurrency(preferenceCurrency)
    }
  },[preferenceCurrencyLoading])

  // Fetch username
  const { data: username, loading: usernameLoading } = useUsername();

  if (!fontsLoaded && !fontError) {
    return null;
  }

  if (usernameLoading || currencyLoading || preferenceCurrencyLoading) {
    return <ActivityIndicator style={{ flex: 1 }} />;
  }

  const onSave = async () => {
    await update({currency});
    router.replace('/(tabs)/user/profile')
  }

  if (!username) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No user data found.</Text>
      </View>
    );
  }
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
            <Text style={styles.subtitleText}>Joined on May 30th, 2025</Text>
            </View>
        </View>
        {/* navigation */}
        <View>
          <Ionicons name="arrow-back" size={24} color="black" style={{paddingRight: '24%',}}
          onPress = {() => router.replace('/(tabs)/user/profile')}
        />
        </View>
        {/* Currency setting box */}
        <View style={styles.pickerWrapper}>
                <Picker
                    enabled={!currencyLoading}
                    selectedValue={currency}
                    onValueChange={setCurrency}
                    style={styles.picker}
                >
                <Picker.Item
                    label="Original"
                    value={null}
                    color="#999"
                />
                {currencyLoading
                    ? <Picker.Item label="Loading…" value="" />
                    : currencyTypes.map(t => <Picker.Item key={t} label={t} value={t} />)
                }
                </Picker>

                <Button 
                    title="Change currency" 
                    onPress={onSave}
                    style = {styles.optionButton}
                />
            </View>
    </View>
    )
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#27592D', 
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
  pickerWrapper: {
        borderWidth: 1,

        borderRadius: 4,
        marginBottom: 12,
        overflow: "hidden",
    },
    picker: {
        height: 50,
        width: "100%",
    },
});


