// services/supabaseAPI.ts
import { supabase } from "@/lib/supabase";

const TABLE_NAME = "SearchHistory";

// Helper to get authenticated user ID
const getAuthenticatedUserId = async (): Promise<string> => {
  const {
    data: { session },
  } = await supabase.auth.getSession(); // ✅ Fixed
  if (!session) {
    throw new Error("Authentication required");
  }
  return session.user.id;
};

export const updateSearchCount = async (query: string, movie: Movie) => {
  try {
    const { data: existingRecords, error: searchError } = await supabase
      .from(TABLE_NAME)
      .select("*")
      .eq("movie_id", movie.id)
      .limit(1);

    if (searchError) {
      console.error("Error searching for existing record:", searchError);
      throw searchError;
    }

    if (existingRecords && existingRecords.length > 0) {
      const existingMovie = existingRecords[0];
      const { error: updateError } = await supabase
        .from(TABLE_NAME)
        .update({ count: existingMovie.count + 1 })
        .eq("id", existingMovie.id);

      if (updateError) {
        console.error("Error updating record:", updateError);
        throw updateError;
      }
    } else {
      const { error: insertError } = await supabase.from(TABLE_NAME).insert({
        searchTerm: query,
        movie_id: movie.id,
        title: movie.title,
        count: 1,
        poster_url: `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
      });

      if (insertError) {
        console.error("Error creating record:", insertError);
        throw insertError;
      }
    }
  } catch (error) {
    console.error("Error updating search count:", error);
    throw error;
  }
};

export const getTrendingMovies = async (): Promise<
  TrendingMovie[] | undefined
> => {
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select("*")
      .order("count", { ascending: false })
      .limit(5);

    return data as unknown as TrendingMovie[];
  } catch (error) {
    console.error("Error in getTrendingMovies:", error);
    return undefined;
  }
};

// ✅ REMOVED userId parameter
export const createCollection = async (name: string) => {
  try {
    const userId = await getAuthenticatedUserId();

    const { data, error } = await supabase
      .from("Collections")
      .insert({
        name,
        user_id: userId, // ✅ From session
        cover_url: null,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error("Error creating collection:", err);
    return null;
  }
};

// ✅ REMOVED userId parameter
export const addMovieToCollection = async (
  collectionId: string,
  movie: Movie,
) => {
  try {
    const userId = await getAuthenticatedUserId();

    // 1. Save to SavedMovies if needed
    const { data: existingSaved } = await supabase
      .from("SavedMovies")
      .select("id")
      .eq("movie_id", movie.id)
      .eq("user_id", userId)
      .single();

    let savedMovieId = existingSaved?.id;

    if (!existingSaved) {
      const { data: saved, error: saveError } = await supabase
        .from("SavedMovies")
        .insert({
          movie_id: movie.id,
          title: movie.title,
          poster_url: `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
          user_id: userId,
        })
        .select()
        .single();

      if (saveError) throw saveError;
      savedMovieId = saved.id;
    }

    // 2. Add to CollectionItems
    const { error: itemError } = await supabase.from("CollectionItems").insert({
      collection_id: collectionId,
      saved_movie_id: savedMovieId, // ✅ Fixed: use saved_movie_id (UUID)
    });

    if (itemError) throw itemError;

    // 3. Set collection cover if needed
    await supabase
      .from("Collections")
      .update({
        cover_url: `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
      })
      .eq("id", collectionId)
      .is("cover_url", null);

    return true;
  } catch (err) {
    console.error("Error adding movie to collection:", err);
    return false;
  }
};

export const deleteCollection = async (collectionId: string) => {
  try {
    console.log(collectionId);
    console.log(typeof collectionId);

    const { data, error: errorr1 } = await supabase
      .from("Collections")
      .select("*")
      .eq("id", collectionId);

    console.log(data);

    if (errorr1) {
      console.log(errorr1);
    }

    // ✅ RLS will ensure only owner can delete
    const { error } = await supabase
      .from("Collections")
      .delete()
      .eq("id", collectionId);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error("Error deleting collection:", err);
    return false;
  }
};

export const removeMovieFromCollection = async (
  collectionId: string,
  savedMovieId: string, // ✅ Changed to UUID (matches CollectionItems.saved_movie_id)
) => {
  try {
    // ✅ RLS handles ownership check
    const { error } = await supabase
      .from("CollectionItems")
      .delete()
      .eq("collection_id", collectionId)
      .eq("saved_movie_id", savedMovieId); // ✅ Fixed column name

    if (error) throw error;
    return true;
  } catch (err) {
    console.error("Error removing movie:", err);
    return false;
  }
};

// ✅ REMOVED userId parameter
export const getSavedMovies = async () => {
  try {
    const userId = await getAuthenticatedUserId();

    const { data, error } = await supabase
      .from("SavedMovies")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  } catch (err) {
    console.error("Error fetching saved movies:", err);
    return [];
  }
};

// ✅ REMOVED userId parameter
export const getUserCollections = async () => {
  try {
    const userId = await getAuthenticatedUserId();

    const { data, error } = await supabase
      .from("Collections")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  } catch (err) {
    console.error("Error fetching collections:", err);
    return [];
  }
};

export const getCollectionMovies = async (collectionId: string) => {
  try {
    // ✅ Join with SavedMovies to get full movie data
    const { data, error } = await supabase
      .from("CollectionItems")
      .select(
        `
        *,
        saved_movie:SavedMovies!inner(*)
      `,
      )
      .eq("collection_id", collectionId);

    if (error) throw error;
    return data.map((item: any) => ({
      ...item.saved_movie,
      collection_item_id: item.id, // preserve CollectionItems ID for deletion
    }));
  } catch (err) {
    console.error("Error fetching collection movies:", err);
    return [];
  }
};

// ✅ REMOVED userId parameter
export const isMovieSaved = async (movieId: number) => {
  try {
    const userId = await getAuthenticatedUserId();

    const { data } = await supabase
      .from("SavedMovies")
      .select("id")
      .eq("movie_id", movieId)
      .eq("user_id", userId)
      .single();

    return !!data;
  } catch (err) {
    console.error("Error checking if movie is saved:", err);
    return false;
  }
};
