import { View, Text, Image, TouchableOpacity } from "react-native";
import React from "react";
import useFetch from "@/services/usefetch";
import { fetchMovieDetails } from "@/services/api";
import { router, useLocalSearchParams } from "expo-router";
import { icons } from "@/constants/icons";
import RefreshableScroll from "@/components/RefreshableScroll";

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
  // using localSearchParam which will be attached by the index.page throwing it into the url /:id
  const { id } = useLocalSearchParams();

  const {
    data: movie,
    loading,
    error,
    refetch,
  } = useFetch(() => fetchMovieDetails(id as string));

  const [refreshing, setRefreshing] = React.useState(false);
  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      // artificial delay for testing the refresh spinner
      await new Promise((resolve) => setTimeout(resolve, 1200));
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  return (
    <View className="bg-primary flex-1">
      {/* since the height of the details might be bigger than the screen than we have to have a scrolling flexibility around */}

      <RefreshableScroll
        contentContainerStyle={{
          paddingBottom: 80,
        }}
        onRefresh={onRefresh}
      >
        <View>
          {movie?.poster_path ? (
            <Image
              source={{
                uri: `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
              }}
              className="w-full h-[550px]"
            />
          ) : (
            <Image
              source={{ uri: "https://placehold.co/600x900/1a1a1a/FFFFFF.png" }}
              className="w-full h-[550px]"
              resizeMode="stretch"
            />
          )}
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
            <Image source={icons.star} className="size-4" />
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

      {/* creating a button with touchable opacity to control the back route to the previous view */}

      <TouchableOpacity
        className="absolute bottom-5 left-0 right-0 mx-5 bg-accent rounded-lg py-3.5 flex flex-row items-center justify-center z-50"
        onPress={router.back}
      >
        <Image
          source={icons.arrow}
          className="mr-1 mt-0.5 rotate-180"
          tintColor="#fff"
        />
        <Text className="text-white font-semibold text-base">Go Back</Text>
      </TouchableOpacity>
    </View>
  );
};

export default MovieDetails;
