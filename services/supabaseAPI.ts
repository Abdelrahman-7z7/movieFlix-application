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
  movie: MovieDetails,
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

export const updateCollection = async (collectionId: string, name: string) => {
  try {
    const { error } = await supabase
      .from("Collections")
      .update({ name })
      .eq("id", collectionId);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error("Error updating collection:", err);
    return false;
  }
};

export const deleteCollection = async (collectionId: string) => {
  try {
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
// Check if movie is saved (either in SavedMovies OR in any collection)
export const isMovieSaved = async (movieId: number) => {
  try {
    const userId = await getAuthenticatedUserId();

    // Check if in SavedMovies
    const { data: savedMovie } = await supabase
      .from("SavedMovies")
      .select("id")
      .eq("movie_id", movieId)
      .eq("user_id", userId)
      .single();

    if (!savedMovie) return false;

    // If in SavedMovies, it's considered saved (even if not in collections)
    return true;
  } catch (err) {
    console.error("Error checking if movie is saved:", err);
    return false;
  }
};

// Check if movie is ONLY in SavedMovies (not in any collections)
export const isMovieOnlyInSavedMovies = async (
  movieId: number,
): Promise<boolean> => {
  try {
    const userId = await getAuthenticatedUserId();

    // Get the saved movie record
    const { data: savedMovie } = await supabase
      .from("SavedMovies")
      .select("id")
      .eq("movie_id", movieId)
      .eq("user_id", userId)
      .single();

    if (!savedMovie) return false;

    // Check if it's in any collections
    const { data: collectionItems, error } = await supabase
      .from("CollectionItems")
      .select("id")
      .eq("saved_movie_id", savedMovie.id)
      .limit(1);

    if (error) throw error;

    // If no collection items, it's ONLY in SavedMovies
    return !(collectionItems && collectionItems.length > 0);
  } catch (err) {
    console.error("Error checking if movie is only in SavedMovies:", err);
    return false;
  }
};

// Get all collection IDs that contain this movie
export const getMovieCollectionIds = async (
  movieId: number,
): Promise<string[]> => {
  try {
    const userId = await getAuthenticatedUserId();

    // Get the saved movie record
    const { data: savedMovie } = await supabase
      .from("SavedMovies")
      .select("id")
      .eq("movie_id", movieId)
      .eq("user_id", userId)
      .single();

    if (!savedMovie) return [];

    // Get all collection items for this movie
    const { data: collectionItems, error } = await supabase
      .from("CollectionItems")
      .select("collection_id")
      .eq("saved_movie_id", savedMovie.id);

    if (error) throw error;

    return (collectionItems || []).map((item: any) => item.collection_id);
  } catch (err) {
    console.error("Error getting movie collection IDs:", err);
    return [];
  }
};

// services/supabaseAPI.ts - ADDITIONAL FUNCTION
export const removeMovieFromAllCollections = async (movieId: number) => {
  try {
    const userId = await getAuthenticatedUserId();

    // First, get the saved_movie_id from SavedMovies
    const { data: savedMovie } = await supabase
      .from("SavedMovies")
      .select("id")
      .eq("movie_id", movieId)
      .eq("user_id", userId)
      .single();

    if (!savedMovie) {
      console.log("Movie not found in SavedMovies");
      return true; // Already not saved
    }

    // Delete from CollectionItems first (due to foreign key constraints)
    const { error: collectionItemsError } = await supabase
      .from("CollectionItems")
      .delete()
      .eq("saved_movie_id", savedMovie.id);

    if (collectionItemsError) {
      console.error("Error removing from collections:", collectionItemsError);
      throw collectionItemsError;
    }

    // Then delete from SavedMovies
    const { error: savedMoviesError } = await supabase
      .from("SavedMovies")
      .delete()
      .eq("id", savedMovie.id);

    if (savedMoviesError) {
      console.error("Error removing from saved movies:", savedMoviesError);
      throw savedMoviesError;
    }

    return true;
  } catch (err) {
    console.error("Error completely removing movie:", err);
    return false;
  }
};

/**
 * Checks if movie is in any specific collections (not just saved)
 */
export const isMovieInAnyCollection = async (
  movieId: number,
): Promise<boolean> => {
  try {
    const userId = await getAuthenticatedUserId();

    // Get the saved movie record
    const { data: savedMovie } = await supabase
      .from("SavedMovies")
      .select("id")
      .eq("movie_id", movieId)
      .eq("user_id", userId)
      .single();

    if (!savedMovie) return false;

    // Check if it's in any collections
    const { data: collectionItems, error } = await supabase
      .from("CollectionItems")
      .select("id")
      .eq("saved_movie_id", savedMovie.id)
      .limit(1);

    if (error) throw error;
    return !!(collectionItems && collectionItems.length > 0);
  } catch (err) {
    console.error("Error checking collection status:", err);
    return false;
  }
};

// Add this function to services/supabaseAPI.ts
export const saveMovieWithoutCollections = async (movie: MovieDetails) => {
  try {
    const userId = await getAuthenticatedUserId();

    // Check if movie is already saved
    const { data: existingSaved } = await supabase
      .from("SavedMovies")
      .select("id")
      .eq("movie_id", movie.id)
      .eq("user_id", userId)
      .single();

    if (existingSaved) {
      return true; // Already saved
    }

    // Save to SavedMovies only
    const { data: saved, error } = await supabase
      .from("SavedMovies")
      .insert({
        movie_id: movie.id,
        title: movie.title,
        poster_url: `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
        user_id: userId,
      })
      .select()
      .single();

    if (error) throw error;
    return true;
  } catch (err) {
    console.error("Error saving movie without collections:", err);
    return false;
  }
};
