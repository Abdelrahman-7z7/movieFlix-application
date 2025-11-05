import { createClient } from "@supabase/supabase-js";

// Supabase configuration
// Support both naming conventions: EXPO_PUBLIC_PROJECT_URL or EXPO_PUBLIC_SUPABASE_URL
const SUPABASE_URL = process.env.EXPO_PUBLIC_PROJECT_URL!;
// Support both naming conventions: EXPO_PUBLIC_API_KEY or EXPO_PUBLIC_SUPABASE_ANON_KEY
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_API_KEY!;

// Table name (from your Supabase schema)
const TABLE_NAME = "SearchHistory";

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const updateSearchCount = async (query: string, movie: Movie) => {
  try {
    // Check if record exists with this searchTerm
    const { data: existingRecords, error: searchError } = await supabase
      .from(TABLE_NAME)
      .select("*")
      .eq("searchTerm", query)
      .limit(1);

    if (searchError) {
      console.error("Error searching for existing record:", searchError);
      throw searchError;
    }


    console.log(existingRecords.length > 0 ? "Updating existing record" : "Inserting new record");


    if (existingRecords && existingRecords.length > 0) {
      // Update existing record - increment count
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
      // Create new record
      // NOTE: your table defines movie_id as UUID. TMDB ids are numbers, so for now
      // we generate a UUID placeholder. When you share final schema/mapping, we'll align it.
      // const generatedUuid = (global as any)?.crypto?.randomUUID?.() || "00000000-0000-0000-0000-000000000001";
      const { error: insertError } = await supabase
        .from(TABLE_NAME)
        .insert({
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

// export const getTrendingMovies = async (): Promise<
//   TrendingMovie[] | undefined
// > => {
//   try {
//     const { data, error } = await supabase
//       .from(TABLE_NAME)
//       .select("*")
//       .order("count", { ascending: false })
//       .limit(5);

//     if (error) {
//       console.error("Error fetching trending movies:", error);
//       return undefined;
//     }

//     // Cast rows into TrendingMovie shape expected by UI
//     return (data || []).map((row: any) => ({
//       searchTerm: row.searchTerm,
//       movie_id: row.movie_id,
//       title: row.title,
//       count: row.count,
//       poster_url: row.poster_url,
//     })) as unknown as TrendingMovie[];
//   } catch (error) {
//     console.error("Error in getTrendingMovies:", error);
//     return undefined;
//   }
// };

export const getTrendingMovies = async (): Promise<TrendingMovie[] | undefined> => {
  try{
    const {data, error} = await supabase.from(TABLE_NAME).select("*").order("count", {ascending: false}).limit(5);

    return data as unknown as TrendingMovie[];
  }catch(error){
    console.error("Error in getTrendingMovies:", error);
    return undefined;
  }
}


