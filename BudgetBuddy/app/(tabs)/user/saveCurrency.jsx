import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Inter_500Medium, useFonts } from '@expo-google-fonts/inter';
import DropDownPicker from "react-native-dropdown-picker";
import { useUsername, useCurrencyTypes, useCurrencyPreference } from '@/hooks/data';
import { useUpdateProfileCurrency } from '@/hooks/crud';
import * as Notifications from 'expo-notifications';
import Ionicons from '@expo/vector-icons/Ionicons';
import { GlobalStyles as GS } from '@/constants/GlobalStyles';

/**
 * Configure foreground notification display.
 * Without this handler, foreground notifications are silently suppressed on iOS.
 */
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

  const { data: currencyTypes, loading: currencyLoading } = useCurrencyTypes();
  const { data: preferenceCurrency, loading: preferenceCurrencyLoading } = useCurrencyPreference();

  const [openCurrency, setOpenCurrency] = useState(false);
  const update = useUpdateProfileCurrency();
  const [currency, setCurrency] = useState(null);
  const [fontsLoaded, fontError] = useFonts({ Inter_500Medium });

  // Pre-fill the picker with the user's saved currency preference once loaded.
  useEffect(() => {
    if (!preferenceCurrencyLoading) {
      setCurrency(preferenceCurrency);
    }
  }, [preferenceCurrencyLoading]);

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
        <View style={{
          flexDirection: 'row', 
          flexWrap: 'wrap',
          justifyContent:'space-between',
          paddingTop:20,
        }}>
          <Ionicons name="arrow-back" size={30} color="black" style={{paddingRight: '24%',}}
          onPress = {() => router.replace('/(tabs)/user/profile')}
        />
        <Text style={styles.title}>Currency</Text>
        
        <Ionicons name="arrow-back" size={24} color="white" style={{paddingRight: '24%',}}/>
        
        </View>
            
            <DropDownPicker
                open={openCurrency}
                value={currency}

                items={currencyTypes.map((c) => ({ label: c, value: c }))}
                setOpen={setOpenCurrency}
                setValue={setCurrency}    

                /* ---- fixed light palette ---- */
                style={styles.dropdown}
                dropDownContainerStyle={styles.dropdownContainer}
                textStyle={styles.dropdownText}
                listItemLabelStyle={styles.dropdownText}

                placeholder="Select"
                searchable
                zIndex={10}        /* avoids overlap inside ScrollViews / modals */
            />
            <TouchableOpacity onPress={onSave} style={[styles.button, { backgroundColor: '#ddd' }]}>
              <Text style={GS.buttonText}>Save</Text>
            </TouchableOpacity>
      </View>
    </View>
    )
}

const styles = StyleSheet.create({
  title: {
    fontSize: 22,
    fontWeight: 'normal',
    marginBottom: 20,
    textAlign: 'center',
  },
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
  button :{
    marginTop: 16,
    marginBottom: 12,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
  },
  // ── Dropdown Styles ───────────────────────────────────────────────────────────
  dropdown: {
    backgroundColor: '#fff',
    borderColor: '#ccc',
  },
  dropdownContainer: {
    backgroundColor: '#fff',
    borderColor: '#ccc',
  },
  dropdownText: {
    color: '#000',
  },
});


