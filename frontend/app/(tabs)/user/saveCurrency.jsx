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
import { GlobalStyles as GS } from '@/constants/GlobalStyles';

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
            </View>
        </View>
        <View style={styles.cardContainer}>
        {/* navigation */}
        <View style={{paddingTop:20, width:'10%'}}>
          <Ionicons name="arrow-back" size={24} color="black" style={{paddingRight: '24%',}}
          onPress = {() => router.replace('/(tabs)/user/profile')}
        />
        </View>
            <Text style={GS.footerText}>Currency</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                enabled={!currencyLoading}
                selectedValue={currency}
                onValueChange={setCurrency}
                mode="dropdown"
                style={styles.picker}
                dropdownIconColor="#666"
              >
                {currencyLoading
                    ? <Picker.Item label="Loading…" value="" />
                    : currencyTypes.map(t => <Picker.Item key={t} label={t} value={t} />)
                }
              </Picker>
              {Platform.OS === 'web' && (
                <View style={styles.webArrow}>
                  <Text style={{ color: '#666', fontSize: 12 }}>▼</Text>
                </View>
              )}
            </View>
            <TouchableOpacity onPress={onSave} style={[GS.button, { backgroundColor: '#ddd' }]}>
              <Text style={GS.buttonText}>Save</Text>
            </TouchableOpacity>
      </View>
    </View>
    )
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
    paddingHorizontal:20,
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
  // ── Picker Wrapper ───────────────────────────────────────────────────────────
  pickerWrapper: {
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ccc',
    marginBottom: 15,
    overflow: 'hidden',
    position: 'relative',
  },
  picker: {
    height: 50,
    width: '100%',
    color: '#000',
    backgroundColor: '#f5f5f5',
    ...Platform.select({
      web: {
        borderWidth: 0,
        appearance: 'none',
        WebkitAppearance: 'none',
        paddingHorizontal: 12,
      },
      ios: {},
      android: {},
    }),
  },
});


