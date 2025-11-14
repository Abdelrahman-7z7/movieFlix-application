import { View, Text, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "@/hooks/useAuth";

export default function SettingsScreen() {
  const { user } = useAuth();
  const meta = (user?.user_metadata as any) || {};

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
            Account settings
          </Text>

          <View style={{ gap: 12 }}>
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
                Full name
              </Text>
              <Text style={{ color: "#FFFFFF", fontWeight: "600" }}>
                {meta.full_name ?? "—"}
              </Text>
            </View>
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
                Username
              </Text>
              <Text style={{ color: "#FFFFFF", fontWeight: "600" }}>
                {meta.username ?? "—"}
              </Text>
            </View>
            <View
              style={{
                backgroundColor: "rgba(255,255,255,0.05)",
                borderRadius: 16,
                padding: 16,
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.08)",
              }}
            >
              <Text style={{ color: "#A8B5DB", marginBottom: 6 }}>Email</Text>
              <Text style={{ color: "#FFFFFF", fontWeight: "600" }}>
                {user?.email ?? "—"}
              </Text>
            </View>
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
                Birth date
              </Text>
              <Text style={{ color: "#FFFFFF", fontWeight: "600" }}>
                {meta.birth_date ?? "—"}
              </Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
