// useFetch.ts
import { useState, useEffect } from "react";

const useFetch = <T>(fetchFunction: () => Promise<T>, autoFetch = true) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async (): Promise<T | null> => {
    try {
      setLoading(true);
      setError(null);

      const result = await fetchFunction();
      setData(result);
      return result; // ✅ return the fetched data
    } catch (err) {
      const errorInstance =
        err instanceof Error ? err : new Error("An unknown error occurred");
      setError(errorInstance);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setData(null);
    setError(null);
    setLoading(false);
  };

  useEffect(() => {
    if (autoFetch) {
      fetchData();
    }
  }, []);

  return { data, loading, error, refetch: fetchData, reset };
};

export default useFetch;
