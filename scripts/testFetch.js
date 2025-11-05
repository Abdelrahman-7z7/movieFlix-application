require('dotenv').config()

const BASE_URL = 'https://api.themoviedb.org/3'

async function main() {
  const apiKey = process.env.EXPO_PUBLIC_MOVIE_API_KEY

  console.log(apiKey + 'a7a')

  if (!apiKey) throw new Error('Missing EXPO_PUBLIC_MOVIE_API_KEY')

  const url = `${BASE_URL}/discover/movie?include_adult=false&include_video=false&language=en-US&page=1&sort_by=popularity.desc`
  const res = await fetch(url, {
    headers: {
      accept: 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}: ${await res.text()}`)

  const data = await res.json()
  console.log('OK results:', Array.isArray(data.results) ? data.results.length : 0)
  console.log(
    'Sample:',
    (data.results || []).slice(0, 5).map(m => m.title)
  )
}

main().catch(err => {
  console.error(err.message)
  process.exit(1)
})
