import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { authAPI, notificationsAPI } from '../services/api';

const AuthContext = createContext();

const initialState = {
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: false,
  loading: true,
};

const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN_SUCCESS':
      localStorage.setItem('token', action.payload.token);
      localStorage.setItem('user', JSON.stringify(action.payload.user));
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        loading: false,
      };
    case 'LOGOUT':
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
      };
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload,
      };
    case 'UPDATE_USER':
      const updatedUser = { ...state.user, ...action.payload };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      return {
        ...state,
        user: updatedUser,
      };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('token');
      const user = localStorage.getItem('user');

      if (token && user) {
        try {
          const response = await authAPI.getMe();
          dispatch({
            type: 'LOGIN_SUCCESS',
            payload: {
              token,
              user: response.data.user,
            },
          });
          // After login, fetch notifications and alert user if there are booking cancellations
          try {
            const notifRes = await notificationsAPI.getNotifications();
            const notifs = notifRes.data.notifications || [];
            const unreadCancelled = notifs.filter(n => !n.read && n.type === 'booking_cancelled');
            for (const n of unreadCancelled) {
              try {
                // Show alert to the user about cancellation and refund timeframe
                window.alert(`${n.title}: ${n.message} Refund will be processed within 5-7 working days.`);
                // mark as read
                await notificationsAPI.markAsRead(n._id);
              } catch (e) {
                console.error('Notification alert/mark failed', e);
              }
            }
          } catch (e) {
            // ignore notification fetch errors
          }
        } catch (error) {
          dispatch({ type: 'LOGOUT' });
        }
      } else {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    initializeAuth();
  }, []);

  const login = async (credentials) => {
    try {
      const response = await authAPI.login(credentials);
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: response.data,
      });
      // Fetch notifications and alert user for booking cancellations
      try {
        const notifRes = await notificationsAPI.getNotifications();
        const notifs = notifRes.data.notifications || [];
        const unreadCancelled = notifs.filter(n => !n.read && n.type === 'booking_cancelled');
        for (const n of unreadCancelled) {
          try {
            window.alert(`${n.title}: ${n.message} Refund will be processed within 5-7 working days.`);
            await notificationsAPI.markAsRead(n._id);
          } catch (e) {
            console.error('Notification alert/mark failed', e);
          }
        }
      } catch (e) {
        // ignore
      }
      // Return the authenticated user so callers can act immediately (avoid localStorage race)
      return { success: true, user: response.data.user };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed',
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData);
      return { success: true, data: response.data };
    } catch (error) {
      // Log the full error to help diagnose network/timeouts/400s in deployed environment
      console.error('AuthContext.register full error:', error);

      // If normalized network error was thrown by the API layer, it may not have `response`
      const serverData = error?.response?.data || error?.data || null;
      const status = error?.response?.status || error?.status || null;
      const message =
        (serverData && serverData.message) ||
        error?.message ||
        'Registration failed';

      return {
        success: false,
        message,
        error: serverData,
        status,
        raw: error,
      };
    }
  };

  const verifyOTP = async (otpData) => {
    try {
      const response = await authAPI.verifyOTP(otpData);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'OTP verification failed',
      };
    }
  };

  const resendOTP = async (email) => {
    try {
      const response = await authAPI.resendOTP(email);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to resend OTP',
      };
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always clear local storage and state, even if API call fails
      dispatch({ type: 'LOGOUT' });
    }
  };

  const updateUser = (userData) => {
    dispatch({ type: 'UPDATE_USER', payload: userData });
  };

  const value = {
    ...state,
    login,
    register,
    verifyOTP,
    resendOTP,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};