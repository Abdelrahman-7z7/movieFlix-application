import { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Image,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { supabase } from "@/lib/supabase";
import { icons } from "@/constants/icons";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs for keyboard navigation
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        setError(signInError.message);
        return;
      }

      router.replace("/(tabs)");
    } catch (err) {
      console.error("Login error", err);
      setError("Something went wrong. Please try again.");
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
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
          className="flex-1"
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <ScrollView
              contentContainerStyle={{
                flexGrow: 1,
                paddingHorizontal: 24,
                paddingTop: 20,
                paddingBottom: 40,
              }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View className="flex-1 justify-between py-10">
                <View>
                  <View className="items-center">
                    <Image source={icons.logo} className="h-16 w-20" />
                    <Text className="mt-6 text-2xl font-bold text-white">
                      Welcome back
                    </Text>
                    <Text className="mt-2 text-center text-sm text-light-300">
                      Sign in with your credentials to continue exploring the
                      galaxy of movies.
                    </Text>
                  </View>

                  <View className="mt-12">
                    <View>
                      <View className="rounded-3xl border border-white/10 bg-white/5 p-5 mb-3">
                        <Text className="text-xs uppercase tracking-widest text-light-200">
                          Email
                        </Text>
                        <TextInput
                          ref={emailRef}
                          value={email}
                          onChangeText={setEmail}
                          autoCapitalize="none"
                          keyboardType="email-address"
                          placeholder="you@example.com"
                          placeholderTextColor="#9CA4AB"
                          returnKeyType="next"
                          onSubmitEditing={() => passwordRef.current?.focus()}
                          className="mt-1 text-base font-medium text-white"
                        />
                      </View>

                      <View className="rounded-3xl border border-white/10 bg-white/5 p-5 mb-5">
                        <View className="flex-row items-center justify-between">
                          <Text className="text-xs uppercase tracking-widest text-light-200">
                            Password
                          </Text>
                          <TouchableOpacity
                            onPress={() => setShowPassword((prev) => !prev)}
                            hitSlop={12}
                          >
                            <Ionicons
                              name={showPassword ? "eye" : "eye-off"}
                              size={20}
                              color="#9CA4AB"
                            />
                          </TouchableOpacity>
                        </View>
                        <TextInput
                          ref={passwordRef}
                          value={password}
                          onChangeText={setPassword}
                          secureTextEntry={!showPassword}
                          placeholder="Your password"
                          placeholderTextColor="#9CA4AB"
                          returnKeyType="done"
                          onSubmitEditing={handleLogin}
                          className="mt-1 text-base font-medium text-white"
                        />
                      </View>
                    </View>

                    {error && (
                      <View className="rounded-2xl border border-red-500/40 bg-red-500/10 p-4 mb-5">
                        <Text className="text-sm text-red-300">{error}</Text>
                      </View>
                    )}

                    <TouchableOpacity
                      className="self-end mb-5"
                      onPress={() => router.push("/(auth)/forgot-password")}
                    >
                      <Text className="text-sm font-medium text-accent">
                        Forgot password?
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      activeOpacity={0.85}
                      disabled={loading}
                      onPress={handleLogin}
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
                              Sign In
                            </Text>
                          )}
                        </View>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </View>

                <View className="items-center">
                  <Text className="text-sm text-light-300">
                    Don&apos;t have an account?
                  </Text>
                  <TouchableOpacity
                    className="mt-2"
                    onPress={() => router.push("/(auth)/signup")}
                  >
                    <Text className="text-base font-semibold text-white">
                      Create one now
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </LinearGradient>
    </View>
  );
}
