import SearchBar from '@/components/SearchBar'
import { icons } from '@/constants/icons'
import { images } from '@/constants/images'
import { fetchMovies } from '@/services/api'
import useFetch from '@/services/useFetch'
import { useRouter } from 'expo-router'
import { ActivityIndicator, FlatList, Image, ScrollView, Text, View } from 'react-native'

export default function Index() {
  const router = useRouter()

  //fetching the data Through the custome useFetch
  const {
    data: movies,
    loading: moviesLoading,
    error: moviesError,
  } = useFetch(() =>
    fetchMovies({
      query: '',
    })
  )

  console.log('Movies data:', movies, 'Error:', moviesError)

  return (
    <View className="flex-1 bg-primary">
      <Image source={images.bg} className="w-full absolute z-0" />

      {/* applying "scrollView" which make the whole screen scrollable */}
      <ScrollView
        className="flex-1 px-5"
        showsVerticalScrollIndicator={false} //hides the scrol bar
        contentContainerStyle={{
          //define the scroll high of the whole page
          minHeight: '100%',
          paddingBottom: 10,
        }}
      >
        <Image source={icons.logo} className="w-12 h-10 mt-20 mb-5 mx-auto" />

        {/* fetching the loading status if we are currently getting the movies */}
        {/* we are going to check for loading if we are fetching the data, if there is no loading then we might have an error, if we dont have an error then we have the data and we can render the page */}
        {moviesLoading ? (
          <ActivityIndicator size="large" color="0000ff" className="mt-10 self-center" />
        ) : moviesError ? (
          <Text>Error: {moviesError?.message}</Text>
        ) : (
          <View className="flex">
            {/* pushing the search content to the SearchBar component */}
            <SearchBar onPress={() => router.push('/search')} placeholder="Search for a movie" />
            <>
              <Text className="text-lg text-white font-bold mt-5 mb-3">Latest Movies</Text>
              <FlatList
                data={movies}
                keyExtractor={item => item.id} //helps react-native to figure out how many item do we have and which position does it have in the list
                renderItem={({ item }) => (
                  <Text key={item.id} className="text-white text-sm">
                    {item.title}
                  </Text>
                )} //immediately calling the function ({item})=>{} that means it will not immediately be returned
                numColumns={3}
                columnWrapperStyle={{
                  justifyContent: 'flex-start',
                  gap: 20,
                  paddingRight: 5,
                  marginBottom: 10,
                }}
                className="mt-2 pb-32"
                scrollEnabled={false}
              />
            </>
          </View>
        )}
      </ScrollView>
    </View>
  )
}
