import { Stack } from "expo-router";
import { useFonts } from "expo-font";
import { ThemeProvider } from "@/context/ThemeContext";
import { Poppins_700Bold } from "@expo-google-fonts/poppins";
import { Inter_400Regular } from "@expo-google-fonts/inter";

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Poppins_700Bold,
    Inter_400Regular,
  });

  if (!fontsLoaded) return null; // Prevent font flickering

  return (
    <ThemeProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </ThemeProvider>
  );
}
