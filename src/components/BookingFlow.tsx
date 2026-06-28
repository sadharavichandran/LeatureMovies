import React, { useState, useMemo, useEffect } from "react";
import {
  Film,
  Building2,
  Calendar,
  Grid,
  CreditCard,
  CheckCircle2,
  Tv,
  Users,
  Timer,
  Shield,
  Smartphone,
  Landmark,
  X,
  UtensilsCrossed,
  Plus,
  Minus,
  ShoppingCart,
  Package,
  MapPin,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Movie, Theatre, Show, Booking, BankingDetails, Food, FoodOrderItem } from "../types";
import { formatCurrency, generateVisualQRCodeSVG, generateRandomId } from "../utils";
import { foodService, waitingQueueService } from "../services/api";

interface BookingFlowProps {
  movie: Movie;
  theatres: Theatre[];
  shows: Show[];
  bankingDetails: BankingDetails | null;
  currentUser: any;
  onConfirmBooking: (bookingData: Omit<Booking, "id" | "bookingDate">) => Promise<string>;
  onClose: () => void;
  onOpenAuth: (role: "user" | "admin", isRegister: boolean) => void;
}

export default function BookingFlow({
  movie,
  theatres,
  shows,
  bankingDetails,
  currentUser,
  onConfirmBooking,
  onClose,
  onOpenAuth,
}: BookingFlowProps) {
  const [step, setStep] = useState<"details" | "date" | "seats" | "food" | "parking" | "payment" | "success">("details");

  // Filter shows matching this movie
  const movieShows = useMemo(() => {
    return shows.filter((s) => s.movieId === movie.id && !s.isCancelled);
  }, [shows, movie.id]);

  // Unique theatres from active shows
  const availableTheatres = useMemo(() => {
    const ids = Array.from(new Set(movieShows.map((s) => s.theatreId)));
    return theatres.filter((t) => ids.includes(t.id));
  }, [movieShows, theatres]);

  // Selected variables
  const [selectedTheatreId, setSelectedTheatreId] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedShowId, setSelectedShowId] = useState("");
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [selectedWaitlistSeats, setSelectedWaitlistSeats] = useState<string[]>([]);

  useEffect(() => {
    setSelectedSeats([]);
    setSelectedWaitlistSeats([]);
  }, [selectedShowId]);
  const [paymentMethod, setPaymentMethod] = useState<
    "UPI" | "Net Banking" | "Debit Card" | "Credit Card"
  >("UPI");

  // Payment form states
  const [cardHolder, setCardHolder] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [upiSenderId, setUpiSenderId] = useState("");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [confirmedBookingId, setConfirmedBookingId] = useState("");

  const [useCoins, setUseCoins] = useState(false);

  // Food ordering state
  const [theatreFoods, setTheatreFoods] = useState<Food[]>([]);
  const [foodsLoading, setFoodsLoading] = useState(false);
  const [foodOrder, setFoodOrder] = useState<Record<string, number>>({}); // foodId -> quantity
  const [foodDeliveryOption, setFoodDeliveryOption] = useState<"seat" | "counter">("counter");

  // Parking state
  const [selectedParkingSeats, setSelectedParkingSeats] = useState<string[]>([]);

  // Fetch foods when theatre is selected
  useEffect(() => {
    if (!selectedTheatreId) {
      setTheatreFoods([]);
      return;
    }
    const fetchFoods = async () => {
      setFoodsLoading(true);
      try {
        const response = await foodService.getByTheatre(selectedTheatreId);
        setTheatreFoods(response.foods || []);
      } catch (err) {
        setTheatreFoods([]);
      } finally {
        setFoodsLoading(false);
      }
    };
    fetchFoods();
  }, [selectedTheatreId]);

  // Computed food order items
  const foodOrderItems = useMemo((): FoodOrderItem[] => {
    return Object.entries(foodOrder)
      .filter(([, qty]) => qty > 0)
      .map(([foodId, quantity]) => {
        const food = theatreFoods.find((f) => f.id === foodId);
        if (!food) return null;
        return { foodId, foodName: food.name, quantity, price: food.price };
      })
      .filter(Boolean) as FoodOrderItem[];
  }, [foodOrder, theatreFoods]);

  const foodOrderTotal = useMemo(() => {
    return foodOrderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [foodOrderItems]);

  const foodDeliveryFee = useMemo(() => {
    return foodOrderItems.length > 0 && foodDeliveryOption === "seat" ? 30 : 0;
  }, [foodOrderItems.length, foodDeliveryOption]);

  const updateFoodQty = (foodId: string, delta: number) => {
    setFoodOrder((prev) => {
      const current = prev[foodId] || 0;
      const next = Math.max(0, current + delta);
      return { ...prev, [foodId]: next };
    });
  };

  // Unique dates for selected theatre
  const dates = useMemo(() => {
    if (!selectedTheatreId) return [];
    const tShows = movieShows.filter((s) => s.theatreId === selectedTheatreId);
    return Array.from(new Set(tShows.map((s) => s.date))).sort();
  }, [movieShows, selectedTheatreId]);

  // Screenings timeslots
  const activeTimeslots = useMemo(() => {
    if (!selectedTheatreId || !selectedDate) return [];
    return movieShows.filter((s) => s.theatreId === selectedTheatreId && s.date === selectedDate);
  }, [movieShows, selectedTheatreId, selectedDate]);

  // Selected show object
  const activeShowObj = useMemo(() => {
    return shows.find((s) => s.id === selectedShowId);
  }, [shows, selectedShowId]);

  // Seat pricing details based on categories
  const calculateSeatPrice = (seatNum: string, basePrice: number) => {
    if (!activeShowObj) return basePrice;
    if (activeShowObj.vipSeats.includes(seatNum)) {
      return Math.round(basePrice * 1.50); // VIP surcharge +50%
    }
    if (activeShowObj.premiumSeats.includes(seatNum)) {
      return Math.round(basePrice * 1.25); // Premium surcharge +25%
    }
    return basePrice;
  };

  // Sum total charges
  const subTotal = useMemo(() => {
    if (!activeShowObj) return 0;
    return selectedSeats.reduce((sum, seat) => sum + calculateSeatPrice(seat, activeShowObj.ticketPrice), 0);
  }, [selectedSeats, activeShowObj]);

  const activeTheatre = useMemo(() => {
    return theatres.find((t) => t.id === activeShowObj?.theatreId);
  }, [theatres, activeShowObj]);

  const parkingTotalCost = useMemo(() => {
    if (!activeTheatre) return 0;
    let cost = 0;
    selectedParkingSeats.forEach(seat => {
      if (seat.startsWith("2W-")) cost += (activeTheatre.parkingTwoWheelerCost || 0);
      else if (seat.startsWith("4W-")) cost += (activeTheatre.parkingFourWheelerCost || 0);
    });
    return cost;
  }, [activeTheatre, selectedParkingSeats]);

  const generateParkingGrid = (prefix: string, rows: number, cols: number) => {
    const grid: string[][] = [];
    for (let r = 0; r < rows; r++) {
      const rowId = String.fromCharCode(65 + r);
      const rowSeats: string[] = [];
      for (let c = 1; c <= cols; c++) {
        rowSeats.push(`${prefix}${rowId}${c}`);
      }
      grid.push(rowSeats);
    }
    return grid;
  };

  const twoWheelerGrid = useMemo(() => {
    if (!activeTheatre) return [];
    return generateParkingGrid("2W-", activeTheatre.parkingTwoWheelerRows || 0, activeTheatre.parkingTwoWheelerCols || 0);
  }, [activeTheatre]);

  const fourWheelerGrid = useMemo(() => {
    if (!activeTheatre) return [];
    return generateParkingGrid("4W-", activeTheatre.parkingFourWheelerRows || 0, activeTheatre.parkingFourWheelerCols || 0);
  }, [activeTheatre]);

  const handleToggleParkingSeat = (seatId: string) => {
    if (activeShowObj?.bookedParkingSeats?.includes(seatId)) return;
    if (selectedParkingSeats.includes(seatId)) {
      setSelectedParkingSeats(prev => prev.filter(s => s !== seatId));
    } else {
      setSelectedParkingSeats(prev => [...prev, seatId]);
    }
  };

  const maxCoinsToUse = Math.min(currentUser?.rewardCoins || 0, subTotal * 5); // 5 coins = 1 rupuess
  const discountAmount = useCoins ? Math.floor(maxCoinsToUse / 5) : 0;
  const finalAmount = Math.max(0, subTotal - discountAmount);
  const coinsEarned = selectedSeats.length * 5;

  // Handle final checkout reservation logic
  const handleCheckoutSubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      alert("Please login before configuring seat reservations.");
      return;
    }
    if (!activeShowObj) return;

    setIsProcessingPayment(true);
    try {
      const bID = await onConfirmBooking({
        userId: currentUser.id,
        userName: currentUser.fullName,
        userEmail: currentUser.email,
        showId: activeShowObj.id,
        movieId: movie.id,
        movieTitle: movie.title,
        moviePoster: movie.posterUrl,
        theatreId: activeShowObj.theatreId,
        theatreName: activeShowObj.theatreName,
        screenNumber: activeShowObj.screenNumber,
        showDate: activeShowObj.date,
        showTime: activeShowObj.time,
        seatNumbers: selectedSeats,
        ticketCount: selectedSeats.length,
        ticketPrice: activeShowObj.ticketPrice,
        totalAmount: finalAmount + foodOrderTotal + foodDeliveryFee + parkingTotalCost,
        paymentStatus: "Success",
        paymentMethod,
        qrCodeUrl: "", // calculated dynamically on receipt
        foodOrderItems: foodOrderItems,
        foodDeliveryOption: foodDeliveryOption,
        foodDeliveryFee: foodDeliveryFee,
        parkingSeatNumbers: selectedParkingSeats,
        parkingTotalCost,
        isCancelled: false,
        coinsEarned,
        coinsUsed: useCoins ? maxCoinsToUse : 0,
        source: "online" as const,
      });

      setConfirmedBookingId(bID);
      setStep("success");
    } catch (err: any) {
      alert(err.message || "Something went wrong during seat transaction locking.");
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleJoinWaitingQueue = async (isGeneral = false) => {
    if (!currentUser) {
      alert("Please login to join the waiting queue.");
      onOpenAuth("user", false);
      return;
    }
    if (!activeShowObj) return;

    const seatsToWaitlist = isGeneral ? [] : selectedWaitlistSeats;

    try {
      await waitingQueueService.join({
        showId: activeShowObj.id,
        movieId: movie.id,
        movieTitle: movie.title,
        theatreId: activeShowObj.theatreId,
        theatreName: activeShowObj.theatreName,
        showTime: activeShowObj.time,
        seatsRequested: seatsToWaitlist,
      });

      const messageStr = isGeneral
        ? "Successfully joined the waiting queue for this show timing! You will receive an alert if any seats become available."
        : `Successfully joined the waiting queue for seats: ${seatsToWaitlist.join(", ")}! You will receive an alert if they become available.`;

      alert(messageStr);
      setSelectedWaitlistSeats([]);
      onClose();
    } catch (err: any) {
      alert(err.message || "Failed to join waiting queue.");
    }
  };

  // Convert any YouTube URL format to an embeddable URL
  const secureTrailerUrl = useMemo(() => {
    let url = movie.trailerUrl?.trim() || "";
    if (!url) return "";

    // Already an embed URL — return as-is
    if (url.includes("/embed/")) return url;

    let videoId = "";

    // Format: https://youtu.be/VIDEO_ID or https://youtu.be/VIDEO_ID?si=...
    const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
    if (shortMatch) {
      videoId = shortMatch[1];
    }

    // Format: https://www.youtube.com/watch?v=VIDEO_ID&...
    if (!videoId) {
      const watchMatch = url.match(/[?&]v=([a-zA-Z0-9_-]+)/);
      if (watchMatch) {
        videoId = watchMatch[1];
      }
    }

    // Format: https://www.youtube.com/shorts/VIDEO_ID
    if (!videoId) {
      const shortsMatch = url.match(/\/shorts\/([a-zA-Z0-9_-]+)/);
      if (shortsMatch) {
        videoId = shortsMatch[1];
      }
    }

    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}`;
    }

    // Fallback: return original URL (for non-YouTube sources)
    return url;
  }, [movie.trailerUrl]);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#050505] border border-white/10 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col shadow-2xl relative glass-card">
        {/* Close trigger button */}
        <button
          onClick={onClose}
          className="absolute right-6 top-6 p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-stone-400 hover:text-stone-100 transition-colors z-20 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* STEP 1: DETAILED VIEW WITH TIMINGS */}
        {step === "details" && (
          <div className="p-6 sm:p-10 flex flex-col gap-8 animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
              {/* Poster Banner */}
              <div className="col-span-1 md:col-span-4 max-w-[240px] mx-auto md:w-full">
                <img
                  src={movie.posterUrl}
                  alt={movie.title}
                  className="w-full aspect-[2/3] object-cover rounded-2xl shadow-xl border border-stone-800 bg-stone-950"
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* Text Description */}
              <div className="col-span-1 md:col-span-8 flex flex-col justify-between">
                <div>
                  <h2 className="text-3xl font-serif font-bold text-stone-100 tracking-tight leading-tight">
                    {movie.title}
                  </h2>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="text-[10px] font-mono uppercase bg-[#C5A059]/10 text-[#C5A059] border border-[#C5A059]/20 rounded-full px-3 py-1 font-bold">
                      {movie.genre}
                    </span>
                    <span className="text-[10px] font-mono uppercase bg-white/5 border border-white/10 text-stone-300 rounded-full px-3 py-1 font-bold">
                      {movie.language}
                    </span>
                    <span className="text-[10px] font-mono uppercase bg-white/5 border border-white/10 text-[#C5A059] rounded-full px-3 py-1 font-bold">
                      {movie.duration}
                    </span>
                  </div>
                  <p className="text-stone-400 text-sm leading-relaxed mt-4">
                    {movie.description}
                  </p>
                </div>

                {/* Embedded Trailer Player */}
                {secureTrailerUrl && (
                  <div className="mt-5 aspect-video w-full rounded-2xl overflow-hidden border border-stone-800 bg-stone-950">
                    <iframe
                      src={secureTrailerUrl}
                      title="Cinematic Trailer preview"
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                )}
              </div>
            </div>
            {/* TIMING SELECTOR BLOCK - STEP 1: THEATRE */}
            <div className="border-t border-white/5 pt-6 flex flex-col gap-6">
              <h3 className="text-lg font-serif font-bold text-stone-100 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#C5A059]" />
                Select Screening Venue
              </h3>

              {availableTheatres.length === 0 ? (
                <div className="p-4 bg-stone-950 border border-stone-850 rounded-xl text-center text-xs font-mono text-stone-500">
                  No shows available for this film. Login as admin to schedule screenings.
                </div>
              ) : (
                <div className="flex flex-wrap gap-3">
                  {availableTheatres.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        setSelectedTheatreId(t.id);
                        setSelectedDate("");
                        setSelectedShowId("");
                        setStep("date");
                      }}
                      className={`px-4 py-3 rounded-xl border text-sm font-semibold tracking-wide text-left transition-all flex items-center gap-2 cursor-pointer bg-stone-950 border-stone-850 hover:bg-stone-900 text-stone-300`}
                    >
                      <Building2 className="w-4 h-4 text-amber-500" />
                      <div>
                        <p>{t.name}</p>
                        <span className="text-[10px] text-stone-500 block font-normal">
                          {t.location}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 1.5: SELECT DATE & TIME */}
        {step === "date" && selectedTheatreId && (
          <div className="p-6 sm:p-10 flex flex-col gap-6 animate-fadeIn">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setStep("details")}
                className="p-2 bg-stone-950 hover:bg-stone-800 rounded-lg text-stone-400"
              >
                <ArrowBackFallback />
              </button>
              <div>
                <h3 className="text-xl font-bold text-stone-100 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-[#C5A059]" />
                  Choose Day & Screening Time
                </h3>
                <p className="text-xs text-stone-400 mt-0.5">
                  {availableTheatres.find(t => t.id === selectedTheatreId)?.name}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2 mt-2">
              <span className="text-xs text-stone-400 uppercase font-mono tracking-widest pl-1">
                Day Slot
              </span>
              <div className="flex flex-wrap gap-3">
                {dates.map((d) => (
                  <button
                    key={d}
                    onClick={() => {
                      setSelectedDate(d);
                      setSelectedShowId("");
                    }}
                    className={`px-6 py-4 text-sm font-mono font-bold rounded-xl border transition-all cursor-pointer ${selectedDate === d
                      ? "bg-amber-500/10 border-amber-500 text-amber-400 shadow-[0_0_15px_rgba(197,160,89,0.15)]"
                      : "bg-stone-950 border-stone-850 hover:bg-stone-900 text-stone-300"
                      }`}
                  >
                    {d.split('T')[0]}
                  </button>
                ))}
              </div>
            </div>

            {selectedDate && (
              <div className="flex flex-col gap-2 mt-4 animate-fadeIn border-t border-white/5 pt-6">
                <span className="text-xs text-stone-400 uppercase font-mono tracking-widest pl-1">
                  Screening Time
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {activeTimeslots.map((slot) => {
                    const seatsLeft = slot.totalSeats - slot.bookedSeats.length;
                    return (
                      <button
                        key={slot.id}
                        disabled={false}
                        onClick={() => setSelectedShowId(slot.id)}
                        className={`p-4 rounded-xl border text-left transition-all ${selectedShowId === slot.id
                            ? seatsLeft === 0
                              ? "bg-red-500/10 border-red-500 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.15)] cursor-pointer"
                              : "bg-amber-500/10 border-amber-500 text-amber-400 shadow-[0_0_15px_rgba(197,160,89,0.15)] cursor-pointer"
                            : seatsLeft === 0
                              ? "bg-stone-950 border-stone-850 hover:bg-stone-900 text-stone-500 cursor-pointer"
                              : "bg-stone-950 border-stone-850 hover:bg-stone-900 text-stone-300 cursor-pointer"
                          }`}
                      >
                        <div className="text-base font-bold font-mono tracking-wide">
                          {slot.time}
                        </div>
                        <span className="text-xs text-stone-500 block mt-1">
                          Screen {slot.screenNumber}
                        </span>
                        <span
                          className={`text-[10px] block font-semibold mt-1 ${seatsLeft === 0
                            ? "text-red-500 font-bold"
                            : seatsLeft < 10
                              ? "text-red-400 font-bold"
                              : "text-amber-500"
                            }`}
                        >
                          {seatsLeft === 0 ? "Housefull (Waitlist)" : `${seatsLeft} seats left`}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* CTA button to step 2 seats */}
            {selectedShowId && (
              <div className="flex justify-between items-center bg-black/60 p-5 border border-white/10 rounded-2xl mt-4 animate-fadeIn">
                <div className="text-xs text-stone-400 font-mono">
                  Base Rate:{" "}
                  <span className="text-[#C5A059] font-bold">
                    {formatCurrency(activeShowObj?.ticketPrice || 0)}
                  </span>{" "}
                  per booking
                </div>
                <button
                  onClick={() => {
                    setStep("seats");
                  }}
                  className="px-5 py-2.5 bg-gradient-to-r from-[#C5A059] to-[#F1D299] text-[#050505] font-bold text-xs uppercase tracking-wider rounded-lg transition-all cursor-pointer shadow-[0_0_15px_rgba(197,160,89,0.2)] hover:opacity-90"
                >
                  Proceed to Seats
                </button>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: VISUAL INTERACTIVE SEAT SELECTOR */}
        {step === "seats" && activeShowObj && (
          <div className="p-6 sm:p-10 flex flex-col gap-6 animate-fadeIn">
            {/* Header selection status */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setStep("date")}
                className="p-2 bg-stone-950 hover:bg-stone-800 rounded-lg text-stone-400"
              >
                <ArrowBackFallback />
              </button>
              <div>
                <h3 className="text-xl font-bold text-stone-100">Select Seating Assignments</h3>
                <p className="text-xs text-stone-400">
                  {activeShowObj.theatreName} • Screen {activeShowObj.screenNumber} •{" "}
                  {activeShowObj.date.split('T')[0]} at {activeShowObj.time}
                </p>
              </div>
            </div>

            {/* CURVED SCREEN ILLUSTRATION */}
            <div className="flex flex-col items-center gap-2 my-8 relative perspective-1000">
              {/* 3D curved screen effect */}
              <div className="w-4/5 h-12 bg-gradient-to-b from-white/10 to-transparent rounded-t-[100%] border-t-[3px] border-[#C5A059] shadow-[0_-15px_40px_rgba(197,160,89,0.25)] relative overflow-hidden" style={{ transform: "rotateX(40deg)" }}>
                <div className="absolute inset-0 bg-gradient-to-b from-[#C5A059]/20 to-transparent blur-md"></div>
              </div>
              <span className="text-[10px] text-[#C5A059] uppercase tracking-[0.4em] font-mono font-bold select-none mt-2 opacity-80">
                Cinema Screen Location
              </span>
            </div>

            {/* Structured Grid map with Aisles */}
            <div className="w-full overflow-x-auto flex justify-center py-8 bg-gradient-to-b from-stone-950/40 to-stone-950/10 rounded-[40px] p-8 border border-stone-850/50 shadow-inner">
              <div className="flex flex-col gap-4 min-w-max items-center">
                {(() => {
                  // Always derive grid dimensions directly from the actual seat IDs.
                  // This guarantees the grid matches the admin's layout even if
                  // maxRows / maxCols in the database are stale.
                  const maxRows = activeShowObj.seatNumbers.reduce(
                    (max: number, seat: string) => Math.max(max, seat.charCodeAt(0) - 64),
                    0
                  );
                  const maxCols = activeShowObj.seatNumbers.reduce(
                    (max: number, seat: string) => Math.max(max, parseInt(seat.slice(1)) || 0),
                    0
                  );

                  return Array.from({ length: maxRows }).map((_, rIndex) => {
                    const rowLetter = String.fromCharCode(65 + rIndex);
                    return (
                      <div key={rowLetter} className="flex items-center gap-1.5 sm:gap-2 w-full justify-center">
                        {/* Row Label Left */}
                        <div className="w-6 text-center text-[10px] font-bold text-stone-600 font-mono select-none mr-2">
                          {rowLetter}
                        </div>

                        <div className="flex gap-1.5 sm:gap-2">
                          {Array.from({ length: maxCols }).map((_, i) => {
                            const seat = `${rowLetter}${i + 1}`;
                            const exists = activeShowObj.seatNumbers.includes(seat);

                            if (!exists) {
                              return <div key={`gap-${seat}`} className="w-6 sm:w-8 flex-shrink-0"></div>;
                            }

                            const isBooked = activeShowObj.bookedSeats.includes(seat);
                            const isSecured = selectedSeats.includes(seat);
                            const isVIP = activeShowObj.vipSeats.includes(seat);
                            const isPREM = activeShowObj.premiumSeats.includes(seat);

                            const borderStyle = isVIP
                              ? "border-amber-500/50"
                              : isPREM
                                ? "border-cyan-500/30"
                                : "border-stone-800";

                            return (
                              <button
                                key={seat}
                                disabled={false}
                                onClick={() => {
                                  if (isBooked) {
                                    if (selectedWaitlistSeats.includes(seat)) {
                                      setSelectedWaitlistSeats(selectedWaitlistSeats.filter((s) => s !== seat));
                                    } else {
                                      setSelectedWaitlistSeats([...selectedWaitlistSeats, seat]);
                                      setSelectedSeats([]);
                                    }
                                  } else {
                                    if (isSecured) {
                                      setSelectedSeats(selectedSeats.filter((s) => s !== seat));
                                    } else {
                                      setSelectedSeats([...selectedSeats, seat]);
                                      setSelectedWaitlistSeats([]);
                                    }
                                  }
                                }}
                                className={`relative aspect-square w-6 sm:w-8 rounded-t-xl rounded-b-sm border-t-2 border-l border-r border-b text-[9px] sm:text-[10px] font-bold font-mono transition-all flex items-center justify-center cursor-pointer select-none group overflow-hidden ${borderStyle} ${isBooked
                                    ? selectedWaitlistSeats.includes(seat)
                                      ? "bg-amber-600/30 text-amber-400 border-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.3)] animate-pulse"
                                      : "bg-white/5 text-stone-700 hover:text-stone-400 border-stone-850 opacity-40 hover:opacity-75"
                                    : isSecured
                                      ? "bg-gradient-to-b from-[#F1D299] to-[#C5A059] text-[#050505] border-[#C5A059] shadow-[0_0_15px_rgba(197,160,89,0.4)] transform -translate-y-1"
                                      : isVIP
                                        ? "bg-stone-900 border-[#C5A059] text-white hover:bg-[#C5A059]/20 hover:-translate-y-0.5"
                                        : isPREM
                                          ? "bg-stone-900 border-[#C5A059]/40 text-[#F1D299] hover:bg-[#C5A059]/15 hover:-translate-y-0.5"
                                          : "bg-stone-950 text-stone-400 hover:bg-white/10 hover:-translate-y-0.5 hover:border-stone-600"
                                  }`}
                                title={`${seat} - ${isBooked ? "Booked (Waitlistable)" : isVIP ? "VIP (+50%)" : isPREM ? "Premium (+25%)" : "Standard Rate"}`}
                              >
                                <span className="z-10">{i + 1}</span>
                                {/* Little seat cushion graphic */}
                                <div className={`absolute bottom-0 w-full h-[3px] rounded-t-sm opacity-50 ${isSecured ? "bg-black/20" : selectedWaitlistSeats.includes(seat) ? "bg-amber-500/50" : "bg-white/10"}`}></div>
                              </button>
                            );
                          })}
                        </div>

                        {/* Row Label Right */}
                        <div className="w-6 text-center text-[10px] font-bold text-stone-600 font-mono select-none ml-2">
                          {rowLetter}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>

            {/* Color key mapping */}
            <div className="flex flex-wrap justify-between items-center gap-4 bg-stone-950/40 p-4 rounded-xl border border-stone-850/50 text-xs font-mono text-stone-400">
              <div className="flex flex-wrap gap-4">
                <span className="flex items-center gap-1.5 col">
                  <span className="w-3.5 h-3.5 rounded bg-amber-500 border border-amber-500 block" /> Selected
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded bg-[#92400e]/30 border border-amber-500 block animate-pulse" /> Waitlist
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded bg-stone-800/20 border border-stone-850 block" /> Booked
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded bg-stone-900 border border-amber-400 block" /> VIP [1.5x Code]
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded bg-stone-900 border border-cyan-400 block" /> Premium [1.25x Code]
                </span>
              </div>

              <div>
                {selectedWaitlistSeats.length > 0 ? (
                  <>
                    Waitlist:{" "}
                    <span className="text-amber-500 font-bold font-sans">
                      {selectedWaitlistSeats.join(", ")}
                    </span>
                  </>
                ) : (
                  <>
                    Selected:{" "}
                    <span className="text-amber-400 font-bold font-sans">
                      {selectedSeats.length > 0 ? selectedSeats.join(", ") : "None"}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* CTA checkout Proceed */}
            {selectedSeats.length > 0 && (
              <div className="flex justify-between items-center bg-black/60 p-5 border border-white/10 rounded-2xl mt-4 animate-fadeIn">
                <div className="flex flex-col">
                  <span className="text-stone-400 text-[10px] font-mono tracking-wider font-bold">TOTAL RESERVATION RATE</span>
                  <span className="text-xl font-bold text-[#F1D299] font-mono">
                    {formatCurrency(subTotal)}
                  </span>
                </div>
                <button
                  onClick={() => setStep("food")}
                  className="px-6 py-2.5 bg-gradient-to-r from-[#C5A059] to-[#F1D299] text-[#050505] font-bold text-xs uppercase tracking-wider rounded-lg transition-all cursor-pointer shadow-[0_0_15px_rgba(197,160,89,0.2)] hover:opacity-90 flex items-center gap-2"
                >
                  <UtensilsCrossed className="w-4 h-4" />
                  Add Food & Continue
                </button>
              </div>
            )}

            {/* CTA Join Waiting Queue */}
            {selectedWaitlistSeats.length > 0 && (
              <div className="flex justify-between items-center bg-black/60 p-5 border border-white/10 rounded-2xl mt-4 animate-fadeIn">
                <div className="flex flex-col">
                  <span className="text-stone-400 text-[10px] font-mono tracking-wider font-bold">WAITING QUEUE SELECTIONS</span>
                  <span className="text-xl font-bold text-amber-400 font-mono">
                    {selectedWaitlistSeats.length} Seats Selected
                  </span>
                </div>
                <button
                  onClick={() => handleJoinWaitingQueue(false)}
                  className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-[#050505] font-bold text-xs uppercase tracking-wider rounded-lg transition-all cursor-pointer shadow-[0_0_15px_rgba(245,158,11,0.2)] hover:opacity-90 flex items-center gap-2"
                >
                  <Users className="w-4 h-4" />
                  Join Waiting Queue
                </button>
              </div>
            )}

            {/* CTA General Join Waiting Queue */}
            {selectedSeats.length === 0 && selectedWaitlistSeats.length === 0 && (
              <div className="flex justify-between items-center bg-black/60 p-5 border border-white/10 rounded-2xl mt-4 animate-fadeIn">
                <div className="flex flex-col">
                  <span className="text-stone-400 text-[10px] font-mono tracking-wider font-bold">WAITING QUEUE</span>
                  <span className="text-[11px] text-stone-400">
                    Get notified immediately if any seats for this show are cancelled/released.
                  </span>
                </div>
                <button
                  onClick={() => handleJoinWaitingQueue(true)}
                  className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-[#050505] font-bold text-xs uppercase tracking-wider rounded-lg transition-all cursor-pointer shadow-[0_0_15px_rgba(245,158,11,0.2)] hover:opacity-90 flex items-center gap-2"
                >
                  <Users className="w-4 h-4" />
                  Join Waiting Queue
                </button>
              </div>
            )}
          </div>
        )}


        {/* STEP 3: FOOD ORDERING */}
        {step === "food" && activeShowObj && (
          <div className="p-6 sm:p-10 flex flex-col gap-6 animate-fadeIn">
            {/* Header */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setStep("seats")}
                className="p-2 bg-stone-950 hover:bg-stone-800 rounded-lg text-stone-400"
              >
                <ArrowBackFallback />
              </button>
              <div>
                <h3 className="text-xl font-bold text-stone-100 flex items-center gap-2">
                  <UtensilsCrossed className="w-5 h-5 text-[#C5A059]" />
                  Theatre Food & Beverages
                </h3>
                <p className="text-xs text-stone-400">
                  {activeShowObj.theatreName} • Seats: {selectedSeats.join(", ")}
                </p>
              </div>
            </div>

            {/* Delivery Option Toggle */}
            <div className="flex flex-col gap-3">
              <span className="text-[10px] text-stone-400 uppercase font-mono tracking-widest font-bold">
                Choose Delivery Method
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={() => setFoodDeliveryOption("seat")}
                  className={`flex items-center gap-4 p-4 rounded-2xl border text-left transition-all cursor-pointer ${foodDeliveryOption === "seat"
                      ? "bg-[#C5A059]/10 border-[#C5A059] shadow-[0_0_20px_rgba(197,160,89,0.12)]"
                      : "bg-stone-950 border-stone-800 hover:border-stone-700"
                    }`}
                >
                  <div className={`p-2.5 rounded-xl border ${foodDeliveryOption === "seat" ? "bg-[#C5A059]/20 border-[#C5A059]/30 text-[#F1D299]" : "bg-stone-900 border-stone-800 text-stone-500"}`}>
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <p className={`text-sm font-bold ${foodDeliveryOption === "seat" ? "text-[#F1D299]" : "text-stone-300"}`}>
                      Deliver to My Seat
                    </p>
                    <p className="text-[10px] text-stone-500 mt-0.5">
                      Staff will bring your order directly to seats {selectedSeats.join(", ")}
                    </p>
                  </div>
                  {foodDeliveryOption === "seat" && (
                    <CheckCircle2 className="w-5 h-5 text-[#C5A059] ml-auto shrink-0" />
                  )}
                </button>
                <button
                  onClick={() => setFoodDeliveryOption("counter")}
                  className={`flex items-center gap-4 p-4 rounded-2xl border text-left transition-all cursor-pointer ${foodDeliveryOption === "counter"
                      ? "bg-[#C5A059]/10 border-[#C5A059] shadow-[0_0_20px_rgba(197,160,89,0.12)]"
                      : "bg-stone-950 border-stone-800 hover:border-stone-700"
                    }`}
                >
                  <div className={`p-2.5 rounded-xl border ${foodDeliveryOption === "counter" ? "bg-[#C5A059]/20 border-[#C5A059]/30 text-[#F1D299]" : "bg-stone-900 border-stone-800 text-stone-500"}`}>
                    <Package className="w-5 h-5" />
                  </div>
                  <div>
                    <p className={`text-sm font-bold ${foodDeliveryOption === "counter" ? "text-[#F1D299]" : "text-stone-300"}`}>
                      Counter Pickup Only
                    </p>
                    <p className="text-[10px] text-stone-500 mt-0.5">
                      Pick up your order at the theatre food counter
                    </p>
                  </div>
                  {foodDeliveryOption === "counter" && (
                    <CheckCircle2 className="w-5 h-5 text-[#C5A059] ml-auto shrink-0" />
                  )}
                </button>
              </div>
            </div>

            {/* Food Catalog */}
            {foodsLoading ? (
              <div className="flex items-center justify-center py-12 gap-3 text-stone-500">
                <span className="w-5 h-5 border-2 border-[#C5A059] border-t-transparent rounded-full animate-spin" />
                <span className="text-sm font-mono">Loading theatre menu...</span>
              </div>
            ) : theatreFoods.length === 0 ? (
              <div className="text-center border border-dashed border-[#C5A059]/20 py-14 rounded-3xl text-stone-500 bg-white/2">
                <UtensilsCrossed className="w-8 h-8 mx-auto text-stone-600 mb-2" />
                <p className="text-sm">No food items available at this theatre.</p>
                <p className="text-xs text-stone-600 mt-1">You can still proceed to payment.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-8">
                {["Popcorn", "Snacks", "Beverages", "Desserts"].map((category) => {
                  const categoryItems = theatreFoods.filter((f) => f.category === category);
                  if (categoryItems.length === 0) return null;
                  return (
                    <div key={category} className="flex flex-col gap-4">
                      <h4 className="text-sm font-serif font-bold text-[#F1D299] border-l-2 border-[#C5A059] pl-3 uppercase tracking-widest">
                        {category}
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {categoryItems.map((food) => {
                          const qty = foodOrder[food.id] || 0;
                          return (
                            <div
                              key={food.id}
                              className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${qty > 0
                                  ? "bg-[#C5A059]/5 border-[#C5A059]/30"
                                  : "bg-stone-950 border-stone-800/80 hover:border-stone-700"
                                }`}
                            >
                              <img
                                src={food.imageUrl}
                                alt={food.name}
                                className="w-14 h-14 object-cover rounded-xl shrink-0 border border-white/5"
                                referrerPolicy="no-referrer"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-stone-200 text-sm truncate">{food.name}</p>
                                <p className="text-[#C5A059] font-mono font-bold text-sm">{formatCurrency(food.price)}</p>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <button
                                  onClick={() => updateFoodQty(food.id, -1)}
                                  disabled={qty === 0}
                                  className={`w-7 h-7 rounded-full border flex items-center justify-center transition-all cursor-pointer ${qty === 0
                                      ? "border-stone-800 text-stone-700 cursor-not-allowed"
                                      : "border-[#C5A059]/40 text-[#C5A059] hover:bg-[#C5A059]/10"
                                    }`}
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className={`w-5 text-center font-mono font-bold text-sm ${qty > 0 ? "text-[#F1D299]" : "text-stone-600"}`}>
                                  {qty}
                                </span>
                                <button
                                  onClick={() => updateFoodQty(food.id, 1)}
                                  className="w-7 h-7 rounded-full border border-[#C5A059]/40 text-[#C5A059] hover:bg-[#C5A059]/10 flex items-center justify-center transition-all cursor-pointer"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Order Summary + CTA */}
            <div className="bg-black/60 border border-white/10 rounded-2xl p-5 flex flex-col gap-4">
              {foodOrderItems.length > 0 ? (
                <>
                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] text-stone-400 font-mono uppercase tracking-widest font-bold">Your Food Order</span>
                    {foodOrderItems.map((item) => (
                      <div key={item.foodId} className="flex justify-between text-xs font-mono text-stone-300">
                        <span>{item.foodName} × {item.quantity}</span>
                        <span className="text-[#C5A059]">{formatCurrency(item.price * item.quantity)}</span>
                      </div>
                    ))}
                    {foodDeliveryFee > 0 && (
                      <div className="flex justify-between text-xs font-mono text-stone-400">
                        <span>Seat Delivery Fee</span>
                        <span className="text-[#C5A059]">{formatCurrency(foodDeliveryFee)}</span>
                      </div>
                    )}
                    <div className="border-t border-white/5 pt-2 mt-1 flex justify-between items-center">
                      <div className="flex items-center gap-2 text-xs font-mono text-stone-400">
                        {foodDeliveryOption === "seat" ? (
                          <><MapPin className="w-3.5 h-3.5 text-[#C5A059]" /> Deliver to Seat {selectedSeats.join(", ")}</>
                        ) : (
                          <><Package className="w-3.5 h-3.5 text-[#C5A059]" /> Counter Pickup</>
                        )}
                      </div>
                      <span className="font-bold text-[#F1D299] font-mono text-base">{formatCurrency(foodOrderTotal + foodDeliveryFee)}</span>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-stone-500 text-xs font-mono text-center py-2">No food items selected. You can skip or add items above.</p>
              )}
              <div className="flex gap-3 justify-between items-center">
                <button
                  onClick={() => { setFoodOrder({}); setStep("parking"); }}
                  className="px-4 py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 text-stone-400 hover:text-stone-200 font-bold text-xs uppercase tracking-wider rounded-lg transition-all cursor-pointer"
                >
                  Skip Food
                </button>
                <button
                  onClick={() => setStep("parking")}
                  className="px-6 py-2.5 bg-gradient-to-r from-[#C5A059] to-[#F1D299] text-[#050505] font-bold text-xs uppercase tracking-wider rounded-lg transition-all cursor-pointer shadow-[0_0_15px_rgba(197,160,89,0.2)] hover:opacity-90 flex items-center gap-2"
                >
                  <ShoppingCart className="w-4 h-4" />
                  Proceed to Payment
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3.5: PARKING SLOT SELECTION */}
        {step === "parking" && activeShowObj && activeTheatre && (
          <div className="p-6 sm:p-10 flex flex-col gap-6 animate-fadeIn">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setStep("food")}
                className="p-2 bg-stone-950 hover:bg-stone-800 rounded-lg text-stone-400 cursor-pointer"
              >
                <ArrowBackFallback />
              </button>
              <div>
                <h3 className="text-xl font-bold text-stone-100 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-[#C5A059]" />
                  Interactive Parking Layout
                </h3>
                <p className="text-xs text-stone-400">
                  {activeShowObj.theatreName}
                </p>
              </div>
            </div>

            <div className="flex flex-col xl:flex-row gap-8">
              {/* Layout Editor / Grids */}
              <div className="flex-1 flex flex-col gap-8 bg-stone-950/40 border border-stone-850 rounded-3xl p-6 overflow-x-auto">
                {/* 2-Wheeler Grid */}
                {twoWheelerGrid.length > 0 && (
                  <div className="flex flex-col gap-4 min-w-max">
                    <h4 className="text-sm font-bold text-stone-300 uppercase tracking-widest border-b border-stone-800 pb-2">
                      2-Wheeler Zone (₹{activeTheatre.parkingTwoWheelerCost})
                    </h4>
                    <div className="flex flex-col gap-2 items-center">
                      {twoWheelerGrid.map((row, rIdx) => (
                        <div key={rIdx} className="flex gap-2">
                          <div className="w-6 h-8 flex items-center justify-center text-[10px] font-bold text-stone-500 mr-2">
                            {String.fromCharCode(65 + rIdx)}
                          </div>
                          {row.map(seatId => {
                            const isBooked = activeShowObj.bookedParkingSeats?.includes(seatId);
                            const isSelected = selectedParkingSeats.includes(seatId);
                            return (
                              <button
                                key={seatId}
                                disabled={isBooked}
                                onClick={() => handleToggleParkingSeat(seatId)}
                                className={`w-8 h-8 rounded-lg border text-[10px] font-bold transition-all cursor-pointer ${
                                  isBooked ? "bg-stone-900 border-stone-800 text-stone-600 cursor-not-allowed" :
                                  isSelected ? "bg-amber-500 border-amber-400 text-black scale-110 shadow-[0_0_10px_rgba(245,158,11,0.5)]" :
                                  "bg-stone-900/50 border-stone-700 text-stone-400 hover:border-amber-500 hover:text-amber-500"
                                }`}
                                title={seatId}
                              >
                                {seatId.split('-')[1]}
                              </button>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 4-Wheeler Grid */}
                {fourWheelerGrid.length > 0 && (
                  <div className="flex flex-col gap-4 min-w-max">
                    <h4 className="text-sm font-bold text-stone-300 uppercase tracking-widest border-b border-stone-800 pb-2">
                      4-Wheeler Zone (₹{activeTheatre.parkingFourWheelerCost})
                    </h4>
                    <div className="flex flex-col gap-2 items-center">
                      {fourWheelerGrid.map((row, rIdx) => (
                        <div key={rIdx} className="flex gap-2">
                          <div className="w-6 h-8 flex items-center justify-center text-[10px] font-bold text-stone-500 mr-2">
                            {String.fromCharCode(65 + rIdx)}
                          </div>
                          {row.map(seatId => {
                            const isBooked = activeShowObj.bookedParkingSeats?.includes(seatId);
                            const isSelected = selectedParkingSeats.includes(seatId);
                            return (
                              <button
                                key={seatId}
                                disabled={isBooked}
                                onClick={() => handleToggleParkingSeat(seatId)}
                                className={`w-12 h-8 rounded-lg border text-[10px] font-bold transition-all cursor-pointer ${
                                  isBooked ? "bg-stone-900 border-stone-800 text-stone-600 cursor-not-allowed" :
                                  isSelected ? "bg-amber-500 border-amber-400 text-black scale-105 shadow-[0_0_10px_rgba(245,158,11,0.5)]" :
                                  "bg-stone-900/50 border-stone-700 text-stone-400 hover:border-amber-500 hover:text-amber-500"
                                }`}
                                title={seatId}
                              >
                                {seatId.split('-')[1]}
                              </button>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Summary & CTA */}
              <div className="w-full xl:w-80 shrink-0 flex flex-col gap-4">
                <div className="bg-[#C5A059]/10 border border-[#C5A059]/30 rounded-2xl p-5 flex flex-col gap-4">
                  <h4 className="text-sm font-bold text-[#F1D299] uppercase tracking-widest border-b border-[#C5A059]/30 pb-2">
                    Parking Summary
                  </h4>
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between text-xs text-stone-300 font-mono">
                      <span>2-Wheeler Slots:</span>
                      <span className="font-bold">{selectedParkingSeats.filter(s => s.startsWith("2W-")).length}</span>
                    </div>
                    <div className="flex justify-between text-xs text-stone-300 font-mono">
                      <span>4-Wheeler Slots:</span>
                      <span className="font-bold">{selectedParkingSeats.filter(s => s.startsWith("4W-")).length}</span>
                    </div>
                    <div className="flex justify-between text-base text-[#F1D299] font-mono font-bold mt-2 pt-2 border-t border-[#C5A059]/20">
                      <span>Total:</span>
                      <span>{formatCurrency(parkingTotalCost)}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-black/60 border border-white/10 rounded-2xl p-5 flex flex-col gap-3">
                  <button
                    onClick={() => { setSelectedParkingSeats([]); setStep("payment"); }}
                    className="w-full py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 text-stone-400 hover:text-stone-200 font-bold text-xs uppercase tracking-wider rounded-lg transition-all cursor-pointer"
                  >
                    Skip Parking
                  </button>
                  <button
                    onClick={() => setStep("payment")}
                    className="w-full py-2.5 bg-gradient-to-r from-[#C5A059] to-[#F1D299] text-[#050505] font-bold text-xs uppercase tracking-wider rounded-lg transition-all cursor-pointer shadow-[0_0_15px_rgba(197,160,89,0.2)] hover:opacity-90 flex justify-center items-center gap-2"
                  >
                    Proceed to Payment
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: MOCK PAYMENTS OVERLAY & CHECKOUT */}
        {step === "payment" && activeShowObj && (
          <div className="p-6 sm:p-10 flex flex-col gap-6 animate-fadeIn">
            <div className="flex items-center gap-4">
              <button
                disabled={isProcessingPayment}
                onClick={() => setStep("date")}
                className="p-2 bg-white/5 border border-white/10 hover:bg-white/10 rounded-full text-stone-400 cursor-pointer"
              >
                <ArrowBackFallback />
              </button>
              <div>
                <h3 className="text-xl font-serif font-bold text-stone-100">Secure Payment Gateway</h3>
                <p className="text-xs text-[#C5A059] font-mono uppercase tracking-wider font-bold">
                  Locking screen seats instantly
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
              {/* Payment selection modes */}
              <div className="col-span-1 md:col-span-5 flex flex-col gap-3">
                <span className="text-[10px] text-stone-400 font-mono uppercase tracking-wider pl-1 font-bold block">
                  Select Billing Mode
                </span>
                {[
                  { id: "UPI", label: "UPI Instant (Direct)", icon: Smartphone },
                  { id: "Credit Card", label: "Elite Credit Card", icon: CreditCard },
                  { id: "Debit Card", label: "Debit Card Premium", icon: CreditCard },
                  { id: "Net Banking", label: "Net Corporate Banking", icon: Landmark },
                ].map((channel) => {
                  const Icon = channel.icon;
                  return (
                    <button
                      key={channel.id}
                      type="button"
                      disabled={isProcessingPayment}
                      onClick={() => setPaymentMethod(channel.id as any)}
                      className={`flex items-center gap-3 p-4 rounded-xl border text-xs font-bold uppercase tracking-wider text-left transition-all cursor-pointer ${paymentMethod === channel.id
                        ? "bg-[#C5A059]/10 border-[#C5A059] text-[#F1D299]"
                        : "bg-[#0c0c0c] border-white/5 hover:border-white/10 text-stone-400 hover:text-stone-200"
                        }`}
                    >
                      <Icon className="w-4 h-4 text-[#C5A059] shrink-0" />
                      {channel.label}
                    </button>
                  );
                })}
              </div>

              {/* Dynamic Inputs Form */}
              <div className="col-span-1 md:col-span-7 bg-stone-950/40 border border-stone-850 rounded-2xl p-6">
                <form onSubmit={handleCheckoutSubmission} className="flex flex-col gap-4">
                  {/* UPI OPTION VISUAL CREDENTIALS OR QR */}
                  {paymentMethod === "UPI" && (
                    <div className="flex flex-col gap-4">
                      {bankingDetails ? (
                        <div className="p-4 bg-stone-900/60 border border-stone-800 rounded-2xl flex flex-col gap-3">
                          <span className="text-xs font-mono font-bold text-amber-500 uppercase block border-b border-stone-800 pb-1">
                            Admin UPI Direct Account:
                          </span>
                          <div className="text-xs font-mono text-stone-300 flex flex-col gap-1.5">
                            <p>Holder: {bankingDetails.accountHolderName}</p>
                            <p>Bank: {bankingDetails.bankName}</p>
                            <p className="text-amber-400 font-bold select-all">UPI Address: {bankingDetails.upiId}</p>
                          </div>

                          {bankingDetails.qrCodeUrl && (
                            <div className="mx-auto block mt-2 text-center">
                              <img
                                src={bankingDetails.qrCodeUrl}
                                alt="Admin UPI Account QR"
                                className="w-24 h-24 object-contain rounded p-1 bg-white mx-auto shadow"
                                referrerPolicy="no-referrer"
                              />
                              <span className="text-[10px] text-stone-500 font-mono mt-1 block">
                                Quick Scan Payment QR
                              </span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="p-3 bg-yellow-950/20 border border-yellow-500/10 rounded-xl text-[11px] text-yellow-500 font-mono">
                          Note: Admin bank details not saved. Enter any UPI ID to simulate checkout.
                        </div>
                      )}

                      <div className="flex flex-col gap-1.5 mt-2">
                        <label className="text-xs text-stone-300">Your UPI ID (e.g. payer@oksbi)</label>
                        <input
                          type="text"
                          required
                          value={upiSenderId}
                          onChange={(e) => setUpiSenderId(e.target.value)}
                          className="px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 text-sm outline-none"
                          placeholder="yourname@upi"
                        />
                      </div>
                    </div>
                  )}

                  {/* CARDS INPUT INTERFACES */}
                  {(paymentMethod === "Credit Card" || paymentMethod === "Debit Card") && (
                    <div className="flex flex-col gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs text-stone-300">Cardholder Name</label>
                        <input
                          type="text"
                          required
                          value={cardHolder}
                          onChange={(e) => setCardHolder(e.target.value)}
                          className="px-3 py-2 bg-stone-950 border border-stone-805 rounded-xl text-stone-100 text-sm outline-none focus:border-amber-500"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs text-stone-300">Debit card Number</label>
                        <input
                          type="text"
                          required
                          maxLength={19}
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value)}
                          className="px-3 py-2 bg-stone-950 border border-stone-805 rounded-xl text-stone-100 text-sm outline-none font-mono"
                          placeholder="xxxx-xxxx-xxxx-xxxx"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs text-stone-300">Expiry MM/YY</label>
                          <input
                            type="text"
                            required
                            maxLength={5}
                            value={cardExpiry}
                            onChange={(e) => setCardExpiry(e.target.value)}
                            className="px-3 py-2 bg-stone-950 border border-stone-805 rounded-xl text-stone-100 text-sm outline-none text-center font-mono"
                            placeholder="09/29"
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs text-stone-300">Security CVV</label>
                          <input
                            type="password"
                            required
                            maxLength={3}
                            value={cardCvv}
                            onChange={(e) => setCardCvv(e.target.value)}
                            className="px-3 py-2 bg-stone-950 border border-stone-805 rounded-xl text-stone-100 text-sm outline-none text-center font-mono"
                            placeholder="***"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* NET BANKING */}
                  {paymentMethod === "Net Banking" && (
                    <div className="flex flex-col gap-3">
                      {bankingDetails ? (
                        <div className="p-3 bg-stone-900 border border-stone-800 rounded-xl text-xs font-mono text-stone-300 flex flex-col gap-1">
                          <p>Target Bank: {bankingDetails.bankName}</p>
                          <p>Account Holder: {bankingDetails.accountHolderName}</p>
                          <p>Account Bank: {bankingDetails.accountNumber}</p>
                          <p>IFSC Code: {bankingDetails.ifscCode}</p>
                        </div>
                      ) : (
                        <div className="p-2.5 bg-yellow-950/20 border border-yellow-500/10 text-yellow-500 rounded-lg text-xs">
                          Note: Corporate account details not saved by administration.
                        </div>
                      )}
                      <span className="text-xs text-stone-400 italic block mt-1">
                        Paying directly online. Fill authentication details in standard portal.
                      </span>
                    </div>
                  )}

                  {/* Pricing HUD */}
                  <div className="border-t border-stone-800/80 pt-4 mt-2 text-xs font-mono flex flex-col gap-1.5">
                    <div className="flex justify-between text-stone-400">
                      <span>Viewer: {currentUser?.fullName}</span>
                      <span>{selectedSeats.length} ticket(s)</span>
                    </div>

                    {/* Coins Section */}
                    <div className="my-3 p-3 bg-[#C5A059]/10 border border-[#C5A059]/30 rounded-xl flex flex-col gap-2">
                      <div className="flex justify-between items-center">
                        <span className="text-stone-300">Available Reward Coins:</span>
                        <span className="text-[#C5A059] font-bold">{currentUser?.rewardCoins || 0}</span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-stone-400">
                        <span>You will earn:</span>
                        <span className="text-amber-500 font-bold">+{coinsEarned} Coins</span>
                      </div>

                      {currentUser?.rewardCoins > 0 && maxCoinsToUse > 0 && (
                        <div className="mt-2 pt-2 border-t border-[#C5A059]/20 flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="useCoins"
                            checked={useCoins}
                            onChange={(e) => setUseCoins(e.target.checked)}
                            className="w-4 h-4 accent-[#C5A059] rounded cursor-pointer bg-stone-900 border-stone-800"
                          />
                          <label htmlFor="useCoins" className="text-stone-300 cursor-pointer flex-1">
                            Use {maxCoinsToUse} coins for {formatCurrency(Math.floor(maxCoinsToUse / 5))} off
                          </label>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between text-stone-300 mt-2">
                      <span>Tickets Sub-total</span>
                      <span className="text-amber-400 font-bold">{formatCurrency(subTotal)}</span>
                    </div>

                    {useCoins && discountAmount > 0 && (
                      <div className="flex justify-between text-stone-400 pl-4 mt-0.5">
                        <span>Coins Discount</span>
                        <span className="text-amber-400 font-bold">-{formatCurrency(discountAmount)}</span>
                      </div>
                    )}

                    {foodOrderItems.length > 0 && (
                      <>
                        <div className="flex justify-between text-stone-300 mt-2">
                          <span className="flex items-center gap-1">
                            <UtensilsCrossed className="w-3 h-3 text-[#C5A059]" />
                            Food Order ({foodOrderItems.length} item{foodOrderItems.length > 1 ? 's' : ''})
                            {' '}• {foodDeliveryOption === 'seat' ? '🚶 To Seat' : '📦 Pickup'}
                          </span>
                          <span className="text-amber-400 font-bold">{formatCurrency(foodOrderTotal)}</span>
                        </div>
                        {foodDeliveryFee > 0 && (
                          <div className="flex justify-between text-stone-400 pl-4 mt-0.5">
                            <span>Seat Delivery Fee</span>
                            <span className="text-amber-400 font-bold">{formatCurrency(foodDeliveryFee)}</span>
                          </div>
                        )}
                      </>
                    )}

                    <div className="flex justify-between text-stone-200 font-sans text-sm font-bold border-t border-white/5 pt-2 mt-2">
                      <span>Grand Total</span>
                      <span className="text-amber-400 text-lg font-mono">
                        {formatCurrency(finalAmount + foodOrderTotal + foodDeliveryFee)}
                      </span>
                    </div>
                  </div>

                  {/* Trigger validation submit */}
                  <button
                    type="submit"
                    disabled={isProcessingPayment}
                    className="mt-2 w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-stone-950 font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2"
                  >
                    {isProcessingPayment ? (
                      <>
                        <span className="w-4 h-4 border-2 border-stone-950 border-t-transparent rounded-full animate-spin" />
                        Validating Transact Locking...
                      </>
                    ) : (
                      <>
                        <Shield className="w-4 h-4" />
                        Commit Safe Payment
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: SUCCESSFUL TRANSACT CONFIRMATION */}
        {step === "success" && (
          <div className="p-8 sm:p-12 text-center flex flex-col items-center justify-center gap-6 animate-fadeIn pb-14">
            <div className="p-3.5 bg-amber-500/10 rounded-full border border-amber-500/20 text-amber-500 animate-bounce">
              <CheckCircle2 className="w-12 h-12" />
            </div>

            <div>
              <h2 className="text-3xl font-sans font-extrabold tracking-tight bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 bg-clip-text text-transparent">
                Reservation Confirmed!
              </h2>
              <p className="text-stone-400 text-sm mt-1 max-w-sm mx-auto">
                Enjoy your movie night. Your booking tickets were generated and added to your Boarding History!
              </p>
            </div>

            {/* DETACHABLE COUPON BLOCK Represent */}
            <div className="bg-stone-950 border border-stone-850/80 p-5 rounded-3xl max-w-[340px] w-full flex flex-col gap-4 text-left shadow-xl">
              <div className="flex justify-between items-start border-b border-stone-800/60 pb-2">
                <span className="text-[10px] text-stone-500 font-mono">LTR REF ID:</span>
                <span className="text-xs font-mono font-bold text-amber-500 select-all">
                  {confirmedBookingId}
                </span>
              </div>

              <div>
                <h4 className="font-bold text-stone-100 text-base">{movie.title}</h4>
                <p className="text-xs text-stone-400 font-semibold mt-1 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-stone-500" />
                  {activeShowObj?.theatreName} (Sc {activeShowObj?.screenNumber})
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                <div>
                  <span className="text-stone-500 text-[10px] block">Show Date</span>
                  <span className="text-stone-300 font-bold">{activeShowObj?.date.split('T')[0]}</span>
                </div>
                <div>
                  <span className="text-stone-500 text-[10px] block">Show Time</span>
                  <span className="text-stone-300 font-bold">{activeShowObj?.time}</span>
                </div>
                <div>
                  <span className="text-stone-500 text-[10px] block">Reserved Seats</span>
                  <span className="text-amber-500 font-bold">{selectedSeats.join(", ")}</span>
                </div>
                <div>
                  <span className="text-stone-500 text-[10px] block font-mono">Payments Status</span>
                  <span className="text-amber-400 font-bold font-sans">Success</span>
                </div>
                <div className="col-span-2 pt-2 border-t border-stone-800/60 mt-1 flex justify-between">
                  <div>
                    <span className="text-stone-500 text-[10px] block">Booking Date</span>
                    <span className="text-stone-400 font-bold">{new Date().toLocaleDateString('en-CA')}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-stone-500 text-[10px] block">Booking Time</span>
                    <span className="text-stone-400 font-bold">{new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              </div>

              {/* Food Order Summary on Success */}
              {foodOrderItems.length > 0 && (
                <div className="border-t border-stone-800/50 pt-3 flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-[10px] font-mono text-stone-400 uppercase tracking-widest">
                    <UtensilsCrossed className="w-3 h-3 text-[#C5A059]" />
                    Food Order • {foodDeliveryOption === 'seat' ? 'Deliver to Seat' : 'Counter Pickup'}
                  </div>
                  {foodOrderItems.map((item) => (
                    <div key={item.foodId} className="flex justify-between text-[10px] font-mono text-stone-400">
                      <span>{item.foodName} × {item.quantity}</span>
                      <span className="text-[#C5A059]">{formatCurrency(item.price * item.quantity)}</span>
                    </div>
                  ))}
                  {foodDeliveryFee > 0 && (
                    <div className="flex justify-between text-[10px] font-mono text-stone-400">
                      <span>Seat Delivery Fee</span>
                      <span className="text-[#C5A059]">{formatCurrency(foodDeliveryFee)}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Dynamic QR Code */}
              <div className="mx-auto block mt-2 text-center">
                <div className="p-1.5 bg-white rounded-lg shadow-md mx-auto inline-block">
                  <QRCodeSVG
                    value={confirmedBookingId}
                    size={100}
                    bgColor="#ffffff"
                    fgColor="#000000"
                    level="H"
                    includeMargin={false}
                  />
                </div>
                <span className="text-[9px] text-stone-500 block font-mono mt-2 uppercase tracking-widest pl-1">
                  Check-in Boarding pass QR
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-stone-900 hover:bg-stone-850 text-stone-200 border border-stone-800 text-xs font-bold rounded-xl tracking-wider uppercase transition-colors cursor-pointer"
            >
              Done &amp; Close Panel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Minimal Arrow and Back Helpers
function ArrowBackFallback() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className="w-5 h-5"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
    </svg>
  );
}
