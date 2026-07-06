const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

let token = localStorage.getItem('token');

const setToken = (newToken: string | null) => {
  token = newToken;
  if (newToken) {
    localStorage.setItem('token', newToken);
  } else {
    localStorage.removeItem('token');
  }
};

const getToken = () => token;

const deepNormalizeStrings = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(deepNormalizeStrings);
  } else if (obj !== null && typeof obj === 'object') {
    // If it's a multilingual object, extract the 'en' string
    if ('en' in obj && typeof obj.en === 'string') {
      return obj.en;
    }
    const newObj: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        newObj[key] = deepNormalizeStrings(obj[key]);
      }
    }
    return newObj;
  }
  return obj;
};

const apiCall = async (endpoint: string, options: RequestInit = {}) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });
  } catch (err) {
    throw new Error(
      'Unable to connect to the backend API. Please ensure the server is running and reachable at ' +
      API_BASE_URL
    );
  }

  const rawData = await response.json();
  const data = deepNormalizeStrings(rawData);

  if (!response.ok) {
    throw new Error(data.error || 'API call failed');
  }

  return data;
};

// Auth
export const authService = {
  register: (fullName, email, mobileNumber, password, role = 'user') =>
    apiCall('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ fullName, email, mobileNumber, password, role }),
    }),

  login: (email, password) =>
    apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  getProfile: () => apiCall('/auth/profile'),
  getAllUsers: () => apiCall('/auth/users'),

  logout: () => {
    setToken(null);
  },

  setAuthToken: setToken,
  getAuthToken: getToken,
};

// Movies
export const movieService = {
  getAll: () => apiCall('/movies'),

  getById: (id) => apiCall(`/movies/${id}`),

  create: (movieData) =>
    apiCall('/movies', {
      method: 'POST',
      body: JSON.stringify(movieData),
    }),

  update: (id, movieData) =>
    apiCall(`/movies/${id}`, {
      method: 'PUT',
      body: JSON.stringify(movieData),
    }),

  delete: (id) =>
    apiCall(`/movies/${id}`, {
      method: 'DELETE',
    }),
};

// Theatres
export const theatreService = {
  getAll: () => apiCall('/theatres'),

  getById: (id) => apiCall(`/theatres/${id}`),

  create: (theatreData) =>
    apiCall('/theatres', {
      method: 'POST',
      body: JSON.stringify(theatreData),
    }),

  update: (id, theatreData) =>
    apiCall(`/theatres/${id}`, {
      method: 'PUT',
      body: JSON.stringify(theatreData),
    }),

  delete: (id) =>
    apiCall(`/theatres/${id}`, {
      method: 'DELETE',
    }),
};

// Shows
export const showService = {
  getAll: () => apiCall('/shows'),

  getById: (id) => apiCall(`/shows/${id}`),

  create: (showData) =>
    apiCall('/shows', {
      method: 'POST',
      body: JSON.stringify(showData),
    }),

  bookSeats: (id, seatNumbers) =>
    apiCall(`/shows/${id}/book-seats`, {
      method: 'POST',
      body: JSON.stringify({ seatNumbers }),
    }),

  releaseSeats: (id, seatNumbers) =>
    apiCall(`/shows/${id}/release-seats`, {
      method: 'POST',
      body: JSON.stringify({ seatNumbers }),
    }),

  update: (id, showData) =>
    apiCall(`/shows/${id}`, {
      method: 'PUT',
      body: JSON.stringify(showData),
    }),

  delete: (id) =>
    apiCall(`/shows/${id}`, {
      method: 'DELETE',
    }),
};

// Bookings
export const bookingService = {
  getAll: () => apiCall('/bookings'),

  getById: (id) => apiCall(`/bookings/${id}`),

  getUserBookings: () => apiCall('/bookings/my-bookings'),

  create: (bookingData) =>
    apiCall('/bookings', {
      method: 'POST',
      body: JSON.stringify(bookingData),
    }),

  update: (id, updateData) =>
    apiCall(`/bookings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    }),

  delete: (id) =>
    apiCall(`/bookings/${id}`, {
      method: 'DELETE',
    }),
};

// Food
export const foodService = {
  getAll: () => apiCall('/food'),

  getByTheatre: (theatreId: string) => apiCall(`/food/theatre/${theatreId}`),

  getById: (id) => apiCall(`/food/${id}`),

  create: (foodData) =>
    apiCall('/food', {
      method: 'POST',
      body: JSON.stringify(foodData),
    }),

  update: (id, foodData) =>
    apiCall(`/food/${id}`, {
      method: 'PUT',
      body: JSON.stringify(foodData),
    }),

  delete: (id) =>
    apiCall(`/food/${id}`, {
      method: 'DELETE',
    }),
};

// Lost & Found
export const lostFoundService = {
  getAll: () => apiCall('/lost-found'),

  getUserReports: (userId: string) => apiCall(`/lost-found/user/${userId}`),

  create: (reportData: any) =>
    apiCall('/lost-found', {
      method: 'POST',
      body: JSON.stringify(reportData),
    }),

  updateStatus: (id: string, status: string) =>
    apiCall(`/lost-found/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),
};

export const reviewService = {
  submitReview: (reviewData: { targetId: string; targetType: 'Movie' | 'Theatre' | 'Platform'; rating: number; comment?: string }) =>
    apiCall('/reviews', {
      method: 'POST',
      body: JSON.stringify(reviewData),
    }),
  deleteReview: (targetId: string) =>
    apiCall(`/reviews/${targetId}`, {
      method: 'DELETE',
    }),
  getAllTheatreReviews: () => apiCall('/reviews/theatres'),
  getAllPlatformReviews: () => apiCall('/reviews/platform'),
  getTargetReviews: (targetId: string) => apiCall(`/reviews/${targetId}`),
};

export const waitingQueueService = {
  join: (queueData: {
    showId: string;
    movieId: string;
    movieTitle: string;
    theatreId: string;
    theatreName: string;
    showTime: string;
    seatsRequested: string[];
  }) =>
    apiCall('/waiting-queue/join', {
      method: 'POST',
      body: JSON.stringify(queueData),
    }),

  leave: (entryId: string) =>
    apiCall(`/waiting-queue/${entryId}`, {
      method: 'DELETE',
    }),

  getMyQueue: () => apiCall('/waiting-queue/my-queue'),

  getAll: () => apiCall('/waiting-queue/all'),
};

export const watchRoomService = {
  createRoom: (hostId: string, hostName: string) =>
    apiCall('/watch-room/create', {
      method: 'POST',
      body: JSON.stringify({ hostId, hostName }),
    }),

  getRoom: (roomId: string) => apiCall(`/watch-room/${roomId}`),
};

export const trailerService = {
  uploadTrailer: async (formData: FormData) => {
    let headers: any = {};
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
    
    const response = await fetch(`${API_BASE_URL}/trailers/upload`, {
      method: 'POST',
      headers,
      body: formData,
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Upload failed');
    return data;
  },

  searchTrailers: (query: string) => apiCall(`/trailers/search?q=${encodeURIComponent(query)}`),
};

export const guideService = {
  askQuestion: (question: string, history?: any[], context?: any) =>
    apiCall('/guide/ask', {
      method: 'POST',
      body: JSON.stringify({ question, history, context }),
    }),
};
