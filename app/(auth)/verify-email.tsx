import { useEffect, useState, useRef } from "react";
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
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Linking from "expo-linking";

import { supabase } from "@/lib/supabase";
import { icons } from "@/constants/icons";

export default function ResetPassword() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const initialAccessToken = typeof params.access_token === "string" ? params.access_token : undefined;
  const initialRefreshToken = typeof params.refresh_token === "string" ? params.refresh_token : undefined;

  const newPasswordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const hasProcessedRef = useRef(false);

  // ✅ New: confirmation state (mirrors VerifyEmail)
  const [confirming, setConfirming] = useState(false);
  const [confirmationStatus, setConfirmationStatus] = useState<"idle" | "confirming" | "success" | "error">(
    initialAccessToken && initialRefreshToken ? "confirming" : "idle"
  );
  const [confirmationMessage, setConfirmationMessage] = useState<string | null>(
    initialAccessToken && initialRefreshToken
      ? "Confirming your reset link..."
      : "Open this link from the recovery email we sent you."
  );

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const parseResetUrl = (url: string) => {
    let parsedAccessToken: string | undefined;
    let parsedRefreshToken: string | undefined;

    try {
      const hashIndex = url.indexOf("#");
      if (hashIndex !== -1) {
        const fragment = url.substring(hashIndex + 1);
        const fragmentParams = new URLSearchParams(fragment);
        parsedAccessToken = fragmentParams.get("access_token") || undefined;
        parsedRefreshToken = fragmentParams.get("refresh_token") || undefined;
      }
    } catch (err) {
      console.warn("Failed to parse reset password URL", err);
    }

    return { parsedAccessToken, parsedRefreshToken };
  };

  // ✅ Reset confirmation state (mirrors resetVerificationState)
  const resetConfirmationState = () => {
    setConfirmationStatus("idle");
    setConfirmationMessage("Open this link from the recovery email we sent you.");
    setConfirming(false);
  };

  // ✅ Process tokens with timeout & feedback (mirrors processVerificationUrl)
  const processTokens = async (accessToken: string, refreshToken: string) => {
    if (hasProcessedRef.current) return;
    hasProcessedRef.current = true;

    // Start confirmation flow
    setConfirming(true);
    setConfirmationStatus("confirming");
    setConfirmationMessage("Confirming your reset link...");

    // ✅ Add timeout for safety (8 seconds)
    const timeout = setTimeout(() => {
      if (hasProcessedRef.current) {
        setConfirmationStatus("error");
        setConfirmationMessage("The reset link timed out. Please request a new one.");
        setConfirming(false);
      }
    }, 8000);

    try {
      const { data, error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      clearTimeout(timeout);

      if (error) {
        console.error("Set session error", error);
        setConfirmationStatus("error");
        setConfirmationMessage(error.message || "Unable to verify your reset token.");
        return;
      }

      if (data.session) {
        setConfirmationStatus("success");
        setConfirmationMessage("Your identity has been verified! Please set a new password.");
      } else {
        setConfirmationStatus("error");
        setConfirmationMessage("Invalid or expired reset link.");
      }
    } catch (err: any) {
      clearTimeout(timeout);
      console.error("Unexpected error", err);
      setConfirmationStatus("error");
      setConfirmationMessage("Something went wrong. Please try again.");
    } finally {
      setConfirming(false);
    }
  };

  // Handle initial load
  useEffect(() => {
    let cancelled = false;

    const processInitial = async () => {
      if (initialAccessToken && initialRefreshToken) {
        if (!cancelled) {
          await processTokens(initialAccessToken, initialRefreshToken);
        }
        return;
      }

      try {
        const initialUrl = await Linking.getInitialURL();
        if (initialUrl && initialUrl.includes("reset-password")) {
          const { parsedAccessToken, parsedRefreshToken } = parseResetUrl(initialUrl);
          if (parsedAccessToken && parsedRefreshToken) {
            if (!cancelled) {
              await processTokens(parsedAccessToken, parsedRefreshToken);
            }
            return;
          }
        }

        if (!cancelled) {
          resetConfirmationState();
        }
      } catch (err) {
        console.warn("Failed to get initial URL", err);
        if (!cancelled) {
          resetConfirmationState();
        }
      }
    };

    if (!hasProcessedRef.current) {
      processInitial();
    }

    return () => {
      cancelled = true;
    };
  }, []);

  // Handle deep links while app is running
  useEffect(() => {
    const subscription = Linking.addEventListener("url", async ({ url }) => {
      if (url.includes("reset-password")) {
        const { parsedAccessToken, parsedRefreshToken } = parseResetUrl(url);
        if (parsedAccessToken && parsedRefreshToken && !hasProcessedRef.current) {
          await processTokens(parsedAccessToken, parsedRefreshToken);
        }
      }
    });

    return () => subscription.remove();
  }, []);

  const handleReset = async () => {
    setFormError(null);
    setSuccess(null);

    if (!newPassword || !confirmPassword) {
      setFormError("Please complete both password fields.");
      return;
    }

    if (newPassword.length < 8) {
      setFormError("Password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setFormError("Passwords do not match. Please try again.");
      return;
    }

    // ✅ Use confirmationStatus instead of sessionStatus
    if (confirmationStatus !== "success") {
      setFormError("Use the secure link from your email to reset your password.");
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.updateUser({ password: newPassword });

      if (error) {
        setFormError(error.message);
        return;
      }

      setSuccess("Password updated! You can now sign in with your new credentials.");
      setTimeout(() => router.replace("/(auth)/login"), 1500);
    } catch (err) {
      console.error("Reset password error", err);
      setFormError("Something went wrong. Please try again in a moment.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Show full-screen loader during active confirmation (optional but consistent)
  if (confirming && confirmationStatus === "confirming") {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#030014" }}>
        <ActivityIndicator size="large" color="#AB8BFF" />
        <Text style={{ color: "#FFFFFF", marginTop: 16 }}>Confirming reset link...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-primary">
      <LinearGradient
        colors={["#030014", "#221F3D"]}
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
              ref={scrollViewRef}
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
                      Set a new password
                    </Text>
                    <Text className="mt-2 text-center text-sm text-light-300">
                      Choose a fresh password to secure your account.
                    </Text>
                  </View>

                  <View className="mt-12">
                    {/* ✅ Unified confirmation feedback banner (mirrors VerifyEmail) */}
                    {confirmationMessage && (
                      <View
                        className={`rounded-2xl border p-4 mb-5 ${
                          confirmationStatus === "error"
                            ? "border-red-500/40 bg-red-500/10"
                            : confirmationStatus === "success"
                            ? "border-green-500/40 bg-green-500/10"
                            : "border-white/10 bg-white/5"
                        }`}
                      >
                        <View className="flex-row items-center justify-between">
                          <Text
                            className={`text-sm ${
                              confirmationStatus === "error"
                                ? "text-red-300"
                                : confirmationStatus === "success"
                                ? "text-green-300"
                                : "text-light-200"
                            }`}
                          >
                            {confirmationMessage}
                          </Text>
                          {confirming && <ActivityIndicator size="small" color="#ffffff" />}
                        </View>
                      </View>
                    )}

                    <View>
                      <View className="rounded-3xl border border-white/10 bg-white/5 p-5 mb-3">
                        <View className="flex-row items-center justify-between">
                          <Text className="text-xs uppercase tracking-widest text-light-200">
                            New password
                          </Text>
                          <TouchableOpacity
                            onPress={() => setShowNewPassword((prev) => !prev)}
                            hitSlop={12}
                          >
                            <Ionicons
                              name={showNewPassword ? "eye" : "eye-off"}
                              size={20}
                              color="#9CA4AB"
                            />
                          </TouchableOpacity>
                        </View>
                        <TextInput
                          ref={newPasswordRef}
                          value={newPassword}
                          onChangeText={(text) => {
                            setNewPassword(text);
                            setFormError(null);
                          }}
                          secureTextEntry={!showNewPassword}
                          placeholder="Create a strong password"
                          placeholderTextColor="#9CA4AB"
                          returnKeyType="next"
                          onSubmitEditing={() => {
                            confirmPasswordRef.current?.focus();
                            setTimeout(() => {
                              scrollViewRef.current?.scrollTo({ y: 200, animated: true });
                            }, 100);
                          }}
                          onFocus={() => {
                            setTimeout(() => {
                              scrollViewRef.current?.scrollTo({ y: 150, animated: true });
                            }, 300);
                          }}
                          className="mt-1 text-base font-medium text-white"
                        />
                      </View>

                      <View className="rounded-3xl border border-white/10 bg-white/5 p-5 mb-5">
                        <View className="flex-row items-center justify-between">
                          <Text className="text-xs uppercase tracking-widest text-light-200">
                            Confirm password
                          </Text>
                          <TouchableOpacity
                            onPress={() => setShowConfirmPassword((prev) => !prev)}
                            hitSlop={12}
                          >
                            <Ionicons
                              name={showConfirmPassword ? "eye" : "eye-off"}
                              size={20}
                              color="#9CA4AB"
                            />
                          </TouchableOpacity>
                        </View>
                        <TextInput
                          ref={confirmPasswordRef}
                          value={confirmPassword}
                          onChangeText={(text) => {
                            setConfirmPassword(text);
                            setFormError(null);
                          }}
                          secureTextEntry={!showConfirmPassword}
                          placeholder="Repeat the password"
                          placeholderTextColor="#9CA4AB"
                          returnKeyType="done"
                          onSubmitEditing={Keyboard.dismiss}
                          onFocus={() => {
                            setTimeout(() => {
                              scrollViewRef.current?.scrollTo({ y: 200, animated: true });
                            }, 300);
                          }}
                          className="mt-1 text-base font-medium text-white"
                        />
                      </View>
                    </View>

                    {formError && (
                      <View className="rounded-2xl border border-red-500/40 bg-red-500/10 p-4 mb-5">
                        <Text className="text-sm text-red-300">{formError}</Text>
                      </View>
                    )}

                    {success && (
                      <View className="rounded-2xl border border-green-500/40 bg-green-500/10 p-4 mb-5">
                        <Text className="text-sm text-green-300">{success}</Text>
                      </View>
                    )}

                    <TouchableOpacity
                      activeOpacity={0.85}
                      disabled={loading || confirmationStatus !== "success"}
                      onPress={handleReset}
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
                              Update password
                            </Text>
                          )}
                        </View>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </View>

                <View className="items-center">
                  <TouchableOpacity onPress={() => router.replace("/(auth)/login")}>
                    <Text className="text-base font-semibold text-white">
                      Return to sign in
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