import { icons } from "@/constants/icons";
import { View, Text, Image, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";

const Profile = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState<string>("User");

  useEffect(() => {
    const metaUsername = (user?.user_metadata as any)?.username as
      | string
      | undefined;
    const metaFullName = (user?.user_metadata as any)?.full_name as
      | string
      | undefined;
    setDisplayName(metaFullName || metaUsername || user?.email || "User");
  }, [user]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace("/(public)");
  };

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
        <View className="flex-1 px-6 py-10">
          <View className="items-center">
            <View
              style={{
                width: 96,
                height: 96,
                borderRadius: 48,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 16,
                backgroundColor: "rgba(171, 139, 255, 0.1)",
                borderWidth: 2,
                borderColor: "rgba(171, 139, 255, 0.3)",
              }}
            >
              <Image
                source={icons.person}
                style={{ width: 48, height: 48 }}
                tintColor="#AB8BFF"
              />
            </View>
            <Text style={{ color: "#FFFFFF", fontSize: 20, fontWeight: "700" }}>
              {displayName}
            </Text>
            <Text style={{ color: "#A8B5DB", marginTop: 6 }}>
              {user?.email ?? "Guest"}
            </Text>
          </View>

          <View style={{ marginTop: 28, gap: 12 }}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => router.push("/profile/settings")}
              style={{
                backgroundColor: "rgba(255,255,255,0.05)",
                borderRadius: 16,
                paddingVertical: 16,
                paddingHorizontal: 16,
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.08)",
              }}
            >
              <Text
                style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "600" }}
              >
                Account settings
              </Text>
              <Text style={{ color: "#A8B5DB", marginTop: 6 }}>
                View and manage your personal information
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => router.push("/profile/security")}
              style={{
                backgroundColor: "rgba(255,255,255,0.05)",
                borderRadius: 16,
                paddingVertical: 16,
                paddingHorizontal: 16,
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.08)",
              }}
            >
              <Text
                style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "600" }}
              >
                Security
              </Text>
              <Text style={{ color: "#A8B5DB", marginTop: 6 }}>
                Password and device sessions
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => router.push("/profile/privacy")}
              style={{
                backgroundColor: "rgba(255,255,255,0.05)",
                borderRadius: 16,
                paddingVertical: 16,
                paddingHorizontal: 16,
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.08)",
              }}
            >
              <Text
                style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "600" }}
              >
                Privacy & Policy
              </Text>
              <Text style={{ color: "#A8B5DB", marginTop: 6 }}>
                Learn how we handle your data
              </Text>
            </TouchableOpacity>
          </View>

          <View style={{ marginTop: 28 }}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleSignOut}
              style={{
                borderWidth: 2,
                borderColor: "#AB8BFF",
                borderRadius: 16,
                paddingVertical: 16,
                alignItems: "center",
                backgroundColor: "rgba(171, 139, 255, 0.05)",
              }}
            >
              <Text
                style={{ color: "#AB8BFF", fontSize: 16, fontWeight: "700" }}
              >
                Sign out
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
};

export default Profile;
