// app/(tabs)/save.tsx
import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Alert,
  RefreshControl,
  ActivityIndicator,
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
} from "@/services/supabaseAPI";

const Save = () => {
  const router = useRouter();
  const { user, loading: authLoading, isAuthenticated } = useAuth();

  const [activeCollection, setActiveCollection] = useState<{
    id: string;
    name: string;
    cover_url: string | null;
    is_default: boolean;
    movies: any[];
  } | null>(null);

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

        const combinedCollections = [
          {
            id: "all",
            name: "All Saved",
            cover_url: null,
            is_default: true,
            movies: Array.isArray(allSavedMovies) ? allSavedMovies : [],
          },
          ...(Array.isArray(rawCollections) ? rawCollections : []).map(
            (col: any) => ({
              ...col,
              movies: [],
              is_default: false,
            }),
          ),
        ];

        setCollections(combinedCollections);

        if (!activeCollection && combinedCollections.length > 0) {
          setActiveCollection(combinedCollections[0]);
        }
      } catch (err: any) {
        console.error("Failed to fetch data:", err);
        setError(err.message || "Failed to load data");
      } finally {
        setLoading(false);
        if (showLoading) setRefreshing(false);
      }
    },
    [isAuthenticated, activeCollection],
  );

  useEffect(() => {
    if (!authLoading) {
      fetchData();
    }
  }, [authLoading, isAuthenticated, fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData(false);
  };

  const handleCreateCollection = () => {
    Alert.prompt(
      "New Collection",
      "Enter a name for your collection",
      async (name) => {
        if (!name?.trim()) return;
        try {
          const newCol = await createCollection(name.trim());
          if (newCol) {
            fetchData();
            setActiveCollection({
              ...newCol,
              movies: [],
              is_default: false,
            });
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

  const renderCollectionItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      onPress={() => setActiveCollection(item)}
      className={`flex-row items-center py-3 px-4 rounded-xl mb-2 ${
        activeCollection?.id === item.id
          ? "bg-white/10 border border-accent"
          : "bg-white/5"
      }`}
    >
      {item.id === "all" ? (
        <View className="w-10 h-10 rounded-lg bg-accent/20 items-center justify-center mr-3">
          <Ionicons name="bookmark" size={18} color="#AB8BFF" />
        </View>
      ) : (
        <View className="w-10 h-10 rounded-lg overflow-hidden mr-3 bg-dark-100">
          {item.cover_url ? (
            <View className="w-full h-full bg-gray-700 items-center justify-center">
              <Ionicons name="image" size={18} color="#6A4CFF" />
            </View>
          ) : (
            <View className="w-full h-full bg-gray-800 items-center justify-center">
              <Ionicons name="film-outline" size={18} color="#6A4CFF" />
            </View>
          )}
        </View>
      )}
      <View className="flex-1">
        <Text className="text-white font-medium">{item.name}</Text>
        <Text className="text-light-300 text-xs">
          {item.movies?.length || 0} movies
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderMovie = ({ item }: { item: any }) => (
    <TouchableOpacity
      onPress={() => router.push(`/movie/${item.movie_id}`)}
      className="w-1/2 px-1.5 pb-4"
    >
      <View className="rounded-xl overflow-hidden bg-dark-100">
        {item.poster_url ? (
          <View className="w-full aspect-[2/3] bg-gray-700 items-center justify-center">
            <Ionicons name="image" size={20} color="#6A4CFF" />
          </View>
        ) : (
          <View className="w-full aspect-[2/3] bg-gray-800 items-center justify-center">
            <Ionicons name="film-outline" size={20} color="#6A4CFF" />
          </View>
        )}
        <Text className="text-white text-xs p-1.5 line-clamp-1">
          {item.title}
        </Text>
      </View>
    </TouchableOpacity>
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
          <ActivityIndicator size="large" color="#0000ff" />
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
        <View className="flex-1 p-4 relative z-10">
          {/* Header */}
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-white text-xl font-bold">Your Library</Text>
            <TouchableOpacity
              onPress={handleCreateCollection}
              className="bg-accent/20 p-2 rounded-full"
            >
              <Ionicons name="add" size={24} color="#AB8BFF" />
            </TouchableOpacity>
          </View>

          {/* Main Content with Pull-to-Refresh */}
          <View className="flex-1">
            {loading ? (
              <View className="flex-1 items-center justify-center">
                <ActivityIndicator size="large" color="#0000ff" />
              </View>
            ) : error ? (
              <View className="flex-1 items-center justify-center">
                <Text className="text-red-500">{error}</Text>
                <TouchableOpacity onPress={onRefresh} className="mt-2">
                  <Text className="text-accent">Retry</Text>
                </TouchableOpacity>
              </View>
            ) : collections.length === 1 &&
              collections[0].id === "all" &&
              collections[0].movies.length === 0 ? (
              <View className="flex-1 items-center justify-center px-10">
                <Ionicons name="bookmark-outline" size={64} color="#6A4CFF" />
                <Text className="text-white text-lg font-bold text-center mb-2">
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
              <View className="flex-1 flex-row">
                {/* Collections Sidebar */}
                <View className="w-1/3 pr-2">
                  <FlatList
                    data={collections}
                    renderItem={renderCollectionItem}
                    keyExtractor={(item) => item.id}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 20 }}
                  />
                </View>

                {/* Movies Grid */}
                <View className="w-2/3 pl-2">
                  <View className="flex-row justify-between items-center mb-3">
                    <Text className="text-white font-semibold">
                      {activeCollection?.name}
                    </Text>
                    {activeCollection && !activeCollection.is_default && (
                      <TouchableOpacity
                        onPress={() => {
                          Alert.alert(
                            "Delete Collection",
                            `Are you sure you want to delete "${activeCollection.name}"? Movies will remain saved.`,
                            [
                              { text: "Cancel", style: "cancel" },
                              {
                                text: "Delete",
                                style: "destructive",
                                onPress: () => {
                                  console.log("Delete", activeCollection.id);
                                },
                              },
                            ],
                          );
                        }}
                      >
                        <Ionicons
                          name="trash-outline"
                          size={20}
                          color="#ff4d4d"
                        />
                      </TouchableOpacity>
                    )}
                  </View>

                  {activeCollection?.movies &&
                  activeCollection.movies.length > 0 ? (
                    <FlatList
                      data={activeCollection.movies}
                      renderItem={renderMovie}
                      keyExtractor={(item) => item.id}
                      numColumns={2}
                      showsVerticalScrollIndicator={false}
                      columnWrapperStyle={{ justifyContent: "space-between" }}
                      contentContainerStyle={{ paddingBottom: 100 }}
                      refreshControl={
                        <RefreshControl
                          refreshing={refreshing}
                          onRefresh={onRefresh}
                          tintColor="#0000ff" // Match Search page blue
                          colors={["#0000ff"]}
                        />
                      }
                    />
                  ) : (
                    <View className="flex-1 items-center justify-center">
                      <Ionicons name="film-outline" size={48} color="#444" />
                      <Text className="text-light-300 mt-3">
                        No movies in this collection
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            )}
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
};

export default Save;
