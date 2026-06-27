import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  Film,
  Building2,
  CalendarDays,
  Grid,
  Users,
  IndianRupee,
  Receipt,
  CheckCircle2,
  XCircle,
  X,
  Plus,
  Trash2,
  Edit,
  Landmark,
  Save,
  Tv,
  Eye,
  Percent,
  UtensilsCrossed,
  Lock,
  HelpCircle,
  MessageSquare,
  Star,
  Clock,
  RefreshCw,
  ListOrdered,
} from "lucide-react";
import { Movie, Theatre, Show, Booking, BankingDetails, Food } from "../types";
import { waitingQueueService } from "../services/api";
import { generateRandomId, formatCurrency, formatTime12h } from "../utils";

interface AdminPanelProps {
  movies: Movie[];
  theatres: Theatre[];
  shows: Show[];
  bookings: Booking[];
  bankingDetails: BankingDetails | null;
  onAddMovie: (movie: Omit<Movie, "id">) => Promise<void>;
  onUpdateMovie: (movie: Movie) => Promise<void>;
  onDeleteMovie: (id: string) => Promise<void>;
  onAddTheatre: (theatre: Omit<Theatre, "id">) => Promise<void>;
  onUpdateTheatre: (theatre: Theatre) => Promise<void>;
  onDeleteTheatre: (id: string) => Promise<void>;
  onCreateShow: (show: Omit<Show, "id" | "bookedSeats">) => Promise<void>;
  onUpdateShow: (show: Show) => Promise<void>;
  onDeleteShow: (id: string) => Promise<void>;
  onCancelShow: (id: string) => Promise<void>;
  onUpdateBanking: (banking: BankingDetails) => Promise<void>;
  foods: Food[];
  onAddFood: (food: Omit<Food, "id">) => Promise<void>;
  onUpdateFood: (food: Food) => Promise<void>;
  onDeleteFood: (id: string) => Promise<void>;
  usersCount: number;
  onConfirmBooking: (bookingData: Omit<Booking, "id" | "bookingDate">) => Promise<string>;
  onCancelBooking: (bookingId: string, showId: string, seatsToRelease: string[]) => Promise<void>;
  lostFoundItems?: any[];
  onUpdateLostFoundStatus?: (id: string, status: string) => Promise<void>;
}

export default function AdminPanel({
  movies,
  theatres,
  shows,
  bookings,
  bankingDetails,
  onAddMovie,
  onUpdateMovie,
  onDeleteMovie,
  onAddTheatre,
  onUpdateTheatre,
  onDeleteTheatre,
  onCreateShow,
  onUpdateShow,
  onDeleteShow,
  onCancelShow,
  onUpdateBanking,
  foods,
  onAddFood,
  onUpdateFood,
  onDeleteFood,
  usersCount,
  onConfirmBooking,
  onCancelBooking,
  lostFoundItems = [],
  onUpdateLostFoundStatus,
}: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<
    "analytics" | "movies" | "theatres" | "shows" | "bookings" | "banking" | "food" | "seatLocker" | "lostFound"
  >("analytics");

  // Waiting Queue Modal
  const [showWaitingQueueModal, setShowWaitingQueueModal] = useState(false);
  const [waitingQueueEntries, setWaitingQueueEntries] = useState<any[]>([]);
  const [waitingQueueLoading, setWaitingQueueLoading] = useState(false);

  const fetchWaitingQueueEntries = useCallback(async () => {
    setWaitingQueueLoading(true);
    try {
      const res = await waitingQueueService.getAll();
      setWaitingQueueEntries(res.entries || []);
    } catch (err) {
      console.error('Failed to load waiting queue:', err);
    } finally {
      setWaitingQueueLoading(false);
    }
  }, []);

  useEffect(() => {
    if (showWaitingQueueModal) {
      fetchWaitingQueueEntries();
    }
  }, [showWaitingQueueModal, fetchWaitingQueueEntries]);
  
  // State for viewing theatre reviews
  const [viewingReviewsForTheatre, setViewingReviewsForTheatre] = useState<Theatre | null>(null);

  // --- ANALYTICS COMPUTATIONS ---
  const analytics = useMemo(() => {
    const totalMovies = movies.length;
    const totalTheatres = theatres.length;
    const totalShows = shows.length;
    const activeShows = shows.filter((s) => !s.isCancelled).length;
    const cancelledShows = shows.filter((s) => s.isCancelled).length;
    const totalBookingsCount = bookings.length;

    // Revenue only from successful payments
    const totalRevenue = bookings
      .filter((b) => b.paymentStatus === "Success")
      .reduce((sum, b) => sum + b.totalAmount, 0);

    return {
      totalMovies,
      totalTheatres,
      totalShows,
      activeShows,
      cancelledShows,
      totalUsers: usersCount || 4, // users base fallback
      totalRevenue,
      totalBookings: totalBookingsCount,
    };
  }, [movies, theatres, shows, bookings, usersCount]);

  // --- STATE FOR FORMS ---
  const [movieForm, setMovieForm] = useState({
    id: "",
    title: "",
    posterUrl: "",
    description: "",
    language: "English",
    genre: "Action",
    duration: "130 mins",
    releaseDate: new Date().toISOString().slice(0, 16),
    trailerUrl: "",
    createdAt: new Date().toISOString(),
  });
  const [isEditingMovie, setIsEditingMovie] = useState(false);

  const [theatreForm, setTheatreForm] = useState<any>({
    id: "",
    name: "",
    location: "Downtown Premium",
    screens: 3,
    createdAt: new Date().toISOString(),
    hasParking: false,
    parkingTwoWheelerRows: 3,
    parkingTwoWheelerCols: 5,
    parkingFourWheelerRows: 2,
    parkingFourWheelerCols: 4,
    parkingTwoWheelerCost: 20,
    parkingFourWheelerCost: 50,
    maxRows: 10,
    maxCols: 15,
    vipRows: 2,
    premiumRows: 2,
    selectedLayoutSeats: [] as string[],
  });
  const [isEditingTheatre, setIsEditingTheatre] = useState(false);

  // Seat configuration inside show form builder
  const [showForm, setShowForm] = useState({
    id: "",
    movieId: "",
    theatreId: "",
    screenNumber: 1,
    dates: [new Date().toISOString().split("T")[0]],
    times: ["18:00"],
    ticketPrice: 250,
    // seat counts variables for customizer
    totalSeatsCount: 60,
    vipRows: 2, // Row A & B are VIP
    premiumRows: 2, // Row C & D are Premium
  });
  const [isEditingShow, setIsEditingShow] = useState(false);

  const [bankForm, setBankForm] = useState({
    accountHolderName: bankingDetails?.accountHolderName || "",
    bankName: bankingDetails?.bankName || "",
    accountNumber: bankingDetails?.accountNumber || "",
    ifscCode: bankingDetails?.ifscCode || "",
    upiId: bankingDetails?.upiId || "",
    qrCodeUrl: bankingDetails?.qrCodeUrl || "",
  });

  const [foodForm, setFoodForm] = useState<Food>({
    id: "",
    name: "",
    price: 120,
    imageUrl: "",
    category: "Popcorn",
    theatreId: "", // empty means available at all theatres
  });
  const [isEditingFood, setIsEditingFood] = useState(false);

  // Seat Locker states
  const [selectedShowIdForLocker, setSelectedShowIdForLocker] = useState("");
  const [selectedSeatsForLocker, setSelectedSeatsForLocker] = useState<string[]>([]);
  const [isProcessingLocker, setIsProcessingLocker] = useState(false);
  const [lockerSearchQuery, setLockerSearchQuery] = useState("");
  const [lockerSelectedTheatreId, setLockerSelectedTheatreId] = useState("");


  // Base64 helper for uploads
  const handleBase64Upload = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (url: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setter(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const groupedShows = useMemo(() => {
    const map = new Map<string, Show & { allDates: Set<string>, allTimes: Set<string>, groupedIds: string[] }>();
    shows.forEach(show => {
      const key = `${show.movieId}_${show.theatreId}_${show.screenNumber}`;
      if (!map.has(key)) {
        map.set(key, { ...show, allDates: new Set([show.date]), allTimes: new Set([show.time]), groupedIds: [show.id] });
      } else {
        const grouped = map.get(key)!;
        grouped.allDates.add(show.date);
        grouped.allTimes.add(show.time);
        grouped.groupedIds.push(show.id);
        // keep isCancelled false if at least one is not cancelled
        if (!show.isCancelled) {
          grouped.isCancelled = false;
        }
      }
    });
    return Array.from(map.values()).map(g => ({
      ...g,
      allDatesArr: Array.from(g.allDates).map(d => typeof d === 'string' && d.includes("T") ? d.split("T")[0] : d).sort(),
      allTimesArr: Array.from(g.allTimes).sort(),
    }));
  }, [shows]);

  return (
    <div className="min-h-screen bg-[#050505] text-stone-100 flex flex-col md:flex-row pb-12">
      {/* Side Tabs Rail */}
      <div className="w-full md:w-64 bg-black/40 border-b md:border-b-0 md:border-r border-white/5 p-4 shrink-0 flex md:flex-col gap-1.5 overflow-x-auto md:overflow-x-visible no-scrollbar">
        <h2 className="hidden md:block font-serif font-bold text-[#C5A059] tracking-widest text-xs uppercase px-3 pt-4 pb-6">
          ADMIN CONTROL
        </h2>
        {[
          { id: "analytics", label: "Analytics Hub", icon: IndianRupee },
          { id: "movies", label: "Movie Catalog", icon: Film },
          { id: "theatres", label: "Theatre Locations", icon: Building2 },
          { id: "shows", label: "Show Scheduler", icon: CalendarDays },
          { id: "food", label: "Food Counter", icon: UtensilsCrossed },
          { id: "bookings", label: "Booking Logs", icon: Receipt },
          { id: "lostFound", label: "Lost & Found", icon: HelpCircle },
          { id: "banking", label: "Banking Gateway", icon: Landmark },
          { id: "seatLocker", label: "Seat Locker", icon: Lock },
        ].map((tab) => {

          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-[10px] uppercase tracking-wider font-bold transition-all cursor-pointer whitespace-nowrap md:w-full ${activeTab === tab.id
                  ? "bg-[#C5A059]/15 text-[#F1D299] border border-[#C5A059]/30"
                  : "text-stone-500 hover:text-stone-300 hover:bg-white/5 border border-transparent"
                }`}
            >
              <Icon className="w-4 h-4 shrink-0 text-[#C5A059]" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Main Container */}
      <div className="flex-1 p-6 sm:p-10">
        {/* TAB 1: ANALYTICS HUB */}
        {activeTab === "analytics" && (
          <div className="flex flex-col gap-8 animate-fadeIn">
            <div>
              <h2 className="text-3xl font-serif font-bold tracking-tight text-stone-100">
                Dashboard Metrics
              </h2>
              <p className="text-stone-400 text-xs mt-1">
                Real-time performance analytics of ticket sales, cinema theaters and showtimes.
              </p>
            </div>

            {/* Metric grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  label: "Total Revenue",
                  value: formatCurrency(analytics.totalRevenue),
                  icon: IndianRupee,
                  color: "text-[#C5A059] border-[#C5A059]/10",
                },
                {
                  label: "Ticket Collections",
                  value: `${analytics.totalBookings} reservation(s)`,
                  icon: Receipt,
                  color: "text-stone-300 border-white/5",
                },
                {
                  label: "Total Registered Users",
                  value: analytics.totalUsers,
                  icon: Users,
                  color: "text-stone-300 border-white/5",
                },
                {
                  label: "Movies Configured",
                  value: analytics.totalMovies,
                  icon: Film,
                  color: "text-stone-300 border-white/5",
                },
                {
                  label: "Theatres Registered",
                  value: analytics.totalTheatres,
                  icon: Building2,
                  color: "text-stone-300 border-stone-800/80",
                },
                {
                  label: "Scheduled Shows",
                  value: analytics.totalShows,
                  icon: CalendarDays,
                  color: "text-stone-300 border-stone-800/80",
                },
                {
                  label: "Active Screenings",
                  value: analytics.activeShows,
                  icon: CheckCircle2,
                  color: "text-amber-400 border-stone-800/80",
                },
                {
                  label: "Cancelled Shows",
                  value: analytics.cancelledShows,
                  icon: XCircle,
                  color: "text-red-400 border-stone-800/80",
                },
              ].map((metric, i) => {
                const Icon = metric.icon;
                return (
                  <div
                    key={i}
                    className="p-6 bg-stone-900/40 border border-stone-830/60 rounded-2xl flex items-center justify-between shadow-xl"
                  >
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-stone-500 uppercase font-mono tracking-widest pl-0.5">
                        {metric.label}
                      </span>
                      <span className="text-2xl font-bold tracking-tight text-white">
                        {metric.value}
                      </span>
                    </div>
                    <div className={`p-3 bg-stone-900 rounded-xl border ${metric.color}`}>
                      <Icon className="w-5 h-5 text-amber-500" />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick action list for first-step admins */}
            <div className="bg-stone-900/20 border border-stone-800 p-6 rounded-2xl">
              <h3 className="font-sans font-bold text-stone-200 mb-2">Getting Started Guide</h3>
              <p className="text-stone-400 text-sm leading-relaxed mb-4">
                To accept user ticket purchases, please complete the following steps in sequence:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-mono">
                <div className="p-3 bg-stone-950/60 border border-stone-800 rounded-xl flex items-center gap-3">
                  <span className="text-amber-500 font-bold">1.</span>
                  <span>Register Cinema Houses/Theatres</span>
                </div>
                <div className="p-3 bg-stone-950/60 border border-stone-800 rounded-xl flex items-center gap-3">
                  <span className="text-amber-500 font-bold">2.</span>
                  <span>Upload Fresh Movie Titles</span>
                </div>
                <div className="p-3 bg-stone-950/60 border border-stone-800 rounded-xl flex items-center gap-3">
                  <span className="text-amber-500 font-bold">3.</span>
                  <span>Schedule Shows</span>
                </div>
                <div className="p-3 bg-stone-950/60 border border-stone-800 rounded-xl flex items-center gap-3">
                  <span className="text-amber-500 font-bold">4.</span>
                  <span>Confirm Banking Details</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MOVIE MANAGEMENT */}
        {activeTab === "movies" && (
          <div className="flex flex-col gap-10 animate-fadeIn">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                <h2 className="text-3xl font-sans font-bold tracking-tight text-stone-100">
                  Movie Management
                </h2>
                <p className="text-stone-400 text-sm mt-1">
                  Configure titles, high-resolution posters, genres, language variations and trailers.
                </p>
              </div>
              {!isEditingMovie && (
                <button
                  type="button"
                  onClick={() => {
                    setMovieForm({
                      id: "",
                      title: "",
                      posterUrl: "",
                      description: "",
                      language: "English",
                      genre: "Action",
                      duration: "132 mins",
                      releaseDate: new Date().toISOString().slice(0, 16),
                      trailerUrl: "",
                      createdAt: new Date().toISOString(),
                    });
                    setIsEditingMovie(true);
                  }}
                  className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold rounded-xl text-sm flex items-center gap-2 transition-transform hover:scale-103 cursor-pointer shadow-lg"
                >
                  <Plus className="w-4 h-4" />
                  Add New Movie
                </button>
              )}
            </div>

            {/* Add/Edit Form HUD */}
            {isEditingMovie && (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!movieForm.title || !movieForm.posterUrl || !movieForm.description) {
                    alert("Please provide the title, poster image, and outline description.");
                    return;
                  }
                  if (movieForm.id) {
                    // Update
                    await onUpdateMovie(movieForm as Movie);
                  } else {
                    // Add
                    await onAddMovie(movieForm);
                  }
                  setIsEditingMovie(false);
                }}
                className="p-6 bg-stone-900/50 border border-stone-800 rounded-2xl flex flex-col gap-4 relative"
              >
                <h3 className="text-lg font-bold text-stone-200">
                  {movieForm.id ? "Update Movie Record" : "Add Fresh Movie Entry"}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs text-stone-400 font-mono">Movie Cover/Poster</label>
                    <div className="flex flex-col gap-2">
                      {movieForm.posterUrl && (
                        <img
                          src={movieForm.posterUrl}
                          alt="Poster Preview"
                          className="w-full aspect-[2/3] max-h-40 object-cover rounded-xl border border-stone-800 bg-stone-950 mb-1 animate-fadeIn"
                        />
                      )}
                      <input
                        type="file"
                        onChange={(e) => handleBase64Upload(e, (url) => setMovieForm({ ...movieForm, posterUrl: url }))}
                        className="text-xs text-stone-300 bg-stone-950 p-2 rounded-xl border border-stone-800"
                      />
                      <span className="text-[10px] text-stone-500 italic">OR input URL address directly:</span>
                      <input
                        type="text"
                        placeholder="https://images.unsplash.com/..."
                        value={movieForm.posterUrl}
                        onChange={(e) => setMovieForm({ ...movieForm, posterUrl: e.target.value })}
                        className="px-3 py-2 text-xs bg-stone-950 border border-stone-830 rounded-xl outline-none"
                      />
                    </div>
                  </div>


                  <div className="flex flex-col gap-4 md:col-span-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs text-stone-400">Movie Name/Title</label>
                        <input
                          type="text"
                          required
                          value={movieForm.title}
                          onChange={(e) => setMovieForm({ ...movieForm, title: e.target.value })}
                          className="px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 text-sm outline-none focus:border-amber-500"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs text-stone-400">Duration (e.g. 142 mins)</label>
                        <input
                          type="text"
                          required
                          value={movieForm.duration}
                          onChange={(e) => setMovieForm({ ...movieForm, duration: e.target.value })}
                          className="px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 text-sm outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs text-stone-400">Language</label>
                        <select
                          value={movieForm.language}
                          onChange={(e) => setMovieForm({ ...movieForm, language: e.target.value })}
                          className="px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-stone-200 text-sm outline-none"
                        >
                          <option value="English">English</option>
                          <option value="Hindi">Hindi</option>
                          <option value="Tamil">Tamil</option>
                          <option value="Telugu">Telugu</option>
                          <option value="Kannada">Kannada</option>
                          <option value="Malayalam">Malayalam</option>
                        </select>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs text-stone-400">Genre</label>
                        <select
                          value={movieForm.genre}
                          onChange={(e) => setMovieForm({ ...movieForm, genre: e.target.value })}
                          className="px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-stone-200 text-sm outline-none"
                        >
                          <option value="Action">Action</option>
                          <option value="Sci-Fi">Sci-Fi</option>
                          <option value="Drama">Drama</option>
                          <option value="Thriller">Thriller</option>
                          <option value="Comedy">Comedy</option>
                          <option value="Horror">Horror</option>
                          <option value="Romance">Romance</option>
                        </select>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs text-stone-400">Release Date</label>
                        <input
                          type="datetime-local"
                          value={movieForm.releaseDate}
                          onChange={(e) => setMovieForm({ ...movieForm, releaseDate: e.target.value })}
                          className="px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 text-sm outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-stone-400">Trailer (Upload Video or Provide YouTube Link)</label>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={(e) => handleBase64Upload(e, (url) => setMovieForm({ ...movieForm, trailerUrl: url }))}
                    className="text-xs text-stone-300 bg-stone-950 p-2 rounded-xl border border-stone-800"
                  />
                  <span className="text-[10px] text-stone-500 italic mt-1">OR input YouTube URL / address directly:</span>
                  <input
                    type="text"
                    required
                    placeholder="https://www.youtube.com/embed/..."
                    value={movieForm.trailerUrl}
                    onChange={(e) => setMovieForm({ ...movieForm, trailerUrl: e.target.value })}
                    className="px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 text-sm outline-none focus:border-amber-500"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-stone-400">Movie Description / Plot Summary</label>
                  <textarea
                    rows={3}
                    required
                    value={movieForm.description}
                    onChange={(e) => setMovieForm({ ...movieForm, description: e.target.value })}
                    className="p-3 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 text-sm outline-none focus:border-amber-500 resize-none"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditingMovie(false)}
                    className="px-4 py-2 bg-transparent text-stone-300 hover:bg-stone-800 rounded-xl text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold rounded-xl text-sm"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            )}

            {/* Movie table collection list */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {movies.map((movie) => (
                <div
                  key={movie.id}
                  className="bg-stone-900/40 border border-stone-800/80 rounded-2xl overflow-hidden p-4 flex flex-col justify-between"
                >
                  <div className="flex gap-4">
                    <img
                      src={movie.posterUrl}
                      alt={movie.title}
                      className="w-20 h-28 object-cover rounded-xl shrink-0 bg-stone-950"
                      referrerPolicy="no-referrer"
                    />
                    <div className="flex-1 overflow-hidden">
                      <h3 className="font-bold text-stone-200 tracking-tight text-lg truncate">
                        {movie.title}
                      </h3>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        <span className="text-[10px] font-mono tracking-wide px-2 py-0.5 bg-stone-950/80 text-amber-500 border border-amber-500/10 rounded-full">
                          {movie.genre}
                        </span>
                        <span className="text-[10px] font-mono tracking-wide px-2 py-0.5 bg-stone-950/80 text-stone-400 rounded-full">
                          {movie.language}
                        </span>
                      </div>
                      <p className="text-xs text-stone-500 font-mono mt-2">
                        Duration: {movie.duration}
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-stone-400 line-clamp-3 mt-4 leading-relaxed">
                    {movie.description}
                  </p>

                  <div className="mt-5 pt-3 border-t border-stone-800/30 flex justify-between items-center">
                    <span className="text-[10.5px] text-stone-500 font-mono select-none">
                      Ref: {movie.id}
                    </span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          let formattedDate = new Date().toISOString().slice(0, 16);
                          if (movie.releaseDate && !isNaN(new Date(movie.releaseDate).getTime())) {
                            formattedDate = new Date(movie.releaseDate).toISOString().slice(0, 16);
                          }
                          setMovieForm({ ...movie, releaseDate: formattedDate });
                          setIsEditingMovie(true);
                        }}
                        className="p-2 hover:bg-stone-800 hover:text-amber-400 rounded-lg transition-colors cursor-pointer"
                        title="Update details"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (
                            confirm(`Delete Movie "${movie.title}"? Will drop all scheduled shows linked!`)
                          ) {
                            onDeleteMovie(movie.id);
                          }
                        }}
                        className="p-2 hover:bg-red-950/55 hover:text-red-400 rounded-lg transition-colors cursor-pointer"
                        title="Delete Movie"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {movies.length === 0 && (
                <div className="col-span-full border border-stone-830 border-dashed rounded-2xl py-16 text-center text-stone-500">
                  <Film className="w-8 h-8 mx-auto text-stone-600 mb-2" />
                  <span>No dynamic movies loaded. Add one to show on client browser.</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: THEATRE MANAGEMENT */}
        {activeTab === "theatres" && (
          <div className="flex flex-col gap-10 animate-fadeIn">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                <h2 className="text-3xl font-sans font-bold tracking-tight text-stone-100">
                  Theatre Management
                </h2>
                <p className="text-stone-400 text-sm mt-1">
                  Manage cinema halls, geographical regions, and physical screen counts.
                </p>
              </div>
              {!isEditingTheatre && (
                <button
                  type="button"
                  onClick={() => {
                    setTheatreForm({
                      id: "",
                      name: "",
                      location: "Downtown Boulevard, Sector 4",
                      screens: 3,
                      createdAt: new Date().toISOString(),
                      hasParking: false,
                      parkingTwoWheelerRows: 3,
                      parkingTwoWheelerCols: 5,
                      parkingFourWheelerRows: 2,
                      parkingFourWheelerCols: 4,
                      parkingTwoWheelerCost: 20,
                      parkingFourWheelerCost: 50,
                      maxRows: 10,
                      maxCols: 15,
                      vipRows: 2,
                      premiumRows: 2,
                      selectedLayoutSeats: [],
                    });
                    setIsEditingTheatre(true);
                  }}
                  className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold rounded-xl text-sm flex items-center gap-2 transition-transform hover:scale-103 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Register New Theatre
                </button>
              )}
            </div>

            {/* Theatre Form */}
            {isEditingTheatre && (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!theatreForm.name || !theatreForm.location) {
                    alert("Name and Location are required.");
                    return;
                  }
                  if (theatreForm.id) {
                    await onUpdateTheatre(theatreForm as Theatre);
                  } else {
                    await onAddTheatre(theatreForm);
                  }
                  setIsEditingTheatre(false);
                }}
                className="p-6 bg-stone-900/50 border border-stone-800 rounded-2xl flex flex-col gap-4 max-w-3xl"
              >
                <h3 className="text-lg font-bold text-stone-200">
                  {theatreForm.id ? "Update Location Info" : "Register Location Entity"}
                </h3>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm text-stone-400">Theatre Name (e.g. Sunset IMAX)</label>
                  <input
                    type="text"
                    required
                    value={theatreForm.name}
                    onChange={(e) => setTheatreForm({ ...theatreForm, name: e.target.value })}
                    className="px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 text-sm outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm text-stone-400">Location address</label>
                    <input
                      type="text"
                      required
                      value={theatreForm.location}
                      onChange={(e) => setTheatreForm({ ...theatreForm, location: e.target.value })}
                      className="px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 text-sm outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm text-stone-400">Available Screens (1 - 20)</label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={20}
                      value={theatreForm.screens}
                      onChange={(e) =>
                        setTheatreForm({ ...theatreForm, screens: parseInt(e.target.value) || 1 })
                      }
                      className="px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 text-sm outline-none"
                    />
                  </div>
                </div>

                {/* Parking Configuration */}
                <div className="flex flex-col gap-4 pt-2 border-t border-stone-800/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-stone-200">Parking Facility</h4>
                      <p className="text-xs text-stone-500 mt-0.5">Enable to configure parking layout and pricing</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setTheatreForm({ ...theatreForm, hasParking: !(theatreForm as any).hasParking })}
                      className={`relative w-12 h-6 rounded-full transition-colors duration-200 cursor-pointer ${
                        (theatreForm as any).hasParking ? "bg-amber-500" : "bg-stone-700"
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
                          (theatreForm as any).hasParking ? "translate-x-6" : "translate-x-0.5"
                        }`}
                      />
                    </button>
                  </div>

                  {(theatreForm as any).hasParking && (
                    <div className="flex flex-col gap-4 p-4 bg-stone-950/60 border border-amber-500/10 rounded-xl animate-fadeIn">
                      {/* 2-Wheeler Zone */}
                      <div className="flex flex-col gap-2">
                        <span className="text-xs font-semibold text-amber-400 uppercase tracking-widest">2-Wheeler Zone</span>
                        <div className="grid grid-cols-3 gap-3">
                          <div className="flex flex-col gap-1">
                            <label className="text-xs text-stone-400">Rows</label>
                            <input
                              type="number" min={1} max={20}
                              value={(theatreForm as any).parkingTwoWheelerRows}
                              onChange={(e) => setTheatreForm({ ...theatreForm, parkingTwoWheelerRows: parseInt(e.target.value) || 1 } as any)}
                              className="px-3 py-2 bg-stone-900 border border-stone-700 rounded-xl text-stone-100 text-sm outline-none focus:border-amber-500"
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-xs text-stone-400">Columns</label>
                            <input
                              type="number" min={1} max={30}
                              value={(theatreForm as any).parkingTwoWheelerCols}
                              onChange={(e) => setTheatreForm({ ...theatreForm, parkingTwoWheelerCols: parseInt(e.target.value) || 1 } as any)}
                              className="px-3 py-2 bg-stone-900 border border-stone-700 rounded-xl text-stone-100 text-sm outline-none focus:border-amber-500"
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-xs text-stone-400">Cost (₹ / slot)</label>
                            <input
                              type="number" min={0}
                              value={(theatreForm as any).parkingTwoWheelerCost}
                              onChange={(e) => setTheatreForm({ ...theatreForm, parkingTwoWheelerCost: parseInt(e.target.value) || 0 } as any)}
                              className="px-3 py-2 bg-stone-900 border border-stone-700 rounded-xl text-stone-100 text-sm outline-none focus:border-amber-500"
                            />
                          </div>
                        </div>
                        <p className="text-[10px] text-stone-500">
                          Layout: {(theatreForm as any).parkingTwoWheelerRows} rows × {(theatreForm as any).parkingTwoWheelerCols} cols = {((theatreForm as any).parkingTwoWheelerRows || 0) * ((theatreForm as any).parkingTwoWheelerCols || 0)} total slots
                        </p>
                      </div>

                      {/* 4-Wheeler Zone */}
                      <div className="flex flex-col gap-2 pt-2 border-t border-stone-800/40">
                        <span className="text-xs font-semibold text-stone-300 uppercase tracking-widest">4-Wheeler Zone</span>
                        <div className="grid grid-cols-3 gap-3">
                          <div className="flex flex-col gap-1">
                            <label className="text-xs text-stone-400">Rows</label>
                            <input
                              type="number" min={1} max={20}
                              value={(theatreForm as any).parkingFourWheelerRows}
                              onChange={(e) => setTheatreForm({ ...theatreForm, parkingFourWheelerRows: parseInt(e.target.value) || 1 } as any)}
                              className="px-3 py-2 bg-stone-900 border border-stone-700 rounded-xl text-stone-100 text-sm outline-none focus:border-amber-500"
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-xs text-stone-400">Columns</label>
                            <input
                              type="number" min={1} max={30}
                              value={(theatreForm as any).parkingFourWheelerCols}
                              onChange={(e) => setTheatreForm({ ...theatreForm, parkingFourWheelerCols: parseInt(e.target.value) || 1 } as any)}
                              className="px-3 py-2 bg-stone-900 border border-stone-700 rounded-xl text-stone-100 text-sm outline-none focus:border-amber-500"
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-xs text-stone-400">Cost (₹ / slot)</label>
                            <input
                              type="number" min={0}
                              value={(theatreForm as any).parkingFourWheelerCost}
                              onChange={(e) => setTheatreForm({ ...theatreForm, parkingFourWheelerCost: parseInt(e.target.value) || 0 } as any)}
                              className="px-3 py-2 bg-stone-900 border border-stone-700 rounded-xl text-stone-100 text-sm outline-none focus:border-amber-500"
                            />
                          </div>
                        </div>
                        <p className="text-[10px] text-stone-500">
                          Layout: {(theatreForm as any).parkingFourWheelerRows} rows × {(theatreForm as any).parkingFourWheelerCols} cols = {((theatreForm as any).parkingFourWheelerRows || 0) * ((theatreForm as any).parkingFourWheelerCols || 0)} total slots
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* ─── Interactive Seat Layout Builder ─── */}
                <div className="flex flex-col gap-4 pt-2 border-t border-stone-800/50">
                  <div className="flex flex-col gap-1">
                    <h4 className="text-xs font-bold text-amber-400 uppercase" style={{letterSpacing:'0.14em'}}>
                      Configure Theatre Default Seating Inventory
                    </h4>
                    <p className="text-xs text-stone-500">Set rows, columns and VIP/Premium tiers. Then click each seat to activate it.</p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-stone-400">Total Rows (Max 26)</label>
                      <input type="number" min={1} max={26}
                        value={theatreForm.maxRows}
                        onChange={(e) => {
                          const rows = Math.min(26, Math.max(1, parseInt(e.target.value) || 1));
                          const valid = (theatreForm.selectedLayoutSeats || []).filter((s: string) => s.charCodeAt(0) - 65 < rows);
                          setTheatreForm({ ...theatreForm, maxRows: rows, selectedLayoutSeats: valid });
                        }}
                        className="px-3 py-2 bg-stone-900 border border-stone-700 rounded-xl text-stone-100 text-sm outline-none focus:border-amber-500"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-stone-400">Columns per Row (Max 30)</label>
                      <input type="number" min={1} max={30}
                        value={theatreForm.maxCols}
                        onChange={(e) => {
                          const cols = Math.min(30, Math.max(1, parseInt(e.target.value) || 1));
                          const valid = (theatreForm.selectedLayoutSeats || []).filter((s: string) => parseInt(s.slice(1)) - 1 < cols);
                          setTheatreForm({ ...theatreForm, maxCols: cols, selectedLayoutSeats: valid });
                        }}
                        className="px-3 py-2 bg-stone-900 border border-stone-700 rounded-xl text-stone-100 text-sm outline-none focus:border-amber-500"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-stone-400">VIP Tier Rows</label>
                      <input type="number" min={0} max={theatreForm.maxRows}
                        value={theatreForm.vipRows}
                        onChange={(e) => setTheatreForm({ ...theatreForm, vipRows: parseInt(e.target.value) || 0 })}
                        className="px-3 py-2 bg-stone-900 border border-stone-700 rounded-xl text-stone-100 text-sm outline-none focus:border-amber-500"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-stone-400">Premium Tier Rows</label>
                      <input type="number" min={0} max={theatreForm.maxRows}
                        value={theatreForm.premiumRows}
                        onChange={(e) => setTheatreForm({ ...theatreForm, premiumRows: parseInt(e.target.value) || 0 })}
                        className="px-3 py-2 bg-stone-900 border border-stone-700 rounded-xl text-stone-100 text-sm outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 p-4 bg-stone-950 border border-stone-800 rounded-2xl overflow-x-auto">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">Interactive Layout Builder</span>
                      <div className="flex gap-2">
                        <button type="button"
                          onClick={() => {
                            const all: string[] = [];
                            for (let r = 0; r < theatreForm.maxRows; r++)
                              for (let c = 1; c <= theatreForm.maxCols; c++)
                                all.push(`${String.fromCharCode(65 + r)}${c}`);
                            setTheatreForm({ ...theatreForm, selectedLayoutSeats: all });
                          }}
                          className="px-3 py-1 text-[10px] font-bold uppercase bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg hover:bg-amber-500/30 cursor-pointer"
                        >Select All</button>
                        <button type="button"
                          onClick={() => setTheatreForm({ ...theatreForm, selectedLayoutSeats: [] })}
                          className="px-3 py-1 text-[10px] font-bold uppercase bg-stone-800 text-stone-400 border border-stone-700 rounded-lg hover:bg-stone-700 cursor-pointer"
                        >Clear All</button>
                      </div>
                    </div>
                    <p className="text-[10px] text-stone-600 mb-2">Click seats to toggle on/off. Leave inactive to create aisles or gaps.</p>

                    <div className="flex flex-col gap-1 min-w-max">
                      {Array.from({ length: theatreForm.maxRows }).map((_, rIdx) => {
                        const rowLetter = String.fromCharCode(65 + rIdx);
                        const isVipRow = rIdx < theatreForm.vipRows;
                        const isPremRow = !isVipRow && rIdx < (theatreForm.vipRows + theatreForm.premiumRows);
                        return (
                          <div key={rowLetter} className="flex items-center gap-1">
                            <span className={`w-5 text-[10px] font-bold font-mono select-none text-right mr-1 ${isVipRow ? 'text-amber-400' : isPremRow ? 'text-cyan-400' : 'text-stone-500'}`}>{rowLetter}</span>
                            <div className="flex gap-1">
                              {Array.from({ length: theatreForm.maxCols }).map((_, cIdx) => {
                                const seatId = `${rowLetter}${cIdx + 1}`;
                                const isActive = (theatreForm.selectedLayoutSeats || []).includes(seatId);
                                return (
                                  <button key={seatId} type="button"
                                    onClick={() => {
                                      const seats: string[] = theatreForm.selectedLayoutSeats || [];
                                      setTheatreForm({ ...theatreForm, selectedLayoutSeats: isActive ? seats.filter((s: string) => s !== seatId) : [...seats, seatId] });
                                    }}
                                    title={seatId}
                                    className={`w-6 h-6 rounded-t-md rounded-b-sm border text-[8px] font-bold font-mono flex items-center justify-center transition-all cursor-pointer select-none ${
                                      isActive
                                        ? isVipRow ? 'bg-amber-500 border-amber-400 text-black' : isPremRow ? 'bg-cyan-500 border-cyan-400 text-black' : 'bg-stone-300 border-stone-200 text-stone-900'
                                        : 'bg-stone-900 border-stone-700 text-stone-600 hover:bg-stone-800 hover:border-stone-500'
                                    }`}
                                  >{cIdx + 1}</button>
                                );
                              })}
                            </div>
                            <span className={`w-5 text-[10px] font-bold font-mono select-none ml-1 ${isVipRow ? 'text-amber-400' : isPremRow ? 'text-cyan-400' : 'text-stone-500'}`}>{rowLetter}</span>
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex flex-wrap gap-4 mt-3 pt-3 border-t border-stone-800 text-[10px] font-mono text-stone-500">
                      <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-amber-500 border border-amber-400 block"/> VIP (active)</span>
                      <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-cyan-500 border border-cyan-400 block"/> Premium (active)</span>
                      <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-stone-300 border border-stone-200 block"/> Regular (active)</span>
                      <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-stone-900 border border-stone-700 block"/> Inactive/Aisle</span>
                    </div>
                  </div>

                  <div className="text-[10px] font-mono text-stone-500 bg-stone-950/50 p-3 rounded-xl border border-stone-800">
                    <span className="text-amber-400 font-bold uppercase tracking-widest block mb-1">Generated Map Schema:</span>
                    VIP Rows: {theatreForm.vipRows} rows [+50% surcharge]<br/>
                    Premium Rows: {theatreForm.premiumRows} rows [+25% surcharge]<br/>
                    Total Active Physical Seats: {(theatreForm.selectedLayoutSeats || []).length}
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditingTheatre(false)}
                    className="px-4 py-2 bg-transparent text-stone-300 hover:bg-stone-800 rounded-xl text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold rounded-xl text-sm"
                  >
                    Save Theatre
                  </button>
                </div>
              </form>
            )}

            {/* List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {theatres.map((t) => (
                <div
                  key={t.id}
                  className="p-5 bg-stone-900/40 border border-stone-830/60 rounded-2xl flex flex-col justify-between shadow-lg"
                >
                  <div className="flex flex-col gap-2">
                    <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/10 w-fit text-amber-500 mb-1">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-stone-200 text-lg leading-tight">{t.name}</h3>
                    <p className="text-xs text-stone-400">{t.location}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className="text-xs font-semibold px-2.5 py-1 bg-stone-900 rounded-md border border-stone-800 w-fit text-stone-300">
                        Screens: {t.screens}
                      </span>
                      {t.hasParking && (
                        <span className="text-xs font-semibold px-2.5 py-1 bg-amber-500/10 rounded-md border border-amber-500/20 w-fit text-amber-400">
                          🅿 Parking
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-6 pt-3 border-t border-stone-800/35 flex justify-between items-center">
                    <span className="text-[10px] text-stone-500 font-mono">ID: {t.id}</span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setViewingReviewsForTheatre(t);
                        }}
                        className="p-2 hover:bg-amber-500/10 hover:text-amber-500 rounded-lg transition-colors cursor-pointer"
                        title="View Reviews"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setTheatreForm(t);
                          setIsEditingTheatre(true);
                        }}
                        className="p-2 hover:bg-stone-800 hover:text-amber-400 rounded-lg transition-colors cursor-pointer"
                        title="Edit Theatre"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Delete complex "${t.name}"?`)) {
                            onDeleteTheatre(t.id);
                          }
                        }}
                        className="p-2 hover:bg-red-950/50 hover:text-red-400 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {theatres.length === 0 && (
                <div className="col-span-full border border-stone-835 border-dashed rounded-2xl py-16 text-center text-stone-500">
                  <Building2 className="w-8 h-8 mx-auto text-stone-600 mb-2" />
                  <span>No registered location halls yet. Add one above to load schedules.</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: SHOW MANAGEMENT */}
        {activeTab === "shows" && (
          <div className="flex flex-col gap-10 animate-fadeIn">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                <h2 className="text-3xl font-sans font-bold tracking-tight text-stone-100">
                  Show Scheduler
                </h2>
                <p className="text-stone-400 text-sm mt-1">
                  Schedule time-slots, screen rooms, ticket base pricing, and construct seat inventories.
                </p>
              </div>
              {!isEditingShow && (
                <button
                  type="button"
                  onClick={() => {
                    if (movies.length === 0 || theatres.length === 0) {
                      alert(
                        "You must first seed at least 1 movie and 1 theatre location to schedule a show."
                      );
                      return;
                    }
                    setShowForm({
                      id: "",
                      movieId: movies[0].id,
                      theatreId: theatres[0].id,
                      screenNumber: 1,
                      dates: [new Date().toISOString().split("T")[0]],
                      times: ["18:30"],
                      ticketPrice: 220,
                      totalSeatsCount: 60,
                      vipRows: 2,
                      premiumRows: 2,
                    });
                    setIsEditingShow(true);
                  }}
                  className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold rounded-xl text-sm flex items-center gap-2 transition-transform hover:scale-103 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Create Show Slot
                </button>
              )}
            </div>

            {/* Create Show HUD Form */}
            {isEditingShow && (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const targetMovie = movies.find((m) => m.id === showForm.movieId);
                  const targetTheatre = theatres.find((t) => t.id === showForm.theatreId);

                  if (!targetMovie || !targetTheatre) {
                    alert("Please select a valid movie and theatre hall.");
                    return;
                  }

                  // Calculate Seat Layout — prefer theatre's saved layout if available
                  const theatreLayout = (targetTheatre as any).selectedLayoutSeats;
                  const useTheatreLayout = theatreLayout && theatreLayout.length > 0;

                  const theatreVipRows = (targetTheatre as any).vipRows ?? showForm.vipRows;
                  const theatrePremiumRows = (targetTheatre as any).premiumRows ?? showForm.premiumRows;

                  const seatNumbers: string[] = [];
                  const vipSeats: string[] = [];
                  const premiumSeats: string[] = [];
                  const regularSeats: string[] = [];
                  let total = 0; // Initialize total here

                  if (useTheatreLayout) {
                    // Use the exact seats the admin selected in the theatre layout builder
                    theatreLayout.forEach((seatId: string) => {
                      seatNumbers.push(seatId);
                      total++;
                      const rowIndex = seatId.charCodeAt(0) - 65;
                      if (rowIndex < theatreVipRows) {
                        vipSeats.push(seatId);
                      } else if (rowIndex < theatreVipRows + theatrePremiumRows) {
                        premiumSeats.push(seatId);
                      } else {
                        regularSeats.push(seatId);
                      }
                    });
                  } else {
                    // Fallback: generate seats from showForm config
                    total = showForm.totalSeatsCount;
                    const seatsPerRow = 10;
                    const totalRows = Math.ceil(total / seatsPerRow);
                    const rowLetters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
                    for (let r = 0; r < totalRows; r++) {
                      const letter = rowLetters[r] || "Z";
                      for (let s = 1; s <= seatsPerRow; s++) {
                        const num = `${letter}${s}`;
                        seatNumbers.push(num);
                        if (r < showForm.vipRows) {
                          vipSeats.push(num);
                        } else if (r < showForm.vipRows + showForm.premiumRows) {
                          premiumSeats.push(num);
                        } else {
                          regularSeats.push(num);
                        }
                      }
                    }
                  }

                  const targetMaxRows = useTheatreLayout ? (targetTheatre as any).maxRows : Math.ceil(showForm.totalSeatsCount / 10);
                  const targetMaxCols = useTheatreLayout ? (targetTheatre as any).maxCols : 10;

                  if (showForm.id) {
                    // Update - only one date/time allowed
                    const originalShow = shows.find((sh) => sh.id === showForm.id);
                    if (originalShow) {
                      await onUpdateShow({
                        ...originalShow,
                        movieId: showForm.movieId,
                        movieTitle: targetMovie.title,
                        moviePoster: targetMovie.posterUrl,
                        theatreId: showForm.theatreId,
                        theatreName: targetTheatre.name,
                        location: targetTheatre.location,
                        screenNumber: showForm.screenNumber,
                        date: showForm.dates[0],
                        time: showForm.times[0],
                        ticketPrice: showForm.ticketPrice,
                        // Update layout ONLY if booking is empty
                        ...(originalShow.bookedSeats.length === 0
                          ? {
                            totalSeats: total,
                            seatNumbers,
                            vipSeats,
                            premiumSeats,
                            regularSeats,
                            maxRows: targetMaxRows,
                            maxCols: targetMaxCols,
                          }
                          : {}),
                      });
                    }
                  } else {
                    // Create Multiple Shows
                    for (const d of showForm.dates) {
                      for (const t of showForm.times) {
                        if (!d || !t) continue;
                        await onCreateShow({
                          movieId: showForm.movieId,
                          movieTitle: targetMovie.title,
                          moviePoster: targetMovie.posterUrl,
                          theatreId: showForm.theatreId,
                          theatreName: targetTheatre.name,
                          location: targetTheatre.location,
                          screenNumber: showForm.screenNumber,
                          date: d,
                          time: t,
                          ticketPrice: showForm.ticketPrice,
                          isCancelled: false,
                          totalSeats: total,
                          seatNumbers,
                          vipSeats,
                          premiumSeats,
                          regularSeats,
                          maxRows: targetMaxRows,
                          maxCols: targetMaxCols,
                          createdAt: new Date().toISOString(),
                        });
                      }
                    }
                  }
                  setIsEditingShow(false);
                }}
                className="p-6 bg-stone-900 border border-stone-800 rounded-3xl flex flex-col gap-5 max-w-3xl shadow-2xl"
              >
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold text-amber-400">
                    {showForm.id ? "Edit Scheduled Slot" : "Create Dynamic Show Slot"}
                  </h3>
                  <span className="text-[10px] text-stone-500 font-mono tracking-wider">
                    Seat Configurator Active
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-stone-300 font-mono">Select Movie</label>
                    <select
                      value={showForm.movieId}
                      onChange={(e) => setShowForm({ ...showForm, movieId: e.target.value })}
                      className="px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-stone-200 text-sm outline-none"
                    >
                      {movies.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.title} ({m.language})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-stone-300 font-mono">Select Location Theatre</label>
                    <select
                      value={showForm.theatreId}
                      onChange={(e) => setShowForm({ ...showForm, theatreId: e.target.value })}
                      className="px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-stone-200 text-sm outline-none"
                    >
                      {theatres.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.location})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <label className="text-xs text-stone-300">Screen ID</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={showForm.screenNumber}
                      onChange={(e) =>
                        setShowForm({ ...showForm, screenNumber: parseInt(e.target.value) || 1 })
                      }
                      className="px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 text-sm"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5 sm:col-span-4">
                    <label className="text-xs text-stone-300 flex justify-between items-center">
                      <span>Show Date(s)</span>
                      <button type="button" onClick={() => setShowForm({ ...showForm, dates: [...showForm.dates, ""] })} className="bg-[#C5A059] text-black w-4 h-4 rounded-full flex items-center justify-center font-bold text-lg leading-none hover:opacity-80">+</button>
                    </label>
                    <div className="flex flex-col gap-2">
                      {showForm.dates.map((d, index) => (
                        <div key={`date-${index}`} className="flex items-center gap-2">
                          <input
                            type="date"
                            required
                            value={d}
                            onChange={(e) => {
                              const newDates = [...showForm.dates];
                              newDates[index] = e.target.value;
                              setShowForm({ ...showForm, dates: newDates });
                            }}
                            className="flex-1 px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 text-sm"
                          />
                          {showForm.dates.length > 1 && (
                            <button type="button" onClick={() => {
                              const newDates = showForm.dates.filter((_, i) => i !== index);
                              setShowForm({ ...showForm, dates: newDates });
                            }} className="text-red-500 hover:text-red-400 p-1">
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5 sm:col-span-4">
                    <label className="text-xs text-stone-300 flex justify-between items-center">
                      <span>Show Time(s)</span>
                      <button type="button" onClick={() => setShowForm({ ...showForm, times: [...showForm.times, "18:30"] })} className="bg-[#C5A059] text-black w-4 h-4 rounded-full flex items-center justify-center font-bold text-lg leading-none hover:opacity-80">+</button>
                    </label>
                    <div className="flex flex-col gap-2">
                      {showForm.times.map((t, index) => (
                        <div key={`time-${index}`} className="flex items-center gap-2">
                          {(() => {
                            const parts = t.split(":");
                            let rawHour = parseInt(parts[0], 10);
                            if (isNaN(rawHour)) rawHour = 18;
                            const min = parts[1] || "30";
                            
                            let displayHour = 12;
                            let period = "PM";
                            period = rawHour >= 12 ? "PM" : "AM";
                            displayHour = rawHour % 12;
                            if (displayHour === 0) displayHour = 12;
                            
                            const handleHourChange = (newHr: number) => {
                              let newRawHour = newHr;
                              if (period === "PM" && newHr !== 12) {
                                newRawHour = newHr + 12;
                              } else if (period === "AM" && newHr === 12) {
                                newRawHour = 0;
                              }
                              const hourStr = newRawHour.toString().padStart(2, "0");
                              const newTimes = [...showForm.times];
                              newTimes[index] = `${hourStr}:${min}`;
                              setShowForm({ ...showForm, times: newTimes });
                            };

                            const handleMinuteChange = (newMin: string) => {
                              const hourStr = rawHour.toString().padStart(2, "0");
                              const newTimes = [...showForm.times];
                              newTimes[index] = `${hourStr}:${newMin}`;
                              setShowForm({ ...showForm, times: newTimes });
                            };

                            const handlePeriodChange = (newPeriod: string) => {
                              let newRawHour = displayHour;
                              if (newPeriod === "PM" && displayHour !== 12) {
                                newRawHour = displayHour + 12;
                              } else if (newPeriod === "AM" && displayHour === 12) {
                                newRawHour = 0;
                              }
                              const hourStr = newRawHour.toString().padStart(2, "0");
                              const newTimes = [...showForm.times];
                              newTimes[index] = `${hourStr}:${min}`;
                              setShowForm({ ...showForm, times: newTimes });
                            };

                            return (
                              <div className="flex gap-1.5 items-center flex-1">
                                <select
                                  value={displayHour}
                                  onChange={(e) => handleHourChange(parseInt(e.target.value, 10))}
                                  className="px-2 py-2 bg-stone-950 border border-stone-850 rounded-xl text-stone-100 text-sm outline-none flex-1 min-w-[50px]"
                                >
                                  {Array.from({ length: 12 }, (_, i) => i + 1).map((hr) => (
                                    <option key={hr} value={hr}>
                                      {hr.toString().padStart(2, "0")}
                                    </option>
                                  ))}
                                </select>
                                <span className="text-stone-500 font-bold">:</span>
                                <select
                                  value={min}
                                  onChange={(e) => handleMinuteChange(e.target.value)}
                                  className="px-2 py-2 bg-stone-950 border border-stone-850 rounded-xl text-stone-100 text-sm outline-none flex-1 min-w-[50px]"
                                >
                                  {Array.from({ length: 60 }, (_, i) => i).map((m) => {
                                    const mStr = m.toString().padStart(2, "0");
                                    return (
                                      <option key={mStr} value={mStr}>
                                        {mStr}
                                      </option>
                                    );
                                  })}
                                </select>
                                <select
                                  value={period}
                                  onChange={(e) => handlePeriodChange(e.target.value)}
                                  className="px-2 py-2 bg-stone-950 border border-stone-850 rounded-xl text-stone-100 text-sm font-bold outline-none flex-1 min-w-[65px]"
                                >
                                  <option value="AM">AM</option>
                                  <option value="PM">PM</option>
                                </select>
                              </div>
                            );
                          })()}
                          {showForm.times.length > 1 && (
                            <button type="button" onClick={() => {
                              const newTimes = showForm.times.filter((_, i) => i !== index);
                              setShowForm({ ...showForm, times: newTimes });
                            }} className="text-red-500 hover:text-red-400 p-1">
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <label className="text-xs text-stone-300">Base Price (INR)</label>
                    <input
                      type="number"
                      required
                      min={50}
                      value={showForm.ticketPrice}
                      onChange={(e) =>
                        setShowForm({ ...showForm, ticketPrice: parseInt(e.target.value) || 150 })
                      }
                      className="px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-amber-400 font-bold text-sm"
                    />
                  </div>
                </div>

                {/* SEAT CONFIGURATOR SUBSECTION */}
                <div className="p-4 bg-stone-950/80 border border-stone-800 rounded-2xl flex flex-col gap-4">
                  <div className="flex items-center gap-1.5 text-xs text-amber-500 font-bold uppercase font-mono tracking-widest border-b border-stone-800/60 pb-2">
                    <Grid className="w-4 h-4" />
                    Configure Hall Seating Inventory
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] text-stone-400 font-medium">Total Seats</label>
                      <select
                        value={showForm.totalSeatsCount}
                        onChange={(e) =>
                          setShowForm({
                            ...showForm,
                            totalSeatsCount: parseInt(e.target.value) || 60,
                          })
                        }
                        className="px-2 py-1.5 text-xs bg-stone-900 border border-stone-800 rounded-lg text-stone-200"
                        disabled={!!showForm.id && shows.find(sh => sh.id === showForm.id)?.bookedSeats.length !== 0}
                      >
                        <option value={40}>40 Seats (4 Rows)</option>
                        <option value={60}>60 Seats (6 Rows)</option>
                        <option value={80}>80 Seats (8 Rows)</option>
                        <option value={100}>100 Seats (10 Rows)</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] text-stone-400 font-medium">VIP Tier Rows</label>
                      <input
                        type="number"
                        min={0}
                        max={4}
                        value={showForm.vipRows}
                        onChange={(e) =>
                          setShowForm({
                            ...showForm,
                            vipRows: Math.min(4, parseInt(e.target.value) || 0),
                          })
                        }
                        className="px-2 py-1 bg-stone-900 border border-stone-800 rounded-lg text-stone-200 text-xs"
                        disabled={!!showForm.id && shows.find(sh => sh.id === showForm.id)?.bookedSeats.length !== 0}
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] text-stone-400 font-medium font-sans">
                        Premium Tier Rows
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={4}
                        value={showForm.premiumRows}
                        onChange={(e) =>
                          setShowForm({
                            ...showForm,
                            premiumRows: Math.min(4, parseInt(e.target.value) || 0),
                          })
                        }
                        className="px-2 py-1 bg-stone-900 border border-stone-800 rounded-lg text-stone-200 text-xs"
                        disabled={!!showForm.id && shows.find(sh => sh.id === showForm.id)?.bookedSeats.length !== 0}
                      />
                    </div>
                  </div>

                  {!!showForm.id && shows.find(sh => sh.id === showForm.id) && (shows.find(sh => sh.id === showForm.id)?.bookedSeats.length || 0) > 0 && (
                    <span className="text-[10px] text-amber-500 italic">
                      * Seats cannot be altered after user bookings take place to protect seat integrity.
                    </span>
                  )}
                  <div className="text-[11px] text-stone-500 font-mono leading-relaxed bg-stone-900/60 p-2.5 rounded-xl">
                    <span className="text-amber-400 font-semibold uppercase block mb-1">Generated Map Schema:</span>
                    VIP Rows (A-B): {showForm.vipRows * 10} seats [+50% Premium surcharge] <br />
                    Premium Rows (C-D): {showForm.premiumRows * 10} seats [+25% Premium surcharge]<br />
                    Regular Rows (E+): {Math.max(0, showForm.totalSeatsCount - (showForm.vipRows + showForm.premiumRows) * 10)} seats [Standard base rate]
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditingShow(false)}
                    className="px-4 py-2 bg-transparent text-stone-400 hover:bg-stone-800 rounded-xl text-sm cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold rounded-xl text-sm cursor-pointer"
                  >
                    Confirm Slots
                  </button>
                </div>
              </form>
            )}

            {/* List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {groupedShows.map((showGroup) => {
                const totalBooked = showGroup.groupedIds.reduce((acc, id) => {
                  const s = shows.find(sh => sh.id === id);
                  return acc + (s ? s.bookedSeats.length : 0);
                }, 0);
                const totalCapacity = showGroup.totalSeats * showGroup.groupedIds.length;

                return (
                  <div
                    key={showGroup.id}
                    className={`p-5 bg-stone-900/40 border rounded-2xl flex flex-col justify-between shadow-xl ${showGroup.isCancelled ? "border-red-500/20 opacity-75" : "border-stone-800"
                      }`}
                  >
                    <div className="flex flex-col gap-3">
                      <div className="flex justify-between items-start">
                        <span
                          className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full font-mono ${showGroup.isCancelled
                              ? "bg-red-500/20 text-red-400 border border-red-500/10"
                              : "bg-amber-500/15 text-amber-400 border border-amber-500/10"
                            }`}
                        >
                          {showGroup.isCancelled ? "Cancelled Show" : "Active Scheduled"}
                        </span>
                        <span className="text-sm font-semibold text-amber-400 font-mono">
                          {formatCurrency(showGroup.ticketPrice)}
                        </span>
                      </div>

                      <div>
                        <h3 className="font-bold text-stone-100 text-lg leading-tight truncate">
                          {showGroup.movieTitle}
                        </h3>
                        <p className="text-xs text-stone-400 font-medium flex items-center gap-1.5 mt-1.5">
                          <Building2 className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                          {showGroup.theatreName} (Sc {showGroup.screenNumber})
                        </p>
                      </div>

                      <div className="bg-stone-950/60 p-2.5 rounded-xl border border-stone-900 text-xs font-mono flex flex-col gap-2">
                        <div>
                          <span className="text-stone-500 block text-[10px]">Dates</span>
                          <span className="text-stone-300">{showGroup.allDatesArr.join(", ")}</span>
                        </div>
                        <div>
                          <span className="text-stone-500 block text-[10px]">Times</span>
                          <span className="text-stone-300">{showGroup.allTimesArr.map(formatTime12h).join(", ")}</span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center bg-stone-900 p-2.5 rounded-xl text-xs">
                        <span className="text-stone-400 font-mono">
                          Booked: {totalBooked} / {totalCapacity} seats
                        </span>
                        <div className="w-16 bg-stone-950 h-2 rounded-full overflow-hidden border border-stone-800">
                          <div
                            className="bg-amber-500 h-full"
                            style={{
                              width: `${Math.min(
                                100,
                                (totalBooked / totalCapacity) * 100
                              )}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 pt-3 border-t border-stone-800/35 flex justify-between items-center">
                      <span className="text-[10px] text-stone-500 font-mono truncate mr-2" title={showGroup.groupedIds.join(", ")}>Ref: {showGroup.id} (+{showGroup.groupedIds.length - 1})</span>
                      <div className="flex gap-1.5">
                        {!showGroup.isCancelled && (
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm("Are you sure you want to CANCEL this group of shows? Standard bookings remain but seat sells freeze.")) {
                                showGroup.groupedIds.forEach(id => onCancelShow(id));
                              }
                            }}
                            className="px-2 py-1 bg-transparent hover:bg-red-950/40 border border-stone-800 hover:border-red-500/20 text-red-400 rounded-lg text-xs font-semibold cursor-pointer"
                          >
                            Cancel Shows
                          </button>
                        )}
                        {/* Editing a group of shows with potentially different dates/times is complex, so we limit editing to deleting and recreating for groups, or just edit the first one's base properties */}
                        <button
                          type="button"
                          onClick={() => {
                            setShowForm({
                              id: showGroup.id,
                              movieId: showGroup.movieId,
                              theatreId: showGroup.theatreId,
                              screenNumber: showGroup.screenNumber,
                              dates: [showGroup.date],
                              times: [showGroup.time],
                              ticketPrice: showGroup.ticketPrice,
                              totalSeatsCount: showGroup.totalSeats,
                              // rows are estimated
                              vipRows: Math.ceil(showGroup.vipSeats.length / 10),
                              premiumRows: Math.ceil(showGroup.premiumSeats.length / 10),
                            });
                            setIsEditingShow(true);
                          }}
                          className="p-1.5 hover:bg-stone-800 text-stone-300 hover:text-amber-400 rounded-lg transition-colors cursor-pointer"
                          title="Update details (First show only)"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Delete ${showGroup.groupedIds.length} scheduled show(s) for "${showGroup.movieTitle}"?`)) {
                              showGroup.groupedIds.forEach(id => onDeleteShow(id));
                            }
                          }}
                          className="p-1.5 hover:bg-red-950/40 text-stone-300 hover:text-red-400 rounded-lg transition-colors cursor-pointer"
                          title="Delete All Shows in Group"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}

              {groupedShows.length === 0 && (
                <div className="col-span-full border border-stone-840 border-dashed rounded-3xl py-16 text-center text-stone-500">
                  <CalendarDays className="w-8 h-8 mx-auto text-stone-600 mb-2 animate-pulse" />
                  <span>No scheduled movie shows in database. Create one above to load listings.</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 5: BOOKING LOGS */}
        {activeTab === "bookings" && (
          <div className="flex flex-col gap-8 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div>
                <h2 className="text-3xl font-sans font-bold tracking-tight text-stone-100">
                  Audited Booking Logs
                </h2>
                <p className="text-stone-400 text-sm mt-1">
                  A robust list of customer seat payments, tickets generated, and cancel transactions.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowWaitingQueueModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 hover:border-amber-500/60 text-amber-400 font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shrink-0 shadow-[0_0_15px_rgba(245,158,11,0.08)]"
              >
                <ListOrdered className="w-4 h-4" />
                Waiting Queue Details
                {waitingQueueEntries.length > 0 && (
                  <span className="ml-1 bg-amber-500 text-stone-900 text-[10px] font-black px-1.5 py-0.5 rounded-full">
                    {waitingQueueEntries.length}
                  </span>
                )}
              </button>
            </div>

            <div className="bg-stone-900/10 border border-stone-800/80 rounded-2xl overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-stone-900 border-b border-stone-800/80 text-stone-400 font-mono text-xs uppercase tracking-wider">
                      <th className="py-4 px-5">Booking ID</th>
                      <th className="py-4 px-5">Viewer User</th>
                      <th className="py-4 px-5">Cinematic / Halle</th>
                      <th className="py-4 px-5">Time Slot</th>
                      <th className="py-4 px-5">Reserved Seats</th>
                      <th className="py-4 px-5 text-right">Sum Total</th>
                      <th className="py-4 px-5 text-center">Payment</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-800 pb-4">
                    {bookings.map((booking) => (
                      <tr
                        key={booking.id}
                        className={`hover:bg-stone-900/30 transition-colors ${booking.isCancelled ? "opacity-60 bg-red-950/5" : ""
                          }`}
                      >
                        <td className="py-4 px-5 font-mono text-xs text-amber-500 font-semibold select-all">
                          {booking.id}
                        </td>
                        <td className="py-4 px-5">
                          <p className="font-semibold text-stone-200">{booking.userName}</p>
                          <p className="text-[10px] text-stone-500 font-mono">{booking.userEmail}</p>
                        </td>
                        <td className="py-4 px-5">
                          <p className="text-stone-200 font-medium">{booking.movieTitle}</p>
                          <p className="text-xs text-stone-400 flex items-center gap-1.5 mt-0.5">
                            <Building2 className="w-3 h-3 text-stone-500" />
                            {booking.theatreName} (Sc {booking.screenNumber})
                          </p>
                        </td>
                        <td className="py-4 px-5 text-stone-300 font-mono text-xs">
                          {booking.showDate} <br />
                          {formatTime12h(booking.showTime)}
                        </td>
                        <td className="py-4 px-5">
                          <div className="flex flex-wrap gap-1">
                            {booking.seatNumbers.map((sn) => (
                              <span
                                key={sn}
                                className="px-1.5 py-0.5 bg-stone-900 text-amber-500 font-bold border border-amber-500/10 rounded text-[10.5px] font-mono"
                              >
                                {sn}
                              </span>
                            ))}
                          </div>
                          <span className="text-[10px] text-stone-500 block mt-1 font-mono">
                            Count: {booking.ticketCount}
                          </span>
                        </td>
                        <td className="py-4 px-5 text-right text-stone-100 font-bold font-mono">
                          {formatCurrency(booking.totalAmount)}
                        </td>
                        <td className="py-4 px-5 text-center">
                          <span
                            className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold font-mono border ${booking.isCancelled
                                ? "bg-red-950/20 text-red-400 border-red-500/20"
                                : booking.paymentStatus === "Success"
                                  ? "bg-stone-900 text-amber-400 border-amber-500/30 glow-gold"
                                  : "bg-yellow-950/20 text-yellow-500 border-yellow-500/20"
                              }`}
                          >
                            {booking.isCancelled ? "CANCELLED" : booking.paymentStatus}
                          </span>
                        </td>
                      </tr>
                    ))}

                    {bookings.length === 0 && (
                      <tr>
                        <td
                          colSpan={7}
                          className="py-12 text-center text-stone-500 border-t border-stone-800"
                        >
                          <Receipt className="w-8 h-8 mx-auto text-stone-700 mb-2" />
                          <span>No bookings logged in database yet. Sells appear as users checkout.</span>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: FOOD COUNTER MANAGEMENT */}
        {activeTab === "food" && (
          <div className="flex flex-col gap-10 animate-fadeIn">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                <h2 className="text-3xl font-serif font-bold tracking-tight text-stone-100">
                  Food Counter Management
                </h2>
                <p className="text-stone-400 text-sm mt-1">
                  Configure menu items, prices, categories, and high-quality preview images.
                </p>
              </div>
              {!isEditingFood && (
                <button
                  type="button"
                  onClick={() => {
                    setFoodForm({
                      id: "",
                      name: "",
                      price: 120,
                      imageUrl: "",
                      category: "Popcorn",
                      theatreId: "",
                    });
                    setIsEditingFood(true);
                  }}
                  className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold rounded-xl text-sm flex items-center gap-2 transition-transform hover:scale-103 cursor-pointer shadow-lg"
                >
                  <Plus className="w-4 h-4" />
                  Add Food Item
                </button>
              )}
            </div>

            {/* Food Add/Edit Form HUD */}
            {isEditingFood && (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!foodForm.name || foodForm.price <= 0 || !foodForm.imageUrl) {
                    alert("Please provide the food item name, valid price, and image.");
                    return;
                  }
                  if (foodForm.id) {
                    await onUpdateFood(foodForm as Food);
                  } else {
                    await onAddFood(foodForm);
                  }
                  setIsEditingFood(false);
                }}
                className="p-6 bg-stone-900/50 border border-stone-800 rounded-2xl flex flex-col gap-4 relative max-w-2xl"
              >
                <h3 className="text-lg font-bold text-stone-200">
                  {foodForm.id ? "Update Food Entry" : "Add Fresh Food Entry"}
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-stone-400">Food Name</label>
                    <input
                      type="text"
                      required
                      value={foodForm.name}
                      onChange={(e) => setFoodForm({ ...foodForm, name: e.target.value })}
                      className="px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 text-sm outline-none focus:border-amber-500"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-stone-400">Price (INR)</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={foodForm.price}
                      onChange={(e) => setFoodForm({ ...foodForm, price: parseInt(e.target.value) || 0 })}
                      className="px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-amber-400 font-bold text-sm outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-stone-400">Category</label>
                    <select
                      value={foodForm.category}
                      onChange={(e) => setFoodForm({ ...foodForm, category: e.target.value })}
                      className="px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-stone-200 text-sm outline-none"
                    >
                      <option value="Popcorn">Popcorn</option>
                      <option value="Snacks">Snacks</option>
                      <option value="Beverages">Beverages</option>
                      <option value="Desserts">Desserts</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-stone-400">Assign to Theatre</label>
                    <select
                      value={foodForm.theatreId || ""}
                      onChange={(e) => setFoodForm({ ...foodForm, theatreId: e.target.value })}
                      className="px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-stone-200 text-sm outline-none"
                    >
                      <option value="">All Theatres (Global)</option>
                      {theatres.map((t) => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                    <span className="text-[10px] text-stone-500 italic">Empty = available at all theatres.</span>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs text-stone-400 font-mono">Food Image</label>
                    <div className="flex flex-row items-start gap-3">
                      {foodForm.imageUrl && (
                        <img
                          src={foodForm.imageUrl}
                          alt="Food Preview"
                          className="w-16 h-16 object-cover rounded-xl border border-stone-800 bg-stone-950 shrink-0 mt-1 animate-fadeIn"
                        />
                      )}
                      <div className="flex-1 flex flex-col gap-2">
                        <input
                          type="file"
                          onChange={(e) => handleBase64Upload(e, (url) => setFoodForm({ ...foodForm, imageUrl: url }))}
                          className="text-xs text-stone-300 bg-stone-950 p-2 rounded-xl border border-stone-800 w-full"
                        />
                        <span className="text-[10px] text-stone-500 italic">OR input URL address directly:</span>
                        <input
                          type="text"
                          placeholder="https://images.unsplash.com/..."
                          value={foodForm.imageUrl}
                          onChange={(e) => setFoodForm({ ...foodForm, imageUrl: e.target.value })}
                          className="px-3 py-2 text-xs bg-stone-950 border border-stone-830 rounded-xl outline-none w-full"
                        />
                      </div>
                    </div>
                  </div>
                </div>


                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditingFood(false)}
                    className="px-4 py-2 bg-transparent text-stone-300 hover:bg-stone-800 rounded-xl text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold rounded-xl text-sm"
                  >
                    Save Item
                  </button>
                </div>
              </form>
            )}

            {/* Food Grid Collection List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {foods && foods.map((food) => (
                <div
                  key={food.id}
                  className="bg-stone-900/40 border border-stone-800/80 rounded-2xl overflow-hidden p-4 flex flex-col justify-between"
                >
                  <div className="flex gap-4">
                    <img
                      src={food.imageUrl}
                      alt={food.name}
                      className="w-20 h-20 object-cover rounded-xl shrink-0 bg-stone-950 animate-fadeIn"
                      referrerPolicy="no-referrer"
                    />
                    <div className="flex-1 overflow-hidden">
                      <h3 className="font-bold text-stone-200 tracking-tight text-lg truncate">
                        {food.name}
                      </h3>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        <span className="text-[10px] font-mono tracking-wide px-2 py-0.5 bg-stone-950/80 text-amber-500 border border-amber-500/10 rounded-full">
                          {food.category}
                        </span>
                        <span className="text-sm font-semibold text-amber-400 font-mono mt-1 block">
                          {formatCurrency(food.price)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-stone-800/30 flex justify-between items-center">
                    <span className="text-[10.5px] text-stone-500 font-mono select-none">
                      ID: {food.id}
                    </span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setFoodForm(food);
                          setIsEditingFood(true);
                        }}
                        className="p-2 hover:bg-stone-800 hover:text-amber-400 rounded-lg transition-colors cursor-pointer"
                        title="Update details"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Delete Food Item "${food.name}"?`)) {
                            onDeleteFood(food.id);
                          }
                        }}
                        className="p-2 hover:bg-red-950/55 hover:text-red-400 rounded-lg transition-colors cursor-pointer"
                        title="Delete Food Item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {(!foods || foods.length === 0) && (
                <div className="col-span-full border border-stone-830 border-dashed rounded-2xl py-16 text-center text-stone-500">
                  <UtensilsCrossed className="w-8 h-8 mx-auto text-stone-600 mb-2" />
                  <span>No food items loaded. Add one to show in Food Counter catalog.</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 6: BANKING GATEWAY DETAILS */}
        {activeTab === "banking" && (

          <div className="flex flex-col gap-8 max-w-2xl animate-fadeIn">
            <div>
              <h2 className="text-3xl font-sans font-bold tracking-tight text-stone-100">
                Banking Details &amp; Credentials
              </h2>
              <p className="text-stone-400 text-sm mt-1">
                Configure corporate accounts, IFSC protocols, UPI addresses and rapid QR codes representing checkout billing gates.
              </p>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                await onUpdateBanking({
                  ...bankForm,
                  updatedAt: new Date().toISOString(),
                });
              }}
              className="p-6 bg-stone-900/50 border border-stone-800 rounded-3xl flex flex-col gap-4 shadow-xl"
            >
              <div className="flex items-center gap-1.5 text-xs text-amber-500 font-bold uppercase font-mono tracking-widest border-b border-stone-800/60 pb-2">
                <Landmark className="w-4 h-4" />
                Account Gateway Credentials
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-stone-300">Account Holder Name</label>
                  <input
                    type="text"
                    required
                    value={bankForm.accountHolderName}
                    onChange={(e) => setBankForm({ ...bankForm, accountHolderName: e.target.value })}
                    className="px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 text-sm outline-none focus:border-amber-500"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-stone-300">Bank Corporate Name</label>
                  <input
                    type="text"
                    required
                    value={bankForm.bankName}
                    onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })}
                    className="px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 text-sm outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-stone-300">Account Bank Number</label>
                  <input
                    type="text"
                    required
                    value={bankForm.accountNumber}
                    onChange={(e) => setBankForm({ ...bankForm, accountNumber: e.target.value })}
                    className="px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 text-sm outline-none focus:border-amber-500"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-stone-300">IFSC Financial Code</label>
                  <input
                    type="text"
                    required
                    value={bankForm.ifscCode}
                    onChange={(e) => setBankForm({ ...bankForm, ifscCode: e.target.value })}
                    className="px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 text-sm outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-stone-300">Direct UPI ID Address (e.g. leature@ybl)</label>
                <input
                  type="text"
                  required
                  value={bankForm.upiId}
                  onChange={(e) => setBankForm({ ...bankForm, upiId: e.target.value })}
                  className="px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 text-sm outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex flex-col gap-2 bg-stone-950 border border-stone-800/80 p-4 rounded-2xl">
                <label className="text-xs text-stone-300 font-mono block">UPI QR Scan Code Image</label>
                <div className="flex flex-row items-start gap-3">
                  {bankForm.qrCodeUrl && (
                    <img
                      src={bankForm.qrCodeUrl}
                      alt="UPI QR Preview"
                      className="w-16 h-16 object-contain rounded p-1 bg-white border border-stone-800 shrink-0 mt-1 animate-fadeIn"
                    />
                  )}
                  <div className="flex-1 flex flex-col gap-2">
                    <input
                      type="file"
                      onChange={(e) => handleBase64Upload(e, (url) => setBankForm({ ...bankForm, qrCodeUrl: url }))}
                      className="text-xs text-stone-300 bg-stone-900 p-2 rounded-xl w-full"
                    />
                    <span className="text-[10px] text-stone-500 italic">OR input URL address directly:</span>
                    <input
                      type="text"
                      placeholder="https://images.unsplash.com/..."
                      value={bankForm.qrCodeUrl}
                      onChange={(e) => setBankForm({ ...bankForm, qrCodeUrl: e.target.value })}
                      className="px-3 py-2 text-xs bg-stone-900 border border-stone-800 rounded-xl outline-none w-full"
                    />
                  </div>
                </div>
              </div>


              <button
                type="submit"
                className="mt-2 w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-stone-950 font-bold rounded-xl text-sm transition-all shadow-lg flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                Commit Corporate Gateway details
              </button>
            </form>
          </div>
        )}

        {/* TAB 8: SEAT LOCKER (REAL-TIME COUNTER SALES) */}
        {activeTab === "seatLocker" && (() => {
          const activeShowObjLocker = shows.find((s) => s.id === selectedShowIdForLocker);

          const calculateSeatPriceLocker = (seatNum: string, basePrice: number) => {
            if (!activeShowObjLocker) return basePrice;
            if (activeShowObjLocker.vipSeats.includes(seatNum)) {
              return Math.round(basePrice * 1.50);
            }
            if (activeShowObjLocker.premiumSeats.includes(seatNum)) {
              return Math.round(basePrice * 1.25);
            }
            return basePrice;
          };

          const lockerSubTotal = selectedSeatsForLocker.reduce(
            (sum, seat) => sum + (activeShowObjLocker ? calculateSeatPriceLocker(seat, activeShowObjLocker.ticketPrice) : 0),
            0
          );

          const filteredShowsForLocker = shows.filter((s) => {
            if (s.isCancelled) return false;
            const matchTheatre = lockerSelectedTheatreId ? s.theatreId === lockerSelectedTheatreId : true;
            const matchQuery = lockerSearchQuery
              ? s.movieTitle.toLowerCase().includes(lockerSearchQuery.toLowerCase()) ||
              s.date.includes(lockerSearchQuery) ||
              s.time.includes(lockerSearchQuery)
              : true;
            return matchTheatre && matchQuery;
          });


          const handleLockSeats = async () => {
            if (!activeShowObjLocker) return;
            if (selectedSeatsForLocker.length === 0) {
              alert("Please select at least one seat to lock.");
              return;
            }
            setIsProcessingLocker(true);
            try {
              const totalAmount = lockerSubTotal;
              const bookingData = {
                userId: "counter_admin",
                userName: "Counter Walk-in Guest",
                userEmail: "counter@theatre.com",
                showId: activeShowObjLocker.id,
                movieId: activeShowObjLocker.movieId,
                movieTitle: activeShowObjLocker.movieTitle,
                moviePoster: activeShowObjLocker.moviePoster,
                theatreId: activeShowObjLocker.theatreId,
                theatreName: activeShowObjLocker.theatreName,
                screenNumber: activeShowObjLocker.screenNumber,
                showDate: activeShowObjLocker.date,
                showTime: activeShowObjLocker.time,
                seatNumbers: selectedSeatsForLocker,
                ticketCount: selectedSeatsForLocker.length,
                ticketPrice: activeShowObjLocker.ticketPrice,
                totalAmount,
                paymentStatus: "Success" as const,
                paymentMethod: "Cash" as const,
                qrCodeUrl: "",
                isCancelled: false,
                foodOrderItems: [],
                foodDeliveryOption: "counter" as const,
                foodDeliveryFee: 0,
              };

              await onConfirmBooking(bookingData);
              setSelectedSeatsForLocker([]);
            } catch (err: any) {
              alert(err.message || "Failed to lock seats.");
            } finally {
              setIsProcessingLocker(false);
            }
          };


          return (
            <div className="flex flex-col lg:flex-row gap-8 animate-fadeIn">
              {/* Left Column: Show Selector */}
              <div className="w-full lg:w-96 shrink-0 flex flex-col gap-4">
                <div>
                  <h2 className="text-3xl font-serif font-bold tracking-tight text-stone-100">
                    Seat Locker
                  </h2>
                  <p className="text-stone-400 text-xs mt-1">
                    Select a scheduled show to manage seating reservations directly at the counter.
                  </p>
                </div>

                {/* Filters */}
                <div className="bg-stone-900/40 p-4 border border-stone-800 rounded-2xl flex flex-col gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-stone-400 font-mono uppercase tracking-wider">
                      Filter Theatre Location
                    </label>
                    <select
                      value={lockerSelectedTheatreId}
                      onChange={(e) => {
                        setLockerSelectedTheatreId(e.target.value);
                        setSelectedShowIdForLocker("");
                        setSelectedSeatsForLocker([]);
                      }}
                      className="px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-stone-200 text-xs outline-none"
                    >
                      <option value="">All Theatres</option>
                      {theatres.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-stone-400 font-mono uppercase tracking-wider">
                      Search Show / Movie
                    </label>
                    <input
                      type="text"
                      placeholder="Search movie title, date, time..."
                      value={lockerSearchQuery}
                      onChange={(e) => setLockerSearchQuery(e.target.value)}
                      className="px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 text-xs outline-none focus:border-[#C5A059]/40"
                    />
                  </div>
                </div>

                {/* Shows list */}
                <div className="flex flex-col gap-2 max-h-[500px] overflow-y-auto pr-1 no-scrollbar">
                  {filteredShowsForLocker.map((show) => {
                    const isSelected = selectedShowIdForLocker === show.id;
                    const seatsLeft = show.totalSeats - show.bookedSeats.length;
                    return (
                      <button
                        key={show.id}
                        onClick={() => {
                          setSelectedShowIdForLocker(show.id);
                          setSelectedSeatsForLocker([]);
                        }}
                        className={`p-4 rounded-xl border text-left transition-all ${isSelected
                            ? "bg-[#C5A059]/15 border-[#C5A059] text-stone-100 shadow-[0_0_15px_rgba(197,160,89,0.15)]"
                            : "bg-stone-900/20 border-stone-800 hover:bg-stone-900/60 text-stone-300 cursor-pointer"
                          }`}
                      >
                        <h4 className="font-bold text-sm text-stone-200 leading-tight">
                          {show.movieTitle}
                        </h4>
                        <div className="flex items-center gap-1.5 mt-1.5 text-[10px] text-stone-400 font-mono">
                          <Building2 className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                          <span>
                            {show.theatreName} (Sc {show.screenNumber})
                          </span>
                        </div>
                        <div className="flex justify-between items-center mt-2.5 pt-2 border-t border-stone-800/40 text-[10px] text-stone-400">
                          <span>
                            {show.date} • {formatTime12h(show.time)}
                          </span>
                          <span className="text-amber-500 font-bold">
                            {seatsLeft} / {show.totalSeats} left
                          </span>
                        </div>
                      </button>
                    );
                  })}

                  {filteredShowsForLocker.length === 0 && (
                    <div className="py-12 text-center text-stone-600 border border-dashed border-stone-800 rounded-xl">
                      No active scheduled shows found matching the filters.
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Seat Map & Curation Form */}
              <div className="flex-1 bg-stone-900/20 border border-stone-800 rounded-3xl p-6 flex flex-col gap-6">
                {!activeShowObjLocker ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center py-24 text-stone-500">
                    <Lock className="w-12 h-12 text-stone-700 mb-3 animate-pulse" />
                    <h3 className="font-serif font-bold text-stone-400 text-lg">
                      No Show Selected
                    </h3>
                    <p className="text-xs max-w-xs mt-1">
                      Choose a cinema showtime from the left panel to display the seating grid and lock reservations.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-6 animate-fadeIn">
                    {/* Header */}
                    <div className="border-b border-stone-800/50 pb-4 flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                      <div>
                        <h3 className="text-xl font-bold text-stone-200">
                          {activeShowObjLocker.movieTitle}
                        </h3>
                        <p className="text-xs text-stone-400 mt-1">
                          {activeShowObjLocker.theatreName} • Screen {activeShowObjLocker.screenNumber} •{" "}
                          {activeShowObjLocker.date} at {formatTime12h(activeShowObjLocker.time)}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-mono tracking-widest text-stone-500 block">
                          Base Ticket Rate
                        </span>
                        <span className="text-lg font-bold text-amber-500 font-mono">
                          {formatCurrency(activeShowObjLocker.ticketPrice)}
                        </span>
                      </div>
                    </div>

                    {/* Curved Screen projection */}
                    <div className="flex flex-col items-center gap-1.5 my-4 relative">
                      <div className="w-4/5 h-8 bg-gradient-to-b from-white/10 to-transparent rounded-t-[100%] border-t-[2px] border-[#C5A059] shadow-[0_-10px_30px_rgba(197,160,89,0.15)] overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-b from-[#C5A059]/10 to-transparent blur-md"></div>
                      </div>
                      <span className="text-[9px] text-[#C5A059] uppercase tracking-[0.3em] font-mono font-bold select-none">
                        Cinema Screen Location
                      </span>
                    </div>

                    {/* Seating Grid - Exact same layout as user booking */}
                    <div className="w-full flex justify-center py-6 bg-stone-950/20 border border-stone-850/20 rounded-2xl p-4 overflow-x-auto no-scrollbar">
                      <div className="flex flex-col gap-3 min-w-[500px]">
                        {(() => {
                          // Calculate grid dimensions from actual seat IDs to preserve admin layout
                          const maxRows = activeShowObjLocker.seatNumbers.reduce(
                            (max: number, seat: string) => Math.max(max, seat.charCodeAt(0) - 64),
                            0
                          );
                          const maxCols = activeShowObjLocker.seatNumbers.reduce(
                            (max: number, seat: string) => Math.max(max, parseInt(seat.slice(1)) || 0),
                            0
                          );

                          return Array.from({ length: maxRows }).map((_, rIndex) => {
                            const rowLetter = String.fromCharCode(65 + rIndex);
                            return (
                              <div key={rowLetter} className="flex items-center gap-1.5 w-full justify-center">
                                {/* Row Label Left */}
                                <div className="w-5 text-center text-[10px] font-bold text-stone-600 font-mono select-none mr-1">
                                  {rowLetter}
                                </div>

                                {/* Seat Row */}
                                <div className="flex gap-1.5">
                                  {Array.from({ length: maxCols }).map((_, colIndex) => {
                                    const seat = `${rowLetter}${colIndex + 1}`;
                                    const exists = activeShowObjLocker.seatNumbers.includes(seat);

                                    // Empty gap for non-existent seats
                                    if (!exists) {
                                      return <div key={`gap-${seat}`} className="w-6 sm:w-7 flex-shrink-0"></div>;
                                    }

                                    const isBooked = activeShowObjLocker.bookedSeats.includes(seat);
                                    const isSelected = selectedSeatsForLocker.includes(seat);
                                    const isVIP = activeShowObjLocker.vipSeats.includes(seat);
                                    const isPREM = activeShowObjLocker.premiumSeats.includes(seat);

                                    const borderStyle = isVIP
                                      ? "border-amber-500/50"
                                      : isPREM
                                        ? "border-cyan-500/30"
                                        : "border-stone-800";

                                    return (
                                      <button
                                        key={seat}
                                        onClick={() => {
                                          if (isBooked) return;
                                          if (isSelected) {
                                            setSelectedSeatsForLocker(
                                              selectedSeatsForLocker.filter((s) => s !== seat)
                                            );
                                          } else {
                                            setSelectedSeatsForLocker([...selectedSeatsForLocker, seat]);
                                          }
                                        }}
                                        className={`relative aspect-square w-6 sm:w-7 rounded-t-lg rounded-b-xs border text-[9px] font-bold font-mono transition-all flex items-center justify-center cursor-pointer select-none group overflow-hidden ${borderStyle} ${isBooked
                                          ? "bg-stone-900/60 text-stone-600 cursor-not-allowed border-stone-800 opacity-60"
                                          : isSelected
                                            ? "bg-gradient-to-b from-[#F1D299] to-[#C5A059] text-stone-950 border-[#C5A059] shadow-[0_0_10px_rgba(197,160,89,0.3)]"
                                            : isVIP
                                              ? "bg-stone-900 border-[#C5A059] text-white hover:bg-[#C5A059]/20"
                                              : isPREM
                                                ? "bg-stone-900 border-[#C5A059]/40 text-[#F1D299] hover:bg-[#C5A059]/15"
                                                : "bg-stone-950 text-stone-400 hover:bg-white/10 hover:border-stone-600"
                                        }`}
                                        title={`${seat} - ${isVIP ? "VIP (+50%)" : isPREM ? "Premium (+25%)" : "Standard"}`}
                                      >
                                        {isBooked ? (
                                          <Lock className="w-2.5 h-2.5 text-stone-600" />
                                        ) : (
                                          <span>{colIndex + 1}</span>
                                        )}
                                        <div
                                          className={`absolute bottom-0 w-full h-[2.5px] rounded-t-xs opacity-45 ${isSelected ? "bg-black/20" : "bg-white/10"}`}
                                        ></div>
                                      </button>
                                    );
                                  })}
                                </div>

                                {/* Row Label Right */}
                                <div className="w-5 text-center text-[10px] font-bold text-stone-600 font-mono select-none ml-1">
                                  {rowLetter}
                                </div>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </div>

                    {/* Color Legend */}
                    <div className="flex flex-wrap justify-between items-center gap-4 bg-stone-950/40 p-3.5 rounded-xl border border-stone-850/50 text-[11px] font-mono text-stone-400">
                      <div className="flex flex-wrap gap-4">
                        <span className="flex items-center gap-1.5">
                          <span className="w-3 h-3 rounded bg-amber-500 border border-amber-500 block" /> Selected
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="w-3 h-3 rounded bg-stone-900/60 border border-stone-800 flex items-center justify-center text-stone-600 text-[8px]" >
                            <Lock className="w-2 h-2" />
                          </span> Booked/Locked
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="w-3 h-3 rounded bg-stone-900 border border-amber-400 block" /> VIP (1.5x)
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="w-3 h-3 rounded bg-stone-900 border border-cyan-400 block" /> Premium (1.25x)
                        </span>
                      </div>
                      <div>
                        Selected:{" "}
                        <span className="text-[#C5A059] font-bold font-sans">
                          {selectedSeatsForLocker.length > 0 ? selectedSeatsForLocker.join(", ") : "None"}
                        </span>
                      </div>
                    </div>

                    {/* Lock details & Reservation Form */}
                    {selectedSeatsForLocker.length > 0 && (
                      <div className="bg-stone-900/50 p-6 rounded-2xl border border-stone-800 flex flex-col md:flex-row gap-6 justify-between items-start animate-fadeIn">
                        {/* Summary */}
                        <div className="flex-1 flex flex-col gap-2.5">
                          <h4 className="text-sm font-bold text-[#F1D299] uppercase font-mono tracking-wider">
                            Counter Reservation Summary
                          </h4>
                          <div className="text-xs text-stone-300 font-mono flex flex-col gap-1.5">
                            <div>
                              Seats Selected:{" "}
                              <span className="text-amber-500 font-bold">{selectedSeatsForLocker.join(", ")}</span>{" "}
                              ({selectedSeatsForLocker.length} tickets)
                            </div>
                            <div className="text-[10px] text-stone-400 leading-relaxed">
                              VIP Seats: {selectedSeatsForLocker.filter(s => activeShowObjLocker.vipSeats.includes(s)).length} tickets • Premium Seats: {selectedSeatsForLocker.filter(s => activeShowObjLocker.premiumSeats.includes(s)).length} tickets
                            </div>
                            <div className="text-base font-bold text-white border-t border-stone-800/40 pt-2 mt-1 flex justify-between items-center max-w-xs">
                              <span>Total Counter Fee:</span>
                              <span className="text-[#C5A059]">{formatCurrency(lockerSubTotal)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Action Button */}
                        <div className="w-full md:w-80 shrink-0 flex flex-col justify-center gap-2">
                          <button
                            type="button"
                            disabled={isProcessingLocker}
                            onClick={handleLockSeats}
                            className="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 disabled:opacity-50 text-stone-950 font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                          >
                            {isProcessingLocker ? (
                              <span className="w-3.5 h-3.5 border-2 border-stone-950 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Lock className="w-3.5 h-3.5" />
                            )}
                            Lock &amp; Reserve Seats
                          </button>
                        </div>
                      </div>
                    )}

                  </div>
                )}
              </div>
            </div>
          );
        })()}
        {/* TAB: LOST & FOUND */}
        {activeTab === "lostFound" && (
          <div className="flex flex-col gap-8 animate-fadeIn">
            <div>
              <h2 className="text-3xl font-sans font-bold tracking-tight text-stone-100 flex items-center gap-2">
                <HelpCircle className="w-6 h-6 text-[#C5A059]" />
                Lost & Found Registry
              </h2>
              <p className="text-stone-400 text-sm mt-1">
                Manage user reports of lost or found items across all theatre complexes.
              </p>
            </div>

            <div className="overflow-x-auto rounded-xl border border-stone-800 bg-stone-900/30">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-stone-950/60 text-stone-400 font-mono text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Report Info</th>
                    <th className="px-6 py-4">Theatre Location</th>
                    <th className="px-6 py-4">Item Details</th>
                    <th className="px-6 py-4">Reporter</th>
                    <th className="px-6 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800/60">
                  {lostFoundItems.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-center text-stone-500 font-mono border-dashed border border-[#C5A059]/10 bg-white/2 rounded-xl">
                        No lost or found reports logged yet.
                      </td>
                    </tr>
                  ) : (
                    lostFoundItems.map((item) => (
                      <tr key={item.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 align-top">
                          <div className="flex flex-col gap-1.5">
                            <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md w-fit border ${item.type === 'Lost' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-green-500/10 text-green-400 border-green-500/20'
                              }`}>
                              {item.type}
                            </span>
                            <span className="text-[10px] text-stone-500 font-mono mt-1">{new Date(item.createdAt).toLocaleString()}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 align-top">
                          <span className="font-bold text-stone-300 block">{item.theatreName}</span>
                          <span className="text-xs text-stone-500">{item.location}</span>
                          <span className="text-xs text-stone-500 block">At: {item.date} {formatTime12h(item.time)}</span>
                        </td>
                        <td className="px-6 py-4 align-top">
                          <span className="font-bold text-stone-200">{item.itemName}</span>
                          <div className="text-xs text-stone-400 mt-1 max-w-xs whitespace-normal line-clamp-2">
                            {item.description}
                          </div>
                          {item.imageUrl && (
                            <a href={item.imageUrl} target="_blank" rel="noreferrer" className="text-[10px] text-amber-500 hover:underline mt-1 block">
                              View Attached Image
                            </a>
                          )}
                        </td>
                        <td className="px-6 py-4 align-top">
                          <span className="font-bold text-stone-300 block">{item.userName}</span>
                          <span className="text-xs text-stone-500">{item.userEmail}</span>
                        </td>
                        <td className="px-6 py-4 align-top">
                          <select
                            value={item.status}
                            onChange={(e) => onUpdateLostFoundStatus && onUpdateLostFoundStatus(item.id, e.target.value)}
                            className={`text-xs px-3 py-1.5 rounded-lg border outline-none font-bold tracking-wider uppercase transition-colors cursor-pointer ${item.status === 'Pending' ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' :
                                item.status === 'Under Review' ? 'bg-purple-500/10 border-purple-500/30 text-purple-400' :
                                  item.status === 'Found' ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' :
                                    item.status === 'Returned' ? 'bg-green-500/10 border-green-500/30 text-green-500' :
                                      'bg-stone-800 border-stone-700 text-stone-400'
                              }`}
                          >
                            <option value="Pending" className="bg-stone-900 text-stone-200">Pending</option>
                            <option value="Under Review" className="bg-stone-900 text-stone-200">Under Review</option>
                            <option value="Found" className="bg-stone-900 text-stone-200">Found</option>
                            <option value="Returned" className="bg-stone-900 text-stone-200">Returned</option>
                            <option value="Closed" className="bg-stone-900 text-stone-200">Closed</option>
                          </select>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* MODAL FOR WAITING QUEUE */}
        {showWaitingQueueModal && (
          <AdminWaitingQueueModal
            entries={waitingQueueEntries}
            loading={waitingQueueLoading}
            onClose={() => setShowWaitingQueueModal(false)}
            onRefresh={fetchWaitingQueueEntries}
          />
        )}

        {/* MODAL FOR THEATRE REVIEWS */}
        {viewingReviewsForTheatre && (
          <AdminTheatreReviewsModal
            theatre={viewingReviewsForTheatre}
            onClose={() => setViewingReviewsForTheatre(null)}
          />
        )}
      </div>
    </div>
  );
}

// Add the AdminTheatreReviewsModal component at the end
function AdminTheatreReviewsModal({ theatre, onClose }: { theatre: Theatre; onClose: () => void }) {
  const [reviews, setReviews] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetchReviews();
  }, [theatre.id]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const res = await fetch(`http://localhost:5000/api/reviews/${theatre.id}`, {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setReviews(data.reviews);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#0a0a0a] border border-stone-800 w-full max-w-4xl max-h-[85vh] rounded-2xl flex flex-col shadow-2xl overflow-hidden animate-scaleIn">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/5 bg-stone-900/30">
          <div>
            <h3 className="font-bold text-lg text-stone-100 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-[#C5A059]" />
              Reviews for {theatre.name}
            </h3>
            <p className="text-xs text-stone-400 font-mono mt-0.5">{theatre.location}</p>
          </div>
          <button onClick={onClose} className="p-2 text-stone-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 no-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {loading ? (
              <p className="text-stone-500 font-mono text-sm col-span-full">Loading reviews...</p>
            ) : reviews.length === 0 ? (
              <p className="text-stone-500 font-mono text-sm col-span-full">No feedback yet for this theatre.</p>
            ) : (
              reviews.map((rev) => (
                <div key={rev.id} className="bg-stone-900/40 border border-stone-800 rounded-xl p-4 flex flex-col gap-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-stone-200 text-sm">{rev.userName}</h4>
                      <span className="text-[9px] text-stone-500 font-mono">User ID: {rev.userId}</span>
                    </div>
                    <div className="flex items-center gap-1 bg-[#C5A059]/10 px-2 py-1 rounded border border-[#C5A059]/20">
                      <Star className="w-3 h-3 text-[#C5A059] fill-[#C5A059]" />
                      <span className="text-xs font-bold text-[#C5A059]">{rev.rating}.0</span>
                    </div>
                  </div>
                  <p className="text-xs text-stone-300 italic">"{rev.comment}"</p>
                  <div className="mt-auto pt-3 border-t border-white/5 flex justify-end text-[9px] text-stone-500 font-mono uppercase">
                    <span>{new Date(rev.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Add the AdminWaitingQueueModal component at the end
function AdminWaitingQueueModal({ entries, loading, onClose, onRefresh }: { entries: any[]; loading: boolean; onClose: () => void; onRefresh: () => void }) {
  // Group entries by showId
  const groupedEntries = React.useMemo(() => {
    const map = new Map<string, any>();
    entries.forEach(entry => {
      const key = entry.showId;
      if (!map.has(key)) {
        map.set(key, {
          showId: entry.showId,
          movieTitle: entry.movieTitle,
          theatreName: entry.theatreName,
          showTime: entry.showTime,
          users: []
        });
      }
      map.get(key)!.users.push(entry);
    });
    return Array.from(map.values());
  }, [entries]);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#0a0a0a] border border-stone-800 w-full max-w-5xl max-h-[85vh] rounded-2xl flex flex-col shadow-2xl overflow-hidden animate-scaleIn">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/5 bg-stone-900/30">
          <div>
            <h3 className="font-bold text-xl text-stone-100 flex items-center gap-2">
              <ListOrdered className="w-5 h-5 text-amber-500" />
              Active Waiting Queue
              {!loading && (
                <span className="ml-2 bg-amber-500/20 text-amber-500 text-xs font-black px-2 py-0.5 rounded-full border border-amber-500/30">
                  {entries.length} Total Users Waiting
                </span>
              )}
            </h3>
            <p className="text-xs text-stone-400 font-mono mt-1">
              Users waiting for cancellations on fully booked shows.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={onRefresh} 
              disabled={loading}
              className={`p-2 text-stone-300 hover:text-amber-400 bg-stone-900 hover:bg-stone-800 border border-stone-800 rounded-xl transition-all flex items-center gap-2 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="text-xs font-bold uppercase tracking-wider hidden sm:block">Refresh</span>
            </button>
            <button onClick={onClose} className="p-2 text-stone-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 no-scrollbar bg-stone-950/50">
          <div className="flex flex-col gap-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 text-stone-500 gap-3">
                <RefreshCw className="w-8 h-8 animate-spin text-stone-700" />
                <p className="font-mono text-sm uppercase tracking-widest">Loading Queue Details...</p>
              </div>
            ) : entries.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-stone-500 gap-3 border border-stone-800/50 border-dashed rounded-2xl">
                <Clock className="w-8 h-8 text-stone-700" />
                <p className="font-mono text-sm uppercase tracking-widest">The Waiting Queue is currently empty.</p>
              </div>
            ) : (
              groupedEntries.map((group) => (
                <div key={group.showId} className="bg-stone-900/60 border border-stone-800 rounded-2xl overflow-hidden flex flex-col shadow-lg">
                  {/* Show Header */}
                  <div className="bg-stone-900 px-5 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-stone-800/60">
                    <div>
                      <h4 className="font-bold text-stone-100 text-lg flex items-center gap-2">
                        <Film className="w-4 h-4 text-amber-500" />
                        {group.movieTitle}
                      </h4>
                      <p className="text-xs text-stone-400 font-medium flex items-center gap-1.5 mt-1">
                        <Building2 className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                        {group.theatreName} <span className="text-stone-600 px-1">•</span> {new Date(group.showTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                      </p>
                    </div>
                    <div className="bg-stone-950 px-3 py-1.5 rounded-lg border border-stone-800">
                      <span className="text-xs text-stone-400 font-mono">
                        <span className="text-amber-500 font-bold text-sm">{group.users.length}</span> waiting
                      </span>
                    </div>
                  </div>

                  {/* Users List for this show */}
                  <div className="p-1">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-sm">
                        <thead>
                          <tr className="bg-stone-900/40 text-stone-400 font-mono text-[10px] uppercase tracking-wider">
                            <th className="py-2.5 px-4 font-semibold">User</th>
                            <th className="py-2.5 px-4 font-semibold">Contact</th>
                            <th className="py-2.5 px-4 font-semibold">Seats Requested</th>
                            <th className="py-2.5 px-4 font-semibold text-right">Joined At</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-800/60">
                          {group.users.map((user: any) => (
                            <tr key={user.id} className="hover:bg-stone-800/30 transition-colors">
                              <td className="py-3 px-4">
                                <p className="font-semibold text-stone-200 text-sm">{user.userName}</p>
                                <p className="text-[9px] text-stone-500 font-mono mt-0.5 truncate max-w-[120px]" title={user.userId}>ID: {user.userId}</p>
                              </td>
                              <td className="py-3 px-4">
                                <p className="text-xs text-stone-300 font-mono">{user.userEmail}</p>
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex flex-wrap gap-1">
                                  {user.seatsRequested.map((sn: string) => (
                                    <span key={sn} className="px-1.5 py-0.5 bg-stone-950 text-amber-500/80 font-bold border border-amber-500/10 rounded text-[10px] font-mono">
                                      {sn}
                                    </span>
                                  ))}
                                </div>
                                <span className="text-[9px] text-stone-500 block mt-1 flex items-center gap-1">
                                  <Users className="w-2.5 h-2.5" />
                                  Count: {user.seatsRequested.length}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right">
                                <p className="text-xs text-stone-400 font-mono">
                                  {new Date(user.createdAt).toLocaleDateString()}
                                </p>
                                <p className="text-[10px] text-stone-500 font-mono mt-0.5">
                                  {new Date(user.createdAt).toLocaleTimeString([], { timeStyle: 'short' })}
                                </p>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
