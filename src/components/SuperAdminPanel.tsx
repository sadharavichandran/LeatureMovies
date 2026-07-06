import React, { useState, useEffect } from "react";
import { UserProfile, Theatre, Review, Booking, Movie, Show } from "../types";
import {
  authService,
  reviewService,
  theatreService,
  bookingService,
  movieService,
  showService,
} from "../services/api";
import {
  Shield,
  Building2,
  Star,
  Users,
  MessageSquare,
  ChevronDown,
  ChevronRight,
  MapPin,
  Monitor,
  Mail,
  Phone,
  UserCheck,
  Receipt,
  IndianRupee,
  CheckCircle2,
  XCircle,
  Calendar,
  Clock,
  Ticket,
  Film,
  CalendarDays,
  Tv,
} from "lucide-react";

interface SuperAdminPanelProps {
  theatres: Theatre[];
}

function formatCurrency(amount: number) {
  return `₹${amount.toLocaleString("en-IN")}`;
}

interface AdminMetrics {
  totalRevenue: number;
  ticketCollections: number;
  moviesConfigured: number;
  theatresRegistered: number;
  scheduledShows: number;
  activeScreenings: number;
  cancelledShows: number;
  theatres: Theatre[];
  movies: Movie[];
  shows: Show[];
  bookings: Booking[];
}

export default function SuperAdminPanel({ theatres: propTheatres }: SuperAdminPanelProps) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [allTheatres, setAllTheatres] = useState<Theatre[]>(propTheatres);
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [allMovies, setAllMovies] = useState<Movie[]>([]);
  const [allShows, setAllShows] = useState<Show[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedAdmins, setExpandedAdmins] = useState<Set<string>>(new Set());
  const [activeAdminTab, setActiveAdminTab] = useState<
    Record<string, "overview" | "theatres" | "movies" | "shows" | "bookings">
  >({});

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [usersRes, theatreReviews, platformReviews, theatresRes, bookingsRes, moviesRes, showsRes] =
          await Promise.all([
            authService.getAllUsers(),
            reviewService.getAllTheatreReviews(),
            reviewService.getAllPlatformReviews(),
            theatreService.getAll(),
            bookingService.getAll(),
            movieService.getAll(),
            showService.getAll(),
          ]);
        const reviewsRes = { reviews: [...(theatreReviews.reviews || []), ...(platformReviews.reviews || [])] };
        const adminUsers = (usersRes.users || []).filter(
          (u: UserProfile) => u.role === "admin"
        );
        setUsers(usersRes.users || []);
        setReviews(reviewsRes.reviews || []);
        setAllTheatres(theatresRes.theatres || []);
        setAllBookings(bookingsRes.bookings || []);
        setAllMovies(moviesRes.movies || []);
        setAllShows(showsRes.shows || []);
        // Auto-expand all admins
        setExpandedAdmins(new Set(adminUsers.map((u: UserProfile) => u.id)));
      } catch (err) {
        console.error("Error fetching super admin data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const admins = users.filter((u) => u.role === "admin");

  const getAdminMetrics = (adminId: string): AdminMetrics => {
    const theatres = allTheatres.filter((t) => t.adminId === adminId);
    const movies = allMovies.filter((m) => m.adminId === adminId);
    const shows = allShows.filter((s) => s.adminId === adminId);
    const bookings = allBookings.filter((b) => b.adminId === adminId);
    const successBookings = bookings.filter((b) => b.paymentStatus === "Success" && !b.isCancelled);
    return {
      totalRevenue: successBookings.reduce((sum, b) => sum + b.totalAmount, 0),
      ticketCollections: bookings.length,
      moviesConfigured: movies.length,
      theatresRegistered: theatres.length,
      scheduledShows: shows.length,
      activeScreenings: shows.filter((s) => !s.isCancelled).length,
      cancelledShows: shows.filter((s) => s.isCancelled).length,
      theatres,
      movies,
      shows,
      bookings,
    };
  };

  const toggleAdmin = (adminId: string) => {
    setExpandedAdmins((prev) => {
      const next = new Set(prev);
      if (next.has(adminId)) next.delete(adminId);
      else next.add(adminId);
      return next;
    });
  };

  const getAdminTab = (adminId: string) => activeAdminTab[adminId] || "overview";
  const setAdminTab = (adminId: string, tab: typeof activeAdminTab[string]) => {
    setActiveAdminTab((prev) => ({ ...prev, [adminId]: tab }));
  };

  // Platform-level totals
  const platformRevenue = allBookings
    .filter((b) => b.paymentStatus === "Success" && !b.isCancelled)
    .reduce((sum, b) => sum + b.totalAmount, 0);

  const unownedTheatres = allTheatres.filter(
    (t) => !t.adminId || !admins.find((a) => a.id === t.adminId)
  );

  return (
    <div className="flex-1 p-4 md:p-8 animate-fadeIn max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-2xl bg-[#C5A059]/20 border border-[#C5A059]/30 flex items-center justify-center">
            <Shield className="w-5 h-5 text-[#C5A059]" />
          </div>
          <div>
            <h1 className="text-3xl font-serif font-bold text-white">Super Admin Dashboard</h1>
            <p className="text-stone-400 text-sm mt-0.5">
              Full platform oversight — per-admin analytics, theatres, movies, shows & booking logs.
            </p>
          </div>
        </div>

        {/* Platform-wide summary */}
        {!loading && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            {[
              { label: "Total Admins", value: admins.length, icon: UserCheck, color: "text-[#C5A059]", bg: "border-[#C5A059]/15 bg-[#C5A059]/5" },
              { label: "Platform Revenue", value: formatCurrency(platformRevenue), icon: IndianRupee, color: "text-green-400", bg: "border-green-500/15 bg-green-500/5" },
              { label: "Total Bookings", value: allBookings.length, icon: Receipt, color: "text-purple-400", bg: "border-purple-500/15 bg-purple-500/5" },
              { label: "Total Reviews", value: reviews.length, icon: MessageSquare, color: "text-pink-400", bg: "border-pink-500/15 bg-pink-500/5" },
            ].map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div key={i} className={`glass-card p-4 rounded-2xl border ${stat.bg} flex items-center gap-3`}>
                  <div className={`p-2.5 rounded-xl bg-white/5 shrink-0 ${stat.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xl font-bold text-white truncate">{stat.value}</p>
                    <p className="text-[9px] text-stone-500 uppercase font-mono tracking-wider">{stat.label}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center gap-3 text-[#C5A059] py-20 justify-center">
          <span className="w-5 h-5 border-2 border-[#C5A059] border-t-transparent rounded-full animate-spin" />
          <span className="font-mono text-sm tracking-wider">Loading dashboard data...</span>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Per-Admin Cards */}
          {admins.length === 0 ? (
            <div className="glass-card p-12 rounded-3xl border border-white/5 text-center text-stone-500">
              No admin accounts registered yet.
            </div>
          ) : (
            admins.map((admin) => {
              const m = getAdminMetrics(admin.id);
              const isExpanded = expandedAdmins.has(admin.id);
              const tab = getAdminTab(admin.id);

              const metrics8 = [
                { label: "Total Revenue", value: formatCurrency(m.totalRevenue), icon: IndianRupee, color: "text-green-400", bg: "bg-green-500/10 border-green-500/15" },
                { label: "Ticket Collections", value: m.ticketCollections, icon: Receipt, color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/15" },
                { label: "Movies Configured", value: m.moviesConfigured, icon: Film, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/15" },
                { label: "Theatres Registered", value: m.theatresRegistered, icon: Building2, color: "text-cyan-400", bg: "bg-cyan-500/10 border-cyan-500/15" },
                { label: "Scheduled Shows", value: m.scheduledShows, icon: CalendarDays, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/15" },
                { label: "Active Screenings", value: m.activeScreenings, icon: Tv, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/15" },
                { label: "Cancelled Shows", value: m.cancelledShows, icon: XCircle, color: "text-red-400", bg: "bg-red-500/10 border-red-500/15" },
                { label: "Total Registered Users", value: users.filter((u) => u.role === "user").length, icon: Users, color: "text-[#C5A059]", bg: "bg-[#C5A059]/10 border-[#C5A059]/15" },
              ];

              const tabs: Array<{ id: typeof tab; label: string; icon: any; count: number }> = [
                { id: "overview", label: "Overview", icon: Shield, count: 0 },
                { id: "theatres", label: "Theatres", icon: Building2, count: m.theatresRegistered },
                { id: "movies", label: "Movies", icon: Film, count: m.moviesConfigured },
                { id: "shows", label: "Shows", icon: CalendarDays, count: m.scheduledShows },
                { id: "bookings", label: "Bookings", icon: Receipt, count: m.ticketCollections },
              ];

              return (
                <div key={admin.id} className="glass-card rounded-3xl border border-white/5 shadow-2xl bg-black/40 overflow-hidden">
                  {/* Admin Header */}
                  <button
                    onClick={() => toggleAdmin(admin.id)}
                    className="w-full flex items-center gap-4 px-6 py-5 hover:bg-white/[0.03] transition-colors text-left"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#C5A059]/30 to-[#C5A059]/10 border border-[#C5A059]/30 flex items-center justify-center shrink-0">
                      <span className="text-[#F1D299] font-bold text-lg">
                        {admin.fullName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-[#F1D299] text-lg">{admin.fullName}</h3>
                        <span className="px-2 py-0.5 bg-[#C5A059]/20 text-[#C5A059] rounded-full text-[9px] uppercase font-bold tracking-widest">Admin</span>
                      </div>
                      <div className="flex items-center gap-4 mt-1 flex-wrap">
                        <span className="flex items-center gap-1 text-xs text-stone-400"><Mail className="w-3 h-3" />{admin.email}</span>
                        {admin.mobileNumber && (
                          <span className="flex items-center gap-1 text-xs text-stone-500 font-mono"><Phone className="w-3 h-3" />{admin.mobileNumber}</span>
                        )}
                      </div>
                    </div>
                    {/* Quick stat pills */}
                    <div className="hidden md:flex items-center gap-2 shrink-0 flex-wrap">
                      <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg bg-green-500/15 text-green-300 border border-green-500/20">
                        {formatCurrency(m.totalRevenue)}
                      </span>
                      <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg bg-blue-500/15 text-blue-300 border border-blue-500/20">
                        {m.theatresRegistered} Theatre{m.theatresRegistered !== 1 ? "s" : ""}
                      </span>
                      <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg bg-purple-500/15 text-purple-300 border border-purple-500/20">
                        {m.ticketCollections} Booking{m.ticketCollections !== 1 ? "s" : ""}
                      </span>
                    </div>
                    {isExpanded
                      ? <ChevronDown className="w-5 h-5 text-stone-400 shrink-0 ml-2" />
                      : <ChevronRight className="w-5 h-5 text-stone-400 shrink-0 ml-2" />
                    }
                  </button>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="border-t border-white/5">
                      {/* 8-metric grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-5 border-b border-white/5 bg-black/20">
                        {metrics8.map((metric, i) => {
                          const Icon = metric.icon;
                          return (
                            <div key={i} className={`p-3.5 rounded-2xl border ${metric.bg} flex items-center gap-3`}>
                              <div className={`p-2 rounded-xl bg-white/5 shrink-0 ${metric.color}`}>
                                <Icon className="w-3.5 h-3.5" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-base font-bold text-white truncate">{metric.value}</p>
                                <p className="text-[9px] text-stone-500 uppercase font-mono tracking-wider leading-tight">{metric.label}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Tab Switcher */}
                      <div className="flex gap-1.5 px-5 pt-4 pb-1 overflow-x-auto no-scrollbar">
                        {tabs.map((t) => {
                          const Icon = t.icon;
                          return (
                            <button
                              key={t.id}
                              onClick={() => setAdminTab(admin.id, t.id)}
                              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
                                tab === t.id
                                  ? "bg-[#C5A059]/20 text-[#F1D299] border border-[#C5A059]/30"
                                  : "text-stone-500 hover:text-stone-300 border border-transparent hover:border-white/10"
                              }`}
                            >
                              <Icon className="w-3 h-3" />
                              {t.label}{t.count > 0 ? ` (${t.count})` : ""}
                            </button>
                          );
                        })}
                      </div>

                      <div className="p-5 pt-4">
                        {/* Overview Tab */}
                        {tab === "overview" && (
                          <p className="text-stone-400 text-sm">
                            Select a tab above to view this admin's theatres, movies, show schedule, or booking logs in detail.
                          </p>
                        )}

                        {/* Theatres Tab */}
                        {tab === "theatres" && (
                          m.theatres.length === 0 ? (
                            <div className="py-6 text-center text-stone-500 text-sm border border-dashed border-white/10 rounded-2xl">
                              No theatres created yet.
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {m.theatres.map((theatre) => (
                                <div key={theatre.id} className="flex items-start gap-3 p-4 rounded-2xl bg-white/[0.03] border border-white/8 hover:border-cyan-500/20 transition-all">
                                  <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
                                    <Building2 className="w-4 h-4 text-cyan-400" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-white text-sm">{theatre.name}</h4>
                                    <p className="flex items-center gap-1 text-xs text-stone-400 mt-0.5">
                                      <MapPin className="w-3 h-3 text-[#C5A059] shrink-0" />{theatre.location}
                                    </p>
                                    <div className="flex gap-2 mt-2 flex-wrap">
                                      <span className="text-[10px] font-mono text-stone-500 bg-white/5 px-2 py-0.5 rounded-lg flex items-center gap-1">
                                        <Monitor className="w-3 h-3" />{theatre.screens} Screen{theatre.screens !== 1 ? "s" : ""}
                                      </span>
                                      {theatre.hasParking && (
                                        <span className="text-[10px] font-mono text-green-400 bg-green-400/10 px-2 py-0.5 rounded-lg">Parking ✓</span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )
                        )}

                        {/* Movies Tab */}
                        {tab === "movies" && (
                          m.movies.length === 0 ? (
                            <div className="py-6 text-center text-stone-500 text-sm border border-dashed border-white/10 rounded-2xl">
                              No movies configured yet.
                            </div>
                          ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                              {m.movies.map((movie) => (
                                <div key={movie.id} className="bg-white/[0.03] border border-white/8 rounded-2xl overflow-hidden hover:border-blue-500/20 transition-all">
                                  <div className="aspect-[2/3] bg-stone-950 relative overflow-hidden">
                                    <img
                                      src={movie.posterUrl}
                                      alt={movie.title}
                                      className="w-full h-full object-cover"
                                      referrerPolicy="no-referrer"
                                    />
                                  </div>
                                  <div className="p-3">
                                    <h4 className="font-bold text-white text-xs truncate">{movie.title}</h4>
                                    <p className="text-[10px] text-stone-500 font-mono mt-1">{movie.genre} · {movie.language}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )
                        )}

                        {/* Shows Tab */}
                        {tab === "shows" && (
                          m.shows.length === 0 ? (
                            <div className="py-6 text-center text-stone-500 text-sm border border-dashed border-white/10 rounded-2xl">
                              No shows scheduled yet.
                            </div>
                          ) : (
                            <div className="flex flex-col gap-3 max-h-[400px] overflow-y-auto pr-1">
                              {m.shows.map((show) => (
                                <div key={show.id} className={`flex items-center gap-4 p-3.5 rounded-2xl border transition-all ${
                                  show.isCancelled ? "bg-red-950/15 border-red-500/15" : "bg-white/[0.02] border-white/8"
                                }`}>
                                  <div className={`p-2 rounded-xl shrink-0 ${show.isCancelled ? "bg-red-500/10" : "bg-amber-500/10"}`}>
                                    {show.isCancelled
                                      ? <XCircle className="w-4 h-4 text-red-400" />
                                      : <CalendarDays className="w-4 h-4 text-amber-400" />}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-bold text-white text-sm truncate">{show.movieTitle}</p>
                                    <p className="text-xs text-stone-400 mt-0.5">{show.theatreName} · Screen {show.screenNumber}</p>
                                  </div>
                                  <div className="text-right shrink-0">
                                    <p className="text-xs font-mono text-stone-300">{show.date}</p>
                                    <p className="text-[10px] text-stone-500 font-mono">{show.time}</p>
                                  </div>
                                  {show.isCancelled && (
                                    <span className="text-[9px] text-red-400 font-bold uppercase tracking-wider px-2 py-0.5 bg-red-500/10 rounded-full">Cancelled</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          )
                        )}

                        {/* Bookings Tab */}
                        {tab === "bookings" && (
                          m.bookings.length === 0 ? (
                            <div className="py-6 text-center text-stone-500 text-sm border border-dashed border-white/10 rounded-2xl">
                              No bookings recorded for this admin yet.
                            </div>
                          ) : (
                            <div className="flex flex-col gap-3 max-h-[480px] overflow-y-auto pr-1">
                              {/* Revenue summary bar */}
                              <div className="flex items-center gap-4 p-3 bg-black/30 rounded-xl border border-white/5 flex-wrap sticky top-0">
                                <span className="flex items-center gap-1.5 text-xs text-stone-400 font-mono">
                                  <Receipt className="w-3.5 h-3.5 text-purple-400" />{m.bookings.length} total
                                </span>
                                <span className="flex items-center gap-1.5 text-xs text-stone-400 font-mono">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />{m.bookings.filter(b => b.paymentStatus === "Success" && !b.isCancelled).length} success
                                </span>
                                <span className="flex items-center gap-1.5 text-xs text-stone-400 font-mono">
                                  <XCircle className="w-3.5 h-3.5 text-red-400" />{m.bookings.filter(b => b.isCancelled).length} cancelled
                                </span>
                                <span className="ml-auto font-bold text-sm text-green-400 flex items-center gap-1">
                                  <IndianRupee className="w-3.5 h-3.5" />{formatCurrency(m.totalRevenue)}
                                </span>
                              </div>

                              {m.bookings.map((booking) => (
                                <div
                                  key={booking.id}
                                  className={`flex items-start gap-3 p-4 rounded-2xl border transition-all ${
                                    booking.isCancelled
                                      ? "bg-red-950/20 border-red-500/15"
                                      : booking.paymentStatus === "Success"
                                      ? "bg-green-950/10 border-green-500/10"
                                      : "bg-white/[0.02] border-white/8"
                                  }`}
                                >
                                  <div className="mt-0.5 shrink-0">
                                    {booking.isCancelled
                                      ? <XCircle className="w-4 h-4 text-red-400" />
                                      : booking.paymentStatus === "Success"
                                      ? <CheckCircle2 className="w-4 h-4 text-green-400" />
                                      : <Clock className="w-4 h-4 text-amber-400" />
                                    }
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2 flex-wrap">
                                      <div>
                                        <p className="font-bold text-white text-sm truncate">{booking.movieTitle}</p>
                                        <p className="text-xs text-stone-400 mt-0.5">{booking.userName} · {booking.userEmail}</p>
                                      </div>
                                      <div className="text-right shrink-0">
                                        <p className={`font-bold text-sm ${booking.isCancelled ? "text-red-400 line-through" : "text-green-400"}`}>
                                          {formatCurrency(booking.totalAmount)}
                                        </p>
                                        <p className="text-[10px] text-stone-500 font-mono">{booking.paymentStatus}</p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-3 mt-2 flex-wrap text-[10px] font-mono text-stone-500">
                                      <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{booking.theatreName}</span>
                                      <span className="flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        {booking.showDate
                                          ? (typeof booking.showDate === "string"
                                            ? booking.showDate.split("T")[0]
                                            : new Date(booking.showDate).toLocaleDateString())
                                          : "—"}
                                      </span>
                                      <span className="flex items-center gap-1"><Ticket className="w-3 h-3" />{booking.seatNumbers?.join(", ")}</span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}

          {/* Unowned theatres warning */}
          {unownedTheatres.length > 0 && (
            <div className="glass-card p-6 rounded-3xl border border-amber-500/20 bg-amber-500/5">
              <h2 className="text-sm font-bold text-amber-400 mb-4 flex items-center gap-2 uppercase tracking-wider font-mono">
                ⚠ Unassigned Theatres ({unownedTheatres.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {unownedTheatres.map((theatre) => (
                  <div key={theatre.id} className="p-3 bg-white/5 rounded-xl border border-white/10 text-sm">
                    <p className="font-bold text-white">{theatre.name}</p>
                    <p className="text-stone-400 text-xs mt-1">{theatre.location}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* User Reviews Section */}
          <div className="glass-card rounded-3xl border border-white/5 shadow-2xl bg-black/40 overflow-hidden">
            <div className="px-6 py-5 border-b border-white/5 flex items-center gap-3">
              <MessageSquare className="w-5 h-5 text-[#C5A059]" />
              <h2 className="text-lg font-bold text-white">User Reviews & Ratings</h2>
              <span className="ml-auto text-[10px] font-mono text-stone-500 uppercase tracking-wider bg-white/5 px-3 py-1 rounded-full">
                {reviews.length} review{reviews.length !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="p-6">
              {reviews.length === 0 ? (
                <div className="text-center py-8 text-stone-500 text-sm">No reviews submitted yet.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="p-4 bg-white/[0.03] rounded-2xl border border-white/8 hover:border-[#C5A059]/20 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-bold text-white text-sm">{review.userName}</h3>
                          <span className="text-[10px] text-stone-500 uppercase tracking-wider font-mono">{review.targetType}</span>
                        </div>
                        <div className="flex items-center gap-1 bg-[#C5A059]/15 px-2.5 py-1 rounded-xl">
                          <Star className="w-3 h-3 text-[#C5A059] fill-[#C5A059]" />
                          <span className="text-sm font-bold text-[#F1D299]">{review.rating}/5</span>
                        </div>
                      </div>
                      {review.comment && (
                        <p className="text-stone-400 text-xs italic leading-relaxed mt-2">"{review.comment}"</p>
                      )}
                      <p className="text-[10px] text-stone-600 mt-3 font-mono">{new Date(review.createdAt).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
