import { View, Text, TouchableOpacity, Image, StyleSheet, ActivityIndicator, Alert, Platform } from "react-native";
import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRefreshToken } from "@/hooks/auth";
import { getAccessToken } from "@/constants/authStorage";
import { requestPermissions } from "@/hooks/notificationsPermissions";
import * as Notifications from 'expo-notifications';
import { GlobalStyles as GS } from "@/constants/GlobalStyles";

export default function App() {
  const router = useRouter();
  const refresh = useRefreshToken();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    requestPermissions();
  }, []);

  useEffect(() => {
  if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        // 1) attempt the refresh flow
        await refresh();

        // 2) read out the access token you just saved
        const token = await getAccessToken();

        // 3) if it’s there, go to /home
        if (token) {
          router.replace('/(tabs)/personal_expenses/expenses');
          return; // bail out so we don’t render LoginScreen briefly
        }
      } catch (err) {
        // any unexpected error
        console.error(err);
        Alert.alert('Error', 'Something went wrong. Please log in.');
      } finally {
        // 4) either no refresh, or refresh failed, or after /home redirect
        setChecking(false);
      }
    })();
  }, [refresh, router]);

  if (checking) {
    return <ActivityIndicator size="large" />;  // your splash/loading UI
  }

  return (
    <SafeAreaView style={[local.safeArea, { backgroundColor: '#ffde1a' }]}>
      <View style={local.container}>
        {/* Illustration */}
        <Image
          source={require("@/assets/images/index-page-image.png")}
          style={local.image}
          resizeMode="contain"
        />

        {/* Title */}
        <Text style={[GS.title, { textAlign: 'center' }]}>
          Welcome to <Text style={local.brand}>{"\n"}Budget Buddy!</Text>
        </Text>

        {/* Subtitle */}
        <Text style={[GS.subtitle, local.subtitleSpacing, { textAlign: 'center' }]}>
          Tired of forgetting what you spent on?{"\n"}You have come to the right place!
        </Text>

        {/* Buttons */}
        <View style={{ width: '100%', paddingHorizontal: 40 }}>
          <TouchableOpacity 
            style={local.button} 
            onPress={() => router.replace('/auth/sign_up')}>
            <Text style={GS.buttonText}>Sign Up</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={local.button} 
            onPress={() => router.replace('/auth/sign_in')}>
            <Text style={GS.buttonText}>Sign In</Text>
          </TouchableOpacity>
        </View>

        {/* Legal */}
        <Text style={local.legalText}>
          By continuing you accept our{" "}
          <Text style={local.link}>Privacy Policy</Text> and{" "}
          <Text style={local.link}>Terms of Service</Text>.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const local = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#ffde1a",
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "flex-start", // move content up
    alignItems: "center",
    paddingTop: 120,               // adjust image top position
    backgroundColor: "transparent",
  },
  image: {
    width: 250,
    height: 250,
    marginBottom: 10,            // less space below image
  },
  brand: {
    color: "#2e7d32",
    fontFamily: "Poppins_700Bold",
  },
  subtitleSpacing: {
    marginBottom: 30,           // space between subtitle and buttons
  },
  legalText: {
    fontSize: 12,
    textAlign: 'center',
    fontFamily: 'Inter_400Regular',
    color: '#888',
    marginTop: 20,
  },
  link: {
    textDecorationLine: 'underline',
    color: '#888',
    fontWeight: 'bold'
  },
  button: {
    width:200,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 30,
    alignItems: 'center',
    backgroundColor: '#ffde1a',
    borderColor: '#000',
    borderWidth: 1,
    marginBottom: 16,
    alignSelf: 'center',
  }
});