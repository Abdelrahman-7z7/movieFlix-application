import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  FlatList,
  TextInput,
  Image,
  ActivityIndicator,
  Alert,
  ScrollView,
  Animated,
  Dimensions,
} from "react-native";
import React, { useState, useEffect, useRef } from "react";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import {
  getUserCollections,
  createCollection,
  addMovieToCollection,
  removeMovieFromCollection,
  getCollectionMovies,
  removeMovieFromAllCollections,
  isMovieSaved,
  saveMovieWithoutCollections,
  isMovieOnlyInSavedMovies,
  getMovieCollectionIds,
} from "@/services/supabaseAPI";

interface Collection {
  id: string;
  name: string;
  cover_url: string | null;
  created_at: string;
  user_id: string;
}

interface CollectionsPopupProps {
  visible: boolean;
  onClose: () => void;
  movie: {
    id: number;
    title: string;
    poster_path: string | null;
  };
}

const CollectionsPopup = ({
  visible,
  onClose,
  movie,
}: CollectionsPopupProps) => {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollections, setSelectedCollections] = useState<Set<string>>(
    new Set(),
  );
  const [initialSelectedCollections, setInitialSelectedCollections] = useState<
    Set<string>
  >(new Set());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showNewCollection, setShowNewCollection] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [isMovieCurrentlySaved, setIsMovieCurrentlySaved] = useState(false);
  const [isOnlyInSavedMovies, setIsOnlyInSavedMovies] = useState(false);
  const [creatingCollection, setCreatingCollection] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      loadCollections();
      Animated.spring(slideAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }).start();
    } else {
      // Reset states when closing
      setShowNewCollection(false);
      setNewCollectionName("");
      slideAnim.setValue(0);
    }
  }, [visible]);

  const loadCollections = async () => {
    setLoading(true);
    try {
      const data = await getUserCollections();
      console.log("Collections loaded:", data?.length || 0);
      setCollections(data || []);

      // Get collection IDs that contain this movie
      const movieCollectionIds = await getMovieCollectionIds(movie.id);
      console.log("Movie collection IDs:", movieCollectionIds);
      const selected = new Set<string>(movieCollectionIds);
      const initialSelected = new Set<string>(movieCollectionIds);

      setSelectedCollections(selected);
      setInitialSelectedCollections(initialSelected);

      // Check if movie is saved (in SavedMovies table)
      const saved = await isMovieSaved(movie.id);
      console.log("Movie saved:", saved);
      setIsMovieCurrentlySaved(saved);

      // Check if movie is ONLY in SavedMovies (not in any collections)
      const onlyInSaved = await isMovieOnlyInSavedMovies(movie.id);
      console.log("Only in SavedMovies:", onlyInSaved);
      setIsOnlyInSavedMovies(onlyInSaved);
    } catch (error) {
      console.error("Error loading collections:", error);
      // Set defaults on error
      setCollections([]);
      setSelectedCollections(new Set());
      setInitialSelectedCollections(new Set());
      setIsMovieCurrentlySaved(false);
      setIsOnlyInSavedMovies(false);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCollection = async () => {
    if (!newCollectionName.trim()) return;

    setCreatingCollection(true);
    try {
      const newCollection = await createCollection(newCollectionName.trim());
      if (newCollection) {
        setCollections([newCollection, ...collections]);
        setNewCollectionName("");
        setShowNewCollection(false);
        // Auto-select the newly created collection
        const newSelected = new Set(selectedCollections);
        newSelected.add(newCollection.id);
        setSelectedCollections(newSelected);
        setIsMovieCurrentlySaved(true);
        setIsOnlyInSavedMovies(false);
      }
    } catch (error) {
      console.error("Error creating collection:", error);
      Alert.alert("Error", "Could not create collection. Please try again.");
    } finally {
      setCreatingCollection(false);
    }
  };

  const toggleCollection = (collectionId: string) => {
    const newSelected = new Set(selectedCollections);
    if (newSelected.has(collectionId)) {
      newSelected.delete(collectionId);
    } else {
      newSelected.add(collectionId);
    }
    setSelectedCollections(newSelected);

    // Update saved status
    if (newSelected.size > 0) {
      setIsMovieCurrentlySaved(true);
      setIsOnlyInSavedMovies(false);
    } else {
      // If no collections selected, check if it's still in SavedMovies
      setIsMovieCurrentlySaved(true); // Still saved in SavedMovies
      setIsOnlyInSavedMovies(true);
    }
  };

  const handleCompleteRemoval = async () => {
    // Prevent deletion if movie is ONLY in SavedMovies
    if (isOnlyInSavedMovies) {
      Alert.alert(
        "Cannot Remove",
        "This movie is saved without collections. You cannot remove it completely. Please add it to at least one collection first.",
      );
      return;
    }

    Alert.alert(
      "Remove from All Collections",
      "Are you sure you want to remove this movie from all collections? The movie will remain in your saved movies.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            setSaving(true);
            try {
              // Remove from all collections but keep in SavedMovies
              for (const collectionId of selectedCollections) {
                const movies = await getCollectionMovies(collectionId);
                const movieInCollection = movies.find(
                  (m: any) => m.movie_id === movie.id,
                );

                if (movieInCollection) {
                  await removeMovieFromCollection(
                    collectionId,
                    movieInCollection.id,
                  );
                }
              }

              setSelectedCollections(new Set());
              setIsOnlyInSavedMovies(true);
              setIsMovieCurrentlySaved(true);
              onClose();
            } catch (error) {
              console.error("Error removing movie:", error);
              Alert.alert("Error", "Could not remove movie from collections.");
            } finally {
              setSaving(false);
            }
          },
        },
      ],
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Ensure movie is in SavedMovies first
      const isSaved = await isMovieSaved(movie.id);
      if (!isSaved && selectedCollections.size === 0) {
        // Save to SavedMovies only (no collections)
        await saveMovieWithoutCollections(movie as any);
        setIsOnlyInSavedMovies(true);
        setIsMovieCurrentlySaved(true);
        onClose();
        return;
      }

      // If movie is not saved yet but collections are selected, addMovieToCollection will handle saving to SavedMovies
      if (!isSaved && selectedCollections.size > 0) {
        // Will be saved when adding to collections
      }

      // Handle collection additions/removals
      // Add to newly selected collections
      for (const collectionId of selectedCollections) {
        if (!initialSelectedCollections.has(collectionId)) {
          const movies = await getCollectionMovies(collectionId);
          const isInCollection = movies.some(
            (m: any) => m.movie_id === movie.id,
          );

          if (!isInCollection) {
            await addMovieToCollection(collectionId, movie as any);
          }
        }
      }

      // Remove from unselected collections
      for (const collectionId of initialSelectedCollections) {
        if (!selectedCollections.has(collectionId)) {
          const movies = await getCollectionMovies(collectionId);
          const movieInCollection = movies.find(
            (m: any) => m.movie_id === movie.id,
          );

          if (movieInCollection) {
            await removeMovieFromCollection(collectionId, movieInCollection.id);
          }
        }
      }

      // If no collections selected but movie was in collections, save to SavedMovies only
      if (
        selectedCollections.size === 0 &&
        initialSelectedCollections.size > 0
      ) {
        // Movie is now only in SavedMovies
        setIsOnlyInSavedMovies(true);
      } else if (selectedCollections.size > 0) {
        setIsOnlyInSavedMovies(false);
      }

      setInitialSelectedCollections(new Set(selectedCollections));
      setIsMovieCurrentlySaved(true);
      onClose();
    } catch (error) {
      console.error("Error saving collections:", error);
      Alert.alert("Error", "Could not save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveWithoutCollection = async () => {
    setSaving(true);
    try {
      await saveMovieWithoutCollections(movie as any);
      setIsMovieCurrentlySaved(true);
      setIsOnlyInSavedMovies(true);
      setSelectedCollections(new Set());
      onClose();
    } catch (error) {
      console.error("Error saving movie:", error);
      Alert.alert("Error", "Could not save movie. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = () => {
    if (selectedCollections.size !== initialSelectedCollections.size)
      return true;

    for (const id of selectedCollections) {
      if (!initialSelectedCollections.has(id)) return true;
    }

    for (const id of initialSelectedCollections) {
      if (!selectedCollections.has(id)) return true;
    }

    return false;
  };

  const screenHeight = Dimensions.get("window").height;
  const maxModalHeight = screenHeight * 0.85;

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [600, 0],
  });

  const renderCollectionItem = ({ item }: { item: Collection }) => {
    const isSelected = selectedCollections.has(item.id);

    return (
      <TouchableOpacity
        onPress={() => toggleCollection(item.id)}
        activeOpacity={0.7}
        className="mb-3"
      >
        <View
          className={`flex-row items-center p-4 rounded-2xl border-2 ${
            isSelected
              ? "bg-accent/20 border-accent"
              : "bg-dark-100 border-dark-200"
          }`}
        >
          {/* Collection Cover */}
          <View className="w-16 h-20 rounded-xl overflow-hidden mr-4 bg-dark-200">
            {item.cover_url ? (
              <Image
                source={{ uri: item.cover_url }}
                className="w-full h-full"
                resizeMode="cover"
              />
            ) : (
              <View className="w-full h-full items-center justify-center bg-gradient-to-br from-dark-200 to-dark-100">
                <Ionicons name="film-outline" size={28} color="#6A4CFF" />
              </View>
            )}
          </View>

          {/* Collection Info */}
          <View className="flex-1">
            <Text
              className={`font-semibold text-base mb-1 ${
                isSelected ? "text-white" : "text-light-100"
              }`}
              numberOfLines={1}
            >
              {item.name}
            </Text>
            <View className="flex-row items-center">
              <Ionicons
                name="bookmark"
                size={12}
                color={isSelected ? "#AB8BFF" : "#9CA4AB"}
              />
              <Text className="text-light-300 text-xs ml-1">Collection</Text>
            </View>
          </View>

          {/* Selection Indicator */}
          <View
            className={`w-8 h-8 rounded-full items-center justify-center ${
              isSelected ? "bg-accent" : "bg-dark-200 border-2 border-light-300"
            }`}
          >
            {isSelected && <Ionicons name="checkmark" size={20} color="#fff" />}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/80 justify-end">
        <TouchableOpacity
          activeOpacity={1}
          onPress={onClose}
          className="absolute inset-0"
        />

        <Animated.View
          style={{
            transform: [{ translateY }],
            maxHeight: maxModalHeight,
            width: "100%",
            backgroundColor: "#221F3D",
          }}
          className="rounded-t-3xl overflow-hidden"
        >
          <LinearGradient
            colors={["#221F3D", "#0F0D23"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ width: "100%", minHeight: 400 }}
          >
            {/* Header - Fixed */}
            <View className="px-6 pt-6 pb-4">
              <View className="flex-row items-center justify-between mb-4">
                <View className="flex-1">
                  <Text className="text-white font-bold text-2xl">
                    {isMovieCurrentlySaved
                      ? "Manage Collections"
                      : "Save Movie"}
                  </Text>
                  <Text
                    className="text-light-300 text-sm mt-1"
                    numberOfLines={1}
                  >
                    {movie.title}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={onClose}
                  className="w-10 h-10 rounded-full bg-white/10 items-center justify-center"
                >
                  <Ionicons name="close" size={24} color="#fff" />
                </TouchableOpacity>
              </View>

              {/* Status Badge */}
              {isMovieCurrentlySaved && (
                <View className="flex-row items-center bg-accent/20 px-3 py-2 rounded-full self-start">
                  <Ionicons name="checkmark-circle" size={16} color="#AB8BFF" />
                  <Text className="text-accent font-semibold text-xs ml-2">
                    {isOnlyInSavedMovies
                      ? "Saved (No Collections)"
                      : `${selectedCollections.size} Collection${selectedCollections.size !== 1 ? "s" : ""}`}
                  </Text>
                </View>
              )}
            </View>

            {/* Content - Scrollable */}
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{
                paddingHorizontal: 24,
                paddingBottom: 20,
              }}
              showsVerticalScrollIndicator={false}
            >
              {loading ? (
                <View className="py-20 items-center" style={{ minHeight: 200 }}>
                  <ActivityIndicator size="large" color="#AB8BFF" />
                  <Text className="text-light-300 mt-4">Loading...</Text>
                </View>
              ) : collections.length === 0 && !showNewCollection ? (
                <View className="py-8" style={{ minHeight: 300 }}>
                  {/* Empty State */}
                  <View className="items-center mb-6">
                    <View className="w-20 h-20 rounded-full bg-accent/20 items-center justify-center mb-4">
                      <Ionicons
                        name="albums-outline"
                        size={40}
                        color="#AB8BFF"
                      />
                    </View>
                    <Text className="text-white font-bold text-lg text-center mb-2">
                      No Collections Yet
                    </Text>
                    <Text className="text-light-300 text-center text-sm px-4 leading-5">
                      Create your first collection to organize your saved
                      movies, or save this movie without collections.
                    </Text>
                  </View>

                  {/* Action Buttons */}
                  <View style={{ gap: 12 }}>
                    <TouchableOpacity
                      onPress={() => setShowNewCollection(true)}
                      className="bg-accent rounded-2xl px-6 py-4 flex-row items-center justify-center"
                      activeOpacity={0.8}
                    >
                      <Ionicons name="add-circle" size={22} color="#fff" />
                      <Text className="text-white font-bold text-base ml-2">
                        Create Collection
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={handleSaveWithoutCollection}
                      disabled={saving}
                      className="bg-dark-200 rounded-2xl px-6 py-4 flex-row items-center justify-center border border-dark-300"
                      activeOpacity={0.8}
                    >
                      <Ionicons name="bookmark" size={22} color="#fff" />
                      <Text className="text-white font-semibold text-base ml-2">
                        {saving ? "Saving..." : "Save Without Collection"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <>
                  {/* Collections List */}
                  {!showNewCollection && (
                    <View className="mb-4">
                      <Text className="text-light-200 text-sm font-semibold mb-3">
                        Select Collections ({selectedCollections.size} selected)
                      </Text>

                      <FlatList
                        data={collections}
                        keyExtractor={(item) => item.id}
                        renderItem={renderCollectionItem}
                        scrollEnabled={false}
                        ListEmptyComponent={
                          <View className="py-8 items-center">
                            <Text className="text-light-300 text-center">
                              No collections found
                            </Text>
                          </View>
                        }
                      />
                    </View>
                  )}

                  {/* New Collection Input */}
                  {showNewCollection && (
                    <View className="mb-4 bg-dark-200 rounded-2xl p-5">
                      <Text className="text-white font-semibold text-lg mb-4">
                        New Collection
                      </Text>
                      <TextInput
                        value={newCollectionName}
                        onChangeText={setNewCollectionName}
                        placeholder="Collection name"
                        placeholderTextColor="#9CA4AB"
                        className="text-white bg-dark-100 rounded-xl px-4 py-3.5 mb-4 text-base"
                        autoFocus
                        maxLength={50}
                      />
                      <View className="flex-row gap-3">
                        <TouchableOpacity
                          onPress={handleCreateCollection}
                          disabled={
                            !newCollectionName.trim() || creatingCollection
                          }
                          className={`flex-1 rounded-xl py-3.5 items-center ${
                            newCollectionName.trim() && !creatingCollection
                              ? "bg-accent"
                              : "bg-gray-600"
                          }`}
                        >
                          {creatingCollection ? (
                            <ActivityIndicator size="small" color="#fff" />
                          ) : (
                            <Text className="text-white font-bold text-base">
                              Create
                            </Text>
                          )}
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => {
                            setShowNewCollection(false);
                            setNewCollectionName("");
                          }}
                          className="flex-1 bg-dark-100 rounded-xl py-3.5 items-center border border-dark-300"
                        >
                          <Text className="text-light-200 font-semibold text-base">
                            Cancel
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}

                  {/* Add New Collection Button */}
                  {!showNewCollection && collections.length > 0 && (
                    <TouchableOpacity
                      onPress={() => setShowNewCollection(true)}
                      className="flex-row items-center justify-center py-4 mb-4 border-2 border-dashed border-accent/50 rounded-2xl bg-accent/5"
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name="add-circle-outline"
                        size={24}
                        color="#AB8BFF"
                      />
                      <Text className="text-accent font-semibold ml-2 text-base">
                        New Collection
                      </Text>
                    </TouchableOpacity>
                  )}

                  {/* Save Without Collection Option */}
                  {!showNewCollection && collections.length > 0 && (
                    <TouchableOpacity
                      onPress={handleSaveWithoutCollection}
                      disabled={saving}
                      className="flex-row items-center justify-center py-4 mb-4 border border-light-300/30 rounded-2xl bg-dark-200/50"
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name="bookmark-outline"
                        size={20}
                        color="#fff"
                      />
                      <Text className="text-white font-medium ml-2 text-sm">
                        {saving ? "Saving..." : "Save Without Collections"}
                      </Text>
                    </TouchableOpacity>
                  )}

                  {/* Warning for Only in SavedMovies */}
                  {isOnlyInSavedMovies && !showNewCollection && (
                    <View className="mb-4 bg-yellow-500/20 border border-yellow-500/50 rounded-2xl p-4 flex-row items-start">
                      <Ionicons
                        name="information-circle"
                        size={20}
                        color="#FBBF24"
                      />
                      <Text className="text-yellow-400 text-xs ml-2 flex-1 leading-4">
                        This movie is saved without collections. Add it to at
                        least one collection to enable removal.
                      </Text>
                    </View>
                  )}
                </>
              )}
            </ScrollView>

            {/* Footer Actions - Fixed at bottom */}
            {!loading && !showNewCollection && (
              <View className="px-6 pt-4 pb-6 border-t border-dark-200 bg-transparent">
                {hasChanges() ? (
                  <TouchableOpacity
                    onPress={handleSave}
                    disabled={saving}
                    className="bg-accent rounded-2xl py-4 flex-row items-center justify-center"
                    activeOpacity={0.8}
                  >
                    {saving ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <Ionicons
                          name="checkmark-circle"
                          size={24}
                          color="#fff"
                        />
                        <Text className="text-white font-bold text-base ml-2">
                          {isMovieCurrentlySaved
                            ? "Update Collections"
                            : "Save to Collections"}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                ) : isMovieCurrentlySaved && !isOnlyInSavedMovies ? (
                  <TouchableOpacity
                    onPress={handleCompleteRemoval}
                    disabled={saving}
                    className="bg-red-500/20 border border-red-500/50 rounded-2xl py-4 flex-row items-center justify-center"
                    activeOpacity={0.8}
                  >
                    <Ionicons name="trash-outline" size={20} color="#ef4444" />
                    <Text className="text-red-400 font-semibold ml-2 text-base">
                      Remove from All Collections
                    </Text>
                  </TouchableOpacity>
                ) : isMovieCurrentlySaved &&
                  isOnlyInSavedMovies &&
                  collections.length > 0 ? (
                  <TouchableOpacity
                    onPress={() => {}}
                    disabled={true}
                    className="bg-gray-600/50 rounded-2xl py-4 flex-row items-center justify-center opacity-50"
                  >
                    <Ionicons
                      name="information-circle"
                      size={20}
                      color="#9CA4AB"
                    />
                    <Text className="text-light-300 font-medium ml-2 text-sm">
                      Select collections to organize this movie
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            )}
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
};

export default CollectionsPopup;
