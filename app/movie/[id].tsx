import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import React, { useState, useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import useFetch from "@/services/usefetch";
import { fetchMovieDetails } from "@/services/api";
import { router, useLocalSearchParams } from "expo-router";
import RefreshableScroll from "@/components/RefreshableScroll";
import RefreshableWrapper from "@/components/RefreshableWrapper";
import SaveButton from "@/components/saveButton";
import CollectionsPopup from "@/components/CollectionsPopup";
import { isMovieSaved } from "@/services/supabaseAPI";

interface MovieInfoProps {
  label: string;
  value?: string | number | null;
}

const MovieInfo = ({ label, value }: MovieInfoProps) => {
  return (
    <View className="flex-col item-center justify-center mt-5">
      <Text className="text-light-200 text-normal text-sm">{label}</Text>
      <Text className="text-light-100 text-normal text-sm mt-2">
        {value || "N/A"}
      </Text>
    </View>
  );
};

const MovieDetails = () => {
  const { id } = useLocalSearchParams();

  const {
    data: movie,
    loading,
    error,
    refetch,
  } = useFetch(() => fetchMovieDetails(id as string));

  const [refreshing, setRefreshing] = React.useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [showCollectionsPopup, setShowCollectionsPopup] = useState(false);

  // Check if movie is saved on component mount and after refetch
  useEffect(() => {
    if (movie?.id) {
      checkMovieStatus();
    }
  }, [movie?.id]);

  const checkMovieStatus = async () => {
    if (!movie?.id) return;

    setCheckingStatus(true);
    try {
      const savedStatus = await isMovieSaved(movie.id);
      setIsSaved(savedStatus);
    } catch (error) {
      console.error("Error checking movie status:", error);
    } finally {
      setCheckingStatus(false);
    }
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
      await checkMovieStatus(); // Recheck saved status after refresh
    } finally {
      setTimeout(() => {
        setRefreshing(false);
      }, 100);
    }
  }, [refetch]);

  const handleSavePress = () => {
    if (!movie) return;

    // Open collections popup
    setShowCollectionsPopup(true);
  };

  const handlePopupClose = () => {
    setShowCollectionsPopup(false);
    // Recheck if movie is still saved after popup closes
    checkMovieStatus();
  };

  // Show initial loading
  if (loading && !movie) {
    return (
      <View className="bg-primary flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#fff" />
        <Text className="text-white mt-4">Loading movie...</Text>
      </View>
    );
  }

  return (
    <View className="bg-primary flex-1">
      <RefreshableWrapper
        refreshing={refreshing}
        loading={loading && !movie}
        indicatorColor="#AB8BFF"
      >
        <RefreshableScroll
          contentContainerStyle={{
            paddingBottom: 80,
          }}
          refreshing={refreshing || checkingStatus}
          onRefresh={onRefresh}
        >
          <View className="relative">
            {movie?.poster_path ? (
              <Image
                source={{
                  uri: `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
                }}
                className="w-full h-[550px]"
              />
            ) : (
              <Image
                source={{
                  uri: "https://placehold.co/600x900/1a1a1a/FFFFFF.png",
                }}
                className="w-full h-[550px]"
                resizeMode="stretch"
              />
            )}

            {/* Save Button - Positioned on top right of poster */}
            <View
              className="absolute top-5 right-5 z-10"
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 3.84,
                elevation: 5,
              }}
            >
              <SaveButton isSaved={isSaved} onPress={handleSavePress} />
            </View>
          </View>

          <View className="flex-col item-start justify-center mt-5 px-5">
            <Text className="text-white font-bold text-xl">{movie?.title}</Text>

            <View className="flex-row item-center gap-x-1 mt-2">
              <Text className="text-light-200 text-sm">
                {movie?.release_date?.split("-")[0]}
              </Text>
              <Text className="text-light-200 text-sm">{movie?.runtime}m</Text>
            </View>

            <View className="flex-row item-center self-start bg-dark-100 px-2 py-1 mt-2 gap-x-1 rounded-md">
              <Ionicons name="star" size={16} color="#FFD700" />
              <Text className="text-white font-bold text-sm">
                {Math.round(movie?.vote_average ?? 0)}/10
              </Text>
              <Text className="text-light-200 text-sm">
                ({movie?.vote_count} votes)
              </Text>
            </View>

            <MovieInfo label="Overview" value={movie?.overview} />
            <MovieInfo
              label="Genres"
              value={movie?.genres?.map((g) => g.name).join(" - ")}
            />

            <View className="flex flex-row justify-between w-1/2">
              <MovieInfo
                label="Budget"
                value={
                  movie?.budget != 0 && movie?.budget != undefined
                    ? `$${movie.budget / 1_000_000} million`
                    : `N/A`
                }
              />
              <MovieInfo
                label="Revenue"
                value={
                  movie?.revenue != 0 && movie?.revenue != undefined
                    ? `$${(Math.round(movie.revenue) / 1_000_000).toFixed(2)} million`
                    : `N/A`
                }
              />
            </View>

            <MovieInfo
              label="Production Company"
              value={
                movie?.production_companies.map((c) => c.name).join(" - ") ||
                "N/A"
              }
            />
          </View>
        </RefreshableScroll>
      </RefreshableWrapper>

      {/* Go Back Button */}
      <TouchableOpacity
        className="absolute bottom-5 left-0 right-0 mx-5 bg-accent rounded-lg py-3.5 flex flex-row items-center justify-center z-50"
        onPress={router.back}
      >
        <Ionicons name="arrow-back" size={20} color="#fff" />
        <Text className="text-white font-semibold text-base ml-2">Go Back</Text>
      </TouchableOpacity>

      {/* Collections Popup */}
      {movie && (
        <CollectionsPopup
          visible={showCollectionsPopup}
          onClose={handlePopupClose}
          movie={{
            id: movie.id,
            title: movie.title,
            poster_path: movie.poster_path,
          }}
        />
      )}
    </View>
  );
};

export default MovieDetails;
