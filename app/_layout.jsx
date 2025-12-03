import { router, Stack } from "expo-router";
import { useEffect } from "react";
import { ExpenseProvider } from "./context/ExpenseContext";

export default function RootLayout() {
  return (
    <ExpenseProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="signup" />
      </Stack>
    </ExpenseProvider>
  );
}
