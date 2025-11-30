import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { notificationsAPI } from '../services/api';
import { BellIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import Logout from './Logout';
import { 
  MoonIcon, 
  UserIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { SunIcon } from "@heroicons/react/24/solid";

const Header = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { theme, toggle } = useTheme();
  const [notifications, setNotifications] = useState([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  const baseNavigation = [
    { name: 'Home', href: '/' },
    { name: 'Events', href: '/events' },
    { name: 'Categories', href: '/categories' },
    { name: 'About', href: '/about' },
  ];

  // Add Create Event option only for organizers
  const navigation = user?.role === 'organizer' 
    ? [...baseNavigation.slice(0, 3), { name: 'Create Event', href: '/create-event' }, baseNavigation[3]]
    : baseNavigation;

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <img 
                src="/EventHub_Logo.png" 
                alt="EventHub Logo" 
                className="h-16 w-16 object-contain"
              />
              <span className="text-2xl font-bold">
                <span className="text-blue-600">Event</span>
                <span className="text-purple-600">Hub</span>
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`px-3 py-2 text-sm font-medium transition-colors ${
                  location.pathname === item.href || 
                  (item.href === '/' && location.pathname === '/dashboard')
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-700 hover:text-blue-600'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Right side icons and buttons */}
          <div className="flex items-center space-x-4">
            {/* Dark mode toggle */}
            <button className="p-2 text-gray-600 hover:text-gray-900 transition-colors" onClick={toggle} aria-label="Toggle theme">
              {theme === 'dark' ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
            </button>

            {/* Notifications */}
            {isAuthenticated && (
              <div className="relative">
                <button onClick={async () => {
                  setIsNotifOpen(!isNotifOpen);
                  if (!isNotifOpen) {
                    try {
                      const res = await notificationsAPI.getNotifications();
                      setNotifications(res.data.notifications || []);
                    } catch (e) {
                      console.error('Failed to load notifications', e);
                    }
                  }
                }} className="p-2 text-gray-600 hover:text-gray-900 transition-colors">
                  <BellIcon className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] px-1 rounded-full">{unreadCount}</span>
                  )}
                </button>

                {isNotifOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white border rounded-lg shadow-lg z-50">
                    <div className="p-3">
                      <div className="font-semibold">Notifications</div>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {notifications.length === 0 && (
                        <div className="p-3 text-sm text-gray-600">No notifications</div>
                      )}
                      {notifications.map(n => (
                        <div key={n._id} className={`p-3 border-t ${n.read ? 'bg-white' : 'bg-gray-50'}`}>
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-medium text-sm">{n.title}</div>
                              <div className="text-xs text-gray-600">{n.message}</div>
                              <div className="text-xs text-gray-400 mt-1">{new Date(n.createdAt).toLocaleString()}</div>
                            </div>
                            <div className="ml-2 flex flex-col items-end">
                              {!n.read && (
                                <button onClick={async () => {
                                  try {
                                    await notificationsAPI.markAsRead(n._id);
                                    setNotifications(prev => prev.map(x => x._id === n._id ? { ...x, read: true } : x));
                                  } catch (e) {
                                    console.error('Mark read failed', e);
                                  }
                                }} className="text-xs text-blue-600">Mark read</button>
                              )}
                              <button onClick={() => {
                                // navigate to related resource if present
                                setIsNotifOpen(false);
                                if (n.data?.eventId) navigate(`/events/${n.data.eventId}`);
                              }} className="text-xs text-gray-600 mt-1">Open</button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* User menu */}
            {isAuthenticated ? (
              <div className="flex items-center space-x-3">
                <Link to="/profile" className="flex items-center space-x-2 hover:text-blue-600">
                  <UserIcon className="h-5 w-5 text-gray-600" />
                  <span className="text-sm text-gray-700">
                    {user?.firstName} {user?.lastName}
                  </span>
                </Link>
                <Logout showText={true} />
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to="/login"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  Get Started
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 text-gray-600 hover:text-gray-900"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <nav className="flex flex-col space-y-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;