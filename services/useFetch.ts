//custome hook for fetching the data

import { useEffect, useState } from 'react'

// we are using it to fetch the data from a function but works as a wrapper above the fetch call

const useFetch = <T>(fetchFunction: () => Promise<T>, autoFetch = true) => {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchData = async () => {
    try {
      //set the loading error & set the error too
      setLoading(true)
      setError(null)

      // call the function to be used and then set the result to the data
      const result = await fetchFunction()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('an error occured'))
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setData(null)
    setLoading(false)
    setError(null)
  }

  //useEffect hook is used when you tries to make something at the start of your component load
  useEffect(() => {
    // as soon as the component loads
    if (autoFetch) {
      // automatically fetch the data before the component loads
      fetchData()
    }
    // run once on mount unless autoFetch changes
  }, [autoFetch])

  //the custome hook should be able to return everything in the hook
  return {
    data,
    loading,
    error,
    refetch: fetchData,
    reset,
  }
}

export default useFetch
