// import { Stack } from "expo-router";

// export default function AuthLayout() {
//   return <Stack screenOptions={{headerShown: false}}/>
// }

import { Slot } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { View, StyleSheet } from "react-native";

export default function AuthLayout() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Slot /> {/* Renders sign_in or sign_up */}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#ffde1a", // soft green like the image
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
  },
});
