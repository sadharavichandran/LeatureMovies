import { useState, useEffect, useMemo } from "react";
import { authService, movieService, theatreService, showService, bookingService, foodService, lostFoundService, waitingQueueService } from "./services/api";
import { socketService } from "./services/socket";
import { Movie, Theatre, Show, Booking, BankingDetails, UserProfile, Food } from "./types";
import { generateRandomId, formatCurrency } from "./utils";

import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Footer from "./components/Footer";
import AuthModal from "./components/AuthModal";
import BookingFlow from "./components/BookingFlow";
import UserPanel from "./components/UserPanel";
import AdminPanel from "./components/AdminPanel";
import MoviesCatalog from "./components/MoviesCatalog";
import ToastContainer, { ToastMessage, ToastType } from "./components/Toast";
import ReportLostFoundModal from "./components/ReportLostFoundModal";
import LostFoundStatusPage from "./components/LostFoundStatusPage";
import RatingsReviewsModal from "./components/RatingsReviewsModal";
import TheatreFeedbackModal from "./components/TheatreFeedbackModal";

import WatchRoom from "./components/WatchRoom";

import { Film, Building2, MapPin, Search, Star, CalendarDays, X, HelpCircle, MessageSquare, PlaySquare, Users } from "lucide-react";

export default function App() {
  // Navigation states: 'home' | 'admin' | 'user' | 'user-lostfound' | 'theatres' | 'watch-room'
  const [currentView, setCurrentView] = useState<"home" | "admin" | "user" | "user-lostfound" | "theatres" | "watch-room">("home");
  const [watchRoomId, setWatchRoomId] = useState<string | null>(null);
  const [selectedTheatreForMap, setSelectedTheatreForMap] = useState<Theatre | null>(null);
  const [reportingTheatre, setReportingTheatre] = useState<Theatre | null>(null);

  // Core Data Collections
  const [movies, setMovies] = useState<Movie[]>([]);
  const [theatres, setTheatres] = useState<Theatre[]>([]);
  const [shows, setShows] = useState<Show[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bankingDetails, setBankingDetails] = useState<BankingDetails | null>(null);
  const [usersCount, setUsersCount] = useState(4); // Default estimation fallback
  const [foods, setFoods] = useState<Food[]>([]);
  const [lostFoundItems, setLostFoundItems] = useState<any[]>([]);

  const [currentTime, setCurrentTime] = useState(new Date().toISOString());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toISOString());
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  const activeShowsForUsers = useMemo(() => {
    const currentMs = new Date(currentTime).getTime();
    return shows.filter(s => {
      if (s.isCancelled) return false;
      let datePart = s.date;
      if (datePart.includes('T')) datePart = datePart.split('T')[0];
      const showDateObj = new Date(`${datePart}T${s.time}:00`);
      return showDateObj.getTime() > currentMs;
    });
  }, [shows, currentTime]);

  // Active user / admin state
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Search & Filtering Layout
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("");

  // Select flow states
  const [activeMovieForBooking, setActiveMovieForBooking] = useState<Movie | null>(null);
  const [pendingBookingMovie, setPendingBookingMovie] = useState<Movie | null>(null);

  // Review Modal State
  const [reviewMovie, setReviewMovie] = useState<Movie | null>(null);
  const [reviewTheatre, setReviewTheatre] = useState<Theatre | null>(null);

  // Authentication Modals states
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authRole, setAuthRole] = useState<"user" | "admin">("user");
  const [authIsRegister, setAuthIsRegister] = useState(false);

  // Toast Alerts States
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [waitlistEntries, setWaitlistEntries] = useState<any[]>([]);

  // Show Toast Helper
  const showToast = (message: string, type: ToastType = "success") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // --- PERSISTENCE: GET ACTIVE SESSION PROFILE ---
  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        const token = authService.getAuthToken();
        if (token) {
          const response = await authService.getProfile();
          setCurrentUser(response.user);
          showToast(`Welcome back, ${response.user.fullName}!`, "success");
        } else {
          setCurrentUser(null);
        }
      } catch (err: any) {
        console.error("Auth Session load error:", err);
        authService.logout();
        setCurrentUser(null);
      } finally {
        setAuthLoading(false);
      }
    };

    loadUserProfile();
  }, []);

  // --- PERSISTENCE: FETCH DATA FROM API ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        const moviesResponse = await movieService.getAll();
        setMovies(moviesResponse.movies || []);

        const theatresResponse = await theatreService.getAll();
        setTheatres(theatresResponse.theatres || []);

        const showsResponse = await showService.getAll();
        setShows(showsResponse.shows || []);

        const foodsResponse = await foodService.getAll();
        setFoods(foodsResponse.foods || []);

        const lfResponse = await lostFoundService.getAll();
        setLostFoundItems(lfResponse.reports || []);
      } catch (err: any) {
        console.error("Data fetch error:", err);
      }
    };

    fetchData();

    // Connect socket for real-time updates
    socketService.connect();

    if (socketService.socket) {
      socketService.socket.on('show_created', (newShow) => {
        setShows(prev => [...prev, newShow]);
      });

      socketService.socket.on('show_updated', (updatedShow) => {
        setShows(prev => prev.map(s => s.id === updatedShow.id ? updatedShow : s));
      });

      socketService.socket.on('show_deleted', (showId) => {
        setShows(prev => prev.filter(s => s.id !== showId));
      });

      socketService.socket.on('review_updated', (data) => {
        if (data.targetType === 'Movie') {
          setMovies(prev => prev.map(m => m.id === data.targetId ? { ...m, ...data.stats } : m));
        } else if (data.targetType === 'Theatre') {
          setTheatres(prev => prev.map(t => t.id === data.targetId ? { ...t, ...data.stats } : t));
        }
      });
    }

    return () => {
      if (socketService.socket) {
        socketService.socket.off('show_created');
        socketService.socket.off('show_updated');
        socketService.socket.off('show_deleted');
        socketService.socket.off('review_updated');
      }
    };
  }, []);

  // --- PERSISTENCE LOAD BOOKINGS ---
  useEffect(() => {
    if (!currentUser) {
      setBookings([]);
      return undefined;
    }

    const fetchBookings = async () => {
      try {
        const response = currentUser.role === 'admin'
          ? await bookingService.getAll()
          : await bookingService.getUserBookings();
        const list = response.bookings || [];
        list.sort((a: any, b: any) => new Date(b.bookingDate).getTime() - new Date(a.bookingDate).getTime());
        setBookings(list);
      } catch (err: any) {
        console.error("Bookings fetch error:", err);
      }
    };

    fetchBookings();

    const fetchWaitlist = async () => {
      try {
        const response = await waitingQueueService.getMyQueue();
        setWaitlistEntries(response.entries || []);
      } catch (err) {
        console.error("Waitlist load error:", err);
      }
    };
    fetchWaitlist();

    // Authenticate user for real-time bookings log
    socketService.authenticate(currentUser.id, currentUser.role);

    if (socketService.socket) {
      socketService.socket.on('waitlist_alert', async (data) => {
        alert(`🚨 ALERT: Seats ${data.releasedSeats.join(", ")} have been cancelled/released for "${data.movieTitle}" at ${data.theatreName} on ${data.showDate.split('T')[0]} at ${data.showTime}. Book now on first-come-first-serve basis!`);
        showToast(`Seats released for ${data.movieTitle}!`, "info");
        
        try {
          const showsResponse = await showService.getAll();
          setShows(showsResponse.shows || []);
          const response = await waitingQueueService.getMyQueue();
          setWaitlistEntries(response.entries || []);
        } catch (err) {
          console.error(err);
        }
      });

      socketService.socket.on('booking_created', (newBooking) => {
        setBookings(prev => [newBooking, ...prev]);
      });

      socketService.socket.on('booking_updated', (updatedBooking) => {
        setBookings(prev => prev.map(b => b.id === updatedBooking.id ? updatedBooking : b));
      });

      socketService.socket.on('booking_deleted', (bookingId) => {
        setBookings(prev => prev.filter(b => b.id !== bookingId));
      });

      socketService.socket.on('user_updated', (updatedUser) => {
        setCurrentUser(prev => prev && prev.id === updatedUser.id ? updatedUser : prev);
      });
    }

    return () => {
      if (socketService.socket) {
        socketService.socket.off('booking_created');
        socketService.socket.off('booking_updated');
        socketService.socket.off('booking_deleted');
        socketService.socket.off('user_updated');
        socketService.socket.off('waitlist_alert');
      }
    };
  }, [currentUser]);

  // --- COMPUTE LIVE FILTERS BOUNDS ---
  const { languages, genres } = useMemo(() => {
    const langs = Array.from(new Set(movies.map((m) => m.language)));
    const gens = Array.from(new Set(movies.map((m) => m.genre)));
    return { languages: langs, genres: gens };
  }, [movies]);

  // Split movies based on release Date compare => No Static Placeholders!
  const { featuredMovies, upcomingMovies } = useMemo(() => {
    const searchedAndFiltered = movies.filter((m) => {
      const matchQuery = m.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchLang = selectedLanguage ? m.language === selectedLanguage : true;
      const matchGen = selectedGenre ? m.genre === selectedGenre : true;
      return matchQuery && matchLang && matchGen;
    });

    const featured: Movie[] = [];
    const upcoming: Movie[] = [];

    searchedAndFiltered.forEach((m) => {
      // Normalize releaseDate handling so it handles legacy date strings properly 
      const parsedReleaseDate = new Date(m.releaseDate);
      const isPastRelease = !isNaN(parsedReleaseDate.getTime()) && parsedReleaseDate.toISOString() <= currentTime;
      if (isPastRelease || m.releaseDate <= currentTime) {
        featured.push(m);
      } else {
        upcoming.push(m);
      }
    });

    return { featuredMovies: featured, upcomingMovies: upcoming };
  }, [movies, searchQuery, selectedLanguage, selectedGenre, currentTime]);

  // --- AUTH OPERATIONS ---
  const handleSignOut = async () => {
    try {
      authService.logout();
      setCurrentUser(null);
      setCurrentView("home");
      showToast("Session logged out.", "info");
    } catch (err) {
      showToast("Failed to logout.", "error");
    }
  };

  // --- CONTROLLER OPERATIONS: MOVIE CURATION ---
  const handleAddMovie = async (movieData: Omit<Movie, "id">) => {
    try {
      await movieService.create(movieData);
      showToast(`Movie "${movieData.title}" added to live listings!`, "success");
      // Refresh movies
      const response = await movieService.getAll();
      setMovies(response.movies || []);
    } catch (err: any) {
      showToast(err.message || "Failed to add movie", "error");
    }
  };

  const handleUpdateMovie = async (movieData: Movie) => {
    try {
      await movieService.update(movieData.id, movieData);
      showToast(`Movie catalog entry updated.`, "success");
      // Refresh movies
      const response = await movieService.getAll();
      setMovies(response.movies || []);
    } catch (err: any) {
      showToast(err.message || "Failed to update movie", "error");
    }
  };

  const handleDeleteMovie = async (movieId: string) => {
    try {
      await movieService.delete(movieId);
      showToast("Movie listing dropped.", "success");
      // Refresh movies
      const response = await movieService.getAll();
      setMovies(response.movies || []);
    } catch (err: any) {
      showToast(err.message || "Failed to delete movie", "error");
    }
  };

  // --- CONTROLLER OPERATIONS: THEATRE REGISTRY ---
  const handleAddTheatre = async (theatreData: Omit<Theatre, "id">) => {
    try {
      await theatreService.create(theatreData);
      showToast(`Theatre complex added.`, "success");
      // Refresh theatres
      const response = await theatreService.getAll();
      setTheatres(response.theatres || []);
    } catch (err: any) {
      showToast(err.message || "Failed to add theatre", "error");
    }
  };

  const handleUpdateTheatre = async (theatreData: Theatre) => {
    try {
      await theatreService.update(theatreData.id, theatreData);
      
      // Cascade the theatre's updated layout to all existing shows for this theatre
      // This ensures that when admin edits the master theatre layout, users see the updated grid on existing unbooked slots
      const theatreShows = shows.filter(s => s.theatreId === theatreData.id);
      for (const show of theatreShows) {
        const rowLetters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        const vipSeats: string[] = [];
        const premiumSeats: string[] = [];
        const regularSeats: string[] = [];
        const seatNumbers = theatreData.selectedLayoutSeats || [];
        
        seatNumbers.forEach(num => {
          const r = rowLetters.indexOf(num.charAt(0));
          if (r < (theatreData.vipRows || 0)) {
            vipSeats.push(num);
          } else if (r < (theatreData.vipRows || 0) + (theatreData.premiumRows || 0)) {
            premiumSeats.push(num);
          } else {
            regularSeats.push(num);
          }
        });
        
        await showService.update(show.id, {
          ...show,
          seatNumbers,
          vipSeats,
          premiumSeats,
          regularSeats,
          totalSeats: seatNumbers.length,
          maxRows: theatreData.maxRows,
          maxCols: theatreData.maxCols,
          vipRows: theatreData.vipRows,
          premiumRows: theatreData.premiumRows,
        });
      }

      showToast(`Theatre complex details modified and shows synced.`, "success");
      // Refresh theatres and shows
      const response = await theatreService.getAll();
      setTheatres(response.theatres || []);
      const showsResponse = await showService.getAll();
      setShows(showsResponse.shows || []);
    } catch (err: any) {
      showToast(err.message || "Failed to update theatre", "error");
    }
  };

  const handleDeleteTheatre = async (theatreId: string) => {
    try {
      await theatreService.delete(theatreId);
      showToast("Location listing dropped.", "success");
      // Refresh theatres
      const response = await theatreService.getAll();
      setTheatres(response.theatres || []);
    } catch (err: any) {
      showToast(err.message || "Failed to delete theatre", "error");
    }
  };

  // --- CONTROLLER OPERATIONS: SHOWTIMES SCHEDULER ---
  const handleCreateShow = async (showData: Omit<Show, "id" | "bookedSeats">) => {
    try {
      await showService.create(showData);
      showToast("Show timing scheduled live!", "success");
      // Refresh shows
      const response = await showService.getAll();
      setShows(response.shows || []);
    } catch (err: any) {
      showToast(err.message || "Failed to create show", "error");
    }
  };

  const handleUpdateShow = async (showData: Show) => {
    try {
      await showService.update(showData.id, showData);
      showToast("Show timing updated successfully.", "success");
      // Refresh shows
      const response = await showService.getAll();
      setShows(response.shows || []);
    } catch (err: any) {
      showToast(err.message || "Failed to update show", "error");
    }
  };

  const handleCancelShow = async (showId: string) => {
    try {
      const show = shows.find(s => s.id === showId);
      if (show) {
        await showService.update(showId, { ...show, isCancelled: true });
        showToast("Show cancelled. Bookings froze.", "success");
        // Refresh shows
        const response = await showService.getAll();
        setShows(response.shows || []);
      }
    } catch (err: any) {
      showToast(err.message || "Failed to cancel show", "error");
    }
  };

  const handleDeleteShow = async (showId: string) => {
    try {
      await showService.delete(showId);
      showToast("Scheduled show permanent dropped.", "success");
      // Refresh shows
      const response = await showService.getAll();
      setShows(response.shows || []);
    } catch (err: any) {
      showToast(err.message || "Failed to delete show", "error");
    }
  };

  // --- CONTROLLER OPERATIONS: PAYMENT GATEWAY CONFIGURES ---
  const handleUpdateBanking = async (bankingData: BankingDetails) => {
    try {
      // Banking details are handled by the backend
      showToast("Corporate payment gateways updated.", "success");
    } catch (err: any) {
      showToast(err.message || "Failed to update banking", "error");
    }
  };

  // --- CONTROLLER OPERATIONS: FOOD COUNTER ---
  const handleAddFood = async (foodData: Omit<Food, "id">) => {
    try {
      await foodService.create(foodData);
      showToast(`Food item "${foodData.name}" added successfully!`, "success");
      const response = await foodService.getAll();
      setFoods(response.foods || []);
    } catch (err: any) {
      showToast(err.message || "Failed to add food item", "error");
    }
  };

  const handleUpdateFood = async (foodData: Food) => {
    try {
      await foodService.update(foodData.id, foodData);
      showToast(`Food item updated successfully.`, "success");
      const response = await foodService.getAll();
      setFoods(response.foods || []);
    } catch (err: any) {
      showToast(err.message || "Failed to update food item", "error");
    }
  };

  const handleDeleteFood = async (foodId: string) => {
    try {
      await foodService.delete(foodId);
      showToast("Food item removed successfully.", "success");
      const response = await foodService.getAll();
      setFoods(response.foods || []);
    } catch (err: any) {
      showToast(err.message || "Failed to delete food item", "error");
    }
  };


  // --- CONTROLLER OPERATIONS: LOST & FOUND ---
  const handleReportLostFound = async (reportData: any) => {
    try {
      const { lostFoundService } = await import('./services/api');
      await lostFoundService.create(reportData);
      showToast("Report submitted successfully.", "success");

      const lfResponse = await lostFoundService.getAll();
      setLostFoundItems(lfResponse.reports || []);
    } catch (err: any) {
      showToast(err.message || "Failed to submit report", "error");
      throw err;
    }
  };

  const handleUpdateLostFoundStatus = async (id: string, status: string) => {
    try {
      const { lostFoundService } = await import('./services/api');
      await lostFoundService.updateStatus(id, status);
      showToast(`Status updated to ${status}.`, "success");

      const lfResponse = await lostFoundService.getAll();
      setLostFoundItems(lfResponse.reports || []);
    } catch (err: any) {
      showToast(err.message || "Failed to update status", "error");
    }
  };

  // --- HIGH-STAKES CONTROLLER: DYNAMIC CONCURRENT RESERVA_LOCK ---
  const handleConfirmBooking = async (bookingData: Omit<Booking, "id" | "bookingDate">) => {
    const bookingId = generateRandomId("LTR");

    try {
      // First, try to book the seats on the show
      const show = shows.find(s => s.id === bookingData.showId);
      if (!show) {
        throw new Error("Target screening slot no longer exists in database.");
      }

      if (show.isCancelled) {
        throw new Error("This screening session was cancelled by admin.");
      }

      // Check for double booking
      const collisionSeats = bookingData.seatNumbers.filter((seat) =>
        show.bookedSeats.includes(seat)
      );

      if (collisionSeats.length > 0) {
        throw new Error(
          `Seat(s) ${collisionSeats.join(", ")} were booked in another concurrent session!`
        );
      }

      // Book seats on the show
      const updatedBookedSeats = [...show.bookedSeats, ...bookingData.seatNumbers];
      await showService.bookSeats(bookingData.showId, bookingData.seatNumbers);

      // Create booking
      const bookingPayload = {
        ...bookingData,
        qrCodeUrl: bookingId,
      };
      await bookingService.create(bookingPayload);

      showToast("Transactions confirmed! Boarding pass unlocked.", "success");

      // Refresh shows and bookings
      const showsResponse = await showService.getAll();
      setShows(showsResponse.shows || []);

      const bookingsResponse = await bookingService.getUserBookings();
      setBookings(bookingsResponse.bookings || []);

      return bookingId;
    } catch (err: any) {
      const text = err.message || "Failed to secure tickets.";
      showToast(text, "error");
      throw err;
    }
  };

  // --- CUSTOMER TRANSACTION ROLLBACK CANCELLATION ---
  const handleCancelBooking = async (
    bookingId: string,
    showId: string,
    seatsToRelease: string[]
  ) => {
    try {
      // Get the show to update booked seats
      const show = shows.find(s => s.id === showId);
      if (!show) {
        throw new Error("Show not found");
      }

      // Release seats
      await showService.releaseSeats(showId, seatsToRelease);

      // Cancel booking
      await bookingService.update(bookingId, { isCancelled: true });

      showToast("Booking refunded and seats released successfully!", "success");

      // Refresh shows and bookings
      const showsResponse = await showService.getAll();
      setShows(showsResponse.shows || []);

      const bookingsResponse = await bookingService.getUserBookings();
      setBookings(bookingsResponse.bookings || []);
    } catch (err: any) {
      console.error(err);
      showToast(err.message || "Failed to process cancellation.", "error");
    }
  };

  const handleLeaveWaitlist = async (entryId: string) => {
    try {
      await waitingQueueService.leave(entryId);
      showToast("Successfully left the waiting queue.", "success");
      const response = await waitingQueueService.getMyQueue();
      setWaitlistEntries(response.entries || []);
    } catch (err: any) {
      console.error(err);
      showToast(err.message || "Failed to leave waiting queue.", "error");
    }
  };

  // Open modal config
  const openAuthFlow = (role: "user" | "admin", isRegister: boolean) => {
    setAuthRole(role);
    setAuthIsRegister(isRegister);
    setIsAuthOpen(true);
  };

  const handleInitiateBooking = (movie: Movie) => {
    if (!currentUser) {
      showToast("Please login to reserve seats.", "info");
      setPendingBookingMovie(movie);
      openAuthFlow("user", false);
      return;
    }
    setActiveMovieForBooking(movie);
  };

  return (
    <div className="bg-[#050505] min-h-screen text-stone-100 font-sans flex flex-col justify-between relative overflow-x-hidden">
      {/* Alert Hud */}
      <ToastContainer toasts={toasts} onClose={removeToast} />

      {/* Navbar segment */}
      <Navbar
        currentUser={currentUser}
        onLogout={handleSignOut}
        onOpenAuth={openAuthFlow}
        onNavigate={(view) => {
          if (!currentUser && (view === "admin" || view === "user" || view === "watch-room")) {
            showToast("Required logging session to view.", "info");
            openAuthFlow("user", false);
            return;
          }
          setCurrentView(view);
        }}
        currentView={currentView}
      />

      {/* WATCH ROOM CREATE/JOIN ACTIONS BAR */}
      {currentUser && currentView !== "watch-room" && currentView !== "admin" && (
        <div className="bg-[#C5A059]/10 border-b border-[#C5A059]/20 py-2 px-4 flex justify-center gap-4 animate-fadeIn">
          <button
            onClick={async () => {
              try {
                const { watchRoomService } = await import('./services/api');
                const res = await watchRoomService.createRoom(currentUser.id, currentUser.fullName || currentUser.email.split('@')[0]);
                setWatchRoomId(res.room.roomId);
                setCurrentView("watch-room");
                showToast("Watch Room Created!", "success");
              } catch (err) {
                showToast("Failed to create room.", "error");
              }
            }}
            className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#C5A059] hover:text-[#F1D299] transition-colors"
          >
            <PlaySquare className="w-4 h-4" /> Create Watch Room
          </button>
          <div className="w-px h-4 bg-[#C5A059]/30 my-auto"></div>
          <button
            onClick={() => {
              const code = prompt("Enter Watch Room Code:");
              if (code) {
                setWatchRoomId(code.toUpperCase());
                setCurrentView("watch-room");
              }
            }}
            className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-stone-300 hover:text-white transition-colors"
          >
            <Users className="w-4 h-4" /> Join Room
          </button>
        </div>
      )}

      {/* VIEW DRAWERS LAYOUT */}
      
      {/* 0. WATCH ROOM VIEW */}
      {currentView === "watch-room" && currentUser && watchRoomId && (
        <div className="flex-1 p-4 md:p-8">
          <WatchRoom
            roomId={watchRoomId}
            currentUser={currentUser}
            onLeave={() => {
              setWatchRoomId(null);
              setCurrentView("home");
            }}
          />
        </div>
      )}

      {/* 1. ADMIN PANEL VIEW */}
      {currentView === "admin" && currentUser?.role === "admin" && (
        <AdminPanel
          movies={movies}
          theatres={theatres}
          shows={shows}
          bookings={bookings}
          bankingDetails={bankingDetails}
          foods={foods}
          onAddMovie={handleAddMovie}
          onUpdateMovie={handleUpdateMovie}
          onDeleteMovie={handleDeleteMovie}
          onAddTheatre={handleAddTheatre}
          onUpdateTheatre={handleUpdateTheatre}
          onDeleteTheatre={handleDeleteTheatre}
          onCreateShow={handleCreateShow}
          onUpdateShow={handleUpdateShow}
          onDeleteShow={handleDeleteShow}
          onCancelShow={handleCancelShow}
          onUpdateBanking={handleUpdateBanking}
          onAddFood={handleAddFood}
          onUpdateFood={handleUpdateFood}
          onDeleteFood={handleDeleteFood}
          usersCount={usersCount}
          onConfirmBooking={handleConfirmBooking}
          onCancelBooking={handleCancelBooking}
          lostFoundItems={lostFoundItems}
          onUpdateLostFoundStatus={handleUpdateLostFoundStatus}
        />
      )}


      {/* 2. USER CORRIDOR VIEW */}
      {currentView === "user" && currentUser && (
        <UserPanel
          currentUser={currentUser}
          movies={movies}
          shows={shows}
          bookings={bookings}
          onCancelBooking={handleCancelBooking}
          onNavigateHome={() => setCurrentView("home")}
          onNavigateLostFound={() => setCurrentView("user-lostfound")}
          waitlistEntries={waitlistEntries}
          onLeaveWaitlist={handleLeaveWaitlist}
        />
      )}

      {currentView === "user-lostfound" && currentUser && (
        <LostFoundStatusPage
          currentUser={currentUser}
          lostFoundItems={lostFoundItems.filter(item => item.userId === currentUser.id)}
          onNavigateHome={() => setCurrentView("user")}
        />
      )}

      {/* 3. THEATRE LOCATIONS LIST */}
      {currentView === "theatres" && (
        <div className="max-w-7xl mx-auto px-4 py-16 flex-1 w-full animate-fadeIn">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {theatres.map((t) => (
              <div
                key={t.id}
                onClick={() => setSelectedTheatreForMap(t)}
                className="glass-card p-6 rounded-3xl flex flex-col justify-between shadow-2xl relative cursor-pointer hover:border-[#C5A059]/40 hover:shadow-[0_0_30px_rgba(197,160,89,0.10)] transition-all duration-300 group"
              >
                <div className="flex flex-col gap-3">
                  <span className="text-[9px] uppercase tracking-[0.2em] font-mono text-[#C5A059] font-bold">
                    Active Theater Complex
                  </span>
                  <h3 className="text-xl font-serif font-bold text-stone-200 group-hover:text-[#F1D299] transition-colors">{t.name}</h3>
                  <p className="text-xs text-stone-400 flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-[#C5A059] shrink-0 mt-0.5" />
                    {t.location}
                  </p>
                  <span className="text-[10px] uppercase font-mono px-3.5 py-1.5 bg-white/5 rounded-xl border border-white/5 w-fit text-[#C5A059] mt-2 font-bold tracking-wider">
                    Equipped with {t.screens} Screens
                  </span>
                </div>

                <div className="mt-8 pt-4 border-t border-white/5 flex flex-col gap-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-stone-500 font-mono text-[10px]">INDEX: {t.id}</span>
                    <span className="text-[#C5A059] font-bold uppercase tracking-wider text-[10px] flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> View on Map
                    </span>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!currentUser) {
                          showToast("Please login to report an item.", "info");
                          openAuthFlow("user", false);
                          return;
                        }
                        setReportingTheatre(t);
                      }}
                      className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg border border-white/10 hover:border-[#C5A059]/40 bg-white/5 hover:bg-white/10 text-stone-300 transition-colors text-[10px] uppercase font-bold tracking-wider"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      Report Lost & Found
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!currentUser) {
                          showToast("Please login to write a review.", "info");
                          openAuthFlow("user", false);
                          return;
                        }
                        setReviewTheatre(t);
                      }}
                      className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg border border-[#C5A059]/30 hover:border-[#C5A059]/60 bg-[#C5A059]/10 hover:bg-[#C5A059]/20 text-[#C5A059] transition-colors text-[10px] uppercase font-bold tracking-wider"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      Review Theatre
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {theatres.length === 0 && (
              <div className="col-span-full text-center border border-dashed border-[#C5A059]/20 py-20 rounded-3xl text-stone-500 bg-white/2">
                <Building2 className="w-8 h-8 mx-auto text-stone-600 mb-2" />
                <span>No active theatre listings populated yet. Curation schedules locked.</span>
              </div>
            )}
          </div>
        </div>
      )}


      {/* 4. MAIN HOMEPAGE CATALOG CATALOG */}
      {/* LOGGED-IN USER VIEW - MOVIES CATALOG */}
      {currentView === "home" && currentUser && (
        <MoviesCatalog
          movies={movies}
          shows={activeShowsForUsers}
          theatres={theatres}
          onSelectMovie={handleInitiateBooking}
          onNavigateHome={() => setCurrentView("home")}
          onOpenReviews={setReviewMovie}
        />
      )}

      {/* GUEST/HOMEPAGE VIEW - HERO + MOVIE LISTINGS */}
      {currentView === "home" && !currentUser && (
        <div className="flex-1">
          {/* Hero Banner Grid Search */}
          <Hero
            movies={movies}
            theatres={theatres}
            showFilters={false}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            selectedLanguage={selectedLanguage}
            setSelectedLanguage={setSelectedLanguage}
            selectedGenre={selectedGenre}
            setSelectedGenre={setSelectedGenre}
            languages={languages}
            genres={genres}
            onSelectMovie={handleInitiateBooking}
          />

          {/* Dynamic Movie Catalog lists Section */}
          <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8 flex flex-col gap-16">
            {/* FEATURED / ACTIVE SECTION */}
            <div className="flex flex-col gap-8">
              <div className="flex justify-between items-end border-b border-white/5 pb-4">
                <div>
                  <h2 className="text-3xl sm:text-4xl font-serif text-stone-100 tracking-tight flex items-center gap-2.5">
                    <Star className="w-5 h-5 text-[#C5A059] fill-[#C5A059]" />
                    Now Showing
                  </h2>
                  <p className="text-stone-400 text-xs mt-1">
                    Select an elite screening venue, configure your premium leather seats, and book tickets live.
                  </p>
                </div>
                <span className="text-[10px] font-mono text-stone-500 font-bold uppercase tracking-wider bg-white/5 px-3 py-1 rounded-full border border-white/5">
                  Live screening: {featuredMovies.length} Films
                </span>
              </div>

              {/* Films grids */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                {featuredMovies.map((movie) => (
                  <div
                    key={movie.id}
                    onClick={() => handleInitiateBooking(movie)}
                    className="group glass-card rounded-2xl overflow-hidden hover:scale-[1.02] hover:border-[#C5A059]/40 hover:shadow-[0_0_30px_rgba(197,160,89,0.08)] transition-all duration-300 cursor-pointer p-3"
                  >
                    <div className="aspect-[2/3] w-full rounded-xl overflow-hidden bg-stone-950 relative border border-white/5">
                      <img
                        src={movie.posterUrl}
                        alt={movie.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-transparent to-transparent opacity-80 group-hover:opacity-50 transition-opacity" />
                    </div>

                    <div className="mt-4 px-1.5">
                      <h3 className="font-serif font-bold text-stone-100 group-hover:text-[#F1D299] transition-colors tracking-tight text-base truncate">
                        {movie.title}
                      </h3>
                      <div className="flex justify-between items-center text-[10px] font-mono mt-2 tracking-wider">
                        <span className="text-[#C5A059] font-bold uppercase">{movie.genre}</span>
                        <span className="text-stone-400 uppercase">{movie.language}</span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-stone-500 border-t border-white/5 pt-2 mt-2.5">
                        <span>RELEASED: {movie.releaseDate.split('T')[0]}</span>
                        <span>{movie.duration}</span>
                      </div>
                    </div>
                  </div>
                ))}

                {featuredMovies.length === 0 && (
                  <div className="col-span-full border border-dashed border-[#C5A059]/10 py-16 text-center text-stone-500 rounded-3xl bg-white/2">
                    <Film className="w-8 h-8 mx-auto text-stone-700 mb-2 animate-pulse" />
                    <span>No dynamic movies loaded matching parameters. Try resetting your search.</span>
                  </div>
                )}
              </div>
            </div>

            {/* UPCOMING SHOWS LISTS */}
            <div className="flex flex-col gap-8">
              <div className="flex justify-between items-end border-b border-white/5 pb-4">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-serif text-stone-200 tracking-tight flex items-center gap-2.5">
                    <CalendarDays className="w-5 h-5 text-[#C5A059]" />
                    Upcoming blockbusters
                  </h2>
                  <p className="text-stone-400 text-xs mt-1">
                    Curation selection slated for upcoming visual showtimes.
                  </p>
                </div>
                <span className="text-[10px] font-mono text-stone-500 font-bold uppercase tracking-wider bg-white/5 px-3 py-1 rounded-full border border-white/5">
                  Titled: {upcomingMovies.length} teasers
                </span>
              </div>

              {/* Upcoming listing */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                {upcomingMovies.map((movie) => (
                  <div
                    key={movie.id}
                    onClick={() => {
                      handleInitiateBooking(movie);
                    }}
                    className="group bg-white/3 border border-white/5 hover:border-[#C5A059]/30 rounded-2xl overflow-hidden cursor-pointer p-3 transition-all hover:scale-[1.01] hover:shadow-[0_0_20px_rgba(197,160,89,0.05)]"
                  >
                    <div className="aspect-[2/3] w-full rounded-xl overflow-hidden bg-stone-950 relative border border-white/5 grayscale group-hover:grayscale-0 transition-all duration-500">
                      <img
                        src={movie.posterUrl}
                        alt={movie.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="mt-3 px-1.5">
                      <h4 className="font-serif font-bold text-stone-300 group-hover:text-[#F1D299] transition-colors truncate">
                        {movie.title}
                      </h4>
                      <p className="text-[9px] text-[#C5A059] font-mono mt-1 font-bold uppercase tracking-wider">
                        ARRIVING: {movie.releaseDate.includes('T') ? movie.releaseDate.split('T')[0] : movie.releaseDate}
                      </p>
                    </div>
                  </div>
                ))}

                {upcomingMovies.length === 0 && (
                  <div className="col-span-full border border-dashed border-[#C5A059]/10 py-12 text-center text-stone-500 rounded-2xl bg-white/2">
                    <span>No upcoming movie trailers in list records.</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer Segment */}
      <Footer onNavigateHome={() => setCurrentView("home")} />

      {/* --- FLOATING CONTROLS: POPUPS AUTHS --- */}

      {/* 1. Global Auth modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => {
          setIsAuthOpen(false);
          setPendingBookingMovie(null);
        }}
        initialRole={authRole}
        initialIsRegister={authIsRegister}
        onShowToast={showToast}
        onAuthSuccess={(profileObj) => {
          setCurrentUser(profileObj);
          if (profileObj.role === "admin") {
            setCurrentView("admin");
          } else if (pendingBookingMovie) {
            setActiveMovieForBooking(pendingBookingMovie);
            setPendingBookingMovie(null);
          }
        }}
      />

      {/* 2. Unified Reservation Booking Flow popup */}
      {/* Theatre Map Modal */}
      {selectedTheatreForMap && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setSelectedTheatreForMap(null)}
        >
          <div
            className="relative w-full max-w-2xl rounded-2xl overflow-hidden border border-[#C5A059]/30 shadow-2xl bg-[#0a0a0a] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#C5A059]" />
                <div>
                  <p className="text-[9px] uppercase tracking-[0.2em] text-[#C5A059] font-mono font-bold">Location</p>
                  <h3 className="text-base font-serif font-bold text-stone-100">{selectedTheatreForMap.name}</h3>
                </div>
              </div>
              <button
                onClick={() => setSelectedTheatreForMap(null)}
                className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-stone-400 hover:text-stone-100 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Address bar */}
            <div className="px-5 py-3 bg-white/[0.02] border-b border-white/5">
              <p className="text-xs text-stone-400">{selectedTheatreForMap.location}</p>
            </div>

            {/* Google Maps embed */}
            <div className="w-full" style={{ height: '400px' }}>
              <iframe
                title={`Map for ${selectedTheatreForMap.name}`}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
                src={`https://maps.google.com/maps?q=${encodeURIComponent(selectedTheatreForMap.location)}&output=embed&z=16`}
              />
            </div>

            {/* Open in Google Maps button */}
            <div className="px-5 py-3 border-t border-white/5 flex justify-end">
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedTheatreForMap.location)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-[10px] uppercase tracking-wider bg-gradient-to-r from-[#C5A059] to-[#F1D299] text-[#050505] font-bold px-4 py-2 rounded-full hover:opacity-90 transition-all"
              >
                <MapPin className="w-3 h-3" />
                Open in Google Maps
              </a>
            </div>
          </div>
        </div>
      )}

      {activeMovieForBooking && (
        <BookingFlow
          movie={activeMovieForBooking}
          theatres={theatres}
          shows={activeShowsForUsers}
          bankingDetails={bankingDetails}
          currentUser={currentUser}
          onClose={() => setActiveMovieForBooking(null)}
          onConfirmBooking={handleConfirmBooking}
          onOpenAuth={openAuthFlow}
        />
      )}

      {/* Review Modal */}
      {reviewMovie && (
        <RatingsReviewsModal
          movie={reviewMovie}
          currentUser={currentUser}
          onClose={() => setReviewMovie(null)}
          onLoginRequest={() => {
            setPendingBookingMovie(reviewMovie);
            openAuthFlow("user", false);
          }}
        />
      )}

      {/* Lost & Found Modal */}
      {reportingTheatre && currentUser && (
        <ReportLostFoundModal
          theatre={reportingTheatre}
          currentUser={currentUser}
          onClose={() => setReportingTheatre(null)}
          onSubmit={handleReportLostFound}
        />
      )}

      {/* Theatre Feedback Modal */}
      {reviewTheatre && currentUser && (
        <TheatreFeedbackModal
          theatre={reviewTheatre}
          currentUser={currentUser}
          onClose={() => setReviewTheatre(null)}
        />
      )}
    </div>
  );
}
