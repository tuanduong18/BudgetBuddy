/**
 * Root layout — mounts the global font families and wraps the entire
 * navigation tree in a SafeAreaProvider so all child screens can use
 * useSafeAreaInsets() without requiring their own provider.
 */
import { Stack } from "expo-router";
import { useFonts } from "expo-font";
import { Poppins_700Bold } from "@expo-google-fonts/poppins";
import { Inter_400Regular } from "@expo-google-fonts/inter";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Poppins_700Bold,
    Inter_400Regular,
  });

  // Delay rendering until both custom fonts are loaded to avoid FOUT.
  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </SafeAreaProvider>
  );
}
