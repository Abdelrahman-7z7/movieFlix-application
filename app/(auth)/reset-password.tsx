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

// ========================================
// MODULE-LEVEL STATE AND LISTENER SETUP
// This runs ONCE when the module loads, before any React component
// ========================================

let globalMostRecentUrl: string | null = null;
let globalMostRecentTimestamp: number = 0;
let globalLastProcessedUrl: string | null = null;
let globalIsProcessing: boolean = false;

// Extract timestamp from URL
const getUrlTimestamp = (url: string): number => {
  try {
    const match = url.match(/[?&]t=(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  } catch {
    return 0;
  }
};

// Set up listener IMMEDIATELY when module loads
console.log("🎯 Setting up module-level deep link listener...");
const globalUrlListener = Linking.addEventListener("url", ({ url }) => {
  const timestamp = getUrlTimestamp(url);
  console.log(`🔥 Deep link received: t=${timestamp}`);
  
  if (url.includes("reset-password")) {
    // Only accept if this URL is NEWER than what we have
    if (timestamp > globalMostRecentTimestamp) {
      console.log(`✅ NEW URL accepted (${timestamp} > ${globalMostRecentTimestamp})`);
      globalMostRecentUrl = url;
      globalMostRecentTimestamp = timestamp;
    } else {
      console.log(`⏭️ OLD URL rejected (${timestamp} <= ${globalMostRecentTimestamp})`);
    }
  }
});

// ========================================
// REACT COMPONENT
// ========================================

export default function ResetPassword() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const newPasswordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  
  // Track if this instance has already initialized
  const hasInitialized = useRef(false);

  const [sessionStatus, setSessionStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [sessionError, setSessionError] = useState<string | null>("Open this link from the recovery email we sent you.");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const parseResetUrl = (url: string) => {
    const timestamp = getUrlTimestamp(url);
    console.log(`📝 Parsing URL with timestamp: t=${timestamp}`);
    
    try {
      const urlObj = new URL(url);
      
      if (urlObj.hash) {
        const hashParams = new URLSearchParams(urlObj.hash.substring(1));
        
        // Check for errors first
        const error = hashParams.get('error');
        const errorCode = hashParams.get('error_code');
        const errorDescription = hashParams.get('error_description');
        
        if (error) {
          console.log(`❌ Error in URL t=${timestamp}:`, { error, errorCode });
          return { 
            accessToken: null, 
            refreshToken: null,
            error: errorDescription || "Reset link is invalid or has expired",
            timestamp
          };
        }
        
        // Check for tokens
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const type = hashParams.get('type');
        
        if (accessToken && refreshToken && type === 'recovery') {
          console.log(`✅ Valid tokens in URL t=${timestamp}`);
          return { 
            accessToken, 
            refreshToken, 
            error: null,
            timestamp
          };
        }
      }
      
      console.log(`⚠️ No valid data in URL t=${timestamp}`);
      return { 
        accessToken: null, 
        refreshToken: null, 
        error: "No valid reset link found",
        timestamp
      };
    } catch (error) {
      console.error("💥 Error parsing URL:", error);
      return { 
        accessToken: null, 
        refreshToken: null, 
        error: "Invalid URL format",
        timestamp: 0
      };
    }
  };

  const processTokens = async (accessToken: string, refreshToken: string) => {
    console.log("🔐 Setting session with tokens...");
    setSessionStatus("loading");
    setSessionError("Confirming your reset link...");

    try {
      // Clear any existing session to prevent caching
      await supabase.auth.signOut();

      // Set the new session with the provided tokens
      const { data, error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (error) {
        console.error("❌ Set session error:", error.message);
        setSessionStatus("error");
        setSessionError("The reset link is invalid or expired. Please request a new one.");
        return;
      }

      if (data.session) {
        console.log("✅ Session set successfully - ready for password reset");
        setSessionStatus("ready");
        setSessionError(null);
      } else {
        console.log("❌ No session created");
        setSessionStatus("error");
        setSessionError("Invalid reset link. Please request a new one.");
      }
    } catch (err: any) {
      console.error("💥 Unexpected error:", err);
      setSessionStatus("error");
      setSessionError("Something went wrong. Please try again later.");
    }
  };

  const resetFormState = () => {
    setNewPassword("");
    setConfirmPassword("");
    setFormError(null);
    setSuccess(null);
  };

  const processUrl = async (url: string, source: string) => {
    const urlTimestamp = getUrlTimestamp(url);
    
    // Prevent duplicate processing
    if (globalIsProcessing) {
      console.log(`⏸️ Already processing, skipping t=${urlTimestamp}`);
      return;
    }

    // Check if we've already processed this exact URL
    if (globalLastProcessedUrl === url) {
      console.log(`⏭️ Already processed t=${urlTimestamp}`);
      return;
    }

    console.log(`🚀 Processing URL from ${source}, t=${urlTimestamp}`);
    globalIsProcessing = true;

    try {
      // Clear any existing session first
      await supabase.auth.signOut();
      
      // Reset form state
      resetFormState();
      
      const { accessToken, refreshToken, error, timestamp } = parseResetUrl(url);
      
      if (error) {
        console.log(`❌ URL error at t=${timestamp}:`, error);
        setSessionStatus("error");
        setSessionError(error);
        // DON'T mark error URLs as processed - allow retry with new link
      } else if (accessToken && refreshToken) {
        console.log(`✅ Processing valid tokens at t=${timestamp}`);
        await processTokens(accessToken, refreshToken);
        // Mark as processed
        globalLastProcessedUrl = url;
      } else {
        console.log(`❌ Invalid URL format at t=${timestamp}`);
        setSessionStatus("error");
        setSessionError("Invalid reset link format. Please request a new one.");
      }
    } catch (err) {
      console.error("💥 Error processing URL:", err);
      setSessionStatus("error");
      setSessionError("Failed to process reset link. Please try again.");
    } finally {
      globalIsProcessing = false;
    }
  };

  // Initialize and process URLs
  useEffect(() => {
    // Prevent double initialization
    if (hasInitialized.current) {
      console.log("⏭️ Already initialized this instance");
      return;
    }
    hasInitialized.current = true;

    let mounted = true;

    const initialize = async () => {
      console.log("🎬 Initializing reset password screen...");

      // 1. Check route params first (highest priority)
      if (params.access_token && params.refresh_token) {
        console.log("✅ Tokens found in route params");
        if (mounted) {
          await processTokens(params.access_token as string, params.refresh_token as string);
        }
        return;
      }

      // 2. Wait for deep link to be captured by global listener
      console.log("⏳ Waiting 500ms for deep links...");
      await new Promise(resolve => setTimeout(resolve, 500));

      if (!mounted) return;

      // 3. Check if global listener captured a URL
      if (globalMostRecentUrl) {
        const timestamp = getUrlTimestamp(globalMostRecentUrl);
        console.log(`✅ Using URL from global listener, t=${timestamp}`);
        await processUrl(globalMostRecentUrl, "listener-capture");
        return;
      }

      // 4. Fallback: Check initial URL
      console.log("📱 Checking initial URL as fallback...");
      try {
        const initialUrl = await Linking.getInitialURL();
        
        if (initialUrl && initialUrl.includes("reset-password")) {
          const timestamp = getUrlTimestamp(initialUrl);
          console.log(`📱 Using initial URL, t=${timestamp}`);
          
          // Update global state if this is newer
          if (timestamp > globalMostRecentTimestamp) {
            globalMostRecentUrl = initialUrl;
            globalMostRecentTimestamp = timestamp;
          }
          
          await processUrl(initialUrl, "cold-start");
        } else {
          console.log("ℹ️ No reset-password URL found");
          if (mounted) {
            setSessionStatus("idle");
            setSessionError("Open this link from the recovery email we sent you.");
          }
        }
      } catch (err) {
        console.warn("⚠️ Failed to get initial URL", err);
        if (mounted) {
          setSessionStatus("idle");
          setSessionError("Open this link from the recovery email we sent you.");
        }
      }
    };

    initialize();

    return () => {
      mounted = false;
    };
  }, [params]);

  const handleManualRefresh = async () => {
    console.log("🔄 Manual refresh triggered");
    
    if (globalMostRecentUrl) {
      const timestamp = getUrlTimestamp(globalMostRecentUrl);
      console.log(`📍 Using stored URL, t=${timestamp}`);
    }
    
    // Clear the last processed URL to allow reprocessing
    globalLastProcessedUrl = null;
    
    // Reset everything
    await supabase.auth.signOut();
    resetFormState();
    setSessionStatus("loading");
    setSessionError("Checking for reset link...");
    
    // Use the global most recent URL
    if (globalMostRecentUrl && globalMostRecentUrl.includes("reset-password")) {
      console.log("✅ Reprocessing stored URL");
      await processUrl(globalMostRecentUrl, "manual-refresh");
    } else {
      console.log("❌ No stored URL available");
      setSessionStatus("error");
      setSessionError("No reset link found. Please open the link from your email.");
    }
  };

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

    if (sessionStatus !== "ready") {
      setFormError("Your reset link is not ready.");
      return;
    }

    try {
      setLoading(true);
      
      const { error } = await supabase.auth.updateUser({ 
        password: newPassword 
      });

      if (error) {
        console.error("❌ Update user error:", error.message);
        setFormError("Failed to update password. Please try again.");
        return;
      }

      console.log("✅ Password updated successfully!");
      setSuccess("Password updated! You can now sign in with your new credentials.");
      
      // Clear stored URLs on success
      globalMostRecentUrl = null;
      globalMostRecentTimestamp = 0;
      globalLastProcessedUrl = null;
      
      // Sign out and redirect to login
      await supabase.auth.signOut();
      
      setTimeout(() => router.replace("/(auth)/login"), 2000);
    } catch (err) {
      console.error("💥 Reset password error", err);
      setFormError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

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
                    {sessionError && (
                      <View
                        className={`rounded-2xl border p-4 mb-5 ${
                          sessionStatus === "error"
                            ? "border-red-500/40 bg-red-500/10"
                            : sessionStatus === "loading"
                            ? "border-white/10 bg-white/5"
                            : "border-white/20 bg-white/5"
                        }`}
                      >
                        <View className="flex-row items-center justify-between">
                          <View className="flex-1 mr-2">
                            <Text
                              className={`text-sm ${
                                sessionStatus === "error"
                                  ? "text-red-300"
                                  : sessionStatus === "loading"
                                  ? "text-light-200"
                                  : "text-light-200"
                              }`}
                            >
                              {sessionError}
                            </Text>
                          </View>
                          {sessionStatus === "loading" && (
                            <ActivityIndicator size="small" color="#ffffff" />
                          )}
                        </View>
                        
                        {sessionStatus === "error" && (
                          <TouchableOpacity 
                            onPress={handleManualRefresh}
                            className="mt-3 bg-white/10 rounded-lg py-2 px-3"
                          >
                            <Text className="text-white text-xs font-semibold text-center">
                              Try Again
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    )}

                    {sessionStatus === "ready" && (
                      <>
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
                          disabled={loading}
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
                      </>
                    )}
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