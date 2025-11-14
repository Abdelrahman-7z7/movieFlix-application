import { View, Text, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";

export default function PrivacyPolicyScreen() {
  return (
    <View className="flex-1">
      <LinearGradient
        colors={["#030014", "#0F0D23"]}
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          zIndex: 0,
        }}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <SafeAreaView className="flex-1">
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 20 }}
          showsVerticalScrollIndicator={false}
        >
          <Text
            style={{
              color: "#FFFFFF",
              fontSize: 24,
              fontWeight: "700",
              marginBottom: 20,
            }}
          >
            Privacy & Policy
          </Text>
          <View
            style={{
              backgroundColor: "rgba(255,255,255,0.05)",
              borderRadius: 16,
              padding: 16,
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.08)",
            }}
          >
            <Text style={{ color: "#A8B5DB", marginBottom: 6 }}>
              We respect your privacy. This page describes how we handle your
              data in the app.
            </Text>
            <Text style={{ color: "#FFFFFF" }}>
              This is placeholder content. Add your real privacy policy, data
              retention practices, and contact info here.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
