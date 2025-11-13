import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import Events from './pages/Events';
import EventDetails from './pages/EventDetails';
import Categories from './pages/Categories';
import Login from './pages/Login';
import Register from './pages/Register';
import CreateEvent from './pages/CreateEvent';
import About from './pages/About';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import ManageEvents from './pages/ManageEvents';
import ManageUsers from './pages/ManageUsers';
import PublicProfile from './pages/PublicProfile';
import PaymentPage from './pages/PaymentPage';
import BookingConfirmation from './pages/BookingConfirmation';
import EditProfile from './pages/Settings';
import './App.css';

function App() {
  // Move routing into a child component so it can access Auth context (user updates after login)
  const AppRoutes = () => {
    const { user } = useAuth();

    return (
      <Router>
        <div className="App">
          {/* Hide Header on admin pages */}
          {(() => {
            try {
              const path = window.location.pathname || '';
              if (!path.startsWith('/admin')) return <Header />;
              return null;
            } catch (e) {
              return <Header />;
            }
          })()}
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/events" element={<Events />} />
            <Route path="/events/:id" element={<EventDetails />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/create-event" element={<CreateEvent />} />
            <Route path="/about" element={<About />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/edit-profile" element={<EditProfile />} />
            <Route path="/profile/:id" element={<PublicProfile />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/payment" element={<PaymentPage />} />
            <Route path="/booking-confirmation" element={<BookingConfirmation />} />

            {/* ADMIN ROUTES - rendered when auth user has role 'admin' */}
            {user?.role === 'admin' && (
              <>
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/events" element={<ManageEvents />} />
                <Route path="/admin/users" element={<ManageUsers />} />
              </>
            )}
          </Routes>
        </div>
      </Router>
    );
  };

  return (
    <ThemeProvider>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
