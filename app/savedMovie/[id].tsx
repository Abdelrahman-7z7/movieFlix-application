import {
  View,
  Text,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useState, useEffect, useCallback } from "react";

import { useAuth } from "@/hooks/useAuth";
import {
  getCollectionMovies,
  getSavedMovies,
  getUserCollections,
} from "@/services/supabaseAPI";
import MovieCard from "@/components/MovieCard";
import RefreshableWrapper from "@/components/RefreshableWrapper";

const SavedMovieCollection = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { isAuthenticated, loading: authLoading } = useAuth();

  const [movies, setMovies] = useState<any[]>([]);
  const [collectionName, setCollectionName] = useState<string>("Collection");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMovies = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    try {
      setError(null);

      if (id === "all") {
        // Fetch all saved movies
        const allMovies = await getSavedMovies();

        // Transform to match MovieCard interface
        const transformedMovies = (allMovies || []).map((movie: any) => {
          // Extract poster path from full URL
          let posterPath = null;
          if (movie.poster_url) {
            const urlMatch = movie.poster_url.match(/\/t\/p\/w500(.+)$/);
            posterPath = urlMatch ? urlMatch[1] : null;
          }

          return {
            id: movie.movie_id,
            title: movie.title,
            poster_path: posterPath,
            vote_average: 0, // Default value if not available
            release_date: "", // Default value if not available
          };
        });

        setMovies(transformedMovies);
        setCollectionName("All Saved");
      } else {
        // Fetch movies from specific collection
        const collectionMovies = await getCollectionMovies(id as string);

        // Transform to match MovieCard interface
        const transformedMovies = (collectionMovies || []).map((movie: any) => {
          // Extract poster path from full URL
          let posterPath = null;
          if (movie.poster_url) {
            const urlMatch = movie.poster_url.match(/\/t\/p\/w500(.+)$/);
            posterPath = urlMatch ? urlMatch[1] : null;
          }

          return {
            id: movie.movie_id,
            title: movie.title,
            poster_path: posterPath,
            vote_average: 0, // Default value if not available
            release_date: "", // Default value if not available
          };
        });

        setMovies(transformedMovies);

        // Get collection name
        const collections = await getUserCollections();
        const collection = collections.find((c: any) => c.id === id);
        setCollectionName(collection?.name || "Collection");
      }
    } catch (err: any) {
      console.error("Failed to fetch movies:", err);
      setError(err.message || "Failed to load movies");
    } finally {
      setLoading(false);
      // Don't set refreshing to false here, let onRefresh handle it
    }
  }, [id, isAuthenticated]);

  useEffect(() => {
    if (!authLoading) {
      fetchMovies();
    }
  }, [authLoading, fetchMovies]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchMovies();
    } finally {
      setTimeout(() => {
        setRefreshing(false);
      }, 100);
    }
  }, [fetchMovies]);

  if (authLoading || loading) {
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
        <View className="flex-1 items-center justify-center px-10">
          <Text className="text-light-300 text-center">
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

      <SafeAreaView className="flex-1" edges={["top"]}>
        <RefreshableWrapper
          refreshing={refreshing}
          loading={loading}
          indicatorColor="#AB8BFF"
        >
          <View className="flex-1 relative z-10">
            {/* Header */}
            <View className="flex-row items-center justify-between px-5 pt-4 pb-3">
              <TouchableOpacity
                onPress={() => router.back()}
                className="bg-white/10 p-2 rounded-full"
              >
                <Ionicons name="arrow-back" size={24} color="#AB8BFF" />
              </TouchableOpacity>
              <Text className="text-white text-xl font-bold flex-1 text-center mr-10">
                {collectionName}
              </Text>
            </View>

            {/* Movies Grid */}
            {error ? (
              <View className="flex-1 items-center justify-center px-10">
                <Ionicons
                  name="alert-circle-outline"
                  size={48}
                  color="#ff4d4d"
                />
                <Text className="text-red-500 mt-4 text-center">{error}</Text>
                <TouchableOpacity
                  onPress={fetchMovies}
                  className="bg-accent px-5 py-3 rounded-full mt-4"
                >
                  <Text className="text-white font-semibold">Retry</Text>
                </TouchableOpacity>
              </View>
            ) : movies.length === 0 ? (
              <View className="flex-1 items-center justify-center px-10">
                <Ionicons name="film-outline" size={64} color="#6A4CFF" />
                <Text className="text-white text-lg font-bold text-center mb-2 mt-4">
                  No Movies Yet
                </Text>
                <Text className="text-light-300 text-center">
                  This collection is empty. Start saving movies to see them
                  here.
                </Text>
              </View>
            ) : (
              <FlatList
                data={movies}
                renderItem={({ item }) => <MovieCard {...item} />}
                keyExtractor={(item) => item.id.toString()}
                numColumns={3}
                columnWrapperStyle={{
                  justifyContent: "flex-start",
                  gap: 20,
                  paddingHorizontal: 20,
                  marginBottom: 10,
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

export default SavedMovieCollection;
