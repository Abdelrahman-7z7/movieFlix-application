import { useEffect } from "react";
import { useRouter, useSegments } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import { useAuth } from "@/hooks/useAuth";

export default function Index() {
  const { isAuthenticated, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === "(auth)";
    const inPublicGroup = segments[0] === "(public)";
    const inTabsGroup = segments[0] === "(tabs)";

    if (isAuthenticated) {
      // User is signed in, redirect to tabs if not already there
      if (!inTabsGroup && !inAuthGroup) {
        router.replace("/(tabs)");
      }
    } else {
      // User is NOT signed in, redirect to public if not already there
      if (!inPublicGroup && !inAuthGroup) {
        router.replace("/(public)");
      }
    }
  }, [isAuthenticated, loading, segments, router]);

  // Show loading screen while checking auth
  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#030014",
        }}
      >
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  // Return null while redirecting (the useEffect will handle the redirect)
  return null;
}
