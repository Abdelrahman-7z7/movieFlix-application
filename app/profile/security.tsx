import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function SecurityScreen() {
  const router = useRouter();

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
          <TouchableOpacity
            className="w-12 h-12 rounded-full bg-white/5 border border-white/15 items-center justify-center mb-6"
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <Text
            style={{
              color: "#FFFFFF",
              fontSize: 24,
              fontWeight: "700",
              marginBottom: 20,
            }}
          >
            Security
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
              Manage your security preferences like password rules, device
              sessions, and recovery options.
            </Text>
            <Text style={{ color: "#FFFFFF" }}>
              This is placeholder content. You can add password change forms,
              2FA setup, and active session lists here.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
