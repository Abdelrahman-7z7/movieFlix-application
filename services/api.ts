export const TMDB_CONFIG = {
  BASE_URL: 'https://api.themoviedb.org/3',
  API_KEY: process.env.EXPO_PUBLIC_MOVIE_API_KEY,
  headers: {
    accept: 'application/json',
    Authorization: `Bearer ${process.env.EXPO_PUBLIC_MOVIE_API_KEY}`,
  },
}

export const fetchMovies = async ({ query }: { query: string }) => {
  // inserting the endpoint (for popular movies when there is no query)
  const hasQuery = typeof query === 'string' && query.trim().length > 0
  const endpoint = hasQuery
    ? `${TMDB_CONFIG.BASE_URL}/search/movie?query=${encodeURIComponent(query)}`
    : `${TMDB_CONFIG.BASE_URL}/discover/movie?include_adult=false&include_video=false&language=en-US&page=1&sort_by=popularity.desc`

  //making the request to the Backend
  const response = await fetch(endpoint, {
    method: 'GET',
    headers: TMDB_CONFIG.headers,
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch movies: ${response.statusText}`)
  }

  const data = await response.json()

  return data.results
}

// const url = 'https://api.themoviedb.org/3/discover/movie?include_adult=false&include_video=false&language=en-US&page=1&sort_by=popularity.desc';
// const options = {
//   method: 'GET',
//   headers: {
//     accept: 'application/json',
//     Authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJjM2IzMDFmMDlhZjQ2NWNhNDYxZGI3MTAyYzM2YTA0ZCIsIm5iZiI6MTc2MDQ2NDUwNS4xOTI5OTk4LCJzdWIiOiI2OGVlOGU3OTY0NGQyZjhkZTVmMDllMmEiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.KTcuFYYjNzvMgPRGsex8YpKIxkkSR9jfMiTCtb7vdRk'
//   }
// };

// fetch(url, options)
//   .then(res => res.json())
//   .then(json => console.log(json))
//   .catch(err => console.error(err));
