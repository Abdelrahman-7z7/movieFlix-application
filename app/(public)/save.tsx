import { icons } from "@/constants/icons";
import { View, Text, Image, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";

const Save = () => {
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
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24 }}
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-1 justify-center items-center py-10">
            <View className="items-center mb-8">
              <View
                style={{
                  width: 100,
                  height: 100,
                  borderRadius: 50,
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 24,
                  backgroundColor: "rgba(171, 139, 255, 0.1)",
                  borderWidth: 2,
                  borderColor: "rgba(171, 139, 255, 0.3)",
                }}
              >
                <Image
                  source={icons.save}
                  style={{ width: 50, height: 50 }}
                  tintColor="#AB8BFF"
                />
              </View>

              <Text
                style={{
                  fontSize: 28,
                  fontWeight: "700",
                  color: "#FFFFFF",
                  marginBottom: 12,
                  textAlign: "center",
                }}
              >
                Save Your Favorites
              </Text>

              <Text
                style={{
                  fontSize: 15,
                  color: "#A8B5DB",
                  textAlign: "center",
                  lineHeight: 22,
                  paddingHorizontal: 20,
                }}
              >
                Create an account to save movies you love and access them
                anytime, anywhere.
              </Text>
            </View>

            <View className="w-full mt-8" style={{ gap: 12 }}>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => router.push("/(auth)/login")}
                style={{ marginBottom: 4 }}
              >
                <LinearGradient
                  colors={["#AB8BFF", "#6A4CFF"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ borderRadius: 16, padding: 2 }}
                >
                  <View
                    style={{
                      backgroundColor: "#151312",
                      borderRadius: 14,
                      paddingVertical: 16,
                      paddingHorizontal: 24,
                      alignItems: "center",
                    }}
                  >
                    <Text
                      style={{
                        color: "#FFFFFF",
                        fontSize: 16,
                        fontWeight: "600",
                      }}
                    >
                      Sign In
                    </Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => router.push("/(auth)/signup")}
                style={{
                  borderWidth: 2,
                  borderColor: "#AB8BFF",
                  borderRadius: 16,
                  paddingVertical: 16,
                  paddingHorizontal: 24,
                  alignItems: "center",
                  backgroundColor: "rgba(171, 139, 255, 0.05)",
                }}
              >
                <Text
                  style={{
                    color: "#AB8BFF",
                    fontSize: 16,
                    fontWeight: "600",
                  }}
                >
                  Create Account
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

export default Save;
