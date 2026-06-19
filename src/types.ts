export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  mobileNumber: string;
  role: "user" | "admin";
  createdAt: string;
  rewardCoins?: number;
}

export interface Movie {
  id: string;
  title: string;
  posterUrl: string; // Base64 or URL
  description: string;
  language: string;
  genre: string;
  duration: string; // duration details, e.g. "142 mins"
  releaseDate: string;
  trailerUrl: string;
  createdAt: string;
  averageRating?: number;
  totalRatings?: number;
  totalReviews?: number;
  ratingDistribution?: Record<string, number>;
}

export interface Theatre {
  id: string;
  name: string;
  location: string;
  screens: number; // total screens available
  createdAt: string;
}

export interface Show {
  id: string;
  movieId: string;
  movieTitle: string;
  moviePoster: string;
  theatreId: string;
  theatreName: string;
  location: string;
  screenNumber: number;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  ticketPrice: number;
  isCancelled: boolean;
  totalSeats: number;
  seatNumbers: string[]; // List of all configured seats (e.g. A1, A2, etc.)
  vipSeats: string[]; // List of seat IDs categorized as VIP
  premiumSeats: string[]; // List of seat IDs categorized as Premium
  regularSeats: string[]; // List of seat IDs categorized as Regular
  bookedSeats: string[]; // Track booked seats in real time
  createdAt: string;
}

export interface Booking {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  showId: string;
  movieId: string;
  movieTitle: string;
  moviePoster: string;
  theatreId: string;
  theatreName: string;
  screenNumber: number;
  showDate: string; // YYYY-MM-DD
  showTime: string; // HH:MM
  seatNumbers: string[];
  ticketCount: number;
  ticketPrice: number;
  totalAmount: number;
  foodOrderItems?: FoodOrderItem[];
  foodDeliveryOption?: "seat" | "counter";
  foodDeliveryFee?: number;
  paymentStatus: "Pending" | "Success" | "Failed";
  paymentMethod: "UPI" | "Net Banking" | "Debit Card" | "Credit Card" | "Cash" | "Counter Card" | "Counter UPI";
  qrCodeUrl: string; // generated QR code representation
  isCancelled: boolean;
  bookingDate: string;
  coinsEarned?: number;
  coinsUsed?: number;
}

export interface BankingDetails {
  accountHolderName: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  upiId: string;
  qrCodeUrl: string; // Uploaded bar QR representing rapid UPI
  updatedAt: string;
}

export interface Food {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  category: string;
  theatreId?: string | null; // null/undefined means available at all theatres
  createdAt?: string;
}

export interface FoodOrderItem {
  foodId: string;
  foodName: string;
  quantity: number;
  price: number;
}

export interface LostFoundItem {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  theatreId: string;
  theatreName: string;
  type: 'Lost' | 'Found';
  itemName: string;
  description: string;
  location: string;
  date: string;
  time: string;
  imageUrl?: string;
  status: 'Pending' | 'Under Review' | 'Found' | 'Returned' | 'Closed';
  createdAt?: string;
  updatedAt?: string;
}

export interface Review {
  id: string;
  targetType: 'Movie' | 'Theatre';
  targetId: string;
  userId: string;
  userName: string;
  rating: number;
  comment?: string;
  createdAt: string;
}

export interface WaitingQueueEntry {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  showId: string;
  movieId: string;
  movieTitle: string;
  theatreId: string;
  theatreName: string;
  showTime: string;
  seatsRequested: string[];
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface WatchRoomParticipant {
  userId: string;
  userName: string;
  role: 'host' | 'participant';
  joinedAt: string;
}

export interface WatchRoomPollOption {
  id: string;
  text: string;
  votes: string[]; // array of userIds
}

export interface WatchRoomPoll {
  id: string;
  question: string;
  options: WatchRoomPollOption[];
  createdAt: string;
  isActive: boolean;
}

export interface WatchRoomRating {
  userId: string;
  rating: number;
}

export interface WatchRoom {
  roomId: string;
  hostId: string;
  participants: WatchRoomParticipant[];
  currentVideoUrl: string;
  currentVideoName?: string;
  currentTimestamp: number;
  isPlaying: boolean;
  polls: WatchRoomPoll[];
  ratings: WatchRoomRating[];
  createdAt: string;
  lastActivity: string;
}
