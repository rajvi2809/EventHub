import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Cache storage
const cache = new Map();

// Cache helper functions
const getCacheKey = (config) => {
  return `${config.method}:${config.url}:${JSON.stringify(config.params || {})}`;
};

const setCacheData = (key, data, ttl = 5 * 60 * 1000) => { // 5 minutes TTL by default
  cache.set(key, {
    data,
    timestamp: Date.now(),
    ttl
  });
};

const getCacheData = (key) => {
  const cached = cache.get(key);
  if (!cached) return null;
  
  if (Date.now() - cached.timestamp > cached.ttl) {
    cache.delete(key);
    return null;
  }
  
  return cached.data;
};

// Clear cache entries matching URL pattern
export const clearCacheByPattern = (urlPattern) => {
  for (const [key] of cache) {
    if (key.includes(urlPattern)) {
      cache.delete(key);
    }
  }
};

// Response interceptor to handle errors and caching
api.interceptors.response.use(
  (response) => {
    // Cache successful GET responses
    if (response.config.method === 'get') {
      const cacheKey = getCacheKey(response.config);
      setCacheData(cacheKey, response.data);
    }
    return response;
  },
  async (error) => {
    const url = error.config?.url || '';
    const isAuthEndpoint = url.startsWith('/auth');
    
    // Handle 401 errors
    if (error.response?.status === 401) {
      // For auth endpoints, clear token and redirect
      if (isAuthEndpoint) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (window.location.pathname !== '/login') {
          window.location.replace('/login');
        }
      } else {
        // For non-auth endpoints, try to serve cached data if available
        if (error.config.method === 'get') {
          const cacheKey = getCacheKey(error.config);
          const cachedData = getCacheData(cacheKey);
          if (cachedData) {
            console.log('Serving cached data due to auth error');
            return Promise.resolve({ data: cachedData });
          }
        }
      }
    }
    
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  updateProfile: (userData) => api.put('/auth/profile', userData),
  changePassword: (passwordData) => api.put('/auth/change-password', passwordData),
  verifyOTP: (otpData) => api.post('/auth/verify-otp', otpData),
  resendOTP: (email) => api.post('/auth/resend-otp', { email }),
};

// Events API
export const eventsAPI = {
  // alias for compatibility with admin pages
  getAll: (params = {}) => api.get('/events', { params }),
  getEvents: (params = {}) => api.get('/events', { params }),
  getEvent: (id) => api.get(`/events/${id}`),
  getCategories: () => api.get('/events/categories'),
  searchEvents: (params) => api.get('/events/search', { params }),
  createEvent: (eventData) => {
    const response = api.post('/events', eventData);
    clearCacheByPattern('/events');
    try { localStorage.removeItem('eventsList'); } catch (e) {}
    try { localStorage.removeItem('event'); } catch (e) {}
    return response;
  },
  updateEvent: (id, eventData) => {
    const response = api.put(`/events/${id}`, eventData);
    clearCacheByPattern('/events');
    try { localStorage.removeItem('eventsList'); } catch (e) {}
    try { localStorage.removeItem('event'); } catch (e) {}
    return response;
  },
  deleteEvent: (id) => {
    const response = api.delete(`/events/${id}`);
    clearCacheByPattern('/events');
    try { localStorage.removeItem('eventsList'); } catch (e) {}
    try { localStorage.removeItem('event'); } catch (e) {}
    return response;
  },
  getOrganizerEvents: (params = {}) => api.get('/events/organizer/my-events', { params }),
  getEventAnalytics: (id) => api.get(`/events/${id}/analytics`),
};

// Bookings API
export const bookingsAPI = {
  createBooking: (bookingData) => {
    const response = api.post('/bookings', bookingData);
    clearCacheByPattern('/events');
    // Also clear UI cache stored in localStorage so attendees counts refresh in lists
    try { localStorage.removeItem('eventsList'); } catch (e) {}
    try { localStorage.removeItem('event'); } catch (e) {}
    return response;
  },
  getUserBookings: () => api.get('/bookings'),
  getBooking: (id) => api.get(`/bookings/${id}`),
  cancelBooking: (id) => {
    const response = api.put(`/bookings/${id}/cancel`);
    clearCacheByPattern('/events');
    try { localStorage.removeItem('eventsList'); } catch (e) {}
    try { localStorage.removeItem('event'); } catch (e) {}
    return response;
  },
  requestCancellation: (id, data = {}) => {
    const response = api.post(`/bookings/${id}/request-cancel`, data);
    clearCacheByPattern('/events');
    try { localStorage.removeItem('eventsList'); } catch (e) {}
    try { localStorage.removeItem('event'); } catch (e) {}
    return response;
  },
  rejectCancellation: (id, data = {}) => {
    const response = api.put(`/bookings/${id}/reject-request`, data);
    clearCacheByPattern('/events');
    try { localStorage.removeItem('eventsList'); } catch (e) {}
    try { localStorage.removeItem('event'); } catch (e) {}
    return response;
  },
  getEventBookings: (eventId, params = {}) => api.get(`/bookings/event/${eventId}`, { params }),
};

// Reviews API
export const reviewsAPI = {
  createReview: (reviewData) => {
    const response = api.post('/reviews', reviewData);
    clearCacheByPattern('/events');
    try { localStorage.removeItem('eventsList'); } catch (e) {}
    try { localStorage.removeItem('event'); } catch (e) {}
    return response;
  },
  getEventReviews: (eventId, params = {}) => 
    api.get(`/reviews/event/${eventId}`, { params }),
  getUserReviews: (userId, params = {}) => 
    api.get(`/reviews/user/${userId}`, { params }),
  updateReview: (reviewId, reviewData) => {
    const response = api.put(`/reviews/${reviewId}`, reviewData);
    clearCacheByPattern('/events');
    try { localStorage.removeItem('eventsList'); } catch (e) {}
    try { localStorage.removeItem('event'); } catch (e) {}
    return response;
  },
  deleteReview: (reviewId) => {
    const response = api.delete(`/reviews/${reviewId}`);
    clearCacheByPattern('/events');
    try { localStorage.removeItem('eventsList'); } catch (e) {}
    try { localStorage.removeItem('event'); } catch (e) {}
    return response;
  },
  voteReview: (reviewId, voteData) =>
    api.post(`/reviews/${reviewId}/vote`, voteData),
  reportReview: (reviewId, reportData) =>
    api.post(`/reviews/${reviewId}/report`, reportData),
};


export default api;

// Users API (admin helpers)
export const usersAPI = {
  getAll: (params = {}) => api.get('/auth/users', { params }),
  getUser: (id) => api.get(`/auth/users/${id}`),
  updateUser: (id, data) => api.put(`/auth/users/${id}`, data),
  deleteUser: (id) => api.delete(`/auth/users/${id}`),
};

// Notifications API
export const notificationsAPI = {
  getNotifications: (params = {}) => api.get('/notifications', { params }),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
};
