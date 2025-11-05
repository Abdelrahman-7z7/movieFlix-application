import MovieCard from '@/components/MovieCard'
import SearchBar from '@/components/SearchBar'
import { icons } from '@/constants/icons'
import { images } from '@/constants/images'
import { fetchMovies } from '@/services/api'
import useFetch from '@/services/useFetch'
import React, { useEffect, useState } from 'react'
import { ActivityIndicator, FlatList, Image, Text, View } from 'react-native'

const Profile = () => {
  const [searchQuery, setSearchQuery] = useState('') //it will listen to the changes in the seach bar

  //fetching the data Through the custome useFetch
  //adding the false prop here to make the fetching of the data happen when the user start using the search bar not automatically
  const {
    data: movies,
    loading: moviesLoading,
    error: moviesError,
    refetch: loadMovies,
    reset,
  } = useFetch(
    () =>
      fetchMovies({
        query: searchQuery,
      }),
    false
  )

  useEffect(() => {
    // since we dont want to make many requests over every typed letters, so we can use the debounce property

    const timeoutId = setTimeout(async () => {
      if (searchQuery.trim()) {
        await loadMovies()
      } else {
        reset()
      }
    }, 500) //how long it will wait before listening to the next key stock

    return () => clearTimeout(timeoutId)
    // func();
  }, [searchQuery]) // that line indicates that the change will happen each time the searchQuery happens (listen to the search query)

  return (
    <View className="flex-1 bg-primary">
      <Image source={images.bg} className="flex-1 absolute w-full z-0" resizeMode="cover" />

      {/* we dont want to make the whole screen scrollable since the search bar must be at the top at all times 
        --we will use the FlatList components only to use its scrollable feature
      */}

      <FlatList
        data={movies}
        renderItem={({ item }) => <MovieCard {...item}></MovieCard>}
        keyExtractor={item => item.id.toString()}
        className="px-5"
        numColumns={3}
        columnWrapperStyle={{
          justifyContent: 'center',
          gap: 16,
          marginVertical: 16,
        }}
        contentContainerStyle={{
          paddingBottom: 100,
        }}
        // the search bar will be used as a part of the FlatList component using ListHeaderAComponent
        ListHeaderComponent={
          <>
            <View className="w-full flex-row justify-center mt-20 items-center">
              <Image source={icons.logo} className="w-12 h-10" />
            </View>
            <View className="mt-5">
              <SearchBar
                placeholder="search movies... "
                value={searchQuery}
                onChangeText={(text: string) => setSearchQuery(text)}
              ></SearchBar>
            </View>

            {moviesLoading && <ActivityIndicator size="large" color="#0000ff" className="my-3" />}

            {moviesError && (
              <Text className="text-red-500 px-5 my-3">Error: {moviesError.message}</Text>
            )}

            {/* fi we dont have a loading neither movies error and we have a search term and the movies fetched data length is over 0 then we can dispkay the next */}
            {!moviesLoading && !moviesError && searchQuery.trim() && movies?.length > 0 && (
              <Text className="text-xl text-white font-bold mt-5">
                Search Results for <Text className="text-accent">{searchQuery}</Text>
              </Text>
            )}
          </>
        }
        //we will add the empty list components for no results in the search bar
        ListEmptyComponent={
          !moviesLoading && !moviesError ? (
            <View className="mt-10 px-5">
              <Text className="text-center text-gray-500">
                {searchQuery.trim() ? 'No movie found' : 'Search for a movie'}
              </Text>
            </View>
          ) : null
        }
      />
    </View>
  )
}

export default Profile
