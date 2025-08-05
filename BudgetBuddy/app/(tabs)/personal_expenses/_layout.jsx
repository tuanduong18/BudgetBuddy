import { Stack } from "expo-router";
import { SafeAreaView } from "react-native";

export default function AuthLayout() {
  return (
    <Stack initialRouteName="expenses" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="expenses" options={{ title: 'All Expenses' }} />
      <Stack.Screen name="add"       options={{ title: 'Add Expense'  }} />
      <Stack.Screen name="history"   options={{ title: 'Expense History' }} />
      <Stack.Screen name="update"    options={{ title: 'Update Expense'  }} />
    </Stack>
  );
}