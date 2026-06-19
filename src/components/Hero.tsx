import { Search, Film, Globe, Star, ChevronRight, Clock, Tag } from "lucide-react";
import { useState, useEffect } from "react";
import { Movie, Theatre } from "../types";

const heroBg = "/src/assets/images/premium_cinema_bg_1780982549681.png";

interface HeroProps {
  movies: Movie[];
  theatres?: Theatre[];
  showFilters?: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedLanguage: string;
  setSelectedLanguage: (lang: string) => void;
  selectedGenre: string;
  setSelectedGenre: (genre: string) => void;
  languages: string[];
  genres: string[];
  onSelectMovie: (movie: Movie) => void;
}

export default function Hero({
  movies,
  theatres = [],
  showFilters = true,
  searchQuery,
  setSearchQuery,
  selectedLanguage,
  setSelectedLanguage,
  selectedGenre,
  setSelectedGenre,
  languages,
  genres,
  onSelectMovie,
}: HeroProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    if (movies.length <= 1) return;
    const interval = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % movies.length);
        setIsTransitioning(false);
      }, 400);
    }, 4500);
    return () => clearInterval(interval);
  }, [movies.length]);

  const featuredMovie = movies.length > 0 ? movies[currentIndex] : null;

  // Truncate description to ~120 chars for short preview
  const shortDesc = (desc: string) => {
    if (!desc) return "";
    return desc.length > 130 ? desc.substring(0, 130).trimEnd() + "…" : desc;
  };

  return (
    <div className="relative bg-[#050505] overflow-hidden border-b border-white/5">
      {/* Luxury Cinematic Background */}
      <div className="absolute inset-0 z-0 pointer-events-none select-none">
        <img
          src={heroBg}
          alt="Premium Cinematic booking Platform Background"
          className="w-full h-full object-cover opacity-[0.28] scale-102 transform origin-center transition-all duration-1000"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/75 to-[#050505]" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#050505] via-[#050505]/20 to-[#050505]" />
        {/* Dynamic ambient glow that shifts with poster color */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#C5A059] opacity-[0.06] blur-[160px] rounded-full" />
        <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-[#C5A059] opacity-[0.04] blur-[120px] rounded-full" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 pt-6 pb-16 sm:pt-8 sm:pb-20">
        {/* === MAIN HERO GRID: Left Info + Right Poster === */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-center">

          {/* ── LEFT COLUMN: Dynamic Movie Info (synced to slideshow) ── */}
          <div className="lg:col-span-7 flex flex-col gap-6">

            {/* Brand badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-[#C5A059]/25 rounded-full w-fit">
              <Star className="w-3.5 h-3.5 text-[#C5A059] fill-[#C5A059]" />
              <span className="text-[9px] font-bold uppercase tracking-[0.25em] gold-text">
                Live Booking Engine
              </span>
            </div>

            {/* Platform headline — guest homepage only */}
            <h1 className="text-4xl sm:text-5xl font-serif text-stone-100 leading-[1.1] tracking-tight">
              Cinematic Excellence,{" "}
              <span className="italic font-normal gold-text">Redefined.</span>
            </h1>

            {/* ── DYNAMIC MOVIE INFO PANEL (synced with poster) ── */}
            {featuredMovie ? (
              <div
                className="relative flex flex-col gap-4 p-6 rounded-2xl border border-white/8 bg-white/[0.03] backdrop-blur-sm overflow-hidden transition-all duration-500"
                style={{ opacity: isTransitioning ? 0 : 1, transform: isTransitioning ? "translateY(8px)" : "translateY(0)" }}
              >
                {/* Subtle gold accent line */}
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[#C5A059] via-[#F1D299] to-transparent rounded-l-2xl" />

                {/* NOW SHOWING label */}
                <span className="text-[9px] uppercase tracking-[0.25em] text-[#C5A059] font-bold font-mono pl-2">
                  Now Showing
                </span>

                {/* Movie Title (Bold) */}
                <h2
                  className="text-3xl sm:text-4xl font-serif font-bold text-stone-100 leading-tight tracking-tight pl-2"
                  style={{ transition: "all 0.4s ease" }}
                >
                  {featuredMovie.title}
                </h2>

                {/* Meta pills: genre, language, duration */}
                <div className="flex flex-wrap gap-2 pl-2">
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#C5A059]/10 border border-[#C5A059]/25 text-[#C5A059] text-[10px] font-bold uppercase tracking-wider font-mono">
                    <Tag className="w-3 h-3" />
                    {featuredMovie.genre}
                  </span>
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-stone-300 text-[10px] uppercase tracking-wider font-mono">
                    <Globe className="w-3 h-3 text-stone-400" />
                    {featuredMovie.language}
                  </span>
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-stone-300 text-[10px] uppercase tracking-wider font-mono">
                    <Clock className="w-3 h-3 text-stone-400" />
                    {featuredMovie.duration}
                  </span>
                </div>

                {/* Short description */}
                <p className="text-sm text-stone-400 leading-relaxed max-w-lg pl-2" style={{ transition: "all 0.4s ease" }}>
                  {shortDesc(featuredMovie.description) || "A premium cinematic experience awaits. Reserve your seats now for an unforgettable screening at one of our luxury halls."}
                </p>

                {/* CTA Button */}
                <div className="flex items-center gap-4 pl-2 mt-1">
                  <button
                    onClick={() => onSelectMovie(featuredMovie)}
                    className="flex items-center gap-2 bg-gradient-to-r from-[#C5A059] to-[#F1D299] text-[#050505] font-bold text-[11px] uppercase tracking-wider px-6 py-2.5 rounded-full shadow-[0_0_20px_rgba(197,160,89,0.25)] hover:shadow-[0_0_30px_rgba(197,160,89,0.4)] hover:opacity-90 transition-all duration-300 cursor-pointer"
                  >
                    Reserve Seats
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[10px] text-stone-500 font-mono">
                    Released: {featuredMovie.releaseDate.includes('T') ? featuredMovie.releaseDate.split('T')[0] : featuredMovie.releaseDate}
                  </span>
                </div>

                {/* Slide indicator dots */}
                {movies.length > 1 && (
                  <div className="flex gap-1.5 pl-2 mt-1">
                    {movies.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setIsTransitioning(true);
                          setTimeout(() => {
                            setCurrentIndex(idx);
                            setIsTransitioning(false);
                          }, 300);
                        }}
                        className={`h-1 rounded-full transition-all duration-300 cursor-pointer ${
                          idx === currentIndex
                            ? "w-6 bg-[#C5A059]"
                            : "w-2 bg-white/20 hover:bg-white/40"
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-3 p-6 rounded-2xl border border-white/5 bg-white/[0.02]">
                <p className="text-sm text-stone-400 max-w-xl leading-relaxed">
                  Experience movie ticket booking redesigned. Dynamic schedules, premium halls, visual interactive seat selectors, and state-of-the-art cinematic luxury.
                </p>
              </div>
            )}

            {/* Search and Filter HUD — only shown when showFilters is true */}
            {showFilters && (
              <>
                <div className="p-6 glass-card rounded-2xl shadow-2xl flex flex-col gap-4">
                  <div className="relative flex items-center bg-black/40 rounded-xl border border-white/10 px-4 py-2 hover:border-[#C5A059]/30 transition-all">
                    <Search className="w-5 h-5 text-stone-500 mr-3" />
                    <input
                      type="text"
                      placeholder="Search over dynamic movies by title..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-transparent border-none outline-none text-stone-100 text-sm placeholder-stone-500 tracking-wide focus:ring-0"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] text-[#C5A059] uppercase tracking-[0.2em] font-mono font-bold pl-1">
                        Language
                      </label>
                      <select
                        value={selectedLanguage}
                        onChange={(e) => setSelectedLanguage(e.target.value)}
                        className="w-full px-3 py-2.5 bg-black/40 border border-white/10 focus:border-[#C5A059]/40 rounded-xl text-stone-200 text-xs tracking-wide transition-all outline-none cursor-pointer"
                      >
                        <option value="" className="bg-stone-950 text-stone-200">All Languages</option>
                        {languages.map((lang) => (
                          <option key={lang} value={lang} className="bg-stone-950 text-stone-200">
                            {lang}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] text-[#C5A059] uppercase tracking-[0.2em] font-mono font-bold pl-1">
                        Genre
                      </label>
                      <select
                        value={selectedGenre}
                        onChange={(e) => setSelectedGenre(e.target.value)}
                        className="w-full px-3 py-2.5 bg-black/40 border border-white/10 focus:border-[#C5A059]/40 rounded-xl text-stone-200 text-xs tracking-wide transition-all outline-none cursor-pointer"
                      >
                        <option value="" className="bg-stone-950 text-stone-200">All Genres</option>
                        {genres.map((g) => (
                          <option key={g} value={g} className="bg-stone-950 text-stone-200">
                            {g}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {theatres.length > 0 && (
                  <div className="flex gap-3 overflow-x-auto pb-1">
                    {theatres.map((t, i) => (
                      <span
                        key={t.id}
                        className={`whitespace-nowrap px-3.5 py-1 bg-white/5 border border-white/10 rounded-full text-[9px] uppercase tracking-wider ${
                          i === 0 ? "text-[#C5A059]" : "text-stone-400"
                        }`}
                      >
                        {t.name}
                      </span>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* ── RIGHT COLUMN: Poster Slideshow ── */}
          <div className="lg:col-span-5 flex justify-center">
            {featuredMovie ? (
              <div className="w-full max-w-[320px] flex flex-col group relative">
                {/* Background glow shadow */}
                <div className="absolute inset-0 bg-[#C5A059]/10 rounded-2xl blur-2xl group-hover:bg-[#C5A059]/20 transition-all pointer-events-none" />

                {/* Poster card */}
                <div className="relative bg-stone-950/40 border border-white/10 rounded-2xl overflow-hidden shadow-2xl hover:scale-[1.02] transition-all duration-300">
                  <div className="relative aspect-[2/3] w-full overflow-hidden bg-stone-950">
                    {movies.map((m, idx) => (
                      <div
                        key={m.id}
                        className={`absolute inset-0 transition-opacity duration-1000 ${
                          idx === currentIndex ? "opacity-100 z-10" : "opacity-0 z-0"
                        }`}
                      >
                        <img
                          src={m.posterUrl}
                          alt={m.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                          referrerPolicy="no-referrer"
                        />
                        {/* Poster gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/30 to-transparent" />

                        {/* Slide number badge */}
                        <div className="absolute top-3 right-3 px-2 py-0.5 bg-black/60 backdrop-blur-sm border border-white/10 rounded-full text-[9px] text-stone-400 font-mono">
                          {idx + 1} / {movies.length}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Poster footer */}
                  <div className="p-4 bg-stone-950/90 border-t border-white/5 flex justify-between items-center relative z-20">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[9px] text-stone-500 font-mono uppercase tracking-wider">
                        {featuredMovie.genre}
                      </span>
                      <span className="text-[10px] text-stone-400 font-medium truncate max-w-[140px]">
                        {featuredMovie.title}
                      </span>
                    </div>
                    <button
                      onClick={() => onSelectMovie(featuredMovie)}
                      className="text-[10px] uppercase tracking-wider bg-gradient-to-r from-[#C5A059] to-[#F1D299] text-[#050505] font-bold px-4 py-2 rounded-full transition-all cursor-pointer shadow-[0_0_15px_rgba(197,160,89,0.2)] hover:opacity-90 shrink-0"
                    >
                      Book Now
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-full max-w-[320px] aspect-[2/3] border border-[#C5A059]/20 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center bg-stone-950/40">
                <div className="p-4 bg-white/5 rounded-full text-[#C5A059] mb-4 border border-[#C5A059]/25 animate-pulse">
                  <Film className="w-8 h-8" />
                </div>
                <h4 className="text-stone-300 font-serif text-lg mb-2">Welcome to Leature Movies</h4>
                <p className="text-stone-500 text-xs max-w-[200px] leading-relaxed">
                  Scheduled dynamic screenings appear here live as added by the premium hotel curation team.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
