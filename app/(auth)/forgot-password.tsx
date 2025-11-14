import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";

import { supabase } from "@/lib/supabase";
import { icons } from "@/constants/icons";

export default function ForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleResetLink = async () => {
    setMessage(null);
    setError(null);

    if (!email.trim()) {
      setError("Enter the email associated with your account.");
      return;
    }

    try {
      setLoading(true);

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        {
          redirectTo: __DEV__ 
            ? "exp://127.0.0.1:8081/--/(auth)/reset-password"
            : "myapp://(auth)/reset-password",
        },
      );

      if (resetError) {
        setError(resetError.message);
        return;
      }

      setMessage(
        "We sent a secure link to your email. Follow it to set a new password.",
      );
    } catch (err) {
      console.error("Forgot password error", err);
      setError("Could not send reset email. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-primary">
      <LinearGradient
        colors={["#030014", "#0F0D23"]}
        style={{ flex: 1 }}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          className="flex-1"
        >
          <ScrollView
            contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24 }}
            showsVerticalScrollIndicator={false}
          >
            <View className="flex-1 justify-between py-10">
              <View>
                <View className="items-center">
                  <Image source={icons.logo} className="h-16 w-20" />
                  <Text className="mt-6 text-2xl font-bold text-white">
                    Forgot your password?
                  </Text>
                  <Text className="mt-2 text-center text-sm text-light-300">
                    Enter your email and we&apos;ll send you a link to reset it.
                  </Text>
                </View>

                <View className="mt-12">
                  <View className="rounded-3xl border border-white/10 bg-white/5 p-5 mb-6">
                    <Text className="text-xs uppercase tracking-widest text-light-200">
                      Email
                    </Text>
                    <TextInput
                      value={email}
                      onChangeText={setEmail}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      placeholder="you@example.com"
                      placeholderTextColor="#9CA4AB"
                      className="mt-1 text-base font-medium text-white"
                    />
                  </View>

                  {error && (
                    <View className="rounded-2xl border border-red-500/40 bg-red-500/10 p-4 mb-6">
                      <Text className="text-sm text-red-300">{error}</Text>
                    </View>
                  )}

                  {message && (
                    <View className="rounded-2xl border border-green-500/40 bg-green-500/10 p-4 mb-6">
                      <Text className="text-sm text-green-300">{message}</Text>
                    </View>
                  )}

                  <TouchableOpacity
                    activeOpacity={0.85}
                    disabled={loading}
                    onPress={handleResetLink}
                  >
                    <LinearGradient
                      colors={["#AB8BFF", "#6A4CFF"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={{ borderRadius: 9999, padding: 2 }}
                    >
                      <View className="rounded-full bg-secondary px-6 py-4">
                        {loading ? (
                          <ActivityIndicator color="#ffffff" />
                        ) : (
                          <Text className="text-center text-base font-semibold text-white">
                            Send reset link
                          </Text>
                        )}
                      </View>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>

              <View className="items-center">
                <TouchableOpacity onPress={() => router.push("/(auth)/login")}>
                  <Text className="text-base font-semibold text-white">
                    Back to sign in
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </View>
  );
}
