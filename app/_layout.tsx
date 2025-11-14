import "react-native-url-polyfill/auto";
import { Stack } from "expo-router";
import "./globals.css";
import { StatusBar } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useNavigation } from "expo-router";
import { useEffect } from "react";
import * as Linking from "expo-linking";

export default function RootLayout() {
  const router = useRouter();
  const navigation = useNavigation();

  useEffect(() => {
    const handleDeepLink = (url: string) => {
      console.log("Global deep link handler:", url);

      if (url.includes("verify-email")) {
        // Navigate to verify-email screen
        router.replace("/(auth)/verify-email");
      } else if (url.includes("reset-password")) {
        // Navigate to reset-password screen
        router.replace("/(auth)/reset-password");
      }
    };

    // Handle deep links when app is already running
    const subscription = Linking.addEventListener("url", ({ url }) => {
      handleDeepLink(url);
    });

    // Handle initial URL
    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink(url);
    });

    return () => subscription.remove();
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar
        hidden={true}
        backgroundColor="#030014"
        barStyle="light-content"
        translucent={true}
      />

      <SafeAreaView
        style={{ flex: 1, backgroundColor: "#030014" }}
        edges={["top", "left", "right"]}
      >
        <Stack
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen
            name="index"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="(public)"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="(tabs)"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="(auth)"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="movie/[id]"
            options={{
              headerShown: false,
            }}
          />
        </Stack>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
