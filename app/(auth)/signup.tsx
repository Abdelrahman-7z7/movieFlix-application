import { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  Modal,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import Constants from "expo-constants";

import { supabase } from "@/lib/supabase";
import { icons } from "@/constants/icons";
import DateTimePicker from "@react-native-community/datetimepicker";

// Determine the correct redirect URL based on environment
const getRedirectUrl = () => {
  // Development - use Expo scheme
  if (__DEV__) {
    return "exp://127.0.0.1:8081/--/(auth)/verify-email";
  }

  // Production - use custom scheme
  return "myapp://(auth)/verify-email";
};

export default function Signup() {
  const router = useRouter();
  const [step, setStep] = useState(1);

  // Step 1: Account basics
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [username, setUsername] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Refs for keyboard navigation
  const usernameRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);
  const fullNameRef = useRef<TextInput>(null);
  const phoneRef = useRef<TextInput>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  // Step 2: Personal info
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState<Date>(new Date(2000, 0, 1));

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Validation functions
  const validateUsername = (value: string): boolean => {
    return /^[a-zA-Z0-9_]+$/.test(value);
  };

  const validatePhone = (value: string): boolean => {
    return /^\+?\d{10,15}$/.test(value.replace(/\s/g, ""));
  };

  const validateEmail = (value: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  };

  const handleNext = () => {
    setError(null);

    if (step === 1) {
      if (!email.trim() || !password || !confirmPassword || !username.trim()) {
        setError("Please fill in all fields.");
        return;
      }

      if (!validateEmail(email.trim())) {
        setError("Please enter a valid email address.");
        return;
      }

      if (!validateUsername(username.trim())) {
        setError(
          "Username can only contain letters, numbers, and underscores.",
        );
        return;
      }

      if (password.length < 8) {
        setError("Password must be at least 8 characters long.");
        return;
      }

      if (password !== confirmPassword) {
        setError("Passwords do not match. Please try again.");
        return;
      }

      setStep(2);
    }
  };

  const handleBack = () => {
    setError(null);
    setStep(1);
  };

  const handleSignup = async () => {
    setError(null);

    if (!fullName.trim() || !phone.trim() || !birthDate.trim()) {
      setError("Please fill in all required fields.");
      return;
    }

    if (fullName.trim().length < 3) {
      setError("Full name must be at least 3 characters long.");
      return;
    }

    if (!validatePhone(phone.trim())) {
      setError(
        "Please enter a valid phone number (10-15 digits, optional + prefix).",
      );
      return;
    }

    try {
      setLoading(true);

      const metadata = {
        username: username.trim().toLowerCase(),
        phone_number: phone.trim().replace(/\s/g, ""),
        full_name: fullName.trim(),
        birth_date: birthDate.trim(),
      };

      // Use environment-aware redirect URL
      const redirectUrl = getRedirectUrl();

      const { data: authData, error: signUpError } = await supabase.auth.signUp(
        {
          email: email.trim(),
          password,
          options: {
            data: metadata,
            emailRedirectTo: redirectUrl,
          },
        },
      );

      if (signUpError) {
        const msg = signUpError.message || "";
        if (msg.includes("profiles_username_key")) {
          setError("This username is already taken.");
        } else if (msg.includes("profiles_phone_key")) {
          setError("This phone number is already in use.");
        } else if (msg.includes("Missing required metadata")) {
          setError(
            "Please provide username, full name, phone number, and birth date.",
          );
        } else {
          setError(msg || "Failed to create account. Please try again.");
        }
        return;
      }

      if (!authData.user) {
        setError("Failed to create account. Please try again.");
        return;
      }

      router.push({
        pathname: "/(auth)/verify-email",
        params: { email: email.trim() },
      });
    } catch (err) {
      console.error("Signup error", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ... rest of your JSX remains the same
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
                paddingTop: 10,
                paddingBottom: 20,
              }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View className="flex-1 py-4">
            {/* Header */}
            <View className="items-center mb-4" style={{ minHeight: 40 }}>
              <Image 
                source={icons.logo} 
                style={{ width: 50, height: 40 }} 
                resizeMode="contain"
              />
              <View
                className="flex-row items-center mt-4 mb-3"
                style={{ gap: 8 }}
              >
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor:
                      step >= 1 ? "#AB8BFF" : "rgba(171, 139, 255, 0.3)",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text
                    style={{
                      color: "#FFFFFF",
                      fontSize: 14,
                      fontWeight: "600",
                    }}
                  >
                    1
                  </Text>
                </View>
                <View
                  style={{
                    width: 40,
                    height: 2,
                    backgroundColor:
                      step >= 2 ? "#AB8BFF" : "rgba(171, 139, 255, 0.3)",
                  }}
                />
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor:
                      step >= 2 ? "#AB8BFF" : "rgba(171, 139, 255, 0.3)",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text
                    style={{
                      color: "#FFFFFF",
                      fontSize: 14,
                      fontWeight: "600",
                    }}
                  >
                    2
                  </Text>
                </View>
              </View>
              <Text className="text-xl font-bold text-white">
                {step === 1 ? "Account Details" : "Personal Information"}
              </Text>
              <Text className="text-sm text-light-300 text-center mt-2">
                {step === 1
                  ? "Let's start with your account credentials"
                  : "Tell us a bit about yourself"}
              </Text>
            </View>

            {/* Form Content */}
            <View className="mt-4">
              {step === 1 ? (
                <View>
                  <View className="rounded-3xl border border-white/10 bg-white/5 p-4 mb-2">
                    <Text className="text-xs uppercase tracking-widest text-light-200">
                      Username
                    </Text>
                    <TextInput
                      ref={usernameRef}
                      value={username}
                      onChangeText={(text) => {
                        setUsername(text);
                        setError(null);
                      }}
                      autoCapitalize="none"
                      placeholder="johndoe"
                      placeholderTextColor="#9CA4AB"
                      returnKeyType="next"
                      onSubmitEditing={() => emailRef.current?.focus()}
                      className="mt-1 text-base font-medium text-white"
                    />
                    <Text className="mt-1 text-xs text-light-300">
                      Letters, numbers, and underscores only
                    </Text>
                  </View>

                  <View className="rounded-3xl border border-white/10 bg-white/5 p-4 mb-2">
                    <Text className="text-xs uppercase tracking-widest text-light-200">
                      Email
                    </Text>
                    <TextInput
                      ref={emailRef}
                      value={email}
                      onChangeText={(text) => {
                        setEmail(text);
                        setError(null);
                      }}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      placeholder="you@example.com"
                      placeholderTextColor="#9CA4AB"
                      returnKeyType="next"
                      onSubmitEditing={() => passwordRef.current?.focus()}
                      className="mt-1 text-base font-medium text-white"
                    />
                  </View>

                  <View className="rounded-3xl border border-white/10 bg-white/5 p-4 mb-2">
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
                      onChangeText={(text) => {
                        setPassword(text);
                        setError(null);
                      }}
                      secureTextEntry={!showPassword}
                      placeholder="Create a strong password"
                      placeholderTextColor="#9CA4AB"
                      returnKeyType="next"
                      onSubmitEditing={() => {
                        confirmPasswordRef.current?.focus();
                        // Scroll to show confirm password field, but keep logo visible
                        setTimeout(() => {
                          scrollViewRef.current?.scrollTo({ 
                            y: 250, 
                            animated: true 
                          });
                        }, 100);
                      }}
                      onFocus={() => {
                        // Scroll to show password field when focused, but keep logo visible
                        setTimeout(() => {
                          scrollViewRef.current?.scrollTo({ 
                            y: 200, 
                            animated: true 
                          });
                        }, 300);
                      }}
                      className="mt-1 text-base font-medium text-white"
                    />
                    <Text className="mt-1 text-xs text-light-300">
                      At least 8 characters
                    </Text>
                  </View>

                  <View className="rounded-3xl border border-white/10 bg-white/5 p-4 mb-3">
                    <View className="flex-row items-center justify-between">
                      <Text className="text-xs uppercase tracking-widest text-light-200">
                        Confirm Password
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
                        setError(null);
                      }}
                      secureTextEntry={!showConfirmPassword}
                      placeholder="Confirm your password"
                      placeholderTextColor="#9CA4AB"
                      returnKeyType="done"
                      onSubmitEditing={Keyboard.dismiss}
                      onFocus={() => {
                        // Scroll to show confirm password field when focused, but keep logo visible
                        setTimeout(() => {
                          scrollViewRef.current?.scrollTo({ 
                            y: 250, 
                            animated: true 
                          });
                        }, 300);
                      }}
                      className="mt-1 text-base font-medium text-white"
                    />
                    <Text className="mt-1 text-xs text-light-300">
                      Re-enter your password
                    </Text>
                  </View>
                </View>
              ) : (
                <View>
                  <View className="rounded-3xl border border-white/10 bg-white/5 p-4 mb-2">
                    <Text className="text-xs uppercase tracking-widest text-light-200">
                      Full Name
                    </Text>
                    <TextInput
                      ref={fullNameRef}
                      value={fullName}
                      onChangeText={(text) => {
                        setFullName(text);
                        setError(null);
                      }}
                      placeholder="John Doe"
                      placeholderTextColor="#9CA4AB"
                      returnKeyType="next"
                      onSubmitEditing={() => phoneRef.current?.focus()}
                      className="mt-1 text-base font-medium text-white"
                    />
                    <Text className="mt-1 text-xs text-light-300">
                      Minimum 3 characters
                    </Text>
                  </View>

                  <View className="rounded-3xl border border-white/10 bg-white/5 p-4 mb-2">
                    <Text className="text-xs uppercase tracking-widest text-light-200">
                      Phone Number
                    </Text>
                    <TextInput
                      ref={phoneRef}
                      value={phone}
                      onChangeText={(text) => {
                        setPhone(text);
                        setError(null);
                      }}
                      keyboardType="phone-pad"
                      placeholder="+1234567890"
                      placeholderTextColor="#9CA4AB"
                      returnKeyType="done"
                      onSubmitEditing={Keyboard.dismiss}
                      className="mt-1 text-base font-medium text-white"
                    />
                    <Text className="mt-1 text-xs text-light-300">
                      10-15 digits, optional + prefix
                    </Text>
                  </View>

                  {/* Birth Date picker */}
                  <View className="rounded-3xl border border-white/10 bg-white/5 p-4 mb-3">
                    <Text className="text-xs uppercase tracking-widest text-light-200">
                      Birth Date (Optional)
                    </Text>

                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => {
                        if (birthDate) {
                          setTempDate(new Date(birthDate));
                        } else {
                          setTempDate(new Date(2000, 0, 1));
                        }
                        setShowDatePicker(true);
                      }}
                      style={{
                        paddingVertical: 12,
                        paddingHorizontal: 4,
                        borderRadius: 8,
                        backgroundColor: "rgba(255,255,255,0.05)",
                      }}
                    >
                      <Text
                        style={{
                          color: "#FFFFFF",
                          fontSize: 16,
                          fontWeight: "500",
                        }}
                      >
                        {birthDate ? birthDate : "Select your birth date"}
                      </Text>
                    </TouchableOpacity>

                    {Platform.OS === "ios" ? (
                      <Modal
                        visible={showDatePicker}
                        transparent={true}
                        animationType="slide"
                        onRequestClose={() => setShowDatePicker(false)}
                      >
                        <View
                          style={{
                            flex: 1,
                            backgroundColor: "rgba(0,0,0,0.5)",
                            justifyContent: "flex-end",
                          }}
                        >
                          <View
                            style={{
                              backgroundColor: "#221F3D",
                              borderTopLeftRadius: 20,
                              borderTopRightRadius: 20,
                              paddingTop: 20,
                              paddingBottom: 40,
                            }}
                          >
                            <View
                              style={{
                                flexDirection: "row",
                                justifyContent: "space-between",
                                alignItems: "center",
                                paddingHorizontal: 20,
                                paddingBottom: 15,
                                borderBottomWidth: 1,
                                borderBottomColor: "rgba(255,255,255,0.1)",
                              }}
                            >
                              <TouchableOpacity
                                onPress={() => setShowDatePicker(false)}
                                style={{ padding: 8 }}
                              >
                                <Text
                                  style={{ color: "#9CA4AB", fontSize: 16 }}
                                >
                                  Cancel
                                </Text>
                              </TouchableOpacity>
                              <Text
                                style={{
                                  color: "#FFFFFF",
                                  fontSize: 18,
                                  fontWeight: "600",
                                }}
                              >
                                Select Date
                              </Text>
                              <TouchableOpacity
                                onPress={() => {
                                  const formatted = tempDate
                                    .toISOString()
                                    .split("T")[0];
                                  setBirthDate(formatted);
                                  setShowDatePicker(false);
                                }}
                                style={{ padding: 8 }}
                              >
                                <Text
                                  style={{
                                    color: "#AB8BFF",
                                    fontSize: 16,
                                    fontWeight: "600",
                                  }}
                                >
                                  Done
                                </Text>
                              </TouchableOpacity>
                            </View>
                            <View
                              style={{
                                paddingHorizontal: 2,
                                alignItems: "center",
                              }}
                            >
                              <DateTimePicker
                                mode="date"
                                display="spinner"
                                value={tempDate}
                                onChange={(event, selectedDate) => {
                                  if (selectedDate) {
                                    setTempDate(selectedDate);
                                  }
                                }}
                                maximumDate={new Date()}
                                textColor="#FFFFFF"
                                themeVariant="dark"
                                style={{ alignSelf: "center" }}
                              />
                            </View>
                          </View>
                        </View>
                      </Modal>
                    ) : (
                      showDatePicker && (
                        <DateTimePicker
                          mode="date"
                          display="default"
                          value={
                            birthDate
                              ? new Date(birthDate)
                              : new Date(2000, 0, 1)
                          }
                          onChange={(event, selectedDate) => {
                            setShowDatePicker(false);
                            if (event.type === "set" && selectedDate) {
                              const formatted = selectedDate
                                .toISOString()
                                .split("T")[0];
                              setBirthDate(formatted);
                            }
                          }}
                          maximumDate={new Date()}
                          textColor="#FFFFFF"
                          themeVariant="dark"
                        />
                      )
                    )}

                    <Text className="mt-1 text-xs text-light-300">
                      Tap to choose a date
                    </Text>
                  </View>
                </View>
              )}

              {error && (
                <View className="rounded-2xl border border-red-500/40 bg-red-500/10 p-4 mt-4">
                  <Text className="text-sm text-red-300">{error}</Text>
                </View>
              )}
            </View>

            {/* Action Buttons */}
            <View style={{ gap: 10, marginTop: 16 }}>
              {step === 1 ? (
                <TouchableOpacity activeOpacity={0.85} onPress={handleNext}>
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
                        Continue
                      </Text>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              ) : (
                <>
                  <TouchableOpacity
                    activeOpacity={0.85}
                    disabled={loading}
                    onPress={handleSignup}
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
                          alignItems: "center",
                        }}
                      >
                        {loading ? (
                          <ActivityIndicator color="#ffffff" />
                        ) : (
                          <Text
                            style={{
                              color: "#FFFFFF",
                              fontSize: 16,
                              fontWeight: "600",
                            }}
                          >
                            Create Account
                          </Text>
                        )}
                      </View>
                    </LinearGradient>
                  </TouchableOpacity>
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={handleBack}
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
                      style={{
                        color: "#AB8BFF",
                        fontSize: 16,
                        fontWeight: "600",
                      }}
                    >
                      Back
                    </Text>
                  </TouchableOpacity>
                </>
              )}

              <View className="items-center mt-4">
                <Text className="text-sm text-light-300">
                  Already a member?
                </Text>
                <TouchableOpacity
                  className="mt-2"
                  onPress={() => router.push("/(auth)/login")}
                >
                  <Text className="text-base font-semibold text-white">
                    Sign in here
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
              </View>
            </ScrollView>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </LinearGradient>
    </View>
  );
}
