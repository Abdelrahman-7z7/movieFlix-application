import { View, TouchableOpacity, ActivityIndicator } from "react-native";
import React from "react";
import { Ionicons } from "@expo/vector-icons";

interface SaveButtonProps {
  isSaved: boolean;
  onPress: () => void;
  loading?: boolean;
  size?: number;
}

const SaveButton = ({
  isSaved,
  onPress,
  loading = false,
  size = 28,
}: SaveButtonProps) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={loading}
      className="bg-dark-100 rounded-full p-3 shadow-lg active:scale-95 transition-transform"
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
        elevation: 8,
      }}
    >
      {loading ? (
        <ActivityIndicator size="small" color="#fff" />
      ) : (
        <Ionicons
          name={isSaved ? "bookmark" : "bookmark-outline"}
          size={size}
          color="#fff"
        />
      )}
    </TouchableOpacity>
  );
};

export default SaveButton;
