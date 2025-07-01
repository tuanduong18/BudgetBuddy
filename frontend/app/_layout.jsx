import { Stack } from "expo-router";
import { useFonts } from "expo-font";
import { ThemeProvider } from "@/context/ThemeContext";
import { Poppins_700Bold } from "@expo-google-fonts/poppins";
import { Inter_400Regular } from "@expo-google-fonts/inter";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Poppins_700Bold,
    Inter_400Regular,
  });

  if (!fontsLoaded) return null; // Prevent font flickering

  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </SafeAreaProvider>
  );
}
