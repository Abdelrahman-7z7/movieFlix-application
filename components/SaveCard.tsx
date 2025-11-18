import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useState, useEffect } from "react";

interface SaveCardProps {
  id: string;
  name: string;
  cover_url: string | null;
  movieCount: number;
  movies?: any[]; // Array of movies for creating collage
  isDefault?: boolean;
  onDelete?: (id: string, name: string) => void;
  onRename?: (id: string, newName: string) => void;
}

const SaveCard = ({
  id,
  name,
  cover_url,
  movieCount,
  movies = [],
  isDefault = false,
  onDelete,
  onRename,
}: SaveCardProps) => {
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);
  const [showRename, setShowRename] = useState(false);
  const [newName, setNewName] = useState(name);

  // Update newName when name prop changes (after rename)
  useEffect(() => {
    setNewName(name);
  }, [name]);

  const handlePress = () => {
    if (!showMenu) {
      router.push(`/savedMovie/${id}` as any);
    }
  };

  const handleLongPress = () => {
    if (isDefault) return;
    setShowMenu(true);
  };

  const handleRename = () => {
    setShowMenu(false);
    setShowRename(true);
  };

  const handleRenameConfirm = () => {
    if (newName.trim() && newName.trim() !== name && onRename) {
      onRename(id, newName.trim());
    }
    setShowRename(false);
    setNewName(name);
  };

  const handleRenameCancel = () => {
    setShowRename(false);
    setNewName(name);
  };

  const handleDelete = () => {
    setShowMenu(false);
    if (onDelete) {
      onDelete(id, name);
    }
  };

  // Create a collage from first 4 movies if no cover_url
  const renderCover = () => {
    if (cover_url) {
      return (
        <Image
          source={{ uri: cover_url }}
          className="w-full h-full"
          resizeMode="cover"
        />
      );
    }

    // Create collage from movie posters
    if (movies && movies.length > 0) {
      const postersToShow = movies.slice(0, 4);

      if (postersToShow.length === 1) {
        return (
          <Image
            source={{
              uri:
                postersToShow[0].poster_url ||
                "https://placehold.co/400x600/1a1a1a/FFFFFF.png",
            }}
            className="w-full h-full"
            resizeMode="cover"
          />
        );
      }

      // Grid layout for 2-4 posters
      return (
        <View className="w-full h-full flex-row flex-wrap">
          {postersToShow.map((movie, index) => (
            <View key={index} className="w-1/2 h-1/2">
              <Image
                source={{
                  uri:
                    movie.poster_url ||
                    "https://placehold.co/400x600/1a1a1a/FFFFFF.png",
                }}
                className="w-full h-full"
                resizeMode="cover"
              />
            </View>
          ))}
          {/* Fill remaining slots if less than 4 */}
          {postersToShow.length < 4 &&
            Array.from({ length: 4 - postersToShow.length }).map((_, idx) => (
              <View
                key={`empty-${idx}`}
                className="w-1/2 h-1/2 bg-dark-100 items-center justify-center"
              >
                <Ionicons name="film-outline" size={20} color="#6A4CFF" />
              </View>
            ))}
        </View>
      );
    }

    // Default placeholder
    return (
      <View className="w-full h-full bg-dark-100 items-center justify-center">
        <Ionicons
          name={isDefault ? "bookmark" : "film-outline"}
          size={32}
          color="#6A4CFF"
        />
      </View>
    );
  };

  return (
    <>
      <TouchableOpacity
        onPress={handlePress}
        onLongPress={handleLongPress}
        activeOpacity={0.8}
        className="w-[48%] mb-4"
      >
        <View className="rounded-xl overflow-hidden bg-dark-100">
          {/* Cover Image/Collage */}
          <View className="w-full aspect-[3/4] relative">
            {renderCover()}

            {/* Gradient overlay for better text readability */}
            <LinearGradient
              colors={["transparent", "rgba(0,0,0,0.7)"]}
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                height: "40%",
              }}
            />

            {/* Collection name overlay */}
            <View className="absolute bottom-0 left-0 right-0 p-3">
              <Text
                className="text-white font-semibold text-sm"
                numberOfLines={2}
              >
                {name}
              </Text>
              <Text className="text-light-300 text-xs mt-1">
                {movieCount} {movieCount === 1 ? "movie" : "movies"}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>

      {/* Menu Modal - Shows on long press */}
      <Modal
        visible={showMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMenu(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setShowMenu(false)}
          className="flex-1 bg-black/70 justify-center items-center"
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            className="bg-dark-100 rounded-2xl w-[80%] max-w-sm overflow-hidden"
          >
            <LinearGradient
              colors={["#221F3D", "#0F0D23"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View className="p-6">
                <Text className="text-white font-bold text-xl mb-4 text-center">
                  {name}
                </Text>

                <View className="gap-3">
                  {onRename && (
                    <TouchableOpacity
                      onPress={handleRename}
                      className="bg-accent/20 border border-accent/50 rounded-xl px-4 py-4 flex-row items-center"
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name="create-outline"
                        size={24}
                        color="#AB8BFF"
                      />
                      <Text className="text-white font-semibold ml-3 text-base">
                        Rename Collection
                      </Text>
                    </TouchableOpacity>
                  )}

                  {onDelete && (
                    <TouchableOpacity
                      onPress={handleDelete}
                      className="bg-red-500/20 border border-red-500/50 rounded-xl px-4 py-4 flex-row items-center"
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={24}
                        color="#ef4444"
                      />
                      <Text className="text-red-400 font-semibold ml-3 text-base">
                        Delete Collection
                      </Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    onPress={() => setShowMenu(false)}
                    className="bg-dark-200 rounded-xl px-4 py-4 items-center mt-2"
                    activeOpacity={0.7}
                  >
                    <Text className="text-light-300 font-semibold text-base">
                      Cancel
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Rename Modal */}
      <Modal
        visible={showRename}
        transparent
        animationType="fade"
        onRequestClose={handleRenameCancel}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={handleRenameCancel}
          className="flex-1 bg-black/70 justify-center items-center px-4"
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            className="bg-dark-100 rounded-2xl w-full max-w-sm overflow-hidden"
          >
            <LinearGradient
              colors={["#221F3D", "#0F0D23"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View className="p-6">
                <Text className="text-white font-bold text-xl mb-4">
                  Rename Collection
                </Text>

                <TextInput
                  value={newName}
                  onChangeText={setNewName}
                  placeholder="Collection name"
                  placeholderTextColor="#9CA4AB"
                  className="text-white bg-dark-200 rounded-xl px-4 py-3.5 mb-4 text-base"
                  autoFocus
                  maxLength={50}
                />

                <View className="flex-row gap-3">
                  <TouchableOpacity
                    onPress={handleRenameConfirm}
                    disabled={!newName.trim() || newName.trim() === name}
                    className={`flex-1 rounded-xl py-3.5 items-center ${
                      newName.trim() && newName.trim() !== name
                        ? "bg-accent"
                        : "bg-gray-600"
                    }`}
                  >
                    <Text className="text-white font-bold text-base">Save</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleRenameCancel}
                    className="flex-1 bg-dark-200 rounded-xl py-3.5 items-center border border-dark-300"
                  >
                    <Text className="text-light-200 font-semibold text-base">
                      Cancel
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

export default SaveCard;
