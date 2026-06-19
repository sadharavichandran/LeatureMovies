import { Film, Star } from "lucide-react";
import { useState, useMemo } from "react";
import { Movie, Show, Theatre } from "../types";
import Hero from './Hero';

interface MoviesCatalogProps {
  movies: Movie[];
  shows: Show[];
  theatres: Theatre[];
  onSelectMovie: (movie: Movie) => void;
  onNavigateHome: () => void;
  onOpenReviews: (movie: Movie) => void;
}

export default function MoviesCatalog({
  movies,
  shows,
  theatres,
  onSelectMovie,
  onNavigateHome,
  onOpenReviews,
}: MoviesCatalogProps) {
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("");

  // Extract unique values for filters
  const { languages, genres } = useMemo(() => {
    const defaultLanguages = [
      'English', 'Tamil', 'Telugu', 'Malayalam', 'Kannada', 'Hindi', 'Marathi', 'Bengali',
    ];
    const defaultGenres = [
      'Action', 'Drama', 'Comedy', 'Thriller', 'Horror', 'Romance', 'Sci-Fi', 'Documentary', 'Animation',
    ];

    const langs = Array.from(new Set([...defaultLanguages, ...movies.map((m) => m.language)])).filter(Boolean).sort();
    const gens = Array.from(new Set([...defaultGenres, ...movies.map((m) => m.genre)])).filter(Boolean).sort();
    return { languages: langs, genres: gens };
  }, [movies]);

  // Filter logic — real-time filtering as user types or selects
  const filteredMovies = useMemo(() => {
    return movies.filter((movie) => {
      const matchQuery = movie.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        movie.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchLanguage = !selectedLanguage || movie.language === selectedLanguage;
      const matchGenre = !selectedGenre || movie.genre === selectedGenre;
      return matchQuery && matchLanguage && matchGenre;
    });
  }, [movies, searchQuery, selectedLanguage, selectedGenre]);

  const isFilterActive = selectedLanguage || selectedGenre || searchQuery;

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedLanguage("");
    setSelectedGenre("");
  };

  return (
    <div className="min-h-screen bg-[#050505] text-stone-100">
      {/* Hero with dynamic search, filters, slideshow, and venue indicators */}
      <Hero
        movies={movies}
        theatres={theatres}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedLanguage={selectedLanguage}
        setSelectedLanguage={setSelectedLanguage}
        selectedGenre={selectedGenre}
        setSelectedGenre={setSelectedGenre}
        languages={languages}
        genres={genres}
        onSelectMovie={onSelectMovie}
      />

      {/* Movies Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {filteredMovies.length > 0 ? (
          <div>
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-stone-100">
                  Showing <span className="text-[#C5A059] font-bold">{filteredMovies.length}</span> Movies
                </h2>
                <p className="text-xs text-stone-400 mt-1">Click on any movie to select show dates and book tickets</p>
              </div>
              {isFilterActive && (
                <button
                  onClick={resetFilters}
                  className="text-xs px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-stone-400 hover:text-stone-200 transition-all"
                >
                  Clear Filters
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {filteredMovies.map((movie) => {
                // Get shows for this movie
                const movieShows = shows.filter((s) => s.movieId === movie.id && !s.isCancelled);
                const availableTheatres = Array.from(new Set(movieShows.map((s) => s.theatreName)));

                return (
                  <div
                    key={movie.id}
                    onClick={() => onSelectMovie(movie)}
                    className="group glass-card rounded-2xl overflow-hidden hover:scale-[1.02] hover:border-[#C5A059]/40 hover:shadow-[0_0_30px_rgba(197,160,89,0.08)] transition-all duration-300 cursor-pointer p-3 flex flex-col"
                  >
                    <div className="aspect-[2/3] w-full rounded-xl overflow-hidden bg-stone-950 relative border border-white/5">
                      <img
                        src={movie.posterUrl}
                        alt={movie.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-transparent to-transparent opacity-80 group-hover:opacity-50 transition-opacity" />

                      {/* Badge showing available shows */}
                      {movieShows.length > 0 && (
                        <div className="absolute top-2 right-2 bg-[#C5A059] text-black px-2 py-1 rounded-lg text-[10px] font-bold shadow-lg">
                          {movieShows.length} Shows
                        </div>
                      )}

                      {/* Overall Rating Badge */}
                      <div className="absolute top-2 left-2 bg-black/80 backdrop-blur-md border border-white/10 text-white px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 shadow-lg">
                        <Star className="w-3 h-3 text-[#C5A059] fill-[#C5A059]" />
                        {movie.averageRating ? movie.averageRating.toFixed(1) : 'New'}
                      </div>
                    </div>

                    <div className="mt-4 px-1.5 flex flex-col flex-1">
                      <h3 className="font-serif font-bold text-stone-100 group-hover:text-[#F1D299] transition-colors tracking-tight text-base truncate mb-2">
                        {movie.title}
                      </h3>

                      <div className="flex flex-wrap gap-1 mb-2">
                        <span className="text-[9px] font-mono text-[#C5A059] font-bold bg-white/5 px-2 py-1 rounded uppercase">
                          {movie.language}
                        </span>
                        <span className="text-[9px] font-mono text-stone-300 font-bold bg-white/5 px-2 py-1 rounded uppercase">
                          {movie.genre}
                        </span>
                      </div>

                      <div className="text-[9px] text-stone-500 space-y-0.5 mt-auto border-t border-white/5 pt-2">
                        <div className="flex justify-between">
                          <span>Released:</span>
                          <span className="text-stone-400">{movie.releaseDate.includes('T') ? movie.releaseDate.split('T')[0] : movie.releaseDate}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Duration:</span>
                          <span className="text-stone-400">{movie.duration}</span>
                        </div>
                        {movieShows.length > 0 && (
                          <div className="flex justify-between mt-1 pt-1 border-t border-white/5">
                            <span>Theatres:</span>
                            <span className="text-[#C5A059] font-semibold">{availableTheatres.length}</span>
                          </div>
                        )}
                      </div>

                      {/* Rating Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenReviews(movie);
                        }}
                        className="mt-3 w-full py-2 text-[10px] font-bold tracking-wider uppercase bg-[#C5A059]/10 border border-[#C5A059]/30 rounded-lg hover:bg-[#C5A059]/20 hover:border-[#C5A059]/60 transition-colors text-[#C5A059] flex items-center justify-center gap-1.5"
                      >
                        <Star className="w-3 h-3" />
                        Rating
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="border border-dashed border-[#C5A059]/10 py-20 rounded-3xl text-center bg-white/2">
            <Film className="w-12 h-12 mx-auto text-stone-700 mb-4" />
            <p className="text-stone-400 font-semibold mb-2">No movies found</p>
            <p className="text-xs text-stone-500 max-w-md mx-auto">
              Try adjusting your search filters or check back soon for new releases!
            </p>
            {isFilterActive && (
              <button
                onClick={resetFilters}
                className="mt-4 px-4 py-2 text-xs font-semibold text-[#C5A059] border border-[#C5A059]/30 rounded-lg hover:bg-[#C5A059]/10 transition-all"
              >
                Clear All Filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
