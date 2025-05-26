import { View, Text, TouchableOpacity, Image, StyleSheet, ActivityIndicator, ALert } from "react-native";
import { useRouter } from "expo-router";
import { useContext, useState, useEffect } from "react";
import { ThemeContext } from "@/context/ThemeContext";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRefreshToken } from "@/hooks/auth";
import { getAccessToken } from "@/constants/authStorage";

export default function WelcomeScreen() {
  const { theme, colorScheme } = useContext(ThemeContext);
  const router = useRouter();
  const refresh = useRefreshToken();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        // 1) attempt the refresh flow
        await refresh();

        // 2) read out the access token you just saved
        const token = await getAccessToken();

        // 3) if it’s there, go to /home
        if (token) {
          router.replace('/tabs/home_page');
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
    <SafeAreaView style={[styles.safeArea, { backgroundColor: '#ffde1a' }]}>
      <View style={styles.container}>
        {/* Illustration */}
        <Image
          source={require("@/assets/images/index-page-image.png")}
          style={styles.image}
          resizeMode="contain"
        />

        {/* Title */}
        <Text style={[styles.title, { color: 'black' }]}>
          Welcome to <Text style={styles.brand}>{"\n"}Budget Buddy!</Text>
        </Text>

        {/* Subtitle */}
        <Text style={[styles.subtitle, { color: 'black' }]}>
          Need a good budget tracker?{"\n"}You have come to the right place!
        </Text>

        {/* Buttons */}
        <TouchableOpacity style={[styles.buttonOutline, { backgroundColor: theme.button }]} onPress={() => router.push('/auth/sign_up')}>
          <Text style={[styles.buttonText, { color: 'black' }]}>Sign Up</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.buttonOutline, { backgroundColor: theme.button }]} onPress={() => router.push('/auth/sign_in')}>
          <Text style={[styles.buttonText, { color: 'black' }]}>Sign In</Text>
        </TouchableOpacity>

        {/* Legal */}
        <Text style={styles.legalText}>
          By continuing you accept our{" "}
          <Text style={styles.link}>Privacy Policy</Text> and{" "}
          <Text style={styles.link}>Terms of Service</Text>.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  image: {
    width: 220,
    height: 220,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontFamily: "Poppins_700Bold",
    textAlign: "center",
  },
  brand: {
    color: "#2e7d32", // deeper green
    fontFamily: "Poppins_700Bold",
  },
  subtitle: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    marginBottom: 30,
    lineHeight: 22,
  },
  buttonOutline: {
    borderWidth: 2,
    padding: 12,
    width: "100%",
    borderRadius: 8,
    marginBottom: 12,
    alignItems: "center",
  },
  buttonFilled: {
    padding: 12,
    width: "100%",
    borderRadius: 8,
    marginBottom: 20,
    alignItems: "center",
  },
  buttonText: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
  },
  continue: {
    fontSize: 14,
    textDecorationLine: "underline",
    marginBottom: 12,
  },
  legalText: {
    fontSize: 12,
    textAlign: "center",
    fontFamily: "Inter_400Regular",
    color: "#777",
  },
  link: {
    textDecorationLine: "underline",
    fontWeight: "bold",
  },
});
