// app/(tabs)/save.tsx
import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { useAuth } from "@/hooks/useAuth";
import {
  getUserCollections,
  getSavedMovies,
  createCollection,
  getCollectionMovies,
  deleteCollection,
  updateCollection,
} from "@/services/supabaseAPI";
import SaveCard from "@/components/SaveCard";
import RefreshableWrapper from "@/components/RefreshableWrapper";

const Save = () => {
  const router = useRouter();
  const { user, loading: authLoading, isAuthenticated } = useAuth();

  const [collections, setCollections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(
    async (showLoading = true) => {
      if (showLoading) setLoading(true);
      setError(null);

      try {
        if (!isAuthenticated) {
          setCollections([]);
          setLoading(false);
          return;
        }

        const [rawCollections, allSavedMovies] = await Promise.all([
          getUserCollections(),
          getSavedMovies(),
        ]);

        // ✅ Load movies for each collection
        const collectionsWithMovies = await Promise.all(
          (Array.isArray(rawCollections) ? rawCollections : []).map(
            async (col: any) => {
              const movies = await getCollectionMovies(col.id);
              return {
                ...col,
                movies: movies || [],
                is_default: false,
              };
            },
          ),
        );

        const combinedCollections = [
          {
            id: "all",
            name: "All Saved",
            cover_url: null,
            is_default: true,
            movies: Array.isArray(allSavedMovies) ? allSavedMovies : [],
          },
          ...collectionsWithMovies,
        ];

        setCollections(combinedCollections);
      } catch (err: any) {
        console.error("Failed to fetch data:", err);
        setError(err.message || "Failed to load data");
      } finally {
        setLoading(false);
        if (showLoading) setRefreshing(false);
      }
    },
    [isAuthenticated],
  );

  useEffect(() => {
    if (!authLoading) {
      fetchData();
    }
  }, [authLoading, isAuthenticated]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchData(false);
    } finally {
      // Small delay for smooth animation
      setTimeout(() => {
        setRefreshing(false);
      }, 100);
    }
  }, [fetchData]);

  const handleCreateCollection = () => {
    Alert.prompt(
      "New Collection",
      "Enter a name for your collection",
      async (name) => {
        if (!name?.trim()) return;
        try {
          const newCol = await createCollection(name.trim());
          if (newCol) {
            await fetchData();
          }
        } catch (err) {
          console.error("Failed to create collection:", err);
          Alert.alert(
            "Error",
            "Could not create collection. Please try again.",
          );
        }
      },
      "plain-text",
    );
  };

  const handleDeleteCollection = async (collectionId: string, name: string) => {
    Alert.alert(
      "Delete Collection",
      `Are you sure you want to delete "${name}"? Movies will remain saved.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const success = await deleteCollection(collectionId);
            if (success) {
              await fetchData();
            } else {
              Alert.alert("Error", "Could not delete collection.");
            }
          },
        },
      ],
    );
  };

  const handleRenameCollection = async (
    collectionId: string,
    newName: string,
  ) => {
    try {
      const success = await updateCollection(collectionId, newName);
      if (success) {
        await fetchData();
      } else {
        Alert.alert("Error", "Could not rename collection. Please try again.");
      }
    } catch (err) {
      console.error("Failed to rename collection:", err);
      Alert.alert("Error", "Could not rename collection. Please try again.");
    }
  };

  const renderCollectionCard = ({ item }: { item: any }) => (
    <SaveCard
      id={item.id}
      name={item.name}
      cover_url={item.cover_url}
      movieCount={item.movies?.length || 0}
      movies={item.movies || []}
      isDefault={item.is_default}
      onDelete={item.is_default ? undefined : handleDeleteCollection}
      onRename={item.is_default ? undefined : handleRenameCollection}
    />
  );

  if (authLoading) {
    return (
      <View className="flex-1 bg-primary">
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
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#AB8BFF" />
        </View>
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <View className="flex-1 bg-primary">
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
        <View className="flex-1 items-center justify-center">
          <Text className="text-light-300">
            Please log in to view saved movies.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-primary">
      {/* Full-screen gradient background */}
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

      <SafeAreaView className="flex-1" edges={["top", "bottom"]}>
        <RefreshableWrapper
          refreshing={refreshing}
          loading={loading}
          indicatorColor="#AB8BFF"
        >
          <View className="flex-1 relative z-10">
            {/* Header with Privacy Text and New Collection Button */}
            <View className="flex-row justify-between items-center px-5 pt-4 pb-3">
              <Text className="text-light-300 text-sm flex-1">
                Only you can see what you've saved
              </Text>
              <TouchableOpacity
                onPress={handleCreateCollection}
                className="bg-accent/20 px-4 py-2 rounded-full flex-row items-center"
              >
                <Ionicons name="add" size={18} color="#AB8BFF" />
                <Text className="text-accent font-semibold ml-1 text-sm">
                  New Collection
                </Text>
              </TouchableOpacity>
            </View>

            {/* Collections Grid */}
            {error ? (
              <View className="flex-1 items-center justify-center py-20">
                <Ionicons
                  name="alert-circle-outline"
                  size={48}
                  color="#ff4d4d"
                />
                <Text className="text-red-500 mt-4 text-center">{error}</Text>
                <TouchableOpacity
                  onPress={onRefresh}
                  className="bg-accent px-5 py-3 rounded-full mt-4"
                >
                  <Text className="text-white font-semibold">Retry</Text>
                </TouchableOpacity>
              </View>
            ) : collections.length === 1 &&
              collections[0].id === "all" &&
              collections[0].movies.length === 0 ? (
              <View className="flex-1 items-center justify-center py-20 px-10">
                <Ionicons name="bookmark-outline" size={64} color="#6A4CFF" />
                <Text className="text-white text-lg font-bold text-center mb-2 mt-4">
                  Save Your First Movie
                </Text>
                <Text className="text-light-300 text-center mb-6">
                  Tap the save icon on any movie to add it here. Create
                  collections to organize your watchlist.
                </Text>
                <TouchableOpacity
                  onPress={() => router.push("/")}
                  className="bg-accent px-5 py-3 rounded-full"
                >
                  <Text className="text-white font-semibold">
                    Browse Movies
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <FlatList
                data={collections}
                renderItem={renderCollectionCard}
                keyExtractor={(item) => item.id}
                numColumns={2}
                columnWrapperStyle={{
                  justifyContent: "space-between",
                  paddingHorizontal: 20,
                }}
                contentContainerStyle={{
                  paddingTop: 10,
                  paddingBottom: 100,
                }}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    tintColor="transparent"
                    colors={["transparent"]}
                  />
                }
                showsVerticalScrollIndicator={false}
                scrollEnabled={true}
              />
            )}
          </View>
        </RefreshableWrapper>
      </SafeAreaView>
    </View>
  );
};

export default Save;
