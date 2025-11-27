import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ImageSourcePropType,
  TextInput,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { supabase } from "@/lib/supabase";
import RefreshableWrapper from "@/components/RefreshableWrapper";
import RefreshableScroll from "@/components/RefreshableScroll";

const defaultAvatar =
  require("@/assets/images/profile_default_image.jpeg") as ImageSourcePropType;

export default function SettingsScreen() {
  const { user } = useAuth() as { user: AuthUser | null };
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const meta: UserMetadata = user?.user_metadata || {};
  const avatarURL = profile?.avatar_url ?? meta.avatar_url ?? null;
  const joinedDate = user?.created_at
    ? new Date(user.created_at).toLocaleDateString()
    : "—";
  const isRefreshing = refreshing || loadingProfile || uploadingAvatar;

  // -------- Fetch profile --------
  const fetchProfile = async () => {
    if (!user) return;

    setLoadingProfile(true);
    try {
      const { data, error } = await supabase
        .from<"profiles", Profile>("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) console.log("Fetch profile error:", error);
      else setProfile(data);
    } finally {
      setLoadingProfile(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [user]);

  // -------- Refresh handler --------
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProfile();
    setRefreshing(false);
  };

  // -------- Avatar upload --------
  const handleAvatarUpload = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
    });
    if (result.canceled) return;
    const asset = result.assets[0];

    setUploadingAvatar(true);

    try {
      const { data: existingProfile } = await supabase
        .from<"profiles", Profile>("profiles")
        .select("avatar_path")
        .eq("id", user!.id)
        .single();

      if (existingProfile?.avatar_path) {
        await supabase.storage
          .from("profiles")
          .remove([existingProfile.avatar_path]);
      }

      const response = await fetch(asset.uri);
      const arrayBuffer = await response.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      const ext = asset.uri.split(".").pop() || "jpg";
      const fileName = `${user!.id}-${Date.now()}.${ext}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("profiles")
        .upload(filePath, bytes, {
          contentType: asset.mimeType ?? "image/jpeg",
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from("profiles")
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrlData.publicUrl, avatar_path: filePath })
        .eq("id", user!.id);

      if (updateError) throw updateError;

      setProfile((prev) => ({
        ...prev!,
        avatar_url: publicUrlData.publicUrl,
        avatar_path: filePath,
      }));
    } catch (err) {
      console.error("Avatar upload failed:", err);
    } finally {
      setUploadingAvatar(false); // the wrapper now sees isRefreshing=true until this finishes
    }
  };

  // -------- Change password --------
  const handlePasswordChange = async () => {
    try {
      if (!currentPassword || !newPassword || !confirmPassword) return;
      if (newPassword !== confirmPassword) return;

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user!.email,
        password: currentPassword,
      });
      if (signInError) return console.log("Wrong password");

      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (!error) {
        setIsPasswordModalOpen(false);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch (err) {
      console.error("Error changing the password:", err);
    }
  };

  // -------- Render --------
  return (
    <RefreshableWrapper loading={isRefreshing} refreshing={refreshing}>
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
      <SafeAreaView style={{ flex: 1 }}>
        <RefreshableScroll
          onRefresh={onRefresh}
          refreshing={refreshing}
          contentContainerStyle={{ padding: 24 }}
        >
          {/* Back button */}
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ marginBottom: 20 }}
          >
            <Ionicons name="arrow-back" size={20} color="#FFF" />
          </TouchableOpacity>

          {/* Username */}
          <Text
            style={{
              color: "#FFF",
              fontSize: 20,
              fontWeight: "700",
              marginBottom: 20,
            }}
          >
            @{meta.username ?? "username"}
          </Text>

          {/* Profile row */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 20 }}>
            <View style={{ position: "relative" }}>
              <Image
                source={avatarURL ? { uri: avatarURL } : defaultAvatar}
                style={{ width: 100, height: 100, borderRadius: 100 }}
              />
              <TouchableOpacity
                onPress={handleAvatarUpload}
                style={{
                  position: "absolute",
                  bottom: 0,
                  right: 0,
                  backgroundColor: "rgba(0,0,0,0.6)",
                  padding: 6,
                  borderRadius: 20,
                }}
              >
                <Ionicons name="pencil" size={14} color="#FFF" />
              </TouchableOpacity>
            </View>

            <View>
              <Text style={{ color: "#A8B5DB" }}>Full name</Text>
              <Text style={{ color: "#FFF", fontWeight: "700", fontSize: 18 }}>
                {meta.full_name ?? "—"}
              </Text>
            </View>
          </View>
          {/* Bio */}
          <TouchableOpacity
            style={{
              marginTop: 24,
              backgroundColor: "rgba(255,255,255,0.05)",
              borderRadius: 16,
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.08)",
              padding: 16,
            }}
          >
            <Text style={{ color: "#A8B5DB", marginBottom: 6 }}>Bio</Text>
            <Text style={{ color: "#FFF", fontWeight: "600" }}>
              {meta.bio ?? "No bio added yet"}
            </Text>
          </TouchableOpacity>

          {/* Two-column row */}
          <View style={{ flexDirection: "row", gap: 12, marginTop: 16 }}>
            <View
              style={{
                flex: 1,
                backgroundColor: "rgba(255,255,255,0.05)",
                borderRadius: 16,
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.08)",
                padding: 16,
              }}
            >
              <Text style={{ color: "#A8B5DB", marginBottom: 6 }}>
                Birth date
              </Text>
              <Text style={{ color: "#FFF", fontWeight: "600" }}>
                {meta.birth_date ?? "—"}
              </Text>
            </View>

            <View
              style={{
                flex: 1,
                backgroundColor: "rgba(255,255,255,0.05)",
                borderRadius: 16,
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.08)",
                padding: 16,
              }}
            >
              <Text style={{ color: "#A8B5DB", marginBottom: 6 }}>Joined</Text>
              <Text style={{ color: "#FFF", fontWeight: "600" }}>
                {joinedDate}
              </Text>
            </View>
          </View>

          {/* Email */}
          <View
            style={{
              marginTop: 16,
              backgroundColor: "rgba(255,255,255,0.05)",
              borderRadius: 16,
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.08)",
              padding: 16,
            }}
          >
            <Text style={{ color: "#A8B5DB", marginBottom: 6 }}>Email</Text>
            <Text style={{ color: "#FFF", fontWeight: "600" }}>
              {user?.email ?? "—"}
            </Text>
          </View>

          {/* Phone */}
          <View
            style={{
              marginTop: 16,
              backgroundColor: "rgba(255,255,255,0.05)",
              borderRadius: 16,
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.08)",
              padding: 16,
            }}
          >
            <Text style={{ color: "#A8B5DB", marginBottom: 6 }}>
              Phone number
            </Text>
            <Text style={{ color: "#FFF", fontWeight: "600" }}>
              {meta.phone_number ?? "—"}
            </Text>
          </View>

          {/* Change Password CTA */}
          <TouchableOpacity
            onPress={() => setIsPasswordModalOpen(true)}
            style={{
              marginTop: 24,
              backgroundColor: "rgba(255,255,255,0.12)",
              padding: 16,
              borderRadius: 16,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#FFF", fontWeight: "700" }}>
              Change Password
            </Text>
          </TouchableOpacity>

          {/* Password modal */}
          <Modal visible={isPasswordModalOpen} transparent animationType="fade">
            <View
              style={{
                flex: 1,
                backgroundColor: "rgba(0,0,0,0.6)",
                justifyContent: "center",
                padding: 24,
              }}
            >
              <View
                style={{
                  backgroundColor: "#0F0D23",
                  padding: 20,
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.1)",
                }}
              >
                <Text
                  style={{
                    color: "#FFF",
                    fontSize: 18,
                    fontWeight: "700",
                    marginBottom: 16,
                  }}
                >
                  Change Password
                </Text>

                <TextInput
                  placeholder="Current password"
                  placeholderTextColor="#888"
                  secureTextEntry
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  style={{
                    backgroundColor: "#1A1A35",
                    borderRadius: 12,
                    padding: 14,
                    color: "#FFF",
                    marginBottom: 12,
                  }}
                />

                <TextInput
                  placeholder="New password"
                  placeholderTextColor="#888"
                  secureTextEntry
                  value={newPassword}
                  onChangeText={setNewPassword}
                  style={{
                    backgroundColor: "#1A1A35",
                    borderRadius: 12,
                    padding: 14,
                    color: "#FFF",
                    marginBottom: 12,
                  }}
                />

                <TextInput
                  placeholder="Confirm new password"
                  placeholderTextColor="#888"
                  secureTextEntry
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  style={{
                    backgroundColor: "#1A1A35",
                    borderRadius: 12,
                    padding: 14,
                    color: "#FFF",
                    marginBottom: 20,
                  }}
                />

                <TouchableOpacity
                  onPress={handlePasswordChange}
                  style={{
                    backgroundColor: "#4C49F6",
                    paddingVertical: 14,
                    borderRadius: 12,
                    alignItems: "center",
                    marginBottom: 10,
                  }}
                >
                  <Text style={{ color: "#FFF", fontWeight: "700" }}>
                    Update Password
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setIsPasswordModalOpen(false)}
                  style={{ paddingVertical: 10, alignItems: "center" }}
                >
                  <Text style={{ color: "#AAA" }}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </RefreshableScroll>
      </SafeAreaView>
    </RefreshableWrapper>
  );
}
